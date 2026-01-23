import { useMemo } from 'react';
import { Match, Team, MatchEvent, Substitution } from '@/types/arena';
import { Target, ArrowRightLeft, Square, Clock } from 'lucide-react';

interface MatchHighlightsProps {
  match: Match;
  teamA: Team;
  teamB: Team;
}

interface HighlightEvent {
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  timestamp: number;
  minute?: number;
  teamId: string;
  playerName: string;
  secondaryPlayerName?: string; // For substitutions (player in)
  half?: 'first' | 'second';
}

const MatchHighlights = ({ match, teamA, teamB }: MatchHighlightsProps) => {
  const allPlayers = useMemo(() => [...teamA.players, ...teamB.players], [teamA, teamB]);

  const highlights = useMemo(() => {
    const events: HighlightEvent[] = [];

    // Add goals from match events
    match.events
      .filter(e => e.type === 'goal')
      .forEach(event => {
        const player = allPlayers.find(p => p.id === event.playerId);
        if (player) {
          events.push({
            type: 'goal',
            timestamp: event.timestamp,
            teamId: event.teamId,
            playerName: player.name,
          });
        }
      });

    // Add substitutions
    (match.substitutions || []).forEach(sub => {
      const playerOut = allPlayers.find(p => p.id === sub.playerOutId);
      const playerIn = allPlayers.find(p => p.id === sub.playerInId);
      if (playerOut && playerIn) {
        events.push({
          type: 'substitution',
          timestamp: Date.now() - (90 - sub.minute) * 60000, // Approximate for sorting
          minute: sub.minute,
          teamId: sub.teamId,
          playerName: playerOut.name,
          secondaryPlayerName: playerIn.name,
          half: sub.half,
        });
      }
    });

    // Sort by timestamp (chronological order)
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }, [match, allPlayers]);

  if (highlights.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No highlights yet</p>
        <p className="text-xs opacity-70">Events will appear here as they happen</p>
      </div>
    );
  }

  const getTeamColor = (teamId: string) => {
    return teamId === teamA.id ? teamA.color : teamB.color;
  };

  const getTeamName = (teamId: string) => {
    return teamId === teamA.id ? teamA.name : teamB.name;
  };

  const getEventIcon = (type: HighlightEvent['type']) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4" />;
      case 'yellow_card':
        return <Square className="w-4 h-4 fill-amber text-amber" />;
      case 'red_card':
        return <Square className="w-4 h-4 fill-arena-red text-arena-red" />;
      case 'substitution':
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getEventStyle = (type: HighlightEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'bg-primary/10 border-primary/30 text-primary';
      case 'yellow_card':
        return 'bg-amber/10 border-amber/30 text-amber';
      case 'red_card':
        return 'bg-arena-red/10 border-arena-red/30 text-arena-red';
      case 'substitution':
        return 'bg-arena-blue/10 border-arena-blue/30 text-arena-blue';
    }
  };

  const getEventLabel = (type: HighlightEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'GOAL';
      case 'yellow_card':
        return 'YELLOW CARD';
      case 'red_card':
        return 'RED CARD';
      case 'substitution':
        return 'SUBSTITUTION';
    }
  };

  return (
    <div className="space-y-2">
      {highlights.map((event, index) => (
        <div
          key={`${event.type}-${index}`}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getEventStyle(event.type)}`}
        >
          {/* Event Icon */}
          <div className={`p-2 rounded-lg ${getEventStyle(event.type)}`}>
            {getEventIcon(event.type)}
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                {getEventLabel(event.type)}
              </span>
              {event.minute !== undefined && (
                <span className="text-[10px] font-bold opacity-60">
                  {event.minute}'
                </span>
              )}
            </div>
            <p className="text-sm font-bold truncate">
              {event.type === 'substitution' ? (
                <>
                  <span className="text-arena-red">{event.playerName}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="text-primary">{event.secondaryPlayerName}</span>
                </>
              ) : (
                event.playerName
              )}
            </p>
          </div>

          {/* Team Badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: getTeamColor(event.teamId) + '20', borderColor: getTeamColor(event.teamId), borderWidth: 1 }}
          >
            <span className="text-xs font-black" style={{ color: getTeamColor(event.teamId) }}>
              {getTeamName(event.teamId).charAt(0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchHighlights;
