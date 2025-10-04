import React, { useState } from 'react';
import { Team, Player } from '../../lib/types';
import { useTeamsStore } from '../../store/teams';

interface PlayerTableProps {
  team: Team;
}

export default function PlayerTable({ team }: PlayerTableProps) {
  const { addPlayer, updatePlayer, removePlayer, isJerseyUnique, importPlayersCSV, exportPlayersCSV } = useTeamsStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jerseyError, setJerseyError] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    jersey: 0,
    primaryPos: '',
    foot: 'R',
    notes: '',
    status: 'available'
  });

  const handleAddPlayer = () => {
    if (!formData.name || !formData.jersey) return;
    
    if (!isJerseyUnique(team.id, formData.jersey)) {
      setJerseyError(`Jersey #${formData.jersey} is already taken`);
      return;
    }

    addPlayer(team.id, {
      name: formData.name,
      jersey: formData.jersey,
      primaryPos: formData.primaryPos,
      foot: formData.foot as 'L' | 'R' | 'B',
      notes: formData.notes,
      status: formData.status as 'available' | 'injured' | 'unavailable'
    });

    setFormData({
      name: '',
      jersey: 0,
      primaryPos: '',
      foot: 'R',
      notes: '',
      status: 'available'
    });
    setShowAddPlayer(false);
    setJerseyError('');
  };

  const handleUpdatePlayer = (playerId: string) => {
    if (!formData.name || !formData.jersey) return;
    
    if (!isJerseyUnique(team.id, formData.jersey, playerId)) {
      setJerseyError(`Jersey #${formData.jersey} is already taken`);
      return;
    }

    updatePlayer(team.id, playerId, formData);
    setEditingId(null);
    setFormData({
      name: '',
      jersey: 0,
      primaryPos: '',
      foot: 'R',
      notes: '',
      status: 'available'
    });
    setJerseyError('');
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setFormData({ ...player });
    setJerseyError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      jersey: 0,
      primaryPos: '',
      foot: 'R',
      notes: '',
      status: 'available'
    });
    setJerseyError('');
  };

  const handleExportCSV = () => {
    const csv = exportPlayersCSV(team.id);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${team.name.replace(/\s+/g, '_')}_players.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      importPlayersCSV(team.id, csv);
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Players ({team.players.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={team.players.length === 0}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <label className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Player
          </button>
        </div>
      </div>

      {jerseyError && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {jerseyError}
        </div>
      )}

      {showAddPlayer && (
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Player name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <input
              type="number"
              placeholder="Jersey #"
              value={formData.jersey || ''}
              onChange={(e) => {
                setFormData({ ...formData, jersey: parseInt(e.target.value) || 0 });
                setJerseyError('');
              }}
              className="px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder="Position (e.g., CM)"
              value={formData.primaryPos}
              onChange={(e) => setFormData({ ...formData, primaryPos: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <select
              value={formData.foot}
              onChange={(e) => setFormData({ ...formData, foot: e.target.value as 'L' | 'R' | 'B' })}
              className="px-2 py-1 border rounded"
            >
              <option value="R">Right</option>
              <option value="L">Left</option>
              <option value="B">Both</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddPlayer}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddPlayer(false);
                setJerseyError('');
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Position</th>
              <th className="text-left py-2 px-2">Foot</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.players
              .sort((a, b) => a.jersey - b.jersey)
              .map((player) => (
                <tr key={player.id} className="border-b hover:bg-gray-50">
                  {editingId === player.id ? (
                    <>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={formData.jersey}
                          onChange={(e) => {
                            setFormData({ ...formData, jersey: parseInt(e.target.value) || 0 });
                            setJerseyError('');
                          }}
                          className="w-12 px-1 py-0.5 border rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-1 py-0.5 border rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={formData.primaryPos}
                          onChange={(e) => setFormData({ ...formData, primaryPos: e.target.value })}
                          className="w-20 px-1 py-0.5 border rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={formData.foot}
                          onChange={(e) => setFormData({ ...formData, foot: e.target.value as 'L' | 'R' | 'B' })}
                          className="px-1 py-0.5 border rounded"
                        >
                          <option value="R">R</option>
                          <option value="L">L</option>
                          <option value="B">B</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Player['status'] })}
                          className="px-1 py-0.5 border rounded"
                        >
                          <option value="available">Available</option>
                          <option value="injured">Injured</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => handleUpdatePlayer(player.id)}
                          className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 mr-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-2 font-bold">{player.jersey}</td>
                      <td className="py-2 px-2">{player.name}</td>
                      <td className="py-2 px-2">{player.primaryPos || '-'}</td>
                      <td className="py-2 px-2">{player.foot || 'R'}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          player.status === 'available' 
                            ? 'bg-green-100 text-green-800'
                            : player.status === 'injured'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {player.status || 'available'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => startEdit(player)}
                          className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mr-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${player.name}?`)) {
                              removePlayer(team.id, player.id);
                            }
                          }}
                          className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
        {team.players.length === 0 && (
          <p className="text-center text-gray-500 py-4">No players yet. Add your first player!</p>
        )}
      </div>
    </div>
  );
}