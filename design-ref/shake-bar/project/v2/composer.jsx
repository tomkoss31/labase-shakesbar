// composer.jsx — Guided combo composer (multi-step)

const SMOOTHIE_CHOICES = [
  { id: 'p1', name: 'Choco Buenos', sub: '24g prot · 250 kcal', hue1: '#92400e', hue2: '#451a03' },
  { id: 's1', name: 'M&M Crunch', sub: '24g prot · 250 kcal', hue1: '#dc2626', hue2: '#7f1d1d' },
  { id: 's3', name: 'Vanilla Latte', sub: '24g prot · 240 kcal', hue1: '#eab308', hue2: '#713f12' },
  { id: 's4', name: 'Caramel Salé', sub: '23g prot · 260 kcal', hue1: '#d97706', hue2: '#451a03' },
];

const GAUFRE_TOPPINGS = [
  { id: 'banane', name: 'Banane fraîche', emoji: '🍌' },
  { id: 'fruits', name: 'Fruits rouges', emoji: '🍓' },
  { id: 'peanut', name: 'Beurre cacahuète', emoji: '🥜' },
  { id: 'granola', name: 'Granola maison', emoji: '🌾' },
  { id: 'choco', name: 'Pépites choco', emoji: '🍫' },
  { id: 'miel', name: 'Miel d\'acacia', emoji: '🍯' },
];

function ComboComposer({ palette, combo, onClose, onAdd }) {
  const [step, setStep] = useState(0);
  const [smoothie, setSmoothie] = useState(null);
  const [toppings, setToppings] = useState([]);

  const steps = ['Smoothie', 'Toppings', 'Récap'];
  const canNext = (step === 0 && smoothie) || (step === 1 && toppings.length === 2) || step === 2;

  const toggleTopping = (id) => {
    setToppings(t => {
      if (t.includes(id)) return t.filter(x => x !== id);
      if (t.length >= 2) return [t[1], id]; // replace oldest
      return [...t, id];
    });
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      onAdd({ ...combo, smoothie, toppings }, null);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: palette.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={step > 0 ? () => setStep(step - 1) : onClose} style={{
            width: 38, height: 38, borderRadius: 12,
            background: palette.card, border: `1px solid ${palette.line}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            color: palette.text,
          }}>{step > 0
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            : I.close(palette.text)
          }</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: palette.primary, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Compose ton combo</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, color: palette.text, letterSpacing: '-.02em', lineHeight: 1 }}>{combo.name}</div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: palette.accent, color: palette.ctaText,
            fontSize: 12, fontWeight: 800,
          }}>−{combo.save.toFixed(2).replace('.', ',')}€</div>
        </div>
        {/* Stepper */}
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{
                height: 4, borderRadius: 999,
                background: i <= step
                  ? `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2})`
                  : 'rgba(255,255,255,.08)',
                boxShadow: i <= step ? `0 0 8px ${palette.primary}66` : 'none',
              }}/>
              <div style={{
                fontSize: 11, fontWeight: i === step ? 800 : 600,
                color: i <= step ? palette.text : palette.textDim,
                letterSpacing: '.02em',
              }}>{i + 1}. {s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 140px' }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 14 }}>Choisis ton shake protéiné — inclus dans le combo, format 500ml.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SMOOTHIE_CHOICES.map(s => {
                const on = smoothie?.id === s.id;
                return (
                  <div key={s.id} onClick={() => setSmoothie(s)} style={{
                    background: on ? palette.cardHi : palette.card,
                    border: `1.5px solid ${on ? palette.primary : palette.line}`,
                    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                    position: 'relative',
                  }}>
                    <div style={{
                      height: 100,
                      background: `radial-gradient(circle at 50% 60%, ${s.hue1}55, transparent 70%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <DrinkPackshot product={{ id: 'sm-' + s.id, ...s, shape: 'cup' }} size={95} palette={palette}/>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: palette.text }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{s.sub}</div>
                    </div>
                    {on && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 22, height: 22, borderRadius: '50%',
                        background: palette.primary, color: palette.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 13,
                      }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 14 }}>
              Choisis 2 toppings pour ta gaufre healthy. <span style={{ color: palette.text, fontWeight: 700 }}>{toppings.length}/2 sélectionnés</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GAUFRE_TOPPINGS.map(t => {
                const on = toppings.includes(t.id);
                const idx = toppings.indexOf(t.id);
                return (
                  <button key={t.id} onClick={() => toggleTopping(t.id)} style={{
                    background: on ? palette.cardHi : palette.card,
                    border: `1.5px solid ${on ? palette.primary : palette.line}`,
                    borderRadius: 14, padding: 14,
                    cursor: 'pointer', textAlign: 'left',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 26 }}>{t.emoji}</span>
                    <span style={{ flex: 1, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: palette.text }}>{t.name}</span>
                    {on && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: palette.primary, color: palette.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 12,
                      }}>{idx + 1}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 14 }}>Ton combo, prêt à être ajouté au panier.</div>
            <div style={{
              padding: 16, background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
              border: `1px solid ${palette.line}`, borderRadius: 18,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <RecapRow palette={palette} label="Combo" value={combo.name} icon="🎯"/>
              <RecapRow palette={palette} label="Smoothie 500ml" value={smoothie?.name || '—'} icon="🥤"/>
              <RecapRow palette={palette} label="Gaufre healthy" value="Inclus" icon="🧇"/>
              <RecapRow palette={palette} label="Toppings"
                value={toppings.map(id => GAUFRE_TOPPINGS.find(t => t.id === id)?.name).join(' · ')}
                icon="✨"/>
              <div style={{ height: 1, background: palette.line }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 13, color: palette.textDim }}>Économie</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.accent }}>−{combo.save.toFixed(2).replace('.', ',')}€ vs. à la carte</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: palette.text }}>Total</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, color: palette.text }}>{combo.price.toFixed(2).replace('.', ',')}€</div>
              </div>
            </div>
            {/* XP gain teaser */}
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 12,
              background: `${palette.primary}15`, border: `1px dashed ${palette.primary}66`,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 12, color: palette.text,
            }}>
              <div style={{ fontSize: 18 }}>⚡</div>
              <span><b>+15 XP</b> après ta commande · plus que <b>60 XP</b> avant Régulier</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 16px 28px',
        background: `linear-gradient(0deg, ${palette.bg} 70%, ${palette.bg}00)`,
      }}>
        <button onClick={canNext ? next : null} disabled={!canNext} style={{
          width: '100%', padding: '16px 20px', borderRadius: 16,
          background: canNext ? palette.cta : palette.card,
          color: canNext ? palette.ctaText : palette.textDim,
          border: 0, cursor: canNext ? 'pointer' : 'not-allowed',
          fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: canNext ? `0 8px 28px ${palette.cta}55` : 'none',
          whiteSpace: 'nowrap',
          opacity: canNext ? 1 : .7,
        }}>
          <span>{step === 0 ? 'Suite — Toppings' : step === 1 ? 'Suite — Récap' : 'Ajouter — ' + combo.price.toFixed(2).replace('.', ',') + ' €'}</span>
          {step < 2 && <span>{I.arrow(canNext ? palette.ctaText : palette.textDim)}</span>}
        </button>
      </div>
    </div>
  );
}

function RecapRow({ palette, label, value, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(0,0,0,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: palette.textDim, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: palette.text, fontWeight: 700, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}

window.ComboComposer = ComboComposer;
