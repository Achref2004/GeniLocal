import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Brain, Calendar, User, BookOpen, X, Menu,
} from 'lucide-react';

// ─── Interface mise à jour pour correspondre au backend FastAPI ───────────
export interface UserProfile {
    username: string;
    fullname?: string;
    email: string;
    level?: string;
}

interface ThemePalette {
    accent: string;
    accentSoft: string;
    text: string;
    textMuted: string;
    sidebarBg: string;
    sidebarBorder: string;
    iconInactive: string;
    iconInactiveBg: string;
}

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;
    user: UserProfile | null;
    T: ThemePalette;
}

const NAV_ITEMS = [
    { id: 'resume', icon: <Home size={22} />, title: 'Résumé', subtitle: 'Aperçu & suivi', route: null },
    { id: 'raisonnement', icon: <Brain size={22} />, title: 'Raisonnement', subtitle: 'IA & étude', route: '/raisonnement' },
    { id: 'profil', icon: <User size={22} />, title: 'Profil', subtitle: 'Vos paramètres', route: '/profile' },
    { id: 'planning', icon: <Calendar size={22} />, title: 'Planning', subtitle: 'Organisation', route: null },
];

// ─── Génère les initiales intelligentes depuis fullname ou username ────────
const getInitials = (user: UserProfile | null): string => {
    if (!user) return 'ET';
    const name = user.fullname || user.username;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    isSidebarExpanded,
    setIsSidebarExpanded,
    user,
    T,
}) => {
    const navigate = useNavigate();

    const initials = getInitials(user);
    const displayName = user?.fullname || user?.username || 'Étudiant';
    const displaySub = user?.level || 'Compte Basique';

    return (
        <aside style={{
            width: isSidebarExpanded ? 280 : 90,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0 24px 20px',
            zIndex: 10,
            transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
            <div style={{
                background: T.sidebarBg,
                border: `1px solid ${T.sidebarBorder}`,
                borderRadius: 36,
                padding: isSidebarExpanded ? '32px 20px' : '32px 14px',
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 16,
                backdropFilter: 'blur(24px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                overflow: 'hidden',
            }}>

                {/* ── Toggle Expand / Collapse ── */}
                <button
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    style={{
                        position: 'absolute',
                        top: 24,
                        right: isSidebarExpanded ? 20 : '50%',
                        transform: isSidebarExpanded ? 'none' : 'translateX(50%)',
                        width: 32, height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(128,128,128,0.1)',
                        color: T.text,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                        zIndex: 2,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(128,128,128,0.2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(128,128,128,0.1)'; }}
                >
                    {isSidebarExpanded ? <X size={16} /> : <Menu size={16} />}
                </button>

                {/* ── Navigation ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginTop: 46 }}>
                    {NAV_ITEMS.map(({ id, icon, title, subtitle }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                title={title}
                                onClick={() => {
                                    if (id === 'profil') navigate('/profile');
                                    else if (id === 'raisonnement') navigate('/raisonnement');
                                    else setActiveTab(id);
                                }}
                                style={{
                                    width: '100%',
                                    height: isSidebarExpanded ? 64 : 56,
                                    borderRadius: 20,
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                                    padding: isSidebarExpanded ? '0 16px' : '0',
                                    background: isActive
                                        ? `linear-gradient(135deg,${T.accentSoft},${T.accent})`
                                        : 'transparent',
                                    color: isActive ? '#0b2a4a' : T.text,
                                    boxShadow: isActive ? `0 6px 20px ${T.accent}50` : 'none',
                                    transition: 'all .25s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >

                                {/* Icône */}
                                <div style={{
                                    width: 40, height: 40,
                                    borderRadius: 12,
                                    flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isActive ? 'rgba(255,255,255,0.2)' : T.iconInactiveBg,
                                    color: isActive ? '#0b2a4a' : T.iconInactive,
                                    transition: 'all .25s',
                                }}>
                                    {icon}
                                </div>

                                {/* Label + Subtitle (expanded) */}
                                {isSidebarExpanded && (
                                    <div style={{ marginLeft: 14, textAlign: 'left', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span style={{ fontWeight: 700, fontSize: 15, color: isActive ? '#fff' : T.text }}>{title}</span>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'rgba(255,255,255,0.7)' : T.textMuted }}>{subtitle}</span>
                                    </div>
                                )}

                                {/* Point actif */}
                                {isSidebarExpanded && isActive && (
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #fff' }} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Section Utilisateur (données depuis le backend) ── */}
                {isSidebarExpanded ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        marginTop: 'auto', padding: '16px 8px 8px',
                        borderTop: `1px solid ${T.sidebarBorder}`,
                    }}>
                        {/* Avatar initiales */}
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: T.accentSoft,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#0b2a4a', fontWeight: 800, fontSize: 16, flexShrink: 0,
                        }}>
                            {initials}
                        </div>

                        {/* fullname (ou username) + level */}
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{
                                fontWeight: 700, fontSize: 14, color: T.text,
                                whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                            }}>
                                {displayName}
                            </span>
                            <span style={{
                                fontSize: 11, color: T.textMuted,
                                whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                            }}>
                                {displaySub}
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Avatar seul en mode collapsed */
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: T.accentSoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#0b2a4a', fontWeight: 800, fontSize: 16,
                        marginTop: 'auto', marginInline: 'auto',
                    }}>
                        {initials}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;