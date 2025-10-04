import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Team, Player } from '../lib/types';
import { saveLocal, loadLocal } from '../lib/persistence/local';
import { playersToCSV, csvToPlayers } from '../lib/csv';

const STORAGE_KEY = 'yslm_teams_v1';

interface TeamsState {
  teams: Team[];
  currentTeamId: string | null;
}

type TeamsAction =
  | { type: 'SET_TEAMS'; teams: Team[] }
  | { type: 'CREATE_TEAM'; team: Team }
  | { type: 'RENAME_TEAM'; teamId: string; name: string }
  | { type: 'DELETE_TEAM'; teamId: string }
  | { type: 'SET_CURRENT_TEAM'; teamId: string | null }
  | { type: 'ADD_PLAYER'; teamId: string; player: Player }
  | { type: 'UPDATE_PLAYER'; teamId: string; playerId: string; player: Partial<Player> }
  | { type: 'REMOVE_PLAYER'; teamId: string; playerId: string }
  | { type: 'SET_PLAYERS'; teamId: string; players: Player[] };

function teamsReducer(state: TeamsState, action: TeamsAction): TeamsState {
  switch (action.type) {
    case 'SET_TEAMS':
      return { ...state, teams: action.teams };
    
    case 'CREATE_TEAM':
      return { 
        ...state, 
        teams: [...state.teams, action.team],
        currentTeamId: action.team.id 
      };
    
    case 'RENAME_TEAM':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.teamId ? { ...t, name: action.name } : t
        )
      };
    
    case 'DELETE_TEAM':
      return {
        ...state,
        teams: state.teams.filter(t => t.id !== action.teamId),
        currentTeamId: state.currentTeamId === action.teamId ? null : state.currentTeamId
      };
    
    case 'SET_CURRENT_TEAM':
      return { ...state, currentTeamId: action.teamId };
    
    case 'ADD_PLAYER':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.teamId 
            ? { ...t, players: [...t.players, action.player] }
            : t
        )
      };
    
    case 'UPDATE_PLAYER':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.teamId 
            ? { 
                ...t, 
                players: t.players.map(p => 
                  p.id === action.playerId 
                    ? { ...p, ...action.player }
                    : p
                )
              }
            : t
        )
      };
    
    case 'REMOVE_PLAYER':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.teamId 
            ? { ...t, players: t.players.filter(p => p.id !== action.playerId) }
            : t
        )
      };
    
    case 'SET_PLAYERS':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.teamId 
            ? { ...t, players: action.players }
            : t
        )
      };
    
    default:
      return state;
  }
}

interface TeamsContextType extends TeamsState {
  createTeam: (name: string) => void;
  renameTeam: (teamId: string, name: string) => void;
  deleteTeam: (teamId: string) => void;
  setCurrentTeam: (teamId: string | null) => void;
  addPlayer: (teamId: string, player: Omit<Player, 'id'>) => void;
  updatePlayer: (teamId: string, playerId: string, player: Partial<Player>) => void;
  removePlayer: (teamId: string, playerId: string) => void;
  importPlayersCSV: (teamId: string, csv: string) => void;
  exportPlayersCSV: (teamId: string) => string;
  isJerseyUnique: (teamId: string, jersey: number, excludeId?: string) => boolean;
  getCurrentTeam: () => Team | null;
}

const TeamsContext = createContext<TeamsContextType | null>(null);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(teamsReducer, {
    teams: [],
    currentTeamId: null
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadLocal<TeamsState>(STORAGE_KEY, { teams: [], currentTeamId: null });
    dispatch({ type: 'SET_TEAMS', teams: stored.teams });
    if (stored.currentTeamId) {
      dispatch({ type: 'SET_CURRENT_TEAM', teamId: stored.currentTeamId });
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    saveLocal(STORAGE_KEY, state);
  }, [state]);

  const createTeam = (name: string) => {
    const team: Team = {
      id: `team-${Date.now()}`,
      name,
      players: []
    };
    dispatch({ type: 'CREATE_TEAM', team });
  };

  const renameTeam = (teamId: string, name: string) => {
    dispatch({ type: 'RENAME_TEAM', teamId, name });
  };

  const deleteTeam = (teamId: string) => {
    dispatch({ type: 'DELETE_TEAM', teamId });
  };

  const setCurrentTeam = (teamId: string | null) => {
    dispatch({ type: 'SET_CURRENT_TEAM', teamId });
  };

  const addPlayer = (teamId: string, player: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...player,
      id: `player-${Date.now()}`
    };
    dispatch({ type: 'ADD_PLAYER', teamId, player: newPlayer });
  };

  const updatePlayer = (teamId: string, playerId: string, player: Partial<Player>) => {
    dispatch({ type: 'UPDATE_PLAYER', teamId, playerId, player });
  };

  const removePlayer = (teamId: string, playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', teamId, playerId });
  };

  const importPlayersCSV = (teamId: string, csv: string) => {
    const players = csvToPlayers(csv);
    dispatch({ type: 'SET_PLAYERS', teamId, players });
  };

  const exportPlayersCSV = (teamId: string): string => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return '';
    return playersToCSV(team.players);
  };

  const isJerseyUnique = (teamId: string, jersey: number, excludeId?: string): boolean => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return true;
    return !team.players.some(p => 
      p.jersey === jersey && p.id !== excludeId
    );
  };

  const getCurrentTeam = (): Team | null => {
    if (!state.currentTeamId) return null;
    return state.teams.find(t => t.id === state.currentTeamId) || null;
  };

  return (
    <TeamsContext.Provider value={{
      ...state,
      createTeam,
      renameTeam,
      deleteTeam,
      setCurrentTeam,
      addPlayer,
      updatePlayer,
      removePlayer,
      importPlayersCSV,
      exportPlayersCSV,
      isJerseyUnique,
      getCurrentTeam
    }}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeamsStore() {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeamsStore must be used within TeamsProvider');
  }
  return context;
}