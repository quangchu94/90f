const siteApiBaseUrl =
  import.meta.env.VITE_ESPN_SITE_API_BASE_URL ?? 'https://site.api.espn.com/apis/site/v2';

export function buildScoreboardUrl(leagueSlug: string, dateParam: string): string {
  const url = new URL(`${siteApiBaseUrl}/sports/soccer/${leagueSlug}/scoreboard`);
  url.searchParams.set('dates', dateParam);
  return url.toString();
}

export function buildMatchSummaryUrl(leagueSlug: string, eventId: string): string {
  const url = new URL(`${siteApiBaseUrl}/sports/soccer/${leagueSlug}/summary`);
  url.searchParams.set('event', eventId);
  return url.toString();
}
