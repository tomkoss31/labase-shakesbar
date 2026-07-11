// Hero carousel rotatif — 3 slides qui s'enchaînent toutes les 4.5s
import React, { useEffect, useState } from 'react';
import type { Palette } from './palette';
import { V2_HERO_SLIDES, type V2HeroSlide } from './products-adapter';
import { ProductImage } from './ProductImage';
import { IconArrow, IconStar } from './icons';

interface HeroCarouselProps {
  palette: Palette;
  onSlideClick?: (slide: V2HeroSlide) => void;
}

export function HeroCarousel({ palette, onSlideClick }: HeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const slides = V2_HERO_SLIDES;

  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), 4500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const s = slides[idx];
  const heroImage = s.product?.image ?? s.combo?.image;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div
        onClick={() => onSlideClick?.(s)}
        className="v2-hero-banner"
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2} 50%, ${palette.accent})`,
          cursor: onSlideClick ? 'pointer' : 'default',
        }}
      >
        {/* shadow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 80% 20%, rgba(0,0,0,0), rgba(0,0,0,.55) 80%)`,
          }}
        />

        {/* product visual */}
        {heroImage && s.type !== 'review' && (
          <div
            style={{
              position: 'absolute',
              right: -10,
              top: 10,
              width: 210,
              height: 210,
              transform: 'rotate(8deg)',
              opacity: 0.95,
            }}
          >
            <ProductImage src={heroImage} alt={s.title} palette={palette} />
          </div>
        )}

        {s.type === 'review' && (
          <div
            style={{
              position: 'absolute',
              right: 24,
              top: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 64,
                color: '#fff',
                lineHeight: 1,
              }}
            >
              4,9
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <IconStar key={i} color="#fde047" size={14} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, opacity: 0.9 }}>Note Google</div>
          </div>
        )}

        {/* content bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(0,0,0,.55)',
              backdropFilter: 'blur(8px)',
              fontSize: 11,
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,.18)',
            }}
          >
            {s.tag}
          </div>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 28,
              color: '#fff',
              lineHeight: 1.08,
              marginTop: 10,
              letterSpacing: '-.02em',
              maxWidth: '70%',
            }}
          >
            {s.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', marginTop: 6, maxWidth: '60%' }}>{s.sub}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              {s.price && (
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff' }}>
                  {s.price}
                </div>
              )}
              {s.strike && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'line-through' }}>
                  {s.strike}
                </div>
              )}
              {s.save && (
                <div
                  style={{
                    background: palette.bg,
                    color: palette.accent,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  {s.save}
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSlideClick?.(s);
              }}
              style={{
                padding: '9px 14px',
                borderRadius: 999,
                background: '#fff',
                color: palette.bg,
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {s.cta}
              <IconArrow color={palette.bg} />
            </button>
          </div>
        </div>

        {/* dots top-left */}
        <div style={{ position: 'absolute', top: 14, left: 18, display: 'flex', gap: 5 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === idx ? '#fff' : 'rgba(255,255,255,.4)',
                transition: 'all .35s',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        /* Hero moins imposant sur mobile (les produits remontent), un peu plus
           haut sur desktop où il partage la ligne avec la colonne XP. */
        .v2-hero-banner { height: 216px; }
        @media (min-width: 960px) { .v2-hero-banner { height: 256px; } }
      `}</style>
    </div>
  );
}
