import { useState, useMemo } from 'react';
import { Match, Team } from '@/types/arena';
import { Plus, Check, Clock, Play, Users, Calendar, Trash2, Target, X, Swords, Trophy } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  teams: Team[];
  onUpdateMatch: (match: Match) => void;
  onAddMatch: (teamAId: string, teamBId: string, phase?: 'group' | 'semifinal' | 'final') => void;
  onDeleteMatch: (matchId: string) => void;
  onRecordGoal: (matchId: string, playerId: string, teamId: string, match: Match) => void;
  isAdmin: boolean;
}

const MatchList = ({ matches, teams, onUpdateMatch, onAddMatch, onDeleteMatch, onRecordGoal, isAdmin }: MatchListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<'group' | 'semifinal' | 'final'>('group');
  const [scoringContext, setScoringContext] = useState<{ match: Match; teamId: string } | null>(null);

  const handleCreate = () => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      onAddMatch(selectedA, selectedB, selectedPhase);
      setIsAdding(false);
      setSelectedA('');
      setSelectedB('');
    }
  };

  const updateStatus = (match: Match, status: 'live' | 'finished') => {
    if (!isAdmin) return;
    onUpdateMatch({ ...match, status });
  };

  const handleRecordGoal = (playerId: string) => {
    if (!isAdmin || !scoringContext) return;
    const { match, teamId } = scoringContext;
    onRecordGoal(match.id, playerId, teamId, match);
    setScoringContext(null);
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

  const renderMatch = (match: Match) => {
    const teamA = teams.find(t => t.id === match.teamAId);
    const teamB = teams.find(t => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    const scorers = getMatchScorers(match);

    return (
      <div key={match.id} className="glass-card rounded-2xl overflow-hidden hover:border-accent transition-colors group relative border-l-4" style={{borderLeftColor: match.phase === 'final' ? '#fbbf24' : match.phase === 'semifinal' ? '#3b82f6' : 'transparent'}}>
        {isAdmin && (
          <button onClick={() => onDeleteMatch(match.id)} className="absolute top-4 right-4 p-2 bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
              match.status === 'live' ? 'bg-arena-red/20 text-arena-red animate-pulse' :
              match.status === 'finished' ? 'bg-primary/20 text-primary' :
              'bg-secondary text-muted-foreground'
            }`}>
              {match.status === 'live' && <span className="inline-block w-1.5 h-1.5 bg-arena-red rounded-full mr-1"></span>}
              {match.phase && match.phase !== 'group' ? `${match.phase} • ` : ''}{match.status}
            </span>
            {match.phase === 'final' && <Trophy className="w-5 h-5 text-amber" />}
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
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-secondary">
              {match.status === 'pending' && (
                <button onClick={() => updateStatus(match, 'live')} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                  <Play className="w-4 h-4 fill-current" /> Start Match
                </button>
              )}
              {match.status === 'live' && (
                <button onClick={() => updateStatus(match, 'finished')} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                  <Check className="w-4 h-4" /> End Match
                </button>
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
