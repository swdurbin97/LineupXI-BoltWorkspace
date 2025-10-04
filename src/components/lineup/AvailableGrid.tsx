import React, { useState } from 'react';
import { Player } from '../../lib/types';
import PlayerCard from './PlayerCard';
import { CARD_W, CARD_H, GAP_X, PAD_S } from '../../lib/sizes';

interface AvailableGridProps {
  players: Player[];
  onAutoPlace: (playerId: string) => void;
  scale?: number;
}

export default function AvailableGrid({ players, onAutoPlace, scale = 1 }: AvailableGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Ensure players is an array
  const safePlayers = players ?? [];
  
  if (safePlayers.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm">No available players</p>
        <p className="text-xs mt-1">All players are on field or bench</p>
      </div>
    );
  }

  return (
    <div 
      className="flex overflow-x-auto snap-x snap-mandatory"
      style={{ 
        gap: `${GAP_X}px`, 
        paddingBottom: `${Math.round(PAD_S/2)}px`,
        minHeight: `${CARD_H + PAD_S}px`
      }}
    >
      {safePlayers.map(player => (
        <div key={player.id} className="snap-start flex-shrink-0">
          <PlayerCard
            player={player}
            size="DEFAULT"
            isDragging={draggingId === player.id}
          onDragStart={(e) => {
            setDraggingId(player.id);
            try {
              const payload = JSON.stringify({ 
                playerId: player.id, 
                source: 'available',
                key: null 
              });
              e.dataTransfer.setData('application/x-yslm', payload);
              e.dataTransfer.setData('text/plain', payload);
            } catch (error) {
              console.error('Error setting drag data:', error);
            }
          }}
            onDoubleClick={() => onAutoPlace && onAutoPlace(player.id)}
          />
        </div>
      ))}
    </div>
  );
}