import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { list, remove, duplicate } from '../../lib/savedLineups';
import type { SavedLineup } from '../../types/lineup';
import { SavedLineupCard } from '../../components/saved/SavedLineupCard';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { RenameLineupModal } from '../../components/modals/RenameLineupModal';
import { toast } from '../../lib/toast';
import * as savedLineupsLib from '../../lib/savedLineups';

export default function SavedLineupsPage() {
  const navigate = useNavigate();
  const [lineups, setLineups] = useState<SavedLineup[]>(() => list());
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [formationFilter, setFormationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'updated-desc' | 'updated-asc' | 'name-asc' | 'name-desc'>('updated-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lineup: SavedLineup | null }>({
    isOpen: false,
    lineup: null
  });

  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; lineup: SavedLineup | null }>({
    isOpen: false,
    lineup: null
  });

  const refreshLineups = () => {
    setLineups(list());
  };

  const handleDelete = (id: string) => {
    try {
      remove(id);
      refreshLineups();
      toast('Lineup deleted', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      toast('Failed to delete lineup', 'error');
    }
  };

  const handleRename = (id: string, newName: string) => {
    try {
      const lineup = lineups.find(l => l.id === id);
      if (!lineup) return;
      savedLineupsLib.update({ ...lineup, name: newName });
      refreshLineups();
      toast('Lineup renamed', 'success');
    } catch (err) {
      console.error('Rename failed:', err);
      toast('Failed to rename lineup', 'error');
    }
  };

  const handleDuplicate = (id: string) => {
    try {
      duplicate(id);
      refreshLineups();
      toast('Lineup duplicated', 'success');
    } catch (err) {
      console.error('Duplicate failed:', err);
      toast('Failed to duplicate lineup', 'error');
    }
  };


  // Get unique teams and formations for filters
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    lineups.forEach(l => {
      if (l.teamName) teams.add(l.teamName);
    });
    return Array.from(teams).sort();
  }, [lineups]);

  const uniqueFormations = useMemo(() => {
    const formations = new Set<string>();
    lineups.forEach(l => formations.add(l.formation.name));
    return Array.from(formations).sort();
  }, [lineups]);

  // Filter and sort lineups
  const filteredLineups = useMemo(() => {
    let result = [...lineups];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.teamName?.toLowerCase().includes(q) ||
        l.formation.name.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
      );
    }

    // Team filter
    if (teamFilter !== 'all') {
      result = result.filter(l => l.teamName === teamFilter);
    }

    // Formation filter
    if (formationFilter !== 'all') {
      result = result.filter(l => l.formation.name === formationFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'updated-desc':
          return b.updatedAt - a.updatedAt;
        case 'updated-asc':
          return a.updatedAt - b.updatedAt;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [lineups, searchQuery, teamFilter, formationFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Lineups</h1>
          <p className="text-gray-600">{lineups.length} lineup{lineups.length !== 1 ? 's' : ''} saved</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search lineups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filters and controls */}
          <div className="flex flex-wrap gap-3">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>

            <select
              value={formationFilter}
              onChange={(e) => setFormationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Formations</option>
              {uniqueFormations.map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated-desc">Updated (newest)</option>
              <option value="updated-asc">Updated (oldest)</option>
              <option value="name-asc">A–Z</option>
              <option value="name-desc">Z–A</option>
            </select>

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {lineups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No saved lineups yet.</p>
            <button
              onClick={() => navigate('/lineup')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Open Lineup Builder
            </button>
          </div>
        ) : filteredLineups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No lineups match your filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLineups.map(lineup => (
              <SavedLineupCard
                key={lineup.id}
                lineup={lineup}
                onRename={() => setRenameModal({ isOpen: true, lineup })}
                onDuplicate={() => handleDuplicate(lineup.id)}
                onDelete={() => setDeleteModal({ isOpen: true, lineup })}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Formation</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Players</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredLineups.map(lineup => {
                  const onFieldCount = Object.values(lineup.assignments.onField).filter(id => id !== null).length;
                  return (
                    <tr key={lineup.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{lineup.name}</td>
                      <td className="px-4 py-3 text-gray-600">{lineup.teamName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{lineup.formation.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {onFieldCount}/11 on field, {lineup.assignments.bench.length} on bench
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(lineup.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, lineup: null })}
        onConfirm={() => deleteModal.lineup && handleDelete(deleteModal.lineup.id)}
        lineupName={deleteModal.lineup?.name || ''}
      />

      <RenameLineupModal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ isOpen: false, lineup: null })}
        onRename={(newName) => renameModal.lineup && handleRename(renameModal.lineup.id, newName)}
        currentName={renameModal.lineup?.name || ''}
      />
    </div>
  );
}
