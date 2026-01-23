import { useState, useEffect, useMemo } from 'react';
import { AppView, Match } from '@/types/arena';
import { useArenaData } from '@/hooks/useArenaData';
import Dashboard from '@/components/arena/Dashboard';
import Standings from '@/components/arena/Standings';
import TeamList from '@/components/arena/TeamList';
import MatchList from '@/components/arena/MatchList';
import Stats from '@/components/arena/Stats';
import PlayerProfile from '@/components/arena/PlayerProfile';
import AdminLogin from '@/components/arena/AdminLogin';
import { Trophy, Users, Calendar, BarChart3, LayoutDashboard, ShieldCheck, LogOut, ShieldAlert, Target, Play, Loader2 } from 'lucide-react';

const Index = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const {
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
    allPlayers
  } = useArenaData();

  useEffect(() => {
    const savedAuth = localStorage.getItem('arena_admin');
    if (savedAuth === 'true') setIsAdmin(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('arena_admin', isAdmin.toString());
  }, [isAdmin]);

  const handleUpdateMatch = async (updatedMatch: Match) => {
    await updateMatch(updatedMatch);
  };

  const handleRecordGoal = async (matchId: string, playerId: string, teamId: string, match: Match) => {
    const isTeamA = teamId === match.teamAId;
    await recordGoal(matchId, playerId, teamId, isTeamA, match);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Loading Arena...</p>
        </div>
      </div>
    );
  }

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

      <main className="flex-1 overflow-y-auto relative pb-28 lg:pb-0 h-screen">
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
          {view === 'matches' && <MatchList matches={matches} teams={teams} onUpdateMatch={handleUpdateMatch} onAddMatch={addMatch} onDeleteMatch={deleteMatch} isAdmin={isAdmin} onRecordGoal={handleRecordGoal} onRecordSubstitution={recordSubstitution} onUpdateMatchStats={updateMatchStats} onInitMatchStats={initMatchStats} onRecordPlayerCard={recordPlayerCard} />}
          {view === 'stats' && <Stats players={allPlayers} teams={teams} matches={matches} onPlayerClick={navigateToPlayer} />}
          {view === 'player' && selectedPlayerId && (
            <PlayerProfile player={allPlayers.find(p => p.id === selectedPlayerId)!} team={teams.find(t => t.id === allPlayers.find(p => p.id === selectedPlayerId)?.teamId)} matches={matches} onBack={() => setView('teams')} />
          )}
        </div>
      </main>

      <AdminLogin isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={(p) => { if(p==='admin123') { setIsAdmin(true); return true; } return false; }} />

      {/* Mobile Sticky Navigation - Improved touch targets */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-secondary safe-area-bottom z-[100] backdrop-blur-2xl">
        <div className="flex justify-around items-stretch px-2 py-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as AppView)} 
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] p-3 rounded-2xl transition-all active:scale-95 ${
                view === item.id 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground active:bg-secondary/50'
              }`}
            >
              <item.icon className={`w-6 h-6 ${view === item.id ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none">{item.label}</span>
              {item.id === 'matches' && matches.some(m => m.status === 'live') && (
                <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-arena-red border-2 border-card animate-pulse shadow-lg shadow-arena-red/50"></span>
              )}
            </button>
          ))}
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setIsLoginModalOpen(true)} 
            className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] p-3 rounded-2xl transition-all active:scale-95 ${
              isAdmin 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground active:bg-secondary/50'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-6 h-6 stroke-[2.5]" /> : <ShieldAlert className="w-6 h-6" />}
            <span className="text-[9px] font-bold uppercase tracking-tight leading-none">{isAdmin ? 'Admin' : 'Login'}</span>
            {isAdmin && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
