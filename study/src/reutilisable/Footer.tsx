import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { useTheme } from './Themecontext';

const NAV_LINKS = [
  { label: 'Cours', to: '/dashboard' },
  { label: 'Communauté', to: '/progression' },
  { label: 'Blog', to: '#' },
  { label: 'À propos', to: '/description' },
] as const;

const LEGAL_LINKS = [
  { label: 'Confidentialité', to: '#' },
  { label: 'Conditions', to: '#' },
  { label: 'Contact', to: '#' },
] as const;

export default function Footer() {
  const { dark, T } = useTheme();

  const footerBg = dark
    ? `linear-gradient(165deg, ${T.card} 0%, ${T.bg} 55%, #040608 100%)`
    : `linear-gradient(165deg, ${T.card} 0%, ${T.bg} 45%, #b8d4ef 100%)`;

  const glow = dark
    ? `radial-gradient(ellipse 70% 50% at 50% 20%, ${T.accent}33 0%, transparent 55%)`
    : `radial-gradient(ellipse 65% 45% at 50% 15%, ${T.accent}28 0%, transparent 50%)`;

  const surfaceMuted = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,31,63,0.06)';
  const divider = dark ? 'rgba(255,255,255,0.08)' : T.border;
  const linkIdle = T.textOnCardMuted;
  const dot3 = dark ? '#4aa8ff' : T.cardAlt;

  return (
    <footer
      style={{
        marginTop: 56,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '32px 32px 0 0',
        color: T.textOnCard,
        background: footerBg,
        borderTop: `1px solid ${T.border}`,
        boxShadow: dark ? '0 -24px 80px rgba(0,0,0,0.35)' : '0 -12px 48px rgba(11,42,74,0.06)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: glow,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, transparent 100%)',
          filter: 'blur(12px)',
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      />

      <style>{`
        .footer-grid {
          display: grid;
          gap: 40px;
          align-items: center;
          max-width: 1180px;
          margin: 0 auto;
          padding: 48px 28px 36px;
          position: relative;
          z-index: 1;
          grid-template-columns: 1fr;
        }
        @media (min-width: 960px) {
          .footer-grid {
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.55fr) minmax(0, 1fr);
            gap: 32px 48px;
            padding: 52px 40px 40px;
          }
        }
        .footer-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .footer-cta-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }
        .footer-ghost-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 15px;
          border: 1px solid ${T.border};
          background: ${surfaceMuted};
          color: ${T.textOnCard};
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .footer-ghost-btn:hover {
          background: ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,31,63,0.08)'};
          border-color: ${T.accent};
        }
        .footer-col-link {
          color: ${T.textOnCard};
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          opacity: 0.92;
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .footer-col-link:hover {
          color: ${T.accent};
          opacity: 1;
        }
        .footer-social {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          color: ${T.textOnCard};
          background: ${surfaceMuted};
          border: 1px solid ${divider};
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .footer-social:hover {
          background: ${T.accent};
          color: ${T.saveBtnText};
          border-color: transparent;
        }
        @keyframes footer-float {
          0%, 100% { transform: rotate(-7deg) translateY(0); }
          50% { transform: rotate(-7deg) translateY(-8px); }
        }
        .footer-icon-card {
          animation: footer-float 5s ease-in-out infinite;
        }
      `}</style>

      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accentSoft }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot3 }} />
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(1.55rem, 2.5vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: T.text,
            }}
          >
            Prêt à commencer ?
          </h2>
          <p
            style={{
              margin: '14px 0 26px',
              maxWidth: 400,
              fontSize: 15,
              lineHeight: 1.65,
              color: linkIdle,
            }}
          >
            Rejoignez des milliers d’étudiants qui transforment leur avenir avec GeniLocal et l’IA au service de vos révisions.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link
              to="/raisonnement"
              className="footer-cta-btn"
              style={{
                background: T.saveBtnGrad,
                color: T.saveBtnText,
                boxShadow: dark ? '0 12px 32px rgba(0,212,224,0.25)' : '0 10px 28px rgba(0,140,148,0.22)',
              }}
            >
              Commencer gratuitement
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <Link to="/description" className="footer-ghost-btn">
              En savoir plus
            </Link>
          </div>
        </div>

        <div
          className="footer-icon-card"
          style={{
            justifySelf: 'center',
            width: 112,
            height: 112,
            borderRadius: 28,
            background: '#ffffff',
            border: `1px solid ${dark ? 'rgba(0,212,224,0.2)' : 'rgba(0,31,63,0.1)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: dark
              ? '0 20px 50px rgba(0,0,0,0.35)'
              : '0 16px 40px rgba(11,42,74,0.12)',
            padding: 14,
            boxSizing: 'border-box',
          }}
        >
          <img
            src="/assets/logoo_genilocal.png"
            alt="GeniLocal"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 28,
            alignContent: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: linkIdle,
                marginBottom: 14,
              }}
            >
              Navigation
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {NAV_LINKS.map(({ label, to }) =>
                to === '#' ? (
                  <a key={label} href="#" className="footer-col-link">
                    {label}
                  </a>
                ) : (
                  <Link key={label} to={to} className="footer-col-link">
                    {label}
                  </Link>
                ),
              )}
            </nav>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: linkIdle,
                marginBottom: 14,
              }}
            >
              Légal
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {LEGAL_LINKS.map(({ label, to }) => (
                <a key={label} href={to} className="footer-col-link">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 28px 28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            height: 1,
            background: divider,
            opacity: dark ? 1 : 0.85,
            marginBottom: 20,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 13, color: linkIdle }}>
            © 2026 GeniLocal ✨
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="#" className="footer-social" aria-label="Twitter">
              T
            </a>
            <a href="#" className="footer-social" aria-label="Instagram">
              I
            </a>
            <a href="#" className="footer-social" aria-label="LinkedIn">
              L
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        title="Aide"
        aria-label="Aide"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `1px solid ${divider}`,
          background: surfaceMuted,
          color: T.textOnCard,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = T.accent;
          (e.currentTarget as HTMLButtonElement).style.color = T.saveBtnText;
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = surfaceMuted;
          (e.currentTarget as HTMLButtonElement).style.color = T.textOnCard;
          (e.currentTarget as HTMLButtonElement).style.borderColor = divider;
        }}
      >
        <HelpCircle size={22} strokeWidth={2} />
      </button>
    </footer>
  );
}
