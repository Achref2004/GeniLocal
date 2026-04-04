import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    User, Mail, Phone, Calendar, School, Target,
    GraduationCap, Camera, Star, Save, Sparkles, CheckCircle2, Globe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../reutilisable/Themecontext';
import Sidebar, { UserProfile } from '../reutilisable/Sidebar';

const STARS = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 4).toFixed(2)}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: Math.random() > 0.85 ? 2.5 : Math.random() > 0.6 ? 1.5 : 1,
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

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { dark, T } = useTheme();
    const token = localStorage.getItem('token');

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullname: '', email: '', phone: '',
        birthdate: '', institution: '', region: '', level: 'Licence 3', objective: '',
    });

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        axios.get('http://127.0.0.1:8000/users/me', {
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

    const handleSave = async () => {
        setLoading(true); setError(''); setSaved(false);
        try {
            const res = await axios.put('http://127.0.0.1:8000/users/me', formData, {
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

            <style>{`
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

            {/* ── Stars ── */}
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

            {/* ── Birds ── */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {BIRDS.map(b => (
                    <div key={b.id} style={{
                        position: 'absolute', top: b.top,
                        left: b.rtl ? 'auto' : '-80px',
                        right: b.rtl ? '-80px' : 'auto',
                        animation: `${b.rtl ? 'birdFlyRtl' : 'birdFly'} ${b.duration} ${b.delay} linear infinite`,
                        opacity: dark ? 0.13 : 0.18,
                    }}>
                        <svg width={`${54 * b.scale}`} height={`${28 * b.scale}`} viewBox="0 0 54 28" fill="none">
                            <path d="M27 14 Q14 2 2 8" stroke={dark ? '#ffffff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none"
                                style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                            <path d="M27 14 Q40 2 52 8" stroke={dark ? '#ffffff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none"
                                style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                        </svg>
                    </div>
                ))}
            </div>

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
                                    <p style={{ color: T.textOnCardMuted, fontSize: 13, marginTop: 10, textAlign: 'center', fontWeight: 500 }}>
                                        🏛️ {formData.institution}
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
                                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textOnCardMuted, fontWeight: 700, marginBottom: 20 }}>
                                    📈 Mes performances
                                </p>
                                {[
                                    { icon: '📚', label: 'Cours suivis', value: '8' },
                                    { icon: '⏱️', label: 'Heures totales', value: '127h' },
                                    { icon: '🏆', label: 'Score moyen QCM', value: '84%' },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '13px 16px', background: T.statBg,
                                        borderRadius: 14, marginBottom: 10, fontSize: 14,
                                        border: `1px solid ${T.cardBorder}`,
                                    }}>
                                        <span style={{ color: T.textOnCardMuted, display: 'flex', alignItems: 'center', gap: 8 }}>{icon} {label}</span>
                                        <b style={{ color: T.accent, fontSize: 16 }}>{value}</b>
                                    </div>
                                ))}
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