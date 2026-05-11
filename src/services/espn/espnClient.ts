import {
  buildCoreTeamDetailUrl,
  buildMatchSummaryUrl,
  buildProxiedEspnRefUrl,
  buildScoreboardUrl,
  buildStandingsUrl,
  buildTeamDetailUrl,
  buildTeamFixtureScheduleUrl,
  buildTeamRosterUrl,
  buildTeamScheduleUrl,
  buildTeamsUrl
} from './espnEndpoints';
import { getLeagueBySlug, INITIAL_LEAGUES, isSupportedLeagueSlug } from '@/domain/leagues';
import type {
  EspnRosterResponse,
  EspnScoreboardResponse,
  EspnStandingsResponse,
  EspnSummaryResponse,
  EspnTeamDetailResponse,
  EspnVenueResponse,
  EspnTeamScheduleResponse,
  EspnTeamsResponse
} from './espnTypes';

const DEFAULT_TIMEOUT_MS = 10_000;

export class EspnError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError = false
  ) {
    super(message);
    this.name = 'EspnError';
  }
}

export interface EspnHttpClient {
  getJson<T>(url: string, signal?: AbortSignal): Promise<T>;
}

export class FetchEspnHttpClient implements EspnHttpClient {
  async getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(() => timeoutController.abort(), DEFAULT_TIMEOUT_MS);
    const abortFromParent = () => timeoutController.abort();
    signal?.addEventListener('abort', abortFromParent, { once: true });

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: timeoutController.signal
      });

      if (!response.ok) {
        throw new EspnError('ESPN request failed', response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof EspnError) {
        throw error;
      }

      throw new EspnError(
        'Không thể tải dữ liệu trận đấu. Vui lòng thử lại.',
        undefined,
        true
      );
    } finally {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromParent);
    }
  }
}

export const espnHttpClient: EspnHttpClient = new FetchEspnHttpClient();

export function isRetryableEspnError(error: unknown): boolean {
  if (!(error instanceof EspnError)) {
    return false;
  }

  return error.isNetworkError || error.status === undefined || error.status >= 500;
}

export async function fetchScoreboard(
  leagueSlug: string,
  dateParam: string,
  signal?: AbortSignal
): Promise<EspnScoreboardResponse> {
  return espnHttpClient.getJson<EspnScoreboardResponse>(
    buildScoreboardUrl(leagueSlug, dateParam),
    signal
  );
}

export async function fetchMatchSummary(
  leagueSlug: string,
  eventId: string,
  signal?: AbortSignal
): Promise<EspnSummaryResponse> {
  return espnHttpClient.getJson<EspnSummaryResponse>(
    buildMatchSummaryUrl(leagueSlug, eventId),
    signal
  );
}

export async function fetchStandings(
  leagueSlug: string,
  signal?: AbortSignal
): Promise<EspnStandingsResponse> {
  return espnHttpClient.getJson<EspnStandingsResponse>(buildStandingsUrl(leagueSlug), signal);
}

export async function fetchTeams(
  leagueSlug: string,
  signal?: AbortSignal
): Promise<EspnTeamsResponse> {
  return espnHttpClient.getJson<EspnTeamsResponse>(buildTeamsUrl(leagueSlug), signal);
}

export async function fetchTeamDetail(
  leagueSlug: string,
  teamId: string,
  signal?: AbortSignal
): Promise<EspnTeamDetailResponse> {
  try {
    const coreTeam = await espnHttpClient.getJson<EspnTeamDetailResponse>(
      buildCoreTeamDetailUrl(leagueSlug, teamId),
      signal
    );
    return withResolvedVenue(coreTeam, signal);
  } catch {
    return espnHttpClient.getJson<EspnTeamDetailResponse>(
      buildTeamDetailUrl(leagueSlug, teamId),
      signal
    );
  }
}

export async function fetchTeamRoster(
  leagueSlug: string,
  teamId: string,
  signal?: AbortSignal
): Promise<EspnRosterResponse> {
  return espnHttpClient.getJson<EspnRosterResponse>(
    buildTeamRosterUrl(leagueSlug, teamId),
    signal
  );
}

export async function fetchTeamSchedule(
  leagueSlug: string,
  teamId: string,
  signal?: AbortSignal
): Promise<EspnTeamScheduleResponse> {
  const leaguesToQuery = [
    ...INITIAL_LEAGUES.filter((league) => league.slug === leagueSlug),
    ...INITIAL_LEAGUES.filter((league) => league.slug !== leagueSlug)
  ];
  const leagueSchedules = leaguesToQuery.map((league) =>
    espnHttpClient
      .getJson<EspnTeamScheduleResponse>(buildTeamScheduleUrl(league.slug, teamId), signal)
      .then((response) => withScheduleSourceLeague(response, league.slug, league.name))
  );
  const scheduleRequests = [
    ...leagueSchedules,
    espnHttpClient.getJson<EspnTeamScheduleResponse>(buildTeamFixtureScheduleUrl(teamId), signal)
  ];
  const schedules = await Promise.allSettled(scheduleRequests);
  const fulfilledSchedules = schedules
    .filter((schedule): schedule is PromiseFulfilledResult<EspnTeamScheduleResponse> => schedule.status === 'fulfilled')
    .map((schedule) => schedule.value);

  if (!fulfilledSchedules.length) {
    const firstRejected = schedules.find(
      (schedule): schedule is PromiseRejectedResult => schedule.status === 'rejected'
    );
    throw firstRejected?.reason;
  }

  const events = enrichEventsWithConcreteLeagues(
    fulfilledSchedules.flatMap((schedule) => schedule.events ?? [])
  ).filter(hasConcreteLeague);

  return {
    leagues: uniqueLeaguesFromEvents(events),
    events
  };
}

function withScheduleSourceLeague(
  response: EspnTeamScheduleResponse,
  leagueSlug: string,
  leagueName: string
): EspnTeamScheduleResponse {
  const sourceLeague = { slug: leagueSlug, name: leagueName };

  return {
    ...response,
    leagues: [sourceLeague],
    events: response.events?.map((event) => ({
      ...event,
      leagues: [sourceLeague]
    }))
  };
}

function enrichEventsWithConcreteLeagues(events: NonNullable<EspnTeamScheduleResponse['events']>): NonNullable<EspnTeamScheduleResponse['events']> {
  const leagueByEventId = new Map<string, NonNullable<EspnTeamScheduleResponse['events']>[number]['leagues']>();

  for (const event of events) {
    if (event.id && hasConcreteLeague(event)) {
      leagueByEventId.set(event.id, event.leagues);
    }
  }

  return events.map((event) => {
    if (!event.id || hasConcreteLeague(event)) {
      return event;
    }

    const concreteLeagues = leagueByEventId.get(event.id);
    if (concreteLeagues) {
      return { ...event, leagues: concreteLeagues };
    }

    const inferredLeague = inferLeagueFromTeamScheduleEvent(event);
    return inferredLeague ? { ...event, leagues: [inferredLeague] } : event;
  });
}

function hasConcreteLeague(event: NonNullable<EspnTeamScheduleResponse['events']>[number]): boolean {
  return isSupportedLeagueSlug(event.leagues?.[0]?.slug);
}

function inferLeagueFromTeamScheduleEvent(
  event: NonNullable<EspnTeamScheduleResponse['events']>[number]
): { slug: string; name: string; abbreviation?: string } | undefined {
  const text = [
    event.season?.displayName,
    event.season?.name,
    event.seasonType?.displayName,
    event.seasonType?.name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const slug =
    inferLeagueSlugFromText(text);

  if (!slug) {
    return undefined;
  }

  const league = getLeagueBySlug(slug);
  return {
    slug: league.slug,
    name: league.name,
    abbreviation: league.shortName
  };
}

function inferLeagueSlugFromText(text: string): string | undefined {
  if (!text) {
    return undefined;
  }

  if (text.includes('uefa champions league')) {
    return 'uefa.champions';
  }

  if (text.includes('uefa europa league')) {
    return 'uefa.europa';
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

function uniqueLeaguesFromEvents(
  events: NonNullable<EspnTeamScheduleResponse['events']>
): Array<{ slug?: string; name?: string; abbreviation?: string }> {
  const leagues = new Map<string, { slug?: string; name?: string; abbreviation?: string }>();

  for (const event of events) {
    const league = event.leagues?.[0];
    if (league?.slug && !leagues.has(league.slug)) {
      leagues.set(league.slug, league);
    }
  }

  return [...leagues.values()];
}

async function withResolvedVenue(
  team: EspnTeamDetailResponse,
  signal?: AbortSignal
): Promise<EspnTeamDetailResponse> {
  const venueRef = team.team?.venue?.$ref ?? team.venue?.$ref;

  if (!venueRef || team.team?.venue?.fullName || team.venue?.fullName) {
    return team;
  }

  try {
    const venue = await espnHttpClient.getJson<EspnVenueResponse>(
      buildProxiedEspnRefUrl(venueRef),
      signal
    );
    const resolvedVenue = {
      ...(team.team?.venue ?? team.venue),
      fullName: venue.fullName ?? venue.displayName ?? venue.name
    };

    return team.team
      ? { ...team, team: { ...team.team, venue: resolvedVenue } }
      : { ...team, venue: resolvedVenue };
  } catch {
    return team;
  }
}
