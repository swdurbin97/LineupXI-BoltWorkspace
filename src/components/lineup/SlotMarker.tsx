import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../../lib/types';
import PlayerCard from './PlayerCard';
import { CARD_W, CARD_H, PLACEHOLDER_W, PLACEHOLDER_H } from '../../lib/sizes';

interface SlotMarkerProps {
  slotId: string; // Unique slot identifier (e.g., "442:CB:0")
  slotCode: string; // Display label (e.g., "CB")
  x: number; // percentage (0-100), top-left origin
  y: number; // percentage (0-100), top-left origin
  player?: Player;
  isSelected?: boolean;
  onClick: () => void;
  onDrop?: (playerId: string) => void;
  tunerOn?: boolean;
  onNudge?: (slotCode: string, dx: number, dy: number) => void;
  onSelect?: (slotCode: string) => void;
  editMode?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  scale?: number;
}

export default function SlotMarker({
  slotId, slotCode, x, y, player, isSelected, onClick, onDrop, tunerOn, onNudge, onSelect, editMode, onPositionChange, scale = 1
}: SlotMarkerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Keyboard nudging for position tuner
  useEffect(() => {
    if (!tunerOn || !isSelected || !onNudge) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      e.preventDefault();
      const fine = e.shiftKey;
      const step = fine ? 0.2 : 0.8;
      
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      
      onNudge(slotCode, dx, dy);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tunerOn, isSelected, onNudge, slotCode]);
  
  // Handle slot selection when in editor mode
  const handleSlotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tunerOn && onSelect) {
      onSelect(slotCode);
      console.log('Selected slot:', slotCode);
      // Focus the wrapper for keyboard events
      setTimeout(() => wrapperRef.current?.focus(), 0);
    } else if (!tunerOn) {
      onClick();
    }
  };
  
  // Inline keyboard handler as fallback
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tunerOn || !isSelected || !onNudge) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const fine = e.shiftKey;
    const step = fine ? 0.2 : 0.8;
    
    let dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;
    
    onNudge(slotCode, dx, dy);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const payloadStr = e.dataTransfer.getData('application/x-yslm') || e.dataTransfer.getData('text/plain');
      if (!payloadStr) return;
      
      const payload = JSON.parse(payloadStr);
      if (payload.playerId && onDrop) {
        onDrop(payload.playerId);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    if (player?.id) {
      try {
        const payload = JSON.stringify({
          playerId: player.id,
          source: 'field',
          slotId: slotId, // Use slot_id for identity
          slotCode: slotCode // Keep slot_code for display
        });
        e.dataTransfer.setData('application/x-yslm', payload);
        e.dataTransfer.setData('text/plain', payload);
      } catch (error) {
        console.error('Error setting drag data:', error);
      }
    }
  };
  
  const handleEditDragStart = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleEditDragMove = (e: MouseEvent) => {
    if (!isDragging || !editMode) return;
    
    const parent = document.querySelector('.relative.w-full[style*="aspect-ratio"]');
    if (!parent) return;
    
    const rect = parent.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragOffset.x + 42) / rect.width) * 100; // +42 for half card width
    const newY = ((e.clientY - rect.top - dragOffset.y + 59) / rect.height) * 100; // +59 for half card height
    
    // Clamp to [6, 94] to avoid edges
    const clampedX = Math.max(6, Math.min(94, newX));
    const clampedY = Math.max(6, Math.min(94, newY));
    
    if (onPositionChange) {
      onPositionChange(Math.round(clampedX), Math.round(clampedY));
    }
  };

  const handleEditDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleEditDragMove);
      document.addEventListener('mouseup', handleEditDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleEditDragMove);
        document.removeEventListener('mouseup', handleEditDragEnd);
      };
    }
  }, [isDragging, dragOffset]);
  
  return (
    <div
      ref={wrapperRef}
      role="button"
      tabIndex={tunerOn ? 0 : -1}
      aria-selected={isSelected}
      className={`absolute ${tunerOn ? 'pointer-events-auto z-30' : 'z-20'} ${editMode && !player ? 'cursor-move' : ''} ${isSelected && tunerOn ? 'ring-2 ring-sky-400 rounded-lg' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: tunerOn ? 'none' : 'auto',
      }}
      onClick={handleSlotClick}
      onKeyDown={handleKeyDown}
      onDragOver={!tunerOn ? handleDragOver : undefined}
      onDragLeave={!tunerOn ? handleDragLeave : undefined}
      onDrop={!tunerOn ? handleDrop : undefined}
      onMouseDown={editMode && !player ? handleEditDragStart : undefined}
    >
      {/* Position badge for tuner mode */}
      {tunerOn && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 text-white px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap z-10">
          {slotCode} • {Math.round(x)}, {Math.round(y)}
        </div>
      )}
      
      {player ? (
        // When occupied, show PlayerCard
        <div className={`
          ${isDragOver ? 'scale-110' : ''}
          transition-transform
          ${tunerOn ? 'pointer-events-none' : ''}
        `}>
          <PlayerCard
            player={player}
            size="FIELD"
            onDragStart={!tunerOn ? handleDragStart : undefined}
            onDoubleClick={!tunerOn ? onClick : undefined}
          />
        </div>
      ) : (
        // When empty, show dashed placeholder
        <div
          className={`
            border-2 border-dashed rounded-lg
            flex items-center justify-center
            transition-all relative
            ${tunerOn
              ? 'border-gray-400 bg-white/50'
              : isDragOver 
                ? 'border-green-500 bg-green-50 scale-110' 
                : 'border-gray-400 bg-white/50 hover:border-gray-500 hover:bg-white/70'
            }
          `}
          style={{ width: PLACEHOLDER_W, height: PLACEHOLDER_H }}
        >
          {editMode && (
            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-sm" />
          )}
          <span className="text-xs font-medium text-gray-600">
            {slotCode}
          </span>
        </div>
      )}
    </div>
  );
}