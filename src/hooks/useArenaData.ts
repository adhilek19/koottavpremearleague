import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Team, Match, Player, MatchEvent, Substitution, MatchStats } from '@/types/arena';
import { INITIAL_TEAMS } from '@/constants/teams';

interface DbTeam {
  id: string;
  name: string;
  color: string;
  group: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

interface DbPlayer {
  id: string;
  name: string;
  goals: number;
  assists: number;
  team_id: string;
  photo_url: string | null;
  market_value: number | null;
  yellow_cards: number;
  red_cards: number;
  suspended_until_match_id: string | null;
}

interface DbMatch {
  id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  status: string;
  phase: string | null;
  started_at: string | null;
  half: string | null;
}

interface DbMatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  event_type: string;
  created_at: string;
}

interface DbSubstitution {
  id: string;
  match_id: string;
  team_id: string;
  player_out_id: string;
  player_in_id: string;
  minute: number;
  half: string;
}

interface DbMatchStats {
  id: string;
  match_id: string;
  team_id: string;
  possession: number;
  shots_on_target: number;
  fouls: number;
  corners: number;
  yellow_cards: number;
  red_cards: number;
}

export const useArenaData = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'goal' | 'start' | 'info'} | null>(null);
  
  const prevMatchesRef = useRef<Match[]>([]);
  const teamsRef = useRef<Team[]>([]);

  const showNotification = (message: string, type: 'goal' | 'start' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [teamsRes, playersRes, matchesRes, eventsRes, subsRes, statsRes] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('players').select('*'),
        supabase.from('matches').select('*').order('created_at', { ascending: false }),
        supabase.from('match_events').select('*'),
        supabase.from('substitutions').select('*'),
        supabase.from('match_stats').select('*')
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (subsRes.error) throw subsRes.error;
      if (statsRes.error) throw statsRes.error;
      // If no teams exist, seed with initial data
      if ((teamsRes.data as DbTeam[]).length === 0) {
        await seedInitialData();
        return;
      }

      // Map DB data to app types
      const dbTeams = teamsRes.data as DbTeam[];
      const dbPlayers = playersRes.data as DbPlayer[];
      const dbMatches = matchesRes.data as DbMatch[];
      const dbEvents = eventsRes.data as DbMatchEvent[];
      const dbSubs = subsRes.data as DbSubstitution[];
      const dbStats = statsRes.data as DbMatchStats[];
      const mappedTeams: Team[] = dbTeams.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        group: (t.group as 'A' | 'B') || 'A',
        played: t.played,
        won: t.won,
        drawn: t.drawn,
        lost: t.lost,
        gf: t.gf,
        ga: t.ga,
        points: t.points,
        players: dbPlayers
          .filter(p => p.team_id === t.id)
          .map(p => ({
            id: p.id,
            name: p.name,
            goals: p.goals,
            assists: p.assists,
            teamId: p.team_id,
            photoUrl: p.photo_url || undefined,
            marketValue: p.market_value || undefined,
            yellowCards: p.yellow_cards || 0,
            redCards: p.red_cards || 0,
            suspendedUntilMatchId: p.suspended_until_match_id || undefined
          }))
      }));

      const mappedMatches: Match[] = dbMatches.map(m => {
        const teamAStats = dbStats.find(s => s.match_id === m.id && s.team_id === m.team_a_id);
        const teamBStats = dbStats.find(s => s.match_id === m.id && s.team_id === m.team_b_id);
        
        const mapStats = (s: DbMatchStats | undefined): MatchStats | undefined => {
          if (!s) return undefined;
          return {
            id: s.id,
            matchId: s.match_id,
            teamId: s.team_id,
            possession: s.possession,
            shotsOnTarget: s.shots_on_target,
            fouls: s.fouls,
            corners: s.corners,
            yellowCards: s.yellow_cards,
            redCards: s.red_cards
          };
        };

        return {
          id: m.id,
          teamAId: m.team_a_id,
          teamBId: m.team_b_id,
          scoreA: m.score_a,
          scoreB: m.score_b,
          status: m.status as 'pending' | 'live' | 'finished',
          phase: (m.phase as 'group' | 'semifinal' | 'final') || 'group',
          startedAt: m.started_at || undefined,
          half: (m.half as 'first' | 'second' | 'finished') || 'first',
          events: dbEvents
            .filter(e => e.match_id === m.id)
            .map(e => ({
              type: e.event_type as 'goal' | 'assist',
              playerId: e.player_id,
              teamId: e.team_id,
              timestamp: new Date(e.created_at).getTime()
            })),
          substitutions: dbSubs
            .filter(s => s.match_id === m.id)
            .map(s => ({
              id: s.id,
              matchId: s.match_id,
              teamId: s.team_id,
              playerOutId: s.player_out_id,
              playerInId: s.player_in_id,
              minute: s.minute,
              half: s.half as 'first' | 'second'
            })),
          stats: teamAStats && teamBStats ? {
            teamA: mapStats(teamAStats)!,
            teamB: mapStats(teamBStats)!
          } : undefined
        };
      });

      // Check for new events (goals, match starts)
      checkForNewEvents(mappedMatches, mappedTeams);

      setTeams(mappedTeams);
      teamsRef.current = mappedTeams;
      setMatches(mappedMatches);
      prevMatchesRef.current = mappedMatches;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForNewEvents = (newMatches: Match[], currentTeams: Team[]) => {
    newMatches.forEach(newM => {
      const oldM = prevMatchesRef.current.find(m => m.id === newM.id);
      if (!oldM) return;

      if (newM.scoreA > oldM.scoreA || newM.scoreB > oldM.scoreB) {
        const lastEvent = newM.events[newM.events.length - 1];
        const player = currentTeams.flatMap(t => t.players).find(p => p.id === lastEvent?.playerId);
        if (player) {
          showNotification(`GOAL! ${player.name} scores! (${newM.scoreA}-${newM.scoreB})`, 'goal');
        }
      }

      if (oldM.status === 'pending' && newM.status === 'live') {
        const teamA = currentTeams.find(t => t.id === newM.teamAId);
        const teamB = currentTeams.find(t => t.id === newM.teamBId);
        showNotification(`${teamA?.name} vs ${teamB?.name} has just kicked off!`, 'start');
      }
    });
  };

  // Seed initial data
  const seedInitialData = async () => {
    try {
      for (const team of INITIAL_TEAMS) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: team.name,
            color: team.color,
            group: team.group,
            played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0
          })
          .select()
          .single();

        if (teamError) throw teamError;

        const players = team.players.map((p, i) => ({
          name: p.name,
          goals: 0,
          assists: 0,
          team_id: teamData.id,
          photo_url: p.photoUrl,
          market_value: p.marketValue || 10000
        }));

        const { error: playersError } = await supabase.from('players').insert(players);
        if (playersError) throw playersError;
      }

      await fetchData();
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('arena-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'substitutions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_stats' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // CRUD Operations
  const addTeam = async (name: string, color: string, group: 'A' | 'B' = 'A') => {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ name, color, group, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 })
      .select()
      .single();

    if (teamError) { console.error(teamError); return; }

    const players = Array.from({ length: 7 }).map((_, i) => ({
      name: `New Player ${i + 1}`,
      goals: 0,
      assists: 0,
      team_id: teamData.id,
      photo_url: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop",
      market_value: 10000
    }));

    await supabase.from('players').insert(players);
  };

  const deleteTeam = async (teamId: string) => {
    await supabase.from('teams').delete().eq('id', teamId);
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    await supabase.from('teams').update({
      name: updates.name,
      color: updates.color,
      group: updates.group,
      played: updates.played,
      won: updates.won,
      drawn: updates.drawn,
      lost: updates.lost,
      gf: updates.gf,
      ga: updates.ga,
      points: updates.points
    }).eq('id', teamId);
  };

  const updatePlayer = async (playerId: string, teamId: string, updates: { name?: string; photoUrl?: string; marketValue?: number }) => {
    await supabase.from('players').update({
      name: updates.name,
      photo_url: updates.photoUrl,
      market_value: updates.marketValue
    }).eq('id', playerId);
  };

  const transferPlayer = async (playerId: string, currentTeamId: string, targetTeamId: string) => {
    await supabase.from('players').update({ team_id: targetTeamId }).eq('id', playerId);
  };

  const addMatch = async (teamAId: string, teamBId: string, phase: 'group' | 'semifinal' | 'final' = 'group') => {
    await supabase.from('matches').insert({
      team_a_id: teamAId,
      team_b_id: teamBId,
      score_a: 0,
      score_b: 0,
      status: 'pending',
      phase,
      half: 'first'
    });
  };

  const updateMatch = async (match: Match) => {
    await supabase.from('matches').update({
      score_a: match.scoreA,
      score_b: match.scoreB,
      status: match.status,
      phase: match.phase,
      started_at: match.startedAt,
      half: match.half
    }).eq('id', match.id);

    // If match just finished, update team stats
    if (match.status === 'finished' && match.phase === 'group') {
      const teamA = teams.find(t => t.id === match.teamAId);
      const teamB = teams.find(t => t.id === match.teamBId);
      
      if (teamA && teamB) {
        const updateTeamStats = async (team: Team, myScore: number, oppScore: number) => {
          const won = myScore > oppScore ? 1 : 0;
          const drawn = myScore === oppScore ? 1 : 0;
          const lost = myScore < oppScore ? 1 : 0;
          const points = won * 3 + drawn;

          await supabase.from('teams').update({
            played: team.played + 1,
            won: team.won + won,
            drawn: team.drawn + drawn,
            lost: team.lost + lost,
            gf: team.gf + myScore,
            ga: team.ga + oppScore,
            points: team.points + points
          }).eq('id', team.id);
        };

        await updateTeamStats(teamA, match.scoreA, match.scoreB);
        await updateTeamStats(teamB, match.scoreB, match.scoreA);
      }
    }
  };

  const recordGoal = async (matchId: string, playerId: string, teamId: string, isTeamA: boolean, currentMatch: Match) => {
    // Insert match event
    await supabase.from('match_events').insert({
      match_id: matchId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'goal'
    });

    // Update match score
    await supabase.from('matches').update({
      score_a: isTeamA ? currentMatch.scoreA + 1 : currentMatch.scoreA,
      score_b: isTeamA ? currentMatch.scoreB : currentMatch.scoreB + 1
    }).eq('id', matchId);

    // Update player goals
    const player = teams.flatMap(t => t.players).find(p => p.id === playerId);
    if (player) {
      await supabase.from('players').update({
        goals: player.goals + 1
      }).eq('id', playerId);
    }
  };

  const recordSubstitution = async (matchId: string, teamId: string, playerOutId: string, playerInId: string, minute: number, half: 'first' | 'second') => {
    await supabase.from('substitutions').insert({
      match_id: matchId,
      team_id: teamId,
      player_out_id: playerOutId,
      player_in_id: playerInId,
      minute,
      half
    });
  };

  const deleteMatch = async (matchId: string) => {
    await supabase.from('matches').delete().eq('id', matchId);
  };

  const updateMatchStats = async (matchId: string, teamId: string, stats: Partial<MatchStats>) => {
    const existingStats = await supabase.from('match_stats').select('*').eq('match_id', matchId).eq('team_id', teamId).maybeSingle();
    
    if (existingStats.data) {
      await supabase.from('match_stats').update({
        possession: stats.possession,
        shots_on_target: stats.shotsOnTarget,
        fouls: stats.fouls,
        corners: stats.corners,
        yellow_cards: stats.yellowCards,
        red_cards: stats.redCards
      }).eq('id', existingStats.data.id);
    } else {
      await supabase.from('match_stats').insert({
        match_id: matchId,
        team_id: teamId,
        possession: stats.possession ?? 50,
        shots_on_target: stats.shotsOnTarget ?? 0,
        fouls: stats.fouls ?? 0,
        corners: stats.corners ?? 0,
        yellow_cards: stats.yellowCards ?? 0,
        red_cards: stats.redCards ?? 0
      });
    }
  };

  const recordPlayerCard = async (playerId: string, cardType: 'yellow' | 'red', nextMatchId?: string) => {
    const player = teams.flatMap(t => t.players).find(p => p.id === playerId);
    if (!player) return;

    if (cardType === 'yellow') {
      const newYellowCards = player.yellowCards + 1;
      // Check if player should be suspended (every 2 yellow cards)
      const shouldSuspend = newYellowCards % 2 === 0;
      
      await supabase.from('players').update({
        yellow_cards: newYellowCards,
        suspended_until_match_id: shouldSuspend && nextMatchId ? nextMatchId : player.suspendedUntilMatchId
      }).eq('id', playerId);
    } else {
      // Red card - immediate suspension for next match
      await supabase.from('players').update({
        red_cards: player.redCards + 1,
        suspended_until_match_id: nextMatchId || null
      }).eq('id', playerId);
    }
  };

  const clearPlayerSuspension = async (playerId: string) => {
    await supabase.from('players').update({
      suspended_until_match_id: null
    }).eq('id', playerId);
  };

  const resetPlayerCards = async () => {
    await supabase.from('players').update({
      yellow_cards: 0,
      red_cards: 0,
      suspended_until_match_id: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');
  };

  const initMatchStats = async (matchId: string, teamAId: string, teamBId: string) => {
    await Promise.all([
      supabase.from('match_stats').insert({ match_id: matchId, team_id: teamAId, possession: 50, shots_on_target: 0, fouls: 0, corners: 0, yellow_cards: 0, red_cards: 0 }),
      supabase.from('match_stats').insert({ match_id: matchId, team_id: teamBId, possession: 50, shots_on_target: 0, fouls: 0, corners: 0, yellow_cards: 0, red_cards: 0 })
    ]);
  };

  const resetTournament = async () => {
    await supabase.from('match_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('substitutions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('match_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Reset player cards before deleting
    await supabase.from('players').update({
      yellow_cards: 0,
      red_cards: 0,
      suspended_until_match_id: null,
      goals: 0,
      assists: 0
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await seedInitialData();
  };

  return {
    teams,
    matches,
    loading,
    notification,
    addTeam,
    deleteTeam,
    updateTeam,
    updatePlayer,
    transferPlayer,
    addMatch,
    updateMatch,
    recordGoal,
    recordSubstitution,
    deleteMatch,
    resetTournament,
    updateMatchStats,
    initMatchStats,
    recordPlayerCard,
    clearPlayerSuspension,
    resetPlayerCards,
    allPlayers: teams.flatMap(t => t.players)
  };
};
