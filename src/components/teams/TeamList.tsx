import React, { useState } from 'react';
import { useTeamsStore } from '../../store/teams';

export default function TeamList() {
  const { teams, currentTeamId, createTeam, setCurrentTeam, deleteTeam } = useTeamsStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeam, setShowNewTeam] = useState(false);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createTeam(newTeamName.trim());
      setNewTeamName('');
      setShowNewTeam(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        <button
          onClick={() => setShowNewTeam(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Team
        </button>
      </div>

      {showNewTeam && (
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="w-full px-3 py-2 border rounded mb-2"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateTeam}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewTeam(false);
                setNewTeamName('');
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-sm">No teams yet. Create your first team!</p>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className={`p-3 rounded cursor-pointer flex items-center justify-between ${
                currentTeamId === team.id
                  ? 'bg-blue-100 border-blue-300 border'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentTeam(team.id)}
            >
              <div>
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-gray-500">
                  {team.players.length} players
                </div>
              </div>
              {currentTeamId === team.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete team "${team.name}"?`)) {
                      deleteTeam(team.id);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}