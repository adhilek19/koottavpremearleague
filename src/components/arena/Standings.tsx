import { Team } from '@/types/arena';
import { Trophy, Shield } from 'lucide-react';

interface StandingsProps {
  teams: Team[];
}

const Standings = ({ teams }: StandingsProps) => {
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

  const renderTable = (group: 'A' | 'B', groupTeams: Team[]) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${group === 'A' ? 'bg-primary/10 text-primary' : 'bg-arena-blue/10 text-arena-blue'}`}>
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Group {group}</h3>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Top 2 Advance</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden border border-secondary/50 shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-4 py-4 w-10">#</th>
              <th className="px-4 py-4">Team</th>
              <th className="px-4 py-4 text-center">P</th>
              <th className="px-4 py-4 text-center">W</th>
              <th className="px-4 py-4 text-center">D</th>
              <th className="px-4 py-4 text-center">L</th>
              <th className="px-4 py-4 text-center">GD</th>
              <th className="px-4 py-4 text-center">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {groupTeams.map((team, i) => (
              <tr key={team.id} className={`hover:bg-secondary/40 transition-colors ${i < 2 ? 'bg-primary/5' : ''}`}>
                <td className="px-4 py-4">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                    i < 2 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }}></div>
                    <span className="font-bold text-secondary-foreground">{team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm">{team.played}</td>
                <td className="px-4 py-4 text-center text-primary text-sm">{team.won}</td>
                <td className="px-4 py-4 text-center text-arena-blue text-sm">{team.drawn}</td>
                <td className="px-4 py-4 text-center text-arena-red text-sm">{team.lost}</td>
                <td className="px-4 py-4 text-center text-muted-foreground text-sm">{team.gf - team.ga}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-black text-sm">
                    {team.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-top-2 duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground">Standings Table</h2>
        <p className="text-muted-foreground">Live rankings of the 5s Arena Tournament Groups</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {renderTable('A', getSortedGroup('A'))}
        {renderTable('B', getSortedGroup('B'))}
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-primary/10 border border-primary/20"></span> Top 2 Advance to Finals
        </div>
      </div>
    </div>
  );
};

export default Standings;
