// data.jsx — palettes, products, copy

const PALETTES = {
  E: {
    id: 'E',
    name: 'Teal × Ambre',
    sub: 'fraîcheur + chaleur food',
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
    emotion: '#fb7185', // badges nouveau/best-seller
  },
  A: {
    id: 'A',
    name: 'Teal Fresh',
    sub: 'hydratation, fraîcheur',
    primary: '#14b8a6',
    primaryDeep: '#0d9488',
    accent: '#06b6d4',
    accentDeep: '#0891b2',
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
    cta: '#14b8a6',
    ctaText: '#02100e',
    emotion: '#f472b6',
  },
  D: {
    id: 'D',
    name: 'Coral Gourmand',
    sub: 'food-app appétissant',
    primary: '#fb7185',
    primaryDeep: '#e11d48',
    accent: '#f97316',
    accentDeep: '#ea580c',
    glow1: '#fda4af',
    glow2: '#fb7185',
    glow3: '#f97316',
    bg: '#110505',
    bgSoft: '#1a0908',
    card: '#1f0d0c',
    cardHi: '#2e1413',
    line: 'rgba(253,164,175,.12)',
    text: '#fff1f2',
    textDim: '#c4a39f',
    cta: '#f97316',
    ctaText: '#1a0500',
    emotion: '#fde047',
  },
};

// Mascotte — Le Petit Shaker — un simple "B" stylisé qui sourit
const SHAKER_SVG = (color) => `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="6" width="24" height="36" rx="6" fill="${color}"/>
  <rect x="14" y="10" width="20" height="4" rx="2" fill="rgba(0,0,0,.25)"/>
  <circle cx="20" cy="22" r="1.8" fill="#0a0a0a"/>
  <circle cx="28" cy="22" r="1.8" fill="#0a0a0a"/>
  <path d="M19 28 Q24 32 29 28" stroke="#0a0a0a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`;

// Products — fond transparent simulé via dégradés radiaux pour chaque "drink"
// Each has: id, name, sub, price, kcal, prot, cat, hue1, hue2, shape
const PRODUCTS = {
  popular: [
    { id: 'p1', name: 'Choco Buenos', sub: 'Smoothie protéiné', price: 8.90, kcal: 250, prot: 24, cat: 'smoothie', hue1: '#92400e', hue2: '#451a03', shape: 'cup', badge: 'Best' },
    { id: 'p2', name: 'Blue Lagoon', sub: 'Energy 0 sucre · Medium', price: 6.90, kcal: 20, prot: 0, cat: 'drink', hue1: '#0ea5e9', hue2: '#1e3a8a', shape: 'tall', badge: null },
    { id: 'p3', name: 'Pink Rocket', sub: 'Energy fruits rouges', price: 6.90, kcal: 20, prot: 0, cat: 'drink', hue1: '#ec4899', hue2: '#831843', shape: 'tall', badge: null },
    { id: 'p4', name: 'Snickers Shake', sub: 'Smoothie caramel cacahuète', price: 8.90, kcal: 260, prot: 24, cat: 'smoothie', hue1: '#a16207', hue2: '#422006', shape: 'cup', badge: null },
    { id: 'p5', name: 'Yuzu Storm', sub: 'Energy yuzu citron', price: 6.90, kcal: 18, prot: 0, cat: 'drink', hue1: '#facc15', hue2: '#713f12', shape: 'tall', badge: 'Nouveau' },
    { id: 'p6', name: 'Lime Reset', sub: 'Energy citron menthe', price: 6.90, kcal: 20, prot: 0, cat: 'drink', hue1: '#84cc16', hue2: '#365314', shape: 'tall', badge: null },
  ],
  combos: [
    { id: 'c1', name: 'Combo Power', sub: 'Smoothie XXL + Gaufre', price: 15.90, save: 1.90, items: ['Smoothie 500ml', 'Gaufre healthy'], hue1: '#f59e0b', hue2: '#7c2d12', shape: 'combo' },
    { id: 'c2', name: 'Combo Booster', sub: 'Energy Large + Café protéiné', price: 12.90, save: 1.00, items: ['Energy 950ml', 'Café protéiné'], hue1: '#0ea5e9', hue2: '#0c4a6e', shape: 'combo' },
    { id: 'c3', name: 'Combo Snack', sub: 'Smoothie + Energy Medium', price: 13.90, save: 1.50, items: ['Smoothie 400ml', 'Energy 550ml'], hue1: '#a855f7', hue2: '#581c87', shape: 'combo' },
    { id: 'c4', name: 'Combo Matin', sub: 'Café + Gaufre', price: 9.90, save: 1.00, items: ['Café gourmet', 'Gaufre healthy'], hue1: '#92400e', hue2: '#451a03', shape: 'combo' },
  ],
  smoothies: [
    { id: 's1', name: 'M&M Crunch', sub: '250 kcal · 24g prot', price: 8.90, kcal: 250, prot: 24, cat: 'smoothie', hue1: '#dc2626', hue2: '#7f1d1d', shape: 'cup' },
    { id: 's2', name: 'Cookies & Cream', sub: '255 kcal · 24g prot', price: 8.90, kcal: 255, prot: 24, cat: 'smoothie', hue1: '#52525b', hue2: '#18181b', shape: 'cup' },
    { id: 's3', name: 'Vanilla Latte', sub: '240 kcal · 24g prot', price: 8.90, kcal: 240, prot: 24, cat: 'smoothie', hue1: '#eab308', hue2: '#713f12', shape: 'cup' },
    { id: 's4', name: 'Caramel Salé', sub: '260 kcal · 23g prot', price: 8.90, kcal: 260, prot: 23, cat: 'smoothie', hue1: '#d97706', hue2: '#451a03', shape: 'cup' },
    { id: 's5', name: 'Banana Split', sub: '245 kcal · 24g prot', price: 8.90, kcal: 245, prot: 24, cat: 'smoothie', hue1: '#fde047', hue2: '#854d0e', shape: 'cup' },
  ],
  drinks: [
    { id: 'd1', name: 'Sky Reset', sub: 'Bleu lavande · 950ml', price: 8.90, kcal: 35, prot: 0, cat: 'drink', hue1: '#6366f1', hue2: '#312e81', shape: 'tall' },
    { id: 'd2', name: 'Berry Boost', sub: 'Fruits rouges · 550ml', price: 6.90, kcal: 20, prot: 0, cat: 'drink', hue1: '#a855f7', hue2: '#581c87', shape: 'tall' },
    { id: 'd3', name: 'Mango Tango', sub: 'Mangue passion · 550ml', price: 6.90, kcal: 22, prot: 0, cat: 'drink', hue1: '#f97316', hue2: '#7c2d12', shape: 'tall' },
    { id: 'd4', name: 'Pure Green', sub: 'Pomme menthe · 550ml', price: 6.90, kcal: 18, prot: 0, cat: 'drink', hue1: '#22c55e', hue2: '#14532d', shape: 'tall' },
  ],
  hot: [
    { id: 'h1', name: 'Café Protéiné', sub: 'Espresso + 12g prot', price: 5.90, kcal: 80, prot: 12, cat: 'hot', hue1: '#78350f', hue2: '#1c1917', shape: 'mug' },
    { id: 'h2', name: 'Matcha Latte', sub: 'Matcha bio · oat milk', price: 5.50, kcal: 95, prot: 4, cat: 'hot', hue1: '#65a30d', hue2: '#365314', shape: 'mug' },
    { id: 'h3', name: 'Cappuccino', sub: 'Grain de spécialité', price: 4.50, kcal: 70, prot: 4, cat: 'hot', hue1: '#92400e', hue2: '#451a03', shape: 'mug' },
    { id: 'h4', name: 'Chocolat Chaud', sub: 'Cacao 70% oat milk', price: 4.90, kcal: 110, prot: 5, cat: 'hot', hue1: '#7c2d12', hue2: '#1c0a05', shape: 'mug' },
  ],
};

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: '' },
  { id: 'pop', label: 'Populaires', icon: '🔥' },
  { id: 'smoothie', label: 'Smoothies', icon: '🥤' },
  { id: 'drink', label: 'Drinks', icon: '⚡' },
  { id: 'hot', label: 'Hot', icon: '☕' },
  { id: 'gaufre', label: 'Gaufre', icon: '🧇' },
  { id: 'sante', label: 'Santé', icon: '💧' },
  { id: 'combo', label: 'Combos', icon: '🎯' },
];

Object.assign(window, { PALETTES, PRODUCTS, CATEGORIES, SHAKER_SVG });
