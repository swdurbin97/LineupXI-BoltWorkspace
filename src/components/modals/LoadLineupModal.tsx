import React, { useState } from 'react';
import type { LineupDiff } from '../../lib/lineupSerializer';

interface LoadLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (options: LoadOptions) => void;
  lineupName: string;
  diff: LineupDiff | null;
}

export interface LoadOptions {
  switchTeam: boolean;
  switchFormation: boolean;
  autoFillBench: boolean;
}

export function LoadLineupModal({ isOpen, onClose, onLoad, lineupName, diff }: LoadLineupModalProps) {
  const [switchTeam, setSwitchTeam] = useState(true);
  const [switchFormation, setSwitchFormation] = useState(true);
  const [autoFillBench, setAutoFillBench] = useState(false);

  const handleLoad = () => {
    onLoad({ switchTeam, switchFormation, autoFillBench });
    onClose();
  };

  if (!isOpen || !diff) return null;

  const hasDifferences = diff.teamChanged || diff.formationChanged || diff.missingPlayers.length > 0;

  // Simple load if no differences
  if (!hasDifferences) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4">Load Lineup</h2>
          <p className="text-gray-700 mb-6">
            Load <strong>"{lineupName}"</strong>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Load with differences
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Load Lineup with Differences</h2>
        <p className="text-gray-600 mb-6">
          Loading <strong>"{lineupName}"</strong> will make some changes:
        </p>

        <div className="space-y-6">
          {/* Team Section */}
          {diff.teamChanged && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Team</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={switchTeam}
                    onChange={() => setSwitchTeam(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>
                    Switch to saved team{' '}
                    <strong className="text-blue-600">{diff.savedTeamName || 'Untitled'}</strong>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!switchTeam}
                    onChange={() => setSwitchTeam(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>
                    Keep current team{' '}
                    <strong>{diff.currentTeamName || 'Untitled'}</strong>
                    {diff.missingPlayers.length > 0 && (
                      <span className="text-amber-600 text-sm ml-1">(may skip unknown players)</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Formation Section */}
          {diff.formationChanged && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Formation</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={switchFormation}
                    onChange={() => setSwitchFormation(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>
                    Switch to saved formation{' '}
                    <strong className="text-blue-600">{diff.savedFormationName}</strong>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!switchFormation}
                    onChange={() => setSwitchFormation(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>
                    Keep current formation{' '}
                    <strong>{diff.currentFormationName}</strong>
                    <span className="text-amber-600 text-sm ml-1">(will clear field, move to bench)</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Missing Players Section */}
          {diff.missingPlayers.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">Missing Players</h3>
              <p className="text-sm text-amber-700 mb-3">
                {diff.missingPlayers.length} player(s) from this lineup are not in the current roster.
                These slots will be left empty.
              </p>
              <div className="text-xs text-amber-600">
                Missing IDs: {diff.missingPlayers.slice(0, 3).join(', ')}
                {diff.missingPlayers.length > 3 && ` +${diff.missingPlayers.length - 3} more`}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLoad}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
}
