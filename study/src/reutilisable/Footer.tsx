import { useTheme } from './Themecontext';
import logoGeniLocal from '../assets/logoo_genilocal.png';

export default function Footer() {
  const { dark, T } = useTheme();

  const accentColor = '#3b82f6'; // Bleu éducatif moderne

  return (
    <footer style={{
      marginTop: 60,
      width: '100%',
      padding: '60px 40px 30px',
      background: dark 
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 3, 6, 1) 100%)' 
        : 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(238, 242, 255, 1) 100%)',
      borderRadius: '40px 40px 0 0', // Arrondi uniquement en haut pour l'effet "vague"
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)'}`,
      color: T.textOnCard,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Éléments décoratifs animés en arrière-plan */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        animation: 'pulse 8s infinite alternate'
      }} />

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .footer-link {
          transition: all 0.3s ease;
          position: relative;
          display: inline-block;
        }
        .footer-link:hover {
          color: ${accentColor} !important;
          transform: translateX(5px);
        }
        .social-icon:hover {
          transform: translateY(-5px) scale(1.1);
          background: ${accentColor} !important;
          color: white !important;
        }
      `}</style>

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Colonne Marque */}
        <div style={{ gridColumn: 'span 1.5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20, animation: 'float 5s ease-in-out infinite' }}>
            <img src={logoGeniLocal} alt="Logo" style={{ width: 50, height: 50, borderRadius: 15 }} />
            <span style={{ fontSize: 24, fontWeight: 900, background: `linear-gradient(to right, ${accentColor}, #8b5cf6)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GeniLocal
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: '1.6', opacity: 0.7, marginBottom: 20, maxWidth: 300 }}>
            L'excellence éducative propulsée par l'intelligence artificielle trilingue.
          </p>
          
          {/* Status Badge */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '6px 12px', 
            borderRadius: 20, 
            background: dark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Système IA Opérationnel</span>
          </div>
        </div>

        {/* Liens de Navigation */}
        {[
          { title: 'Apprentissage', links: ['Cours interactifs', 'Badges & Succès', 'Quiz IA'] },
          { title: 'Communauté', links: ['Forum', 'Événements', 'Blog'] },
          { title: 'Support', links: ['Centre d\'aide', 'Contact', 'FAQ'] }
        ].map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <span style={{ fontSize: 16, fontWeight: 800, marginBottom: 5 }}>{section.title}</span>
            {section.links.map(link => (
              <a key={link} href="#" className="footer-link" style={{ 
                textDecoration: 'none', 
                fontSize: 14, 
                color: dark ? '#9ca3af' : '#64748b' 
              }}>
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Barre de fin */}
      <div style={{
        maxWidth: 1200,
        margin: '40px auto 0',
        paddingTop: 25,
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <span style={{ fontSize: 13, opacity: 0.6 }}>© 2026 GeniLocal. Fait avec passion pour le futur.</span>
        
        <div style={{ display: 'flex', gap: 15 }}>
          {['facebook', 'twitter', 'linkedin'].map((social) => (
            <a key={social} href="#" className="social-icon" style={{
              width: 38, height: 38, borderRadius: 10,
              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              color: 'inherit'
            }}>
              {/* Gardez vos SVGs ici */}
              <div style={{ width: 18, height: 18, background: 'currentColor', mask: `url(/icons/${social}.svg) no-repeat center` }} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}