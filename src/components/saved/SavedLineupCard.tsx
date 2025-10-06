import React, { useState } from 'react';
import type { SavedLineup } from '../../types/lineup';
import MiniPitchPreview from './MiniPitchPreview';

interface SavedLineupCardProps {
  lineup: SavedLineup;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SavedLineupCard({ lineup, onRename, onDuplicate, onDelete }: SavedLineupCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const onFieldCount = Object.values(lineup.assignments?.onField ?? {}).filter(Boolean).length;
  const benchCount = lineup.assignments?.bench?.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-shadow duration-150 p-4">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold flex-1 truncate">{lineup.name}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Actions for ${lineup.name}`}
            >
              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-40">
                  <button
                    onClick={() => {
                      onRename();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm focus:outline-none focus:bg-slate-50"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm focus:outline-none focus:bg-slate-50"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm text-red-600 focus:outline-none focus:bg-slate-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mt-1">
          {lineup.teamName && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full truncate">
              {lineup.teamName}
            </span>
          )}
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full truncate">
            {lineup.formation?.name || lineup.formation?.code || 'Unknown formation'}
          </span>
        </div>
      </div>

      {/* Preview */}
      <MiniPitchPreview lineup={lineup} />

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{onFieldCount}/11 on field • {benchCount} on bench</span>
          <span className="text-xs">Updated {timeAgo(lineup.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
