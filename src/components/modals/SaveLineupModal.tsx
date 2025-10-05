import React, { useState, useEffect } from 'react';
import type { SavedLineup } from '../../types/lineup';

interface SaveLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; notes?: string }) => void;
  mode: 'save' | 'saveAs';
  currentLineup?: SavedLineup | null;
  defaultName: string;
  teamName?: string | null;
  formationName: string;
  onFieldCount: number;
  benchCount: number;
}

export function SaveLineupModal({
  isOpen,
  onClose,
  onSave,
  mode,
  currentLineup,
  defaultName,
  teamName,
  formationName,
  onFieldCount,
  benchCount
}: SaveLineupModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'save' && currentLineup) {
        setName(currentLineup.name);
        setNotes(currentLineup.notes || '');
      } else {
        setName(defaultName);
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, mode, currentLineup, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    onSave({ name: trimmedName, notes: notes.trim() || undefined });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'save' ? 'Save Changes' : 'Save Lineup'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="lineup-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lineup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter lineup name"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          {/* Team (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <input
              type="text"
              value={teamName || 'No team selected'}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="lineup-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="lineup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add any notes about this lineup"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Formation:</span>
              <span className="font-medium">{formationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">On field:</span>
              <span className="font-medium">{onFieldCount} players</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bench:</span>
              <span className="font-medium">{benchCount} players</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              {mode === 'save' ? 'Save Changes' : 'Save Lineup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
