import React, { useState } from 'react';
import { Player } from '../../lib/types';
import PlayerCard from './PlayerCard';

interface BenchListProps {
  players: Player[];
  selectedPlayerId?: string;
  onPlayerClick: (playerId: string) => void;
  onPlayerDrop?: (playerId: string) => void;
  roles?: {
    captain?: string;
    gk?: string;
    pk?: string;
    ck?: string;
    fk?: string;
  };
  onRoleToggle?: (playerId: string, role: 'captain' | 'gk' | 'pk' | 'ck' | 'fk') => void;
}

export default function BenchList({ players, selectedPlayerId, onPlayerClick, onPlayerDrop, roles, onRoleToggle }: BenchListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/playerId');
    if (playerId && onPlayerDrop) {
      onPlayerDrop(playerId);
    }
  };

  if (players.length === 0) {
    return (
      <div 
        className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p className="text-sm">No players on bench</p>
        <p className="text-xs mt-1">Drop players here to remove from field</p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-2"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {players.map(player => {
        const isCaptain = roles?.captain === player.id;
        const isGK = roles?.gk === player.id;
        
        return (
          <div
            key={player.id}
            onClick={() => onPlayerClick(player.id)}
            className={`relative ${
              selectedPlayerId === player.id
                ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
                : ''
            }`}
          >
            {/* Role badges overlay */}
            {(isCaptain || isGK) && (
              <div className="absolute -top-1 -right-1 z-10 flex gap-1">
                {isCaptain && (
                  <span className="px-1.5 py-0.5 text-xs bg-yellow-400 text-yellow-900 rounded font-bold shadow">
                    C
                  </span>
                )}
                {isGK && (
                  <span className="px-1.5 py-0.5 text-xs bg-green-400 text-green-900 rounded font-bold shadow">
                    GK
                  </span>
                )}
              </div>
            )}
            
            <PlayerCard
              player={player}
              isDragging={draggingId === player.id}
              onDragStart={(e) => {
                setDraggingId(player.id);
                e.dataTransfer.setData('text/playerId', player.id);
                e.dataTransfer.setData('text/source', 'bench');
              }}
            />
          </div>
        );
      })}
    </div>
  );
}