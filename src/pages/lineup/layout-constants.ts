// Layout tokens for Lineup page
export const LAYOUT = {
  CONTENT_MAX_W: '1280px', // page container
  FIELD_H_XL: 820, // ≥1280px
  FIELD_H_MD: 680, // 768–1279px
  FIELD_H_SM: 560, // <768px
  CARD_FIELD: { w: 84, h: 118 }, // on-field PlayerCard (already implemented)
  PLACEHOLDER_FIELD: { w: 92, h: 126 },
  BENCH_CARD: { w: 80, h: 112 },
  BENCH_SLOT: { w: 88, h: 120 },
  BENCH_GAP: '12px',
} as const;