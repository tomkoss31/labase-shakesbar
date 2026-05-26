// Palette E — Teal × Ambre Hybride
// Validée par Tom suite au design Claude (chat: "genial direction E")

export const PALETTE_E = {
  id: 'E',
  name: 'Teal × Ambre',
  primary: '#14b8a6',
  primaryDeep: '#0d9488',
  accent: '#f59e0b',
  accentDeep: '#d97706',
  glow1: '#5eead4',
  glow2: '#14b8a6',
  glow3: '#06b6d4',
  bg: '#04100f',
  bgSoft: '#0a1a18',
  card: '#0e1f1d',
  cardHi: '#13302c',
  line: 'rgba(94,234,212,.10)',
  text: '#ecfdf5',
  textDim: '#94b8b1',
  cta: '#f59e0b',
  ctaText: '#1a0f00',
  emotion: '#fb7185',
} as const;

export type Palette = typeof PALETTE_E;
