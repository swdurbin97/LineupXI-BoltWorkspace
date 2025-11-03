import React from 'react';
import { Player } from '../../lib/types';
import { getLineForPos, LINE_COLORS } from '../../lib/positions';

interface AvailablePlayerCardProps {
  player: Player;
}

export default function AvailablePlayerCard({ player }: AvailablePlayerCardProps) {
  const line = getLineForPos(player.primaryPos);
  const bgColor = LINE_COLORS[line];

  const nameParts = player.name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : player.name;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-player-id', String(player.id));
        e.dataTransfer.effectAllowed = 'move';

        const ghost = document.createElement('div');
        ghost.style.cssText =
          'padding:6px 10px;border-radius:10px;background:#fff;border:1px solid #CBD5E1;box-shadow:0 2px 6px rgba(0,0,0,.12);font:600 12px system-ui;color:#0F172A';
        ghost.textContent = `#${player.jersey} ${displayName}`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 8, 8);
        setTimeout(() => document.body.removeChild(ghost), 0);
      }}
      className="select-none cursor-move rounded-xl border border-slate-200 bg-white shadow-sm px-3 py-2 hover:border-blue-400 hover:shadow transition-colors"
    >
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-lg text-white grid place-items-center text-sm font-bold"
          style={{ backgroundColor: bgColor }}
        >
          {player.jersey}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800 truncate">{displayName}</div>
          <div className="text-[11px] text-slate-500">{player.primaryPos}</div>
        </div>
      </div>
    </div>
  );
}
