import React from 'react';
import pitchSvg from '../../assets/pitch.svg';

interface FormationSlot {
  slot_id: string;
  slot_code: string;
  x: number;
  y: number;
}

interface Formation {
  code: string;
  name: string;
  slot_map: FormationSlot[];
}

interface FormationRendererProps {
  formation: Formation;
  interactive?: boolean;
  showLabels?: boolean;
  className?: string;
  targetHeight?: number;
}

/**
 * FormationRenderer - Shared component for rendering formations
 * Uses canonical coordinates from formations.json (105×68 pitch, bottom-left origin)
 * Renders identically to Lineup Builder's field visualization
 */
export default function FormationRenderer({
  formation,
  interactive = false,
  showLabels = true,
  className = '',
  targetHeight = 520
}: FormationRendererProps) {
  if (!formation?.slot_map) {
    return (
      <div className={`rounded-lg border bg-gray-50 flex items-center justify-center ${className}`}
           style={{ height: targetHeight }}>
        <p className="text-gray-500 text-sm">No formation data available</p>
      </div>
    );
  }

  // Canonical pitch dimensions (from formations.json)
  const PITCH_W = 105;
  const PITCH_H = 68;

  // Calculate aspect-ratio preserving container
  const aspectRatio = PITCH_W / PITCH_H;
  const containerWidth = Math.floor(targetHeight * aspectRatio);

  return (
    <div className={`relative w-full rounded-lg border overflow-hidden ${className}`}
         style={{ height: targetHeight }}>
      <div className="relative w-full h-full">
        {/* Aspect-ratio box centered horizontally */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0"
          style={{
            height: targetHeight,
            width: containerWidth
          }}
        >
          {/* 1) Green gradient background */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #198754 0%, #0f5132 100%)'
          }} />

          {/* 2) Pitch lines overlay */}
          <img
            src={pitchSvg}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            alt="Football pitch"
          />

          {/* 3) Formation markers */}
          {formation.slot_map.map((slot) => {
            // Canonical data: absolute 105×68, bottom-left origin
            // Render: percentage 0-100, top-left origin
            const renderX = (slot.x / PITCH_W) * 100;
            const renderY = ((PITCH_H - slot.y) / PITCH_H) * 100; // Flip Y

            return (
              <div
                key={slot.slot_id}
                className={`absolute ${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
                style={{
                  left: `${renderX}%`,
                  top: `${renderY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Marker circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center
                    ${slot.slot_code === 'GK' ? 'bg-gray-900' : 'bg-white'}
                  `}
                >
                  {showLabels && (
                    <span
                      className={`
                        text-[10px] font-semibold
                        ${slot.slot_code === 'GK' ? 'text-white' : 'text-gray-900'}
                      `}
                    >
                      {slot.slot_code}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
