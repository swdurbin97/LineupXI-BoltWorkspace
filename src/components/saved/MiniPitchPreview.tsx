import React, { useEffect, useState, useRef } from 'react';
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
  className?: string;
};

export default function MiniPitchPreview({
  lineup,
  className = '',
}: MiniPitchPreviewProps) {
  const [formation, setFormation] = useState<FormationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [markerScale, setMarkerScale] = useState(0.6);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const scale = Math.max(0.50, Math.min(0.65, width / 600));
        setMarkerScale(scale);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const showPlaceholder = !formationCode || onFieldCount === 0 || !formation;

  return (
    <div
      ref={containerRef}
      className={`relative my-3 aspect-[105/68] rounded-lg overflow-hidden border border-slate-200 bg-white ${className}`}
      aria-label={`Preview for ${lineup?.name ?? 'Saved lineup'}`}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-slate-400 text-sm">Loading...</span>
        </div>
      ) : showPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-slate-400 text-sm">No preview</span>
        </div>
      ) : (
        <div className="absolute inset-0 p-2 pointer-events-none select-none">
          <div className="w-full h-full">
            <FormationRenderer
              formation={formation}
              interactive={false}
              showLabels={false}
              markerScale={markerScale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
