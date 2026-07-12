// Verrou de session : une seule pop-up automatique à l'écran à la fois.
// Le prompt d'activation push (HomeV2) et le prompt d'avis Google (App.tsx) ont
// des déclencheurs indépendants (~1,6s après montage / après visite comptoir) et
// pouvaient s'ouvrir simultanément. Ce verrou garantit qu'un seul s'affiche ;
// l'autre est simplement zappé pour cette session (son cooldown/flag n'est pas
// consommé, il ré-apparaîtra à la prochaine occasion éligible).
const KEY = 'labase_prompt_lock';

// Tente de réserver l'écran pour `owner`. true = réservé (on peut afficher),
// false = déjà pris par une autre pop-up. sessionStorage indispo → on autorise.
export function tryAcquirePrompt(owner: string): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, owner);
    return true;
  } catch {
    return true;
  }
}

// Libère le verrou (uniquement si c'est bien `owner` qui le détient).
export function releasePrompt(owner: string): void {
  try {
    if (sessionStorage.getItem(KEY) === owner) sessionStorage.removeItem(KEY);
  } catch {}
}
