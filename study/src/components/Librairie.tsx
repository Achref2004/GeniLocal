import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Download, CheckCircle2, Clock, Maximize2,
    Moon, Play, Pause, RotateCcw, Search, Star, BookMarked,
    Feather, Scroll, ChevronLeft, WifiOff, Coffee,
    Volume2, Settings2, Type, AlignJustify, Leaf, Waves,
    FileText, Sparkles, Filter, AlertCircle, X, Sun,
    Headphones, StopCircle, ChevronDown, ChevronUp, Mic,
} from 'lucide-react';
import { useTheme } from '../reutilisable/Themecontext';
import Sidebar, { UserProfile } from '../reutilisable/Sidebar';

/* ─────────────────────────── Types ─────────────────────────── */
type BookCategory = 'tous' | 'roman' | 'histoire' | 'nouvelle' | 'science' | 'philosophie';
type EyeTheme = 'night' | 'sepia' | 'forest' | 'ocean' | 'paper';

interface Book {
    id: number; title: string; author: string; category: BookCategory;
    cover: string; rating: number; pages: number; description: string;
    excerpt: string; tags: string[];
}

/* ─────────────────────── Eye-comfort themes ─────────────────── */
const EYE_THEMES: Record<EyeTheme, {
    bg: string; surface: string; text: string;
    textMuted: string; border: string; label: string;
    icon: React.ReactNode; accent: string;
}> = {
    night: { bg: '#0d1117', surface: '#161b22', text: '#e6edf3', textMuted: '#7d8590', border: '#30363d', label: 'Nuit', icon: <Moon size={13} />, accent: '#58a6ff' },
    sepia: { bg: '#f5ede0', surface: '#ede3d0', text: '#3e2c1a', textMuted: '#7a6045', border: '#c8a87a', label: 'Sépia', icon: <Coffee size={13} />, accent: '#a0522d' },
    forest: { bg: '#0f1f0e', surface: '#152214', text: '#b8d4a8', textMuted: '#6a8f60', border: '#2d4a2d', label: 'Forêt', icon: <Leaf size={13} />, accent: '#4caf50' },
    ocean: { bg: '#060d1a', surface: '#0d1b2e', text: '#a8c8e8', textMuted: '#4a7a9b', border: '#1a3a5c', label: 'Océan', icon: <Waves size={13} />, accent: '#00b4d8' },
    paper: { bg: '#faf8f4', surface: '#f0ece4', text: '#2c2416', textMuted: '#7a6e5a', border: '#d4c8b0', label: 'Papier', icon: <FileText size={13} />, accent: '#6b5b3e' },
};

/* ──────────────────────── Book content ──────────────────────── */
const BOOKS: Book[] = [
    {
        id: 1, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry',
        category: 'roman', cover: 'linear-gradient(135deg,#667eea,#764ba2)',
        rating: 4.9, pages: 96, tags: ['classique', 'poésie', 'philosophie'],
        description: "Un pilote en panne dans le Sahara rencontre un mystérieux enfant venu des étoiles.",
        excerpt: `Il y a de cela six ans déjà que mon ami s'en est allé avec son mouton. Si j'essaie ici de le décrire, c'est afin de ne pas l'oublier. C'est triste d'oublier un ami. Tout le monde n'a pas eu un ami.

Le narrateur, pilote d'avion, est contraint d'atterrir en urgence dans le désert du Sahara à la suite d'une panne de moteur. Au matin du premier jour, il est réveillé par une petite voix étrange qui lui demande de lui dessiner un mouton.

C'est ainsi que commence sa rencontre avec le Petit Prince, un être venu d'une lointaine planète — la planète B-612 — qui s'est mis en route pour explorer l'univers. Sur sa planète, il avait une fleur unique, une rose d'une beauté extraordinaire mais d'une vanité tout aussi grande. Il l'aimait, la soignait, mais ses caprices l'avaient blessé.

Sur Terre, il rencontra le renard, qui lui apprit la signification de l'apprivoisement : "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux."

Cette phrase, simple comme une évidence, changea tout pour le Petit Prince. Il comprit alors la responsabilité que l'on a envers ceux qu'on a apprivoisés. Et quand le serpent l'appela vers les étoiles, le pilote comprit que les étoiles ne seraient plus jamais les mêmes — dans l'une d'elles, quelque part, un petit bonhomme riait.`,
    },
    {
        id: 2, title: "L'Étranger", author: 'Albert Camus',
        category: 'roman', cover: 'linear-gradient(135deg,#f093fb,#f5576c)',
        rating: 4.7, pages: 186, tags: ['absurde', 'existentialisme', 'algérie'],
        description: "Meursault, indifférent au monde, tue un Arabe sur une plage algérienne.",
        excerpt: `Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas. J'ai reçu un télégramme de l'asile : "Mère décédée. Enterrement demain. Sentiments distingués." Cela ne veut rien dire. C'était peut-être hier.

Le soleil était déjà haut dans le ciel quand nous sommes arrivés au village. La chaleur était telle qu'elle semblait écraser tout, vider les rues et rendre le monde silencieux.

Meursault regardait tout cela avec la même neutralité qu'il portait en lui — cette indifférence douce, presque sereine, qui lui était si naturelle. Il n'avait pas à s'expliquer. Le monde existait. C'était suffisant.

La mer, le soleil, le sable chaud sous ses pieds. L'Arabe était là. Meursault avait le revolver. Il a tiré. Puis il a tiré encore quatre fois sur un corps inerte. Et il a su que, par cet acte absurde, il avait détruit l'équilibre du jour.

C'est alors que tout a commencé — le procès, les questions, la société qui cherchait un sens là où il n'y en avait pas.`,
    },
    {
        id: 3, title: 'Mille et Une Nuits', author: 'Anonyme',
        category: 'histoire', cover: 'linear-gradient(135deg,#ffd89b,#19547b)',
        rating: 4.8, pages: 1024, tags: ['oriental', 'contes', 'magie'],
        description: "Shéhérazade raconte chaque nuit une histoire pour retarder son exécution.",
        excerpt: `Il y avait autrefois, dans les pays de l'Inde et de la Chine, un puissant roi nommé Shahryar. Ayant découvert la trahison de sa femme, il prit la résolution d'épouser chaque nuit une nouvelle vierge et de la faire mettre à mort le lendemain matin.

Contre la volonté de son père désespéré, Shéhérazade se porta volontaire. Son plan était secret et audacieux : avant l'aube, sa sœur cadette lui demanderait de raconter une histoire. Et cette histoire serait si captivante, si pleine de mystère, que le roi voudrait en connaître la suite.

Ainsi commença la plus extraordinaire collection de récits que le monde ait jamais connue. Sinbad le marin et ses sept voyages au bout du monde. Ali Baba et les quarante voleurs cachés dans leurs jarres d'huile. Aladin et sa lampe merveilleuse dont le génie exauçait trois vœux.

Mille et une nuits de magie pure, où la parole avait le pouvoir de donner la vie — et de la sauver.`,
    },
    {
        id: 4, title: 'Boule de Suif', author: 'Guy de Maupassant',
        category: 'nouvelle', cover: 'linear-gradient(135deg,#a8edea,#fed6e3)',
        rating: 4.6, pages: 64, tags: ['guerre', 'société', 'naturalisme'],
        description: "Pendant la guerre franco-prussienne, une diligence transporte des réfugiés de Rouen.",
        excerpt: `Pendant plusieurs jours de suite des lambeaux d'armée en déroute avaient traversé la ville. Ce n'était point de la troupe, mais des hordes débandées. Les hommes avaient la barbe longue et sale, les uniformes en guenilles.

Dans la diligence qui quittait Rouen pour Dieppe se trouvaient réunis des personnages que les circonstances avaient étrangement rassemblés. Il y avait deux ménages de commerçants, une vieille nonne — et elle : Élisabeth Rousset, surnommée Boule de Suif.

Les bourgeois la regardaient de haut. Mais quand elle sortit de son panier un déjeuner abondant — poulet rôti, pâtés, fruits et vins — et proposa de partager avec ses voisins affamés, quelque chose changea.

La chaleur humaine, la vraie, n'a pas d'adresse fixe. Elle surgit là où on ne l'attend pas, au cœur de l'humiliation et de la nécessité.`,
    },
    {
        id: 5, title: 'Conte de Noël', author: 'Charles Dickens',
        category: 'nouvelle', cover: 'linear-gradient(135deg,#f6d365,#fda085)',
        rating: 4.8, pages: 104, tags: ['noël', 'fantôme', 'rédemption'],
        description: "Scrooge, vieil avare, est visité par trois esprits lors de la nuit de Noël.",
        excerpt: `Marley était mort, pour commencer. Là-dessus, pas le moindre doute. Scrooge l'avait signé de son nom dans le registre de son enterrement.

Oh ! mais Scrooge était un harpagon, un arracheur, un serrant, un avare. Dur et tranchant comme un silex, jamais le silex ne rend une étincelle de chaleur généreuse. Le froid qu'il portait en lui glaçait ses vieux traits.

Ce soir-là, dans sa chambre froide et sombre, Scrooge vit la chaîne. La chaîne que son défunt associé Marley portait — forgée de caisses-enregistreuses, de clefs, de cadenas, de livres de comptes et de lourdes bourses d'acier.

"Tu seras visité par trois esprits," dit Marley. Et dans la nuit la plus longue de l'année, Scrooge voyagea à travers le temps. Son passé douloureux. Son présent injuste. Son avenir solitaire. Et au matin de Noël, un homme nouveau naquit des cendres du vieil avare.`,
    },
    {
        id: 6, title: 'Les Misérables', author: 'Victor Hugo',
        category: 'roman', cover: 'linear-gradient(135deg,#30cfd0,#330867)',
        rating: 4.9, pages: 1488, tags: ['révolution', 'justice', 'amour'],
        description: "Jean Valjean, ancien forçat, cherche la rédemption dans la France du XIXe siècle.",
        excerpt: `En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.

La vie de M. Myriel était toute de bonté. Sa maison était un lieu de passage pour tous les misérables.

Par une nuit froide d'octobre, un homme frappa à sa porte. Un homme dont le passeport jaune criait : Jean Valjean. Forçat libéré. Dangereux.

L'évêque le fit entrer. Il lui donna à manger, à boire, un lit. Et le lendemain matin, quand Valjean fut parti avec l'argenterie volée, et que les gendarmes le ramenèrent, l'évêque dit simplement : "Je lui avais donné ces chandeliers aussi."

Ce geste de pardon bouleversa Valjean pour l'éternité. C'est là que commença sa longue marche vers la lumière, à travers les barricades et les poursuites sans fin de l'inspecteur Javert.`,
    },
    {
        id: 7, title: "L'Alchimiste", author: 'Paulo Coelho',
        category: 'roman', cover: 'linear-gradient(135deg,#f7971e,#ffd200)',
        rating: 4.7, pages: 208, tags: ['voyage', 'destin', 'spirituel'],
        description: "Santiago, un berger andalou, part en quête de son trésor personnel.",
        excerpt: `Le garçon s'appelait Santiago. Le soleil se couchait lorsqu'il arriva avec son troupeau devant une vieille église abandonnée.

Cette nuit-là, il fit à nouveau le même rêve : un enfant le transportait jusqu'aux Pyramides d'Égypte et lui disait qu'un trésor était caché là.

La vieille femme lui dit que le rêve était le langage de Dieu. Et le vieux roi de Salem lui donna deux pierres. "Quand tu veux quelque chose, dit-il, tout l'Univers conspire à te permettre de réaliser ton désir."

Santiago traversa l'Afrique, apprit à écouter son cœur, trouva l'amour dans une oasis et fut initié par l'Alchimiste aux secrets de l'Âme du Monde.

Et le trésor qu'il cherchait depuis si longtemps ? Il était là où son voyage avait commencé.`,
    },
    {
        id: 8, title: 'La Nausée', author: 'Jean-Paul Sartre',
        category: 'philosophie', cover: 'linear-gradient(135deg,#4facfe,#00f2fe)',
        rating: 4.5, pages: 248, tags: ['existentialisme', 'journal', 'conscience'],
        description: "Antoine Roquentin décrit dans son journal sa révolte contre l'existence.",
        excerpt: `La chose la plus étrange, c'est que ça a commencé par les mains. Depuis quelques jours, je remarque des choses. Pas des choses extraordinaires — des choses ordinaires.

J'avais ramassé un galet sur la plage. Et j'ai senti quelque chose. Une espèce de nausée dans les mains. C'est dans les mains que ça a commencé.

Je suis entré dans le café Mably. J'ai regardé les mains de la serveuse — ces mains qui essuyaient le comptoir, automatiquement, mécaniquement — et j'ai pensé : voilà. C'est ça l'existence. Ces gestes. Ces habitudes.

L'existence précède l'essence. Nous sommes condamnés à exister avant d'avoir pu choisir qui nous sommes. Et cette condamnation à être libre, c'est la source de toute angoisse authentique.`,
    },
    {
        id: 9, title: 'Candide', author: 'Voltaire',
        category: 'philosophie', cover: 'linear-gradient(135deg,#43e97b,#38f9d7)',
        rating: 4.6, pages: 120, tags: ['satire', 'voyage', 'optimisme'],
        description: "Candide parcourt le monde et découvre que tout n'est pas pour le mieux.",
        excerpt: `Il y avait en Westphalie, dans le château de M. le baron de Thunder-ten-tronckh, un jeune garçon à qui la nature avait donné les mœurs les plus douces.

Son précepteur Pangloss était l'oracle de la maison, et le petit Candide écoutait ses leçons avec toute la bonne foi de son âge et de son caractère.

Pangloss enseignait la métaphysico-théologo-cosmolonigologie. Il prouvait admirablement qu'il n'y a point d'effet sans cause, et que, dans ce meilleur des mondes possibles, tout est au mieux.

Mais Candide, chassé du paradis de son enfance, allait découvrir que le monde réel ressemble peu aux leçons de Pangloss. La guerre, l'esclavage, le tremblement de terre de Lisbonne — chaque catastrophe ébranlerait un peu plus sa foi en l'optimisme universel.`,
    },
    {
        id: 10, title: 'Dracula', author: 'Bram Stoker',
        category: 'histoire', cover: 'linear-gradient(135deg,#1a1a2e,#e94560)',
        rating: 4.6, pages: 418, tags: ['horreur', 'vampire', 'mystère'],
        description: "Jonathan Harker se rend en Transylvanie chez le mystérieux comte Dracula.",
        excerpt: `3 mai. Bistritz. — J'ai quitté Munich à 8h35 p.m., le 1er mai, arrivant à Vienne le lendemain matin de bonne heure ; j'aurais dû rester là jusqu'au surlendemain matin, mais le train avait du retard.

Je semblais entrer dans un pays plein d'étranges superstitions. Les gens, dans le train, avaient appris que j'allais au col de Borgo, et ils avaient fait sur moi des signes de croix en murmurant des prières.

Le château était sur le bord d'un terrible précipice. Pas un rayon de lumière nulle part. Une immense obscurité semblait recouvrir tout le paysage. La porte s'ouvrit. Un vieillard grand et maigre, au visage imberbe sauf une longue moustache blanche, et vêtu de noir de la tête aux pieds, se tenait devant moi.

"Entrez librement et de votre propre gré !" dit-il. Et sa poignée de main froide comme la glace me fit frissonner.`,
    },
    {
        id: 11, title: 'Les Fleurs du Mal', author: 'Charles Baudelaire',
        category: 'nouvelle', cover: 'linear-gradient(135deg,#8e2de2,#4a00e0)',
        rating: 4.8, pages: 160, tags: ['poésie', 'beauté', 'mélancolie'],
        description: "Recueil de poèmes explorant la beauté, le mal et la condition humaine.",
        excerpt: `Au lecteur — La sottise, l'erreur, le péché, la lésine, Occupent nos esprits et travaillent nos corps, Et nous alimentons nos aimables remords, Comme les mendiants nourrissent leur vermine.

Spleen — J'ai plus de souvenirs que si j'avais mille ans. Un gros meuble à tiroirs encombré de bilans, De vers, de billets doux, de procès, de romances, Avec de lourds cheveux roulés dans des quittances, Cache moins de secrets que mon triste cerveau.

L'Invitation au Voyage — Mon enfant, ma sœur, Songe à la douceur D'aller là-bas vivre ensemble ! Aimer à loisir, Aimer et mourir Au pays qui te ressemble !

Correspondances — La Nature est un temple où de vivants piliers Laissent parfois sortir de confuses paroles ; L'homme y passe à travers des forêts de symboles Qui l'observent avec des regards familiers.`,
    },
    {
        id: 12, title: 'Le Tour du Monde en 80 Jours', author: 'Jules Verne',
        category: 'histoire', cover: 'linear-gradient(135deg,#11998e,#38ef7d)',
        rating: 4.7, pages: 288, tags: ['aventure', 'voyage', 'steampunk'],
        description: "Phileas Fogg parie qu'il peut faire le tour du monde en 80 jours.",
        excerpt: `Phileas Fogg demeurait, en 1872, au n° 7 de Saville-row, Burlington Gardens — la maison dans laquelle Sheridan mourut en 1814. C'était un des membres les plus singuliers et les plus remarqués du Reform-Club de Londres.

On ne savait rien de lui, sinon que c'était un fort galant homme, et l'un des plus beaux gentlemen de la haute société anglaise.

Le 2 octobre, à onze heures moins vingt, Phileas Fogg quitta Saville-row, et après avoir posé cinquante fois le pied gauche devant le pied droit et cinquante fois le pied droit devant le pied gauche, il arriva au Reform-Club.

"Je parierais vingt mille livres sterling que je ferai le tour du monde en quatre-vingts jours ou moins," dit-il calmement. Le monde entier fut lancé à sa poursuite. Et avec son fidèle serviteur Passepartout, l'aventure la plus extraordinaire du siècle commença.`,
    },
];

/* ──────────────────── Background particles ──────────────────── */
const STARS_BG = Array.from({ length: 60 }, (_, i) => ({
    id: i, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 3).toFixed(2)}s`, size: Math.random() > 0.8 ? 2 : 1,
}));
const BIRDS = Array.from({ length: 12 }, (_, i) => ({
    id: i, top: `${8 + Math.random() * 75}%`,
    duration: `${18 + Math.random() * 22}s`, delay: `${(Math.random() * 20).toFixed(1)}s`,
    scale: 0.5 + Math.random() * 0.9, rtl: Math.random() > 0.5,
    wingSpeed: `${0.4 + Math.random() * 0.5}s`,
}));

/* ═══════════════════════ Main Component ═══════════════════════ */
const Librairie: React.FC = () => {
    const navigate = useNavigate();
    const { dark, T } = useTheme();

    /* ── Sidebar ── */
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    /* ── Library ── */
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<BookCategory>('tous');
    const [downloaded, setDownloaded] = useState<number[]>([]);
    const [downloading, setDownloading] = useState<number[]>([]);

    /* ── Focus mode ── */
    const [focusBook, setFocusBook] = useState<Book | null>(null);
    const [eyeTheme, setEyeTheme] = useState<EyeTheme>('night');
    const [fontSize, setFontSize] = useState(19);
    const [lineHeight, setLineHeight] = useState(2.0);
    const [showPanel, setShowPanel] = useState<'timer' | 'voice' | 'settings' | null>('timer');

    /* ── Timer ── */
    const PRESETS = [15, 25, 45, 60];
    const [selectedPreset, setSelectedPreset] = useState(25);
    const [timerSec, setTimerSec] = useState(25 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerDone, setTimerDone] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── TTS ── */
    const [ttsActive, setTtsActive] = useState(false);
    const [ttsPaused, setTtsPaused] = useState(false);
    const [ttsRate, setTtsRate] = useState(0.9);
    const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [ttsSupported] = useState(() => 'speechSynthesis' in window);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const token = localStorage.getItem('token');

    /* ── Init ── */
    useEffect(() => {
        const saved = localStorage.getItem('downloaded_books');
        if (saved) setDownloaded(JSON.parse(saved));
        if (token) {
            fetch('http://127.0.0.1:8000/users/me', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).then(setUser).catch(() => { });
        }
        if (ttsSupported) {
            const load = () => {
                const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
                setVoices(v);
                const fr = v.find(v => v.lang.startsWith('fr'));
                if (fr) setTtsVoice(fr);
            };
            load();
            window.speechSynthesis.onvoiceschanged = load;
        }
    }, [token, ttsSupported]);

    /* ── Timer ── */
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSec(s => {
                    if (s <= 1) {
                        setTimerRunning(false);
                        setTimerDone(true);
                        setTimeout(() => setTimerDone(false), 3000);
                        return selectedPreset * 60;
                    }
                    return s - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerRunning, selectedPreset]);

    /* ── TTS ── */
    const startTTS = useCallback((book: Book) => {
        if (!ttsSupported) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(book.excerpt);
        u.lang = 'fr-FR'; u.rate = ttsRate; u.pitch = 1.0;
        if (ttsVoice) u.voice = ttsVoice;
        u.onend = () => { setTtsActive(false); setTtsPaused(false); };
        utteranceRef.current = u;
        window.speechSynthesis.speak(u);
        setTtsActive(true); setTtsPaused(false);
    }, [ttsSupported, ttsRate, ttsVoice]);

    const toggleTTS = useCallback(() => {
        if (!ttsSupported || !focusBook) return;
        if (!ttsActive) { startTTS(focusBook); }
        else if (ttsPaused) { window.speechSynthesis.resume(); setTtsPaused(false); }
        else { window.speechSynthesis.pause(); setTtsPaused(true); }
    }, [ttsActive, ttsPaused, ttsSupported, focusBook, startTTS]);

    const stopTTS = useCallback(() => {
        window.speechSynthesis.cancel();
        setTtsActive(false); setTtsPaused(false);
    }, []);

    useEffect(() => { if (!focusBook) stopTTS(); }, [focusBook, stopTTS]);

    /* ── Download (offline) ── */
    const handleDownload = (book: Book) => {
        if (downloaded.includes(book.id) || downloading.includes(book.id)) return;
        setDownloading(d => [...d, book.id]);
        setTimeout(() => {
            localStorage.setItem(`book_${book.id}`, JSON.stringify(book));
            const next = [...downloaded, book.id];
            setDownloaded(next);
            localStorage.setItem('downloaded_books', JSON.stringify(next));
            setDownloading(d => d.filter(id => id !== book.id));
        }, 2000);
    };

    const openFocus = (book: Book) => {
        const local = localStorage.getItem(`book_${book.id}`);
        setFocusBook(local ? JSON.parse(local) : book);
    };

    /* ── Filters ── */
    const filtered = BOOKS.filter(b => {
        const mc = category === 'tous' || b.category === category;
        const ms = b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase());
        return mc && ms;
    });

    const CATEGORIES: { id: BookCategory; label: string; icon: React.ReactNode }[] = [
        { id: 'tous', label: 'Tous', icon: <BookOpen size={13} /> },
        { id: 'roman', label: 'Romans', icon: <BookMarked size={13} /> },
        { id: 'histoire', label: 'Histoires', icon: <Scroll size={13} /> },
        { id: 'nouvelle', label: 'Nouvelles', icon: <Feather size={13} /> },
        { id: 'science', label: 'Sciences', icon: <Filter size={13} /> },
        { id: 'philosophie', label: 'Philosophie', icon: <Sparkles size={13} /> },
    ];

    /* ── Timer helpers ── */
    const totalSec = selectedPreset * 60;
    const progress = ((totalSec - timerSec) / totalSec) * 100;
    const R = 54, C = 2 * Math.PI * R;
    const timerDisplay = `${String(Math.floor(timerSec / 60)).padStart(2, '0')}:${String(timerSec % 60).padStart(2, '0')}`;
    const ET = EYE_THEMES[eyeTheme];

    /* ═══════════════════ FOCUS MODE ═════════════════════════════ */
    if (focusBook) {
        const isDl = downloaded.includes(focusBook.id);

        return (
            <div style={{
                minHeight: '100vh', height: '100vh', background: ET.bg, color: ET.text,
                fontFamily: "'Crimson Pro',Georgia,'Times New Roman',serif",
                display: 'flex', flexDirection: 'column', transition: 'background .6s,color .6s', overflow: 'hidden'
            }}>
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Sora:wght@400;500;600;700;800&display=swap');
          @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
          @keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 ${ET.accent}40}50%{box-shadow:0 0 0 8px ${ET.accent}00}}
          @keyframes waveBar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
          @keyframes timerDone{0%,100%{background:${ET.surface}}50%{background:${ET.accent}30}}
          .wave-bar{display:inline-block;width:3px;border-radius:3px;margin:0 1.5px;background:${ET.accent};transform-origin:bottom;animation:waveBar .7s ease-in-out infinite;}
          .wave-bar:nth-child(2){animation-delay:.1s;height:14px}
          .wave-bar:nth-child(3){animation-delay:.2s;height:20px}
          .wave-bar:nth-child(4){animation-delay:.3s;height:16px}
          .wave-bar:nth-child(5){animation-delay:.4s;height:10px}
          .wave-bar:nth-child(6){animation-delay:.5s;height:18px}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
          ::-webkit-scrollbar-thumb{background:${ET.text}25;border-radius:4px}
        `}</style>

                {/* ── Top bar ── */}
                <nav style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 28px', borderBottom: `1px solid ${ET.border}`,
                    background: ET.surface + 'e8', backdropFilter: 'blur(20px)',
                    position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
                    fontFamily: "'Sora',sans-serif"
                }}>

                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button onClick={() => setFocusBook(null)} style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: 'none', border: `1px solid ${ET.border}`, color: ET.textMuted,
                            padding: '7px 14px', borderRadius: 50, cursor: 'pointer', fontSize: 13,
                            fontFamily: 'inherit', fontWeight: 500, transition: 'all .2s'
                        }}
                            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = ET.text; b.style.color = ET.text; }}
                            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = ET.border; b.style.color = ET.textMuted; }}>
                            <ChevronLeft size={15} /> Bibliothèque
                        </button>
                        <div>
                            <span style={{ fontSize: 15, fontWeight: 700, color: ET.text, fontStyle: 'italic' }}>{focusBook.title}</span>
                            <span style={{ fontSize: 12, color: ET.textMuted, marginLeft: 8 }}>— {focusBook.author}</span>
                        </div>
                    </div>

                    {/* Center: eye themes */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: ET.bg + '80',
                        padding: '6px 12px', borderRadius: 12, border: `1px solid ${ET.border}`
                    }}>
                        {(Object.entries(EYE_THEMES) as [EyeTheme, typeof ET][]).map(([key, val]) => (
                            <button key={key} onClick={() => setEyeTheme(key)} title={val.label} style={{
                                width: 30, height: 30, borderRadius: 8,
                                border: `2px solid ${eyeTheme === key ? val.accent : val.border}`,
                                background: val.bg, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: val.text, transition: 'all .25s',
                                transform: eyeTheme === key ? 'scale(1.18)' : 'scale(1)',
                                boxShadow: eyeTheme === key ? `0 0 12px ${val.accent}70` : 'none',
                                fontFamily: "'Sora',sans-serif"
                            }}>
                                {val.icon}
                            </button>
                        ))}
                    </div>

                    {/* Right: offline + panels */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                            color: isDl ? ET.accent : ET.textMuted,
                            background: isDl ? ET.accent + '15' : 'transparent',
                            padding: '5px 12px', borderRadius: 50,
                            border: `1px solid ${isDl ? ET.accent + '40' : ET.border}`
                        }}>
                            <WifiOff size={12} />{isDl ? 'Hors-ligne' : 'En ligne'}
                        </div>

                        {/* Panel toggles */}
                        {([
                            { id: 'timer', icon: <Clock size={15} />, label: 'Timer' },
                            { id: 'voice', icon: <Headphones size={15} />, label: 'Voix' },
                            { id: 'settings', icon: <Settings2 size={15} />, label: 'Texte' },
                        ] as { id: 'timer' | 'voice' | 'settings', icon: React.ReactNode, label: string }[]).map(p => (
                            <button key={p.id} onClick={() => setShowPanel(sp => sp === p.id ? null : p.id)}
                                title={p.label}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '7px 12px', borderRadius: 10,
                                    border: `1px solid ${showPanel === p.id ? ET.accent : ET.border}`,
                                    background: showPanel === p.id ? ET.accent + '20' : 'transparent',
                                    color: showPanel === p.id ? ET.accent : ET.textMuted,
                                    cursor: 'pointer', fontSize: 12, fontFamily: "'Sora',sans-serif",
                                    fontWeight: 600, transition: 'all .2s'
                                }}>
                                {p.icon}{p.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* ── Body ── */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Reading column */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '52px 72px 80px', animation: 'fadeIn .5s ease' }}>

                        {/* Book header */}
                        <div style={{ marginBottom: 56 }}>
                            <h1 style={{
                                fontSize: 44, fontWeight: 300, fontStyle: 'italic',
                                margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2, color: ET.text
                            }}>
                                {focusBook.title}
                            </h1>
                            <p style={{
                                fontSize: 16, color: ET.textMuted, margin: 0,
                                fontFamily: "'Sora',sans-serif", fontWeight: 500, letterSpacing: '0.03em'
                            }}>
                                {focusBook.author}&ensp;·&ensp;{focusBook.pages} pages&ensp;·&ensp;
                                <span style={{ color: ET.accent }}>{focusBook.category}</span>
                            </p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                                {focusBook.tags.map(t => (
                                    <span key={t} style={{
                                        fontSize: 11, padding: '3px 10px', borderRadius: 20,
                                        background: ET.accent + '18', color: ET.accent,
                                        border: `1px solid ${ET.accent}30`, fontFamily: "'Sora',sans-serif", fontWeight: 600
                                    }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div style={{ width: 72, height: 2, background: ET.accent, borderRadius: 2, marginTop: 24, opacity: .6 }} />
                        </div>

                        {/* Text */}
                        <div style={{
                            fontSize, lineHeight, maxWidth: 680, whiteSpace: 'pre-line',
                            color: ET.text, animation: 'fadeIn .6s .1s ease both', opacity: 0,
                            animationFillMode: 'forwards'
                        }}>
                            {focusBook.excerpt}
                        </div>

                        {/* TTS active waveform */}
                        {ttsActive && !ttsPaused && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginTop: 52,
                                color: ET.accent, fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: 22, gap: 0 }}>
                                    {[1, 2, 3, 4, 5, 6].map(i => <span key={i} className="wave-bar" style={{ height: `${8 + i * 2}px` }} />)}
                                </div>
                                Lecture vocale en cours...
                            </div>
                        )}
                    </div>

                    {/* ── Right panel ── */}
                    {showPanel && (
                        <div style={{
                            width: 280, borderLeft: `1px solid ${ET.border}`, background: ET.surface,
                            padding: '24px 20px', overflowY: 'auto', flexShrink: 0,
                            animation: 'fadeIn .3s ease'
                        }}>

                            {/* ── TIMER panel ── */}
                            {showPanel === 'timer' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <h3 style={{
                                        fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em',
                                        color: ET.textMuted, fontWeight: 700, fontFamily: "'Sora',sans-serif", margin: 0
                                    }}>
                                        ⏱ Minuteur Focus
                                    </h3>

                                    {/* Ring */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ position: 'relative', width: 140, height: 140 }}>
                                            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="70" cy="70" r={R} fill="transparent" stroke={ET.border} strokeWidth="9" />
                                                <circle cx="70" cy="70" r={R} fill="transparent" stroke={ET.accent} strokeWidth="9"
                                                    strokeDasharray={C} strokeDashoffset={C - (C * progress) / 100}
                                                    strokeLinecap="round"
                                                    style={{
                                                        transition: 'stroke-dashoffset .8s ease',
                                                        filter: `drop-shadow(0 0 8px ${ET.accent}80)`
                                                    }}
                                                />
                                            </svg>
                                            <div style={{
                                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', gap: 3
                                            }}>
                                                <span style={{
                                                    fontSize: 30, fontWeight: 800, fontFamily: "'Sora',sans-serif",
                                                    letterSpacing: 1, color: timerDone ? ET.accent : ET.text,
                                                    transition: 'color .3s'
                                                }}>
                                                    {timerDisplay}
                                                </span>
                                                {timerRunning && (
                                                    <span style={{
                                                        fontSize: 10, color: ET.accent, fontFamily: "'Sora',sans-serif",
                                                        fontWeight: 700, letterSpacing: '0.12em', animation: 'blink 1.5s ease-in-out infinite'
                                                    }}>
                                                        FOCUS
                                                    </span>
                                                )}
                                                {timerDone && (
                                                    <span style={{ fontSize: 10, color: ET.accent, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>
                                                        ✓ TERMINÉ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                        <button onClick={() => setTimerRunning(r => !r)} style={{
                                            display: 'flex', alignItems: 'center', gap: 7,
                                            padding: '10px 20px', borderRadius: 12, border: 'none',
                                            background: ET.accent, color: ET.bg, cursor: 'pointer',
                                            fontWeight: 800, fontSize: 14, fontFamily: "'Sora',sans-serif",
                                            boxShadow: `0 4px 18px ${ET.accent}60`, transition: 'all .2s'
                                        }}>
                                            {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                                            {timerRunning ? 'Pause' : 'Démarrer'}
                                        </button>
                                        <button onClick={() => { setTimerRunning(false); setTimerSec(selectedPreset * 60); }}
                                            style={{
                                                width: 42, height: 42, borderRadius: 12, border: `1px solid ${ET.border}`,
                                                background: 'transparent', color: ET.textMuted, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s'
                                            }}>
                                            <RotateCcw size={14} />
                                        </button>
                                    </div>

                                    {/* Presets */}
                                    <div>
                                        <p style={{
                                            fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: 10, margin: '0 0 10px'
                                        }}>
                                            Durée
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            {PRESETS.map(m => (
                                                <button key={m} onClick={() => { setSelectedPreset(m); setTimerSec(m * 60); setTimerRunning(false); }}
                                                    style={{
                                                        padding: '10px 0', borderRadius: 10,
                                                        border: `1px solid ${selectedPreset === m ? ET.accent : ET.border}`,
                                                        background: selectedPreset === m ? ET.accent + '20' : 'transparent',
                                                        color: selectedPreset === m ? ET.accent : ET.textMuted,
                                                        cursor: 'pointer', fontSize: 13, fontFamily: "'Sora',sans-serif",
                                                        fontWeight: selectedPreset === m ? 800 : 500, transition: 'all .2s',
                                                        boxShadow: selectedPreset === m ? `0 0 10px ${ET.accent}30` : 'none'
                                                    }}>
                                                    {m} min
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div>
                                        <div style={{ height: 5, background: ET.border, borderRadius: 5, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${progress}%`,
                                                background: `linear-gradient(90deg,${ET.accent},${ET.accent}bb)`,
                                                borderRadius: 5, transition: 'width .8s ease'
                                            }} />
                                        </div>
                                        <p style={{
                                            fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            marginTop: 6, textAlign: 'right'
                                        }}>
                                            {Math.round(progress)}% écoulé
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── VOICE panel ── */}
                            {showPanel === 'voice' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <h3 style={{
                                        fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em',
                                        color: ET.textMuted, fontWeight: 700, fontFamily: "'Sora',sans-serif", margin: 0
                                    }}>
                                        🔊 Lecture Vocale
                                    </h3>

                                    {!ttsSupported ? (
                                        <div style={{
                                            display: 'flex', gap: 8, alignItems: 'flex-start',
                                            fontSize: 13, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            background: ET.bg, border: `1px solid ${ET.border}`, borderRadius: 12, padding: '14px'
                                        }}>
                                            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                                            Synthèse vocale non supportée par ce navigateur.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Main button */}
                                            <button onClick={toggleTTS} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                padding: '14px', borderRadius: 14,
                                                border: `1.5px solid ${ttsActive && !ttsPaused ? ET.accent : ET.border}`,
                                                background: ttsActive && !ttsPaused ? ET.accent + '18' : 'transparent',
                                                color: ttsActive && !ttsPaused ? ET.accent : ET.text,
                                                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                                fontFamily: "'Sora',sans-serif", transition: 'all .25s',
                                                boxShadow: ttsActive && !ttsPaused ? `0 0 20px ${ET.accent}35` : 'none',
                                                width: '100%'
                                            }}>
                                                {ttsActive && !ttsPaused ? (
                                                    <><Pause size={16} />Mettre en pause</>
                                                ) : ttsActive && ttsPaused ? (
                                                    <><Play size={16} />Reprendre la lecture</>
                                                ) : (
                                                    <><Volume2 size={16} />Écouter ce texte</>
                                                )}
                                            </button>

                                            {/* Waveform */}
                                            {ttsActive && !ttsPaused && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    height: 34, gap: 0, padding: '4px 0'
                                                }}>
                                                    {[1, 2, 3, 4, 5, 6].map(i => <span key={i} className="wave-bar" style={{ height: `${10 + i * 2}px` }} />)}
                                                </div>
                                            )}

                                            {/* Stop */}
                                            {ttsActive && (
                                                <button onClick={stopTTS} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    padding: '10px', borderRadius: 12, border: `1px solid ${ET.border}`,
                                                    background: 'transparent', color: ET.textMuted, cursor: 'pointer',
                                                    fontSize: 13, fontFamily: "'Sora',sans-serif", transition: 'all .2s', width: '100%'
                                                }}>
                                                    <StopCircle size={14} />Arrêter
                                                </button>
                                            )}

                                            {/* Voice selector */}
                                            {voices.length > 0 && (
                                                <div>
                                                    <p style={{
                                                        fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                                                        margin: '0 0 8px'
                                                    }}>Voix</p>
                                                    <select value={ttsVoice?.name || ''}
                                                        onChange={e => setTtsVoice(voices.find(v => v.name === e.target.value) || null)}
                                                        style={{
                                                            width: '100%', background: ET.bg, border: `1px solid ${ET.border}`,
                                                            borderRadius: 10, padding: '9px 12px', color: ET.text, fontSize: 13,
                                                            fontFamily: "'Sora',sans-serif", outline: 'none', cursor: 'pointer'
                                                        }}>
                                                        {voices.map(v => (
                                                            <option key={v.name} value={v.name} style={{ background: ET.surface }}>
                                                                {v.name} ({v.lang})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Speed */}
                                            <div>
                                                <p style={{
                                                    fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    margin: '0 0 8px'
                                                }}>Vitesse de lecture</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                    {[{ v: 0.7, l: 'Lente' }, { v: 0.9, l: 'Normale' }, { v: 1.1, l: 'Rapide' }, { v: 1.4, l: 'Très rapide' }].map(item => (
                                                        <button key={item.v} onClick={() => setTtsRate(item.v)} style={{
                                                            padding: '9px 8px', borderRadius: 10,
                                                            border: `1px solid ${ttsRate === item.v ? ET.accent : ET.border}`,
                                                            background: ttsRate === item.v ? ET.accent + '20' : 'transparent',
                                                            color: ttsRate === item.v ? ET.accent : ET.textMuted,
                                                            cursor: 'pointer', fontSize: 12, fontFamily: "'Sora',sans-serif",
                                                            fontWeight: ttsRate === item.v ? 700 : 400, transition: 'all .2s'
                                                        }}>
                                                            {item.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <p style={{
                                                fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                                textAlign: 'center', lineHeight: 1.6, margin: 0,
                                                background: ET.bg, borderRadius: 10, padding: '10px',
                                                border: `1px solid ${ET.border}`
                                            }}>
                                                💡 La voix lira le texte affiché dans la langue détectée automatiquement.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── SETTINGS panel ── */}
                            {showPanel === 'settings' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <h3 style={{
                                        fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em',
                                        color: ET.textMuted, fontWeight: 700, fontFamily: "'Sora',sans-serif", margin: 0
                                    }}>
                                        ✏️ Paramètres du texte
                                    </h3>

                                    {/* Font size */}
                                    <div>
                                        <p style={{
                                            fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <Type size={12} /> Taille de police
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                                            {[15, 17, 19, 21, 24].map(s => (
                                                <button key={s} onClick={() => setFontSize(s)} style={{
                                                    padding: '8px 0', borderRadius: 10,
                                                    border: `1px solid ${fontSize === s ? ET.accent : ET.border}`,
                                                    background: fontSize === s ? ET.accent + '20' : 'transparent',
                                                    color: fontSize === s ? ET.accent : ET.text,
                                                    cursor: 'pointer', fontFamily: "'Sora',sans-serif",
                                                    fontWeight: fontSize === s ? 700 : 400, fontSize: 13,
                                                    transition: 'all .2s',
                                                    boxShadow: fontSize === s ? `0 0 8px ${ET.accent}30` : 'none'
                                                }}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{
                                            fontSize, lineHeight: '1.4', color: ET.textMuted,
                                            marginTop: 10, padding: '10px 12px', borderRadius: 10,
                                            background: ET.bg, border: `1px solid ${ET.border}`,
                                            fontFamily: "'Crimson Pro',Georgia,serif"
                                        }}>
                                            Aperçu du texte
                                        </div>
                                    </div>

                                    {/* Line height */}
                                    <div>
                                        <p style={{
                                            fontSize: 11, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <AlignJustify size={12} /> Interligne
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {[{ v: 1.6, l: 'Compact' }, { v: 2.0, l: 'Normal' }, { v: 2.4, l: 'Aéré' }, { v: 2.8, l: 'Large' }].map(item => (
                                                <button key={item.v} onClick={() => setLineHeight(item.v)} style={{
                                                    padding: '9px 8px', borderRadius: 10,
                                                    border: `1px solid ${lineHeight === item.v ? ET.accent : ET.border}`,
                                                    background: lineHeight === item.v ? ET.accent + '20' : 'transparent',
                                                    color: lineHeight === item.v ? ET.accent : ET.textMuted,
                                                    cursor: 'pointer', fontSize: 12, fontFamily: "'Sora',sans-serif",
                                                    fontWeight: lineHeight === item.v ? 700 : 400, transition: 'all .2s'
                                                }}>
                                                    {item.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Eye theme info */}
                                    <div style={{
                                        background: ET.bg, border: `1px solid ${ET.border}`,
                                        borderRadius: 12, padding: '14px'
                                    }}>
                                        <p style={{
                                            fontSize: 12, color: ET.accent, fontWeight: 700,
                                            fontFamily: "'Sora',sans-serif", margin: '0 0 6px',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            {ET.icon} Thème : {ET.label}
                                        </p>
                                        <p style={{
                                            fontSize: 12, color: ET.textMuted, fontFamily: "'Sora',sans-serif",
                                            margin: 0, lineHeight: 1.6
                                        }}>
                                            Changez le thème depuis la barre supérieure pour un confort optimal.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ═══════════════════ LIBRARY VIEW ═══════════════════════════ */
    const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 24, color: T.textOnCard,
        transition: 'all .25s', ...extra,
    });

    return (
        <div style={{
            display: 'flex', height: '100vh', background: T.bg, color: T.text,
            fontFamily: "'Sora','Segoe UI',sans-serif", overflow: 'hidden', position: 'relative',
            transition: 'background .4s,color .4s'
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Crimson+Pro:ital,wght@1,400&display=swap');
        @keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes birdFly{0%{transform:translateX(0)}100%{transform:translateX(110vw)}}
        @keyframes birdFlyRtl{0%{transform:translateX(0)}100%{transform:translateX(-110vw)}}
        @keyframes wingFlap{0%{transform:rotate(-20deg)}100%{transform:rotate(20deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dlDone{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.accent}40;border-radius:5px}
        .book-card:hover{transform:translateY(-7px)!important;box-shadow:0 24px 48px ${T.accent}22!important}
        .dl-btn:hover{border-color:${T.accent}!important;color:${T.accent}!important}
        .focus-btn:hover{transform:scale(1.03)!important}
      `}</style>

            {/* Stars */}
            {dark && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    {STARS_BG.map(s => (
                        <div key={s.id} style={{
                            position: 'absolute', top: s.top, left: s.left,
                            width: s.size, height: s.size, background: '#fff', borderRadius: '50%',
                            animation: `twinkle 3s ${s.delay} ease-in-out infinite`
                        }} />
                    ))}
                </div>
            )}

            {/* Birds */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {BIRDS.map(b => (
                    <div key={b.id} style={{
                        position: 'absolute', top: b.top,
                        left: b.rtl ? 'auto' : '-80px', right: b.rtl ? '-80px' : 'auto',
                        animation: `${b.rtl ? 'birdFlyRtl' : 'birdFly'} ${b.duration} ${b.delay} linear infinite`,
                        opacity: dark ? 0.13 : 0.17
                    }}>
                        <svg width={`${54 * b.scale}`} height={`${28 * b.scale}`} viewBox="0 0 54 28" fill="none">
                            <path d="M27 14 Q14 2 2 8" stroke={dark ? '#fff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none"
                                style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                            <path d="M27 14 Q40 2 52 8" stroke={dark ? '#fff' : '#0b2a4a'} strokeWidth="2.8" strokeLinecap="round" fill="none"
                                style={{ animation: `wingFlap ${b.wingSpeed} ease-in-out infinite alternate`, transformOrigin: '27px 14px' }} />
                        </svg>
                    </div>
                ))}
            </div>

            {/* Glow */}
            <div style={{
                position: 'absolute', top: 0, right: 0, width: 600, height: 600, background: T.accent,
                borderRadius: '50%', filter: 'blur(140px)', opacity: dark ? 0.04 : 0.12, pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: 500, height: 500, background: T.accentSoft,
                borderRadius: '50%', filter: 'blur(120px)', opacity: dark ? 0.03 : 0.1, pointerEvents: 'none', zIndex: 0
            }} />

            {/* Sidebar */}
            <Sidebar activeTab="librairie"
                setActiveTab={tab => { if (tab !== 'librairie') navigate('/dashboard'); }}
                isSidebarExpanded={isSidebarExpanded}
                setIsSidebarExpanded={setIsSidebarExpanded}
                user={user} T={T} />

            {/* Main */}
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 36px 72px' }}>

                    {/* ── Header ── */}
                    <header style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '30px 0 30px', gap: 16
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: 38, fontWeight: 900, display: 'flex', alignItems: 'center',
                                gap: 13, color: T.text, margin: 0, letterSpacing: '-0.5px'
                            }}>
                                <BookOpen size={36} color={T.accent} /> Librairie
                            </h1>
                            <p style={{
                                color: T.textMuted, marginTop: 8, fontSize: 15, marginLeft: 49,
                                fontWeight: 400, fontStyle: 'italic',
                                fontFamily: "'Crimson Pro',Georgia,serif"
                            }}>
                                Romans · Histoires · Nouvelles · Sciences · Philosophie
                            </p>
                        </div>

                        {/* Offline counter */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 20px', borderRadius: 14, background: T.card,
                            border: `1px solid ${downloaded.length > 0 ? T.accent + '40' : T.border}`,
                            boxShadow: downloaded.length > 0 ? `0 4px 20px ${T.accent}15` : 'none',
                            transition: 'all .3s'
                        }}>
                            <WifiOff size={15} color={downloaded.length > 0 ? T.accent : T.textMuted} />
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                                    {downloaded.length} livre{downloaded.length !== 1 ? 's' : ''} hors-ligne
                                </p>
                                <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>prêt{downloaded.length !== 1 ? 's' : ''} sans connexion</p>
                            </div>
                            {downloaded.length > 0 && <CheckCircle2 size={16} color={T.accent} />}
                        </div>
                    </header>

                    {/* ── Search + Filters ── */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 34, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                            <Search size={15} style={{
                                position: 'absolute', left: 16, top: '50%',
                                transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none'
                            }} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Titre, auteur..."
                                style={{
                                    width: '100%', background: T.card, border: `1px solid ${T.border}`,
                                    borderRadius: 50, padding: '12px 16px 12px 44px', color: T.text,
                                    fontSize: 14, fontFamily: 'inherit', outline: 'none',
                                    boxSizing: 'border-box', transition: 'all .2s'
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accent}18`; }}
                                onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '11px 17px', borderRadius: 50,
                                    border: `1px solid ${category === cat.id ? T.accent : T.border}`,
                                    background: category === cat.id ? T.accent + '20' : T.card,
                                    color: category === cat.id ? T.accent : T.textMuted,
                                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
                                    transition: 'all .2s',
                                    boxShadow: category === cat.id ? `0 4px 14px ${T.accent}30` : 'none'
                                }}>
                                    {cat.icon}{cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Count ── */}
                    <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, fontWeight: 500 }}>
                        {filtered.length} livre{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                    </p>

                    {/* ── Grid ── */}
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMuted }}>
                            <BookOpen size={52} style={{ marginBottom: 16, opacity: .2 }} />
                            <p style={{ fontSize: 18, fontWeight: 600 }}>Aucun livre trouvé</p>
                            <p style={{ fontSize: 14, marginTop: 6, opacity: .6 }}>Essayez une autre recherche</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 22
                        }}>
                            {filtered.map((book, i) => {
                                const isDl = downloaded.includes(book.id);
                                const isDling = downloading.includes(book.id);
                                return (
                                    <div key={book.id} className="book-card" style={cardStyle({
                                        overflow: 'hidden', cursor: 'pointer',
                                        animation: `fadeUp .4s ${i * 0.05}s ease both`,
                                        opacity: 0, animationFillMode: 'forwards',
                                        boxShadow: isDl ? `0 0 0 2px ${T.accent}30` : 'none'
                                    })}>

                                        {/* Cover */}
                                        <div style={{ height: 155, background: book.cover, position: 'relative' }}>
                                            {isDl && (
                                                <div style={{
                                                    position: 'absolute', top: 10, right: 10,
                                                    background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
                                                    borderRadius: 8, padding: '4px 10px',
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    fontSize: 11, fontWeight: 700, color: '#6de8ef'
                                                }}>
                                                    <WifiOff size={10} /> Hors-ligne
                                                </div>
                                            )}
                                            <div style={{
                                                position: 'absolute', bottom: 10, left: 10,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)',
                                                borderRadius: 8, padding: '4px 10px',
                                                fontSize: 12, fontWeight: 700, color: '#fff'
                                            }}>
                                                <Star size={11} fill="#fbbf24" color="#fbbf24" /> {book.rating}
                                            </div>
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(to top,rgba(0,0,0,.4) 0%,transparent 60%)'
                                            }} />
                                        </div>

                                        {/* Body */}
                                        <div style={{ padding: '18px 18px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.1em', color: T.accent,
                                                    background: T.accent + '15', padding: '3px 9px', borderRadius: 6
                                                }}>
                                                    {book.category}
                                                </span>
                                                <span style={{ fontSize: 11, color: T.textOnCardMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Clock size={10} /> ~{Math.round(book.pages / 30)}min
                                                </span>
                                            </div>

                                            <h3 style={{
                                                fontSize: 16, fontWeight: 800, color: T.textOnCard,
                                                margin: '0 0 3px', lineHeight: 1.3
                                            }}>
                                                {book.title}
                                            </h3>
                                            <p style={{
                                                fontSize: 13, color: T.textOnCardMuted, margin: '0 0 10px',
                                                fontStyle: 'italic', fontFamily: "'Crimson Pro',Georgia,serif"
                                            }}>
                                                {book.author}
                                            </p>
                                            <p style={{
                                                fontSize: 13, color: T.textOnCardMuted, lineHeight: 1.6,
                                                marginBottom: 14, display: '-webkit-box',
                                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                            }}>
                                                {book.description}
                                            </p>

                                            {/* Tags */}
                                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                                                {book.tags.map(tag => (
                                                    <span key={tag} style={{
                                                        fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: T.textOnCardMuted, border: `1px solid ${T.border}`
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {/* Focus mode */}
                                                <button className="focus-btn" onClick={() => openFocus(book)} style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                                    padding: '11px', borderRadius: 12, border: 'none',
                                                    background: `linear-gradient(135deg,${T.accent},${T.accentSoft})`,
                                                    color: '#0b2a4a', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                                                    fontFamily: 'inherit', transition: 'all .2s',
                                                    boxShadow: `0 4px 16px ${T.accent}38`
                                                }}>
                                                    <Maximize2 size={13} /> Mode Focus
                                                </button>

                                                {/* Download */}
                                                <button className={isDl ? '' : 'dl-btn'} onClick={() => handleDownload(book)}
                                                    disabled={isDl || isDling}
                                                    title={isDl ? 'Disponible hors-ligne' : isDling ? 'Installation...' : 'Installer hors-ligne'}
                                                    style={{
                                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                                        border: `1px solid ${isDl ? T.accent : T.border}`,
                                                        background: isDl ? T.accent + '20' : 'transparent',
                                                        color: isDl ? T.accent : T.textMuted,
                                                        cursor: isDl ? 'default' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all .2s',
                                                        boxShadow: isDl ? `0 0 10px ${T.accent}25` : 'none'
                                                    }}>
                                                    {isDling
                                                        ? <div style={{
                                                            width: 15, height: 15,
                                                            border: `2px solid ${T.textMuted}`,
                                                            borderTopColor: T.accent, borderRadius: '50%',
                                                            animation: 'spin .7s linear infinite'
                                                        }} />
                                                        : isDl ? <CheckCircle2 size={15} /> : <Download size={15} />
                                                    }
                                                </button>
                                            </div>

                                            {/* Install hint */}
                                            {!isDl && !isDling && (
                                                <p style={{
                                                    fontSize: 11, color: T.textOnCardMuted, marginTop: 9,
                                                    textAlign: 'center', opacity: .55,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                                                }}>
                                                    <Download size={10} /> Installer pour lire hors connexion
                                                </p>
                                            )}
                                            {isDling && (
                                                <p style={{
                                                    fontSize: 11, color: T.accent, marginTop: 9,
                                                    textAlign: 'center', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                                                }}>
                                                    <div style={{
                                                        width: 10, height: 10, border: `1.5px solid ${T.accent}40`,
                                                        borderTopColor: T.accent, borderRadius: '50%',
                                                        animation: 'spin .7s linear infinite'
                                                    }} />
                                                    Installation en cours...
                                                </p>
                                            )}
                                            {isDl && (
                                                <p style={{
                                                    fontSize: 11, color: T.accent, marginTop: 9,
                                                    textAlign: 'center', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                                                }}>
                                                    <CheckCircle2 size={10} /> Prêt à lire hors connexion
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Librairie;