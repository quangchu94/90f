import type {
  FootballMatch,
  MatchDetail,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  TeamSummary
} from '@/domain/models';
import { getLeagueBySlug } from '@/domain/leagues';
import { STATUS_LABELS } from '@/domain/status';
import type {
  EspnCompetitor,
  EspnEvent,
  EspnEventStatus,
  EspnMatchEvent,
  EspnScoreboardResponse,
  EspnSummaryResponse
} from './espnTypes';

export function mapScoreboardResponse(
  response: EspnScoreboardResponse,
  leagueSlug: string
): FootballMatch[] {
  const league = response.leagues?.[0] ?? getLeagueBySlug(leagueSlug);

  return (response.events ?? []).map((event) =>
    mapEventToFootballMatch(event, leagueSlug, league.name ?? getLeagueBySlug(leagueSlug).name)
  );
}

export function mapSummaryResponse(
  response: EspnSummaryResponse,
  leagueSlug: string,
  eventId: string
): MatchDetail {
  const competition = response.header?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const league = response.header?.league ?? getLeagueBySlug(leagueSlug);
  const eventStatus = response.header?.status ?? competition?.status;
  const status = normalizeStatus(eventStatus);
  const home = findCompetitor(competitors, 'home');
  const away = findCompetitor(competitors, 'away');
  const events = mapMatchEvents(response);

  return {
    id: response.header?.id ?? eventId,
    leagueSlug,
    leagueName: league.name ?? getLeagueBySlug(leagueSlug).name,
    kickoff: competition?.date ?? '',
    status,
    statusText: getStatusText(eventStatus, status),
    homeTeam: mapTeam(home, 'Đội nhà'),
    awayTeam: mapTeam(away, 'Đội khách'),
    homeScore: parseScore(home?.score),
    awayScore: parseScore(away?.score),
    venue: response.gameInfo?.venue?.fullName ?? competition?.venue?.fullName,
    attendance: response.gameInfo?.attendance ?? competition?.attendance,
    broadcasts: extractBroadcasts(response.broadcasts ?? competition?.broadcasts),
    notes: [],
    events,
    goals: events.filter((event) => event.type === 'goal'),
    redCards: events.filter((event) => event.type === 'red_card')
  };
}

function mapEventToFootballMatch(
  event: EspnEvent,
  leagueSlug: string,
  leagueName: string
): FootballMatch {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = findCompetitor(competitors, 'home');
  const away = findCompetitor(competitors, 'away');
  const status = normalizeStatus(event.status);

  return {
    id: event.id ?? event.uid ?? event.name ?? `${leagueSlug}-${event.date ?? 'unknown'}`,
    leagueSlug,
    leagueName,
    kickoff: event.date ?? '',
    status,
    statusText: getStatusText(event.status, status),
    homeTeam: mapTeam(home, 'Đội nhà'),
    awayTeam: mapTeam(away, 'Đội khách'),
    homeScore: parseScore(home?.score),
    awayScore: parseScore(away?.score),
    venue: competition?.venue?.fullName
  };
}

function findCompetitor(
  competitors: EspnCompetitor[],
  homeAway: 'home' | 'away'
): EspnCompetitor | undefined {
  return competitors.find((competitor) => competitor.homeAway === homeAway);
}

function mapTeam(competitor: EspnCompetitor | undefined, fallbackName: string): TeamSummary {
  const team = competitor?.team;
  const name = team?.displayName ?? team?.shortDisplayName ?? fallbackName;

  return {
    id: team?.id ?? competitor?.id ?? name,
    name,
    shortName: team?.shortDisplayName ?? name,
    abbreviation: team?.abbreviation,
    logoUrl: team?.logo ?? team?.logos?.[0]?.href
  };
}

export function normalizeStatus(status: EspnEventStatus | undefined): MatchStatus {
  const state = status?.type?.state?.toLowerCase();
  const name = status?.type?.name?.toLowerCase();
  const description = status?.type?.description?.toLowerCase();
  const id = status?.type?.id;

  if (status?.type?.completed || state === 'post') {
    return 'finished';
  }

  if (description?.includes('postponed') || name?.includes('postponed') || id === '6') {
    return 'postponed';
  }

  if (description?.includes('cancel') || name?.includes('cancel')) {
    return 'cancelled';
  }

  if (state === 'in') {
    return name?.includes('half') ? 'halftime' : 'in_progress';
  }

  if (state === 'pre') {
    return 'scheduled';
  }

  return 'unknown';
}

function getStatusText(status: EspnEventStatus | undefined, normalizedStatus: MatchStatus): string {
  return status?.type?.shortDetail ?? status?.type?.detail ?? STATUS_LABELS[normalizedStatus];
}

function parseScore(score: string | undefined): number | undefined {
  if (score === undefined || score === '') {
    return undefined;
  }

  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractBroadcasts(
  broadcasts: Array<{ names?: string[] }> | undefined
): string[] {
  return (broadcasts ?? []).flatMap((broadcast) => broadcast.names ?? []);
}

function mapMatchEvents(response: EspnSummaryResponse): MatchEvent[] {
  const keyEvents = response.keyEvents ?? [];
  const commentaryEvents = (response.commentary ?? [])
    .map((item) => item.play)
    .filter((play): play is EspnMatchEvent => Boolean(play));
  const sourceEvents = keyEvents.length ? keyEvents : commentaryEvents;
  const seenEventIds = new Set<string>();

  return sourceEvents.flatMap((event, index) => {
    const type = getMatchEventType(event);

    if (!type) {
      return [];
    }

    const id = event.id ?? `${type}-${index}`;
    if (seenEventIds.has(id)) {
      return [];
    }
    seenEventIds.add(id);

    return [mapMatchEvent(event, type, id)];
  });
}

function getMatchEventType(event: EspnMatchEvent): MatchEventType | undefined {
  const type = event.type?.type?.toLowerCase() ?? '';
  const text = `${event.type?.text ?? ''} ${event.text ?? ''} ${event.shortText ?? ''}`.toLowerCase();

  if (event.scoringPlay || type.includes('goal')) {
    return 'goal';
  }

  if (type === 'red-card' || type.includes('red-card') || text.includes('red card')) {
    return 'red_card';
  }

  return undefined;
}

function mapMatchEvent(event: EspnMatchEvent, type: MatchEventType, id: string): MatchEvent {
  const playerName =
    event.participants?.[0]?.athlete?.displayName ??
    event.shortText?.replace(/ goal.*$/i, '').replace(/ red card.*$/i, '') ??
    'Cầu thủ';

  return {
    id,
    type,
    teamId: event.team?.id,
    teamName: event.team?.displayName,
    playerName,
    minute: event.clock?.value,
    displayMinute: event.clock?.displayValue ?? '',
    text: event.text ?? event.shortText ?? playerName
  };
}
