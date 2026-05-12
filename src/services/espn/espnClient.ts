import {
  buildCoreTeamDetailUrl,
  buildLiveScoreboardUrl,
  buildMatchSummaryUrl,
  buildProxiedEspnRefUrl,
  buildScoreboardUrl,
  buildSoccerLeagueDetailUrl,
  buildSoccerLeaguesUrl,
  buildStandingsUrl,
  buildTeamDetailUrl,
  buildTeamFixtureScheduleUrl,
  buildTeamRosterUrl,
  buildTeamScheduleUrl,
  buildTeamsUrl
} from './espnEndpoints';
import {
  enrichLeagueMetadata,
  getLeagueBySlug,
  getTeamScheduleCandidateLeagues,
  INITIAL_LEAGUES,
  mergeLeagueSummaries
} from '@/domain/leagues';
import type { LeagueSummary } from '@/domain/models';
import type {
  EspnLeague,
  EspnLeagueCollectionResponse,
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
const TEAM_SCHEDULE_CONCURRENCY = 6;
const LEAGUE_DETAIL_CONCURRENCY = 6;

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

export async function fetchLiveScoreboard(
  dateParam: string,
  signal?: AbortSignal
): Promise<EspnScoreboardResponse> {
  return espnHttpClient.getJson<EspnScoreboardResponse>(buildLiveScoreboardUrl(dateParam), signal);
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

export async function fetchSoccerLeagues(signal?: AbortSignal): Promise<LeagueSummary[]> {
  const response = await espnHttpClient.getJson<EspnLeagueCollectionResponse>(
    buildSoccerLeaguesUrl(),
    signal
  );
  const rawLeagues = [...(response.items ?? []), ...(response.leagues ?? [])];
  const directLeagues = rawLeagues.map(mapEspnLeagueSummary).filter(isLeagueSummary);

  return mergeLeagueSummaries(directLeagues);
}

export async function fetchSoccerLeagueDetail(
  leagueSlug: string,
  signal?: AbortSignal
): Promise<LeagueSummary> {
  const response = await espnHttpClient.getJson<EspnLeague>(
    buildSoccerLeagueDetailUrl(leagueSlug),
    signal
  );
  const league = mapEspnLeagueSummary({ ...response, slug: response.slug ?? leagueSlug });

  if (!league) {
    throw new EspnError('ESPN league detail response is missing a slug');
  }

  return league;
}

export async function fetchSoccerLeagueDetailsForPicker(
  catalogLeagues: LeagueSummary[],
  signal?: AbortSignal
): Promise<LeagueSummary[]> {
  const detailResults = await allSettledWithConcurrency(
    catalogLeagues,
    LEAGUE_DETAIL_CONCURRENCY,
    (league) => fetchSoccerLeagueDetail(league.slug, signal)
  );

  return detailResults
    .filter((result): result is PromiseFulfilledResult<LeagueSummary> => result.status === 'fulfilled')
    .map((result) => result.value);
}

export async function fetchSoccerLeaguesForPicker(signal?: AbortSignal): Promise<LeagueSummary[]> {
  const catalogLeagues = await fetchSoccerLeagues(signal);
  const detailLeagues = await fetchSoccerLeagueDetailsForPicker(catalogLeagues, signal);

  return mergeLeagueSummaries([...catalogLeagues, ...detailLeagues]);
}

export async function fetchTeamDetail(
  leagueSlug: string,
  teamId: string,
  signal?: AbortSignal
): Promise<EspnTeamDetailResponse> {
  try {
    return await espnHttpClient.getJson<EspnTeamDetailResponse>(
      buildTeamDetailUrl(leagueSlug, teamId),
      signal
    );
  } catch {
    const coreTeam = await espnHttpClient.getJson<EspnTeamDetailResponse>(
      buildCoreTeamDetailUrl(leagueSlug, teamId),
      signal
    );
    return withResolvedVenue(coreTeam, signal);
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
  const catalogLeagues = await fetchSoccerLeagues(signal).catch(() => INITIAL_LEAGUES);
  const leaguesToQuery = getTeamScheduleCandidateLeagues(leagueSlug, catalogLeagues);
  const leagueSchedules = await allSettledWithConcurrency(leaguesToQuery, TEAM_SCHEDULE_CONCURRENCY, (league) =>
    fetchTeamScheduleLeague(league, teamId, signal)
  );
  const schedules = [
    ...leagueSchedules,
    await settle(() => fetchTeamFixtureSchedule(teamId, signal))
  ];
  const fulfilledSchedules = schedules
    .filter((schedule): schedule is PromiseFulfilledResult<EspnTeamScheduleResponse> => schedule.status === 'fulfilled')
    .map((schedule) => schedule.value);

  if (!fulfilledSchedules.length) {
    const firstRejected = schedules.find(
      (schedule): schedule is PromiseRejectedResult => schedule.status === 'rejected'
    );
    throw firstRejected?.reason;
  }

  return mergeTeamScheduleResponses(fulfilledSchedules, catalogLeagues);
}

export async function fetchTeamScheduleLeague(
  league: LeagueSummary,
  teamId: string,
  signal?: AbortSignal
): Promise<EspnTeamScheduleResponse> {
  const enrichedLeague = enrichLeagueMetadata(league);
  return espnHttpClient
    .getJson<EspnTeamScheduleResponse>(buildTeamScheduleUrl(enrichedLeague.slug, teamId), signal)
    .then((response) => withScheduleSourceLeague(response, enrichedLeague));
}

export async function fetchTeamFixtureSchedule(
  teamId: string,
  signal?: AbortSignal
): Promise<EspnTeamScheduleResponse> {
  return espnHttpClient.getJson<EspnTeamScheduleResponse>(buildTeamFixtureScheduleUrl(teamId), signal);
}

export function mergeTeamScheduleResponses(
  schedules: EspnTeamScheduleResponse[],
  catalogLeagues: LeagueSummary[]
): EspnTeamScheduleResponse {
  const events = dedupeScheduleEventsByLeagueConfidence(enrichEventsWithConcreteLeagues(
    schedules.flatMap((schedule) => schedule.events ?? []),
    catalogLeagues
  )).filter(isRenderableScheduleEvent);

  return {
    leagues: uniqueLeaguesFromEvents(events),
    events
  };
}

function withScheduleSourceLeague(
  response: EspnTeamScheduleResponse,
  league: LeagueSummary
): EspnTeamScheduleResponse {
  const sourceLeague = { slug: league.slug, name: league.name, abbreviation: league.shortName };

  return {
    ...response,
    leagues: [sourceLeague],
    events: response.events?.map((event) => ({
      ...event,
      sourceLeague
    }))
  };
}

function enrichEventsWithConcreteLeagues(
  events: NonNullable<EspnTeamScheduleResponse['events']>,
  catalogLeagues: LeagueSummary[]
): NonNullable<EspnTeamScheduleResponse['events']> {
  const leagueByEventId = new Map<string, NonNullable<EspnTeamScheduleResponse['events']>[number]['leagues']>();

  for (const event of events) {
    if (event.id && hasConcreteLeague(event)) {
      const existing = leagueByEventId.get(event.id);
      if (!existing || eventLeagueConfidence(event) > leagueArrayConfidence(existing)) {
        leagueByEventId.set(event.id, event.leagues);
      }
    }
  }

  return events.map((event) => {
    if (!event.id) {
      const resolvedLeague = resolveTeamScheduleEventLeague(event, catalogLeagues);
      return resolvedLeague && !hasConcreteLeague(event) ? { ...event, leagues: [resolvedLeague] } : event;
    }

    if (hasConcreteLeague(event)) {
      return event;
    }

    const concreteLeagues = leagueByEventId.get(event.id);
    if (concreteLeagues) {
      return { ...event, leagues: concreteLeagues };
    }

    const resolvedLeague = resolveTeamScheduleEventLeague(event, catalogLeagues);
    return resolvedLeague ? { ...event, leagues: [resolvedLeague] } : event;
  });
}

function hasConcreteLeague(event: NonNullable<EspnTeamScheduleResponse['events']>[number]): boolean {
  return Boolean(event.leagues?.[0]?.slug);
}

function isRenderableScheduleEvent(event: NonNullable<EspnTeamScheduleResponse['events']>[number]): boolean {
  const league = event.leagues?.[0] ?? event.league ?? event.sourceLeague;

  if (!league?.slug) {
    return false;
  }

  return !enrichLeagueMetadata({
    slug: league.slug,
    name: league.name ?? league.slug,
    shortName: league.abbreviation
  }).isExcludedFromTeamSchedule;
}

function resolveTeamScheduleEventLeague(
  event: NonNullable<EspnTeamScheduleResponse['events']>[number],
  catalogLeagues: LeagueSummary[]
): { slug: string; name: string; abbreviation?: string } | undefined {
  const eventLeague = event.leagues?.find((league) => league.slug) ?? (event.league?.slug ? event.league : undefined);
  if (eventLeague?.slug) {
    return normalizeScheduleLeague(eventLeague, catalogLeagues);
  }

  const linkLeagueSlug = parseLeagueSlugFromEventLinks(event);
  if (linkLeagueSlug) {
    return normalizeScheduleLeague({ slug: linkLeagueSlug }, catalogLeagues);
  }

  const text = [
    event.season?.displayName,
    event.season?.name,
    event.seasonType?.displayName,
    event.seasonType?.name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const slug = inferLeagueSlugFromText(text, catalogLeagues);

  if (slug) {
    return normalizeScheduleLeague({ slug }, catalogLeagues);
  }

  if (event.sourceLeague?.slug) {
    return normalizeScheduleLeague(event.sourceLeague, catalogLeagues);
  }

  return undefined;
}

function normalizeScheduleLeague(
  sourceLeague: { slug?: string; name?: string; displayName?: string; abbreviation?: string; shortName?: string },
  catalogLeagues: LeagueSummary[]
): { slug: string; name: string; abbreviation?: string } | undefined {
  const slug = sourceLeague.slug;
  if (!slug) {
    return undefined;
  }

  const league = catalogLeagues.find((item) => item.slug === slug) ?? getLeagueBySlug(slug);
  const enrichedLeague = enrichLeagueMetadata({
    slug: league.slug,
    name: sourceLeague.name ?? sourceLeague.displayName ?? league.name,
    shortName: sourceLeague.abbreviation ?? sourceLeague.shortName ?? league.shortName
  });

  return {
    slug: enrichedLeague.slug,
    name: enrichedLeague.name,
    abbreviation: enrichedLeague.shortName
  };
}

function parseLeagueSlugFromEventLinks(
  event: NonNullable<EspnTeamScheduleResponse['events']>[number]
): string | undefined {
  for (const link of event.links ?? []) {
    const href = link.href;
    if (!href) {
      continue;
    }

    const slug =
      href.match(/[?&]leagueAbbrev=([^&#]+)/)?.[1] ??
      href.match(/\/league\/([^/?#]+)/)?.[1] ??
      href.match(/\/leagues\/([^/?#]+)/)?.[1];

    if (slug) {
      return decodeURIComponent(slug);
    }
  }

  return undefined;
}

function dedupeScheduleEventsByLeagueConfidence(
  events: NonNullable<EspnTeamScheduleResponse['events']>
): NonNullable<EspnTeamScheduleResponse['events']> {
  const byId = new Map<string, NonNullable<EspnTeamScheduleResponse['events']>[number]>();
  const eventsWithoutId: NonNullable<EspnTeamScheduleResponse['events']> = [];

  for (const event of events) {
    if (!event.id) {
      eventsWithoutId.push(event);
      continue;
    }

    const existing = byId.get(event.id);
    if (!existing || eventLeagueConfidence(event) >= eventLeagueConfidence(existing)) {
      byId.set(event.id, event);
    }
  }

  return [...eventsWithoutId, ...byId.values()];
}

function eventLeagueConfidence(event: NonNullable<EspnTeamScheduleResponse['events']>[number]): number {
  if (event.leagues?.[0]?.slug && event.leagues[0].slug !== event.sourceLeague?.slug) {
    return 5;
  }

  if (event.league?.slug) {
    return 4;
  }

  if (parseLeagueSlugFromEventLinks(event)) {
    return 3;
  }

  if (event.season?.displayName || event.season?.name || event.seasonType?.displayName || event.seasonType?.name) {
    return 2;
  }

  if (event.sourceLeague?.slug) {
    return 1;
  }

  return 0;
}

function leagueArrayConfidence(leagues: NonNullable<EspnTeamScheduleResponse['events']>[number]['leagues']): number {
  return leagues?.[0]?.slug ? 5 : 0;
}

function inferLeagueSlugFromText(text: string, catalogLeagues: LeagueSummary[]): string | undefined {
  if (!text) {
    return undefined;
  }

  const staticSlug = inferStaticLeagueSlugFromText(text);
  if (staticSlug) {
    return staticSlug;
  }

  const normalizedText = normalizeLeagueText(text);
  const sortedLeagues = [...catalogLeagues].sort((left, right) => right.name.length - left.name.length);

  return sortedLeagues.find((league) => normalizedText.includes(normalizeLeagueText(league.name)))?.slug;
}

function inferStaticLeagueSlugFromText(text: string): string | undefined {
  if (!text) {
    return undefined;
  }

  if (text.includes('uefa champions league')) {
    return 'uefa.champions';
  }

  if (text.includes('uefa europa league')) {
    return 'uefa.europa';
  }

  if (text.includes('uefa conference league')) {
    return 'uefa.europa.conf';
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

function normalizeLeagueText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

function mapEspnLeagueSummary(league: EspnLeague): LeagueSummary | undefined {
  const slug = league.slug ?? parseLeagueSlugFromUrl(league.$ref);

  if (!slug) {
    return undefined;
  }

  return enrichLeagueMetadata({
    slug,
    name: league.name ?? league.displayName ?? slug,
    shortName: league.abbreviation ?? league.shortName
  });
}

function isLeagueSummary(value: LeagueSummary | undefined): value is LeagueSummary {
  return Boolean(value?.slug && value.name);
}

function parseLeagueSlugFromUrl(url: string | undefined): string | undefined {
  return url?.match(/\/leagues\/([^/?#]+)/)?.[1];
}

async function allSettledWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await settle(() => mapper(items[currentIndex]));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

async function settle<T>(task: () => Promise<T>): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await task() };
  } catch (reason) {
    return { status: 'rejected', reason };
  }
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
