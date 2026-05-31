// Règle d'ouverture du bar — source unique pour l'affichage du statut
// et le blocage éventuel des commandes hors horaires.
//
// Horaires (heure de Paris) :
//   Mardi    10h30 – 17h30
//   Mercredi 10h30 – 17h00
//   Jeudi    10h30 – 17h30
//   Vendredi 10h30 – 17h30
//   Samedi   10h00 – 13h00
//   Lundi & Dimanche : fermé
//
// ⚠️ Les horaires peuvent varier selon les événements — c'est une base.

interface DaySlot {
  open: number; // minutes depuis minuit
  close: number;
}

// 0 = dimanche … 6 = samedi (convention JS getDay)
const SCHEDULE: Record<number, DaySlot | null> = {
  0: null, // dimanche
  1: null, // lundi
  2: { open: 10 * 60 + 30, close: 17 * 60 + 30 }, // mardi
  3: { open: 10 * 60 + 30, close: 17 * 60 + 0 }, // mercredi
  4: { open: 10 * 60 + 30, close: 17 * 60 + 30 }, // jeudi
  5: { open: 10 * 60 + 30, close: 17 * 60 + 30 }, // vendredi
  6: { open: 10 * 60 + 0, close: 13 * 60 + 0 }, // samedi
};

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// Heure de Paris, quel que soit le fuseau de l'appareil
function parisNow(): { day: number; minutes: number } {
  try {
    const paris = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    return { day: paris.getDay(), minutes: paris.getHours() * 60 + paris.getMinutes() };
  } catch {
    const d = new Date();
    return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
  }
}

export interface OpenStatus {
  isOpen: boolean;
  // Libellé court pour la pastille (ex: "Ouvert · ferme à 17h30" / "Fermé")
  label: string;
  // Prochaine ouverture si fermé (ex: "Ouvre mardi à 10h30")
  nextOpenLabel: string | null;
}

export function getOpenStatus(): OpenStatus {
  const { day, minutes } = parisNow();
  const today = SCHEDULE[day];

  if (today && minutes >= today.open && minutes < today.close) {
    return {
      isOpen: true,
      label: `Ouvert · ferme à ${fmtTime(today.close)}`,
      nextOpenLabel: null,
    };
  }

  // Fermé → on cherche la prochaine ouverture (aujourd'hui plus tard, sinon jours suivants)
  if (today && minutes < today.open) {
    return {
      isOpen: false,
      label: 'Fermé',
      nextOpenLabel: `Ouvre aujourd'hui à ${fmtTime(today.open)}`,
    };
  }

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const slot = SCHEDULE[d];
    if (slot) {
      const when = i === 1 ? 'demain' : DAY_NAMES[d];
      return {
        isOpen: false,
        label: 'Fermé',
        nextOpenLabel: `Ouvre ${when} à ${fmtTime(slot.open)}`,
      };
    }
  }

  return { isOpen: false, label: 'Fermé', nextOpenLabel: null };
}

// Liste lisible des horaires (pour une éventuelle section "Horaires")
export const OPENING_HOURS_TEXT: Array<{ day: string; hours: string }> = [
  { day: 'Mardi', hours: '10h30 – 17h30' },
  { day: 'Mercredi', hours: '10h30 – 17h00' },
  { day: 'Jeudi', hours: '10h30 – 17h30' },
  { day: 'Vendredi', hours: '10h30 – 17h30' },
  { day: 'Samedi', hours: '10h00 – 13h00' },
  { day: 'Dimanche & Lundi', hours: 'Fermé' },
];
