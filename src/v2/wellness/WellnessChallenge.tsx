// Défi bien-être 7 jours (C2) — carte d'accueil.
// Auto-éducation produit ("Le savais-tu ?") + pont vers le Bilan / Le Club.
// Parcours indulgent : 1 mission validée par jour, pas de pénalité.
import React, { useEffect, useState } from 'react';
import type { Palette } from '../palette';
import { getStoredSession } from '../../lib/supabase';

interface Mission {
  emoji: string;
  title: string;
  fact: string; // "Le savais-tu ?"
}

// Contenu validé avec Tom (faits produits réels + recherches sourcées)
const MISSIONS: Mission[] = [
  {
    emoji: '💧',
    title: 'Bois ~1,5 L d’eau aujourd’hui',
    fact: 'Ton corps est composé d’environ 60% d’eau. Repère simple : ~1 L par tranche de 30 kg de poids. Fuis les boissons sucrées artificielles, elles donnent encore plus soif.',
  },
  {
    emoji: '🥤',
    title: 'Prends un shake protéiné',
    fact: 'Chez La Base, tout est 100% végétal, sans lactose, vegan. Chaque smoothie = 25 g de protéines + 24 vitamines & minéraux → satiété et maintien musculaire.',
  },
  {
    emoji: '🚶',
    title: 'Bouge 20 minutes',
    fact: 'Une energy La Base = 0 sucre, 20 kcal, guarana + aloe vera, 100% vegan, sans arôme artificiel. De l’énergie propre, sans le crash du sucre.',
  },
  {
    emoji: '🌅',
    title: 'Petit-déj équilibré',
    fact: 'Un smoothie (25 g de protéines, 24 vitamines & minéraux) = un vrai petit-déj. Associée à l’exercice, la créatine est étudiée pour soutenir muscles et os — intéressant pour les femmes et les seniors.',
  },
  {
    emoji: '🥗',
    title: 'Un vrai repas équilibré',
    fact: 'L’assiette idéale : ½ légumes, ¼ protéines, ¼ féculents complets. Ton énergie se construit dans l’assiette, pas seulement à la salle.',
  },
  {
    emoji: '😴',
    title: 'Au lit avant minuit',
    fact: 'Des études récentes suggèrent que le safran améliore la qualité du sommeil. Des soucis de sommeil ? On a ce qu’il faut au Club 💜',
  },
  {
    emoji: '🎯',
    title: 'Fais le point sur ton énergie',
    fact: 'Bravo, 7 jours ! 🎉 Note ton énergie /10 et ce qui a changé. Envie d’aller plus loin ? Ton bilan offert t’attend.',
  },
];

interface WellnessState {
  started: boolean;
  count: number;
  total: number;
  completed: boolean;
  canCheckInToday: boolean;
  participants: number;
}

interface Props {
  palette: Palette;
  isAuthed: boolean;
  onConnect?: () => void;
}

export function WellnessChallenge({ palette, isAuthed, onConnect }: Props) {
  const [state, setState] = useState<WellnessState | null>(null);
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  function token() {
    return getStoredSession()?.access_token ?? null;
  }

  async function load() {
    const t = token();
    if (!t) return;
    try {
      const r = await fetch('/api/orders?action=wellness', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) return;
      const d = await r.json();
      setParticipants(d.participants ?? 0);
      setState(d.started ? d : { started: false, count: 0, total: d.total ?? 7, completed: false, canCheckInToday: false, participants: d.participants ?? 0 });
    } catch {
      /* silencieux */
    }
  }

  useEffect(() => {
    if (isAuthed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  async function start() {
    const t = token();
    if (!t) return;
    setBusy(true);
    try {
      await fetch('/api/orders?action=wellness-start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function checkin() {
    const t = token();
    if (!t || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/orders?action=wellness-checkin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await r.json();
      if (r.ok && d.xpAwarded) {
        setFlash(`+${d.xpAwarded} XP ✨`);
        window.setTimeout(() => setFlash(null), 2600);
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  // ─── Rendu ───
  const wrap = (children: React.ReactNode) => (
    <div style={{ padding: '4px 16px 8px', maxWidth: 1240, margin: '0 auto' }}>
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          background: `linear-gradient(135deg, ${palette.card}, ${palette.bg})`,
          border: `1px solid ${palette.primary}44`,
        }}
      >
        {children}
      </div>
    </div>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>🌱</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 17, color: palette.text }}>
          Le Défi 7 jours
        </div>
        {participants > 0 && (
          <div style={{ fontSize: 11.5, color: palette.textDim, marginTop: 1 }}>
            🔥 {participants} {participants > 1 ? 'personnes relèvent' : 'personne relève'} le défi
          </div>
        )}
      </div>
    </div>
  );

  // Non connecté : teaser
  if (!isAuthed) {
    return wrap(
      <>
        {header}
        <div style={{ fontSize: 13.5, color: palette.textDim, lineHeight: 1.5, marginBottom: 12 }}>
          7 jours, 7 missions bien-être. Gagne des XP et débloque ton <b style={{ color: palette.text }}>bilan offert</b>.
        </div>
        <button
          onClick={onConnect}
          style={btnStyle(palette)}
        >
          Je relève le défi
        </button>
      </>,
    );
  }

  if (!state) return null;

  // Complété : succès + pont bilan
  if (state.completed) {
    return wrap(
      <>
        {header}
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: palette.primary, marginBottom: 6 }}>
          Défi réussi ! 🎉
        </div>
        <div style={{ fontSize: 13.5, color: palette.textDim, lineHeight: 1.5, marginBottom: 12 }}>
          Tu as tenu 7 jours — bravo. Prêt·e à passer au niveau supérieur ?
        </div>
        <a href="/club" style={{ ...btnStyle(palette), display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          ✨ Réserver mon bilan offert →
        </a>
      </>,
    );
  }

  // Pas encore démarré
  if (!state.started) {
    return wrap(
      <>
        {header}
        <div style={{ fontSize: 13.5, color: palette.textDim, lineHeight: 1.5, marginBottom: 12 }}>
          1 mission par jour, à ton rythme. Découvre ce qu’il y a vraiment dans tes produits et gagne des XP.
        </div>
        <button onClick={start} disabled={busy} style={btnStyle(palette)}>
          {busy ? '…' : 'Je relève le défi 🌱'}
        </button>
      </>,
    );
  }

  // En cours : barre + mission du jour
  const mission = MISSIONS[Math.min(state.count, MISSIONS.length - 1)];
  const pct = (state.count / state.total) * 100;

  return wrap(
    <>
      {header}

      {/* Progression */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,.35)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${palette.glow1}, ${palette.accent})`,
              borderRadius: 999,
              transition: 'width .5s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: palette.textDim }}>
          {state.count}/{state.total}
        </div>
      </div>

      {/* Mission du jour */}
      <div
        style={{
          background: palette.bg,
          border: `1px solid ${palette.line}`,
          borderRadius: 14,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 22 }}>{mission.emoji}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: palette.text }}>
            Jour {state.count + 1} — {mission.title}
          </div>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: palette.textDim,
            lineHeight: 1.5,
            paddingTop: 8,
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          <b style={{ color: palette.accent }}>Le savais-tu ?</b> {mission.fact}
        </div>
      </div>

      {flash && (
        <div style={{ textAlign: 'center', color: palette.primary, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
          {flash}
        </div>
      )}

      {state.canCheckInToday ? (
        <button onClick={checkin} disabled={busy} style={btnStyle(palette)}>
          {busy ? '…' : `Valider la mission (+30 XP)`}
        </button>
      ) : (
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: palette.textDim,
            padding: '10px',
          }}
        >
          ✅ Mission du jour validée — reviens demain !
        </div>
      )}
    </>,
  );
}

function btnStyle(palette: Palette): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px',
    border: 0,
    borderRadius: 12,
    background: palette.cta,
    color: palette.ctaText,
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 900,
    fontSize: 14.5,
    cursor: 'pointer',
  };
}
