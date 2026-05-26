// product-cart.jsx — Product Modal + Cart Screen

const TOPPINGS = ['Banane', 'Fruits rouges', 'Beurre cacahuète', 'Granola maison', 'Pépites choco'];
const SIZES = [
  { id: 'm', label: 'Medium', vol: '550ml', delta: 0 },
  { id: 'l', label: 'Large', vol: '950ml', delta: 2.00 },
];
const INGREDIENTS = {
  default: ['Lait d\'amande bio', 'Whey isolate cacao', 'Banane fraîche', 'Beurre de cacahuète', 'Pépites Bueno'],
  drink: ['Eau filtrée', 'Électrolytes Na+K+Mg', 'Vitamines B6, B12, C', 'Arôme naturel', 'Stevia bio'],
  combo: ['Smoothie 500ml au choix', 'Gaufre healthy + 2 toppings', 'Économise 1,90€'],
};

function ProductModal({ palette, product, onClose, onAdd }) {
  const [size, setSize] = useState('m');
  const [extras, setExtras] = useState([]);
  const isCombo = product.shape === 'combo';
  const isDrink = product.cat === 'drink';
  const sizeBump = SIZES.find(s => s.id === size)?.delta || 0;
  const price = (product.price + sizeBump).toFixed(2).replace('.', ',');
  const toggle = (t) => setExtras(e => e.includes(t) ? e.filter(x => x !== t) : [...e, t]);
  const ingredients = isCombo ? INGREDIENTS.combo : isDrink ? INGREDIENTS.drink : INGREDIENTS.default;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: palette.bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Hero */}
      <div style={{
        height: 360, flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${product.hue1}, ${product.hue2}66 70%, ${palette.bg})`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${product.hue1}88, transparent 65%)`,
        }}/>
        <div style={{
          position: 'absolute', top: 14, left: 16, right: 16,
          display: 'flex', justifyContent: 'space-between', zIndex: 2,
        }}>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{I.close('#fff')}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {product.badge && (
              <div style={{
                padding: '6px 12px', borderRadius: 999,
                background: palette.accent, color: palette.ctaText,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em',
              }}>{product.badge}</div>
            )}
            <button style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(12px)', border: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>♡</button>
          </div>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        }}>
          <div style={{ transform: 'scale(2.1) translateY(8px)' }}>
            <DrinkPackshot product={product} size={150} palette={palette}/>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: palette.text, letterSpacing: '-.02em', lineHeight: 1.12 }}>{product.name}</div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 6 }}>{product.sub}</div>
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, color: palette.text, whiteSpace: 'nowrap', paddingTop: 2 }}>{price}€</div>
        </div>

        {/* Macros */}
        {!isCombo && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {product.kcal !== undefined && <MacroChip palette={palette} label="kcal" value={product.kcal}/>}
            {product.prot > 0 && <MacroChip palette={palette} label="protéines" value={`${product.prot}g`} accent/>}
            {isDrink && <MacroChip palette={palette} label="sucre" value="0g"/>}
            {isDrink && <MacroChip palette={palette} label="vitamines" value="6"/>}
          </div>
        )}

        {/* Description */}
        <div style={{ marginTop: 22, fontSize: 14, lineHeight: 1.55, color: palette.text }}>
          {isCombo
            ? "Compose ton combo signature : un smoothie XXL au choix avec ta gaufre healthy garnie de deux toppings. Économise 1,90€ vs. à la carte."
            : isDrink
              ? "Boisson énergisante zéro sucre, formulée avec électrolytes et vitamines. 20 kcal seulement, pour s'hydrater sans culpabilité — avant, pendant ou après le sport."
              : "Notre shake protéiné gourmand : whey isolate, lait d'amande bio, et les vrais ingrédients d'un Bueno. 24g de protéines, 250 kcal. Parfait après séance ou en goûter."}
        </div>

        {/* Ingredients */}
        <div style={{ marginTop: 20 }}>
          <SectionLabel palette={palette}>{isCombo ? 'Inclus' : 'Ingrédients'}</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {ingredients.map(i => (
              <div key={i} style={{
                padding: '6px 10px', borderRadius: 999,
                background: palette.card, border: `1px solid ${palette.line}`,
                fontSize: 12, color: palette.text,
              }}>{i}</div>
            ))}
          </div>
        </div>

        {/* Size selector (drinks only) */}
        {isDrink && (
          <div style={{ marginTop: 22 }}>
            <SectionLabel palette={palette}>Format</SectionLabel>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {SIZES.map(s => {
                const on = s.id === size;
                return (
                  <button key={s.id} onClick={() => setSize(s.id)} style={{
                    flex: 1, padding: '12px 14px', borderRadius: 14,
                    background: on ? palette.cardHi : palette.card,
                    border: `1.5px solid ${on ? palette.primary : palette.line}`,
                    color: palette.text, cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{s.vol}{s.delta > 0 ? ` · +${s.delta.toFixed(2).replace('.', ',')}€` : ''}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toppings (combo / gaufre) */}
        {isCombo && (
          <div style={{ marginTop: 22 }}>
            <SectionLabel palette={palette}>Toppings <span style={{ color: palette.textDim, fontWeight: 500 }}>(choisis-en 2)</span></SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {TOPPINGS.map(t => {
                const on = extras.includes(t);
                return (
                  <button key={t} onClick={() => toggle(t)} style={{
                    padding: '9px 14px', borderRadius: 999,
                    background: on ? palette.primary : palette.card,
                    color: on ? palette.bg : palette.text,
                    border: `1.5px solid ${on ? palette.primary : palette.line}`,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>{on ? '✓ ' : '+ '}{t}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Upsell combo (when smoothie selected) */}
        {!isCombo && product.cat === 'smoothie' && (
          <div style={{
            marginTop: 22, padding: 14, borderRadius: 16,
            background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
            border: `1px dashed ${palette.primary}66`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: palette.accent, color: palette.ctaText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Outfit', fontWeight: 900, fontSize: 18,
            }}>−1,90€</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text }}>Passe en Combo Power</div>
              <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>+ gaufre healthy pour 7€ de plus</div>
            </div>
            <button style={{
              padding: '8px 12px', borderRadius: 999,
              background: palette.primary, color: palette.bg, border: 0,
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}>Ajouter</button>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 51,
        padding: '14px 20px 28px',
        background: `linear-gradient(0deg, ${palette.bg} 60%, ${palette.bg}00)`,
      }}>
        <button onClick={(e) => onAdd(product, e.currentTarget)} style={{
          width: '100%', padding: '16px 20px', borderRadius: 16,
          background: palette.cta, color: palette.ctaText, border: 0, cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: `0 8px 32px ${palette.cta}55`,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>Ajouter au panier</span>
          <span style={{ whiteSpace: 'nowrap' }}>{price} €</span>
        </button>
      </div>
    </div>
  );
}

function MacroChip({ palette, label, value, accent }) {
  return (
    <div style={{
      flex: 1, padding: '10px 8px', borderRadius: 12,
      background: palette.card, border: `1px solid ${palette.line}`,
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: accent ? palette.primary : palette.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: palette.textDim, marginTop: 3, letterSpacing: '.03em' }}>{label}</div>
    </div>
  );
}

function SectionLabel({ palette, children }) {
  return <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: palette.text, letterSpacing: '.04em', textTransform: 'uppercase' }}>{children}</div>;
}

// ── Cart Screen ─────────────────────────────────────────────────
function CartScreen({ palette, cart, setCart, onClose, addToCart, allProducts, onCheckout }) {
  const [name, setName] = useState('Léa');
  const [time, setTime] = useState('Dès que prêt');
  const total = cart.reduce((s, x) => s + x.product.price * x.qty, 0);
  const inc = (id) => setCart(c => c.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x));
  const dec = (id) => setCart(c => c.flatMap(x => x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x]));

  const quickAdds = useMemo(() => {
    const ids = new Set(cart.map(x => x.product.id));
    return [...PRODUCTS.popular, ...PRODUCTS.hot, ...PRODUCTS.drinks]
      .filter(p => !ids.has(p.id))
      .slice(0, 4);
  }, [cart]);

  const times = ['Dès que prêt', 'Dans 15 min', 'Dans 30 min', 'Choisir l\'heure'];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: palette.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '14px 16px',
        background: `linear-gradient(180deg, ${palette.bg} 80%, ${palette.bg}00)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12,
          background: palette.card, border: `1px solid ${palette.line}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>{I.close(palette.text)}</button>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, color: palette.text, letterSpacing: '-.02em', lineHeight: 1 }}>Ton panier</div>
          <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>Retrait · 11 rue Saint Pierre, Verdun</div>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 140px' }}>
        {cart.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', color: palette.textDim,
            background: palette.card, borderRadius: 18, border: `1px solid ${palette.line}`, marginTop: 8,
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🥤</div>
            <div style={{ color: palette.text, fontWeight: 700 }}>Ton panier est vide</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ajoute un shake pour commencer</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map(line => (
              <div key={line.id} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: 12, background: palette.card,
                border: `1px solid ${palette.line}`, borderRadius: 16,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 12, flexShrink: 0,
                  background: `radial-gradient(circle at 50% 60%, ${line.product.hue1}44, transparent 70%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <DrinkPackshot product={line.product} size={70} palette={palette}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text, lineHeight: 1.15 }}>{line.product.name}</div>
                  <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.product.sub}</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14, color: palette.text, marginTop: 4 }}>
                    {(line.product.price * line.qty).toFixed(2).replace('.', ',')}€
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => dec(line.id)} style={qtyBtnStyle(palette)}>{I.minus(palette.text)}</button>
                  <div style={{ width: 22, textAlign: 'center', fontWeight: 800, color: palette.text, fontVariantNumeric: 'tabular-nums' }}>{line.qty}</div>
                  <button onClick={() => inc(line.id)} style={qtyBtnStyle(palette, true)}>{I.plus(palette.ctaText)}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick-adds */}
        {quickAdds.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <SectionLabel palette={palette}>On y ajoute…</SectionLabel>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0 4px', scrollbarWidth: 'none' }} className="no-scrollbar">
              {quickAdds.map(p => (
                <div key={p.id} style={{
                  width: 130, flexShrink: 0,
                  background: palette.card, borderRadius: 14,
                  border: `1px solid ${palette.line}`,
                  padding: 10,
                }}>
                  <div style={{
                    height: 70,
                    background: `radial-gradient(circle at 50% 60%, ${p.hue1}33, transparent 70%)`,
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DrinkPackshot product={p} size={75} palette={palette}/>
                  </div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, color: palette.text, marginTop: 8, lineHeight: 1.2 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: palette.text }}>{p.price.toFixed(2).replace('.', ',')}€</div>
                    <button onClick={(e) => addToCart(p, e.currentTarget)} style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: palette.cta, color: palette.ctaText, border: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{I.plus(palette.ctaText)}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pickup details */}
        {cart.length > 0 && (
          <>
            <div style={{ marginTop: 22 }}>
              <SectionLabel palette={palette}>Ton prénom</SectionLabel>
              <input value={name} onChange={e => setName(e.target.value)} style={{
                marginTop: 8, width: '100%', padding: '14px 14px', borderRadius: 14,
                background: palette.card, border: `1px solid ${palette.line}`,
                color: palette.text, fontSize: 15, fontWeight: 600,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}/>
            </div>
            <div style={{ marginTop: 18 }}>
              <SectionLabel palette={palette}>Heure de retrait</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {times.map(t => {
                  const on = t === time;
                  return (
                    <button key={t} onClick={() => setTime(t)} style={{
                      padding: '10px 14px', borderRadius: 999,
                      background: on ? palette.primary : palette.card,
                      color: on ? palette.bg : palette.text,
                      border: `1.5px solid ${on ? palette.primary : palette.line}`,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>{t}</button>
                  );
                })}
              </div>
            </div>
            <div style={{
              marginTop: 18, padding: 14, borderRadius: 14,
              background: palette.card, border: `1px solid ${palette.line}`,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <Row palette={palette} a="Sous-total" b={`${total.toFixed(2).replace('.', ',')}€`}/>
              <Row palette={palette} a="Retrait sur place" b="Gratuit" dim/>
              <Row palette={palette} a="Prêt dans" b="≈ 5-10 min" dim/>
              <div style={{ height: 1, background: palette.line, margin: '6px 0' }}/>
              <Row palette={palette} a="Total" b={`${total.toFixed(2).replace('.', ',')}€`} bold/>
            </div>
          </>
        )}
      </div>

      {/* Sticky checkout */}
      {cart.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: '14px 16px 28px',
          background: `linear-gradient(0deg, ${palette.bg} 70%, ${palette.bg}00)`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <button onClick={() => onCheckout && onCheckout({ name, time })} style={{
            padding: '15px 18px', borderRadius: 16,
            background: palette.cta, color: palette.ctaText, border: 0, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 8px 28px ${palette.cta}55`, whiteSpace: 'nowrap',
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>Payer · Square</span>
            <span style={{ whiteSpace: 'nowrap' }}>{total.toFixed(2).replace('.', ',')} €</span>
          </button>
          <button style={{
            padding: '13px 18px', borderRadius: 16,
            background: 'transparent', color: palette.text,
            border: `1.5px solid ${palette.line}`, cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {I.whatsapp('#25D366')}
            Commander par WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ palette, a, b, dim, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: bold ? 16 : 13,
      color: dim ? palette.textDim : palette.text,
      fontWeight: bold ? 900 : 600,
      fontFamily: bold ? 'Outfit, sans-serif' : 'inherit',
    }}>
      <span>{a}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{b}</span>
    </div>
  );
}

function qtyBtnStyle(palette, primary) {
  return {
    width: 30, height: 30, borderRadius: '50%',
    background: primary ? palette.cta : 'transparent',
    color: primary ? palette.ctaText : palette.text,
    border: primary ? 0 : `1px solid ${palette.line}`,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

Object.assign(window, { ProductModal, CartScreen, SectionLabel });
