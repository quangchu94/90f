export interface EspnLogo {
  href?: string;
}

export interface EspnTeam {
  id?: string;
  uid?: string;
  displayName?: string;
  name?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  location?: string;
  color?: string;
  logo?: string;
  logos?: EspnLogo[];
  venue?: {
    $ref?: string;
    fullName?: string;
    displayName?: string;
    name?: string;
  };
  recordSummary?: string;
}

export interface EspnCompetitor {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string | number | {
    value?: number;
    displayValue?: string;
  };
  scoreValue?: number;
  shootoutScore?: string | number | {
    value?: number;
    displayValue?: string;
  };
  penaltyScore?: string | number | {
    value?: number;
    displayValue?: string;
  };
  winner?: boolean;
  curatedRank?: {
    current?: number;
  };
  team?: EspnTeam;
}

export interface EspnCompetition {
  date?: string;
  competitors?: EspnCompetitor[];
  status?: EspnEventStatus;
  neutralSite?: boolean;
  venue?: {
    fullName?: string;
    displayName?: string;
    name?: string;
  };
  broadcasts?: Array<{
    names?: string[];
  }>;
  notes?: Array<{
    type?: string;
    headline?: string;
    text?: string;
  }>;
  attendance?: number;
}

export interface EspnMatchEvent {
  id?: string;
  type?: {
    id?: string;
    text?: string;
    type?: string;
  };
  text?: string;
  shortText?: string;
  period?: {
    number?: number;
  };
  clock?: {
    value?: number;
    displayValue?: string;
  };
  scoringPlay?: boolean;
  team?: {
    id?: string;
    displayName?: string;
  };
  participants?: Array<{
    athlete?: {
      id?: string;
      displayName?: string;
    };
  }>;
}

export interface EspnCommentaryItem {
  sequence?: number;
  type?: string;
  time?: {
    value?: number;
    displayValue?: string;
  };
  text?: string;
  play?: EspnMatchEvent;
}

export interface EspnEventStatus {
  type?: {
    id?: string;
    name?: string;
    state?: string;
    completed?: boolean;
    description?: string;
    detail?: string;
    shortDetail?: string;
  };
}

export interface EspnLeague {
  slug?: string;
  name?: string;
  displayName?: string;
  shortName?: string;
  abbreviation?: string;
  $ref?: string;
}

export interface EspnLeagueCollectionResponse {
  items?: EspnLeague[];
  leagues?: EspnLeague[];
}

export interface EspnSeasonCollectionResponse {
  items?: Array<{
    $ref?: string;
    year?: number | string;
    displayName?: string;
    name?: string;
    abbreviation?: string;
  }>;
}

export interface EspnEvent {
  id?: string;
  uid?: string;
  date?: string;
  name?: string;
  shortName?: string;
  season?: {
    name?: string;
    displayName?: string;
    slug?: string;
  };
  seasonType?: {
    name?: string;
    displayName?: string;
  };
  notes?: Array<{
    type?: string;
    headline?: string;
    text?: string;
  }>;
  status?: EspnEventStatus;
  competitions?: EspnCompetition[];
  leagues?: EspnLeague[];
  league?: EspnLeague;
  links?: Array<{
    href?: string;
    rel?: string[];
  }>;
  sourceLeague?: EspnLeague;
}

export interface EspnScoreboardResponse {
  leagues?: EspnLeague[];
  events?: EspnEvent[];
}

export interface EspnSummaryResponse {
  header?: {
    id?: string;
    competitions?: EspnCompetition[];
    status?: EspnEventStatus;
    league?: EspnLeague;
    name?: string;
    shortName?: string;
    season?: {
      name?: string;
      displayName?: string;
    };
    seasonType?: {
      name?: string;
      displayName?: string;
    };
  };
  boxscore?: {
    teams?: Array<{
      team?: EspnTeam;
      statistics?: EspnGenericStat[];
    }>;
    players?: Array<{
      team?: EspnTeam;
      statistics?: EspnPlayerStatCategory[];
    }>;
  };
  gameInfo?: {
    venue?: {
      fullName?: string;
    };
    attendance?: number;
  };
  broadcasts?: Array<{
    names?: string[];
  }>;
  rosters?: Array<{
    team?: EspnTeam;
    roster?: Array<{
      active?: boolean;
      starter?: boolean;
      jersey?: string;
      athlete?: EspnAthlete;
      position?: {
        name?: string;
        displayName?: string;
        abbreviation?: string;
      };
      subbedIn?: boolean;
      subbedOut?: boolean;
      formationPlace?: string;
      stats?: EspnGenericStat[];
    }>;
  }>;
  leaders?: Array<{
    team?: EspnTeam;
    leaders?: Array<{
      name?: string;
      displayName?: string;
      shortDisplayName?: string;
      leaders?: Array<{
        displayValue?: string;
        athlete?: EspnAthlete;
        statistics?: EspnGenericStat[] | EspnGenericStat;
        mainStat?: {
          value?: string | number;
          label?: string;
        };
        summary?: string;
      }>;
    }>;
  }>;
  keyEvents?: EspnMatchEvent[];
  commentary?: EspnCommentaryItem[];
}

export interface EspnGenericStat {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  label?: string;
  abbreviation?: string;
  type?: string;
  value?: number | string;
  displayValue?: string;
  summary?: string;
}

export interface EspnPlayerStatCategory {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  labels?: string[];
  descriptions?: string[];
  keys?: string[];
  athletes?: Array<{
    athlete?: EspnAthlete;
    stats?: Array<string | number>;
  }>;
}

export type EspnPlayerStatsResponse = unknown;

export interface EspnAthleteDetailResponse extends EspnAthlete {
  statistics?: {
    $ref?: string;
  };
}

export interface EspnStandingStat {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  type?: string;
  value?: number;
  displayValue?: string;
  summary?: string;
}

export interface EspnStandingEntry {
  team?: EspnTeam;
  stats?: EspnStandingStat[];
}

export interface EspnStandingNode {
  id?: string;
  name?: string;
  displayName?: string;
  standings?: {
    entries?: EspnStandingEntry[];
  };
}

export interface EspnStandingsResponse {
  standings?: {
    entries?: EspnStandingEntry[];
  };
  children?: EspnStandingNode[];
}

export interface EspnTeamsResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{
        team?: EspnTeam;
      }>;
    }>;
  }>;
  teams?: Array<{
    team?: EspnTeam;
  }>;
}

export interface EspnTeamDetailResponse {
  team?: EspnTeam;
  id?: string;
  uid?: string;
  displayName?: string;
  name?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  location?: string;
  color?: string;
  logo?: string;
  logos?: EspnLogo[];
  venue?: {
    $ref?: string;
    fullName?: string;
    displayName?: string;
    name?: string;
  };
  nextEvent?: EspnEvent[];
}

export interface EspnAthlete {
  id?: string;
  uid?: string;
  fullName?: string;
  displayName?: string;
  shortName?: string;
  jersey?: string;
  age?: number;
  position?: {
    name?: string;
    displayName?: string;
    abbreviation?: string;
  };
  citizenship?: string;
  birthPlace?: {
    country?: string;
  };
  headshot?: {
    href?: string;
  };
  headshots?: Array<{
    href?: string;
  }>;
  images?: Array<{
    href?: string;
  }>;
}

export interface EspnRosterGroup {
  position?: string;
  name?: string;
  items?: EspnAthlete[];
}

export interface EspnRosterResponse {
  athletes?: Array<EspnAthlete | EspnRosterGroup>;
}

export interface EspnTeamScheduleResponse extends EspnScoreboardResponse {}

export interface EspnVenueResponse {
  fullName?: string;
  displayName?: string;
  name?: string;
}
