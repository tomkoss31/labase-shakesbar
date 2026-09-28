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
  // Couleurs d'interface qui s'adaptent au thème (clair / sombre)
  chip: 'rgba(0,0,0,.3)', // fond des pastilles et boutons ronds sur une carte
  track: 'rgba(0,0,0,.4)', // fond des jauges (XP, défi…)
  photoBg: '#050606', // cadre des photos produits (fond noir des visuels)
  mode: 'dark',
} as const;

// Type élargi (string) pour permettre les thèmes saisonniers qui remplacent
// certaines couleurs. PALETTE_E reste assignable (littéraux → string).
export type Palette = { [K in keyof typeof PALETTE_E]: string };

// Palette CLAIRE (variante « D » du nuancier) : fond blanc cassé teinté vert,
// cartes blanches, teal plus foncé pour rester lisible sur blanc. Les photos
// (fond noir) restent présentées dans des cadres sombres (photoBg).
export const PALETTE_LIGHT: Palette = {
  id: 'D',
  name: 'Clair',
  primary: '#0f766e', // teal foncé : petits textes lisibles sur blanc (≥ 4,5:1)
  primaryDeep: '#115e59',
  accent: '#d97706', // ambre plus profond : lisible en texte sur blanc (le bouton CTA reste #f59e0b)
  accentDeep: '#b45309',
  glow1: '#5eead4',
  glow2: '#14b8a6',
  glow3: '#06b6d4',
  bg: '#f3f8f6',
  bgSoft: '#eaf3f0',
  card: '#ffffff',
  cardHi: '#eef8f5',
  line: 'rgba(13,148,136,.16)',
  text: '#0b2622',
  textDim: '#48695f', // ≥ 4,5:1 sur le fond clair (lisibilité)
  cta: '#f59e0b',
  ctaText: '#1a0f00',
  emotion: '#fb7185', // badges : texte foncé lisible dessus
  chip: 'rgba(11,38,34,.06)',
  track: '#dcebe7',
  photoBg: '#050606',
  mode: 'light',
};

// ── Thème de base (clair / sombre) ───────────────────────────────────
// Défaut de cette version : CLAIR. Pour comparer sur le même lien :
// ?theme=dark ou ?theme=light (mémorisé sur le téléphone).
const DEFAULT_BASE_THEME: 'light' | 'dark' = 'light';
const BASE_THEME_KEY = 'labase-base-theme';

export function getBasePalette(): Palette {
  let mode: string = DEFAULT_BASE_THEME;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    if (fromUrl === 'light' || fromUrl === 'dark') localStorage.setItem(BASE_THEME_KEY, fromUrl);
    mode = localStorage.getItem(BASE_THEME_KEY) || DEFAULT_BASE_THEME;
  } catch {
    /* navigation privée : thème par défaut */
  }
  return mode === 'dark' ? PALETTE_E : PALETTE_LIGHT;
}

// ── THÈMES SAISONNIERS / ÉVÉNEMENTS ──────────────────────────────────
// On ne remplace QUE les accents (boutons, halos, roue, badges, CTA) ;
// le fond sombre (bg/card/text) est toujours conservé → ambiance de saison
// sans rendu criard.
export type PaletteOverride = Partial<
  Pick<Palette, 'primary' | 'primaryDeep' | 'accent' | 'accentDeep' | 'glow1' | 'glow2' | 'glow3' | 'cta' | 'ctaText' | 'emotion'>
>;

export interface ThemePreset {
  id: string;
  label: string;
  emoji: string;
  overrides: PaletteOverride;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', label: 'Par défaut (Teal × Ambre)', emoji: '🟢', overrides: {} },
  {
    id: 'coupe-monde',
    label: 'Coupe du Monde',
    emoji: '🇫🇷',
    overrides: {
      primary: '#2563eb', primaryDeep: '#1d4ed8', accent: '#ef4444', accentDeep: '#dc2626',
      glow1: '#93c5fd', glow2: '#2563eb', glow3: '#f8fafc', cta: '#ef4444', ctaText: '#ffffff', emotion: '#3b82f6',
    },
  },
  {
    id: 'noel',
    label: 'Noël',
    emoji: '🎄',
    overrides: {
      primary: '#16a34a', primaryDeep: '#15803d', accent: '#dc2626', accentDeep: '#b91c1c',
      glow1: '#86efac', glow2: '#16a34a', glow3: '#fbbf24', cta: '#dc2626', ctaText: '#ffffff', emotion: '#f87171',
    },
  },
  {
    id: 'ete',
    label: 'Été',
    emoji: '☀️',
    overrides: {
      primary: '#06b6d4', primaryDeep: '#0891b2', accent: '#fb7185', accentDeep: '#f43f5e',
      glow1: '#67e8f9', glow2: '#22d3ee', glow3: '#fde047', cta: '#fb7185', ctaText: '#1a0010', emotion: '#fb7185',
    },
  },
  {
    id: 'halloween',
    label: 'Halloween',
    emoji: '🎃',
    overrides: {
      primary: '#a855f7', primaryDeep: '#9333ea', accent: '#f97316', accentDeep: '#ea580c',
      glow1: '#d8b4fe', glow2: '#a855f7', glow3: '#fb923c', cta: '#f97316', ctaText: '#1a0a00', emotion: '#c084fc',
    },
  },
  {
    id: 'printemps',
    label: 'Printemps',
    emoji: '🌸',
    overrides: {
      primary: '#10b981', primaryDeep: '#059669', accent: '#f472b6', accentDeep: '#ec4899',
      glow1: '#6ee7b7', glow2: '#34d399', glow3: '#f9a8d4', cta: '#f472b6', ctaText: '#2a0015', emotion: '#f472b6',
    },
  },
];

// Applique un thème (par id) sur une palette de base. Inconnu/'default' → base.
export function applyTheme(base: Palette, themeId: string | null | undefined): Palette {
  if (!themeId || themeId === 'default') return base;
  const preset = THEME_PRESETS.find((t) => t.id === themeId);
  if (!preset) return base;
  return { ...base, ...preset.overrides };
}
