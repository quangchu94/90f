const siteApiBaseUrl =
  import.meta.env.VITE_ESPN_SITE_API_BASE_URL ?? '/api/espn/site';
const coreApiBaseUrl =
  import.meta.env.VITE_ESPN_CORE_API_BASE_URL ?? '/api/espn/core';
const standingsApiBaseUrl =
  import.meta.env.VITE_ESPN_STANDINGS_API_BASE_URL ?? '/api/espn/v2';
const webApiBaseUrl =
  import.meta.env.VITE_ESPN_WEB_API_BASE_URL ?? '/api/espn/web';

export function buildScoreboardUrl(leagueSlug: string, dateParam: string): string {
  const params = new URLSearchParams({ dates: dateParam });
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/scoreboard?${params.toString()}`;
}

export function buildLiveScoreboardUrl(dateParam: string): string {
  const params = new URLSearchParams({ dates: dateParam, limit: '200' });
  return `${siteApiBaseUrl}/sports/soccer/all/scoreboard?${params.toString()}`;
}

export function buildMatchSummaryUrl(leagueSlug: string, eventId: string): string {
  const params = new URLSearchParams({ event: eventId });
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/summary?${params.toString()}`;
}

export function buildStandingsUrl(leagueSlug: string, season?: string): string {
  const url = `${standingsApiBaseUrl}/sports/soccer/${leagueSlug}/standings`;

  if (!season) {
    return url;
  }

  const params = new URLSearchParams({ season });
  return `${url}?${params.toString()}`;
}

export function buildTeamsUrl(leagueSlug: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/teams`;
}

export function buildTeamDetailUrl(leagueSlug: string, teamId: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/teams/${teamId}`;
}

export function buildCoreTeamDetailUrl(leagueSlug: string, teamId: string): string {
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}/teams/${teamId}`;
}

export function buildTeamRosterUrl(leagueSlug: string, teamId: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/teams/${teamId}/roster`;
}

export function buildCoreAthleteStatisticsUrl(leagueSlug: string, athleteId: string): string {
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}/athletes/${athleteId}/statistics`;
}

export function buildCoreAthleteDetailUrl(leagueSlug: string, athleteId: string): string {
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}/athletes/${athleteId}`;
}

export function buildCoreAthleteStatisticsLogUrl(leagueSlug: string, athleteId: string): string {
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}/athletes/${athleteId}/statisticslog`;
}

export function buildSiteAthleteGamelogUrl(leagueSlug: string, athleteId: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/athletes/${athleteId}/gamelog`;
}

export function buildSiteAthleteSplitsUrl(leagueSlug: string, athleteId: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/athletes/${athleteId}/splits`;
}

export function buildTeamScheduleUrl(leagueSlug: string, teamId: string): string {
  return `${siteApiBaseUrl}/sports/soccer/${leagueSlug}/teams/${teamId}/schedule`;
}

export function buildTeamFixtureScheduleUrl(teamId: string): string {
  const params = new URLSearchParams({ fixture: 'true' });
  return `${webApiBaseUrl}/sports/soccer/all/teams/${teamId}/schedule?${params.toString()}`;
}

export function buildSoccerLeaguesUrl(): string {
  const params = new URLSearchParams({ limit: '1000' });
  return `${coreApiBaseUrl}/sports/soccer/leagues?${params.toString()}`;
}

export function buildSoccerLeagueDetailUrl(leagueSlug: string): string {
  const params = new URLSearchParams({ lang: 'en', region: 'us' });
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}?${params.toString()}`;
}

export function buildSoccerLeagueSeasonsUrl(leagueSlug: string): string {
  const params = new URLSearchParams({ limit: '20' });
  return `${coreApiBaseUrl}/sports/soccer/leagues/${leagueSlug}/seasons?${params.toString()}`;
}

export function buildProxiedEspnRefUrl(refUrl: string): string {
  if (refUrl.startsWith('http://sports.core.api.espn.com/v2')) {
    return refUrl.replace('http://sports.core.api.espn.com/v2', coreApiBaseUrl);
  }

  if (refUrl.startsWith('https://sports.core.api.espn.com/v2')) {
    return refUrl.replace('https://sports.core.api.espn.com/v2', coreApiBaseUrl);
  }

  if (refUrl.startsWith('http://site.api.espn.com/apis/site/v2')) {
    return refUrl.replace('http://site.api.espn.com/apis/site/v2', siteApiBaseUrl);
  }

  if (refUrl.startsWith('https://site.api.espn.com/apis/site/v2')) {
    return refUrl.replace('https://site.api.espn.com/apis/site/v2', siteApiBaseUrl);
  }

  if (refUrl.startsWith('http://site.api.espn.com/apis/v2')) {
    return refUrl.replace('http://site.api.espn.com/apis/v2', standingsApiBaseUrl);
  }

  if (refUrl.startsWith('https://site.api.espn.com/apis/v2')) {
    return refUrl.replace('https://site.api.espn.com/apis/v2', standingsApiBaseUrl);
  }

  if (refUrl.startsWith('http://site.web.api.espn.com/apis/site/v2')) {
    return refUrl.replace('http://site.web.api.espn.com/apis/site/v2', webApiBaseUrl);
  }

  if (refUrl.startsWith('https://site.web.api.espn.com/apis/site/v2')) {
    return refUrl.replace('https://site.web.api.espn.com/apis/site/v2', webApiBaseUrl);
  }

  return refUrl;
}
