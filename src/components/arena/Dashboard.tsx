import { Team, Match, AppView } from '@/types/arena';
import { Trophy, TrendingUp, Users, Play, Clock, Zap } from 'lucide-react';

interface DashboardProps {
  teams: Team[];
  matches: Match[];
  setView: (view: AppView) => void;
  isAdmin: boolean;
}

const Dashboard = ({ teams, matches, setView, isAdmin }: DashboardProps) => {
  const liveMatches = matches.filter(m => m.status === 'live');
  const totalGoals = teams.reduce((acc, t) => acc + t.gf, 0);
  
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.gf - a.ga;
    const diffB = b.gf - b.ga;
    return diffB - diffA;
  });

  const leader = sortedTeams[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-time Sync Active</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">Arena Dashboard</h2>
          <p className="text-muted-foreground">8 Teams • 56 Players • Live Stats Tracking</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setView('matches')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 w-fit"
          >
            <Play className="w-5 h-5 fill-current" />
            Manage Live Matches
          </button>
        )}
        {!isAdmin && (
          <div className="flex items-center gap-2 text-muted-foreground px-4 py-2 border border-secondary rounded-xl bg-secondary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Spectator Mode</span>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Matches', value: matches.length, icon: Clock, color: 'text-arena-blue' },
          { label: 'Goals Scored', value: totalGoals, icon: TrendingUp, color: 'text-primary' },
          { label: 'Live Now', value: liveMatches.length, icon: Play, color: 'text-arena-red', pulse: liveMatches.length > 0 },
          { label: 'Total Players', value: 56, icon: Users, color: 'text-amber' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
            {stat.pulse && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-arena-red rounded-full m-3 animate-pulse"></div>
            )}
            <div className="p-3 rounded-xl bg-secondary text-foreground">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Standings Snippet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber" />
              Live Table Standings
            </h3>
            <button onClick={() => setView('standings')} className="text-primary text-sm font-semibold hover:underline">
              Full Table
            </button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden border border-secondary/50 shadow-xl">
            <table className="w-full text-left">
              <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4"># Team</th>
                  <th className="px-6 py-4 text-center">P</th>
                  <th className="px-6 py-4 text-center">W</th>
                  <th className="px-6 py-4 text-center">GD</th>
                  <th className="px-6 py-4 text-center">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {sortedTeams.slice(0, 4).map((team, i) => (
                  <tr key={team.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: team.color }}></div>
                      <span className="font-semibold text-secondary-foreground">{team.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground text-sm">{team.played}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground text-sm">{team.won}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground text-sm">{team.gf - team.ga}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Arena Leader */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Arena Leader</h3>
          <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden group border border-primary/10 shadow-primary/5 shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-amber" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className="w-24 h-24 rounded-full border-4 border-secondary flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xl"
                style={{ borderColor: leader.color }}
              >
                <Trophy className="w-10 h-10" style={{ color: leader.color }} />
              </div>
              <h4 className="text-2xl font-black text-foreground tracking-tight">{leader.name}</h4>
              <p className="text-muted-foreground font-medium mb-6 uppercase text-[10px] tracking-widest">Tournament Top Seed</p>
              
              <div className="flex gap-4 w-full justify-center">
                <div className="bg-secondary/80 rounded-2xl p-4 flex-1 border border-secondary">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Wins</p>
                  <p className="text-2xl font-black text-primary">{leader.won}</p>
                </div>
                <div className="bg-secondary/80 rounded-2xl p-4 flex-1 border border-secondary">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Goals</p>
                  <p className="text-2xl font-black text-arena-blue">{leader.gf}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
