import React, { useState } from 'react';
import { Player } from '../../lib/types';
import PlayerCard from './PlayerCard';
import { getLayoutParams } from '../../lib/layout';
import { CARD_W, CARD_H, BENCH_SLOT_W, BENCH_SLOT_H, GAP_X } from '../../lib/sizes';

interface BenchGridProps {
  benchSlots: (string | null)[];
  players: Player[];
  onAssignToBench: (index: number, playerId: string) => void;
  onRemoveFromBench: (index: number) => void;
  scale?: number;
}

export default function BenchGrid({ 
  benchSlots, 
  players, 
  onAssignToBench,
  onRemoveFromBench,
  scale = 1
}: BenchGridProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const lp = getLayoutParams();
  const cols = lp.benchCols || 8;
  
  // Ensure benchSlots is always an array of 8
  const safeBenchSlots = benchSlots ?? Array(8).fill(null);
  const normalizedSlots = safeBenchSlots.length === 8 
    ? safeBenchSlots 
    : [...safeBenchSlots.slice(0, 8), ...Array(Math.max(0, 8 - safeBenchSlots.length)).fill(null)];

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    try {
      const payloadStr = e.dataTransfer.getData('application/x-yslm') || e.dataTransfer.getData('text/plain');
      if (!payloadStr) return;
      
      const payload = JSON.parse(payloadStr);
      if (!payload.playerId) return;
      
      // If target is empty, just assign
      const targetPlayer = normalizedSlots[index];
      if (!targetPlayer && onAssignToBench) {
        onAssignToBench(index, payload.playerId);
      }
      // If target is occupied and source is bench, swap
      else if (targetPlayer && payload.source === 'bench' && typeof payload.key === 'number') {
        // Swap bench positions
        const temp = normalizedSlots[index];
        if (onAssignToBench) {
          onAssignToBench(index, payload.playerId);
          onAssignToBench(payload.key, temp);
        }
      }
      // If target is occupied and source is field, swap
      else if (targetPlayer && payload.source === 'field' && onAssignToBench) {
        onAssignToBench(index, payload.playerId);
      }
    } catch (error) {
      console.error('Error parsing drop payload:', error);
    }
  };

  // Desktop uses dynamic cols, mobile uses fixed
  const gridCols = typeof window !== 'undefined' && window.innerWidth >= 1024 
    ? `repeat(${cols}, minmax(0, 1fr))`
    : window.innerWidth >= 768 
    ? 'repeat(4, minmax(0, 1fr))'
    : 'repeat(2, minmax(0, 1fr))';
  
  return (
    <div 
      className="grid"
      style={{ gridTemplateColumns: gridCols, gap: `${GAP_X}px` }}
    >
      {normalizedSlots.map((playerId, index) => {
        const player = playerId && players ? players.find(p => p.id === playerId) : null;
        
        return (
          <div
            key={index}
            className={`
              relative rounded-md mx-auto transition-all
              ${player ? '' : 'border-2 border-dashed border-gray-300/70 bg-white/30'}
              ${dragOverIndex === index ? 'border-green-400 bg-green-50' : ''}
              flex items-center justify-center
            `}
            style={{ width: BENCH_SLOT_W, height: BENCH_SLOT_H }}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {player ? (
              <div className="flex items-center justify-center">
                <PlayerCard
                  player={player}
                  size="BENCH"
                  onDragStart={(e) => {
                    const payload = JSON.stringify({
                      playerId: player.id,
                      source: 'bench',
                      key: index
                    });
                    e.dataTransfer.setData('application/x-yslm', payload);
                    e.dataTransfer.setData('text/plain', payload);
                  }}
                />
                {onRemoveFromBench && (
                  <button
                    onClick={() => onRemoveFromBench(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 z-10"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-xs">
                <span>Bench {index + 1}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}