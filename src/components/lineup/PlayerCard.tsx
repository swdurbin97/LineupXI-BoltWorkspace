import React from 'react';
import { Player } from '../../lib/types';
import { getLineForPos, LINE_COLORS } from '../../lib/positions';
import { CARD_W, CARD_H } from '../../lib/sizes';

interface PlayerCardProps {
  player: Player;
  size?: 'DEFAULT' | 'FIELD' | 'BENCH';
  variant?: 'rail' | 'default';
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  customWidth?: number;
  customHeight?: number;
  dense?: boolean;
  className?: string;
}

// Size specifications
const CARD_SIZES = {
  DEFAULT: {
    width: 116,
    height: 156,
    header: 22,
    body: 86,
    footer: 20,
    nameText: 'text-sm',
    primaryText: 'text-xl',
    jerseyText: 'text-base',
    footerText: 'text-[10px]'
  },
  FIELD: {
    width: 84,
    height: 118,
    header: 18,
    body: 64,
    footer: 16,
    nameText: 'text-[11px]',
    primaryText: 'text-base',
    jerseyText: 'text-sm',
    footerText: 'text-[10px]'
  },
  BENCH: {
    width: 80,
    height: 104,
    header: 16,
    body: 60,
    footer: 8,
    nameText: 'text-[10px]',
    primaryText: 'text-sm',
    jerseyText: 'text-xs',
    footerText: 'text-[10px]'
  },
  RAIL: {
    header: 18,
    bar: 8,
    footer: 8
  }
};

export default function PlayerCard({
  player,
  size = 'DEFAULT',
  variant = 'default',
  onDragStart,
  onDoubleClick,
  isDragging = false,
  customWidth,
  customHeight,
  dense = false,
  className = ''
}: PlayerCardProps) {
  const line = getLineForPos(player.primaryPos);
  const color = LINE_COLORS[line];
  const cardSize = CARD_SIZES[size];
  const isRail = variant === 'rail';

  // Rail variant overrides
  const headerHeight = isRail ? CARD_SIZES.RAIL.header : (dense ? cardSize.header - 2 : cardSize.header);
  const barHeight = isRail ? CARD_SIZES.RAIL.bar : 8;
  const footerHeight = isRail ? CARD_SIZES.RAIL.footer : (dense ? 8 : cardSize.footer);
  const bodyHeight = isRail ? (104 - headerHeight - barHeight - footerHeight) : (dense ? cardSize.body - 4 : cardSize.body);
  
  // Format name: FirstName + LastInitial
  const nameParts = player.name.split(' ');
  const displayName = nameParts.length > 1 
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : player.name;
  
  // Get secondary positions as string
  const secondaries = Array.isArray(player.secondaryPos) 
    ? player.secondaryPos.slice(0, 3).join(' | ')
    : '';
  
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDoubleClick={onDoubleClick}
      className={`
        bg-white rounded-lg overflow-hidden cursor-move select-none
        transition-all border shadow-sm flex flex-col
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        hover:shadow-lg hover:scale-105
        ${className}
      `}
      style={{
        width: customWidth || CARD_W,
        height: customHeight || CARD_H
      }}
    >
      {/* White header with name */}
      <div
        className={`bg-white border-b flex items-center ${isRail ? 'justify-center px-1.5' : (dense ? 'px-1' : 'px-1.5')}`}
        style={{ height: `${headerHeight}px` }}
      >
        <div className={`font-medium truncate ${isRail ? 'text-center text-[13px]' : `w-full ${cardSize.nameText}`}`}>
          {displayName}
        </div>
      </div>

      {/* Colored body with position and jersey */}
      <div
        className="flex flex-col items-center justify-center text-white"
        style={{
          backgroundColor: color,
          height: `${bodyHeight}px`
        }}
      >
        <div className={`font-bold uppercase leading-tight ${isRail ? 'text-[22px]' : cardSize.primaryText}`}>
          {player.primaryPos || 'POS'}
        </div>
        <div className={`font-bold ${isRail ? 'text-[13px]' : cardSize.jerseyText} mt-1`}>
          #{player.jersey}
        </div>
      </div>

      {/* Black bar */}
      <div
        className="bg-gray-800"
        style={{ height: `${barHeight}px` }}
      />

      {/* White footer with secondary positions */}
      <div
        className="bg-white text-gray-600 px-1 flex items-center"
        style={{ height: `${footerHeight}px` }}
      >
        <div className={`truncate text-center w-full ${cardSize.footerText}`}>
          {secondaries || '\u00A0'}
        </div>
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export { getLineForPos, LINE_COLORS };