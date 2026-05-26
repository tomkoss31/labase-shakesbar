// app.jsx — root app, viewport frames, add-to-cart animation, tweaks

const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

// ── Add-to-cart fly animation ────────────────────────────────────
function FlyingDrop({ palette, from, to, onDone, product }) {
  const ref = uR(null);
  uE(() => {
    const el = ref.current;
    if (!el) return;
    el.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(from.y, to.y) - 80}px) scale(.65) rotate(180deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(.15) rotate(360deg)`, opacity: 0 },
      ],
      { duration: 700, easing: 'cubic-bezier(.5,.0,.55,1)', fill: 'forwards' }
    );
    const t = setTimeout(onDone, 720);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'absolute', left: 0, top: 0, width: 40, height: 40, pointerEvents: 'none', zIndex: 100,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, ${product.hue1}, ${product.hue2})`,
      boxShadow: `0 0 24px ${product.hue1}aa`,
    }}/>
  );
}

function Droplets({ palette, x, y, color }) {
  const [show, setShow] = uS(true);
  uE(() => { const t = setTimeout(() => setShow(false), 700); return () => clearTimeout(t); }, []);
  if (!show) return null;
  const drops = [
    { a: -60, d: 50 }, { a: -30, d: 55 }, { a: 0, d: 45 }, { a: 30, d: 55 }, { a: 60, d: 50 },
    { a: -45, d: 35 }, { a: 45, d: 35 },
  ];
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 99 }}>
      {drops.map((d, i) => {
        const dx = Math.sin(d.a * Math.PI / 180) * d.d;
        const dy = -Math.cos(d.a * Math.PI / 180) * d.d;
        return (
          <div key={i} style={{
            position: 'absolute',
            width: 6 + (i % 3) * 2, height: 6 + (i % 3) * 2, borderRadius: '50%',
            background: color, opacity: .9,
            animation: `dropFly-${i} .65s cubic-bezier(.3,0,.55,1) forwards`,
          }}>
            <style>{`@keyframes dropFly-${i} { from { transform: translate(0,0) scale(1); opacity: 1; } to { transform: translate(${dx}px, ${dy}px) scale(.2); opacity: 0; } }`}</style>
          </div>
        );
      })}
    </div>
  );
}

// ── Style Tile panel ─────────────────────────────────────────────
function StyleTile({ palette }) {
  return (
    <div style={{
      width: 360, padding: 24, background: '#fafaf7',
      color: '#0a0a0a', borderRadius: 24,
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 24px 80px rgba(0,0,0,.3)',
      display: 'flex', flexDirection: 'column', gap: 18,
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '.15em', color: '#666' }}>STYLE TILE</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, marginTop: 2 }}>Palette {palette.id} · {palette.name}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{palette.sub}</div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#999', textTransform: 'uppercase' }}>Couleurs</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          {[
            ['Primary', palette.primary], ['Accent', palette.accent],
            ['Background', palette.bg], ['Card', palette.card],
            ['CTA', palette.cta], ['Emotion', palette.emotion],
            ['Text', palette.text], ['Dim', palette.textDim],
          ].map(([n, c]) => (
            <div key={n}>
              <div style={{ height: 44, borderRadius: 8, background: c, border: '1px solid rgba(0,0,0,.06)' }}/>
              <div style={{ fontSize: 9, color: '#666', marginTop: 4, fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 9, color: '#999', fontFamily: 'ui-monospace, monospace' }}>{c}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`}}/>
        <div style={{ fontSize: 10, color: '#666', marginTop: 4, fontWeight: 600, fontFamily: 'ui-monospace' }}>Signature gradient</div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#999', textTransform: 'uppercase' }}>Typographie</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '-.02em', lineHeight: 1 }}>Outfit Black</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Display · titres · prix · 800-900</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13 }}>Inter Regular — corps de texte, descriptions ingrédients, copy informatif.</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Body · 400-700</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#999', textTransform: 'uppercase' }}>Components</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button style={{ padding: '10px 16px', borderRadius: 12, background: palette.cta, color: palette.ctaText, border: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: 13 }}>Ajouter au panier</button>
          <button style={{ padding: '10px 16px', borderRadius: 12, background: 'transparent', color: '#0a0a0a', border: '1.5px solid rgba(0,0,0,.15)', fontWeight: 700, fontSize: 13 }}>WhatsApp</button>
          <button style={{ width: 36, height: 36, borderRadius: '50%', background: palette.cta, color: palette.ctaText, border: 0, fontWeight: 900, fontSize: 18 }}>＋</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: palette.accent, color: palette.ctaText, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>Best</div>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: palette.emotion, color: '#1a0506', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>Nouveau</div>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,.08)', color: '#0a0a0a', fontSize: 11, fontWeight: 700 }}>🥤 Smoothies</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, height: 70, background: palette.card, borderRadius: 14, border: `1px solid ${palette.line}`, padding: 8 }}>
            <div style={{ fontSize: 9, color: palette.textDim }}>Card · dark</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 12, color: palette.text, marginTop: 14 }}>radius 18px</div>
          </div>
          <div style={{ flex: 1, height: 70, background: '#fff', borderRadius: 14, border: `1px solid rgba(0,0,0,.08)`, padding: 8 }}>
            <div style={{ fontSize: 9, color: '#999' }}>Card · light</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 12, color: '#0a0a0a', marginTop: 14 }}>radius 18px</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#999', textTransform: 'uppercase' }}>Icônes</div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>lucide-react · stroke 2px · 20-24px</div>
      </div>
    </div>
  );
}

// ── Phone Frame ──────────────────────────────────────────────────
function PhoneFrame({ palette, children, overlays }) {
  return (
    <div style={{
      width: 390, height: 844, flexShrink: 0,
      borderRadius: 50,
      background: '#0a0a0a',
      padding: 11,
      boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06), 0 0 60px ${palette.primary}33`,
      position: 'relative',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 40, overflow: 'hidden',
        background: palette.bg,
        position: 'relative',
      }}>
        {/* status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px 0 30px', zIndex: 40, pointerEvents: 'none',
          color: palette.text, fontSize: 14, fontWeight: 700,
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="18" height="11" viewBox="0 0 18 11" fill={palette.text}><rect y="6" width="3" height="5" rx=".5"/><rect x="5" y="4" width="3" height="7" rx=".5"/><rect x="10" y="2" width="3" height="9" rx=".5"/><rect x="15" width="3" height="11" rx=".5"/></svg>
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={palette.text} strokeWidth="1.2"><path d="M1 4a10 10 0 0 1 14 0M3 6.2a7 7 0 0 1 10 0M5 8.4a4 4 0 0 1 6 0M8 11l0 0"/></svg>
            <div style={{ width: 25, height: 11, border: `1px solid ${palette.text}`, borderRadius: 3, padding: 1.5, opacity: .9 }}>
              <div style={{ width: '78%', height: '100%', background: palette.text, borderRadius: 1 }}/>
            </div>
          </div>
        </div>
        {/* notch */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 30, borderRadius: 18, background: '#000', zIndex: 41,
        }}/>
        <div className="no-scrollbar" style={{
          position: 'absolute', top: 48, left: 0, right: 0, bottom: 0,
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {children}
        </div>
        {/* overlays (modals) — scoped to the frame, not the scroll content */}
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
            {overlays}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Desktop Frame ────────────────────────────────────────────────
function DesktopFrame({ palette, children, overlays }) {
  return (
    <div style={{
      width: 1280, height: 800, flexShrink: 0,
      borderRadius: 18, overflow: 'hidden',
      background: '#0a0a0a',
      boxShadow: `0 40px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08), 0 0 80px ${palette.primary}22`,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* browser chrome */}
      <div style={{
        height: 36, background: '#161616', display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }}/>)}
        </div>
        <div style={{
          marginLeft: 20, padding: '5px 14px', borderRadius: 7,
          background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.55)',
          fontSize: 12, fontFamily: 'ui-monospace, monospace',
        }}>commande.labase-nutrition.com</div>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: palette.bg, position: 'relative' }}>
        {children}
      </div>
      {/* overlays scoped to frame */}
      <div style={{ position: 'absolute', top: 36, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
          {overlays}
        </div>
      </div>
    </div>
  );
}

// ── Desktop view (reflowed) ──────────────────────────────────────
function DesktopHome({ palette, openProduct, addToCart, cart, openCart }) {
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  return (
    <div>
      {/* nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: `${palette.bg}f0`, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${palette.line}`,
        padding: '14px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <LaBaseLogo palette={palette}/>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Accueil', 'Menu', 'Combos', 'Récompenses'].map((t, i) => (
              <a key={t} style={{
                fontSize: 14, fontWeight: i === 0 ? 800 : 600,
                color: i === 0 ? palette.text : palette.textDim,
                cursor: 'pointer', textDecoration: 'none',
              }}>{t}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
            background: palette.card, border: `1px solid ${palette.line}`, borderRadius: 12,
            color: palette.textDim, fontSize: 13, width: 220,
          }}>{I.search(palette.textDim)} Rechercher…</div>
          <IconBtn palette={palette}>{I.bell(palette.text)}</IconBtn>
          <IconBtn palette={palette} onClick={openCart} badge={cartCount}>{I.cart(palette.text)}</IconBtn>
          <button style={{
            padding: '8px 14px', borderRadius: 999,
            background: palette.cta, color: palette.ctaText, border: 0, cursor: 'pointer',
            fontFamily: 'Outfit', fontWeight: 800, fontSize: 13,
          }}>Mon compte</button>
        </div>
      </div>

      {/* hero + xp */}
      <div style={{ padding: '32px 56px 0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{
          height: 360, borderRadius: 24, overflow: 'hidden', position: 'relative',
          background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2} 50%, ${palette.accent})`,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 20%, transparent, rgba(0,0,0,.5) 80%)` }}/>
          <div style={{ position: 'absolute', right: 30, top: 30, transform: 'rotate(8deg)' }}>
            <DrinkPackshot product={PRODUCTS.combos[0]} size={300} palette={palette}/>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,.55)', fontSize: 11, color: '#fff', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Combo signature</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 56, color: '#fff', letterSpacing: '-.03em', lineHeight: .95, marginTop: 12 }}>Combo<br/>Power.</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,.85)', marginTop: 10, maxWidth: 380 }}>Smoothie XXL 500ml + gaufre healthy. Le déjeuner protéiné, en 5 min.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 32, color: '#fff' }}>15,90€</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', textDecoration: 'line-through' }}>17,80€</div>
              <button style={{ padding: '12px 22px', borderRadius: 999, background: '#fff', color: palette.bg, border: 0, fontFamily: 'Outfit', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>Composer →</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            flex: 1, padding: 24, borderRadius: 24,
            background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
            border: `1px solid ${palette.line}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -30, top: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${palette.primary}44, transparent 70%)` }}/>
            <div style={{ fontSize: 13, color: palette.textDim }}>Salut Léa 👋</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: palette.text, lineHeight: 1, marginTop: 6 }}>Niveau <span style={{ color: palette.primary }}>Apprenti</span></div>
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 10, background: 'rgba(0,0,0,.4)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '37%', background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`, borderRadius: 999, boxShadow: `0 0 12px ${palette.primary}99` }}/>
              </div>
              <div style={{ fontSize: 12, color: palette.textDim, marginTop: 8 }}>75 XP avant <b style={{ color: palette.text }}>Régulier</b> · −10% à la clé</div>
            </div>
          </div>
          <div style={{
            padding: 18, borderRadius: 20,
            background: palette.card, border: `1px solid ${palette.line}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: palette.cta, color: palette.ctaText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.map(palette.ctaText)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 15, color: palette.text }}>11 rue Saint Pierre · Verdun</div>
              <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>Ouvert · ferme à 19h · prêt en 5-10 min</div>
            </div>
          </div>
        </div>
      </div>

      {/* sections — 4-column grid */}
      {[
        { icon: '🔥', title: 'Populaires au club', list: PRODUCTS.popular },
        { icon: '🥤', title: 'Smoothies nutritionnels', list: PRODUCTS.smoothies },
        { icon: '⚡', title: 'Boissons énergisantes', list: PRODUCTS.drinks },
        { icon: '☕', title: 'Pauses chaudes', list: PRODUCTS.hot },
      ].map((sec) => (
        <div key={sec.title} style={{ padding: '32px 56px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{sec.icon}</span>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: palette.text, letterSpacing: '-.02em' }}>{sec.title}</div>
            </div>
            <button style={{ background: 'transparent', border: 0, color: palette.primary, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Voir tout →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {sec.list.slice(0, 4).map(p => (
              <ProductCard key={p.id} palette={palette} product={p} onClick={() => openProduct(p)} onAdd={addToCart} w={null} h={280}/>
            ))}
          </div>
        </div>
      ))}

      <div style={{ height: 48 }}/>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "E",
  "view": "mobile",
  "showTile": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[t.palette] || PALETTES.E;
  const [cart, setCart] = uS([]);
  const [navTab, setNavTab] = uS('home');
  const [productOpen, setProductOpen] = uS(null);
  const [cartOpen, setCartOpen] = uS(false);
  const [comboOpen, setComboOpen] = uS(null);
  const [orderInfo, setOrderInfo] = uS(null); // { cart, name, time } when paid
  const [flying, setFlying] = uS([]);
  const cartIconRef = uR(null);
  const stageRef = uR(null);

  const addToCart = (product, btnEl) => {
    // animate
    if (btnEl && stageRef.current) {
      const stageBox = stageRef.current.getBoundingClientRect();
      const btnBox = btnEl.getBoundingClientRect();
      // estimate cart icon: top-right of currently visible frame
      const frame = stageRef.current.querySelector('[data-frame-active="1"]');
      const cartBtn = frame?.querySelector('[data-cart-icon="1"]');
      let toBox;
      if (cartBtn) {
        toBox = cartBtn.getBoundingClientRect();
      } else {
        toBox = { left: stageBox.right - 80, top: stageBox.top + 60, width: 38, height: 38 };
      }
      const from = { x: btnBox.left - stageBox.left + btnBox.width/2 - 20, y: btnBox.top - stageBox.top + btnBox.height/2 - 20 };
      const to = { x: toBox.left - stageBox.left + toBox.width/2 - 20, y: toBox.top - stageBox.top + toBox.height/2 - 20 };
      const id = Math.random();
      setFlying(f => [...f, { id, from, to, product }]);
      // button shake via class
      btnEl.animate(
        [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-18deg) scale(1.15)' },
          { transform: 'rotate(18deg) scale(1.15)' },
          { transform: 'rotate(-10deg) scale(1.1)' },
          { transform: 'rotate(10deg) scale(1.1)' },
          { transform: 'rotate(0deg) scale(1)' },
        ],
        { duration: 500, easing: 'cubic-bezier(.2,.8,.4,1)' }
      );
    }
    setCart(c => {
      const found = c.find(x => x.product.id === product.id);
      if (found) return c.map(x => x.product.id === product.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { id: Math.random().toString(36), product, qty: 1 }];
    });
  };

  // Easter egg: triple-tap logo → random shake
  const logoTapRef = uR({ count: 0, last: 0 });
  uE(() => {
    const handler = (e) => {
      // we'll handle via stage clicks tracked outside; minimal impl
    };
    return () => {};
  }, []);

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#080808',
      backgroundImage: `radial-gradient(circle at 30% 20%, ${palette.primary}11, transparent 50%), radial-gradient(circle at 80% 80%, ${palette.accent}11, transparent 50%)`,
      padding: '40px 24px 80px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      gap: 32, fontFamily: 'Inter, system-ui, sans-serif',
      color: palette.text,
    }}>
      <div ref={stageRef} style={{ position: 'relative', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {t.view === 'mobile' ? (
          <div data-frame-active="1" style={{ position: 'relative' }}>
            <PhoneFrame palette={palette} overlays={
              <React.Fragment>
                {productOpen && (
                  <ProductModal palette={palette} product={productOpen}
                    onClose={() => setProductOpen(null)}
                    onAdd={(p, btn) => { addToCart(p, btn); setTimeout(() => setProductOpen(null), 300); }}
                  />
                )}
                {comboOpen && (
                  <ComboComposer palette={palette} combo={comboOpen}
                    onClose={() => setComboOpen(null)}
                    onAdd={(p, btn) => { addToCart(p, btn); }}
                  />
                )}
                {cartOpen && (
                  <CartScreen palette={palette} cart={cart} setCart={setCart}
                    addToCart={addToCart} allProducts={PRODUCTS}
                    onClose={() => setCartOpen(false)}
                    onCheckout={({ name, time }) => {
                      setOrderInfo({ cart: [...cart], name, time, snapshotTotal: cart.reduce((s,x) => s + x.product.price * x.qty, 0) });
                      setCart([]);
                      setCartOpen(false);
                    }}
                  />
                )}
                {orderInfo && (
                  <OrderStatus palette={palette}
                    cart={orderInfo.cart} name={orderInfo.name} time={orderInfo.time}
                    onClose={() => setOrderInfo(null)}
                    onBack={() => setOrderInfo(null)}
                  />
                )}
              </React.Fragment>
            }>
              <HomeScreen
                palette={palette}
                cart={cart}
                addToCart={addToCart}
                openProduct={(p) => p.shape === 'combo' ? setComboOpen(p) : setProductOpen(p)}
                openCombo={(p) => setComboOpen(p)}
                openCart={() => setCartOpen(true)}
                navTab={navTab}
                setNavTab={(t) => setNavTab(t)}
              />
            </PhoneFrame>
            {/* fly overlay scoped to mobile frame */}
            {flying.map(f => (
              <FlyingDrop key={f.id} palette={palette} from={f.from} to={f.to} product={f.product}
                onDone={() => setFlying(x => x.filter(y => y.id !== f.id))}/>
            ))}
            {/* Tag the cart icon for the animation target */}
            <CartIconTagger/>
          </div>
        ) : (
          <div data-frame-active="1" style={{ position: 'relative' }}>
            <DesktopFrame palette={palette} overlays={
              <React.Fragment>
                {productOpen && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30,
                  }} onClick={() => setProductOpen(null)}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                      width: 420, height: 720, position: 'relative',
                      borderRadius: 28, overflow: 'hidden', background: palette.bg,
                      boxShadow: '0 40px 100px rgba(0,0,0,.6)',
                    }}>
                      <ProductModal palette={palette} product={productOpen}
                        onClose={() => setProductOpen(null)}
                        onAdd={(p, btn) => { addToCart(p, btn); setTimeout(() => setProductOpen(null), 300); }}
                      />
                    </div>
                  </div>
                )}
                {cartOpen && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 24,
                  }} onClick={() => setCartOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                      width: 460, height: '100%', position: 'relative',
                      borderRadius: 24, overflow: 'hidden', background: palette.bg,
                      boxShadow: '0 40px 100px rgba(0,0,0,.6)',
                    }}>
                      <CartScreen palette={palette} cart={cart} setCart={setCart}
                        addToCart={addToCart} allProducts={PRODUCTS}
                        onClose={() => setCartOpen(false)}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            }>
              <DesktopHome palette={palette}
                openProduct={(p) => setProductOpen(p)}
                addToCart={addToCart} cart={cart}
                openCart={() => setCartOpen(true)}/>
            </DesktopFrame>
            {flying.map(f => (
              <FlyingDrop key={f.id} palette={palette} from={f.from} to={f.to} product={f.product}
                onDone={() => setFlying(x => x.filter(y => y.id !== f.id))}/>
            ))}
            <CartIconTagger/>
          </div>
        )}

        {t.showTile && <StyleTile palette={palette}/>}
      </div>

      <TweaksPanel>
        <TweakSection label="Palette"/>
        <TweakRadio label="Direction"
          value={t.palette}
          options={['A', 'D', 'E']}
          onChange={(v) => setTweak('palette', v)}/>
        <div style={{ fontSize: 10.5, color: 'rgba(41,38,27,.55)', marginTop: -4 }}>
          A · Teal Fresh — D · Coral Gourmand — <b>E · Teal × Ambre (défaut)</b>
        </div>
        <TweakSection label="Viewport"/>
        <TweakRadio label="Vue"
          value={t.view}
          options={['mobile', 'desktop']}
          onChange={(v) => setTweak('view', v)}/>
        <TweakSection label="Style tile"/>
        <TweakToggle label="Afficher la fiche"
          value={t.showTile}
          onChange={(v) => setTweak('showTile', v)}/>
        <TweakSection label="Démo"/>
        <TweakButton label="Ajouter Choco Buenos" onClick={(e) => {
          const stage = stageRef.current;
          if (!stage) return;
          const btn = stage.querySelector('[data-cart-icon="1"]');
          addToCart(PRODUCTS.popular[0], btn);
        }}/>
        <TweakButton label="Shake aléatoire 🎲" onClick={(e) => {
          const all = [...PRODUCTS.popular, ...PRODUCTS.smoothies];
          const p = all[Math.floor(Math.random() * all.length)];
          const stage = stageRef.current;
          const btn = stage?.querySelector('[data-cart-icon="1"]');
          addToCart(p, btn);
        }}/>
        <TweakButton label="Vider le panier" onClick={() => setCart([])}/>
      </TweaksPanel>
    </div>
  );
}

// Helper: tag the cart icon button in the rendered DOM with data-cart-icon="1"
// We do this with a small effect that finds the last IconBtn (cart) inside Header.
function CartIconTagger() {
  uE(() => {
    const tag = () => {
      document.querySelectorAll('[data-cart-icon="1"]').forEach(el => el.removeAttribute('data-cart-icon'));
      // Find buttons inside .header with badge — heuristic: the last IconBtn with a badge child or that contains the cart svg path
      const buttons = document.querySelectorAll('button');
      buttons.forEach(b => {
        const path = b.querySelector('path[d^="M3 4h2"]');
        if (path) b.setAttribute('data-cart-icon', '1');
      });
    };
    tag();
    const obs = new MutationObserver(tag);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
