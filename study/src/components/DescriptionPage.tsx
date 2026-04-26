import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowLeft,ArrowRight,Brain,Calendar,LayoutDashboard,Sparkles,Sun,
  Moon,BookOpen,TrendingUp,User,Zap,
} from 'lucide-react';
import { useTheme } from '../reutilisable/Themecontext';

const sectionReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const FEATURES = [
  {
    title: 'Tableau de bord',
    desc: 'Vue d’ensemble de votre activité : temps d’étude, scores QCM, documents analysés et badges.',
    icon: LayoutDashboard,
  },
  {
    title: 'Raisonnement & IA',
    desc: 'Résumés intelligents, QCM générés à partir de vos cours, questions–réponses guidées et historique par matière.',
    icon: Brain,
  },
  {
    title: 'Planning',
    desc: 'Organisez vos sessions, deadlines et révisions pour garder le rythme sans vous disperser.',
    icon: Calendar,
  },
  {
    title: 'Progression',
    desc: 'Suivez vos progrès par matière, visualisez l’évolution et restez motivé avec des objectifs clairs.',
    icon: TrendingUp,
  },
  {
    title: 'Profil',
    desc: 'Paramètres du compte, avatar et préférences pour une expérience personnalisée.',
    icon: User,
  },
  {
    title: 'Multilingue & OCR',
    desc: 'Import de documents, extraction de texte et outils pensés pour s’adapter à vos contenus réels.',
    icon: BookOpen,
  },
] as const;

export default function DescriptionPage() {
  const navigate = useNavigate();
  const { dark, toggleTheme, T } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const barScaleX = useTransform(smoothProgress, [0, 1], [0.22, 1]);

  const mesh = dark
    ? `radial-gradient(ellipse 80% 50% at 50% -20%, ${T.accent}22 0%, transparent 50%),
       radial-gradient(ellipse 60% 40% at 100% 50%, rgba(77, 148, 255, 0.12) 0%, transparent 45%)`
    : `radial-gradient(ellipse 80% 50% at 50% -10%, ${T.accent}18 0%, transparent 50%),
       radial-gradient(ellipse 55% 35% at 100% 40%, rgba(3, 120, 178, 0.12) 0%, transparent 45%)`;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: T.bgGrad,
        color: T.text,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: mesh,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          backdropFilter: 'blur(16px)',
          background: dark ? 'rgba(8,12,16,0.72)' : 'rgba(255,255,255,0.75)',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.sidebarBg,
            color: T.text,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        
         
        </div>
      </header>

      <style>{`
        .desc-perspective {
          perspective: 1100px;
          transform-style: preserve-3d;
        }
        .desc-tilt {
          transform-style: preserve-3d;
          transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.45s ease;
          will-change: transform;
        }
        .desc-tilt:hover {
          transform: rotateX(6deg) rotateY(-10deg) translateZ(24px);
          box-shadow: 0 28px 60px rgba(0,0,0,0.22);
        }
        .desc-glass {
          background: ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)'};
          border: 1px solid ${T.border};
          backdrop-filter: blur(14px);
        }
        .desc-shine {
          position: relative;
          overflow: hidden;
        }
        .desc-shine::after {
          content: '';
          position: absolute;
          inset: -40%;
          background: linear-gradient(
            105deg,
            transparent 40%,
            ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'} 50%,
            transparent 60%
          );
          transform: translateX(-100%) rotate(12deg);
          animation: desc-shine-move 7s ease-in-out infinite;
        }
        @keyframes desc-shine-move {
          0%, 15% { transform: translateX(-100%) rotate(12deg); }
          35%, 100% { transform: translateX(120%) rotate(12deg); }
        }
        @keyframes desc-float {
          0%, 100% { transform: translateY(0) rotateX(0deg); }
          50% { transform: translateY(-12px) rotateX(2deg); }
        }
        .desc-float {
          animation: desc-float 6s ease-in-out infinite;
        }
      `}</style>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 22px 80px' }}>
        <div ref={heroRef} style={{ paddingTop: 36, paddingBottom: 48, position: 'relative' }}>
          <motion.div style={{ y: parallaxY, opacity: parallaxOpacity }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="desc-glass desc-shine"
              style={{
                borderRadius: 28,
                padding: '36px 28px 40px',
                textAlign: 'center',
                maxWidth: 820,
                margin: '0 auto',
                boxShadow: T.cardShadow,
              }}
            >
              <motion.div
                initial={{ rotate: -6, y: 10 }}
                animate={{ rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                style={{ display: 'inline-flex', marginBottom: 18 }}
              >
                <img
                  src="/assets/logoo_genilocal.png"
                  alt=""
                  width={72}
                  height={72}
                  style={{
                    borderRadius: 20,
                    background: '#fff',
                    padding: 8,
                    boxShadow: `0 16px 40px ${dark ? 'rgba(0,212,224,0.15)' : 'rgba(0,140,148,0.2)'}`,
                  }}
                />
              </motion.div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12,
                }}
              >
                <span style={{ color: T.text }}>Découvrez </span>
                <span
                  style={{
                    background: T.saveBtnGrad,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  GeniLocal
                </span>
              </h1>
              <p
                style={{
                  margin: '18px auto 0',
                  maxWidth: 560,
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: T.textMuted,
                }}
              >
                Une plateforme d’apprentissage qui combine tableau de bord, intelligence artificielle, planning et
                suivi de progression pour vous accompagner du premier cours jusqu’aux examens.
              </p>
              
            </motion.div>
          </motion.div>

          <motion.div
            style={{
              marginTop: 36,
              height: 4,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
              scaleX: barScaleX,
              transformOrigin: '0% 50%',
              opacity: 0.5,
            }}
          />
        </div>

        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ marginBottom: 56 }}
        >
          <motion.h2
            variants={fadeUp}
            style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Sparkles size={26} color={T.accent} />
            Fonctionnalités principales
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: T.textMuted, marginBottom: 28, maxWidth: 640 }}>
            Chaque module a un rôle précis : centraliser vos données, générer du contenu pédagogique avec l’IA, structurer
            votre emploi du temps et mesurer vos progrès dans le temps.
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="desc-perspective"
                  style={{ height: '100%' }}
                >
                  <div
                    className="desc-tilt desc-glass"
                    style={{
                      borderRadius: 22,
                      padding: 22,
                      height: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: T.statBg,
                        color: T.accent,
                      }}
                    >
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{f.title}</h3>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: T.textMuted, flex: 1 }}>{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            alignItems: 'center',
            marginBottom: 64,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="desc-perspective"
          >
            <div className="desc-float desc-perspective" style={{ transformStyle: 'preserve-3d' }}>
              <div
                className="desc-tilt"
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: `1px solid ${T.border}`,
                  boxShadow: T.cardShadow,
                  background: '#fff',
                }}
              >
                <img
                  src="/assets/desc.png"
                  alt="Illustration GeniLocal"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={26} color={T.accent} />
              Une expérience fluide
            </h2>
            <p style={{ color: T.textMuted, fontSize: 16, lineHeight: 1.65, marginBottom: 16 }}>
              Connectez-vous, accédez à votre espace personnel et enchaînez entre le tableau de bord, le module
              Raisonnement (résumés, QCM, aide aux questions) et vos pages Planning et Progression — le tout avec un
              design adapté au mode clair ou sombre.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: T.textMuted, lineHeight: 1.8 }}>
              <li>Historique des générations IA par matière</li>
              <li>Upload de fichiers et suivi des statistiques d’étude</li>
              <li>Interface pensée pour la concentration et la lisibilité</li>
            </ul>
          </motion.div>
        </section>

        <motion.section
          className="desc-glass"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{
            borderRadius: 28,
            padding: '36px 28px',
            textAlign: 'center',
            marginBottom: 40,
            boxShadow: T.cardShadow,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900 }}>Prêt à étudier plus intelligemment ?</h2>
          <p style={{ margin: '0 auto 24px', maxWidth: 520, color: T.textMuted, fontSize: 15, lineHeight: 1.6 }}>
            Lancez le module Raisonnement pour coller à vos besoins du moment : synthèse rapide, entraînement QCM ou
            correction guidée.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 22px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                color: T.text,
                border: `1px solid ${T.border}`,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
              }}
            >
              Voir le tableau de bord
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
