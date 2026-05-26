// drink.jsx — packshot drink renderer (SVG-based, simulates transparent product photo)
// Shapes: cup (smoothie gobelet), tall (energy bouteille), mug (café), combo (deux objets)

function DrinkPackshot({ product, size = 130, palette }) {
  const { shape, hue1, hue2, name } = product;
  // Halo behind product
  const halo = (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(circle at 50% 60%, ${hue1}55, ${hue1}00 60%), radial-gradient(circle at 50% 40%, ${hue2}88, transparent 65%)`,
      filter: 'blur(8px)',
    }}/>
  );

  let svg = null;
  if (shape === 'cup') {
    // Smoothie clear cup with rounded lid + straw
    svg = (
      <svg viewBox="0 0 100 130" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id={`g-${product.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue1}/>
            <stop offset="100%" stopColor={hue2}/>
          </linearGradient>
          <linearGradient id={`gl-${product.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,.5)"/>
            <stop offset="40%" stopColor="rgba(255,255,255,.05)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,.0)"/>
          </linearGradient>
        </defs>
        {/* Straw */}
        <rect x="58" y="6" width="6" height="35" rx="2" fill="#0a0a0a" opacity=".85"/>
        <rect x="58" y="6" width="2" height="35" rx="1" fill="rgba(255,255,255,.25)"/>
        {/* Lid dome */}
        <path d="M22 38 Q22 24 50 24 Q78 24 78 38 L78 44 L22 44 Z" fill="#1a1a1a"/>
        <ellipse cx="50" cy="38" rx="28" ry="5" fill="#2a2a2a"/>
        {/* Cup body */}
        <path d="M24 46 L76 46 L72 122 Q72 126 68 126 L32 126 Q28 126 28 122 Z"
              fill={`url(#g-${product.id})`}/>
        {/* highlight */}
        <path d="M26 48 L34 48 L32 122 L28 122 Z" fill={`url(#gl-${product.id})`} opacity=".7"/>
        {/* label band */}
        <rect x="30" y="78" width="40" height="22" rx="2" fill="rgba(0,0,0,.45)"/>
        <text x="50" y="92" textAnchor="middle" fill={palette.text} style={{ font: '700 7px ui-sans-serif' }}>LA BASE</text>
      </svg>
    );
  } else if (shape === 'tall') {
    // Energy tall bottle
    svg = (
      <svg viewBox="0 0 100 130" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id={`g-${product.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue1}/>
            <stop offset="100%" stopColor={hue2}/>
          </linearGradient>
          <linearGradient id={`gl-${product.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,.55)"/>
            <stop offset="40%" stopColor="rgba(255,255,255,.05)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,.0)"/>
          </linearGradient>
        </defs>
        {/* Cap */}
        <rect x="38" y="8" width="24" height="14" rx="3" fill="#111"/>
        <rect x="40" y="10" width="20" height="2" fill="#333"/>
        {/* Neck */}
        <path d="M40 22 L60 22 L58 32 L42 32 Z" fill="#1a1a1a"/>
        {/* Body */}
        <path d="M28 34 L72 34 L72 122 Q72 126 68 126 L32 126 Q28 126 28 122 Z"
              fill={`url(#g-${product.id})`}/>
        {/* highlight */}
        <path d="M30 36 L36 36 L34 122 L30 122 Z" fill={`url(#gl-${product.id})`} opacity=".7"/>
        {/* big label */}
        <rect x="30" y="56" width="40" height="48" rx="3" fill="rgba(0,0,0,.5)"/>
        <text x="50" y="74" textAnchor="middle" fill={palette.text} style={{ font: '900 9px ui-sans-serif' }}>LA</text>
        <text x="50" y="86" textAnchor="middle" fill={palette.text} style={{ font: '900 9px ui-sans-serif' }}>BASE</text>
        <line x1="36" y1="91" x2="64" y2="91" stroke={hue1} strokeWidth="1.5"/>
        <text x="50" y="100" textAnchor="middle" fill={palette.textDim} style={{ font: '600 5px ui-sans-serif' }}>ENERGY</text>
      </svg>
    );
  } else if (shape === 'mug') {
    // Coffee mug
    svg = (
      <svg viewBox="0 0 100 130" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id={`g-${product.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue1}/>
            <stop offset="100%" stopColor={hue2}/>
          </linearGradient>
        </defs>
        {/* Handle */}
        <path d="M70 70 Q92 70 92 90 Q92 110 70 110" fill="none" stroke="#fafafa" strokeWidth="6"/>
        {/* Mug */}
        <path d="M22 50 L72 50 L70 118 Q70 122 66 122 L28 122 Q24 122 24 118 Z" fill="#fafafa"/>
        {/* liquid top */}
        <ellipse cx="47" cy="52" rx="24" ry="6" fill={`url(#g-${product.id})`}/>
        {/* steam */}
        <path d="M36 30 Q40 22 36 14" stroke={palette.textDim} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7"/>
        <path d="M48 30 Q44 22 48 14" stroke={palette.textDim} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7"/>
        <path d="M60 30 Q64 22 60 14" stroke={palette.textDim} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7"/>
      </svg>
    );
  } else if (shape === 'combo') {
    // Two stacked
    svg = (
      <svg viewBox="0 0 100 130" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id={`g-${product.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue1}/>
            <stop offset="100%" stopColor={hue2}/>
          </linearGradient>
        </defs>
        {/* Left smoothie */}
        <g transform="translate(-12,5)">
          <rect x="50" y="6" width="5" height="28" rx="2" fill="#111"/>
          <path d="M18 36 Q18 24 42 24 Q66 24 66 36 L66 40 L18 40 Z" fill="#1a1a1a"/>
          <path d="M20 42 L64 42 L60 116 Q60 120 56 120 L28 120 Q24 120 24 116 Z" fill={`url(#g-${product.id})`}/>
          <rect x="26" y="74" width="32" height="18" rx="2" fill="rgba(0,0,0,.45)"/>
        </g>
        {/* Right gaufre or coffee */}
        <g transform="translate(40,30)">
          <rect x="14" y="6" width="44" height="44" rx="6" fill="#d97706"/>
          <pattern id={`wp-${product.id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#d97706"/>
            <rect x="0" y="0" width="3" height="3" fill="#92400e"/>
            <rect x="3" y="3" width="3" height="3" fill="#92400e"/>
          </pattern>
          <rect x="14" y="6" width="44" height="44" rx="6" fill={`url(#wp-${product.id})`}/>
          {/* berries */}
          <circle cx="26" cy="20" r="4" fill="#dc2626"/>
          <circle cx="42" cy="28" r="4" fill="#7c3aed"/>
          <circle cx="34" cy="38" r="3" fill="#dc2626"/>
        </g>
      </svg>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {halo}
      {svg}
    </div>
  );
}

window.DrinkPackshot = DrinkPackshot;
