import { useMemo } from 'react';
import { Player, Team, Match } from '@/types/arena';
import { Target, TrendingUp, ChevronRight, Users, ShieldCheck } from 'lucide-react';

interface StatsProps {
  players: Player[];
  teams: Team[];
  matches: Match[];
  onPlayerClick: (playerId: string) => void;
}

const Stats = ({ players, teams, matches, onPlayerClick }: StatsProps) => {
  // Only count goals from finished matches
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished'), [matches]);
  
  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);
  
  const totalGoals = useMemo(() => teams.reduce((sum, t) => sum + t.gf, 0), [teams]);

  // Calculate clean sheets per team (matches where they conceded 0 goals)
  const cleanSheets = useMemo(() => {
    const teamCleanSheets: { team: Team; count: number }[] = [];
    
    teams.forEach(team => {
      let cleanSheetCount = 0;
      finishedMatches.forEach(match => {
        if (match.teamAId === team.id && match.scoreB === 0) {
          cleanSheetCount++;
        } else if (match.teamBId === team.id && match.scoreA === 0) {
          cleanSheetCount++;
        }
      });
      if (cleanSheetCount > 0) {
        teamCleanSheets.push({ team, count: cleanSheetCount });
      }
    });
    
    return teamCleanSheets.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [teams, finishedMatches]);

  // Only show scorers from finished matches
  const topScorers = useMemo(() => 
    [...players].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5), 
    [players]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground">Player Statistics</h2>
        <p className="text-muted-foreground">Top performers across all finished tournament matches</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: totalGoals, icon: Target, color: 'text-amber' },
          { label: 'Matches Played', value: finishedMatches.length, icon: TrendingUp, color: 'text-primary' },
          { label: 'Active Players', value: players.length, icon: Users, color: 'text-arena-blue' },
          { label: 'Clean Sheets', value: cleanSheets.reduce((sum, cs) => sum + cs.count, 0), icon: ShieldCheck, color: 'text-primary' },
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
            {topScorers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No goals scored yet.</p>
                <p className="text-xs mt-1">Stats will appear after matches finish.</p>
              </div>
            ) : (
              topScorers.map((player, i) => {
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
              })
            )}
          </div>
        </div>

        {/* Clean Sheets */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <ShieldCheck className="w-6 h-6" />
            <h3>Clean Sheets</h3>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden border border-secondary">
            {cleanSheets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No clean sheets yet.</p>
                <p className="text-xs mt-1">Teams that concede 0 goals will appear here.</p>
              </div>
            ) : (
              cleanSheets.map((item, i) => (
                <div 
                  key={item.team.id} 
                  className="flex items-center justify-between p-4 border-b border-secondary last:border-0 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-sm font-black text-muted-foreground">{i + 1}</span>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2 font-black text-lg"
                      style={{ borderColor: item.team.color, color: item.team.color }}
                    >
                      {item.team.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{item.team.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-tighter font-semibold">Group {item.team.group}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="font-black text-primary">{item.count}</span>
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

export default Stats;
