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
  groupLabel?: string;
  groupType?: 'country' | 'continental' | 'world' | 'misc' | 'other';
  countryCode?: string;
  confederation?: string;
  isExcludedFromTeamSchedule?: boolean;
}

export interface StandingGroup {
  id: string;
  name: string;
  rows: StandingRow[];
}

export interface StandingRow {
  id: string;
  rank?: number;
  team: TeamSummary;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
  form?: string;
}

export interface TeamDetail extends TeamSummary {
  leagueSlug: string;
  location?: string;
  venue?: string;
  color?: string;
}

export interface PlayerSummary {
  id: string;
  name: string;
  displayName: string;
  jersey?: string;
  position?: string;
  age?: number;
  nationality?: string;
  headshotUrl?: string;
}

export interface TeamScheduleMatch extends FootballMatch {}

export type MatchEventType = 'goal' | 'red_card';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  goalQualifier?: 'penalty' | 'free_kick';
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
  leagueShortName?: string;
  kickoff: string;
  status: MatchStatus;
  statusText: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  homeScore?: number;
  awayScore?: number;
  penaltyShootout?: {
    home: number;
    away: number;
  };
  importanceLabel?: string;
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
