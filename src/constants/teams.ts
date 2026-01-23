import { Team } from '@/types/arena';

const PLAYER_PHOTOS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop"
];

export const INITIAL_TEAMS: Team[] = [
  { id: '1', name: 'Lightning FC', color: '#fbbf24', group: 'A' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '2', name: 'Iron Titans', color: '#64748b', group: 'A' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '3', name: 'Phoenix United', color: '#ef4444', group: 'A' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '4', name: 'Emerald Dragons', color: '#10b981', group: 'A' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '5', name: 'Cobalt Sharks', color: '#3b82f6', group: 'B' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '6', name: 'Shadow Ninjas', color: '#1e293b', group: 'B' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '7', name: 'Neon Stars', color: '#d946ef', group: 'B' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
  { id: '8', name: 'Golden Lions', color: '#f59e0b', group: 'B' as const, players: [], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
].map(team => ({
  ...team,
  players: Array.from({ length: 7 }).map((_, i) => ({
    id: `${team.id}-p${i + 1}`,
    name: `Player ${i + 1}`,
    goals: 0,
    assists: 0,
    teamId: team.id,
    photoUrl: PLAYER_PHOTOS[i % PLAYER_PHOTOS.length],
    marketValue: Math.floor(Math.random() * 50000) + 10000,
    yellowCards: 0,
    redCards: 0
  }))
}));
