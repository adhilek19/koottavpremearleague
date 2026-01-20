import { useState, useRef } from 'react';
import { Team, Player } from '@/types/arena';
import { Edit2, Save, X, ExternalLink, Plus, Trash2, Camera, Repeat, Check, Upload, Link, CircleDollarSign } from 'lucide-react';

interface TeamListProps {
  teams: Team[];
  onUpdatePlayer: (playerId: string, teamId: string, updates: { name?: string; photoUrl?: string; marketValue?: number }) => void;
  onTransferPlayer: (playerId: string, currentTeamId: string, targetTeamId: string) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
  isAdmin: boolean;
  onPlayerClick: (playerId: string) => void;
  onAddTeam: (name: string, color: string, group?: 'A' | 'B') => void;
  onDeleteTeam: (teamId: string) => void;
}

const TeamList = ({ teams, onUpdatePlayer, onTransferPlayer, onUpdateTeam, isAdmin, onPlayerClick, onAddTeam, onDeleteTeam }: TeamListProps) => {
  const [editingPlayer, setEditingPlayer] = useState<{id: string, name: string, photoUrl: string, marketValue: number, targetTeamId: string} | null>(null);
  const [editingTeam, setEditingTeam] = useState<{id: string, name: string} | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#10b981');
  const [newTeamGroup, setNewTeamGroup] = useState<'A' | 'B'>('A');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && editingPlayer) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setEditingPlayer({ ...editingPlayer, photoUrl: dataUrl });
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPlayer) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPlayer({ ...editingPlayer, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePlayer = (currentTeamId: string) => {
    if (editingPlayer) {
      if (editingPlayer.targetTeamId !== currentTeamId) {
        onTransferPlayer(editingPlayer.id, currentTeamId, editingPlayer.targetTeamId);
      }
      onUpdatePlayer(editingPlayer.id, editingPlayer.targetTeamId, { 
        name: editingPlayer.name, 
        photoUrl: editingPlayer.photoUrl,
        marketValue: editingPlayer.marketValue
      });
      setEditingPlayer(null);
    }
  };

  const handleSaveTeam = () => {
    if (editingTeam) {
      onUpdateTeam(editingTeam.id, { name: editingTeam.name });
      setEditingTeam(null);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim(), newTeamColor, newTeamGroup);
      setNewTeamName('');
      setIsAddingTeam(false);
    }
  };

  const renderTeamCard = (team: Team) => (
    <div key={team.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group border-t-4" style={{ borderColor: team.color }}>
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          {editingTeam?.id === team.id ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                className="bg-secondary text-foreground font-bold text-lg px-2 py-1 rounded-lg border border-primary outline-none w-40"
                value={editingTeam.name}
                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                onBlur={handleSaveTeam}
              />
              <button onClick={handleSaveTeam} className="p-1 text-primary"><Check className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 
                className={`text-xl font-bold ${isAdmin ? 'cursor-pointer hover:text-primary' : ''}`}
                onClick={() => isAdmin && setEditingTeam({ id: team.id, name: team.name })}
              >
                {team.name}
              </h3>
              {isAdmin && (
                <button onClick={() => setEditingTeam({ id: team.id, name: team.name })} className="p-1 text-muted-foreground hover:text-foreground transition-opacity">
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {isAdmin ? (
            <button 
              onClick={() => onDeleteTeam(team.id)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-secondary/50 rounded-lg"
              title="Delete Team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-md uppercase font-bold tracking-widest">
              Group {team.group || 'A'}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          {team.players.map((player, i) => (
            <div key={player.id} className="flex flex-col p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary transition-all border border-transparent hover:border-accent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} 
                    className="w-10 h-10 rounded-full object-cover border border-secondary cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => onPlayerClick(player.id)}
                    alt={player.name}
                  />
                  {editingPlayer?.id === player.id ? (
                    <div className="space-y-2 py-1">
                      <input 
                        autoFocus
                        placeholder="Player Name"
                        className="bg-accent text-foreground px-2 py-1 rounded text-sm w-44 outline-none focus:ring-1 focus:ring-primary"
                        value={editingPlayer.name}
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                      />
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={startCamera}
                            className="text-[10px] bg-muted hover:bg-primary text-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            <Camera className="w-3 h-3" /> Photo
                          </button>
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] bg-muted hover:bg-primary text-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            <Upload className="w-3 h-3" /> File
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                        <div className="flex items-center gap-2 bg-secondary rounded px-2">
                          <Link className="w-3 h-3 text-muted-foreground" />
                          <input 
                            placeholder="Paste Photo URL..."
                            className="bg-transparent text-foreground py-1 rounded text-[10px] w-full outline-none"
                            value={editingPlayer.photoUrl}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, photoUrl: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-secondary rounded px-2 border border-secondary">
                          <CircleDollarSign className="w-3 h-3 text-amber" />
                          <input 
                            type="number"
                            placeholder="Market Value (€)"
                            className="bg-transparent text-foreground py-1 rounded text-[10px] w-full outline-none"
                            value={editingPlayer.marketValue}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, marketValue: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-secondary">
                        <Repeat className="w-3 h-3 text-primary" />
                        <select 
                          className="bg-transparent text-foreground text-[10px] outline-none w-full cursor-pointer"
                          value={editingPlayer.targetTeamId}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, targetTeamId: e.target.value })}
                        >
                          {teams.map(t => (
                            <option key={t.id} value={t.id} className="bg-card">{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="cursor-pointer" onClick={() => onPlayerClick(player.id)}>
                      <span className="text-sm font-bold text-secondary-foreground block hover:text-primary transition-colors">
                        {player.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-black">{i > 4 ? 'Sub' : 'Starter'}</span>
                        {player.marketValue && (
                          <span className="text-[10px] text-primary/80 font-bold">€{player.marketValue.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {editingPlayer?.id === player.id ? (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleSavePlayer(team.id)} className="p-1 text-primary hover:text-primary/80">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingPlayer(null); stopCamera(); }} className="p-1 text-destructive hover:text-destructive/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && (
                        <button onClick={() => setEditingPlayer({ id: player.id, name: player.name, photoUrl: player.photoUrl || '', marketValue: player.marketValue || 0, targetTeamId: team.id })} className="p-1.5 text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => onPlayerClick(player.id)} className="p-1.5 text-muted-foreground hover:text-arena-blue">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 bg-secondary/30 border-t border-secondary flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Squad Unit</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-primary/40"></div>)}
          {[...Array(2)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-muted"></div>)}
        </div>
      </div>

      {/* Camera View */}
      {isCameraActive && editingPlayer && (
        <div className="fixed inset-0 z-[300] bg-background/95 flex flex-col items-center justify-center p-4">
          <video ref={videoRef} autoPlay playsInline className="rounded-2xl max-w-full max-h-[60vh] border-4 border-primary shadow-2xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4 mt-6">
            <button onClick={capturePhoto} className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-xl flex items-center gap-2">
              <Camera className="w-5 h-5" /> Capture
            </button>
            <button onClick={stopCamera} className="bg-secondary text-secondary-foreground font-bold py-3 px-8 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">Team Management</h2>
          <p className="text-muted-foreground">Tournament Groups A & B • 7 Players each</p>
        </div>
        {isAdmin && !isAddingTeam && (
          <button 
            onClick={() => setIsAddingTeam(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add New Team
          </button>
        )}
      </div>

      {isAddingTeam && (
        <form onSubmit={handleCreateTeam} className="glass-card p-6 rounded-2xl space-y-4 border border-primary/20">
          <h3 className="text-lg font-bold text-foreground">Create New Team</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input 
              autoFocus
              placeholder="Team Name"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              className="bg-secondary text-foreground p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center gap-2 bg-secondary p-3 rounded-xl">
              <input type="color" value={newTeamColor} onChange={e => setNewTeamColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <span className="text-muted-foreground text-sm">Team Color</span>
            </div>
            <select value={newTeamGroup} onChange={e => setNewTeamGroup(e.target.value as 'A' | 'B')} className="bg-secondary text-secondary-foreground p-3 rounded-xl outline-none">
              <option value="A">Group A</option>
              <option value="B">Group B</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 px-5 rounded-xl">
              <Check className="w-4 h-4" /> Create Team
            </button>
            <button type="button" onClick={() => setIsAddingTeam(false)} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold py-2.5 px-5 rounded-xl">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map(renderTeamCard)}
      </div>
    </div>
  );
};

export default TeamList;
