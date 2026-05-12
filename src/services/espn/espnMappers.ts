import type {
  FootballMatch,
  MatchDetail,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  PlayerSummary,
  StandingGroup,
  StandingRow,
  TeamDetail,
  TeamScheduleMatch,
  TeamSummary
} from '@/domain/models';
import { getLeagueBySlug, getLeagueShortName } from '@/domain/leagues';
import { STATUS_LABELS } from '@/domain/status';
import { sortStandingRowsByRank } from '@/domain/standings';
import type {
  EspnCompetitor,
  EspnEvent,
  EspnEventStatus,
  EspnAthlete,
  EspnMatchEvent,
  EspnRosterGroup,
  EspnRosterResponse,
  EspnScoreboardResponse,
  EspnStandingEntry,
  EspnStandingStat,
  EspnStandingsResponse,
  EspnSummaryResponse,
  EspnTeam,
  EspnTeamDetailResponse,
  EspnTeamScheduleResponse,
  EspnTeamsResponse
} from './espnTypes';

export function mapScoreboardResponse(
  response: EspnScoreboardResponse,
  leagueSlug: string
): FootballMatch[] {
  const fallbackLeague = response.leagues?.length === 1 ? response.leagues[0] : getLeagueBySlug(leagueSlug);

  return (response.events ?? []).map((event) => {
    const eventLeague = resolveEventLeague(event, fallbackLeague, leagueSlug);

    return mapEventToFootballMatch(event, eventLeague.slug, eventLeague.name, eventLeague.shortName);
  });
}

export function mapSummaryResponse(
  response: EspnSummaryResponse,
  leagueSlug: string,
  eventId: string
): MatchDetail {
  const competition = response.header?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const canonicalLeagueSlug = response.header?.league?.slug ?? leagueSlug;
  const league = response.header?.league ?? getLeagueBySlug(canonicalLeagueSlug);
  const fallbackLeague = getLeagueBySlug(canonicalLeagueSlug);
  const leagueAbbreviation = getLeagueAbbreviation(league);
  const leagueShortNameHint =
    leagueAbbreviation && leagueAbbreviation !== league.name ? leagueAbbreviation : fallbackLeague.shortName;
  const eventStatus = response.header?.status ?? competition?.status;
  const home = findCompetitor(competitors, 'home');
  const away = findCompetitor(competitors, 'away');
  const homeScore = parseCompetitorScore(home);
  const awayScore = parseCompetitorScore(away);
  const status = normalizeStatus(eventStatus, homeScore !== undefined && awayScore !== undefined);
  const events = mapMatchEvents(response);
  const penaltyShootout = parsePenaltyShootout(home, away, [
    eventStatus?.type?.detail,
    eventStatus?.type?.shortDetail,
    response.header?.name,
    response.header?.shortName,
    ...(competition?.notes ?? []).flatMap((note) => [note.headline, note.text])
  ]);

  return {
    id: response.header?.id ?? eventId,
    leagueSlug: canonicalLeagueSlug,
    leagueName: league.name ?? fallbackLeague.name,
    leagueShortName: getLeagueShortName(canonicalLeagueSlug, leagueShortNameHint, league.name),
    kickoff: competition?.date ?? '',
    status,
    statusText: getStatusText(eventStatus, status),
    homeTeam: mapTeam(home, 'Đội nhà'),
    awayTeam: mapTeam(away, 'Đội khách'),
    homeScore,
    awayScore,
    penaltyShootout,
    importanceLabel: getImportanceLabel([
      response.header?.name,
      response.header?.shortName,
      response.header?.season?.displayName,
      response.header?.season?.name,
      response.header?.seasonType?.displayName,
      response.header?.seasonType?.name,
      eventStatus?.type?.detail,
      eventStatus?.type?.shortDetail,
      ...(competition?.notes ?? []).flatMap((note) => [note.type, note.headline, note.text])
    ]),
    venue: response.gameInfo?.venue?.fullName ?? competition?.venue?.fullName,
    attendance: response.gameInfo?.attendance ?? competition?.attendance,
    broadcasts: extractBroadcasts(response.broadcasts ?? competition?.broadcasts),
    notes: [],
    events,
    goals: events.filter((event) => event.type === 'goal'),
    redCards: events.filter((event) => event.type === 'red_card')
  };
}

export function mapStandingsResponse(response: EspnStandingsResponse): StandingGroup[] {
  if (response.children?.length) {
    return response.children
      .map((child, index) => ({
        id: child.id ?? `group-${index}`,
        name: child.name ?? child.displayName ?? `Báº£ng ${index + 1}`,
        rows: mapStandingEntries(child.standings?.entries ?? [])
      }))
      .filter((group) => group.rows.length > 0);
  }

  const rows = mapStandingEntries(response.standings?.entries ?? []);
  return rows.length ? [{ id: 'overall', name: 'Báº£ng xáº¿p háº¡ng', rows }] : [];
}

export function mapTeamsResponse(response: EspnTeamsResponse, leagueSlug: string): TeamDetail[] {
  const teams =
    response.sports?.flatMap((sport) =>
      sport.leagues?.flatMap((league) => league.teams?.map((item) => item.team).filter(isEspnTeam) ?? []) ?? []
    ) ??
    response.teams?.map((item) => item.team).filter(isEspnTeam) ??
    [];

  return teams.map((team) => mapTeamDetail(team, leagueSlug));
}

export function mapTeamDetailResponse(
  response: EspnTeamDetailResponse,
  leagueSlug: string,
  teamId: string
): TeamDetail {
  const team = response.team ?? { ...response, id: response.id ?? teamId };
  const mappedTeam = mapTeamDetail(team, leagueSlug);

  return {
    ...mappedTeam,
    venue: getTeamDetailVenue(response, mappedTeam.id) ?? mappedTeam.venue
  };
}

export function mapRosterResponse(response: EspnRosterResponse): PlayerSummary[] {
  return (response.athletes ?? []).flatMap((item) => {
    if (isRosterGroup(item)) {
      return (item.items ?? []).map((athlete) =>
        mapAthlete(athlete, item.position ?? item.name)
      );
    }

    return [mapAthlete(item)];
  });
}

export function mapTeamScheduleResponse(
  response: EspnTeamScheduleResponse,
  leagueSlug: string
): TeamScheduleMatch[] {
  return dedupeMatchesById(mapScoreboardResponse(response, leagueSlug));
}

function mapEventToFootballMatch(
  event: EspnEvent,
  leagueSlug: string,
  leagueName: string,
  leagueShortName: string
): FootballMatch {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = findCompetitor(competitors, 'home');
  const away = findCompetitor(competitors, 'away');
  const eventStatus = event.status ?? competition?.status;
  const homeScore = parseCompetitorScore(home);
  const awayScore = parseCompetitorScore(away);
  const status = normalizeStatus(eventStatus, homeScore !== undefined && awayScore !== undefined);
  const penaltyShootout = parsePenaltyShootout(home, away, [
    eventStatus?.type?.detail,
    eventStatus?.type?.shortDetail,
    event.name,
    event.shortName
  ]);

  return {
    id: event.id ?? event.uid ?? event.name ?? `${leagueSlug}-${event.date ?? 'unknown'}`,
    leagueSlug,
    leagueName,
    leagueShortName,
    kickoff: event.date ?? '',
    status,
    statusText: getStatusText(eventStatus, status),
    homeTeam: mapTeam(home, 'Đội nhà'),
    awayTeam: mapTeam(away, 'Đội khách'),
    homeScore,
    awayScore,
    penaltyShootout,
    importanceLabel: getImportanceLabel([
      event.name,
      event.shortName,
      event.seasonType?.displayName,
      event.seasonType?.name,
      eventStatus?.type?.detail,
      eventStatus?.type?.shortDetail,
      ...(event.notes ?? []).flatMap((note) => [note.type, note.headline, note.text]),
      ...(competition?.notes ?? []).flatMap((note) => [note.type, note.headline, note.text])
    ]),
    venue: competition?.venue?.fullName ?? competition?.venue?.displayName ?? competition?.venue?.name,
    neutralSite: competition?.neutralSite
  };
}

function resolveEventLeague(
  event: EspnEvent,
  fallbackLeague: { slug?: string; name?: string; displayName?: string; abbreviation?: string; shortName?: string },
  routeLeagueSlug: string
): { slug: string; name: string; shortName: string } {
  const eventLeague =
    event.leagues?.find((league) => league.slug) ??
    (event.league?.slug ? event.league : undefined) ??
    inferLeagueFromEventLinks(event) ??
    inferLeagueFromEventText(event) ??
    (event.sourceLeague?.slug ? event.sourceLeague : undefined) ??
    fallbackLeague;
  const slug = eventLeague.slug ?? routeLeagueSlug;
  const fallback = getLeagueBySlug(slug);
  const name = eventLeague.name ?? eventLeague.displayName ?? fallback.name;
  const abbreviation = getLeagueAbbreviation(eventLeague) ?? fallback.shortName;

  return {
    slug,
    name,
    shortName: getLeagueShortName(slug, abbreviation, name)
  };
}

function inferLeagueFromEventLinks(event: EspnEvent): EspnEvent['league'] | undefined {
  const hrefs = event.links?.map((link) => link.href).filter((href): href is string => Boolean(href)) ?? [];

  for (const href of hrefs) {
    const slug =
      href.match(/[?&]leagueAbbrev=([^&#]+)/)?.[1] ??
      href.match(/\/league\/([^/?#]+)/)?.[1] ??
      href.match(/\/leagues\/([^/?#]+)/)?.[1];

    if (slug) {
      const decodedSlug = decodeURIComponent(slug);
      const league = getLeagueBySlug(decodedSlug);
      return { slug: league.slug, name: league.name, abbreviation: league.shortName };
    }
  }

  return undefined;
}

function inferLeagueFromEventText(event: EspnEvent): EspnEvent['league'] | undefined {
  const text = [
    event.season?.displayName,
    event.season?.name,
    event.seasonType?.displayName,
    event.seasonType?.name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const slug = inferStaticLeagueSlugFromText(text);

  if (!slug) {
    return undefined;
  }

  const league = getLeagueBySlug(slug);
  return { slug: league.slug, name: league.name, abbreviation: league.shortName };
}

function inferStaticLeagueSlugFromText(text: string): string | undefined {
  if (!text) {
    return undefined;
  }

  if (text.includes('uefa conference league')) {
    return 'uefa.europa.conf';
  }

  if (text.includes('uefa champions league')) {
    return 'uefa.champions';
  }

  if (text.includes('uefa europa league')) {
    return 'uefa.europa';
  }

  if (text.includes('leagues cup')) {
    return 'concacaf.leagues.cup';
  }

  if (text.includes('premier league')) {
    return 'eng.1';
  }

  if (text.includes('spanish laliga') || text.includes('la liga') || text.includes('laliga')) {
    return 'esp.1';
  }

  if (text.includes('german bundesliga') || text.includes('bundesliga')) {
    return 'ger.1';
  }

  if (text.includes('italian serie a') || text.includes('serie a')) {
    return 'ita.1';
  }

  if (text.includes('french ligue 1') || text.includes('ligue 1')) {
    return 'fra.1';
  }

  if (text.includes('fifa world cup') || text.includes('world cup')) {
    return 'fifa.world';
  }

  return undefined;
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

function getLeagueAbbreviation(league: { abbreviation?: string } | { shortName?: string }): string | undefined {
  return 'abbreviation' in league ? league.abbreviation : undefined;
}

function mapTeamFromEspnTeam(team: EspnTeam | undefined, fallbackName: string): TeamSummary {
  const name = team?.displayName ?? team?.name ?? team?.shortDisplayName ?? fallbackName;

  return {
    id: team?.id ?? team?.uid ?? name,
    name,
    shortName: team?.shortDisplayName ?? team?.abbreviation ?? name,
    abbreviation: team?.abbreviation,
    logoUrl: team?.logo ?? team?.logos?.[0]?.href
  };
}

function mapTeamDetail(team: EspnTeam, leagueSlug: string): TeamDetail {
  return {
    ...mapTeamFromEspnTeam(team, 'Äá»™i bÃ³ng'),
    leagueSlug,
    location: team.location,
    venue: team.venue?.fullName ?? team.venue?.displayName ?? team.venue?.name,
    color: team.color
  };
}

function getTeamDetailVenue(response: EspnTeamDetailResponse, teamId: string): string | undefined {
  const explicitVenue = getVenueName(response.team?.venue) ?? getVenueName(response.venue);

  if (explicitVenue) {
    return explicitVenue;
  }

  return response.nextEvent
    ?.flatMap((event) => event.competitions ?? [])
    .find((competition) => {
      if (competition.neutralSite) {
        return false;
      }

      const homeCompetitor = competition.competitors?.find(
        (competitor) => competitor.homeAway === 'home'
      );
      return homeCompetitor?.team?.id === teamId || homeCompetitor?.id === teamId;
    })
    ?.venue?.fullName;
}

function getVenueName(
  venue: { fullName?: string; displayName?: string; name?: string } | undefined
): string | undefined {
  return venue?.fullName ?? venue?.displayName ?? venue?.name;
}

function mapStandingEntries(entries: EspnStandingEntry[]): StandingRow[] {
  const rows = entries.map((entry, index) => {
    const stats = entry.stats ?? [];

    return {
      id: entry.team?.id ?? entry.team?.uid ?? `standing-${index}`,
      rank: getStandingRank(stats),
      team: mapTeamFromEspnTeam(entry.team, 'Äá»™i bÃ³ng'),
      played: getStatNumber(stats, ['gamesplayed', 'played', 'games']),
      wins: getStatNumber(stats, ['wins']),
      draws: getStatNumber(stats, ['ties', 'draws']),
      losses: getStatNumber(stats, ['losses']),
      goalsFor: getStatNumber(stats, ['pointsfor', 'goalsfor']),
      goalsAgainst: getStatNumber(stats, ['pointsagainst', 'goalsagainst']),
      goalDifference: getStatNumber(stats, ['differential', 'goaldifference']),
      points: getStatNumber(stats, ['points']),
      form: getStatDisplay(stats, ['form'])
    };
  });

  return sortStandingRowsByRank(rows);
}

function getStandingRank(stats: EspnStandingStat[]): number | undefined {
  const stat = findStat(stats, ['rank', 'playoffseed']);

  if (!stat) {
    return undefined;
  }

  if (typeof stat.value === 'number' && Number.isFinite(stat.value)) {
    return stat.value;
  }

  const displayMatch = stat.displayValue?.match(/^-?\d+(?:\.\d+)?/);
  const parsed = Number(displayMatch?.[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getStatNumber(stats: EspnStandingStat[], names: string[]): number | undefined {
  const stat = findStat(stats, names);

  if (!stat) {
    return undefined;
  }

  if (typeof stat.value === 'number' && Number.isFinite(stat.value)) {
    return stat.value;
  }

  const parsed = Number(stat.displayValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getStatDisplay(stats: EspnStandingStat[], names: string[]): string | undefined {
  const stat = findStat(stats, names);
  return stat?.displayValue ?? stat?.summary;
}

function findStat(stats: EspnStandingStat[], names: string[]): EspnStandingStat | undefined {
  return stats.find((stat) => {
    const candidates = [stat.name, stat.type, stat.displayName, stat.shortDisplayName, stat.abbreviation]
      .filter((value): value is string => Boolean(value))
      .map(normalizeStatName);

    return names.some((name) => candidates.includes(normalizeStatName(name)));
  });
}

function normalizeStatName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isEspnTeam(team: EspnTeam | undefined): team is EspnTeam {
  return Boolean(team);
}

function isRosterGroup(item: EspnAthlete | EspnRosterGroup): item is EspnRosterGroup {
  return 'items' in item;
}

function mapAthlete(athlete: EspnAthlete, fallbackPosition?: string): PlayerSummary {
  const displayName =
    athlete.displayName ?? athlete.fullName ?? athlete.shortName ?? 'Cáº§u thá»§';

  return {
    id: athlete.id ?? athlete.uid ?? displayName,
    name: athlete.fullName ?? displayName,
    displayName,
    jersey: athlete.jersey,
    position:
      athlete.position?.displayName ??
      athlete.position?.name ??
      athlete.position?.abbreviation ??
      fallbackPosition,
    age: athlete.age,
    nationality: athlete.citizenship ?? athlete.birthPlace?.country,
    headshotUrl: athlete.headshot?.href ?? athlete.headshots?.[0]?.href ?? athlete.images?.[0]?.href
  };
}

export function normalizeStatus(status: EspnEventStatus | undefined, hasCompleteScore = false): MatchStatus {
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

  if (hasCompleteScore) {
    return 'finished';
  }

  return 'unknown';
}

function getStatusText(status: EspnEventStatus | undefined, normalizedStatus: MatchStatus): string {
  return status?.type?.shortDetail ?? status?.type?.detail ?? STATUS_LABELS[normalizedStatus];
}

function parseScore(score: EspnCompetitor['score'] | undefined): number | undefined {
  if (score === undefined || score === '') {
    return undefined;
  }

  if (typeof score === 'object') {
    if (typeof score.value === 'number' && Number.isFinite(score.value)) {
      return score.value;
    }

    const displayParsed = Number(score.displayValue);
    return Number.isFinite(displayParsed) ? displayParsed : undefined;
  }

  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCompetitorScore(competitor: EspnCompetitor | undefined): number | undefined {
  const scoreValue = competitor?.scoreValue;
  return parseScore(competitor?.score) ?? (typeof scoreValue === 'number' && Number.isFinite(scoreValue) ? scoreValue : undefined);
}

function parsePenaltyShootout(
  home: EspnCompetitor | undefined,
  away: EspnCompetitor | undefined,
  textCandidates: Array<string | undefined>
): FootballMatch['penaltyShootout'] {
  const homePenaltyScore = parseScore(home?.shootoutScore) ?? parseScore(home?.penaltyScore);
  const awayPenaltyScore = parseScore(away?.shootoutScore) ?? parseScore(away?.penaltyScore);

  if (homePenaltyScore !== undefined && awayPenaltyScore !== undefined) {
    return { home: homePenaltyScore, away: awayPenaltyScore };
  }

  const text = textCandidates.filter(Boolean).join(' ');
  const penaltyMatch =
    text.match(/(?:pen|pens|penalties)[^\d]*(\d+)\s*[-–]\s*(\d+)/i) ??
    text.match(/(\d+)\s*[-–]\s*(\d+)[^\d]*(?:pen|pens|penalties)/i);

  if (!penaltyMatch) {
    return undefined;
  }

  const parsedHome = Number(penaltyMatch[1]);
  const parsedAway = Number(penaltyMatch[2]);

  return Number.isFinite(parsedHome) && Number.isFinite(parsedAway)
    ? { home: parsedHome, away: parsedAway }
    : undefined;
}

function dedupeMatchesById(matches: FootballMatch[]): FootballMatch[] {
  const byId = new Map<string, FootballMatch>();

  for (const match of matches) {
    const existing = byId.get(match.id);
    byId.set(match.id, existing && matchCompletenessScore(existing) >= matchCompletenessScore(match) ? existing : match);
  }

  return Array.from(byId.values()).sort((left, right) => left.kickoff.localeCompare(right.kickoff));
}

function matchCompletenessScore(match: FootballMatch): number {
  return [
    match.leagueSlug,
    match.leagueName,
    match.leagueShortName,
    match.kickoff,
    match.status !== 'unknown' ? match.status : undefined,
    match.homeScore,
    match.awayScore,
    match.penaltyShootout?.home,
    match.penaltyShootout?.away,
    match.importanceLabel,
    match.homeTeam.logoUrl,
    match.awayTeam.logoUrl,
    match.venue
  ].filter((value) => value !== undefined && value !== '').length;
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
    goalQualifier: type === 'goal' ? getGoalQualifier(event) : undefined,
    teamId: event.team?.id,
    teamName: event.team?.displayName,
    playerName,
    minute: event.clock?.value,
    displayMinute: event.clock?.displayValue ?? '',
    text: event.text ?? event.shortText ?? playerName
  };
}

function getGoalQualifier(event: EspnMatchEvent): MatchEvent['goalQualifier'] {
  const text = normalizeText([
    event.type?.type,
    event.type?.text,
    event.text,
    event.shortText
  ]);

  if (/\b(free kick|freekick|free-kick)\b/.test(text)) {
    return 'free_kick';
  }

  if (/\b(penalty|pen)\b/.test(text)) {
    return 'penalty';
  }

  return undefined;
}

function getImportanceLabel(candidates: Array<string | undefined>): string | undefined {
  const text = normalizeText(candidates);

  if (/\b(quarter final|quarterfinal|quarter finals|quarterfinals)\b/.test(text) || text.includes('tứ kết')) {
    return 'Tứ kết';
  }

  if (/\b(semi final|semifinal|semi finals|semifinals)\b/.test(text) || text.includes('bán kết')) {
    return 'Bán kết';
  }

  if (/\bfinals?\b/.test(text) || text.includes('chung kết')) {
    return 'Chung kết';
  }

  return undefined;
}

function normalizeText(candidates: Array<string | undefined>): string {
  return candidates.filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ');
}
