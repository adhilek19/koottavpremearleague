export interface Player {
  id: string;
  name: string;
  goals: number;
  assists: number;
  teamId: string;
  photoUrl?: string;
  marketValue?: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  group?: 'A' | 'B';
  players: Player[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

export interface MatchEvent {
  type: 'goal' | 'assist';
  playerId: string;
  teamId: string;
  timestamp: number;
}

export interface Substitution {
  id: string;
  matchId: string;
  teamId: string;
  playerOutId: string;
  playerInId: string;
  minute: number;
  half: 'first' | 'second';
}

export interface MatchStats {
  id: string;
  matchId: string;
  teamId: string;
  possession: number;
  shotsOnTarget: number;
  fouls: number;
  corners: number;
  yellowCards: number;
  redCards: number;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  status: 'pending' | 'live' | 'finished';
  events: MatchEvent[];
  aiSummary?: string;
  phase?: 'group' | 'semifinal' | 'final';
  startedAt?: string;
  half?: 'first' | 'second' | 'finished';
  substitutions?: Substitution[];
  stats?: { teamA: MatchStats; teamB: MatchStats };
}

export type AppView = 'dashboard' | 'standings' | 'teams' | 'matches' | 'stats' | 'player';
