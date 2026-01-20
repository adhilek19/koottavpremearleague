import { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

const AdminLogin = ({ isOpen, onClose, onLogin }: AdminLoginProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(password)) {
      onClose();
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border border-primary/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary border border-primary/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Admin Access</h2>
          <p className="text-muted-foreground text-sm mt-2">Manage teams, matches, and scores.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Tournament Password</label>
            <input 
              autoFocus
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className={`w-full bg-secondary/50 border ${error ? 'border-destructive ring-1 ring-destructive' : 'border-secondary'} rounded-2xl px-5 py-4 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted`}
            />
            {error && (
              <div className="flex items-center gap-1 text-destructive text-xs mt-2 font-bold px-1 animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                <span>Incorrect credentials</span>
              </div>
            )}
          </div>
          
          <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary/50">
            <p className="text-xs text-muted-foreground">Enter the tournament admin password to unlock management features.</p>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            UNLOCK ARENA
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
