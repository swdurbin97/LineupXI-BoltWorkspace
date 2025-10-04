import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Lineup } from '../lib/types';
import { saveLocal, loadLocal } from '../lib/persistence/local';
import { migrateWorkingLineup } from '../lib/migrate';

const STORAGE_KEY = 'yslm_lineup_working_v1';

interface LineupsState {
  working: Lineup | null;
}

type LineupsAction =
  | { type: 'SET_LINEUP'; lineup: Lineup | null }
  | { type: 'PLACE_PLAYER'; slot: string; playerId: string }
  | { type: 'REMOVE_FROM_SLOT'; slot: string }
  | { type: 'SWAP_SLOTS'; slotA: string; slotB: string }
  | { type: 'SET_FORMATION'; formationCode: string; slotCodes: string[] }
  | { type: 'SET_ROLE'; role: keyof Lineup['roles']; playerId: string | undefined }
  | { type: 'ASSIGN_TO_BENCH'; index: number; playerId: string }
  | { type: 'REMOVE_FROM_BENCH'; index: number }
  | { type: 'SWAP_BENCH_BENCH'; indexA: number; indexB: number }
  | { type: 'MOVE_TO_BENCH'; index: number; playerId: string; fromSlot?: string };

function lineupsReducer(state: LineupsState, action: LineupsAction): LineupsState {
  switch (action.type) {
    case 'SET_LINEUP':
      return { working: action.lineup };
    
    case 'PLACE_PLAYER': {
      if (!state.working) return state;
      
      // Remove player from bench if they're there
      const newBench = state.working.bench.filter(id => id !== action.playerId);
      
      // Remove player from any current slot
      const newOnField = { ...state.working.onField };
      Object.keys(newOnField).forEach(slot => {
        if (newOnField[slot] === action.playerId) {
          newOnField[slot] = null;
        }
      });
      
      // Place player in new slot
      newOnField[action.slot] = action.playerId;
      
      return {
        working: {
          ...state.working,
          onField: newOnField,
          bench: newBench
        }
      };
    }
    
    case 'REMOVE_FROM_SLOT': {
      if (!state.working) return state;
      
      const playerId = state.working.onField[action.slot];
      if (!playerId) return state;
      
      return {
        working: {
          ...state.working,
          onField: {
            ...state.working.onField,
            [action.slot]: null
          },
          bench: [...state.working.bench, playerId]
        }
      };
    }
    
    case 'SWAP_SLOTS': {
      if (!state.working) return state;
      
      const playerA = state.working.onField[action.slotA];
      const playerB = state.working.onField[action.slotB];
      
      return {
        working: {
          ...state.working,
          onField: {
            ...state.working.onField,
            [action.slotA]: playerB || null,
            [action.slotB]: playerA || null
          }
        }
      };
    }
    
    case 'SET_FORMATION': {
      if (!state.working) return state;
      
      // Create new onField object with new slot codes
      const newOnField: Record<string, string | null> = {};
      action.slotCodes.forEach(code => {
        // Try to preserve existing placements if slot exists
        newOnField[code] = state.working!.onField[code] || null;
      });
      
      // Move players who lost their slots to bench
      const removedPlayers: string[] = [];
      Object.entries(state.working.onField).forEach(([slot, playerId]) => {
        if (playerId && !action.slotCodes.includes(slot)) {
          removedPlayers.push(playerId);
        }
      });
      
      return {
        working: {
          ...state.working,
          formationCode: action.formationCode,
          onField: newOnField,
          bench: [...state.working.bench, ...removedPlayers]
        }
      };
    }
    
    case 'SET_ROLE': {
      if (!state.working) return state;
      
      return {
        working: {
          ...state.working,
          roles: {
            ...state.working.roles,
            [action.role]: action.playerId
          }
        }
      };
    }
    
    case 'ASSIGN_TO_BENCH': {
      if (!state.working) return state;
      
      // Remove player from field if they're there
      const newOnField = { ...state.working.onField };
      Object.keys(newOnField).forEach(slot => {
        if (newOnField[slot] === action.playerId) {
          newOnField[slot] = null;
        }
      });
      
      // Remove from other bench slots
      const newBenchSlots = [...(state.working.benchSlots || Array(8).fill(null))];
      newBenchSlots.forEach((id, idx) => {
        if (id === action.playerId) newBenchSlots[idx] = null;
      });
      
      // Assign to new bench slot
      newBenchSlots[action.index] = action.playerId;
      
      return {
        working: {
          ...state.working,
          onField: newOnField,
          benchSlots: newBenchSlots
        }
      };
    }
    
    case 'REMOVE_FROM_BENCH': {
      if (!state.working) return state;
      
      const newBenchSlots = [...(state.working.benchSlots || Array(8).fill(null))];
      newBenchSlots[action.index] = null;
      
      return {
        working: {
          ...state.working,
          benchSlots: newBenchSlots
        }
      };
    }
    
    case 'SWAP_BENCH_BENCH': {
      if (!state.working) return state;
      
      const newBenchSlots = [...(state.working.benchSlots || Array(8).fill(null))];
      const temp = newBenchSlots[action.indexA];
      newBenchSlots[action.indexA] = newBenchSlots[action.indexB];
      newBenchSlots[action.indexB] = temp;
      
      return {
        working: {
          ...state.working,
          benchSlots: newBenchSlots
        }
      };
    }
    
    case 'MOVE_TO_BENCH': {
      if (!state.working) return state;
      
      // If from slot, remove from that slot
      const newOnField = { ...state.working.onField };
      if (action.fromSlot) {
        newOnField[action.fromSlot] = null;
      }
      
      // Remove from other bench slots
      const newBenchSlots = [...(state.working.benchSlots || Array(8).fill(null))];
      newBenchSlots.forEach((id, idx) => {
        if (id === action.playerId && idx !== action.index) {
          newBenchSlots[idx] = null;
        }
      });
      
      // Assign to bench
      newBenchSlots[action.index] = action.playerId;
      
      return {
        working: {
          ...state.working,
          onField: newOnField,
          benchSlots: newBenchSlots
        }
      };
    }
    
    default:
      return state;
  }
}

interface LineupsContextType extends LineupsState {
  startLineup: (teamId: string, formationCode: string, slotCodes: string[], rosterIds: string[]) => void;
  placePlayer: (slot: string, playerId: string) => void;
  removeFromSlot: (slot: string) => void;
  swapSlots: (slotA: string, slotB: string) => void;
  setFormation: (formationCode: string, slotCodes: string[]) => void;
  setRole: (role: keyof Lineup['roles'], playerId?: string) => void;
  resetWorking: () => void;
  assignToBench: (index: number, playerId: string) => void;
  removeFromBench: (index: number) => void;
  swapBenchBench: (indexA: number, indexB: number) => void;
  moveToBench: (index: number, playerId: string, fromSlot?: string) => void;
}

const LineupsContext = createContext<LineupsContextType | null>(null);

export function LineupsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(lineupsReducer, {
    working: null
  });
  const formationsSeedRef = useRef<any>(null);

  // Load from localStorage on mount with migration
  useEffect(() => {
    const loadAndMigrate = async () => {
      try {
        // Load formations from canonical source
        const response = await fetch('/data/formations.json');
        const data = await response.json();
        formationsSeedRef.current = data;
        
        // Load and migrate stored lineup
        const raw = loadLocal<any>(STORAGE_KEY, null);
        if (raw) {
          const migrated = migrateWorkingLineup(raw, data);
          if (migrated) {
            dispatch({ type: 'SET_LINEUP', lineup: migrated });
            // Save migrated data back
            saveLocal(STORAGE_KEY, migrated);
          }
        }
      } catch (error) {
        console.error('Failed to load/migrate lineup:', error);
        // Try loading without migration as fallback
        const stored = loadLocal<Lineup | null>(STORAGE_KEY, null);
        if (stored) {
          dispatch({ type: 'SET_LINEUP', lineup: stored });
        }
      }
    };
    
    loadAndMigrate();
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (state.working) {
      // Ensure normalized shape before saving
      const normalized: Lineup = {
        ...state.working,
        benchSlots: state.working.benchSlots?.length === 8 
          ? state.working.benchSlots 
          : Array(8).fill(null),
        bench: state.working.bench || [],
        roles: state.working.roles || {}
      };
      saveLocal(STORAGE_KEY, normalized);
    } else {
      // Clear storage when working is null
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [state.working]);

  const startLineup = (teamId: string, formationCode: string, slotCodes: string[], rosterIds: string[]) => {
    const onField: Record<string, string | null> = {};
    slotCodes.forEach(code => {
      onField[code] = null;
    });

    const lineup: Lineup = {
      teamId,
      formationCode,
      onField,
      bench: [], // DEPRECATED
      benchSlots: Array(8).fill(null), // 8 empty bench slots
      roles: {}
    };
    
    dispatch({ type: 'SET_LINEUP', lineup });
  };

  const placePlayer = (slot: string, playerId: string) => {
    dispatch({ type: 'PLACE_PLAYER', slot, playerId });
  };

  const removeFromSlot = (slot: string) => {
    dispatch({ type: 'REMOVE_FROM_SLOT', slot });
  };

  const swapSlots = (slotA: string, slotB: string) => {
    dispatch({ type: 'SWAP_SLOTS', slotA, slotB });
  };

  const setFormation = (formationCode: string, slotCodes: string[]) => {
    dispatch({ type: 'SET_FORMATION', formationCode, slotCodes });
  };

  const setRole = (role: keyof Lineup['roles'], playerId?: string) => {
    dispatch({ type: 'SET_ROLE', role, playerId });
  };

  const resetWorking = () => {
    dispatch({ type: 'SET_LINEUP', lineup: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const assignToBench = (index: number, playerId: string) => {
    dispatch({ type: 'ASSIGN_TO_BENCH', index, playerId });
  };

  const removeFromBench = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_BENCH', index });
  };

  const swapBenchBench = (indexA: number, indexB: number) => {
    dispatch({ type: 'SWAP_BENCH_BENCH', indexA, indexB });
  };

  const moveToBench = (index: number, playerId: string, fromSlot?: string) => {
    dispatch({ type: 'MOVE_TO_BENCH', index, playerId, fromSlot });
  };

  return (
    <LineupsContext.Provider value={{
      ...state,
      startLineup,
      placePlayer,
      removeFromSlot,
      swapSlots,
      setFormation,
      setRole,
      resetWorking,
      assignToBench,
      removeFromBench,
      swapBenchBench,
      moveToBench
    }}>
      {children}
    </LineupsContext.Provider>
  );
}

export function useLineupsStore() {
  const context = useContext(LineupsContext);
  if (!context) {
    throw new Error('useLineupsStore must be used within LineupsProvider');
  }
  return context;
}