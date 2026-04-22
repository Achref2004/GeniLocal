import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Sparkles, Brain, Calendar, Heart, Clock, TrendingUp, Award,
    BookOpen, Star, CheckCircle2, Sun, Moon, LogOut,
    Book, Bot, Timer, FileText, Flame, Trophy, PenTool, Lightbulb, Gem, Crown, Target, Globe
} from 'lucide-react';
import Sidebar, { UserProfile } from '../reutilisable/Sidebar';
import Footer from '../reutilisable/Footer';
import { useTheme } from '../reutilisable/Themecontext'; // ← thème global
import { loadHistory, type HistoryItem } from '../utils/api_ia';
import { aggregateProgress, SubjectProgress } from '../utils/progressionStats';

interface UserStats {
    total_study_seconds: number;
    days_present: number;
    average_qcm_score: number;
    documents_analyzed: number;
    badges: string;
}

const DEFAULT_ACTIVITY_DATA = [
    { name: 'Lun', hours: 0 }, { name: 'Mar', hours: 0 },
    { name: 'Mer', hours: 0 }, { name: 'Jeu', hours: 0 },
    { name: 'Ven', hours: 0 }, { name: 'Sam', hours: 0 },
    { name: 'Dim', hours: 0 },
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
        documents_analyzed: 0,
        badges: '[]',
    });
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState('resume');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [progressData, setProgressData] = useState<SubjectProgress[]>([]);
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [showBadges, setShowBadges] = useState(false);
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

    // Charger les données de progression depuis l'historique
    useEffect(() => {
        const loadProgressData = async () => {
            // njib fichier eli fih historique 
            const history = await loadHistory();
            //n5abiha f el stat 
            setHistoryData(history);
            //fi west el historique w t-talla3 mennou el progression
            const progress = aggregateProgress(history);
            //lhna setprogressData(progress); retbthm eli jee le5r yo5rej lawel 
            setProgressData(progress.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
        };

        loadProgressData();
        const interval = setInterval(loadProgressData, 30000); // Rafraîchir toutes les 30s
        return () => clearInterval(interval);
    }, []);

    // Calculer les statistiques globales de progression
    const globalProgression = useMemo(() => {
        return {
            totalSubjects: progressData.length,
        };
    }, [progressData]);
//i-jiw mel serveur k-enhom "Klem" (String) maktoub hakka

//jSON.parse: Hadhi t-rod el "Klem" hadhika l-"Lista" (Array) shiha bech najmou n-warriwhom ka3ba ka3ba. Ken famma ghalta fi el klem, yrajja3 lista fergha []
    const badgeList = useMemo(() => {
        try {
            const list = JSON.parse(stats.badges || '[]');
            return Array.isArray(list) ? list : [];
        } catch {
            return [];
        }
    }, [stats.badges]);
// Calculer l'activité hebdomadaire à partir de l'historique
    const weeklyActivity = useMemo(() => {
        const now = new Date();
        const rawDays = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(now);
            day.setDate(now.getDate() - (6 - index));
            const label = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day.getDay()];
            const key = day.toISOString().slice(0, 10);
            const count = historyData.filter((item) => {
                const itemDate = new Date(item.timestamp).toISOString().slice(0, 10);
                return itemDate === key;
            }).length;
            return { label, count };
        });

        const totalCount = rawDays.reduce((sum, day) => sum + day.count, 0);
        const totalHours = stats.total_study_seconds / 3600;

        if (totalCount === 0) {
            return DEFAULT_ACTIVITY_DATA;
        }

        return rawDays.map((day) => ({
            name: day.label,
            hours: Math.max(0, Math.round((totalHours * (day.count / totalCount)) * 10) / 10),
        }));
    }, [historyData, stats.total_study_seconds]);
// Formatage du temps d'étude en HH:MM:SS
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
                 planning: <Calendar size={56} />,
            };
            const labels: Record<string, string> = {
                planning: 'Mon Planning',
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
                {/* 4 Stats Cards + 1 Progression Card (aligned on same row) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 24 }}>
                    {[
                        { icon: <Clock size={26} />, accent: '#4f6ef7', label: "Heures d'étude", value: formatTime(stats.total_study_seconds), mono: true },
                        { icon: <TrendingUp size={26} />, accent: '#00b8d9', label: 'Jours de présence', value: String(stats.days_present) },
                        { icon: <Award size={26} />, accent: '#e91e94', label: 'Score QCM moyen', value: `${Math.round(stats.average_qcm_score)}%` },
                        { icon: <BookOpen size={26} />, accent: '#6e40f7', label: 'Documents analysés', value: String(stats.documents_analyzed) },
                    ].map(({ icon, accent, label, value, mono }) => (
                        <div key={label} style={card({ padding: '24px 22px', position: 'relative', overflow: 'hidden', cursor: 'default' })}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, background: accent, borderRadius: '50%', filter: 'blur(36px)', opacity: 0.35 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                                <div style={{ width: 48, height: 48, background: accent, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 20px ${accent}40` }}>{icon}</div>
                                <span style={{ fontSize: mono ? 22 : 32, fontWeight: 800, color: '#b6009e', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
                            </div>
                            <p style={{ color: 'rgba(0, 148, 153, 0.6)', fontWeight: 600, fontSize: 14, position: 'relative', zIndex: 1 }}>{label}</p>
                        </div>
                    ))}

                    {/* Progression Card (aligned with the 4 stats) */}
                    <div
                        style={card({
                            padding: '24px 22px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        })}
                        onClick={() => navigate('/progression')}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px #8b5cf630`;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                    >
                        // Carte de progression
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, background: '#8b5cf6', borderRadius: '50%', filter: 'blur(36px)', opacity: 0.35 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative', zIndex: 1 }}>
                            <div style={{ width: 48, height: 48, background: '#8b5cf6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 20px #8b5cf640` }}>
                                <TrendingUp size={26} />
                            </div>
                            <span style={{ fontSize: 32, fontWeight: 800, color: '#8b5cf6' }}>
                                {globalProgression.totalSubjects}
                            </span>
                        </div>
                        <p style={{ color: 'rgba(141, 0, 139, 0.6)', fontWeight: 600, fontSize: 14, position: 'relative', zIndex: 1, marginBottom: 6 }}>Ma Progression</p>
                        <p style={{ color: 'rgba(118, 0, 129, 0.45)', fontWeight: 500, fontSize: 12, position: 'relative', zIndex: 1 }}>
                            {globalProgression.totalSubjects > 0
                                ? `${globalProgression.totalSubjects} matière(s)`
                                : 'Aucune donnée'}
                        </p>
                       
                    </div>
                </div>
                        //container de l'activité hebdomadaire
                <div style={{ display: 'grid', gridTemplateColumns: '20fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div style={card({ padding: '28px 10px', position: 'relative', overflow: 'hidden' })}>
                        <div style={{ position: 'absolute', top: -400, right: -40, width: 260, height: 160, background: T.accent, borderRadius: '50%', filter: 'blur(60px)', opacity: 0.08 }} />
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, color: T.textOnCard }}>Activité hebdomadaire</h3>
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyActivity} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
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

                    
                </div>
// Modal de badges
                {showBadges && (() => {
                    const BADGE_CATALOG = [
                        { title: 'Premier utilisation', icon: <Star size={22} />, color: '#f50b0bff', desc: 'Première action sur la plateforme' },
                        { title: '+5 matières ajoutées', icon: <Book size={22} />, color: '#029a1eff', desc: '5 matières différentes ajoutées' },
                        { title: 'Explorateur IA', icon: <Bot size={22} />, color: '#8b5cf6', desc: 'Première utilisation de l\'IA' },
                        { title: 'Marathonien', icon: <Timer size={22} />, color: '#ef4444', desc: 'Plus d\'1 heure d\'étude cumulée' },
                        { title: 'QCM Parfait', icon: <Target size={22} />, color: '#10b981', desc: 'Score de 100% sur un QCM' },
                        { title: 'Importateur OCR', icon: <FileText size={22} />, color: '#06b6d4', desc: 'Premier import d\'emploi du temps' },
                        { title: 'Organisateur', icon: <Calendar size={22} />, color: '#f97316', desc: '10 activités dans le planning' },
                        { title: 'Noctambule', icon: <Moon size={22} />, color: '#6366f1', desc: 'Étude après 22h' },
                        { title: 'Polyglotte', icon: <Globe size={22} />, color: '#14b8a6', desc: 'IA utilisée en 2+ langues' },
                        { title: 'Série de 7 jours', icon: <Flame size={22} />, color: '#dc2626', desc: '7 jours consécutifs connecté' },
                        { title: 'Maître QCM', icon: <Trophy size={22} />, color: '#eab308', desc: '20 QCM complétés' },
                        { title: 'Résumeur Expert', icon: <PenTool size={22} />, color: '#a855f7', desc: '10 résumés générés' },
                        { title: 'Curieux', icon: <Lightbulb size={22} />, color: '#0ea5e9', desc: '15 questions posées à l\'IA' },
                        { title: 'Perfectionniste', icon: <Gem size={22} />, color: '#ec4899', desc: 'Score moyen QCM > 80%' },
                        { title: 'Champion GeniLocal', icon: <Crown size={22} />, color: '#d97706', desc: '10 badges débloqués !' },
                    ];
                    return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <div style={{ width: 'min(820px, 95%)', maxHeight: '90vh', overflowY: 'auto', background: T.card, border: `1px solid ${T.border}`, borderRadius: 28, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: T.textOnCard, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        🏅 Badges GeniLocal
                                    </h2>
                                    <p style={{ margin: '8px 0 0', color: T.textOnCardMuted, fontSize: 14 }}>
                                        {badgeList.length} / {BADGE_CATALOG.length} débloqué{badgeList.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBadges(false)}
                                    style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.textOnCardMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textOnCardMuted; }}
                                >✕</button>
                            </div>

                            {/* Progress bar */}
                            <div style={{ marginBottom: 28, padding: '16px 20px', borderRadius: 16, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.textOnCard }}>Progression</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{Math.round((badgeList.length / BADGE_CATALOG.length) * 100)}%</span>
                                </div>
                                <div style={{ height: 8, borderRadius: 4, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(badgeList.length / BADGE_CATALOG.length) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg, ${T.accent}, ${T.accentSoft})`, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
// Liste des badges
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                                {BADGE_CATALOG.map(badge => {
                                    const unlocked = badgeList.includes(badge.title);
                                    return (
                                        <div key={badge.title} style={{
                                            padding: '18px 16px', borderRadius: 20,
                                            background: unlocked ? `${badge.color}10` : (dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                            border: `1px solid ${unlocked ? `${badge.color}35` : T.border}`,
                                            opacity: unlocked ? 1 : 0.55,
                                            transition: 'all 0.3s',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}>
                                            {unlocked && <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: badge.color, borderRadius: '50%', filter: 'blur(25px)', opacity: 0.2 }} />}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, position: 'relative', zIndex: 1 }}>
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 14,
                                                    background: unlocked ? `linear-gradient(135deg, ${badge.color}, ${badge.color}88)` : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 22, filter: unlocked ? 'none' : 'grayscale(1)',
                                                    boxShadow: unlocked ? `0 6px 16px ${badge.color}30` : 'none',
                                                }}>
                                                    {badge.icon}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: unlocked ? badge.color : T.textOnCard }}>{badge.title}</p>
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, color: T.textOnCardMuted, fontSize: 12, lineHeight: 1.4, position: 'relative', zIndex: 1 }}>{badge.desc}</p>
                                            <div style={{ marginTop: 10, position: 'relative', zIndex: 1 }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                                                    background: unlocked ? badge.color : 'transparent',
                                                    border: unlocked ? 'none' : `1px solid ${T.border}`,
                                                    color: unlocked ? '#fff' : T.textOnCardMuted,
                                                    fontSize: 11, fontWeight: 700,
                                                }}>
                                                    {unlocked ? '✓ Débloqué' : '🔒 Verrouillé'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {/* Bottom Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={card({ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18 })}>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: 17, color: T.textOnCard }}>Badges GeniLocal</h3>
                            <p style={{ color: T.textOnCardMuted, fontSize: 14, fontWeight: 600, marginTop: 6 }}>Vos récompenses basées sur votre activité IA.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, width: '100%' }}>
                            {badgeList.length > 0 ? badgeList.map((badge, index) => (
                                <button
                                    key={index}
                                    onClick={() => setShowBadges(true)}
                                    style={{
                                        width: '100%',
                                        minHeight: 96,
                                        borderRadius: 20,
                                        border: `1px solid ${T.border}`,
                                        background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0, 140, 148, 0.08)',
                                        color: T.textOnCard,
                                        padding: '16px',
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px ${T.accent}20`;
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                    }}
                                >
                                    <span style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 8 }}>Badge</span>
                                    <span style={{ fontSize: 15, fontWeight: 800 }}>{badge}</span>
                                </button>
                            )) : (
                                <div style={{ padding: 18, borderRadius: 20, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0, 140, 148, 0.08)', border: `1px solid ${T.border}`, color: T.textOnCardMuted }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>Aucun badge disponible</p>
                                    <p style={{ margin: '8px 0 0', fontSize: 13 }}>Utilisez l'IA et progressez pour débloquer vos premiers badges.</p>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowBadges(true)}
                                style={{
                                    padding: '12px 18px',
                                    borderRadius: 14,
                                    border: '1px solid transparent',
                                    background: T.accent,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                }}
                            >
                                Afficher tous les badges
                            </button>
                        </div>
                    </div>

                    {/* Features Card */}
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
        // Animation des oiseaux
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
                                Bienvenue, {user?.fullname || user?.username || 'Étudiant'} <span style={{ display: 'inline-block', animation: 'wave 2s infinite', transformOrigin: '70% 70%' }}>👋</span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                            {/*  Bouton thème Unique — contrôle toute l'app */}
                            <button onClick={toggleTheme} title={dark ? 'Mode clair' : 'Mode sombre'}
                                style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.sidebarBorder}`, background: T.sidebarBg, color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', transition: 'all .3s' }}>
                                {dark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
// Bouton de déconnexion
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
                    <Footer />
                </div>
            </main>

            <style>{`
                @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
                @keyframes birdFly { 0%{transform:translateX(0)} 100%{transform:translateX(110vw)} }
                @keyframes birdFlyRtl { 0%{transform:translateX(0)} 100%{transform:translateX(-110vw)} }
                @keyframes wingFlap { 0%{transform:rotate(-20deg)} 100%{transform:rotate(20deg)} }
                @keyframes wave { 0% { transform: rotate(0.0deg) } 10% { transform: rotate(14.0deg) } 20% { transform: rotate(-8.0deg) } 30% { transform: rotate(14.0deg) } 40% { transform: rotate(-4.0deg) } 50% { transform: rotate(10.0deg) } 60% { transform: rotate(0.0deg) } 100% { transform: rotate(0.0deg) } }
                ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-track{background:transparent}
                ::-webkit-scrollbar-thumb{background:${T.accent}30;border-radius:10px}
            `}</style>
        </div>
    );
};

export default Dashboard;
