// order-status.jsx — Post-checkout: live tracking screen "En préparation → Prêt"
const { useState, useEffect, useMemo } = React;

function OrderStatus({ palette, cart, name, time, onClose, onBack }) {
  // status: pending (0..30s) → preparing (30s..70s) → ready (70s+)
  const [elapsed, setElapsed] = useState(0);
  const [notifyMe, setNotifyMe] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // map elapsed → fake progress: 0-8s confirmed, 8-22s preparing, 22-30 finishing, 30+ ready
  const TOTAL = 36;
  const phase = elapsed < 6 ? 0 : elapsed < 18 ? 1 : elapsed < 30 ? 2 : 3;
  const pct = Math.min(100, (elapsed / TOTAL) * 100);
  const remaining = Math.max(0, TOTAL - elapsed);

  const total = cart.reduce((s, x) => s + x.product.price * x.qty, 0);
  const orderId = useMemo(() => 'LB-' + Math.floor(2300 + Math.random() * 700), []);

  const phases = [
    { id: 0, label: 'Reçue', icon: '✓', sub: 'Confirmée par Square' },
    { id: 1, label: 'En préparation', icon: '🥤', sub: 'Le shaker est en route' },
    { id: 2, label: 'Finitions', icon: '✨', sub: 'Toppings + emballage' },
    { id: 3, label: 'Prêt à retirer', icon: '🎉', sub: 'À toi de jouer' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: palette.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Top burst */}
      <div style={{
        position: 'relative', flexShrink: 0,
        height: phase === 3 ? 280 : 220,
        background: phase === 3
          ? `linear-gradient(180deg, ${palette.glow1}, ${palette.glow2} 60%, ${palette.bg})`
          : `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
        overflow: 'hidden',
        transition: 'all .5s ease',
      }}>
        {/* close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, zIndex: 5,
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
          border: `1px solid rgba(255,255,255,.08)`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>{I.close('#fff')}</button>
        <button onClick={onBack} style={{
          position: 'absolute', top: 14, left: 14, zIndex: 5,
          padding: '8px 12px', borderRadius: 12,
          background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 12, fontWeight: 700,
          border: `1px solid rgba(255,255,255,.08)`, cursor: 'pointer',
        }}>‹ Détail</button>

        <div style={{ padding: '50px 24px 0', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase',
            color: phase === 3 ? '#fff' : palette.primary, opacity: .9,
          }}>Commande {orderId}</div>
          <div style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: phase === 3 ? 36 : 30,
            color: phase === 3 ? '#fff' : palette.text,
            letterSpacing: '-.02em', lineHeight: 1, marginTop: 10,
          }}>
            {phase === 3 ? `Prêt, ${name} !` : `Salut ${name},`}
          </div>
          <div style={{
            fontSize: 14, marginTop: 8,
            color: phase === 3 ? 'rgba(255,255,255,.9)' : palette.textDim,
            fontWeight: 500,
          }}>
            {phase === 3 ? 'Ton retrait t\'attend au comptoir' : 'On prépare ta commande'}
          </div>
        </div>

        {/* Big timer */}
        {phase !== 3 && (
          <div style={{
            position: 'absolute', right: -10, bottom: -20,
            fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 110,
            color: palette.primary, opacity: .08, lineHeight: 1,
            letterSpacing: '-.05em',
          }}>{remaining}s</div>
        )}

        {/* Confetti dots for ready */}
        {phase === 3 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[...Array(14)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${(i * 73) % 100}%`,
                top: `${(i * 37) % 80}%`,
                width: 6, height: 8,
                background: ['#fde047', '#fff', palette.accent][i % 3],
                borderRadius: 2,
                animation: `confetti-${i} 2s ${i * .05}s ease-out infinite`,
              }}/>
            ))}
            <style>{[...Array(14)].map((_, i) => `@keyframes confetti-${i} { 0% { transform: translateY(-20px) rotate(0); opacity:0; } 30% { opacity:1; } 100% { transform: translateY(120px) rotate(${360 * (i % 2 ? 1 : -1)}deg); opacity:0; } }`).join('\n')}</style>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 140px' }}>
        {/* Phase pills */}
        <div style={{
          padding: 14, borderRadius: 18,
          background: palette.card, border: `1px solid ${palette.line}`,
          marginTop: -28, position: 'relative', zIndex: 3,
          boxShadow: '0 12px 32px rgba(0,0,0,.3)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {phases.map(p => {
              const active = phase === p.id;
              const done = phase > p.id;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: !active && !done ? .35 : 1,
                  transition: 'opacity .3s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: active
                      ? `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2})`
                      : done ? palette.primary : palette.card,
                    border: `1.5px solid ${active ? palette.primary : done ? palette.primary : palette.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                    boxShadow: active ? `0 0 18px ${palette.primary}66` : 'none',
                    animation: active ? 'pulse 1.6s ease-in-out infinite' : 'none',
                  }}>{done ? '✓' : p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: palette.textDim, marginTop: 1 }}>{p.sub}</div>
                  </div>
                  {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: palette.primary, boxShadow: `0 0 8px ${palette.primary}`, animation: 'pulse 1s infinite' }}/>}
                </div>
              );
            })}
          </div>
          <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }`}</style>
          {/* Progress bar */}
          <div style={{ marginTop: 14, height: 6, background: 'rgba(0,0,0,.4)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
              borderRadius: 999, transition: 'width 1s linear',
              boxShadow: `0 0 8px ${palette.primary}aa`,
            }}/>
          </div>
        </div>

        {/* Order recap */}
        <div style={{ marginTop: 18 }}>
          <SectionLabel palette={palette}>Ta commande</SectionLabel>
          <div style={{
            marginTop: 8, padding: 12,
            background: palette.card, border: `1px solid ${palette.line}`,
            borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {cart.map(line => (
              <div key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `radial-gradient(circle at 50% 60%, ${line.product.hue1}44, transparent 70%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  <DrinkPackshot product={line.product} size={48} palette={palette}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: palette.text }}>{line.qty} × {line.product.name}</div>
                  <div style={{ fontSize: 11, color: palette.textDim }}>{line.product.sub}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: palette.text, fontVariantNumeric: 'tabular-nums' }}>
                  {(line.product.price * line.qty).toFixed(2).replace('.', ',')}€
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: palette.line, margin: '2px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: palette.text, fontFamily: 'Outfit, sans-serif' }}>
              <span>Total réglé</span>
              <span>{total.toFixed(2).replace('.', ',')}€</span>
            </div>
          </div>
        </div>

        {/* Pickup info */}
        <div style={{
          marginTop: 14, padding: 14,
          background: palette.card, border: `1px solid ${palette.line}`,
          borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: phase === 3 ? palette.cta : palette.cardHi,
            color: phase === 3 ? palette.ctaText : palette.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{I.map(phase === 3 ? palette.ctaText : palette.primary)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text }}>La Base · Verdun</div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>11 rue Saint Pierre · 3 min à pied</div>
          </div>
          <button style={{
            padding: '8px 12px', borderRadius: 10,
            background: 'transparent', color: palette.text,
            border: `1px solid ${palette.line}`, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Itinéraire</button>
        </div>

        {/* Notify toggle */}
        {phase < 3 && (
          <div onClick={() => setNotifyMe(n => !n)} style={{
            marginTop: 12, padding: 14, borderRadius: 14,
            background: notifyMe ? `${palette.primary}15` : palette.card,
            border: `1px solid ${notifyMe ? palette.primary + '88' : palette.line}`,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{ fontSize: 22 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: palette.text }}>Préviens-moi 1 min avant</div>
              <div style={{ fontSize: 11, color: palette.textDim, marginTop: 1 }}>Notification push quand c'est presque prêt</div>
            </div>
            <div style={{
              width: 38, height: 22, borderRadius: 999,
              background: notifyMe ? palette.primary : 'rgba(255,255,255,.1)',
              position: 'relative', transition: 'all .2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: notifyMe ? 18 : 2,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
              }}/>
            </div>
          </div>
        )}

        {/* XP gain */}
        <div style={{
          marginTop: 12, padding: 14, borderRadius: 14,
          background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
          border: `1px dashed ${palette.primary}66`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: palette.primary, color: palette.bg,
            fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+15<br/>XP</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: palette.text }}>{phase === 3 ? 'XP créditées 🎉' : 'XP au comptoir'}</div>
            <div style={{ fontSize: 11, color: palette.textDim, marginTop: 1 }}>Plus que 60 XP avant <b style={{ color: palette.text }}>Régulier</b> et −10% sur ta prochaine commande</div>
          </div>
        </div>
      </div>

      {/* Sticky bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 16px 28px',
        background: `linear-gradient(0deg, ${palette.bg} 70%, ${palette.bg}00)`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {phase === 3 ? (
          <button onClick={onClose} style={{
            padding: '16px', borderRadius: 16,
            background: palette.cta, color: palette.ctaText, border: 0, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15,
            boxShadow: `0 8px 28px ${palette.cta}55`,
          }}>J'arrive au comptoir →</button>
        ) : (
          <>
            <button style={{
              padding: '14px', borderRadius: 14,
              background: palette.card, color: palette.text,
              border: `1px solid ${palette.line}`, cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>{I.whatsapp('#25D366')} Joindre l'équipe</button>
          </>
        )}
      </div>
    </div>
  );
}

window.OrderStatus = OrderStatus;
