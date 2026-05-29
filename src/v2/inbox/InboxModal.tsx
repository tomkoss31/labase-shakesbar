// Boîte de réception — affiche les annonces/push archivées (broadcasts).
// Le client peut revoir les messages qu'il a reçus. Les "non-lus" sont
// suivis en localStorage (pas besoin de table par user).
import React, { useCallback, useEffect, useState } from 'react';
import type { Palette } from '../palette';

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  url: string | null;
  emoji: string | null;
  created_at: string;
}

const READ_KEY = 'labase_inbox_read';

function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function setReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(0, 200)));
  } catch {}
}

// Hook : récupère les broadcasts + compte les non-lus
export function useInbox() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const resp = await fetch('/api/push?action=broadcasts');
      if (!resp.ok) return;
      const data = await resp.json();
      const list: Broadcast[] = data.broadcasts ?? [];
      setBroadcasts(list);
      const read = getReadIds();
      setUnread(list.filter((b) => !read.has(b.id)).length);
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    const read = getReadIds();
    broadcasts.forEach((b) => read.add(b.id));
    setReadIds(read);
    setUnread(0);
  }, [broadcasts]);

  return { broadcasts, unread, refresh, markAllRead };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

interface InboxModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  broadcasts: Broadcast[];
}

export function InboxModal({ palette, open, onClose, broadcasts }: InboxModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          minHeight: 320,
          maxHeight: '85vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: '22px 18px',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22 }}>
            📬 Mes messages
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,.3)', border: `1px solid ${palette.line}`,
              color: palette.text, cursor: 'pointer', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {broadcasts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: palette.textDim }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>Aucun message pour l'instant</div>
            <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
              Active les notifications dans ton profil pour ne rien rater des nouveautés et offres ✨
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {broadcasts.map((b) => {
              const card = (
                <div
                  style={{
                    display: 'flex',
                    gap: 13,
                    padding: 14,
                    background: palette.card,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                      background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow3})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}
                  >
                    {b.emoji || '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14 }}>{b.title}</span>
                      <span style={{ fontSize: 10, color: palette.textDim, flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(b.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: palette.textDim, marginTop: 3, lineHeight: 1.45 }}>{b.body}</div>
                  </div>
                </div>
              );
              return b.url ? (
                <a key={b.id} href={b.url} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {card}
                </a>
              ) : (
                <div key={b.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
