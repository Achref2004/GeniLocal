import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Animations décoratives ────────────────────────────────────────────────
export const STARS = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 4).toFixed(2)}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: Math.random() > 0.85 ? 2.5 : Math.random() > 0.6 ? 1.5 : 1,
}));

export const BIRDS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    top: `${8 + Math.random() * 75}%`,
    duration: `${18 + Math.random() * 22}s`,
    delay: `${(Math.random() * 20).toFixed(1)}s`,
    scale: 0.5 + Math.random() * 0.9,
    rtl: Math.random() > 0.5,
    wingSpeed: `${0.4 + Math.random() * 0.5}s`,
}));

// ─── Palettes ────────────────────────────────────────────────────────────────
export const LIGHT = {
    bg: '#cae1f8ff',
    card: '#ffffff',
    cardAlt: '#0378b2',
    accent: '#008c94',
    accentSoft: '#6de8ef',
    text: '#001f3f',
    textMuted: '#03a8d1',
    textOnCard: '#001f3f',
    textOnCardMuted: 'rgba(0,31,63,0.65)',
    border: 'rgba(0,200,212,0.18)',
    sidebarBg: 'rgba(255,255,255,0.85)',
    sidebarBorder: 'rgba(0,200,212,0.2)',
    iconInactive: '#003d7a',
    iconInactiveBg: '#e0eaf2',
    // Profile extras
    bgGrad: 'linear-gradient(135deg, #cae1f8 0%, #dff0fb 50%, #eef3f8 100%)',
    cardBorder: 'rgba(0,200,212,0.15)',
    cardShadow: '0 8px 40px rgba(11,42,74,0.08)',
    inputBg: 'rgba(0,31,63,0.04)',
    inputBorder: 'rgba(0,200,212,0.25)',
    inputFocus: 'rgba(0,200,212,0.5)',
    labelColor: '#003d7a',
    statBg: 'rgba(0,200,212,0.08)',
    avatarGrad: 'linear-gradient(135deg, #00c8d4, #001f3f)',
    saveBtnGrad: 'linear-gradient(135deg, #00c8d4, #6de8ef)',
    saveBtnText: '#001f3f',
    backBtn: '#001f3f',
    isDark: false,
};

export const DARK = {
    bg: '#080c10',
    card: '#0f1520',
    cardAlt: '#111825',
    accent: '#00d4e0',
    accentSoft: '#6de8ef',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.55)',
    textOnCard: '#ffffff',
    textOnCardMuted: 'rgba(255,255,255,0.55)',
    border: 'rgba(0,212,224,0.12)',
    sidebarBg: 'rgba(15,21,32,0.85)',
    sidebarBorder: 'rgba(0,212,224,0.12)',
    iconInactive: 'rgba(0,212,224,0.4)',
    iconInactiveBg: 'rgba(255,255,255,0.05)',
    // Profile extras
    bgGrad: 'linear-gradient(135deg, #080c10 0%, #0a1018 50%, #080c10 100%)',
    cardBorder: 'rgba(0,212,224,0.1)',
    cardShadow: '0 8px 40px rgba(0,0,0,0.4)',
    inputBg: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(0,212,224,0.15)',
    inputFocus: 'rgba(0,212,224,0.4)',
    labelColor: 'rgba(255,255,255,0.6)',
    statBg: 'rgba(0,212,224,0.07)',
    avatarGrad: 'linear-gradient(135deg, #00d4e0, #0b2a4a)',
    saveBtnGrad: 'linear-gradient(135deg, #00d4e0, #6de8ef)',
    saveBtnText: '#0b2a4a',
    backBtn: 'rgba(255,255,255,0.7)',
    isDark: true,
};

export type ThemePalette = typeof LIGHT;

// ─── Context ─────────────────────────────────────────────────────────────────
interface ThemeContextType {
    dark: boolean;
    toggleTheme: () => void;
    T: ThemePalette;
}

const ThemeContext = createContext<ThemeContextType>({
    dark: false,
    toggleTheme: () => {},
    T: LIGHT,
});

// ─── Provider ────────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dark, setDark] = useState(() => {
        // Persist theme in localStorage
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = () => {
        setDark(d => {
            const next = !d;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const T = dark ? DARK : LIGHT;

    return (
        <ThemeContext.Provider value={{ dark, toggleTheme, T }}>
            {children}
        </ThemeContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);