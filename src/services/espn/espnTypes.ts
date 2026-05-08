export interface EspnLogo {
  href?: string;
}

export interface EspnTeam {
  id?: string;
  uid?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
  logos?: EspnLogo[];
}

export interface EspnCompetitor {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string;
  team?: EspnTeam;
}

export interface EspnCompetition {
  date?: string;
  competitors?: EspnCompetitor[];
  status?: EspnEventStatus;
  venue?: {
    fullName?: string;
  };
  broadcasts?: Array<{
    names?: string[];
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
  abbreviation?: string;
}

export interface EspnEvent {
  id?: string;
  uid?: string;
  date?: string;
  name?: string;
  shortName?: string;
  status?: EspnEventStatus;
  competitions?: EspnCompetition[];
  leagues?: EspnLeague[];
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
  };
  boxscore?: unknown;
  gameInfo?: {
    venue?: {
      fullName?: string;
    };
    attendance?: number;
  };
  broadcasts?: Array<{
    names?: string[];
  }>;
  keyEvents?: EspnMatchEvent[];
  commentary?: EspnCommentaryItem[];
}
