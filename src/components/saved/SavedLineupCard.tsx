import React, { useState } from 'react';
import type { SavedLineup } from '../../types/lineup';
import FormationRenderer from '../field/FormationRenderer';

interface SavedLineupCardProps {
  lineup: SavedLineup;
  onLoad: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SavedLineupCard({ lineup, onLoad, onRename, onDuplicate, onDelete }: SavedLineupCardProps) {
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

  // Create minimal formation object for preview
  const formationForPreview = {
    code: lineup.formation.code,
    name: lineup.formation.name,
    slots: Object.keys(lineup.assignments.onField).map(slotId => ({
      slot_id: slotId,
      slot_code: slotId.split(':')[1] || 'P',
      x: 0.5,
      y: 0.5
    }))
  };

  const onFieldCount = Object.values(lineup.assignments.onField).filter(id => id !== null).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-center flex-1">{lineup.name}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="More options"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-40">
                  <button
                    onClick={() => {
                      onLoad();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => {
                      onRename();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {lineup.teamName && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {lineup.teamName}
            </span>
          )}
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {lineup.formation.name}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 p-4 h-48 flex items-center justify-center">
        <div className="w-full h-full">
          <FormationRenderer
            formation={formationForPreview as any}
            interactive={false}
            showLabels={false}
            markerScale={0.72}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{onFieldCount}/11 on field</span>
          <span>{lineup.assignments.bench.length} on bench</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Updated {timeAgo(lineup.updatedAt)}</span>
          <button
            onClick={onLoad}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
}
