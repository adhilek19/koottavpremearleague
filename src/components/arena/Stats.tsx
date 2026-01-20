import { useMemo } from 'react';
import { Player, Team } from '@/types/arena';
import { Target, Star, TrendingUp, ChevronRight, Users } from 'lucide-react';

interface StatsProps {
  players: Player[];
  teams: Team[];
  onPlayerClick: (playerId: string) => void;
}

const Stats = ({ players, teams, onPlayerClick }: StatsProps) => {
  const topScorers = useMemo(() => 
    [...players].sort((a, b) => b.goals - a.goals).slice(0, 5), 
    [players]
  );

  const topAssisters = useMemo(() => 
    [...players].sort((a, b) => b.assists - a.assists).slice(0, 5), 
    [players]
  );

  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);
  
  const totalGoals = useMemo(() => players.reduce((sum, p) => sum + p.goals, 0), [players]);
  const totalAssists = useMemo(() => players.reduce((sum, p) => sum + p.assists, 0), [players]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground">Player Statistics</h2>
        <p className="text-muted-foreground">Top performers across all tournament matches</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: totalGoals, icon: Target, color: 'text-amber' },
          { label: 'Total Assists', value: totalAssists, icon: Star, color: 'text-arena-blue' },
          { label: 'Active Players', value: players.length, icon: Users, color: 'text-primary' },
          { label: 'G+A Combined', value: totalGoals + totalAssists, icon: TrendingUp, color: 'text-arena-red' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl text-center">
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Scorers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-amber">
            <Target className="w-6 h-6" />
            <h3>Top Scorers</h3>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden border border-secondary">
            {topScorers.map((player, i) => {
              const team = getTeam(player.teamId);
              return (
                <div 
                  key={player.id} 
                  onClick={() => onPlayerClick(player.id)}
                  className="flex items-center justify-between p-4 border-b border-secondary last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-sm font-black text-muted-foreground">{i + 1}</span>
                    <img 
                      src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} 
                      className="w-10 h-10 rounded-full object-cover border border-secondary group-hover:border-amber transition-colors"
                      alt={player.name}
                    />
                    <div>
                      <p className="font-bold text-foreground group-hover:text-amber transition-colors">{player.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-tighter font-semibold">{team?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-amber/10 px-3 py-1 rounded-lg">
                      <Target className="w-4 h-4 text-amber" />
                      <span className="font-black text-amber">{player.goals}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Assisters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-arena-blue">
            <Star className="w-6 h-6" />
            <h3>Top Assisters</h3>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden border border-secondary">
            {topAssisters.map((player, i) => {
              const team = getTeam(player.teamId);
              return (
                <div 
                  key={player.id} 
                  onClick={() => onPlayerClick(player.id)}
                  className="flex items-center justify-between p-4 border-b border-secondary last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-sm font-black text-muted-foreground">{i + 1}</span>
                    <img 
                      src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} 
                      className="w-10 h-10 rounded-full object-cover border border-secondary group-hover:border-arena-blue transition-colors"
                      alt={player.name}
                    />
                    <div>
                      <p className="font-bold text-foreground group-hover:text-arena-blue transition-colors">{player.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-tighter font-semibold">{team?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-arena-blue/10 px-3 py-1 rounded-lg">
                      <div className="w-4 h-4 flex items-center justify-center rounded bg-arena-blue text-[10px] text-white font-bold">A</div>
                      <span className="font-black text-arena-blue">{player.assists}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
