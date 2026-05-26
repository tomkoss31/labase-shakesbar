// mascotte.jsx — "Le Petit Shaker" mascot component
// A drop-shaped character that reacts to XP level

function Mascotte({ palette, mood = 'wave', size = 60, level = 'apprenti' }) {
  // mood: idle, wave, wink, happy, sleep
  // level: apprenti (clear/light), regulier (teal/glow), pro (gold/sparkle)
  const fillByLevel = {
    apprenti: { body: '#e5f7f4', stroke: palette.primary, eye: '#0a0a0a', accent: palette.primary },
    regulier: { body: palette.primary, stroke: palette.primary, eye: '#fff', accent: palette.glow1 },
    pro: { body: palette.accent, stroke: palette.accent, eye: '#1a0500', accent: '#fde047' },
  };
  const c = fillByLevel[level] || fillByLevel.apprenti;
  const eyeY = mood === 'sleep' ? 50 : 48;
  const sparkle = level === 'pro';

  return (
    <div style={{ width: size, height: size * 1.15, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 80 92" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <radialGradient id={`mg-${level}`} cx=".4" cy=".35" r=".6">
            <stop offset="0%" stopColor="rgba(255,255,255,.5)"/>
            <stop offset="60%" stopColor="rgba(255,255,255,.0)"/>
          </radialGradient>
        </defs>
        {/* Soft shadow */}
        <ellipse cx="40" cy="88" rx="18" ry="3" fill="rgba(0,0,0,.25)"/>
        {/* Body (water-drop shape) */}
        <path d="M40 8 C 22 28, 12 46, 12 60 C 12 75, 25 86, 40 86 C 55 86, 68 75, 68 60 C 68 46, 58 28, 40 8 Z"
          fill={c.body}
          stroke={c.stroke} strokeWidth="2"
          style={{
            transformOrigin: '40px 60px',
            animation: mood === 'wave' ? 'mascotteBob 2.2s ease-in-out infinite' : 'none',
          }}/>
        {/* Highlight */}
        <path d="M40 8 C 22 28, 12 46, 12 60 C 12 75, 25 86, 40 86 C 55 86, 68 75, 68 60 C 68 46, 58 28, 40 8 Z"
          fill={`url(#mg-${level})`}/>
        {/* Eyes */}
        {mood === 'sleep' ? (
          <g stroke={c.eye} strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M28 50 Q31 53 34 50"/>
            <path d="M46 50 Q49 53 52 50"/>
          </g>
        ) : mood === 'wink' ? (
          <g fill={c.eye}>
            <circle cx="31" cy={eyeY} r="3"/>
            <path d="M46 50 Q49 53 52 50" stroke={c.eye} strokeWidth="2" strokeLinecap="round" fill="none"/>
          </g>
        ) : (
          <g fill={c.eye}>
            <circle cx="31" cy={eyeY} r="3"/>
            <circle cx="49" cy={eyeY} r="3"/>
          </g>
        )}
        {/* Mouth */}
        {mood === 'happy' ? (
          <path d="M30 60 Q40 70 50 60" stroke={c.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : mood === 'sleep' ? (
          <path d="M36 62 Q40 64 44 62" stroke={c.eye} strokeWidth="2" fill="none" strokeLinecap="round"/>
        ) : (
          <path d="M32 60 Q40 66 48 60" stroke={c.eye} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        )}
        {/* Cheeks (regulier/pro) */}
        {level !== 'apprenti' && (
          <g opacity=".5">
            <circle cx="24" cy="58" r="3" fill={c.accent}/>
            <circle cx="56" cy="58" r="3" fill={c.accent}/>
          </g>
        )}
        {/* Pro sparkles */}
        {sparkle && (
          <g fill="#fde047" style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}>
            <path d="M70 18 l1 4 4 1 -4 1 -1 4 -1 -4 -4 -1 4 -1 z"/>
            <path d="M10 36 l.7 2.5 2.5 .7 -2.5 .7 -.7 2.5 -.7 -2.5 -2.5 -.7 2.5 -.7 z"/>
          </g>
        )}
        {/* Wave hand */}
        {mood === 'wave' && (
          <g style={{ transformOrigin: '64px 56px', animation: 'mascotteWave 1.4s ease-in-out infinite' }}>
            <ellipse cx="66" cy="56" rx="6" ry="7" fill={c.body} stroke={c.stroke} strokeWidth="2"/>
          </g>
        )}
      </svg>
      <style>{`
        @keyframes mascotteBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes mascotteWave { 0%,100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }
        @keyframes sparkle { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.2); } }
      `}</style>
    </div>
  );
}

window.Mascotte = Mascotte;
