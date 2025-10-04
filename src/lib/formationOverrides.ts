export type SlotOverride = { x: number; y: number };
export type FormationOverrides = { 
  [formationCode: string]: { 
    slots: { 
      [slotCode: string]: SlotOverride 
    } 
  } 
};

// Configuration for coordinate space
const COORD_SPACE: 'left-right' | 'left-right' = 'left-right'; // positions are now in left-right format

// Transform helper for 90° clockwise rotation from top→bottom to left→right
function toLeftRightXY(x: number, y: number) {
  // no-op: coordinates are already left→right
  return { x, y };
}

export async function loadOverrides(): Promise<FormationOverrides> {
  try {
    const res = await fetch(`/data/formation-overrides.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const raw = await res.json() as FormationOverrides;
    
    // Apply coordinate transformation if needed
    const out: FormationOverrides = {};
    for (const [formCode, formData] of Object.entries(raw)) {
      if (!formData?.slots) continue;
      
      out[formCode] = { slots: {} };
      for (const [slotCode, slotData] of Object.entries(formData.slots)) {
        if (COORD_SPACE === 'top-bottom') {
          // Apply rotation transform
          const transformed = { x: slotData.x, y: slotData.y };
          out[formCode].slots[slotCode] = transformed;
        } else {
          // Use coordinates as-is
          out[formCode].slots[slotCode] = { x: slotData.x, y: slotData.y };
        }
      }
    }
    
    console.log('[Overrides] loaded keys:', Object.keys(out), 'space:', COORD_SPACE);
    return out;
  } catch (error) { 
    console.error('[Overrides] load failed:', error);
    return {}; 
  }
}

export function applyOverrides(base: any, ov: FormationOverrides) {
  // base = formations array with { code, slot_map:[{slot_code,x,y}, ...] }
  for (const f of base) {
    const o = ov[f.code]; 
    if (!o) continue;
    
    for (const s of f.slot_map) {
      const so = o.slots?.[s.slot_code];
      if (so && Number.isFinite(so.x) && Number.isFinite(so.y)) {
        s.x = so.x; 
        s.y = so.y;
      }
    }
  }
  return base;
}

export function mergeOverrides(existing: FormationOverrides, draft: FormationOverrides): FormationOverrides {
  const result = { ...existing };
  
  for (const [formCode, formData] of Object.entries(draft)) {
    if (!result[formCode]) {
      result[formCode] = { slots: {} };
    }
    result[formCode].slots = {
      ...result[formCode].slots,
      ...formData.slots
    };
  }
  
  return result;
}

export function downloadOverrides(overrides: FormationOverrides) {
  const content = JSON.stringify(overrides, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'formation-overrides.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}