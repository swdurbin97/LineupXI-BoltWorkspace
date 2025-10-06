import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeamsStore } from '../../store/teams';
import { useLineupsStore } from '../../store/lineups';
import FormationPicker from '../../components/lineup/FormationPicker';
import SlotMarker from '../../components/lineup/SlotMarker';
import AvailableGrid from '../../components/lineup/AvailableGrid';
import BenchGrid from '../../components/lineup/BenchGrid';
import ErrorBoundary from './ErrorBoundary';
import { LAYOUT } from './layout-constants';
import { getLayoutParams } from '../../lib/layout';
import { loadOverrides, applyOverrides, mergeOverrides, downloadOverrides, FormationOverrides } from '../../lib/formationOverrides';
import pitchSvg from '../../assets/pitch.svg';
import { useElementSize } from '../../lib/useElementSize';
import { useFieldFit } from '../../lib/useFieldFit';
import { CARD_H, GAP_X, PAD_M, PAD_S, PAD_L, UI_SCALE } from '../../lib/sizes';
import { SaveLineupModal } from '../../components/modals/SaveLineupModal';
import { serializeLineup, isEqual } from '../../lib/lineupSerializer';
import * as savedLineupsLib from '../../lib/savedLineups';
import type { SavedLineup, SerializedBuilderState } from '../../types/lineup';
import { toast } from '../../lib/toast';

function LineupPageContent() {
  const { teams, currentTeamId, setCurrentTeam } = useTeamsStore();
  const { working, startLineup, placePlayer, removeFromSlot, setRole, resetWorking, assignToBench, removeFromBench } = useLineupsStore();
  const [formations, setFormations] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [editDraft, setEditDraft] = useState<FormationOverrides>(() => {
    try {
      const saved = localStorage.getItem('yslm_overrides_draft');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [fieldSize, setFieldSize] = useState<'fit' | 's' | 'm' | 'l'>(() => {
    try {
      return localStorage.getItem('yslm_field_size') as any || 'fit';
    } catch {
      return 'fit';
    }
  });
  const [positionsEditor, setPositionsEditor] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yslm_positions_editor') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null);

  // Saved lineup state
  const navigate = useNavigate();
  const [loadedLineupId, setLoadedLineupId] = useState<string | null>(null);
  const [loadedLineupName, setLoadedLineupName] = useState<string>('');
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<SerializedBuilderState | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Field sizing
  const { availRef, fieldRef, fitH, recalc } = useFieldFit();
  const { ref: fieldContainerRef, width: fieldWidth } = useElementSize<HTMLDivElement>();
  const scale = 1; // No scaling anymore, all cards are fixed size
  
  // Layout params & edit mode
  const lp = getLayoutParams();
  const debugCls = lp.debug ? 'outline outline-1 outline-dashed outline-sky-400 relative' : '';
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const editMode = q.has('editPositions');
  
  // Track window width for field sizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentTeam = teams.find(t => t.id === currentTeamId);
  
  // Calculate target field height
  const targetH = fieldSize === 'fit' ? fitH : 
                  fieldSize === 's' ? Math.round(520 * UI_SCALE) : 
                  fieldSize === 'm' ? Math.round(620 * UI_SCALE) : 
                  Math.round(720 * UI_SCALE);
  
  // Position update handler for edit mode (hoisted to avoid TDZ)
  function updatePosition(formationCode: string, slotCode: string, x: number, y: number) {
    setEditDraft(prev => ({
      ...prev,
      [formationCode]: {
        ...(prev[formationCode] || {}),
        slots: {
          ...((prev[formationCode]?.slots) || {}),
          [slotCode]: { x, y }
        }
      }
    }));
  }
  
  // Nudge handler for arrow keys (hoisted to avoid TDZ)
  function handleNudge(slotCode: string, dx: number, dy: number) {
    // Defensive guard
    if (!positionsEditor || !slotCode || !working?.formation) return;
    
    const formation = formations.find(f => f.code === working.formation);
    if (!formation) return;
    
    const slot = formation.slot_map.find((s: any) => s.slot_code === slotCode);
    if (!slot) return;
    
    // Get current position (from draft if exists, otherwise base)
    const currentX = editDraft[working.formation]?.slots?.[slotCode]?.x ?? slot.x;
    const currentY = editDraft[working.formation]?.slots?.[slotCode]?.y ?? slot.y;
    
    // Apply nudge and clamp
    const newX = Math.max(6, Math.min(94, currentX + dx));
    const newY = Math.max(6, Math.min(94, currentY + dy));
    
    updatePosition(working.formation, slotCode, newX, newY);
  }
  
  // Save field size preference
  useEffect(() => {
    try {
      localStorage.setItem('yslm_field_size', fieldSize);
    } catch {}
  }, [fieldSize]);
  
  // Save editor state preference
  useEffect(() => {
    try {
      localStorage.setItem('yslm_positions_editor', String(positionsEditor));
    } catch {}
  }, [positionsEditor]);
  
  // Save draft to localStorage
  useEffect(() => {
    try {
      if (Object.keys(editDraft).length > 0) {
        localStorage.setItem('yslm_overrides_draft', JSON.stringify(editDraft));
      } else {
        localStorage.removeItem('yslm_overrides_draft');
      }
    } catch {}
  }, [editDraft]);
  
  // Central keyboard handler for position editor
  useEffect(() => {
    if (!positionsEditor || !selectedSlotCode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isWASD = ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key);
      
      if (!isArrow && !isWASD) return;
      
      e.preventDefault();
      const fine = e.shiftKey;
      const step = fine ? 0.2 : 0.8;
      
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -step;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = step;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -step;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = step;
      
      handleNudge(selectedSlotCode, dx, dy);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [positionsEditor, selectedSlotCode]);
  
  // Export handler
  const handleExport = async () => {
    try {
      const existing = await loadOverrides();
      const merged = mergeOverrides(existing, editDraft);
      downloadOverrides(merged);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  // Reset current formation handler
  const handleResetFormation = () => {
    if (!working?.formation) return;
    setEditDraft(prev => {
      const updated = { ...prev };
      delete updated[working.formation];
      return updated;
    });
  };
  
  // Old download handler (for backwards compat)
  const downloadOverridesOld = () => {
    const blob = new Blob([JSON.stringify(editDraft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formation-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle reset URL param and cleanup on mount
  useEffect(() => {
    // Check for reset param
    const params = new URLSearchParams(window.location.search);
    if (params.get('resetLineup') === '1') {
      resetWorking();
      // Remove the query param
      const url = new URL(window.location.href);
      url.searchParams.delete('resetLineup');
      window.history.replaceState({}, '', url.toString());
    }
    
    // Cleanup old orientation key
    try {
      localStorage.removeItem('yslm_orientation_v1');
    } catch {}
  }, [resetWorking]);

  useEffect(() => {
    // Load formations from canonical source
    const loadFormations = async () => {
      try {
        const res = await fetch('/data/formations.json');
        const data = await res.json();
        setFormations(data.formations || []);
      } catch {
        setFormations([]);
      }
    };
    loadFormations();
  }, []);

  // Saved lineup: compute current serialized state and dirty flag
  const currentFormation = useMemo(() => {
    if (!working?.formationCode) return null;
    const f = formations.find(fm => fm.code === working.formationCode);
    return f ? { code: f.code, name: f.name } : null;
  }, [working?.formationCode, formations]);

  const currentSerialized = useMemo(() => {
    if (!working || !currentFormation) return null;
    return serializeLineup(working, currentFormation.name, currentTeam?.name);
  }, [working, currentFormation, currentTeam]);

  const isDirty = useMemo(() => {
    if (!lastSavedSnapshot) return true;
    if (!currentSerialized) return false;
    return !isEqual(currentSerialized, lastSavedSnapshot);
  }, [currentSerialized, lastSavedSnapshot]);

  // Debug diagnostics
  useEffect(() => {
    (window as any).__dumpLineup = () => {
      const saved = localStorage.getItem('lineupxi:saved_lineups:v1');
      return {
        currentSerialized,
        currentFormation,
        loadedLineupId,
        loadedLineupName,
        isDirty,
        working: working ? {
          teamId: working.teamId,
          formationCode: working.formationCode,
          onFieldKeys: Object.keys(working.onField || {}),
          onFieldCount: Object.values(working.onField || {}).filter(Boolean).length,
          benchCount: (working.benchSlots || []).filter(Boolean).length
        } : null,
        saved: saved ? JSON.parse(saved) : []
      };
    };

    return () => {
      delete (window as any).__dumpLineup;
    };
  }, [currentSerialized, currentFormation, loadedLineupId, loadedLineupName, isDirty, working]);

  // Saved lineup: handlers
  const handleSave = () => {
    if (!canSave) {
      toast('You need a full XI with exactly 1 GK to save', 'error');
      return;
    }

    if (loadedLineupId) {
      // Update existing lineup
      if (!currentSerialized || !currentFormation) {
        toast('No lineup data to save', 'error');
        return;
      }

      try {
        const existing = savedLineupsLib.get(loadedLineupId);
        if (!existing) {
          toast('Lineup not found', 'error');
          return;
        }

        console.log('Saving changes:', {
          onFieldKeys: Object.keys(currentSerialized.assignments.onField),
          onFieldCount: Object.values(currentSerialized.assignments.onField).filter(Boolean).length,
          benchLen: currentSerialized.assignments.bench.length
        });

        const updated = savedLineupsLib.update({
          ...existing,
          name: existing.name,
          formation: currentFormation,
          assignments: currentSerialized.assignments,
          teamId: currentSerialized.teamId,
          teamName: currentSerialized.teamName,
          roles: working?.roles
        });
        setLastSavedSnapshot(currentSerialized);
        toast('Changes saved', 'success');
      } catch (err) {
        if (err instanceof savedLineupsLib.StorageFullError) {
          toast(err.message, 'error');
        } else {
          console.error('Save failed:', err);
          toast('Failed to save lineup', 'error');
        }
      }
    } else {
      // No lineup loaded - open Save modal
      setSaveModalOpen(true);
    }
  };

  const handleSaveNew = (data: { name: string; notes?: string; createCopy?: boolean }) => {
    if (!currentSerialized || !currentFormation) {
      console.error('handleSaveNew: Missing data', { currentSerialized, currentFormation });
      toast('No lineup data to save', 'error');
      return;
    }

    console.log('serializeLineup (handleSaveNew):', {
      onFieldKeys: Object.keys(currentSerialized.assignments.onField),
      onFieldCount: Object.values(currentSerialized.assignments.onField).filter(Boolean).length,
      benchLen: currentSerialized.assignments.bench.length,
      formation: currentFormation,
      teamId: currentSerialized.teamId,
      createCopy: data.createCopy
    });

    try {
      if (data.createCopy && loadedLineupId) {
        // Create a copy instead of updating
        const saved = savedLineupsLib.saveNew({
          name: data.name,
          formation: currentFormation,
          assignments: currentSerialized.assignments,
          teamId: currentSerialized.teamId,
          teamName: currentSerialized.teamName,
          roles: working?.roles,
          notes: data.notes
        });
        console.log('Created copy:', saved.id, saved.name);
        setLoadedLineupId(saved.id);
        setLoadedLineupName(saved.name);
        setLastSavedSnapshot(currentSerialized);
        toast('Copy created', 'success');
      } else if (loadedLineupId) {
        // Update existing lineup
        const existing = savedLineupsLib.get(loadedLineupId);
        if (!existing) {
          toast('Lineup not found', 'error');
          return;
        }
        savedLineupsLib.update({
          ...existing,
          name: data.name,
          formation: currentFormation,
          assignments: currentSerialized.assignments,
          teamId: currentSerialized.teamId,
          teamName: currentSerialized.teamName,
          roles: working?.roles,
          notes: data.notes
        });
        setLoadedLineupName(data.name);
        setLastSavedSnapshot(currentSerialized);
        toast('Lineup updated', 'success');
      } else {
        // New lineup
        const saved = savedLineupsLib.saveNew({
          name: data.name,
          formation: currentFormation,
          assignments: currentSerialized.assignments,
          teamId: currentSerialized.teamId,
          teamName: currentSerialized.teamName,
          roles: working?.roles,
          notes: data.notes
        });
        console.log('Saved lineup:', saved.id, saved.name);
        setLoadedLineupId(saved.id);
        setLoadedLineupName(saved.name);
        setLastSavedSnapshot(currentSerialized);
        toast('Lineup saved', 'success');
      }
    } catch (err) {
      if (err instanceof savedLineupsLib.StorageFullError) {
        toast(err.message, 'error');
      } else {
        console.error('Save failed:', err);
        toast('Failed to save lineup', 'error');
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    // Initialize lineup when team is selected and no working lineup exists
    if (currentTeam && (!working || working.teamId !== currentTeam.id)) {
      const defaultFormation = formations[0];
      if (defaultFormation) {
        const slots = defaultFormation.slot_map.map((s: any) => ({
          slot_id: s.slot_id,
          slot_code: s.slot_code
        }));
        const rosterIds = currentTeam.players.map(p => p.id);
        startLineup(currentTeam.id, defaultFormation.code, slots, rosterIds);
      }
    }
  }, [currentTeam, formations, working]);

  if (!currentTeamId || !currentTeam) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Lineup Builder</h1>
        
        {teams.length === 0 ? (
          <div className="border rounded-lg p-8 bg-white text-center">
            <p className="text-gray-500 mb-4">No teams found. Please create a team first.</p>
            <a href="/teamsheets" className="text-blue-600 hover:underline">
              Go to Teamsheets →
            </a>
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-white">
            <p className="text-gray-600 mb-4">Select a team to build a lineup:</p>
            <div className="space-y-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setCurrentTeam(team.id)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-500">{team.players.length} players</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Check GK count by slot ID pattern (e.g., "4231w:GK:0")
  const gkCount = working?.onField
    ? Object.entries(working.onField).filter(
        ([slotId, playerId]) => /:GK:\d+$/.test(slotId) && playerId
      ).length
    : 0;

  const onFieldCount = working?.onField
    ? Object.values(working.onField).filter(id => id).length
    : 0;
  const maxPlayers = 11;

  const canSave = onFieldCount === 11 && gkCount === 1;

  // Compute available players (not on field, not on bench)
  const availablePlayers = useMemo(() => {
    if (!currentTeam || !working) return [];
    
    const onFieldIds = new Set(Object.values(working.onField || {}).filter(Boolean));
    const benchSlots = working.benchSlots ?? Array(8).fill(null);
    const benchIds = new Set(benchSlots.filter(Boolean));
    
    return currentTeam.players.filter(p => 
      !onFieldIds.has(p.id) && !benchIds.has(p.id)
    );
  }, [currentTeam, working]);

  return (
    <div className="mx-auto w-full px-4 py-4" style={{ maxWidth: lp.fw || 1280 }}>
      {/* Compact header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Team selector */}
          <select
            value={currentTeamId}
            onChange={(e) => setCurrentTeam(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="">Select Team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          
          {/* Formation selector */}
          <FormationPicker />
          
          {/* Field Size selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Field Size:</span>
            <div className="flex gap-1">
              {['fit', 's', 'm', 'l'].map(size => (
                <button
                  key={size}
                  onClick={() => setFieldSize(size as any)}
                  className={`px-2 py-1 text-xs rounded ${
                    fieldSize === size 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          {/* Orientation badge */}
          <span className="text-xs px-2 py-1 rounded bg-gray-100">
            Orientation: Left → Right
          </span>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Save / Save Changes button */}
          <div className="inline-flex flex-col shrink-0">
            <button
              onClick={handleSave}
              disabled={!canSave || (loadedLineupId && !isDirty)}
              className={`min-w-[132px] px-3 py-1 text-sm rounded transition-colors font-medium ${
                !canSave || (loadedLineupId && !isDirty)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={!canSave ? 'Add a full XI with exactly 1 GK to save' : 'Ctrl/Cmd+S'}
            >
              {loadedLineupId ? 'Save Changes' : 'Save Lineup'}
            </button>
            {!canSave && (
              <div className="mt-1 max-w-[280px] text-xs text-slate-500 leading-snug" role="status" aria-live="polite">
                You can save once you have 11 starters with exactly 1 GK.
              </div>
            )}
          </div>

          {/* Send Rest to Bench button */}
          <button
            className={`px-3 py-1 text-sm rounded transition-colors ${
              !working || availablePlayers.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={() => {
              if (!working || availablePlayers.length === 0) return;

              // Get empty bench slots
              const benchSlots = working.benchSlots ?? Array(8).fill(null);
              const emptySlotIndices: number[] = [];
              benchSlots.forEach((slot, idx) => {
                if (!slot) emptySlotIndices.push(idx);
              });

              // Assign available players to empty bench slots
              const toAssign = Math.min(availablePlayers.length, emptySlotIndices.length);
              for (let i = 0; i < toAssign; i++) {
                assignToBench(emptySlotIndices[i], availablePlayers[i].id);
              }
            }}
            disabled={!working || availablePlayers.length === 0}
          >
            Send to Bench
          </button>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mb-3 flex items-center gap-4 text-sm">
        <div className={`px-2 py-1 rounded ${
          onFieldCount === maxPlayers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {onFieldCount}/{maxPlayers} on field
        </div>
        {gkCount !== 1 && (
          <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
            ⚠️ Need exactly 1 GK (have {gkCount})
          </div>
        )}
      </div>

      {/* Section 2: Available Players (full-width) */}
      {currentTeam && working && (
        <div className={`mb-4 ${debugCls}`}>
          {lp.debug && 
            <span className="absolute -top-2 left-2 text-[10px] bg-sky-50 px-1 rounded z-10">
              Available
            </span>
          }
          <div className="rounded-lg border bg-white w-full" style={{ padding: `${PAD_M}px` }}>
            <h3 className="text-sm font-semibold mb-2">
              Available Players ({availablePlayers.length})
            </h3>
            <div ref={availRef}>
              <AvailableGrid 
                players={availablePlayers}
                scale={scale}
                onAutoPlace={(playerId) => {
                  console.log('Auto-place player:', playerId);
                  // TODO: Implement auto-place logic
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Field (full-width) */}
      <div className={`mb-4 ${debugCls}`}>
        {lp.debug && 
          <span className="absolute -top-2 left-2 text-[10px] bg-sky-50 px-1 rounded z-10">
            Field
          </span>
        }
        <div ref={fieldRef} className="rounded-lg border bg-white w-full" style={{ padding: `${PAD_M}px` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Field</h3>
            <button
              onClick={() => setPositionsEditor(!positionsEditor)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                positionsEditor 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Adjust Positions {positionsEditor ? 'ON' : 'OFF'}
            </button>
          </div>
            {working && formations.length > 0 && (
              <div className="relative">
                {/* Editor HUD */}
                {positionsEditor && (
                  <div className="absolute top-0 right-0 z-20 bg-white border rounded-lg shadow-lg p-3 m-2">
                    <div className="text-xs font-semibold mb-2 text-blue-600">Position Editor</div>
                    <div className="space-y-2">
                      <button
                        onClick={handleExport}
                        className="w-full px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
                        disabled={Object.keys(editDraft).length === 0}
                      >
                        Export overrides.json
                      </button>
                      <button
                        onClick={handleResetFormation}
                        className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        disabled={!editDraft[working?.formation || '']}
                      >
                        Reset this formation
                      </button>
                    </div>
                    <div className="mt-3 text-[10px] text-gray-500">
                      Click slot → use arrows<br/>
                      Shift+arrows for fine<br/>
                      Save to /public/data/
                    </div>
                  </div>
                )}
                
                <div className="relative w-full rounded-lg border overflow-hidden" style={{ height: targetH }}>
                  <div className="relative w-full h-full">
                    {/* AR box centered horizontally */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-0" 
                      style={{ 
                        height: targetH, 
                        width: Math.floor(targetH * (105/68))
                      }}
                    >
                  {/* 1) Green gradient fills 100% */}
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, #198754 0%, #0f5132 100%)'
                  }} />
                  {/* 2) Pitch lines on top, scaled to box */}
                  <img
                    src={pitchSvg}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    alt=""
                  />
                  {/* 3) Slot markers absolutely positioned INSIDE this box */}
                  {(() => {
                    const formation = formations.find(f => f.code === working.formationCode);
                    if (!formation) return null;
                    
                    return formation.slot_map.map((slot: any) => {
                      const playerId = working.onField?.[slot.slot_id];
                      const player = playerId ? currentTeam.players.find(p => p.id === playerId) : undefined;

                      // Use draft positions if available in edit mode
                      const draftPos = editDraft[working.formationCode]?.slots?.[slot.slot_code];
                      const baseX = draftPos?.x ?? slot.x;
                      const baseY = draftPos?.y ?? slot.y;

                      // Canonical data: absolute 105×68, bottom-left origin
                      // SlotMarker needs: percentage 0-100, top-left origin
                      const PITCH_W = 105;
                      const PITCH_H = 68;

                      const renderX = (baseX / PITCH_W) * 100;
                      const renderY = ((PITCH_H - baseY) / PITCH_H) * 100; // Flip Y

                      return (
                        <SlotMarker
                          key={slot.slot_id}
                          slotId={slot.slot_id}
                          slotCode={slot.slot_code}
                          x={renderX}
                          y={renderY}
                          player={player}
                          isSelected={selectedSlotCode === slot.slot_code}
                          tunerOn={positionsEditor}
                          scale={scale}
                          onNudge={positionsEditor ? handleNudge : undefined}
                          onSelect={positionsEditor ? setSelectedSlotCode : undefined}
                          onClick={() => {
                            if (selectedPlayerId) {
                              // If a bench player is selected, place them here
                              const benchSlots = working.benchSlots ?? [];
                              if (benchSlots.includes(selectedPlayerId)) {
                                placePlayer(slot.slot_id, selectedPlayerId);
                                setSelectedPlayerId(null);
                              }
                            } else if (playerId) {
                              // If slot has a player, remove them to bench
                              removeFromSlot(slot.slot_id);
                            }
                          }}
                          onDrop={!editMode ? (draggedPlayerId) => {
                            // Handle drop - place player in this slot using slot_id
                            placePlayer(slot.slot_id, draggedPlayerId);
                            setSelectedPlayerId(null);
                          } : undefined}
                        />
                      );
                    });
                  })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(!working || formations.length === 0) && (
              <div className="bg-green-100 h-96 rounded flex items-center justify-center">
                <p className="text-gray-500">Select a formation to begin</p>
              </div>
            )}
        </div>
      </div>
      
      {/* Section 4: Bench (full-width) */}
      {working && currentTeam && (
        <div className={`mb-4 ${debugCls}`}>
          {lp.debug && 
            <span className="absolute -top-2 left-2 text-[10px] bg-sky-50 px-1 rounded z-10">
              Bench
            </span>
          }
          <div className="rounded-lg border bg-white w-full" style={{ padding: `${PAD_M}px` }}>
            <h3 className="text-sm font-semibold mb-2">Bench (8 slots)</h3>
            <BenchGrid
              benchSlots={working.benchSlots ?? Array(8).fill(null)}
              players={currentTeam.players}
              scale={scale}
              onAssignToBench={(index, playerId) => {
                assignToBench(index, playerId);
              }}
              onRemoveFromBench={(index) => {
                removeFromBench(index);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Section 5: Roles */}
      {working && currentTeam && (
        <div className="mb-4">
          <div className="rounded-lg border bg-white w-full" style={{ padding: `${PAD_M}px` }}>
            <h3 className="text-sm font-semibold mb-2">Roles</h3>
              <div className="space-y-2">
                {[
                  { key: 'captain', label: 'Captain (C)', color: 'yellow' },
                  { key: 'gk', label: 'Goalkeeper', color: 'green' },
                  { key: 'pk', label: 'Penalty Kicker', color: 'blue' },
                  { key: 'ck', label: 'Corner Kicker', color: 'purple' },
                  { key: 'fk', label: 'Free Kicker', color: 'indigo' }
                ].map(({ key, label, color }) => {
                  const playerId = working.roles?.[key as keyof typeof working.roles];
                  const player = playerId ? currentTeam.players.find(p => p.id === playerId) : null;
                  
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{label}:</span>
                      <select
                        value={playerId || ''}
                        onChange={(e) => setRole(key as keyof typeof working.roles, e.target.value || undefined)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="">None</option>
                        {[
                          ...Object.values(working.onField || {}).filter(id => id),
                          ...(working.benchSlots ?? []).filter(id => id)
                        ]
                          .map(id => currentTeam.players.find(p => p.id === id))
                          .filter(Boolean)
                          .map(p => (
                            <option key={p!.id} value={p!.id}>
                              #{p!.jersey} {p!.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      )}

      {/* Modals */}
      <SaveLineupModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveNew}
        mode="save"
        defaultName={`${currentTeam?.name || 'Untitled'} — ${currentFormation?.name || 'Formation'} — ${new Date().toISOString().split('T')[0]}`}
        teamName={currentTeam?.name}
        formationName={currentFormation?.name || ''}
        onFieldCount={onFieldCount}
        benchCount={(working?.benchSlots || []).filter(Boolean).length}
        loadedLineupId={loadedLineupId}
      />
    </div>
  );
}

export default function LineupPage() {
  return (
    <ErrorBoundary>
      <LineupPageContent />
    </ErrorBoundary>
  );
}