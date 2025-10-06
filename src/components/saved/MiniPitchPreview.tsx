import React, { useEffect, useState } from 'react';
import type { SavedLineup } from '../../types/lineup';
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

type MiniPitchPreviewProps = {
  lineup: SavedLineup;
  heightClass?: string;
};

export default function MiniPitchPreview({
  lineup,
  heightClass = 'h-[220px]',
}: MiniPitchPreviewProps) {
  const [formation, setFormation] = useState<FormationData | null>(null);
  const [loading, setLoading] = useState(true);

  const onField = lineup?.assignments?.onField ?? {};
  const onFieldCount = Object.values(onField).filter(Boolean).length;
  const formationCode = lineup?.formation?.code;

  useEffect(() => {
    if (!formationCode) {
      setLoading(false);
      return;
    }

    const loadFormation = async () => {
      try {
        const res = await fetch('/data/formations.json');
        const data = await res.json();
        const formations = data.formations || [];
        const found = formations.find((f: FormationData) => f.code === formationCode);
        setFormation(found || null);
      } catch (err) {
        console.error('Failed to load formation:', err);
        setFormation(null);
      } finally {
        setLoading(false);
      }
    };

    loadFormation();
  }, [formationCode]);

  const showPlaceholder = !formationCode || onFieldCount === 0 || !formation;

  return (
    <div
      className={`my-3 ${heightClass} sm:h-[180px] rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-3`}
      aria-label={`Preview for ${lineup?.name ?? 'Saved lineup'}`}
    >
      {loading ? (
        <span className="text-slate-400 text-sm">Loading...</span>
      ) : showPlaceholder ? (
        <span className="text-slate-400 text-sm">No preview</span>
      ) : (
        <div className="w-full h-full pointer-events-none select-none">
          <FormationRenderer
            formation={formation}
            interactive={false}
            showLabels={false}
            markerScale={0.62}
          />
        </div>
      )}
    </div>
  );
}
