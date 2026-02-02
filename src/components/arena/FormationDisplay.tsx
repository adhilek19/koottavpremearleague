import { Player, Formation } from '@/types/arena';

interface FormationDisplayProps {
  players: Player[];
  formation: Formation;
  teamColor: string;
  onPlayerClick?: (playerId: string) => void;
}

// Formation positions for 5-a-side (4 outfield + 1 GK)
const FORMATION_POSITIONS: Record<Formation, { x: number; y: number }[]> = {
  '1-2-1': [
    { x: 50, y: 85 },   // GK
    { x: 50, y: 65 },   // Defender
    { x: 25, y: 40 },   // Left Mid
    { x: 75, y: 40 },   // Right Mid
    { x: 50, y: 15 },   // Forward
  ],
  '2-1-1': [
    { x: 50, y: 85 },   // GK
    { x: 30, y: 65 },   // Left Def
    { x: 70, y: 65 },   // Right Def
    { x: 50, y: 40 },   // Mid
    { x: 50, y: 15 },   // Forward
  ],
  '1-1-2': [
    { x: 50, y: 85 },   // GK
    { x: 50, y: 65 },   // Defender
    { x: 50, y: 40 },   // Mid
    { x: 30, y: 15 },   // Left Forward
    { x: 70, y: 15 },   // Right Forward
  ],
  '2-2': [
    { x: 50, y: 85 },   // GK
    { x: 30, y: 60 },   // Left Def
    { x: 70, y: 60 },   // Right Def
    { x: 30, y: 25 },   // Left Forward
    { x: 70, y: 25 },   // Right Forward
  ],
  '1-3': [
    { x: 50, y: 85 },   // GK
    { x: 50, y: 60 },   // Defender
    { x: 20, y: 25 },   // Left Forward
    { x: 50, y: 20 },   // Center Forward
    { x: 80, y: 25 },   // Right Forward
  ],
  '3-1': [
    { x: 50, y: 85 },   // GK
    { x: 20, y: 60 },   // Left Def
    { x: 50, y: 55 },   // Center Def
    { x: 80, y: 60 },   // Right Def
    { x: 50, y: 20 },   // Forward
  ],
};

const FormationDisplay = ({ players, formation, teamColor, onPlayerClick }: FormationDisplayProps) => {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['1-2-1'];
  const starters = players.slice(0, 5);

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-primary/20 via-primary/10 to-primary/20 rounded-2xl overflow-hidden border border-primary/20">
      {/* Pitch markings */}
      <div className="absolute inset-0">
        {/* Center line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-primary/30" />
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-primary/30 rounded-full" />
        {/* Penalty areas */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-10 border-b border-l border-r border-primary/30 rounded-b-lg" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-10 border-t border-l border-r border-primary/30 rounded-t-lg" />
        {/* Goal areas */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-4 border-b border-l border-r border-primary/20 rounded-b" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-4 border-t border-l border-r border-primary/20 rounded-t" />
      </div>

      {/* Formation label */}
      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{formation}</span>
      </div>

      {/* Players */}
      {starters.map((player, index) => {
        const pos = positions[index];
        if (!pos) return null;

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-pointer group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => onPlayerClick?.(player.id)}
          >
            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-lg overflow-hidden group-hover:scale-110 transition-transform"
              style={{ borderColor: teamColor }}
            >
              <img 
                src={player.photoUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop"} 
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-center max-w-[60px]">
              <span className="text-[8px] md:text-[10px] font-bold text-foreground truncate block">
                {player.name.split(' ')[0]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormationDisplay;
