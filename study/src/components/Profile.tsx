import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    User, Mail, Phone, Calendar, School, Target,
    GraduationCap, Camera, Star, Save, Sparkles, CheckCircle2, Globe,
    Book, Bot, Timer, FileText, Moon, Flame, Trophy, PenTool, Lightbulb, Gem, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme, STARS, BIRDS } from '../reutilisable/Themecontext';
import Sidebar, { UserProfile } from '../reutilisable/Sidebar';
import { BACKEND_URL } from '../config';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { dark, T } = useTheme();
    const token = localStorage.getItem('token');

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<{ badges: string } | null>(null);
    const [badgeList, setBadgeList] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        fullname: '', email: '', phone: '',
        birthdate: '', institution: '', region: '', level: 'Licence 3', objective: '',
    });
    const [showAllBadges, setShowAllBadges] = useState(false);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        axios.get(`${BACKEND_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            const d = res.data;
            // Remplie le user pour la Sidebar
            setUser(d);
            // Remplie le formulaire
            setFormData(prev => {
                const next = { ...prev };
                (Object.keys(prev) as (keyof typeof prev)[]).forEach(k => { next[k] = d[k] ?? ''; });
                return next;
            });
        }).catch((e: any) => { if (e.response?.status === 401) navigate('/login'); });
    }, [token, navigate]);

    useEffect(() => {
        if (!token) return;
        axios.get(`${BACKEND_URL}/users/me/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            setStats(res.data);
            try {
                const parsed = JSON.parse(res.data.badges || '[]');
                setBadgeList(Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]);
            } catch (_e) {
                setBadgeList(res.data.badges ? [res.data.badges] : []);
            }
        }).catch(() => {
            setStats(null);
            setBadgeList([]);
        });
    }, [token]);

    const handleSave = async () => {
        setLoading(true); setError(''); setSaved(false);
        try {
            const res = await axios.put(`${BACKEND_URL}/users/me`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const d = res.data;
            setUser(d);
            setFormData(prev => {
                const next = { ...prev };
                (Object.keys(prev) as (keyof typeof prev)[]).forEach(k => { next[k] = d[k] ?? ''; });
                return next;
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            const msg = err.response?.data?.detail;
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Erreur inconnue.');
        } finally { setLoading(false); }
    };

    const initials = formData.fullname
        ? formData.fullname.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'ET';

    const field = (
        label: string,
        icon: React.ReactNode,
        key: keyof typeof formData,
        type = 'text',
        placeholder = ''
    ) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
                fontSize: 13, fontWeight: 600, color: T.labelColor,
                display: 'flex', alignItems: 'center', gap: 7,
                textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
                {icon} {label}
            </label>
            <input
                type={type} placeholder={placeholder} value={formData[key]}
                onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                style={{
                    background: T.inputBg, border: `1.5px solid ${T.inputBorder}`,
                    borderRadius: 14, padding: '13px 16px', color: T.text,
                    fontSize: 15, fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                    width: '100%', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocus}`; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            background: T.bgGrad,
            color: T.text,
            fontFamily: "'Sora', 'Segoe UI', sans-serif",
            overflow: 'hidden',
            position: 'relative',
            transition: 'background .4s, color .4s',
        }}>

            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
                @keyframes twinkle { 0%,100%{opacity:.1;transform:scale(.8)} 50%{opacity:1;transform:scale(1.4)} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(0,212,224,.4)} 70%{box-shadow:0 0 0 14px rgba(0,212,224,0)} 100%{box-shadow:0 0 0 0 rgba(0,212,224,0)} }
                @keyframes savedPop { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
                @keyframes spin { to{transform:rotate(360deg)} }
                @keyframes birdFly { 0%{transform:translateX(0)} 100%{transform:translateX(110vw)} }
                @keyframes birdFlyRtl { 0%{transform:translateX(0)} 100%{transform:translateX(-110vw)} }
                @keyframes wingFlap { 0%{transform:rotate(-20deg)} 100%{transform:rotate(20deg)} }
                input[type="date"]::-webkit-calendar-picker-indicator { filter:${dark ? 'invert(1)' : 'none'}; opacity:.5; }
                select option { background:${T.card}; color:${T.text}; }
                ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:transparent}
                ::-webkit-scrollbar-thumb{background:${T.accent}40;border-radius:6px}
            `}</style>

            {/* ── Stars (Dark mode only) ── */}
            {dark && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    {STARS.map(s => (
                        <div key={s.id} style={{
                            position: 'absolute', top: s.top, left: s.left,
                            width: s.size, height: s.size,
                            background: s.size > 2 ? T.accent : '#fff',
                            borderRadius: '50%', opacity: 0.4,
                            animation: `twinkle ${s.duration} ${s.delay} ease-in-out infinite`,
                        }} />
                    ))}
                </div>
            )}

            {/* ── Glow blobs ── */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: T.accent, borderRadius: '50%', filter: 'blur(130px)', opacity: dark ? 0.06 : 0.15, pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: -150, left: -100, width: 600, height: 600, background: T.accentSoft, borderRadius: '50%', filter: 'blur(150px)', opacity: dark ? 0.04 : 0.12, pointerEvents: 'none', zIndex: 0 }} />

            {/* ── Birds (Light mode only) ── */}
            {!dark && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    {BIRDS.map(b => (
                        <div key={b.id} style={{
                            position: 'absolute', top: b.top,
                            left: b.rtl ? 'auto' : '-80px',
                            right: b.rtl ? '-80px' : 'auto',
                            animation: `${b.rtl ? 'birdFlyRtl' : 'birdFly'} ${b.duration} ${b.delay} linear infinite`,
                            opacity: 0.18,
                        }}>
                            <svg width={`${54 * b.scale}`} height={`${28 * b.scale}`} viewBox="0 0 54 28" fill="none">
                                <path d="M27 14 Q14 2 2 8" stroke="#0b2a4a" strokeWidth="2.8" strokeLinecap="round" fill="none"
                                    style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                                <path d="M27 14 Q40 2 52 8" stroke="#0b2a4a" strokeWidth="2.8" strokeLinecap="round" fill="none"
                                    style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                            </svg>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Sidebar ── */}
            <Sidebar
                activeTab="profil"
                setActiveTab={(tab) => {
                    // quand on clique sur un autre onglet, retourne au Dashboard
                    navigate('/dashboard');
                }}
                isSidebarExpanded={isSidebarExpanded}
                setIsSidebarExpanded={setIsSidebarExpanded}
                user={user}
                T={T}
            />

            {/* ── Main Content ── */}
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px' }}>

                    {/* ── Page title ── */}
                    <div style={{ marginBottom: 36, animation: 'fadeSlideUp .5s ease both' }}>
                        <h1 style={{
                            fontSize: 36, fontWeight: 900, margin: 0,
                            display: 'flex', alignItems: 'center', gap: 14, color: T.text,
                        }}>
                            <Sparkles size={34} color={T.accent} fill={T.accent} />
                            Mon Profil
                        </h1>
                        <p style={{ color: T.textMuted, marginTop: 6, fontSize: 15, marginLeft: 48, fontWeight: 500 }}>
                            Gérez vos informations personnelles et académiques
                        </p>
                    </div>

                    {/* ── Grid ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>

                        {/* ─── Left column ─── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Avatar card */}
                            <div style={{
                                background: T.card, border: `1px solid ${T.cardBorder}`,
                                borderRadius: 28, padding: '36px 24px',
                                boxShadow: T.cardShadow,
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                animation: 'fadeSlideUp .5s .1s ease both', opacity: 0, animationFillMode: 'forwards',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: T.accent, borderRadius: '50%', filter: 'blur(50px)', opacity: 0.1 }} />

                                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Star size={12} color={T.accent} fill={T.accent} /> Identité
                                </p>

                                {/* Avatar */}
                                <div style={{
                                    width: 110, height: 110, borderRadius: '50%',
                                    background: T.avatarGrad,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 38, fontWeight: 900, color: '#fff',
                                    position: 'relative',
                                    boxShadow: `0 0 0 4px ${T.card}, 0 0 0 6px ${T.accent}60`,
                                    animation: 'float 4s ease-in-out infinite, pulse-ring 3s ease-in-out infinite',
                                    marginBottom: 8,
                                }}>
                                    {initials}
                                    <div style={{
                                        position: 'absolute', bottom: 4, right: 4,
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: T.card, border: `2px solid ${T.accent}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: T.accent, transition: 'all .2s',
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = T.accent; (e.currentTarget as HTMLDivElement).style.color = '#0b2a4a'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = T.card; (e.currentTarget as HTMLDivElement).style.color = T.accent; }}
                                    >
                                        <Camera size={14} />
                                    </div>
                                </div>

                                <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textOnCard, margin: '14px 0 4px', textAlign: 'center' }}>
                                    {formData.fullname || 'Étudiant'}
                                </h2>
                                <span style={{ fontSize: 13, fontWeight: 600, background: `${T.accent}20`, border: `1px solid ${T.accent}40`, color: T.accent, padding: '4px 14px', borderRadius: 50 }}>
                                    {formData.level || 'Niveau non défini'}
                                </span>
                                {formData.institution && (
                                    <p style={{ color: T.textOnCardMuted, fontSize: 13, marginTop: 10, textAlign: 'center', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <School size={16} /> {formData.institution}
                                    </p>
                                )}
                            </div>

                            {/* Stats card */}
                            <div style={{
                                background: T.card, border: `1px solid ${T.cardBorder}`,
                                borderRadius: 28, padding: '28px 24px',
                                boxShadow: T.cardShadow,
                                animation: 'fadeSlideUp .5s .2s ease both', opacity: 0, animationFillMode: 'forwards',
                            }}>
                                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textOnCardMuted, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Trophy size={14} color={T.accent} /> Badges obtenus
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.textOnCard }}>{badgeList.length}</h3>
                                        <p style={{ margin: '6px 0 0', color: T.textOnCardMuted, fontSize: 14 }}>badge{badgeList.length > 1 ? 's' : ''} débloqué{badgeList.length > 1 ? 's' : ''}</p>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: 18, background: T.accent, color: '#fff', boxShadow: `0 12px 30px ${T.accent}40` }}>
                                        <Sparkles size={26} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: 12 }}>
                                    {(() => {
                                        const badgesData = [
                                        {
                                            title: 'Premier utilisation',
                                            description: 'Débloqué dès votre première action sur la plateforme.',
                                            unlocked: badgeList.includes('Premier utilisation'),
                                            icon: <Star size={20} />, color: '#f59e0b',
                                        },
                                        {
                                            title: '+5 matières ajoutées',
                                            description: 'Ajoutez cinq matières différentes.',
                                            unlocked: badgeList.includes('+5 matières ajoutées'),
                                            icon: <Book size={20} />, color: '#3b82f6',
                                        },
                                        {
                                            title: 'Explorateur IA',
                                            description: 'Utilisez l\'IA pour la première fois (QCM, Résumé ou Q/R).',
                                            unlocked: badgeList.includes('Explorateur IA'),
                                            icon: <Bot size={20} />, color: '#8b5cf6',
                                        },
                                        {
                                            title: 'Marathonien',
                                            description: 'Cumulez plus d\'1 heure d\'étude sur la plateforme.',
                                            unlocked: badgeList.includes('Marathonien'),
                                            icon: <Timer size={20} />, color: '#ef4444',
                                        },
                                        {
                                            title: 'QCM Parfait',
                                            description: 'Obtenez un score de 100% sur un QCM.',
                                            unlocked: badgeList.includes('QCM Parfait'),
                                            icon: <Target size={20} />, color: '#10b981',
                                        },
                                        {
                                            title: 'Importateur OCR',
                                            description: 'Importez votre premier emploi du temps via OCR.',
                                            unlocked: badgeList.includes('Importateur OCR'),
                                            icon: <FileText size={20} />, color: '#06b6d4',
                                        },
                                        {
                                            title: 'Organisateur',
                                            description: 'Ajoutez 10 activités dans votre planning.',
                                            unlocked: badgeList.includes('Organisateur'),
                                            icon: <Calendar size={20} />, color: '#f97316',
                                        },
                                        {
                                            title: 'Noctambule',
                                            description: 'Étudiez après 22h (mode sombre recommandé !).',
                                            unlocked: badgeList.includes('Noctambule'),
                                            icon: <Moon size={20} />, color: '#6366f1',
                                        },
                                        {
                                            title: 'Polyglotte',
                                            description: 'Utilisez l\'IA en au moins 2 langues différentes.',
                                            unlocked: badgeList.includes('Polyglotte'),
                                            icon: <Globe size={20} />, color: '#14b8a6',
                                        },
                                        {
                                            title: 'Série de 7 jours',
                                            description: 'Connectez-vous 7 jours consécutifs.',
                                            unlocked: badgeList.includes('Série de 7 jours'),
                                            icon: <Flame size={20} />, color: '#dc2626',
                                        },
                                        {
                                            title: 'Maître QCM',
                                            description: 'Complétez 20 QCM au total.',
                                            unlocked: badgeList.includes('Maître QCM'),
                                            icon: <Trophy size={20} />, color: '#eab308',
                                        },
                                        {
                                            title: 'Résumeur Expert',
                                            description: 'Générez 10 résumés avec l\'IA.',
                                            unlocked: badgeList.includes('Résumeur Expert'),
                                            icon: <PenTool size={20} />, color: '#a855f7',
                                        },
                                        {
                                            title: 'Curieux',
                                            description: 'Posez 15 questions à l\'IA.',
                                            unlocked: badgeList.includes('Curieux'),
                                            icon: <Lightbulb size={20} />, color: '#0ea5e9',
                                        },
                                        {
                                            title: 'Perfectionniste',
                                            description: 'Score moyen QCM supérieur à 80%.',
                                            unlocked: badgeList.includes('Perfectionniste'),
                                            icon: <Gem size={20} />, color: '#ec4899',
                                        },
                                        {
                                            title: 'Champion GeniLocal',
                                            description: 'Débloquez 10 badges pour devenir Champion !',
                                            unlocked: badgeList.filter(b => [
                                                'Premier utilisation', '+5 matières ajoutées', 'Explorateur IA',
                                                'Marathonien', 'QCM Parfait', 'Importateur OCR', 'Organisateur',
                                                'Noctambule', 'Polyglotte', 'Série de 7 jours', 'Maître QCM',
                                                'Résumeur Expert', 'Curieux', 'Perfectionniste'
                                            ].includes(b)).length >= 10,
                                            icon: <Crown size={20} />, color: '#d97706',
                                        },
                                        ];
                                        const unlockedBadges = badgesData.filter(b => b.unlocked);
                                        const displayedBadges = showAllBadges ? badgesData : unlockedBadges.slice(0, 3);
                                        const showToggleButton = badgesData.length > 3 || unlockedBadges.length > 3;
                                        return (
                                            <>
                                                {displayedBadges.map(item => (
                                        <div key={item.title} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', 
                                            background: item.unlocked 
                                                ? `${item.color}10` 
                                                : (dark ? '#08101a' : '#f8fafc'), 
                                            borderRadius: 18,
                                            border: `1px solid ${item.unlocked ? `${item.color}40` : T.cardBorder}`,
                                            transition: 'all 0.3s',
                                            opacity: item.unlocked ? 1 : 0.6,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 12,
                                                    background: item.unlocked 
                                                        ? `linear-gradient(135deg, ${item.color}, ${item.color}aa)` 
                                                        : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 18,
                                                    filter: item.unlocked ? 'none' : 'grayscale(1)',
                                                    boxShadow: item.unlocked ? `0 4px 12px ${item.color}30` : 'none',
                                                }}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: item.unlocked ? item.color : T.textOnCard }}>{item.title}</p>
                                                    <p style={{ margin: '3px 0 0', color: T.textOnCardMuted, fontSize: 11 }}>{item.description}</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                minWidth: 76,
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                textAlign: 'center',
                                                background: item.unlocked ? item.color : (dark ? 'rgba(255,255,255,0.05)' : T.card),
                                                color: item.unlocked ? '#fff' : T.textOnCardMuted,
                                                fontWeight: 700,
                                                fontSize: 11,
                                            }}>
                                                {item.unlocked ? '✓ Débloqué' : '🔒 Verrouillé'}
                                            </span>
                                        </div>
                                                ))}
                                                {showToggleButton && (
                                                    <button
                                                        onClick={() => setShowAllBadges(!showAllBadges)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            borderRadius: 14,
                                                            border: `1px solid ${T.cardBorder}`,
                                                            background: dark ? `${T.accent}10` : `${T.accent}0a`,
                                                            color: T.accent,
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            marginTop: 8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: 8,
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        {showAllBadges ? 'Voir moins' : `Voir tous les badges (${badgesData.length})`}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* ─── Right column ─── */}
                        <div style={{
                            background: T.card, border: `1px solid ${T.cardBorder}`,
                            borderRadius: 28, padding: '36px 32px',
                            boxShadow: T.cardShadow,
                            animation: 'fadeSlideUp .5s .15s ease both', opacity: 0, animationFillMode: 'forwards',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: T.accent, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.06 }} />

                            {/* Section header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: T.textOnCard, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.accent}20`, border: `1px solid ${T.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                                        <User size={20} />
                                    </div>
                                    Informations personnelles
                                </h3>
                                {saved && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,100,0.15)', border: '1px solid rgba(0,212,100,0.3)', color: '#00d464', padding: '8px 16px', borderRadius: 50, fontWeight: 700, fontSize: 14, animation: 'savedPop .4s ease both' }}>
                                        <CheckCircle2 size={16} /> Sauvegardé !
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: 14, fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Form 2 cols */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                {field('Nom complet', <User size={13} />, 'fullname')}
                                {field('Email', <Mail size={13} />, 'email', 'email')}
                                {field('Téléphone', <Phone size={13} />, 'phone', 'tel', '+213 ...')}
                                {field('Date de naissance', <Calendar size={13} />, 'birthdate', 'date')}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {field('Institution', <School size={13} />, 'institution')}
                                {field('Région', <Globe size={13} />, 'region')}

                                {/* Level select */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: T.labelColor, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        <GraduationCap size={13} /> Niveau d'études
                                    </label>
                                    <select value={formData.level} onChange={e => setFormData(p => ({ ...p, level: e.target.value }))}
                                        style={{ background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 14, padding: '13px 16px', color: T.text, fontSize: 15, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', width: '100%' }}
                                        onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocus}`; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Objective */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: T.labelColor, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        <Target size={13} /> Objectif d'apprentissage
                                    </label>
                                    <textarea placeholder="Décrivez vos objectifs académiques..." value={formData.objective}
                                        onChange={e => setFormData(p => ({ ...p, objective: e.target.value }))} rows={4}
                                        style={{ background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 14, padding: '13px 16px', color: T.text, fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box' }}
                                        onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.inputFocus}`; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            {/* Save button */}
                            <button onClick={handleSave} disabled={loading}
                                style={{ marginTop: 32, width: '100%', background: loading ? T.inputBg : T.saveBtnGrad, color: loading ? T.textMuted : T.saveBtnText, border: 'none', padding: '18px', borderRadius: 18, fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .3s', boxShadow: loading ? 'none' : `0 8px 28px ${T.accent}40` }}
                                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                            >
                                {loading
                                    ? <><span style={{ display: 'inline-block', width: 18, height: 18, border: `2px solid ${T.textMuted}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Enregistrement...</>
                                    : <><Save size={18} /> Enregistrer les modifications</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;