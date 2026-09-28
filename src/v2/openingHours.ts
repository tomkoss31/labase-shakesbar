// Règle d'ouverture du bar — source unique pour l'affichage du statut
// et le blocage éventuel des commandes hors horaires.
//
// Horaires (heure de Paris) — à partir du 7 septembre 2026 :
//   Mardi    11h00 – 17h00
//   Mercredi 11h00 – 13h00
//   Jeudi    11h00 – 13h00
//   Vendredi 11h00 – 17h30
//   Samedi, Lundi & Dimanche : fermé
//
// ⚠️ Les horaires peuvent varier selon les événements — c'est une base.

import { useState, useEffect } from 'react';

interface DaySlot {
  open: number; // minutes depuis minuit
  close: number;
}

// 0 = dimanche … 6 = samedi (convention JS getDay)
const SCHEDULE: Record<number, DaySlot | null> = {
  0: null, // dimanche
  1: null, // lundi
  2: { open: 11 * 60 + 0, close: 17 * 60 + 0 }, // mardi
  3: { open: 11 * 60 + 0, close: 13 * 60 + 0 }, // mercredi
  4: { open: 11 * 60 + 0, close: 13 * 60 + 0 }, // jeudi
  5: { open: 11 * 60 + 0, close: 17 * 60 + 30 }, // vendredi
  6: null, // samedi (fermé depuis le 7 sept. 2026)
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

// ─── Override admin (piloté depuis la console) ───────────────────────
// 'auto' = suit les horaires | 'force_open' | 'force_closed'
type OverrideMode = 'auto' | 'force_open' | 'force_closed';
let _override: OverrideMode = 'auto';
let _fetched = false;

// Récupère le réglage magasin depuis l'API (une fois). Fallback silencieux
// sur 'auto' si l'API/table n'existe pas encore (avant migration 009).
export async function refreshStoreSettings(): Promise<void> {
  try {
    const resp = await fetch('/api/profile?action=get-settings');
    if (!resp.ok) return;
    const data = await resp.json();
    if (data && typeof data.override_mode === 'string') {
      _override = data.override_mode as OverrideMode;
      _fetched = true;
    }
  } catch {
    /* pas bloquant : on garde le mode auto / horaires du code */
  }
}

export function getOpenStatus(): OpenStatus {
  // Override admin prioritaire
  if (_override === 'force_open') {
    return { isOpen: true, label: 'Ouvert', nextOpenLabel: null };
  }
  if (_override === 'force_closed') {
    return { isOpen: false, label: 'Fermé exceptionnellement', nextOpenLabel: null };
  }

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

// ─── Créneau de retrait autorisé ─────────────────────────────────────
// Aujourd'hui si le bar est encore ouvert (au plus tôt dans 10 min), sinon le
// prochain jour d'ouverture. Dernier retrait 5 min avant la fermeture.
const PICKUP_LEAD_MIN = 10;
const PICKUP_LAST_BEFORE_CLOSE_MIN = 5;

export interface PickupWindow {
  // "aujourd'hui" / "demain" / "mardi"
  dayLabel: string;
  isToday: boolean;
  min: string; // HH:MM
  max: string; // HH:MM
}

function toHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// null = pas de contrainte (bar forcé ouvert par l'admin)
export function getPickupWindow(): PickupWindow | null {
  if (_override === 'force_open') return null;

  const { day, minutes } = parisNow();
  const today = _override === 'force_closed' ? null : SCHEDULE[day];
  if (today) {
    const last = today.close - PICKUP_LAST_BEFORE_CLOSE_MIN;
    // Arrondi aux 5 min supérieures pour des créneaux lisibles
    const earliest = Math.max(today.open, Math.ceil((minutes + PICKUP_LEAD_MIN) / 5) * 5);
    if (earliest <= last) {
      return { dayLabel: "aujourd'hui", isToday: true, min: toHHMM(earliest), max: toHHMM(last) };
    }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const slot = SCHEDULE[d];
    if (slot) {
      return {
        dayLabel: i === 1 ? 'demain' : DAY_NAMES[d],
        isToday: false,
        min: toHHMM(slot.open),
        max: toHHMM(slot.close - PICKUP_LAST_BEFORE_CLOSE_MIN),
      };
    }
  }
  return null;
}

// "11:00" → "11h", "12:55" → "12h55"
export function formatHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

// Message d'erreur si l'heure choisie tombe hors du créneau, sinon null.
export function checkPickupTime(hhmm: string, win: PickupWindow | null = getPickupWindow()): string | null {
  if (!hhmm || !win) return null;
  if (hhmm >= win.min && hhmm <= win.max) return null;
  const range = `entre ${formatHHMM(win.min)} et ${formatHHMM(win.max)}`;
  return win.isToday
    ? `Retrait possible aujourd'hui ${range} — choisis une heure dans ce créneau.`
    : `Le bar est fermé à cette heure-là. Retrait possible ${win.dayLabel} ${range}.`;
}

// Hook React : récupère le réglage distant au montage et renvoie le statut
// (re-render quand le réglage admin est connu). Fallback = horaires du code.
export function useOpenStatus(): OpenStatus {
  const [, force] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!_fetched) {
      refreshStoreSettings().then(() => {
        if (!cancelled) force((n) => n + 1);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);
  return getOpenStatus();
}

// Liste lisible des horaires (pour une éventuelle section "Horaires")
export const OPENING_HOURS_TEXT: Array<{ day: string; hours: string }> = [
  { day: 'Mardi', hours: '11h – 17h' },
  { day: 'Mercredi', hours: '11h – 13h' },
  { day: 'Jeudi', hours: '11h – 13h' },
  { day: 'Vendredi', hours: '11h – 17h30' },
  { day: 'Samedi, Dimanche & Lundi', hours: 'Fermé' },
];
