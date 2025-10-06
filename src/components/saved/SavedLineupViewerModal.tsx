import React, { useEffect, useState } from 'react';
import type { SavedLineup } from '../../types/lineup';
import type { Player } from '../../lib/types';
import { useTeamsStore } from '../../store/teams';
import FormationRenderer from '../field/FormationRenderer';

interface FormationSlot {
  slot_id: string;
  slot_code: string;
  x: number;
  y: number;
}

interface FormationData {
  code: string;
  name: string;
  slot_map: FormationSlot[];
}

type SavedLineupViewerModalProps = {
  open: boolean;
  lineup: SavedLineup | null;
  onClose: () => void;
};

type GroupedPlayers = {
  GK: Array<{ playerId: string; player?: Player; slotId: string }>;
  DEF: Array<{ playerId: string; player?: Player; slotId: string }>;
  MID: Array<{ playerId: string; player?: Player; slotId: string }>;
  ATT: Array<{ playerId: string; player?: Player; slotId: string }>;
};

export default function SavedLineupViewerModal({
  open,
  lineup,
  onClose,
}: SavedLineupViewerModalProps) {
  const { teams } = useTeamsStore();
  const [formation, setFormation] = useState<FormationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !lineup?.formation?.code) {
      setLoading(false);
      return;
    }

    const loadFormation = async () => {
      try {
        const res = await fetch('/data/formations.json');
        const data = await res.json();
        const formations = data.formations || [];
        const found = formations.find((f: FormationData) => f.code === lineup.formation.code);
        setFormation(found || null);
      } catch (err) {
        console.error('Failed to load formation:', err);
        setFormation(null);
      } finally {
        setLoading(false);
      }
    };

    loadFormation();
  }, [open, lineup]);

  if (!open || !lineup) return null;

  const team = teams.find(t => t.id === lineup.teamId);
  const onField = lineup.assignments?.onField ?? {};
  const bench = lineup.assignments?.bench ?? [];

  const parsePositionFromSlot = (slotId: string): string => {
    const match = slotId.match(/:(GK|CB|LB|RB|CDM|CM|CAM|LM|RM|LW|RW|ST):(\d+)$/);
    return match ? match[1] : 'P';
  };

  const mapToLine = (pos: string): keyof GroupedPlayers => {
    if (pos === 'GK') return 'GK';
    if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
    if (['LW', 'RW', 'ST'].includes(pos)) return 'ATT';
    return 'MID';
  };

  const grouped: GroupedPlayers = { GK: [], DEF: [], MID: [], ATT: [] };

  Object.entries(onField).forEach(([slotId, playerId]) => {
    if (!playerId) return;
    const pos = parsePositionFromSlot(slotId);
    const line = mapToLine(pos);
    const player = team?.players.find(p => p.id === playerId);
    grouped[line].push({ playerId, player, slotId });
  });

  const benchPlayers = bench
    .filter(Boolean)
    .map(playerId => {
      const player = team?.players.find(p => p.id === playerId);
      return { playerId, player };
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{lineup.name}</h2>
              <div className="flex gap-2 mt-2 text-sm text-slate-600">
                {lineup.teamName && <span>{lineup.teamName}</span>}
                <span>•</span>
                <span>{lineup.formation?.name || lineup.formation?.code}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
            <div className="relative aspect-[105/68] rounded-lg overflow-hidden border border-slate-200 bg-white">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-slate-400">Loading formation...</span>
                </div>
              ) : !formation ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-slate-400">Formation not available</span>
                </div>
              ) : (
                <div className="absolute inset-0 p-4">
                  <div className="w-full h-full">
                    <FormationRenderer
                      formation={formation}
                      interactive={false}
                      showLabels={false}
                      markerScale={0.8}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-slate-700">Starting XI</h3>
                <div className="space-y-4">
                  {(['GK', 'DEF', 'MID', 'ATT'] as const).map(line => {
                    if (grouped[line].length === 0) return null;
                    return (
                      <div key={line}>
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">{line}</h4>
                        <div className="space-y-1">
                          {grouped[line].map(({ playerId, player, slotId }) => (
                            <div key={slotId} className="text-sm text-slate-700 flex items-center gap-2">
                              {player ? (
                                <>
                                  <span className="font-medium">{player.jersey}</span>
                                  <span>{player.name}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Player {playerId}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {benchPlayers.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Substitutes</h4>
                  <div className="space-y-1">
                    {benchPlayers.map(({ playerId, player }) => (
                      <div key={playerId} className="text-sm text-slate-700 flex items-center gap-2">
                        {player ? (
                          <>
                            <span className="font-medium">{player.jersey}</span>
                            <span>{player.name}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Player {playerId}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lineup.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Notes</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{lineup.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
