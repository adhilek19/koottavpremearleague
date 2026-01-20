import { Player, Team, Match } from '@/types/arena';
import { Target, Star, ArrowLeft, Shield, Calendar, Trophy, CircleDollarSign } from 'lucide-react';

interface PlayerProfileProps {
  player: Player;
  team: Team | undefined;
  matches: Match[];
  onBack: () => void;
}

const PlayerProfile = ({ player, team, matches, onBack }: PlayerProfileProps) => {
  const playerMatches = matches.filter(m => 
    (m.teamAId === player.teamId || m.teamBId === player.teamId) && m.status === 'finished'
  );

  const goalsInMatches = (matchId: string) => 
    matches.find(m => m.id === matchId)?.events.filter(e => e.type === 'goal' && e.playerId === player.id).length || 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tournament
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-3xl overflow-hidden relative">
            <div className="h-32 w-full" style={{ backgroundColor: team?.color || '#334155' }}></div>
            <div className="px-6 pb-8 -mt-16 text-center">
              <div className="inline-block p-1 rounded-full bg-card mb-4 border-4 border-card shadow-2xl">
                <img 
                  src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop"} 
                  className="w-32 h-32 rounded-full object-cover"
                  alt={player.name}
                />
              </div>
              <h2 className="text-3xl font-black text-foreground">{player.name}</h2>
              <p className="text-primary font-bold flex items-center justify-center gap-2 mt-1">
                <Shield className="w-4 h-4" />
                {team?.name || 'Unassigned'}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-secondary/50 p-4 rounded-2xl col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black text-foreground">€{(player.marketValue || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Market Value</p>
                    </div>
                  </div>
                  <Trophy className="w-5 h-5 text-amber/20" />
                </div>
                <div className="bg-secondary/50 p-4 rounded-2xl">
                  <Target className="w-6 h-6 text-amber mx-auto mb-2" />
                  <p className="text-2xl font-black text-foreground">{player.goals}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Goals</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-2xl">
                  <Star className="w-6 h-6 text-arena-blue mx-auto mb-2" />
                  <p className="text-2xl font-black text-foreground">{player.assists}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Assists</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Recent Performances
            </h3>
            <span className="text-sm text-muted-foreground">{playerMatches.length} Matches Played</span>
          </div>

          <div className="space-y-4">
            {playerMatches.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>No finished matches for this player yet.</p>
              </div>
            ) : (
              playerMatches.map(match => (
                <div key={match.id} className="glass-card p-5 rounded-2xl flex items-center justify-between hover:border-accent transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-xs font-black text-muted-foreground rotate-180 [writing-mode:vertical-lr]">
                      MATCH
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-secondary-foreground">
                        <span>{matches.find(m => m.id === match.id)?.scoreA}</span>
                        <span className="text-muted">-</span>
                        <span>{matches.find(m => m.id === match.id)?.scoreB}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {match.teamAId === player.teamId ? 'Home Match' : 'Away Match'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-amber">
                        <Target className="w-4 h-4" />
                        <span className="font-bold">{goalsInMatches(match.id)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Goals in Match</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
