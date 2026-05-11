import type { LeagueSummary } from './models';

export const INITIAL_LEAGUES: LeagueSummary[] = [
  { slug: 'fifa.world', name: 'FIFA World Cup', shortName: 'World Cup' },
  { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
  { slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' },
  { slug: 'ger.1', name: 'Bundesliga', shortName: 'Bundesliga' },
  { slug: 'ita.1', name: 'Serie A', shortName: 'Serie A' },
  { slug: 'fra.1', name: 'Ligue 1', shortName: 'Ligue 1' },
  { slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' },
  { slug: 'uefa.europa', name: 'UEFA Europa League', shortName: 'UEL' }
];

export const DEFAULT_LEAGUE_SLUGS = ['eng.1', 'esp.1', 'uefa.champions'];

export function getLeagueBySlug(slug: string): LeagueSummary {
  return INITIAL_LEAGUES.find((league) => league.slug === slug) ?? { slug, name: slug };
}

export function getLeagueShortName(
  slug: string,
  abbreviation?: string,
  fallbackName?: string
): string {
  const league = INITIAL_LEAGUES.find((item) => item.slug === slug);
  return league?.shortName ?? abbreviation ?? fallbackName ?? league?.name ?? slug;
}

export function isSupportedLeagueSlug(slug: string | undefined): slug is string {
  return Boolean(slug && INITIAL_LEAGUES.some((league) => league.slug === slug));
}
