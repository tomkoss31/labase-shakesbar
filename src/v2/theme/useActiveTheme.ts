// Lit le thème saisonnier actif depuis les réglages magasin (get-settings).
// Le thème est { id, endsAt } : il n'est appliqué que si endsAt est dans le
// futur → expiration automatique, aucun nettoyage nécessaire côté serveur.
import { useEffect, useState } from 'react';

export function useActiveThemeId(): string | null {
  const [themeId, setThemeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/profile?action=get-settings');
        const data = await resp.json();
        const theme = data?.theme;
        if (cancelled || !theme || !theme.id) return;
        const stillActive = theme.endsAt && new Date(theme.endsAt).getTime() > Date.now();
        if (stillActive) setThemeId(theme.id as string);
      } catch {
        /* pas bloquant : on garde le thème par défaut */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return themeId;
}
