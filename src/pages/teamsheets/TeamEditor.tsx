import React, { useState } from 'react';
import { Team } from '../../lib/types';
import { useTeamsStore } from '../../store/teams';
import PlayerTable from './PlayerTable';

interface TeamEditorProps {
  team: Team;
}

export default function TeamEditor({ team }: TeamEditorProps) {
  const { renameTeam } = useTeamsStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState(team.name);

  const handleSaveName = () => {
    if (teamName.trim() && teamName !== team.name) {
      renameTeam(team.id, teamName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="text-xl font-semibold px-2 py-1 border rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setTeamName(team.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTeamName(team.name);
                setIsEditingName(false);
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <h2 
            className="text-xl font-semibold cursor-pointer hover:text-blue-600"
            onClick={() => setIsEditingName(true)}
            title="Click to edit team name"
          >
            {team.name}
          </h2>
        )}
      </div>

      <PlayerTable team={team} />
    </div>
  );
}