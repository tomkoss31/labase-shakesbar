// Audit LECTURE SEULE du catalogue Square.
// GET ?action=audit  (Bearer = mot de passe admin)
// Ne fait AUCUNE écriture : liste catégories / articles / variations / modifs,
// repère les doublons. Sert à préparer la refonte propre du catalogue.
//
// Token : SQUARE_ACCESS_TOKEN (déjà présent côté Vercel).

function getQuery(req: any, key: string): string | null {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get(key);
}

async function fetchAllCatalog(accessToken: string, types: string): Promise<any[]> {
  const objects: any[] = [];
  let cursor: string | undefined;
  // Garde-fou anti-boucle : 50 pages max (catalogue raisonnable).
  for (let page = 0; page < 50; page++) {
    const url = new URL('https://connect.squareup.com/v2/catalog/list');
    url.searchParams.set('types', types);
    if (cursor) url.searchParams.set('cursor', cursor);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2025-10-16',
      },
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.errors?.[0]?.detail || `Square ${resp.status}`);
    }
    if (Array.isArray(data.objects)) objects.push(...data.objects);
    cursor = data.cursor;
    if (!cursor) break;
  }
  return objects;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Barrière admin (même schéma que /api/profile) ──
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
  const provided = (req.headers?.authorization ?? '').replace(/^Bearer\s+/, '').trim();
  if (provided !== expectedPassword) return res.status(401).json({ error: 'Non autorisé' });

  const action = getQuery(req, 'action');
  if (action !== 'audit') return res.status(400).json({ error: 'action=audit requise' });

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) return res.status(500).json({ error: 'SQUARE_ACCESS_TOKEN manquant' });

  try {
    const all = await fetchAllCatalog(accessToken, 'ITEM,CATEGORY,MODIFIER_LIST');

    const categoryObjs = all.filter((o) => o.type === 'CATEGORY');
    const itemObjs = all.filter((o) => o.type === 'ITEM');
    const modifierObjs = all.filter((o) => o.type === 'MODIFIER_LIST');

    // Map catégorie id → nom
    const catName: Record<string, string> = {};
    for (const c of categoryObjs) catName[c.id] = c.category_data?.name ?? '(sans nom)';

    // Résout la catégorie d'un article (gère ancien + nouveau format Square)
    const resolveCatId = (item: any): string | null => {
      const d = item.item_data ?? {};
      return (
        d.reporting_category?.id ??
        (Array.isArray(d.categories) && d.categories[0]?.id) ??
        d.category_id ??
        null
      );
    };

    const fmtPrice = (m: any): string =>
      m && typeof m.amount === 'number' ? (m.amount / 100).toFixed(2) + '€' : '—';

    // Items détaillés
    const items = itemObjs.map((it) => {
      const d = it.item_data ?? {};
      const catId = resolveCatId(it);
      const variations = Array.isArray(d.variations)
        ? d.variations.map((v: any) => ({
            name: v.item_variation_data?.name ?? '(défaut)',
            price: fmtPrice(v.item_variation_data?.price_money),
          }))
        : [];
      return {
        name: d.name ?? '(sans nom)',
        category: catId ? (catName[catId] ?? '(catégorie inconnue)') : '(non catégorisé)',
        variations,
      };
    });

    // Compteur d'articles par catégorie
    const perCategory: Record<string, number> = {};
    for (const it of items) perCategory[it.category] = (perCategory[it.category] ?? 0) + 1;
    const categories = Object.entries(perCategory)
      .map(([name, itemCount]) => ({ name, itemCount }))
      .sort((a, b) => b.itemCount - a.itemCount);

    // Doublons : même nom d'article apparaissant ≥2 fois
    const byName: Record<string, number> = {};
    for (const it of items) byName[it.name] = (byName[it.name] ?? 0) + 1;
    const duplicates = Object.entries(byName)
      .filter(([, n]) => n > 1)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Doublons de catégories (même nom)
    const catByName: Record<string, number> = {};
    for (const c of categoryObjs) {
      const n = c.category_data?.name ?? '(sans nom)';
      catByName[n] = (catByName[n] ?? 0) + 1;
    }
    const duplicateCategories = Object.entries(catByName)
      .filter(([, n]) => n > 1)
      .map(([name, count]) => ({ name, count }));

    return res.status(200).json({
      counts: {
        categories: categoryObjs.length,
        items: itemObjs.length,
        variations: items.reduce((s, it) => s + it.variations.length, 0),
        modifierLists: modifierObjs.length,
      },
      categories,
      duplicates,
      duplicateCategories,
      items: items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    });
  } catch (err: any) {
    console.error('[square-catalog audit] failed:', err?.message);
    return res.status(500).json({ error: err?.message ?? 'Erreur audit Square' });
  }
}
