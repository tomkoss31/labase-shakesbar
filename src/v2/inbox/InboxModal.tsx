// Boîte de réception — fusionne deux sources :
//   • broadcasts  : annonces communes « à tous » (table publique, état lu en
//     localStorage car partagées entre tous les clients).
//   • personal    : messages PERSO du client (relance, anniversaire, push
//     ciblées) avec un état lu synchronisé serveur (read_at), marquable
//     message par message et multi-appareils.
import React, { useCallback, useEffect, useState } from 'react';
import type { Palette } from '../palette';

export interface InboxItem {
  id: string; // clé unique d'affichage ('b:<id>' | 'n:<id>')
  rawId: string;
  source: 'broadcast' | 'personal';
  title: string;
  body: string;
  url: string | null;
  emoji: string | null;
  created_at: string;
  read: boolean;
}

const READ_KEY = 'labase_inbox_read'; // ids de broadcasts lus (local, par appareil)

function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(0, 200)));
  } catch {}
}

// Hook : récupère broadcasts + messages perso, fusionne, compte les non-lus.
export function useInbox(accessToken?: string | null) {
  const [items, setItems] = useState<InboxItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const reqs: Promise<Response>[] = [fetch('/api/push?action=broadcasts')];
      if (accessToken) {
        reqs.push(
          fetch('/api/push?action=my-notifications', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        );
      }
      const responses = await Promise.all(reqs);

      const read = getReadIds();
      const merged: InboxItem[] = [];

      const bResp = responses[0];
      if (bResp?.ok) {
        const data = await bResp.json();
        for (const b of (data.broadcasts ?? [])) {
          merged.push({
            id: `b:${b.id}`,
            rawId: b.id,
            source: 'broadcast',
            title: b.title,
            body: b.body,
            url: b.url ?? null,
            emoji: b.emoji ?? null,
            created_at: b.created_at,
            read: read.has(b.id),
          });
        }
      }

      const nResp = responses[1];
      if (nResp?.ok) {
        const data = await nResp.json();
        for (const n of (data.notifications ?? [])) {
          merged.push({
            id: `n:${n.id}`,
            rawId: n.id,
            source: 'personal',
            title: n.title,
            body: n.body,
            url: n.url ?? null,
            emoji: n.emoji ?? null,
            created_at: n.created_at,
            read: Boolean(n.read_at),
          });
        }
      }

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(merged);
    } catch {
      // silencieux
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unread = items.filter((i) => !i.read).length;

  // Marque UN message lu (broadcast → localStorage, perso → serveur).
  const markRead = useCallback(
    async (item: InboxItem) => {
      if (item.read) return;
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      if (item.source === 'broadcast') {
        const read = getReadIds();
        read.add(item.rawId);
        saveReadIds(read);
      } else if (accessToken) {
        try {
          await fetch('/api/push?action=mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ id: item.rawId }),
          });
        } catch {
          // best-effort : l'UI a déjà marqué lu, on resync au prochain refresh
        }
      }
    },
    [accessToken],
  );

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((i) => ({ ...i, read: true })));
    const read = getReadIds();
    items.filter((i) => i.source === 'broadcast').forEach((i) => read.add(i.rawId));
    saveReadIds(read);
    if (accessToken && items.some((i) => i.source === 'personal' && !i.read)) {
      try {
        await fetch('/api/push?action=mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ all: true }),
        });
      } catch {}
    }
  }, [items, accessToken]);

  return { items, unread, refresh, markRead, markAllRead };
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
  items: InboxItem[];
  unread: number;
  onMarkRead: (item: InboxItem) => void;
  onMarkAllRead: () => void;
  // Affiche un message épinglé invitant à activer les notifications, tant
  // qu'elles ne le sont pas. Au clic → onEnableNotifs (ouvre la fiche compte).
  showEnableNotifs?: boolean;
  onEnableNotifs?: () => void;
}

export function InboxModal({
  palette,
  open,
  onClose,
  items,
  unread,
  onMarkRead,
  onMarkAllRead,
  showEnableNotifs = false,
  onEnableNotifs,
}: InboxModalProps) {
  if (!open) return null;

  // Une fois lu, le message disparaît de la boîte → on n'affiche que le non-lu.
  const visibleItems = items.filter((i) => !i.read);

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

        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 12,
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${palette.line}`,
              background: 'rgba(0,0,0,.25)',
              color: palette.textDim,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ✓ Tout marquer comme lu ({unread})
          </button>
        )}

        {/* Message épinglé : activer les notifications (tant que pas activées) */}
        {showEnableNotifs && (
          <button
            onClick={onEnableNotifs}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              gap: 13,
              alignItems: 'center',
              padding: 14,
              marginBottom: 10,
              borderRadius: 16,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: palette.text,
              background: `linear-gradient(135deg, ${palette.accent}22, ${palette.primary}14)`,
              border: `1.5px solid ${palette.accent}99`,
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>🔔</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14.5, display: 'block' }}>
                Active les notifications
              </span>
              <span style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                Sois prévenu quand ta commande est prête 🥤 et reçois les offres. Touche ici pour activer.
              </span>
            </span>
            <span style={{ fontSize: 18, color: palette.accent, flexShrink: 0 }}>→</span>
          </button>
        )}

        {visibleItems.length === 0 && !showEnableNotifs ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: palette.textDim }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>Aucun message pour l'instant</div>
            <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
              Active les notifications dans ton profil pour ne rien rater des nouveautés et offres ✨
            </div>
          </div>
        ) : visibleItems.length === 0 ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleItems.map((b) => {
              const card = (
                <div
                  style={{
                    display: 'flex',
                    gap: 13,
                    padding: 14,
                    background: palette.card,
                    border: `1px solid ${b.read ? palette.line : palette.accent + '88'}`,
                    borderRadius: 16,
                    opacity: b.read ? 0.72 : 1,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                      background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow3})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}
                  >
                    {b.emoji || '🔔'}
                    {!b.read && (
                      <span
                        style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 12, height: 12, borderRadius: '50%',
                          background: palette.accent, border: `2px solid ${palette.card}`,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14 }}>{b.title}</span>
                      <span style={{ fontSize: 10, color: palette.textDim, flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(b.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: palette.textDim, marginTop: 3, lineHeight: 1.45 }}>{b.body}</div>
                    {!b.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMarkRead(b);
                        }}
                        style={{
                          marginTop: 8,
                          padding: '5px 11px',
                          borderRadius: 999,
                          border: `1px solid ${palette.line}`,
                          background: 'transparent',
                          color: palette.textDim,
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✓ Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              );
              // Un message avec lien : le clic ouvre le lien ET le marque lu.
              // Sinon : le clic sur la carte le marque lu.
              return b.url ? (
                <a
                  key={b.id}
                  href={b.url}
                  onClick={() => onMarkRead(b)}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {card}
                </a>
              ) : (
                <div key={b.id} onClick={() => onMarkRead(b)} style={{ cursor: b.read ? 'default' : 'pointer' }}>
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
