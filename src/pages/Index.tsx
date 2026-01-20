import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Team, Match, AppView, Player, MatchEvent } from '@/types/arena';
import { INITIAL_TEAMS } from '@/constants/teams';
import Dashboard from '@/components/arena/Dashboard';
import Standings from '@/components/arena/Standings';
import TeamList from '@/components/arena/TeamList';
import MatchList from '@/components/arena/MatchList';
import Stats from '@/components/arena/Stats';
import PlayerProfile from '@/components/arena/PlayerProfile';
import AdminLogin from '@/components/arena/AdminLogin';
import { Trophy, Users, Calendar, BarChart3, LayoutDashboard, ShieldCheck, LogOut, ShieldAlert, Target, Play } from 'lucide-react';

const Index = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'goal' | 'start' | 'info'} | null>(null);
  
  const prevMatchesRef = useRef<Match[]>([]);
  const teamsRef = useRef<Team[]>(INITIAL_TEAMS);

  const channel = useMemo(() => new BroadcastChannel('arena_live_updates'), []);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    const savedTeams = localStorage.getItem('arena_teams');
    const savedMatches = localStorage.getItem('arena_matches');
    const savedAuth = localStorage.getItem('arena_admin');
    
    if (savedTeams) {
      const parsedTeams = JSON.parse(savedTeams);
      setTeams(parsedTeams);
      teamsRef.current = parsedTeams;
    }
    if (savedMatches) {
      const parsedMatches = JSON.parse(savedMatches);
      setMatches(parsedMatches);
      prevMatchesRef.current = parsedMatches;
    }
    if (savedAuth === 'true') setIsAdmin(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'arena_teams' && e.newValue) {
        setTeams(JSON.parse(e.newValue));
      }
      if (e.key === 'arena_matches' && e.newValue) {
        const newMatches = JSON.parse(e.newValue);
        checkForNewEvents(newMatches);
        setMatches(newMatches);
      }
    };

    channel.onmessage = (event) => {
      if (event.data.type === 'REFRESH_DATA') {
        const t = localStorage.getItem('arena_teams');
        const m = localStorage.getItem('arena_matches');
        if (t) setTeams(JSON.parse(t));
        if (m) {
          const newMatches = JSON.parse(m);
          checkForNewEvents(newMatches);
          setMatches(newMatches);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  }, [channel]);

  const checkForNewEvents = (newMatches: Match[]) => {
    newMatches.forEach(newM => {
      const oldM = prevMatchesRef.current.find(m => m.id === newM.id);
      if (!oldM) return;

      if (newM.scoreA > oldM.scoreA || newM.scoreB > oldM.scoreB) {
        const lastEvent = newM.events[newM.events.length - 1];
        const player = teamsRef.current.flatMap(t => t.players).find(p => p.id === lastEvent?.playerId);
        if (player) {
          showNotification(`GOAL! ${player.name} scores! (${newM.scoreA}-${newM.scoreB})`, 'goal');
        }
      }

      if (oldM.status === 'pending' && newM.status === 'live') {
        const teamA = teamsRef.current.find(t => t.id === newM.teamAId);
        const teamB = teamsRef.current.find(t => t.id === newM.teamBId);
        showNotification(`${teamA?.name} vs ${teamB?.name} has just kicked off!`, 'start');
      }
    });
    prevMatchesRef.current = newMatches;
  };

  const showNotification = (message: string, type: 'goal' | 'start' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const broadcastUpdate = () => {
    channel.postMessage({ type: 'REFRESH_DATA' });
  };

  useEffect(() => {
    localStorage.setItem('arena_teams', JSON.stringify(teams));
    localStorage.setItem('arena_matches', JSON.stringify(matches));
    localStorage.setItem('arena_admin', isAdmin.toString());
  }, [teams, matches, isAdmin]);

  const allPlayers = useMemo(() => teams.flatMap(t => t.players), [teams]);

  const updateTeamStats = useCallback((match: Match) => {
    if (match.status !== 'finished' || match.phase !== 'group') return;
    setTeams(prev => {
      const updated = prev.map(team => {
        const isTeamA = team.id === match.teamAId;
        const isTeamB = team.id === match.teamBId;
        if (!isTeamA && !isTeamB) return team;
        
        const myScore = isTeamA ? match.scoreA : match.scoreB;
        const oppScore = isTeamA ? match.scoreB : match.scoreA;
        const newTeam = { ...team };
        newTeam.played += 1;
        newTeam.gf += myScore;
        newTeam.ga += oppScore;
        
        if (myScore > oppScore) { newTeam.won += 1; newTeam.points += 3; }
        else if (myScore === oppScore) { newTeam.drawn += 1; newTeam.points += 1; }
        else { newTeam.lost += 1; }

        const teamEvents = match.events.filter(e => e.teamId === team.id);
        newTeam.players = newTeam.players.map(p => {
          const goals = teamEvents.filter(e => e.type === 'goal' && e.playerId === p.id).length;
          const assists = teamEvents.filter(e => e.type === 'assist' && e.playerId === p.id).length;
          return { ...p, goals: p.goals + goals, assists: p.assists + assists };
        });
        return newTeam;
      });
      return updated;
    });
  }, []);

  const addTeam = (name: string, color: string, group: 'A' | 'B' = 'A') => {
    if (!isAdmin) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newTeam: Team = {
      id: newId, name, color, group, players: Array.from({ length: 7 }).map((_, i) => ({
        id: `${newId}-p${i + 1}`, name: `New Player ${i + 1}`, goals: 0, assists: 0, teamId: newId,
        photoUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop", marketValue: 10000
      })),
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0
    };
    setTeams(prev => [...prev, newTeam]);
    broadcastUpdate();
  };

  const deleteTeam = (teamId: string) => {
    if (!isAdmin || !window.confirm("Delete team and all its history?")) return;
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setMatches(prev => prev.filter(m => m.teamAId !== teamId && m.teamBId !== teamId));
    broadcastUpdate();
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
    if (!isAdmin) return;
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
    broadcastUpdate();
  };

  const updatePlayer = (playerId: string, teamId: string, updates: { name?: string; photoUrl?: string; marketValue?: number }) => {
    if (!isAdmin) return;
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      return { ...t, players: t.players.map(p => p.id === playerId ? { ...p, ...updates } : p) };
    }));
    broadcastUpdate();
  };

  const transferPlayer = (playerId: string, currentTeamId: string, targetTeamId: string) => {
    if (!isAdmin) return;
    setTeams(prev => {
      let playerToMove: Player | undefined;
      const updatedTeams = prev.map(t => {
        if (t.id === currentTeamId) {
          playerToMove = t.players.find(p => p.id === playerId);
          return { ...t, players: t.players.filter(p => p.id !== playerId) };
        }
        return t;
      });
      if (playerToMove) {
        return updatedTeams.map(t => t.id === targetTeamId ? { ...t, players: [...t.players, { ...playerToMove!, teamId: targetTeamId }] } : t);
      }
      return prev;
    });
    broadcastUpdate();
  };

  const addMatch = (teamAId: string, teamBId: string, phase: 'group' | 'semifinal' | 'final' = 'group') => {
    if (!isAdmin) return;
    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      teamAId, teamBId, scoreA: 0, scoreB: 0, status: 'pending', events: [], phase
    };
    setMatches(prev => [newMatch, ...prev]);
    broadcastUpdate();
    setView('matches');
  };

  const updateMatch = (updatedMatch: Match) => {
    if (!isAdmin) return;
    setMatches(prev => {
      const updated = prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
      checkForNewEvents(updated);
      return updated;
    });
    broadcastUpdate();
    if (updatedMatch.status === 'finished') {
      updateTeamStats(updatedMatch);
    }
  };

  const deleteMatch = (matchId: string) => {
    if (!isAdmin || !window.confirm("Delete this match?")) return;
    setMatches(prev => prev.filter(m => m.id !== matchId));
    broadcastUpdate();
  };

  const resetTournament = () => {
    if (!isAdmin || !window.confirm("RESET ALL DATA? This cannot be undone.")) return;
    setMatches([]);
    setTeams(INITIAL_TEAMS);
    localStorage.clear();
    broadcastUpdate();
    setView('dashboard');
  };

  const navigateToPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setView('player');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Arena' },
    { id: 'standings', icon: Trophy, label: 'Table' },
    { id: 'matches', icon: Calendar, label: 'Matches' },
    { id: 'teams', icon: Users, label: 'Teams' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground overflow-hidden font-inter">
      {/* Real-time Global Notification Overlay */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-6 fade-in duration-500 pointer-events-none w-[90%] max-w-md">
          <div className={`px-6 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 flex items-center gap-5 backdrop-blur-xl ${
            notification.type === 'goal' ? 'bg-primary/90 border-primary text-primary-foreground' : 
            notification.type === 'start' ? 'bg-arena-blue/90 border-arena-blue text-white' : 'bg-secondary/90 border-secondary'
          }`}>
            <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
              {notification.type === 'goal' ? <Target className="w-8 h-8 animate-bounce" /> : <Play className="w-8 h-8 animate-pulse" />}
            </div>
            <div>
              <p className="font-black text-xl tracking-tight uppercase leading-tight mb-0.5">
                {notification.type === 'goal' ? 'GOOOOOAL!' : notification.type === 'start' ? 'KICK OFF!' : 'ARENA NEWS'}
              </p>
              <p className="text-sm font-bold opacity-90 leading-tight">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 glass-card border-r border-secondary p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-arena-blue uppercase">
            Arena Live
          </h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id as AppView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                view === item.id ? 'bg-primary/10 text-primary font-semibold shadow-inner' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === 'matches' && matches.some(m => m.status === 'live') && (
                <span className="w-2.5 h-2.5 rounded-full bg-arena-red ml-auto animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              )}
            </button>
          ))}
        </nav>
        <div className="pt-6 space-y-4 border-t border-secondary">
          <div className={`rounded-xl p-4 transition-colors ${isAdmin ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}>
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>{isAdmin ? 'Arena Admin' : 'Guest Spectator'}</span>
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-primary animate-pulse' : 'bg-muted'}`}></span>
            </div>
            {isAdmin ? (
              <button onClick={() => setIsAdmin(false)} className="text-xs text-destructive font-bold hover:underline flex items-center gap-1 mt-1 transition-opacity">
                <LogOut className="w-3 h-3" /> Finish Management
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1 transition-opacity">
                <ShieldCheck className="w-3 h-3" /> Admin Login
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0 h-screen">
        {/* Admin Sync Header */}
        {isAdmin && (
          <div className="sticky top-0 z-[50] bg-primary/10 backdrop-blur-md border-b border-primary/30 px-8 py-2.5 flex items-center justify-between text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              Live Broadcast Control
            </div>
            <button onClick={resetTournament} className="bg-destructive/20 text-destructive px-4 py-1.5 rounded-lg hover:bg-destructive/30 transition-colors font-bold tracking-normal border border-destructive/20">Reset Season</button>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {view === 'dashboard' && <Dashboard teams={teams} matches={matches} setView={setView} isAdmin={isAdmin} />}
          {view === 'standings' && <Standings teams={teams} />}
          {view === 'teams' && <TeamList teams={teams} onUpdatePlayer={updatePlayer} onTransferPlayer={transferPlayer} onUpdateTeam={updateTeam} isAdmin={isAdmin} onPlayerClick={navigateToPlayer} onAddTeam={addTeam} onDeleteTeam={deleteTeam} />}
          {view === 'matches' && <MatchList matches={matches} teams={teams} onUpdateMatch={updateMatch} onAddMatch={addMatch} onDeleteMatch={deleteMatch} isAdmin={isAdmin} />}
          {view === 'stats' && <Stats players={allPlayers} teams={teams} onPlayerClick={navigateToPlayer} />}
          {view === 'player' && selectedPlayerId && (
            <PlayerProfile player={allPlayers.find(p => p.id === selectedPlayerId)!} team={teams.find(t => t.id === allPlayers.find(p => p.id === selectedPlayerId)?.teamId)} matches={matches} onBack={() => setView('teams')} />
          )}
        </div>
      </main>

      <AdminLogin isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={(p) => { if(p==='admin123') { setIsAdmin(true); return true; } return false; }} />

      {/* Mobile Sticky Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-secondary p-2 flex justify-around items-center z-[100] backdrop-blur-2xl">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id as AppView)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${view === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {item.id === 'matches' && matches.some(m => m.status === 'live') && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-arena-red border-2 border-card animate-pulse"></span>}
          </button>
        ))}
        <button onClick={() => isAdmin ? setIsAdmin(false) : setIsLoginModalOpen(true)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl ${isAdmin ? 'text-primary' : 'text-muted-foreground'}`}>
          {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-tighter">{isAdmin ? 'Admin' : 'Login'}</span>
        </button>
      </nav>
    </div>
  );
};

export default Index;
