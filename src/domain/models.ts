export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'unknown';

export interface TeamSummary {
  id: string;
  name: string;
  shortName: string;
  abbreviation?: string;
  logoUrl?: string;
}

export interface LeagueSummary {
  slug: string;
  name: string;
  shortName?: string;
}

export type MatchEventType = 'goal' | 'red_card';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  teamId?: string;
  teamName?: string;
  playerName: string;
  minute?: number;
  displayMinute: string;
  text: string;
}

export interface FootballMatch {
  id: string;
  leagueSlug: string;
  leagueName: string;
  kickoff: string;
  status: MatchStatus;
  statusText: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}

export interface MatchDetail extends FootballMatch {
  attendance?: number;
  broadcasts: string[];
  notes: string[];
  events: MatchEvent[];
  goals: MatchEvent[];
  redCards: MatchEvent[];
}
