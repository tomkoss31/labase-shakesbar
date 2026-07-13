import { useEffect, useRef } from 'react';

// Accessibilité des modales, en une ligne par modale.
// Sur une modale ouverte : Échap ferme, le focus entre dans la modale, la
// touche Tab reste piégée à l'intérieur (plus de navigation clavier « derrière »
// la modale), et le focus est rendu à l'élément d'origine à la fermeture.
//
// Usage :
//   const ref = useModalA11y<HTMLDivElement>(open, onClose);
//   return <div ref={ref} role="dialog" aria-modal="true"> … </div>;
//
// Le ref s'attache au conteneur intérieur de la modale (la « boîte »), pas au
// fond semi-transparent.
export function useModalA11y<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T | null>(null);
  // onClose est souvent une arrow recréée à chaque render : on la garde dans un
  // ref pour que l'effet ne dépende QUE de `open` (sinon il re-focaliserait le
  // premier élément à chaque re-render du parent).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Focus initial dans la modale (premier élément focalisable, sinon le conteneur).
    const first = focusables()[0];
    if (first) first.focus();
    else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Rend le focus à l'élément d'origine (si toujours dans le DOM).
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  return containerRef;
}
