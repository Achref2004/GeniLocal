import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Sparkles, Brain, Calendar, Heart, Clock, TrendingUp, Award,
    BookOpen, Star, CheckCircle2, Sun, Moon, LogOut,
} from 'lucide-react';
import Sidebar, { UserProfile } from '../reutilisable/Sidebar';
import { useTheme } from '../reutilisable/Themecontext'; // ← thème global

interface UserStats {
    total_study_seconds: number;
    days_present: number;
    average_qcm_score: number;
    courses_completed: number;
    progression: number;
}

const activityData = [
    { name: 'Lun', hours: 3 }, { name: 'Mar', hours: 4 },
    { name: 'Mer', hours: 2 }, { name: 'Jeu', hours: 5 },
    { name: 'Ven', hours: 3 }, { name: 'Sam', hours: 6 },
    { name: 'Dim', hours: 4 },
];

const STARS = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 3).toFixed(2)}s`,
    size: Math.random() > 0.8 ? 2 : 1,
}));

const BIRDS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    top: `${8 + Math.random() * 75}%`,
    duration: `${18 + Math.random() * 22}s`,
    delay: `${(Math.random() * 20).toFixed(1)}s`,
    scale: 0.5 + Math.random() * 0.9,
    rtl: Math.random() > 0.5,
    wingSpeed: `${0.4 + Math.random() * 0.5}s`,
}));

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { dark, toggleTheme, T } = useTheme(); // ← utilise le contexte global
    const [stats, setStats] = useState<UserStats>({
        total_study_seconds: 0,
        days_present: 0,
        average_qcm_score: 0,
        courses_completed: 0,
        progression: 0,
    });
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState('resume');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        if (!token) return;
        axios.get('http://127.0.0.1:8000/users/me/stats', {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => { if (res.data) setStats(prev => ({ ...prev, ...res.data })); })
            .catch(() => console.warn('Stats non disponibles.'));

        axios.get('http://127.0.0.1:8000/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => { if (res.data) setUser(res.data); })
            .catch(() => console.warn('Profil non disponible.'));
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({ ...prev, total_study_seconds: (prev.total_study_seconds || 0) + 1 }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 28, color: T.textOnCard,
        transition: 'transform .25s, box-shadow .25s', ...extra,
    });

    const renderContent = () => {
        if (activeTab !== 'resume') {
            const icons: Record<string, React.ReactNode> = {
                librairie: <BookOpen size={56} />, psy: <Brain size={56} />, planning: <Calendar size={56} />,
            };
            const labels: Record<string, string> = {
                librairie: 'Librairie', psy: 'Espace Psychologique', planning: 'Mon Planning',
            };
            return (
                <div style={{ ...card({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }), color: T.accent }}>
                    {icons[activeTab]}
                    <p style={{ color: T.textOnCardMuted, fontSize: 18, fontWeight: 600 }}>{labels[activeTab]} — En construction</p>
                </div>
            );
        }

        return (
            <>
                {/* 4 Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20, marginBottom: 24 }}>
                    {[
                        { icon: <Clock size={26} />, accent: '#4f6ef7', label: "Heures d'étude", value: formatTime(stats.total_study_seconds), mono: true },
                        { icon: <TrendingUp size={26} />, accent: '#00b8d9', label: 'Jours de présence', value: String(stats.days_present) },
                        { icon: <Award size={26} />, accent: '#e91e94', label: 'Score QCM moyen', value: `${Math.round(stats.average_qcm_score)}%` },
                        { icon: <BookOpen size={26} />, accent: '#6e40f7', label: 'Cours complétés', value: String(stats.courses_completed) },
                    ].map(({ icon, accent, label, value, mono }) => (
                        <div key={label} style={card({ padding: '24px 22px', position: 'relative', overflow: 'hidden', cursor: 'default' })}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, background: accent, borderRadius: '50%', filter: 'blur(36px)', opacity: 0.35 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                                <div style={{ width: 48, height: 48, background: accent, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 20px ${accent}40` }}>{icon}</div>
                                <span style={{ fontSize: mono ? 22 : 32, fontWeight: 800, color: '#b6009e', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, position: 'relative', zIndex: 1 }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Graph + Ring */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div style={card({ padding: '28px 24px', position: 'relative', overflow: 'hidden' })}>
                        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: T.accent, borderRadius: '50%', filter: 'blur(60px)', opacity: 0.08 }} />
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, color: T.textOnCard }}>Activité hebdomadaire</h3>
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cbar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={T.accent} />
                                            <stop offset="100%" stopColor={T.accentSoft} stopOpacity={0.4} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: T.textOnCardMuted, fontSize: 13 }} dy={8} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 14, color: '#fff', fontSize: 13 }} />
                                    <Bar dataKey="hours" fill="url(#cbar)" radius={[10, 10, 10, 10]} barSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={card({ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 })}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, color: T.textOnCard }}>Progression globale</h3>
                        <div style={{ position: 'relative', width: 160, height: 160 }}>
                            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="80" cy="80" r="62" fill="transparent" stroke="rgba(255,255,255,0.07)" strokeWidth="16" />
                                <circle cx="80" cy="80" r="62" fill="transparent" stroke={T.accent}
                                    strokeWidth="16" strokeDasharray="390"
                                    strokeDashoffset={390 - (390 * (stats.progression || 0)) / 100}
                                    strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 8px ${T.accent})`, transition: 'stroke-dashoffset 1s ease-out' }} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 36, fontWeight: 900, color: T.accent }}>{Math.round(stats.progression || 0)}%</span>
                            </div>
                        </div>
                        <p style={{ color: T.textOnCardMuted, fontSize: 14, fontWeight: 600 }}>Objectif atteint</p>
                    </div>
                </div>

                {/* Bottom Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ background: 'linear-gradient(135deg, #f0f89f, #cbcbcb, #fdd5a0)', borderRadius: 28, padding: '36px 32px', color: '#fff', position: 'relative', overflow: 'hidden', border: `1px solid ${T.accent}30` }}>
                        <Star style={{ position: 'absolute', top: 24, right: 24, opacity: 0.18 }} size={60} color={T.accent} />
                        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: T.accent, borderRadius: '50%', filter: 'blur(60px)', opacity: 0.18 }} />
                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}> Version Premium</h2>
                        <p style={{ opacity: 0.85, marginBottom: 24, fontWeight: 500 }}>Débloquez tout le potentiel</p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                            {[' IA avancée avec OCR manuscrit', ' QCM et résumés illimités', ' Planning intelligent avec rappels', 'Avatar personnalisé qui parle', ' Mode hors-ligne complet', ' Support psychologique premium'].map(item => (
                                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500, fontSize: 15 }}>
                                    <span style={{ width: 32, height: 32, background: `${T.accent}30`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, border: `1px solid ${T.accent}50` }}>{item.slice(0, 2)}</span>
                                    {item.slice(3)}
                                </li>
                            ))}
                        </ul>
                        <button style={{ width: '100%', background: `linear-gradient(135deg,${T.accent},${T.accentSoft})`, color: '#0b2a4a', fontWeight: 900, fontSize: 17, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${T.accent}50` }}>
                            Passer à Premium →
                        </button>
                    </div>

                    <div style={card({ padding: '36px 32px', position: 'relative', overflow: 'hidden' })}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.accent, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                            <CheckCircle2 size={24} /> Pourquoi notre plateforme ?
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 28 }}>
                            {[
                                { icon: <Brain size={22} />, accent: '#4f6ef7', title: 'IA de pointe', desc: 'Extraction automatique et analyse intelligente de vos documents.' },
                                { icon: <Calendar size={22} />, accent: '#00b8d9', title: 'Organisation parfaite', desc: 'Planning adapté à vos objectifs avec rappels intelligents.' },
                                { icon: <Heart size={22} />, accent: '#e91e94', title: 'Bien-être mental', desc: 'Support psychologique continu et conseils personnalisés.' },
                                { icon: <Sparkles size={22} />, accent: '#f59e0b', title: 'Partout, tout le temps', desc: "Accès hors-ligne fluide pour étudier n'importe où." },
                            ].map(({ icon, accent, title, desc }) => (
                                <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${accent},${accent}aa)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>{icon}</div>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 15, color: T.textOnCard, marginBottom: 2 }}>{title}</p>
                                        <p style={{ color: T.textOnCardMuted, fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter,sans-serif', overflow: 'hidden', position: 'relative', transition: 'background .4s,color .4s' }}>

            {dark && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    {STARS.map(s => (
                        <div key={s.id} style={{ position: 'absolute', top: s.top, left: s.left, width: s.size, height: s.size, background: '#fff', borderRadius: '50%', animation: `twinkle 3s ${s.delay} ease-in-out infinite` }} />
                    ))}
                </div>
            )}

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {BIRDS.map(b => (
                    <div key={b.id} style={{ position: 'absolute', top: b.top, left: b.rtl ? 'auto' : '-80px', right: b.rtl ? '-80px' : 'auto', animation: `${b.rtl ? 'birdFlyRtl' : 'birdFly'} ${b.duration} ${b.delay} linear infinite`, opacity: dark ? 0.13 : 0.18 }}>
                        <svg width={`${54 * b.scale}`} height={`${28 * b.scale}`} viewBox="0 0 54 28" fill="none">
                            <path d="M27 14 Q14 2 2 8" stroke={dark ? '#ffffff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                            <path d="M27 14 Q40 2 52 8" stroke={dark ? '#ffffff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none" style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                        </svg>
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', top: 0, right: 0, width: 600, height: 600, background: T.accent, borderRadius: '50%', filter: 'blur(140px)', opacity: dark ? 0.04 : 0.12, pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 500, height: 500, background: T.accentSoft, borderRadius: '50%', filter: 'blur(120px)', opacity: dark ? 0.03 : 0.1, pointerEvents: 'none', zIndex: 0 }} />

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarExpanded={isSidebarExpanded} setIsSidebarExpanded={setIsSidebarExpanded} user={user} T={T} />

            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px 48px' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 32px' }}>
                        <div>
                            <h1 style={{ fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, color: T.text, margin: 0 }}>
                                <Sparkles size={34} color={T.accent} fill={T.accent} /> Tableau de Bord
                            </h1>
                            <p style={{ color: T.textMuted, marginTop: 6, fontSize: 15, marginLeft: 46, fontWeight: 500 }}>
                                Bienvenue, {user?.fullname || user?.username || 'Étudiant'} 👋
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                            {/* ✅ Bouton thème UNIQUE — contrôle toute l'app */}
                            <button onClick={toggleTheme} title={dark ? 'Mode clair' : 'Mode sombre'}
                                style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.sidebarBorder}`, background: T.sidebarBg, color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', transition: 'all .3s' }}>
                                {dark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <button onClick={handleLogout}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, border: `1px solid rgba(239,68,68,0.35)`, background: dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(12px)', transition: 'all .25s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.18)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)'; }}
                            >
                                <LogOut size={17} /> Déconnexion
                            </button>
                        </div>
                    </header>
                    {renderContent()}
                </div>
            </main>

            <style>{`
                @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
                @keyframes birdFly { 0%{transform:translateX(0)} 100%{transform:translateX(110vw)} }
                @keyframes birdFlyRtl { 0%{transform:translateX(0)} 100%{transform:translateX(-110vw)} }
                @keyframes wingFlap { 0%{transform:rotate(-20deg)} 100%{transform:rotate(20deg)} }
                ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-track{background:transparent}
                ::-webkit-scrollbar-thumb{background:${T.accent}30;border-radius:10px}
            `}</style>
        </div>
    );
};

export default Dashboard;