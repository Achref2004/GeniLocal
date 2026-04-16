import { useTheme } from './Themecontext';

export default function Footer() {
  const { dark, T } = useTheme();

  return (
    <footer style={{
      marginTop: 40,
      width: '100%',
      padding: '42px 32px 28px',
      background: dark ? 'linear-gradient(135deg, #020306 0%, #08101a 100%)' : 'linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%)',
      borderRadius: 32,
      border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
      color: T.textOnCard,
      boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.25)' : '0 20px 60px rgba(15,23,42,0.12)',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes floatPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 18px rgba(42, 191, 255, 0.18); }
        }
      `}</style>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 280px) repeat(3, minmax(140px, 1fr))',
        gap: 28,
        alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, animation: 'floatPulse 6s ease-in-out infinite' }}>
            <img
              src="/assets/logo_smartcarthage.png"
              alt="SmartCarthage logo"
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 12, boxShadow: dark ? '0 10px 25px rgba(0,0,0,0.35)' : '0 10px 25px rgba(15,23,42,0.12)' }}
            />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.4, color: T.textOnCard }}>SmartCarthage</span>
          </div>
          <span style={{ fontSize: 14, color: dark ? '#9ca3af' : '#475569' }}>© 2026 SmartCarthage</span>
          <span style={{ fontSize: 14, lineHeight: 1.8, color: dark ? '#9ca3af' : '#475569' }}>
            Apprenez, progressez et débloquez des badges avec une IA qui parle français, anglais et arabe.
          </span>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {['facebook','twitter','instagram','linkedin'].map((network) => (
              <a key={network} href="#" style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease, background 0.2s ease' }}>
                <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#d1d5db' : '#0f172a' }}>
                  {network === 'facebook' && <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M13 2.04c-3.87 0-6.99 3.12-6.99 6.99 0 3.14 2.33 5.74 5.4 6.66v-4.71H10.1v-1.95h1.29V10.2c0-1.28.76-1.99 1.94-1.99.56 0 1.15.1 1.15.1v1.26h-.65c-.64 0-.84.4-.84.81v.98h1.43l-.23 1.95h-1.2v4.71c3.07-.92 5.4-3.52 5.4-6.66 0-3.87-3.12-6.99-6.99-6.99z"/></svg>}
                  {network === 'twitter' && <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M22.46 6c-.77.34-1.6.56-2.46.66a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.03 4.28 4.28 0 0 0-7.29 3.9 12.15 12.15 0 0 1-8.83-4.48 4.28 4.28 0 0 0 1.33 5.72 4.24 4.24 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.44 4.2 4.28 4.28 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98A8.6 8.6 0 0 1 2 19.54a12.14 12.14 0 0 0 6.57 1.93c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0 0 24 5.55a8.49 8.49 0 0 1-2.54.7z"/></svg>}
                  {network === 'instagram' && <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 7.92a3.12 3.12 0 1 1 0-6.24 3.12 3.12 0 0 1 0 6.24zm4.92-7.98a1.08 1.08 0 1 1 0-2.16 1.08 1.08 0 0 1 0 2.16zm2.16 1.08c-.05-1.08-.31-1.82-.66-2.47-.35-.66-.82-1.22-1.48-1.58-.66-.35-1.39-.61-2.47-.66-1.1-.05-1.44-.06-4.5-.06s-3.4.01-4.5.06c-1.08.05-1.82.31-2.47.66-.66.35-1.22.92-1.58 1.58-.35.65-.61 1.39-.66 2.47-.05 1.1-.06 1.44-.06 4.5s.01 3.4.06 4.5c.05 1.08.31 1.82.66 2.47.35.66.92 1.22 1.58 1.58.65.35 1.39.61 2.47.66 1.1.05 1.44.06 4.5.06s3.4-.01 4.5-.06c1.08-.05 1.82-.31 2.47-.66.66-.35 1.22-.92 1.58-1.58.35-.65.61-1.39.66-2.47.05-1.1.06-1.44.06-4.5s-.01-3.4-.06-4.5zm-1.8 9.27a2.65 2.65 0 0 1-1.48 1.48c-1.02.4-3.44.31-4.56.31s-3.54.09-4.56-.31a2.65 2.65 0 0 1-1.48-1.48c-.4-1.02-.31-3.44-.31-4.56s-.09-3.54.31-4.56a2.65 2.65 0 0 1 1.48-1.48c1.02-.4 3.44-.31 4.56-.31s3.54-.09 4.56.31a2.65 2.65 0 0 1 1.48 1.48c.4 1.02.31 3.44.31 4.56s.09 3.54-.31 4.56z"/></svg>}
                  {network === 'linkedin' && <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.35 17.25V10.55H5.8v6.7h2.55zm-1.25-7.67a1.48 1.48 0 1 0 .03-2.96 1.48 1.48 0 0 0-.03 2.96zm11.15 7.67V13.2c0-2.8-1.49-4.1-3.48-4.1-1.6 0-2.32.88-2.72 1.5v-1.28H9.65c.03.85 0 6.7 0 6.7h2.55v-3.73c0-.2.01-.4.08-.54.17-.4.56-.82 1.22-.82.86 0 1.2.62 1.2 1.53v3.55h2.56z"/></svg>}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.textOnCard }}>Platform</span>
          <a href="#" style={{ color: dark ? '#d1d5db' : '#0f172a', textDecoration: 'none', fontSize: 14 }}>Comment SmartCarthage fonctionne</a>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Tarification</a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.textOnCard }}>Entreprise</span>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Standards</a>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Centre de confiance</a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.textOnCard }}>Société</span>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>À propos</a>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Carrières</a>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Politique de confidentialité</a>
          <a href="#" style={{ color: dark ? '#9ca3af' : '#475569', textDecoration: 'none', fontSize: 14 }}>Conditions d'utilisation</a>
        </div>
      </div>
    </footer>
  );
}
