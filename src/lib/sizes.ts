// --- master knob ---
// 0.88 ≈ 12% smaller, 0.85 ≈ 15% smaller. Tweak this only.
export const UI_SCALE = 0.88;

// Base (pre-scale) sizes
const CARD_W_BASE = 104;
const CARD_H_BASE = 144;

// Derived, used everywhere
export const CARD_W = Math.round(CARD_W_BASE * UI_SCALE);
export const CARD_H = Math.round(CARD_H_BASE * UI_SCALE);

// Placeholders & bench slots match card size
export const PLACEHOLDER_W = CARD_W;
export const PLACEHOLDER_H = CARD_H;
export const BENCH_SLOT_W  = CARD_W;
export const BENCH_SLOT_H  = CARD_H;

// Layout spacing (px)
export const GAP_X = Math.round(16 * UI_SCALE);   // row gaps
export const PAD_S = Math.round(10 * UI_SCALE);   // small padding
export const PAD_M = Math.round(12 * UI_SCALE);   // medium padding
export const PAD_L = Math.round(16 * UI_SCALE);   // large padding