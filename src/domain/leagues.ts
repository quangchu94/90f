import type { LeagueSummary } from './models';

const CURATED_LEAGUE_NAMES: Record<string, { name: string; shortName?: string }> = {
  'eng.1': { name: 'Premier League', shortName: 'EPL' },
  'eng.2': { name: 'English League Championship', shortName: 'EFL Championship' },
  'esp.1': { name: 'La Liga', shortName: 'LaLiga' },
  'ger.1': { name: 'Bundesliga', shortName: 'Bundesliga' },
  'ger.2': { name: '2. Bundesliga', shortName: '2. Bundesliga' },
  'ita.1': { name: 'Serie A', shortName: 'Serie A' },
  'ita.2': { name: 'Italian Serie B', shortName: 'Italian Serie B' },
  'fra.1': { name: 'Ligue 1', shortName: 'Ligue 1' },
  'usa.1': { name: 'MLS', shortName: 'MLS' },
  'ger.dfb_pokal': { name: 'German Cup', shortName: 'DFB Pokal' },
  'esp.copa_del_rey': { name: 'Spanish Copa del Rey', shortName: 'Copa del Rey' }
};

const COUNTRY_NAME_PREFIXES: Record<string, string> = {
  eng: 'English',
  esp: 'Spanish',
  ger: 'German',
  ita: 'Italian',
  fra: 'French',
  usa: 'American'
};

const PRIORITY_LEAGUE_PREFIXES = new Set(['fifa', 'uefa', 'concacaf', 'eng', 'ger', 'esp', 'ita', 'fra', 'usa']);

export const INITIAL_LEAGUES: LeagueSummary[] = [
  enrichLeagueMetadata({ slug: 'fifa.world', name: 'FIFA World Cup', shortName: 'World Cup' }),
  enrichLeagueMetadata({ slug: 'eng.1', name: 'Premier League', shortName: 'EPL' }),
  enrichLeagueMetadata({ slug: 'esp.1', name: 'La Liga', shortName: 'LaLiga' }),
  enrichLeagueMetadata({ slug: 'ger.1', name: 'Bundesliga', shortName: 'Bundesliga' }),
  enrichLeagueMetadata({ slug: 'ita.1', name: 'Serie A', shortName: 'Serie A' }),
  enrichLeagueMetadata({ slug: 'fra.1', name: 'Ligue 1', shortName: 'Ligue 1' }),
  enrichLeagueMetadata({ slug: 'uefa.champions', name: 'UEFA Champions League', shortName: 'UCL' }),
  enrichLeagueMetadata({ slug: 'uefa.europa', name: 'UEFA Europa League', shortName: 'UEL' })
];

export const DEFAULT_LEAGUE_SLUGS = ['eng.1', 'esp.1', 'uefa.champions'];

export const DEFAULT_LEAGUE_SLUG = DEFAULT_LEAGUE_SLUGS[0];

export function getLeagueBySlug(slug: string): LeagueSummary {
  return INITIAL_LEAGUES.find((league) => league.slug === slug) ?? enrichLeagueMetadata({ slug, name: slug });
}

export function isSupportedLeagueSlug(slug: string | undefined): slug is string {
  return Boolean(slug && INITIAL_LEAGUES.some((league) => league.slug === slug));
}

export function getSupportedLeagueFallback(slug: string | undefined): string {
  const prefix = slug?.split('.')[0];

  switch (prefix) {
    case 'esp':
      return 'esp.1';
    case 'eng':
      return 'eng.1';
    case 'ger':
      return 'ger.1';
    case 'ita':
      return 'ita.1';
    case 'fra':
      return 'fra.1';
    case 'uefa':
      return 'uefa.champions';
    case 'fifa':
      return 'fifa.world';
    default:
      return DEFAULT_LEAGUE_SLUG;
  }
}

export function mergeLeagueSummaries(leagues: LeagueSummary[]): LeagueSummary[] {
  const bySlug = new Map<string, LeagueSummary>();

  for (const league of leagues) {
    if (!league.slug) {
      continue;
    }

    const existing = bySlug.get(league.slug);
    bySlug.set(league.slug, {
      ...enrichLeagueMetadata({
        ...existing,
        ...league,
        slug: league.slug,
        name: league.name || existing?.name || league.slug,
        shortName: league.shortName ?? existing?.shortName
      })
    });
  }

  return [...bySlug.values()];
}

export function getLeagueShortName(
  slug: string,
  abbreviation?: string,
  fallbackName?: string
): string {
  const league = INITIAL_LEAGUES.find((item) => item.slug === slug);
  const enrichedLeague = enrichLeagueMetadata({ slug, name: fallbackName ?? slug, shortName: abbreviation });
  const shortName = league?.shortName ?? enrichedLeague.shortName ?? abbreviation;

  return isWeakLeagueShortName(shortName, enrichedLeague.name)
    ? enrichedLeague.name ?? fallbackName ?? slug
    : shortName ?? enrichedLeague.name ?? fallbackName ?? slug;
}

export function isPriorityLeagueSlug(slug: string): boolean {
  return PRIORITY_LEAGUE_PREFIXES.has(slug.split('.')[0] ?? '');
}

export function getPriorityLeagues(leagues: LeagueSummary[]): LeagueSummary[] {
  return mergeLeagueSummaries(leagues).filter((league) => isPriorityLeagueSlug(league.slug));
}

export function enrichLeagueMetadata(league: LeagueSummary): LeagueSummary {
  const curatedLeague = CURATED_LEAGUE_NAMES[league.slug];
  const normalizedName = normalizeLeagueDisplayName(league);
  const normalizedLeague = {
    ...league,
    name: normalizedName,
    shortName: normalizeLeagueShortName(league.shortName ?? curatedLeague?.shortName, normalizedName)
  };
  const text = `${normalizedLeague.slug} ${normalizedLeague.name} ${normalizedLeague.shortName ?? ''}`.toLowerCase();

  if (text.includes('friendly') || text.includes('misc')) {
    return {
      ...normalizedLeague,
      groupLabel: 'Misc',
      groupType: 'misc',
      isExcludedFromTeamSchedule: true
    };
  }

  if (league.slug.startsWith('fifa.')) {
    return {
      ...normalizedLeague,
      groupLabel: 'World',
      groupType: 'world',
      isExcludedFromTeamSchedule: false
    };
  }

  if (league.slug.startsWith('uefa.')) {
    return {
      ...normalizedLeague,
      groupLabel: 'Europe / UEFA',
      groupType: 'continental',
      confederation: 'UEFA',
      isExcludedFromTeamSchedule: false
    };
  }

  if (league.slug.startsWith('concacaf.')) {
    return {
      ...normalizedLeague,
      groupLabel: 'North America / CONCACAF',
      groupType: 'continental',
      confederation: 'CONCACAF',
      isExcludedFromTeamSchedule: false
    };
  }

  const country = getCountryMetadata(league.slug);
  if (country) {
    return {
      ...normalizedLeague,
      groupLabel: country.label,
      groupType: 'country',
      countryCode: country.code,
      confederation: country.confederation,
      isExcludedFromTeamSchedule: false
    };
  }

  return {
    ...normalizedLeague,
    groupLabel: league.slug.split('.')[0]?.toUpperCase() ?? 'Other',
    groupType: 'other',
    isExcludedFromTeamSchedule: false
  };
}

function shouldInferLeagueName(league: LeagueSummary): boolean {
  return !league.name || league.name === league.slug || Boolean(CURATED_LEAGUE_NAMES[league.slug]);
}

function normalizeLeagueDisplayName(league: LeagueSummary): string {
  const curatedLeague = CURATED_LEAGUE_NAMES[league.slug];

  if (curatedLeague) {
    return curatedLeague.name;
  }

  if (shouldInferLeagueName(league)) {
    return inferLeagueNameFromSlug(league.slug);
  }

  return trimCountryPrefixFromLeagueName(league.name, league.slug);
}

function trimCountryPrefixFromLeagueName(name: string, slug: string): string {
  const prefix = slug.split('.')[0];
  const countryPrefix = COUNTRY_NAME_PREFIXES[prefix];

  if (!countryPrefix || !name.startsWith(`${countryPrefix} `)) {
    return name;
  }

  const trimmedName = name.slice(countryPrefix.length + 1).trim();
  const genericNames = new Set(['Cup', 'Super Cup', 'League Cup']);

  return trimmedName && !genericNames.has(trimmedName) ? trimmedName : name;
}

function normalizeLeagueShortName(shortName: string | undefined, fullName: string): string | undefined {
  if (!shortName) {
    return fullName;
  }

  return isWeakLeagueShortName(shortName, fullName) ? fullName : shortName;
}

function isWeakLeagueShortName(shortName: string | undefined, fullName: string | undefined): boolean {
  if (!shortName || !fullName) {
    return false;
  }

  const normalizedShortName = shortName.trim();
  const normalizedFullName = fullName.trim();

  return (
    normalizedShortName.length <= 2 &&
    normalizedFullName.length > normalizedShortName.length &&
    /[a-z]/i.test(normalizedFullName)
  );
}

function inferLeagueNameFromSlug(slug: string): string {
  const curatedLeague = CURATED_LEAGUE_NAMES[slug];
  if (curatedLeague) {
    return curatedLeague.name;
  }

  const [prefix, ...rest] = slug.split('.');
  const title = titleCase(rest.join(' ') || slug);
  const countryPrefix = COUNTRY_NAME_PREFIXES[prefix];

  if (!rest.length) {
    return title;
  }

  return countryPrefix ? `${countryPrefix} ${title}` : `${prefix.toUpperCase()} ${title}`;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getTeamScheduleCandidateLeagues(
  routeLeagueSlug: string,
  catalogLeagues: LeagueSummary[]
): LeagueSummary[] {
  const enrichedLeagues = mergeLeagueSummaries(catalogLeagues).filter(
    (league) => !league.isExcludedFromTeamSchedule
  );
  const routeLeague = enrichedLeagues.find((league) => league.slug === routeLeagueSlug);

  if (!routeLeague || routeLeague.groupType !== 'country' || !routeLeague.countryCode) {
    return enrichedLeagues;
  }

  return enrichedLeagues.filter(
    (league) =>
      league.countryCode === routeLeague.countryCode ||
      (league.groupType === 'continental' && league.confederation === routeLeague.confederation) ||
      league.groupType === 'world'
  );
}

export function sortLeagueGroups(
  groups: Array<{ label: string; leagues: LeagueSummary[] }>
): Array<{ label: string; leagues: LeagueSummary[] }> {
  const order = new Map([
    ['World', 0],
    ['Europe / UEFA', 1],
    ['England', 10],
    ['Spain', 11],
    ['Germany', 12],
    ['Italy', 13],
    ['France', 14],
    ['Other', 1000],
    ['Misc', 1001]
  ]);

  return [...groups].sort(
    (left, right) =>
      (order.get(left.label) ?? 500) - (order.get(right.label) ?? 500) ||
      left.label.localeCompare(right.label)
  );
}

export function sortLeaguesWithinGroup(leagues: LeagueSummary[]): LeagueSummary[] {
  return [...leagues].sort((left, right) => {
    const leftRank = getLeagueSortRank(left);
    const rightRank = getLeagueSortRank(right);

    return (
      leftRank.category - rightRank.category ||
      leftRank.number - rightRank.number ||
      getLeagueShortName(left.slug, left.shortName, left.name).localeCompare(
        getLeagueShortName(right.slug, right.shortName, right.name)
      ) ||
      left.slug.localeCompare(right.slug)
    );
  });
}

function getLeagueSortRank(league: LeagueSummary): { category: number; number: number } {
  const suffix = league.slug.split('.').slice(1).join('.');
  const numericSuffix = Number(suffix);

  if (Number.isFinite(numericSuffix) && /^\d+$/.test(suffix)) {
    return { category: 0, number: numericSuffix };
  }

  if (isNationalCupSlug(suffix)) {
    return { category: 100, number: 0 };
  }

  if (suffix.includes('league_cup')) {
    return { category: 110, number: 0 };
  }

  if (suffix.includes('super_cup') || suffix.includes('supercup')) {
    return { category: 120, number: 0 };
  }

  return { category: 200, number: 0 };
}

function isNationalCupSlug(suffix: string): boolean {
  return (
    suffix === 'fa' ||
    suffix === 'dfb_pokal' ||
    suffix === 'copa_del_rey' ||
    (suffix.includes('cup') && !suffix.includes('league_cup') && !suffix.includes('super_cup'))
  );
}

function getCountryMetadata(slug: string): { label: string; code: string; confederation: string } | undefined {
  const prefix = slug.split('.')[0];

  switch (prefix) {
    case 'eng':
      return { label: 'England', code: 'ENG', confederation: 'UEFA' };
    case 'esp':
      return { label: 'Spain', code: 'ESP', confederation: 'UEFA' };
    case 'ger':
      return { label: 'Germany', code: 'GER', confederation: 'UEFA' };
    case 'ita':
      return { label: 'Italy', code: 'ITA', confederation: 'UEFA' };
    case 'fra':
      return { label: 'France', code: 'FRA', confederation: 'UEFA' };
    case 'usa':
      return { label: 'United States', code: 'USA', confederation: 'CONCACAF' };
    default:
      return undefined;
  }
}
