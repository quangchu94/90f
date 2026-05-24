import type {
  FootballMatch,
  MatchLineupGroup,
  MatchLineupPlayer,
  MatchSubstitution,
  MatchDetail,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  PlayerMatchStatGroup,
  PlayerMatchStatRow,
  PlayerSeasonStats,
  PlayerSummary,
  StatSummary,
  StandingGroup,
  StandingRow,
  TeamDetail,
  TeamMatchStats,
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
  EspnGenericStat,
  EspnMatchEvent,
  EspnPlayerStatCategory,
  EspnPlayerStatsResponse,
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

const ESPN_SOCCER_LEAGUE_ID_SLUGS: Record<string, string> = {
  '700': 'eng.1'
};

export function mapScoreboardResponse(
  response: EspnScoreboardResponse,
  leagueSlug: string
): FootballMatch[] {
  const fallbackLeague = getScoreboardFallbackLeague(response, leagueSlug);

  return (response.events ?? []).map((event) => {
    const eventLeague = resolveEventLeague(event, fallbackLeague, leagueSlug);

    return mapEventToFootballMatch(event, eventLeague.slug, eventLeague.name, eventLeague.shortName);
  });
}

function getScoreboardFallbackLeague(
  response: EspnScoreboardResponse,
  leagueSlug: string
): { slug?: string; name?: string; displayName?: string; abbreviation?: string; shortName?: string } {
  const responseLeague = response.leagues?.length === 1 ? response.leagues[0] : undefined;

  if (responseLeague?.slug) {
    return responseLeague;
  }

  return leagueSlug === 'all' ? { slug: leagueSlug, name: leagueSlug } : getLeagueBySlug(leagueSlug);
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
    redCards: events.filter((event) => event.type === 'red_card'),
    teamStats: mapTeamMatchStats(response),
    playerStats: mapPlayerMatchStats(response),
    lineups: mapMatchLineups(response)
  };
}

export function mapPlayerSeasonStatsResponse(
  response: EspnPlayerStatsResponse,
  playerId: string
): PlayerSeasonStats {
  return {
    playerId,
    season: findSeasonLabel(response),
    groups: mapSeasonStatGroups(response)
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
    inferLeagueFromEventSeason(event) ??
    inferLeagueFromEventUid(event) ??
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

function inferLeagueFromEventSeason(event: EspnEvent): EspnEvent['league'] | undefined {
  const text = [
    event.season?.slug,
    event.season?.displayName,
    event.season?.name,
    event.seasonType?.displayName,
    event.seasonType?.name
  ]
    .filter(Boolean)
    .join(' ');
  const slug = inferStaticLeagueSlugFromText(text);

  if (!slug) {
    return undefined;
  }

  const league = getLeagueBySlug(slug);
  return { slug: league.slug, name: league.name, abbreviation: league.shortName };
}

function inferLeagueFromEventUid(event: EspnEvent): EspnEvent['league'] | undefined {
  const leagueId = event.uid?.match(/~l:(\d+)(?:~|$)/)?.[1];
  const slug = leagueId ? ESPN_SOCCER_LEAGUE_ID_SLUGS[leagueId] : undefined;

  if (!slug) {
    return undefined;
  }

  const league = getLeagueBySlug(slug);
  return { slug: league.slug, name: league.name, abbreviation: league.shortName };
}

function inferStaticLeagueSlugFromText(text: string): string | undefined {
  const normalizedText = normalizeText([text]);

  if (!normalizedText) {
    return undefined;
  }

  if (normalizedText.includes('uefa conference league')) {
    return 'uefa.europa.conf';
  }

  if (normalizedText.includes('uefa champions league')) {
    return 'uefa.champions';
  }

  if (normalizedText.includes('uefa europa league')) {
    return 'uefa.europa';
  }

  if (normalizedText.includes('leagues cup')) {
    return 'concacaf.leagues.cup';
  }

  if (normalizedText.includes('premier league')) {
    return 'eng.1';
  }

  if (normalizedText.includes('spanish laliga') || normalizedText.includes('la liga') || normalizedText.includes('laliga')) {
    return 'esp.1';
  }

  if (normalizedText.includes('german bundesliga') || normalizedText.includes('bundesliga')) {
    return 'ger.1';
  }

  if (normalizedText.includes('italian serie a') || normalizedText.includes('serie a')) {
    return 'ita.1';
  }

  if (normalizedText.includes('french ligue 1') || normalizedText.includes('ligue 1')) {
    return 'fra.1';
  }

  if (normalizedText.includes('fifa world cup') || normalizedText.includes('world cup')) {
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

function mapTeamMatchStats(response: EspnSummaryResponse): TeamMatchStats[] {
  return (response.boxscore?.teams ?? [])
    .map((entry, index) => ({
      team: mapTeamFromEspnTeam(entry.team, `Doi ${index + 1}`),
      stats: mapGenericStats(entry.statistics ?? [])
    }))
    .filter((entry) => entry.stats.length > 0);
}

function mapPlayerMatchStats(response: EspnSummaryResponse): PlayerMatchStatGroup[] {
  const boxscoreStats = (response.boxscore?.players ?? []).flatMap((teamEntry, teamIndex) => {
    const team = mapTeamFromEspnTeam(teamEntry.team, `Doi ${teamIndex + 1}`);

    return (teamEntry.statistics ?? []).flatMap((category) => {
      const labels = getPlayerCategoryLabels(category);
      const players = (category.athletes ?? [])
        .map((athleteEntry) => ({
          player: mapAthlete(athleteEntry.athlete ?? {}, category.displayName ?? category.name),
          stats: mapPlayerStatValues(category, athleteEntry.stats ?? [])
        }))
        .filter((entry) => entry.stats.length > 0);

      if (!players.length) {
        return [];
      }

      return [{ team, category: category.displayName ?? category.name ?? 'Thong ke', source: 'boxscore' as const, labels, players }];
    });
  });

  return boxscoreStats.length ? boxscoreStats : mapLeaderMatchStats(response);
}

function mapMatchLineups(response: EspnSummaryResponse): MatchLineupGroup[] {
  const substitutions = mapMatchSubstitutions(response);

  return (response.rosters ?? [])
    .map((entry, index) => {
      const team = mapTeamFromEspnTeam(entry.team, `Doi ${index + 1}`);
      const players = (entry.roster ?? []).map(mapLineupPlayer);
      const starters = players
        .filter((player) => player.starter)
        .sort(compareLineupPlayers);
      const substitutes = players
        .filter((player) => !player.starter)
        .sort(compareLineupPlayers);

      return {
        team,
        starters,
        substitutes,
        substitutions: substitutions.filter((substitution) => substitution.team.id === team.id)
      };
    })
    .filter((group) => group.starters.length || group.substitutes.length || group.substitutions.length);
}

function mapLineupPlayer(
  entry: NonNullable<NonNullable<EspnSummaryResponse['rosters']>[number]['roster']>[number]
): MatchLineupPlayer {
  const athlete = entry.athlete ?? {};
  const position = entry.position ?? athlete.position;
  const player = mapAthlete(
    {
      ...athlete,
      jersey: entry.jersey ?? athlete.jersey,
      position
    },
    position?.displayName ?? position?.name ?? position?.abbreviation
  );

  return {
    player,
    starter: entry.starter === true,
    subbedIn: entry.subbedIn === true,
    subbedOut: entry.subbedOut === true,
    jersey: entry.jersey ?? player.jersey,
    position: position?.abbreviation ?? position?.displayName ?? position?.name ?? player.position,
    formationPlace: entry.formationPlace
  };
}

function mapMatchSubstitutions(response: EspnSummaryResponse): MatchSubstitution[] {
  const teamsByName = new Map<string, TeamSummary>();

  for (const roster of response.rosters ?? []) {
    const team = mapTeamFromEspnTeam(roster.team, roster.team?.displayName ?? 'Doi');
    teamsByName.set(normalizeStatName(team.name), team);
    teamsByName.set(normalizeStatName(team.shortName), team);
  }

  return (response.commentary ?? []).flatMap((item) => {
    const text = item.text ?? '';
    const substitutionMatch = text.match(/^Substitution,\s*([^.]+)\.\s*(.+?)\s+replaces\s+(.+?)\.?$/i);

    if (!substitutionMatch) {
      return [];
    }

    const [, teamName, playerIn, playerOut] = substitutionMatch;
    const team = teamsByName.get(normalizeStatName(teamName)) ?? mapTeamFromEspnTeam(undefined, teamName);

    return [{
      team,
      minute: item.time?.value,
      displayMinute: item.time?.displayValue ?? '',
      playerIn: playerIn.trim(),
      playerOut: playerOut.trim()
    }];
  });
}

function compareLineupPlayers(left: MatchLineupPlayer, right: MatchLineupPlayer): number {
  const subbedInCompare = Number(right.subbedIn) - Number(left.subbedIn);
  if (subbedInCompare !== 0) {
    return subbedInCompare;
  }

  const leftPlace = Number(left.formationPlace);
  const rightPlace = Number(right.formationPlace);
  if (Number.isFinite(leftPlace) && Number.isFinite(rightPlace) && leftPlace !== rightPlace) {
    return leftPlace - rightPlace;
  }

  return left.player.displayName.localeCompare(right.player.displayName);
}

function mapLeaderMatchStats(response: EspnSummaryResponse): PlayerMatchStatGroup[] {
  return (response.leaders ?? []).flatMap((teamEntry, teamIndex) => {
    const team = mapTeamFromEspnTeam(teamEntry.team, `Doi ${teamIndex + 1}`);
    const playersById = new Map<string, PlayerMatchStatRow>();
    const labelByKey = new Map<string, string>();

    for (const category of teamEntry.leaders ?? []) {
      const statKey = normalizeStatName(category.name ?? category.displayName ?? category.shortDisplayName ?? 'leader');
      const statLabel = category.displayName ?? category.shortDisplayName ?? category.name ?? humanizeStatLabel(statKey);
      labelByKey.set(statKey, statLabel);

      for (const leader of category.leaders ?? []) {
        const athlete = leader.athlete ?? {};
        const player = mapAthlete(athlete);
        const existing = playersById.get(player.id) ?? { player, stats: [] };
        const displayValue = readLeaderDisplayValue(leader, statKey);

        if (!displayValue) {
          continue;
        }

        existing.stats = [
          ...existing.stats.filter((stat) => stat.key !== statKey),
          {
            key: statKey,
            label: statLabel,
            displayValue,
            value: parseStatNumber(displayValue)
          }
        ];
        playersById.set(player.id, existing);
      }
    }

    const players = [...playersById.values()].filter((player) => player.stats.length > 0);
    if (!players.length) {
      return [];
    }

    return [{
      team,
      category: 'Cau thu noi bat',
      source: 'leaders' as const,
      labels: [...labelByKey.values()],
      players
    }];
  });
}

function mapGenericStats(stats: EspnGenericStat[]): StatSummary[] {
  return stats.flatMap((stat, index) => {
    const displayValue = getStatDisplayValue(stat);
    const label =
      stat.displayName ??
      stat.label ??
      stat.shortDisplayName ??
      stat.name ??
      stat.abbreviation ??
      `Stat ${index + 1}`;

    if (!displayValue) {
      return [];
    }

    return [{
      key: normalizeStatName(stat.name ?? stat.type ?? stat.abbreviation ?? label),
      label,
      abbreviation: stat.abbreviation ?? stat.shortDisplayName,
      value: typeof stat.value === 'number' && Number.isFinite(stat.value) ? stat.value : undefined,
      displayValue
    }];
  });
}

function getStatDisplayValue(stat: EspnGenericStat): string | undefined {
  if (stat.displayValue !== undefined && stat.displayValue !== '') {
    return stat.displayValue;
  }

  if (stat.summary !== undefined && stat.summary !== '') {
    return stat.summary;
  }

  if (typeof stat.value === 'number' && Number.isFinite(stat.value)) {
    return `${stat.value}`;
  }

  if (typeof stat.value === 'string' && stat.value !== '') {
    return stat.value;
  }

  return undefined;
}

function getPlayerCategoryLabels(category: EspnPlayerStatCategory): string[] {
  const labels = category.labels?.length
    ? category.labels
    : category.keys?.map((key) => humanizeStatLabel(key)) ?? [];

  return labels.filter((label) => label && normalizeStatName(label) !== 'name');
}

function mapPlayerStatValues(category: EspnPlayerStatCategory, values: Array<string | number>): StatSummary[] {
  const keys = category.keys?.length ? category.keys : category.labels ?? [];
  const labels = getPlayerCategoryLabels(category);

  return values.flatMap((value, index) => {
    const key = keys[index] ?? labels[index] ?? `stat-${index + 1}`;

    if (normalizeStatName(key) === 'name') {
      return [];
    }

    return [{
      key: normalizeStatName(key),
      label: labels[index] ?? humanizeStatLabel(key),
      displayValue: `${value}`,
      value: typeof value === 'number' && Number.isFinite(value) ? value : undefined
    }];
  });
}

function readLeaderDisplayValue(
  leader: NonNullable<NonNullable<NonNullable<EspnSummaryResponse['leaders']>[number]['leaders']>[number]['leaders']>[number],
  statKey: string
): string | undefined {
  const statistics = Array.isArray(leader.statistics)
    ? leader.statistics
    : leader.statistics
      ? [leader.statistics]
      : [];
  const matchingStat = statistics.find((stat) => normalizeStatName(stat.name ?? stat.displayName ?? '') === statKey);

  return (
    getStatDisplayValue(matchingStat ?? {}) ??
    readString(leader.mainStat?.value) ??
    leader.displayValue ??
    leader.summary
  );
}

function parseStatNumber(value: string): number | undefined {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapSeasonStatGroups(response: EspnPlayerStatsResponse): PlayerSeasonStats['groups'] {
  return collectSeasonStatGroups(response)
    .map((group, index) => ({
      name: group.name ?? `Thong ke ${index + 1}`,
      stats: mapGenericStats(group.stats)
    }))
    .filter((group) => group.stats.length > 0);
}

function collectSeasonStatGroups(response: unknown): Array<{ name?: string; stats: EspnGenericStat[] }> {
  const value = asRecord(response);
  if (!value) {
    return [];
  }

  const directStats = asGenericStats(value.stats ?? value.statistics);
  const splitRecord = asRecord(value.splits);
  const splits = asArray(value.splits);
  const categories = asArray(value.categories);
  const splitCategories = asArray(splitRecord?.categories);

  const groups: Array<{ name?: string; stats: EspnGenericStat[] } | undefined> = [
    directStats.length ? { name: readString(value.displayName) ?? readString(value.name), stats: directStats } : undefined,
    ...splitCategories.flatMap((category) => {
      const categoryRecord = asRecord(category);
      const stats = asGenericStats(categoryRecord?.stats ?? categoryRecord?.statistics);
      return stats.length ? [{ name: readString(categoryRecord?.displayName) ?? readString(categoryRecord?.name), stats }] : [];
    }),
    ...splits.flatMap((split) => {
      const splitRecord = asRecord(split);
      const stats = asGenericStats(splitRecord?.stats ?? splitRecord?.statistics);
      return stats.length ? [{ name: readString(splitRecord?.displayName) ?? readString(splitRecord?.name), stats }] : [];
    }),
    ...categories.flatMap((category) => {
      const categoryRecord = asRecord(category);
      const stats = asGenericStats(categoryRecord?.stats ?? categoryRecord?.statistics);
      return stats.length ? [{ name: readString(categoryRecord?.displayName) ?? readString(categoryRecord?.name), stats }] : [];
    })
  ];

  return groups.filter((group): group is { name?: string; stats: EspnGenericStat[] } => Boolean(group));
}

function findSeasonLabel(response: unknown): string | undefined {
  const value = asRecord(response);
  const season = asRecord(value?.season);
  return readString(season?.displayName) ?? readString(season?.year) ?? readString(value?.seasonDisplayName);
}

function asGenericStats(value: unknown): EspnGenericStat[] {
  return asArray(value)
    .map(asRecord)
    .filter((stat): stat is Record<string, unknown> => Boolean(stat))
    .map((stat) => ({
      name: readString(stat.name),
      displayName: readString(stat.displayName),
      shortDisplayName: readString(stat.shortDisplayName),
      label: readString(stat.label),
      abbreviation: readString(stat.abbreviation),
      type: readString(stat.type),
      value: readNumberOrString(stat.value),
      displayValue: readString(stat.displayValue),
      summary: readString(stat.summary)
    }));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value !== '') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`;
  }

  return undefined;
}

function readNumberOrString(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value !== '') {
    return value;
  }

  return undefined;
}

function humanizeStatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    return isHalftimeStatus(name, description, status?.type?.detail, status?.type?.shortDetail)
      ? 'halftime'
      : 'in_progress';
  }

  if (state === 'pre') {
    return 'scheduled';
  }

  if (hasCompleteScore) {
    return 'finished';
  }

  return 'unknown';
}

function isHalftimeStatus(
  name: string | undefined,
  description: string | undefined,
  detail: string | undefined,
  shortDetail: string | undefined
): boolean {
  const normalizedName = name?.toLowerCase();
  const normalizedDescription = description?.toLowerCase();
  const normalizedDetail = detail?.trim().toLowerCase();
  const normalizedShortDetail = shortDetail?.trim().toLowerCase();

  return (
    normalizedName === 'status_halftime' ||
    normalizedDescription === 'halftime' ||
    normalizedDetail === 'ht' ||
    normalizedShortDetail === 'ht'
  );
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

  if (/\b(own goal|own-goal|owngoal)\b/.test(text)) {
    return 'own_goal';
  }

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
