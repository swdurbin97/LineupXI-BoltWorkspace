import React from 'react';
import TeamList from '../../components/teams/TeamList';
import TeamEditor from './TeamEditor';
import { useTeamsStore } from '../../store/teams';

export default function TeamsheetsPage() {
  const { getCurrentTeam } = useTeamsStore();
  const currentTeam = getCurrentTeam();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Teamsheets</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamList />
        </div>
        
        <div className="lg:col-span-2">
          {currentTeam ? (
            <TeamEditor team={currentTeam} />
          ) : (
            <div className="border rounded-lg p-8 bg-white text-center">
              <p className="text-gray-500">Select or create a team to manage players</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}