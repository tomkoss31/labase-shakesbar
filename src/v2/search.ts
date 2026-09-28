// Recherche produits « intelligente » : sans accents ni majuscules, dans le
// nom, la catégorie, la description et les SAVEURS (« chocolat », « fraise »,
// « protéines »…), avec quelques synonymes et plusieurs mots (tous requis).
import type { V2Product } from './products-adapter';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents : « oréo » → « oreo »
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Un mot tapé → mots équivalents acceptés (tous déjà normalisés)
const SYNONYMS: Record<string, string[]> = {
  choco: ['chocolat', 'cacao', 'choco'],
  chocolat: ['chocolat', 'cacao', 'choco'],
  cafe: ['cafe', 'coffee', 'cappuccino', 'latte', 'mocha', 'macchiato', 'espresso'],
  coffee: ['cafe', 'coffee', 'cappuccino', 'latte', 'mocha'],
  energie: ['energie', 'energisant', 'energy', 'boost', 'cafeine', 'drink'],
  energy: ['energie', 'energisant', 'energy', 'boost', 'drink'],
  boisson: ['boisson', 'drink'],
  prot: ['proteine', 'proteines'],
  proteine: ['proteine', 'proteines'],
  muscle: ['proteine', 'proteines', 'creatine', 'post workout'],
  sport: ['sport', 'proteine', 'creatine', 'electrolyte', 'workout'],
  enfant: ['enfant', 'enfants', 'kid', 'kids'],
  enfants: ['enfant', 'enfants', 'kid', 'kids'],
  kid: ['enfant', 'enfants', 'kid', 'kids'],
  fruit: ['fruit', 'fraise', 'mangue', 'banane', 'ananas', 'framboise', 'citron', 'peche', 'coco', 'passion', 'pomme'],
  fruite: ['fruit', 'fraise', 'mangue', 'banane', 'ananas', 'framboise', 'citron', 'peche', 'coco', 'passion'],
  chaud: ['chaud', 'hot', 'cafe', 'chocolat chaud', 'infusion'],
  gaufre: ['gaufre', 'waffle'],
  vegan: ['vegan', 'vegetal'],
}

function haystack(p: V2Product): string {
  const raw = p.raw;
  return normalize(
    [p.name, p.sub, p.categoryName, p.badge ?? '', raw.description ?? '', raw.flavors ?? '', raw.badge ?? ''].join(' '),
  );
}

const cache = new WeakMap<V2Product, string>();

export function matchesSearch(p: V2Product, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  let hay = cache.get(p);
  if (hay === undefined) {
    hay = haystack(p);
    cache.set(p, hay);
  }
  return q.split(' ').every((word) => {
    // pluriel toléré : « fraises » trouve « fraise »
    const base = word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
    const options = SYNONYMS[word] ?? SYNONYMS[base] ?? [base];
    return options.some((o) => hay!.includes(o));
  });
}

// Résultats uniques (un produit peut être dans « Populaires » ET « Smoothies »)
export function searchProducts(all: V2Product[], query: string): V2Product[] {
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.id) || !matchesSearch(p, query)) return false;
    seen.add(p.id);
    return true;
  });
}
