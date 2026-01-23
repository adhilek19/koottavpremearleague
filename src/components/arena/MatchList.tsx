import { useState, useMemo, useEffect } from 'react';
import { Match, Team, Player, MatchStats } from '@/types/arena';
import { Plus, Check, Clock, Play, Users, Calendar, Trash2, Target, X, Swords, Trophy, Timer, ArrowRightLeft, Pause, BarChart3, TrendingUp, AlertTriangle, Flag, Square } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  teams: Team[];
  onUpdateMatch: (match: Match) => void;
  onAddMatch: (teamAId: string, teamBId: string, phase?: 'group' | 'semifinal' | 'final') => void;
  onDeleteMatch: (matchId: string) => void;
  onRecordGoal: (matchId: string, playerId: string, teamId: string, match: Match) => void;
  onRecordSubstitution?: (matchId: string, teamId: string, playerOutId: string, playerInId: string, minute: number, half: 'first' | 'second') => void;
  onUpdateMatchStats?: (matchId: string, teamId: string, stats: Partial<MatchStats>) => void;
  onInitMatchStats?: (matchId: string, teamAId: string, teamBId: string) => void;
  onRecordPlayerCard?: (playerId: string, cardType: 'yellow' | 'red', nextMatchId?: string) => void;
  isAdmin: boolean;
}

const MatchList = ({ matches, teams, onUpdateMatch, onAddMatch, onDeleteMatch, onRecordGoal, onRecordSubstitution, onUpdateMatchStats, onInitMatchStats, onRecordPlayerCard, isAdmin }: MatchListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<'group' | 'semifinal' | 'final'>('group');
  const [scoringContext, setScoringContext] = useState<{ match: Match; teamId: string } | null>(null);
  const [subContext, setSubContext] = useState<{ match: Match; teamId: string; step: 'out' | 'in'; playerOutId?: string } | null>(null);
  const [matchTimers, setMatchTimers] = useState<Record<string, number>>({});
  const [statsContext, setStatsContext] = useState<{ match: Match } | null>(null);
  const [cardContext, setCardContext] = useState<{ match: Match; teamId: string; cardType: 'yellow' | 'red' } | null>(null);

  // Timer logic for live matches
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<string, number> = {};
      matches.forEach(match => {
        if (match.status === 'live' && match.startedAt) {
          const startTime = new Date(match.startedAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          newTimers[match.id] = elapsed;
        }
      });
      setMatchTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [matches]);

  const formatMatchTime = (matchId: string, half: string | undefined) => {
    const totalSeconds = matchTimers[matchId] || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const displayMinutes = half === 'second' ? minutes + 45 : minutes;
    return `${String(Math.min(displayMinutes, 90)).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getMatchMinute = (matchId: string, half: string | undefined) => {
    const totalSeconds = matchTimers[matchId] || 0;
    const minutes = Math.floor(totalSeconds / 60);
    return half === 'second' ? minutes + 45 : minutes;
  };

  const handleCreate = () => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      onAddMatch(selectedA, selectedB, selectedPhase);
      setIsAdding(false);
      setSelectedA('');
      setSelectedB('');
    }
  };

  const startMatch = (match: Match) => {
    if (!isAdmin) return;
    // Initialize match stats when starting
    if (onInitMatchStats) {
      onInitMatchStats(match.id, match.teamAId, match.teamBId);
    }
    onUpdateMatch({ 
      ...match, 
      status: 'live', 
      startedAt: new Date().toISOString(),
      half: 'first'
    });
  };

  const startSecondHalf = (match: Match) => {
    if (!isAdmin) return;
    onUpdateMatch({ 
      ...match, 
      startedAt: new Date().toISOString(),
      half: 'second'
    });
  };

  const endMatch = (match: Match) => {
    if (!isAdmin) return;
    onUpdateMatch({ ...match, status: 'finished', half: 'finished' });
  };

  const handleRecordGoal = (playerId: string) => {
    if (!isAdmin || !scoringContext) return;
    const { match, teamId } = scoringContext;
    onRecordGoal(match.id, playerId, teamId, match);
    setScoringContext(null);
  };

  const handleSubstitution = (playerId: string) => {
    if (!isAdmin || !subContext || !onRecordSubstitution) return;
    
    if (subContext.step === 'out') {
      setSubContext({ ...subContext, step: 'in', playerOutId: playerId });
    } else if (subContext.playerOutId) {
      const minute = getMatchMinute(subContext.match.id, subContext.match.half);
      onRecordSubstitution(
        subContext.match.id,
        subContext.teamId,
        subContext.playerOutId,
        playerId,
        minute,
        (subContext.match.half as 'first' | 'second') || 'first'
      );
      setSubContext(null);
    }
  };

  const handleUpdateStat = async (matchId: string, teamId: string, field: keyof MatchStats, delta: number) => {
    if (!onUpdateMatchStats) return;
    const match = matches.find(m => m.id === matchId);
    if (!match?.stats) return;
    
    const isTeamA = teamId === match.teamAId;
    const currentStats = isTeamA ? match.stats.teamA : match.stats.teamB;
    const otherStats = isTeamA ? match.stats.teamB : match.stats.teamA;
    
    let newValue = Math.max(0, (currentStats[field] as number) + delta);
    
    // Special handling for possession (must sum to 100)
    if (field === 'possession') {
      newValue = Math.min(100, Math.max(0, newValue));
      await onUpdateMatchStats(matchId, teamId, { possession: newValue });
      await onUpdateMatchStats(matchId, isTeamA ? match.teamBId : match.teamAId, { possession: 100 - newValue });
    } else {
      await onUpdateMatchStats(matchId, teamId, { [field]: newValue });
    }
  };

  const handleRecordCard = async (playerId: string) => {
    if (!cardContext || !onRecordPlayerCard) return;
    // Find next pending match for this team to set suspension
    const nextMatch = matches.find(m => 
      m.status === 'pending' && 
      (m.teamAId === cardContext.teamId || m.teamBId === cardContext.teamId)
    );
    await onRecordPlayerCard(playerId, cardContext.cardType, nextMatch?.id);
    
    // Also update match stats for visual tracking
    if (onUpdateMatchStats && cardContext.match.stats) {
      const currentStats = cardContext.teamId === cardContext.match.teamAId 
        ? cardContext.match.stats.teamA 
        : cardContext.match.stats.teamB;
      
      if (cardContext.cardType === 'yellow') {
        await onUpdateMatchStats(cardContext.match.id, cardContext.teamId, { 
          yellowCards: currentStats.yellowCards + 1 
        });
      } else {
        await onUpdateMatchStats(cardContext.match.id, cardContext.teamId, { 
          redCards: currentStats.redCards + 1 
        });
      }
    }
    setCardContext(null);
  };

  const getSortedGroup = (group: 'A' | 'B') => {
    return [...teams]
      .filter(t => t.group === group)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const diffA = a.gf - a.ga;
        const diffB = b.gf - b.ga;
        if (diffB !== diffA) return diffB - diffA;
        return b.gf - a.gf;
      });
  };

  const generateKnockout = (phase: 'semifinal' | 'final') => {
    if (phase === 'semifinal') {
      const groupA = getSortedGroup('A');
      const groupB = getSortedGroup('B');
      if (groupA.length < 2 || groupB.length < 2) {
        alert("Need at least 2 teams in each group to start Semifinals.");
        return;
      }
      onAddMatch(groupA[0].id, groupB[1].id, 'semifinal');
      onAddMatch(groupB[0].id, groupA[1].id, 'semifinal');
    } else if (phase === 'final') {
      const semiMatches = matches.filter(m => m.phase === 'semifinal' && m.status === 'finished');
      if (semiMatches.length < 2) {
        alert("Finish both Semifinal matches first.");
        return;
      }
      const winner1 = semiMatches[0].scoreA > semiMatches[0].scoreB ? semiMatches[0].teamAId : semiMatches[0].teamBId;
      const winner2 = semiMatches[1].scoreA > semiMatches[1].scoreB ? semiMatches[1].teamAId : semiMatches[1].teamBId;
      onAddMatch(winner1, winner2, 'final');
    }
  };

  const groupedMatches = useMemo(() => ({
    final: matches.filter(m => m.phase === 'final'),
    semifinal: matches.filter(m => m.phase === 'semifinal'),
    group: matches.filter(m => !m.phase || m.phase === 'group')
  }), [matches]);

  // Get goal scorers for a match
  const getMatchScorers = (match: Match) => {
    const scorers: { teamA: string[]; teamB: string[] } = { teamA: [], teamB: [] };
    match.events
      .filter(e => e.type === 'goal')
      .forEach(event => {
        const player = teams.flatMap(t => t.players).find(p => p.id === event.playerId);
        if (player) {
          if (event.teamId === match.teamAId) {
            scorers.teamA.push(player.name);
          } else {
            scorers.teamB.push(player.name);
          }
        }
      });
    return scorers;
  };

  // Get substitutions for a match by team
  const getMatchSubstitutions = (match: Match, teamId: string) => {
    return (match.substitutions || [])
      .filter(s => s.teamId === teamId)
      .map(s => {
        const playerOut = teams.flatMap(t => t.players).find(p => p.id === s.playerOutId);
        const playerIn = teams.flatMap(t => t.players).find(p => p.id === s.playerInId);
        return { ...s, playerOutName: playerOut?.name || 'Unknown', playerInName: playerIn?.name || 'Unknown' };
      });
  };

  const renderMatch = (match: Match) => {
    const teamA = teams.find(t => t.id === match.teamAId);
    const teamB = teams.find(t => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    const scorers = getMatchScorers(match);
    const subsA = getMatchSubstitutions(match, teamA.id);
    const subsB = getMatchSubstitutions(match, teamB.id);

    return (
      <div key={match.id} className="glass-card rounded-2xl overflow-hidden hover:border-accent transition-colors group relative border-l-4" style={{borderLeftColor: match.phase === 'final' ? '#fbbf24' : match.phase === 'semifinal' ? '#3b82f6' : 'transparent'}}>
        {isAdmin && (
          <button onClick={() => onDeleteMatch(match.id)} className="absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 z-10">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                match.status === 'live' ? 'bg-arena-red/20 text-arena-red animate-pulse' :
                match.status === 'finished' ? 'bg-primary/20 text-primary' :
                'bg-secondary text-muted-foreground'
              }`}>
                {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 bg-arena-red rounded-full mr-1"></span>}
                {match.phase && match.phase !== 'group' ? `${match.phase} • ` : ''}{match.status}
              </span>
              {match.status === 'live' && match.half && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {match.half === 'first' ? '1st Half' : match.half === 'second' ? '2nd Half' : 'FT'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {match.status === 'live' && (
                <div className="flex items-center gap-1.5 bg-arena-red/10 px-3 py-1.5 rounded-lg">
                  <Timer className="w-4 h-4 text-arena-red animate-pulse" />
                  <span className="font-mono font-black text-arena-red text-sm">
                    {formatMatchTime(match.id, match.half)}
                  </span>
                </div>
              )}
              {match.phase === 'final' && <Trophy className="w-5 h-5 text-amber" />}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ backgroundColor: teamA.color + '20', borderColor: teamA.color, borderWidth: 2 }}>
                <span className="text-2xl font-black" style={{ color: teamA.color }}>{teamA.name.charAt(0)}</span>
              </div>
              <p className="font-bold text-secondary-foreground text-sm">{teamA.name}</p>
              {/* Team A Scorers */}
              {(match.status === 'live' || match.status === 'finished') && scorers.teamA.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {scorers.teamA.map((name, i) => (
                    <p key={i} className="text-[10px] text-amber flex items-center justify-center gap-1">
                      <Target className="w-3 h-3" /> {name}
                    </p>
                  ))}
                </div>
              )}
              {/* Team A Substitutions */}
              {subsA.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {subsA.map((sub, i) => (
                    <p key={i} className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-arena-blue" />
                      <span className="text-arena-red">{sub.playerOutName}</span>
                      <span>→</span>
                      <span className="text-primary">{sub.playerInName}</span>
                      <span className="opacity-60">{sub.minute}'</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                {isAdmin && match.status === 'live' && (
                  <button onClick={() => setScoringContext({ match, teamId: teamA.id })} className="w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </button>
                )}
                <span className="text-4xl font-black text-foreground tracking-tight">{match.scoreA}</span>
                <span className="text-2xl font-bold text-muted-foreground">:</span>
                <span className="text-4xl font-black text-foreground tracking-tight">{match.scoreB}</span>
                {isAdmin && match.status === 'live' && (
                  <button onClick={() => setScoringContext({ match, teamId: teamB.id })} className="w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ backgroundColor: teamB.color + '20', borderColor: teamB.color, borderWidth: 2 }}>
                <span className="text-2xl font-black" style={{ color: teamB.color }}>{teamB.name.charAt(0)}</span>
              </div>
              <p className="font-bold text-secondary-foreground text-sm">{teamB.name}</p>
              {/* Team B Scorers */}
              {(match.status === 'live' || match.status === 'finished') && scorers.teamB.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {scorers.teamB.map((name, i) => (
                    <p key={i} className="text-[10px] text-amber flex items-center justify-center gap-1">
                      <Target className="w-3 h-3" /> {name}
                    </p>
                  ))}
                </div>
              )}
              {/* Team B Substitutions */}
              {subsB.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {subsB.map((sub, i) => (
                    <p key={i} className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-arena-blue" />
                      <span className="text-arena-red">{sub.playerOutName}</span>
                      <span>→</span>
                      <span className="text-primary">{sub.playerInName}</span>
                      <span className="opacity-60">{sub.minute}'</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Statistics Display */}
          {(match.status === 'live' || match.status === 'finished') && match.stats && (
            <div className="mt-4 pt-4 border-t border-secondary">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Match Stats
                </h4>
                {isAdmin && match.status === 'live' && onUpdateMatchStats && (
                  <button onClick={() => setStatsContext({ match })} className="text-[10px] font-bold text-primary hover:underline">
                    Edit Stats
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {/* Possession */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold w-8 text-right" style={{ color: teamA.color }}>{match.stats.teamA.possession}%</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden flex">
                    <div className="h-full transition-all duration-300" style={{ width: `${match.stats.teamA.possession}%`, backgroundColor: teamA.color }}></div>
                    <div className="h-full transition-all duration-300" style={{ width: `${match.stats.teamB.possession}%`, backgroundColor: teamB.color }}></div>
                  </div>
                  <span className="text-xs font-bold w-8" style={{ color: teamB.color }}>{match.stats.teamB.possession}%</span>
                </div>
                {/* Other Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-secondary/50">
                    <span className="text-xs font-bold" style={{ color: teamA.color }}>{match.stats.teamA.shotsOnTarget}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Shots</span>
                    <span className="text-xs font-bold" style={{ color: teamB.color }}>{match.stats.teamB.shotsOnTarget}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-secondary/50">
                    <span className="text-xs font-bold" style={{ color: teamA.color }}>{match.stats.teamA.fouls}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Fouls</span>
                    <span className="text-xs font-bold" style={{ color: teamB.color }}>{match.stats.teamB.fouls}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-secondary/50">
                    <span className="text-xs font-bold" style={{ color: teamA.color }}>{match.stats.teamA.corners}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Flag className="w-3 h-3" /> Corners</span>
                    <span className="text-xs font-bold" style={{ color: teamB.color }}>{match.stats.teamB.corners}</span>
                  </div>
                </div>
                {/* Cards */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-amber/10">
                    <span className="text-xs font-bold text-amber">{match.stats.teamA.yellowCards}</span>
                    <span className="text-[9px] text-amber flex items-center gap-1"><Square className="w-3 h-3 fill-amber" /> Yellow</span>
                    <span className="text-xs font-bold text-amber">{match.stats.teamB.yellowCards}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-arena-red/10">
                    <span className="text-xs font-bold text-arena-red">{match.stats.teamA.redCards}</span>
                    <span className="text-[9px] text-arena-red flex items-center gap-1"><Square className="w-3 h-3 fill-arena-red" /> Red</span>
                    <span className="text-xs font-bold text-arena-red">{match.stats.teamB.redCards}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-secondary">
              {match.status === 'pending' && (
                <button onClick={() => startMatch(match)} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                  <Play className="w-4 h-4 fill-current" /> Start Match
                </button>
              )}
              {match.status === 'live' && match.half === 'first' && (
                <button onClick={() => startSecondHalf(match)} className="flex-1 flex items-center justify-center gap-2 bg-arena-blue/10 text-arena-blue py-2 rounded-xl font-bold text-sm hover:bg-arena-blue hover:text-white transition-all">
                  <Pause className="w-4 h-4" /> Half Time → 2nd Half
                </button>
              )}
              {match.status === 'live' && (
                <>
                  <button onClick={() => endMatch(match)} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                    <Check className="w-4 h-4" /> End Match
                  </button>
                  {onRecordSubstitution && (
                    <>
                      <button onClick={() => setSubContext({ match, teamId: teamA.id, step: 'out' })} className="flex items-center justify-center gap-1 bg-secondary text-secondary-foreground py-2 px-3 rounded-xl font-bold text-xs hover:bg-accent transition-all">
                        <ArrowRightLeft className="w-3 h-3" /> Sub {teamA.name.slice(0,3)}
                      </button>
                      <button onClick={() => setSubContext({ match, teamId: teamB.id, step: 'out' })} className="flex items-center justify-center gap-1 bg-secondary text-secondary-foreground py-2 px-3 rounded-xl font-bold text-xs hover:bg-accent transition-all">
                        <ArrowRightLeft className="w-3 h-3" /> Sub {teamB.name.slice(0,3)}
                      </button>
                    </>
                  )}
                  {onRecordPlayerCard && (
                    <>
                      <button onClick={() => setCardContext({ match, teamId: teamA.id, cardType: 'yellow' })} className="flex items-center justify-center gap-1 bg-amber/10 text-amber py-2 px-3 rounded-xl font-bold text-xs hover:bg-amber/20 transition-all">
                        <Square className="w-3 h-3 fill-amber" /> Card {teamA.name.slice(0,3)}
                      </button>
                      <button onClick={() => setCardContext({ match, teamId: teamB.id, cardType: 'yellow' })} className="flex items-center justify-center gap-1 bg-amber/10 text-amber py-2 px-3 rounded-xl font-bold text-xs hover:bg-amber/20 transition-all">
                        <Square className="w-3 h-3 fill-amber" /> Card {teamB.name.slice(0,3)}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Scorer Modal */}
      {scoringContext && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-primary/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" /> Select Scorer
              </h3>
              <button onClick={() => setScoringContext(null)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teams.find(t => t.id === scoringContext.teamId)?.players.map(player => (
                <button key={player.id} onClick={() => handleRecordGoal(player.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                  <img src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} className="w-10 h-10 rounded-full object-cover border border-secondary" alt={player.name} />
                  <span className="font-bold text-secondary-foreground">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Substitution Modal */}
      {subContext && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-arena-blue/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-arena-blue" />
                {subContext.step === 'out' ? 'Select Player OUT' : 'Select Player IN'}
              </h3>
              <button onClick={() => setSubContext(null)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teams.find(t => t.id === subContext.teamId)?.players
                .filter(p => subContext.step === 'in' ? p.id !== subContext.playerOutId : true)
                .map(player => (
                <button key={player.id} onClick={() => handleSubstitution(player.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left ${subContext.step === 'out' ? 'hover:bg-arena-red/10' : 'hover:bg-primary/10'}`}>
                  <img src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} className="w-10 h-10 rounded-full object-cover border border-secondary" alt={player.name} />
                  <span className="font-bold text-secondary-foreground">{player.name}</span>
                  {subContext.step === 'out' && <span className="ml-auto text-xs text-arena-red">OUT</span>}
                  {subContext.step === 'in' && <span className="ml-auto text-xs text-primary">IN</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Editor Modal */}
      {statsContext && statsContext.match.stats && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 border border-primary/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" /> Edit Match Stats
              </h3>
              <button onClick={() => setStatsContext(null)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            
            {(() => {
              const teamA = teams.find(t => t.id === statsContext.match.teamAId);
              const teamB = teams.find(t => t.id === statsContext.match.teamBId);
              const stats = statsContext.match.stats!;
              
              const StatRow = ({ label, field, icon: Icon }: { label: string; field: keyof MatchStats; icon: React.ElementType }) => (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => handleUpdateStat(statsContext.match.id, statsContext.match.teamAId, field, -1)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-destructive/20 text-secondary-foreground flex items-center justify-center font-bold">−</button>
                    <span className="text-sm font-bold w-6 text-center" style={{ color: teamA?.color }}>{stats.teamA[field] as number}</span>
                    <button onClick={() => handleUpdateStat(statsContext.match.id, statsContext.match.teamAId, field, 1)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-primary/20 text-secondary-foreground flex items-center justify-center font-bold">+</button>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide w-20 text-center">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button onClick={() => handleUpdateStat(statsContext.match.id, statsContext.match.teamBId, field, -1)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-destructive/20 text-secondary-foreground flex items-center justify-center font-bold">−</button>
                    <span className="text-sm font-bold w-6 text-center" style={{ color: teamB?.color }}>{stats.teamB[field] as number}</span>
                    <button onClick={() => handleUpdateStat(statsContext.match.id, statsContext.match.teamBId, field, 1)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-primary/20 text-secondary-foreground flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              );
              
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    <span style={{ color: teamA?.color }}>{teamA?.name}</span>
                    <span style={{ color: teamB?.color }}>{teamB?.name}</span>
                  </div>
                  <StatRow label="Possession" field="possession" icon={TrendingUp} />
                  <StatRow label="Shots" field="shotsOnTarget" icon={Target} />
                  <StatRow label="Fouls" field="fouls" icon={AlertTriangle} />
                  <StatRow label="Corners" field="corners" icon={Flag} />
                  <StatRow label="Yellow" field="yellowCards" icon={Square} />
                  <StatRow label="Red" field="redCards" icon={Square} />
                </div>
              );
            })()}
            
            <button onClick={() => setStatsContext(null)} className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Card Modal */}
      {cardContext && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-amber/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Square className={`w-6 h-6 ${cardContext.cardType === 'yellow' ? 'text-amber fill-amber' : 'text-arena-red fill-arena-red'}`} />
                Issue {cardContext.cardType === 'yellow' ? 'Yellow' : 'Red'} Card
              </h3>
              <button onClick={() => setCardContext(null)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Card Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setCardContext({ ...cardContext, cardType: 'yellow' })}
                className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  cardContext.cardType === 'yellow' ? 'bg-amber text-black' : 'bg-amber/10 text-amber hover:bg-amber/20'
                }`}
              >
                <Square className="w-4 h-4 fill-current" /> Yellow
              </button>
              <button 
                onClick={() => setCardContext({ ...cardContext, cardType: 'red' })}
                className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  cardContext.cardType === 'red' ? 'bg-arena-red text-white' : 'bg-arena-red/10 text-arena-red hover:bg-arena-red/20'
                }`}
              >
                <Square className="w-4 h-4 fill-current" /> Red
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teams.find(t => t.id === cardContext.teamId)?.players.map(player => (
                <button 
                  key={player.id} 
                  onClick={() => handleRecordCard(player.id)} 
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    cardContext.cardType === 'yellow' ? 'hover:bg-amber/10' : 'hover:bg-arena-red/10'
                  }`}
                >
                  <img src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} className="w-10 h-10 rounded-full object-cover border border-secondary" alt={player.name} />
                  <div className="flex-1">
                    <span className="font-bold text-secondary-foreground">{player.name}</span>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {player.yellowCards > 0 && (
                        <span className="flex items-center gap-0.5 text-amber">
                          <Square className="w-3 h-3 fill-amber" /> {player.yellowCards}
                        </span>
                      )}
                      {player.redCards > 0 && (
                        <span className="flex items-center gap-0.5 text-arena-red">
                          <Square className="w-3 h-3 fill-arena-red" /> {player.redCards}
                        </span>
                      )}
                      {player.suspendedUntilMatchId && (
                        <span className="text-destructive font-bold">SUSPENDED</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">Match Center</h2>
          <p className="text-muted-foreground">Group Stages, Semifinals & Grand Final</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95">
              <Plus className="w-5 h-5" /> New Match
            </button>
            <button onClick={() => generateKnockout('semifinal')} className="flex items-center gap-2 bg-arena-blue/20 text-arena-blue font-bold py-2.5 px-5 rounded-xl hover:bg-arena-blue hover:text-white transition-all">
              <Swords className="w-5 h-5" /> Generate Semis
            </button>
            <button onClick={() => generateKnockout('final')} className="flex items-center gap-2 bg-amber/20 text-amber font-bold py-2.5 px-5 rounded-xl hover:bg-amber hover:text-black transition-all">
              <Trophy className="w-5 h-5" /> Generate Final
            </button>
          </div>
        )}
      </div>

      {/* Add Match Modal */}
      {isAdding && (
        <div className="glass-card p-6 rounded-2xl border border-primary/20 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Schedule New Match</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <select value={selectedA} onChange={e => setSelectedA(e.target.value)} className="bg-secondary text-secondary-foreground p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select Team A</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={selectedB} onChange={e => setSelectedB(e.target.value)} className="bg-secondary text-secondary-foreground p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select Team B</option>
              {teams.filter(t => t.id !== selectedA).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={selectedPhase} onChange={e => setSelectedPhase(e.target.value as 'group' | 'semifinal' | 'final')} className="bg-secondary text-secondary-foreground p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary">
              <option value="group">Group Stage</option>
              <option value="semifinal">Semifinal</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!selectedA || !selectedB || selectedA === selectedB} className="flex items-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 px-5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              <Calendar className="w-4 h-4" /> Schedule
            </button>
            <button onClick={() => setIsAdding(false)} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold py-2.5 px-5 rounded-xl">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Matches by Phase */}
      {groupedMatches.final.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-amber flex items-center gap-2"><Trophy className="w-5 h-5" /> Grand Final</h3>
          <div className="grid md:grid-cols-1 gap-4">{groupedMatches.final.map(renderMatch)}</div>
        </div>
      )}
      {groupedMatches.semifinal.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-arena-blue flex items-center gap-2"><Swords className="w-5 h-5" /> Semifinals</h3>
          <div className="grid md:grid-cols-2 gap-4">{groupedMatches.semifinal.map(renderMatch)}</div>
        </div>
      )}
      {groupedMatches.group.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-muted-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Group Stage</h3>
          <div className="grid md:grid-cols-2 gap-4">{groupedMatches.group.map(renderMatch)}</div>
        </div>
      )}
      {matches.length === 0 && (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No matches scheduled yet.</p>
          {isAdmin && <p className="text-xs text-primary mt-2">Click "New Match" to get started.</p>}
        </div>
      )}
    </div>
  );
};

export default MatchList;
