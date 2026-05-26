// home.jsx — Home screen + shared header/nav/UI primitives

const { useState, useEffect, useRef, useMemo } = React;

// ── Icons (inline SVG, lucide-flavored) ─────────────────────────────
const I = {
  bell: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  user: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>,
  cart: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2l2.5 12h12L22 7H6"/></svg>,
  search: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  star: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill={c} stroke="none"><path d="m12 2 3.1 6.4 7 1-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-1z"/></svg>,
  home: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>,
  menu: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  bolt: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>,
  account: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>,
  arrow: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  map: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  close: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  minus: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  insta: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={c}/></svg>,
  whatsapp: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .1-3-.6-2.6-1-4.3-3.6-4.4-3.8-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.2.4 0 .6l-.3.4-.3.4c-.1.1-.2.3 0 .5.2.3.8 1.3 1.7 2 1.2.9 2.1 1.2 2.4 1.4.3.1.5.1.7-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.6.4 0 .1 0 .8-.3 1.5z"/></svg>,
  chevron: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>,
};

// ── Logo wordmark ───────────────────────────────────────────────────
function LaBaseLogo({ palette, size = 'md' }) {
  const fs = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: fs * 1.5, height: fs * 1.5, borderRadius: 8,
        background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: palette.bg, fontSize: fs * .85,
        boxShadow: `0 0 20px ${palette.primary}55`,
      }}>B</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: fs, color: palette.text, letterSpacing: '-.02em' }}>LA BASE</div>
        <div style={{ fontSize: fs * .42, color: palette.textDim, letterSpacing: '.2em', fontWeight: 600, marginTop: 2 }}>SHAKES&nbsp;·&nbsp;VERDUN</div>
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────
function Header({ palette, cartCount, onCart }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      padding: '14px 16px 10px',
      background: `linear-gradient(180deg, ${palette.bg} 70%, ${palette.bg}00)`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <LaBaseLogo palette={palette}/>
      <div style={{ display: 'flex', gap: 6 }}>
        <IconBtn palette={palette}>{I.bell(palette.text)}</IconBtn>
        <IconBtn palette={palette}>{I.user(palette.text)}</IconBtn>
        <IconBtn palette={palette} onClick={onCart} badge={cartCount}>{I.cart(palette.text)}</IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ palette, children, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 12,
      background: palette.card, border: `1px solid ${palette.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', cursor: 'pointer', padding: 0,
    }}>
      {children}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
          background: palette.accent, color: palette.ctaText,
          fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 2px ${palette.bg}`,
          fontVariantNumeric: 'tabular-nums',
        }}>{badge}</div>
      )}
    </button>
  );
}

// ── Salutation + XP card ─────────────────────────────────────────
function XPCard({ palette, level, xp, xpNext, connected }) {
  const pct = Math.min(100, (xp / xpNext) * 100);
  const mascotteLevel = pct > 80 ? 'pro' : pct > 40 ? 'regulier' : 'apprenti';
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{
        background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
        border: `1px solid ${palette.line}`,
        borderRadius: 18, padding: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* glow */}
        <div style={{
          position: 'absolute', right: -20, top: -30,
          width: 140, height: 140, borderRadius: '50%',
          background: `radial-gradient(circle, ${palette.primary}33, transparent 70%)`,
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* Mascotte */}
          <div style={{ flexShrink: 0 }}>
            <Mascotte palette={palette} mood="wave" size={54} level={mascotteLevel}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: palette.textDim, fontWeight: 500 }}>Salut Léa 👋</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, color: palette.text, lineHeight: 1.1, marginTop: 2 }}>
              Niveau <span style={{ color: palette.primary }}>{level}</span>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', background: 'rgba(0,0,0,.3)', borderRadius: 999,
            border: `1px solid ${palette.line}`,
            flexShrink: 0,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: palette.primary, boxShadow: `0 0 8px ${palette.primary}` }}/>
            <span style={{ fontSize: 11, color: palette.text, fontWeight: 700, letterSpacing: '.04em' }}>{xp} XP</span>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 8, background: 'rgba(0,0,0,.4)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
              borderRadius: 999,
              boxShadow: `0 0 12px ${palette.primary}99`,
              transition: 'width .5s ease',
            }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: palette.textDim }}>
            <span>{xpNext - xp} XP avant <b style={{ color: palette.text, fontWeight: 700 }}>Régulier</b></span>
            <span style={{ color: palette.primary, fontWeight: 700 }}>−10% bientôt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero carousel ────────────────────────────────────────────────
function HeroCarousel({ palette, onProduct }) {
  const [idx, setIdx] = useState(0);
  const slides = useMemo(() => ([
    { type: 'combo', tag: 'Combo signature', title: 'Combo Power', sub: 'Smoothie XXL + Gaufre healthy', price: '15,90€', strike: '17,80€', save: '−1,90€', cta: 'Composer', product: PRODUCTS.combos[0] },
    { type: 'new', tag: 'Nouveau cette semaine', title: 'Choco Buenos', sub: '250 kcal · 24g de protéines', price: '8,90€', cta: 'Découvrir', product: PRODUCTS.popular[0] },
    { type: 'review', tag: '4,9/5 sur Google', title: '« Les meilleurs shakes de Verdun »', sub: '312 avis · Note moyenne 4,9', cta: 'Laisser un avis', product: null },
  ]), []);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[idx];

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{
        position: 'relative',
        height: 280, borderRadius: 20, overflow: 'hidden',
        background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2} 50%, ${palette.accent})`,
      }} onClick={() => s.product && onProduct(s.product)}>
        {/* noise overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 80% 20%, rgba(0,0,0,0), rgba(0,0,0,.55) 80%)`,
        }}/>
        {/* product visual */}
        {s.product && (
          <div style={{ position: 'absolute', right: -10, top: 10, transform: 'rotate(8deg)' }}>
            <DrinkPackshot product={s.product} size={210} palette={palette}/>
          </div>
        )}
        {s.type === 'review' && (
          <div style={{ position: 'absolute', right: 20, top: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 64, color: '#fff', lineHeight: 1 }}>4,9</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => <span key={i}>{I.star('#fde047')}</span>)}
            </div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, opacity: .9 }}>312 avis Google</div>
          </div>
        )}
        {/* content */}
        <div style={{ position: 'absolute', inset: 0, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start',
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
            fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,.18)',
          }}>{s.tag}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1.08, marginTop: 10, letterSpacing: '-.02em', maxWidth: '70%' }}>
            {s.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', marginTop: 6, maxWidth: '60%' }}>{s.sub}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {s.price && <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff' }}>{s.price}</div>}
              {s.strike && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'line-through' }}>{s.strike}</div>}
              {s.save && <div style={{
                background: palette.bg, color: palette.accent, fontSize: 11, fontWeight: 800,
                padding: '3px 8px', borderRadius: 999,
              }}>{s.save}</div>}
            </div>
            <button style={{
              padding: '9px 14px', borderRadius: 999,
              background: '#fff', color: palette.bg, border: 'none',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>{s.cta}{I.arrow(palette.bg)}</button>
          </div>
        </div>
        {/* dots */}
        <div style={{ position: 'absolute', top: 14, left: 18, display: 'flex', gap: 5 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 999,
              background: i === idx ? '#fff' : 'rgba(255,255,255,.4)',
              transition: 'all .35s',
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Search ──────────────────────────────────────────────────────
function SearchBar({ palette }) {
  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', background: palette.card,
        border: `1px solid ${palette.line}`, borderRadius: 14,
      }}>
        {I.search(palette.textDim)}
        <span style={{ color: palette.textDim, fontSize: 14 }}>Rechercher un shake, un combo…</span>
      </div>
    </div>
  );
}

// ── Chips ────────────────────────────────────────────────────────
function Chips({ palette, active, setActive }) {
  return (
    <div style={{
      position: 'sticky', top: 64, zIndex: 20,
      padding: '8px 0 12px',
      background: `linear-gradient(180deg, ${palette.bg} 75%, ${palette.bg}00)`,
    }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }} className="no-scrollbar">
        {CATEGORIES.map(c => {
          const on = c.id === active;
          return (
            <button key={c.id} onClick={() => setActive(c.id)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: on ? palette.text : palette.card,
              color: on ? palette.bg : palette.text,
              border: `1px solid ${on ? palette.text : palette.line}`,
              fontSize: 13, fontWeight: on ? 800 : 600,
              whiteSpace: 'nowrap', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              flexShrink: 0,
            }}>
              {c.icon && <span>{c.icon}</span>}{c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Habit row — Quick reorder ────────────────────────────────────
function HabitRow({ palette, addToCart }) {
  const items = [PRODUCTS.combos[0], PRODUCTS.popular[2]];
  return (
    <div style={{ padding: '0 16px 22px' }}>
      <div style={{
        background: `linear-gradient(135deg, ${palette.cardHi}, ${palette.card})`,
        border: `1px solid ${palette.primary}33`,
        borderRadius: 18, padding: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: palette.primary, textTransform: 'uppercase' }}>Ton habitude</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 16, color: palette.text, marginTop: 4, letterSpacing: '-.01em', lineHeight: 1.15 }}>Combo Power + Pink Rocket</div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>Les mardis · 22,80&nbsp;€</div>
          </div>
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {items.map((p, i) => (
              <div key={p.id} style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `radial-gradient(circle, ${p.hue1}88, ${p.hue2})`,
                border: `2px solid ${palette.card}`,
                marginLeft: i === 0 ? 0 : -14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <div style={{ transform: 'scale(.5)' }}>
                  <DrinkPackshot product={p} size={50} palette={palette}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={(e) => { items.forEach(p => addToCart(p, e.currentTarget)); }} style={{
          width: '100%', marginTop: 12, padding: '11px 14px', borderRadius: 12,
          background: palette.text, color: palette.bg, border: 0, cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          whiteSpace: 'nowrap',
        }}>↻ Rejouer ma commande</button>
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────
function SectionHead({ palette, icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 19, color: palette.text, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
      <button style={{
        background: 'transparent', border: `1px solid ${palette.line}`, color: palette.primary,
        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3,
        cursor: 'pointer', padding: '5px 10px', borderRadius: 999, flexShrink: 0,
      }}>Voir tout {I.chevron(palette.primary)}</button>
    </div>
  );
}

// ── Product card (small carousel card) ────────────────────────────
function ProductCard({ palette, product, onClick, onAdd, w = 168, h = 220 }) {
  return (
    <div onClick={onClick} style={{
      width: w, flexShrink: 0,
      background: palette.card, borderRadius: 18,
      border: `1px solid ${palette.line}`,
      overflow: 'hidden', cursor: 'pointer',
      position: 'relative',
    }}>
      <div style={{
        height: h - 90, position: 'relative',
        background: `radial-gradient(circle at 50% 60%, ${product.hue1}33, transparent 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <DrinkPackshot product={product} size={h - 90 - 10} palette={palette}/>
        {product.badge && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            padding: '4px 8px', borderRadius: 999,
            background: product.badge === 'Best' ? palette.accent : palette.emotion,
            color: product.badge === 'Best' ? palette.ctaText : '#1a0506',
            fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
          }}>{product.badge}</div>
        )}
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text, lineHeight: 1.15 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: palette.textDim, marginTop: 3, lineHeight: 1.3 }}>{product.sub}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 16, color: palette.text }}>
            {product.price.toFixed(2).replace('.', ',')}€
          </div>
          <button onClick={(e) => { e.stopPropagation(); onAdd(product, e.currentTarget); }} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: palette.cta, color: palette.ctaText,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${palette.cta}66`,
          }}>{I.plus(palette.ctaText)}</button>
        </div>
      </div>
    </div>
  );
}

// ── Combo card (larger) ──────────────────────────────────────────
function ComboCard({ palette, product, onClick, onAdd }) {
  return (
    <div onClick={onClick} style={{
      width: 280, flexShrink: 0,
      background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
      borderRadius: 18, border: `1px solid ${palette.line}`,
      overflow: 'hidden', cursor: 'pointer', position: 'relative',
    }}>
      <div style={{
        height: 130, position: 'relative',
        background: `radial-gradient(circle at 60% 60%, ${product.hue1}44, transparent 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DrinkPackshot product={product} size={150} palette={palette}/>
        <div style={{
          position: 'absolute', top: 10, left: 10,
          padding: '4px 9px', borderRadius: 999,
          background: palette.accent, color: palette.ctaText,
          fontSize: 11, fontWeight: 800, letterSpacing: '.03em',
        }}>−{product.save.toFixed(2).replace('.', ',')}€</div>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 17, color: palette.text }}>{product.name}</div>
        <div style={{ fontSize: 12, color: palette.textDim, marginTop: 3 }}>{product.sub}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 19, color: palette.text }}>{product.price.toFixed(2).replace('.', ',')}€</div>
            <div style={{ fontSize: 12, color: palette.textDim, textDecoration: 'line-through' }}>{(product.price + product.save).toFixed(2).replace('.', ',')}€</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onAdd(product, e.currentTarget); }} style={{
            padding: '8px 14px', borderRadius: 999,
            background: palette.cta, color: palette.ctaText, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
          }}>Composer {I.arrow(palette.ctaText)}</button>
        </div>
      </div>
    </div>
  );
}

// ── Carousel wrapper ─────────────────────────────────────────────
function Carousel({ children }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }} className="no-scrollbar">
      {children}
      <div style={{ width: 4, flexShrink: 0 }}/>
    </div>
  );
}

// ── Info pratique ────────────────────────────────────────────────
function InfoBlock({ palette }) {
  return (
    <div style={{ padding: '12px 16px 20px' }}>
      <div style={{
        background: palette.card, border: `1px solid ${palette.line}`,
        borderRadius: 18, padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* tiny map */}
          <div style={{
            width: 64, height: 64, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${palette.primaryDeep}, ${palette.bg})`,
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${palette.line}`,
          }}>
            <svg viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, opacity: .35 }}>
              <path d="M0 30 L20 25 L40 35 L64 28" stroke={palette.primary} strokeWidth="1" fill="none"/>
              <path d="M0 45 L25 40 L50 48 L64 42" stroke={palette.primary} strokeWidth="1" fill="none"/>
              <path d="M10 0 L15 64" stroke={palette.primary} strokeWidth="1" fill="none"/>
              <path d="M45 0 L42 64" stroke={palette.primary} strokeWidth="1" fill="none"/>
            </svg>
            <div style={{ position: 'relative', zIndex: 1, color: palette.cta }}>{I.map(palette.cta)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: palette.text }}>La Base · Verdun</div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>11 rue Saint Pierre, 55100 Verdun</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}/>
              <div style={{ fontSize: 12, color: palette.text, fontWeight: 600 }}>Ouvert · ferme à 19h</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: 'transparent', color: palette.text,
            border: `1px solid ${palette.line}`, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>Itinéraire</button>
          <button style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: 'transparent', color: palette.text,
            border: `1px solid ${palette.line}`, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>Avis · 4,9 ★</button>
        </div>
      </div>
    </div>
  );
}

function InstaCard({ palette }) {
  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div style={{
        background: `linear-gradient(135deg, #d946ef, #f97316, #facc15)`,
        borderRadius: 18, padding: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(0,0,0,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{I.insta('#fff')}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>@labase.verdun</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 1 }}>Les nouveautés, en stories</div>
        </div>
        <button style={{
          padding: '8px 12px', borderRadius: 999,
          background: 'rgba(0,0,0,.4)', color: '#fff', border: 0,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Suivre</button>
      </div>
    </div>
  );
}

// ── Bottom nav ──────────────────────────────────────────────────
function BottomNav({ palette, active, setActive }) {
  const tabs = [
    { id: 'home', label: 'Accueil', icon: I.home },
    { id: 'menu', label: 'Menu', icon: I.menu },
    { id: 'combo', label: 'Combos', icon: I.bolt },
    { id: 'account', label: 'Compte', icon: I.account },
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 30,
      background: `${palette.bg}f0`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${palette.line}`,
      padding: '8px 8px 22px',
      display: 'flex',
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            flex: 1, padding: '6px 4px',
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: on ? palette.primary : palette.textDim,
          }}>
            {t.icon(on ? palette.primary : palette.textDim)}
            <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, letterSpacing: '.02em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Home assembled ───────────────────────────────────────────────
function HomeScreen({ palette, cart, addToCart, openProduct, openCart, openCombo, navTab, setNavTab }) {
  const [chip, setChip] = useState('all');
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <Header palette={palette} cartCount={cartCount} onCart={openCart}/>
      <XPCard palette={palette} level="Apprenti" xp={45} xpNext={120} connected={true}/>
      <HeroCarousel palette={palette} onProduct={openProduct}/>
      <SearchBar palette={palette}/>
      <Chips palette={palette} active={chip} setActive={setChip}/>

      <HabitRow palette={palette} addToCart={addToCart}/>

      <SectionHead palette={palette} icon="🔥" title="Populaires au club" count={`${PRODUCTS.popular.length} recettes`}/>
      <Carousel>
        {PRODUCTS.popular.map(p => <ProductCard key={p.id} palette={palette} product={p} onClick={() => openProduct(p)} onAdd={addToCart}/>)}
      </Carousel>

      <div style={{ height: 22 }}/>
      <SectionHead palette={palette} icon="⚡" title="Formules combo" count="économise jusqu'à 1,90€"/>
      <Carousel>
        {PRODUCTS.combos.map(p => <ComboCard key={p.id} palette={palette} product={p} onClick={() => openCombo(p)} onAdd={(prod) => openCombo(prod)}/>)}
      </Carousel>

      <div style={{ height: 22 }}/>
      <SectionHead palette={palette} icon="🥤" title="Smoothies nutritionnels" count="15 recettes"/>
      <Carousel>
        {PRODUCTS.smoothies.map(p => <ProductCard key={p.id} palette={palette} product={p} onClick={() => openProduct(p)} onAdd={addToCart}/>)}
      </Carousel>

      <div style={{ height: 22 }}/>
      <SectionHead palette={palette} icon="💧" title="Boissons énergisantes" count="14 recettes · 0 sucre"/>
      <Carousel>
        {PRODUCTS.drinks.map(p => <ProductCard key={p.id} palette={palette} product={p} onClick={() => openProduct(p)} onAdd={addToCart}/>)}
      </Carousel>

      <div style={{ height: 22 }}/>
      <SectionHead palette={palette} icon="☕" title="Pauses chaudes" count="4 produits"/>
      <Carousel>
        {PRODUCTS.hot.map(p => <ProductCard key={p.id} palette={palette} product={p} onClick={() => openProduct(p)} onAdd={addToCart}/>)}
      </Carousel>

      <div style={{ height: 22 }}/>
      <InfoBlock palette={palette}/>
      <InstaCard palette={palette}/>

      <BottomNav palette={palette} active={navTab} setActive={setNavTab}/>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, Header, BottomNav, IconBtn, I, LaBaseLogo, ProductCard, ComboCard, Carousel, SectionHead, Chips, SearchBar, XPCard,
});
