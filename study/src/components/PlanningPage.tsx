import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../reutilisable/Themecontext';
import {
  Calendar, ChevronLeft, ChevronRight, Home, Plus, X, Upload, FileText,
  Check, Trash2, BookOpen, HelpCircle, Brain, Target, ClipboardList,
  MessageSquare, BarChart3, Sun, Moon, ChevronDown, AlertCircle, CheckCircle2, Clock, TrendingUp
} from 'lucide-react';
import {
  type PlanningNote, type PlanningEvent, type NoteType, type EventCategory,
  type RaisonnementHistoryItem,
  NOTE_TYPE_CONFIG, CATEGORY_CONFIG,
  loadNotes, saveNote, deleteNote, toggleNoteChecked,
  loadEvents, saveEvent, saveBulkEvents, deleteEvent,
  getNotesForDate, getEventsForDate, getRaisonnementForDate, loadIAHistory,
  getMonthStats, formatDateKey,
  getDaysInMonth, getFirstDayOfMonth, MONTH_NAMES, DAY_NAMES,
} from '../utils/planningStorage';
import './planning-styles.css';
import { incrementImportedDocuments } from '../utils/documentCounter';

// ═══════════════════════════════════════════════════════════
//  PLANNING PAGE — Main Component
// ═══════════════════════════════════════════════════════════

export default function PlanningPage() {
  const navigate = useNavigate();
  const { dark, toggleTheme, T } = useTheme();

  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [slideKey, setSlideKey] = useState(0);

  // Data State
  const [notes, setNotes] = useState<PlanningNote[]>([]);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [iaHistory, setIaHistory] = useState<RaisonnementHistoryItem[]>([]);

  useEffect(() => {
    loadNotes().then(setNotes);
    loadEvents().then(setEvents);
    
    const reloadIAHistory = () => loadIAHistory().then(setIaHistory);
    reloadIAHistory();
    
    window.addEventListener('ia-history-updated', reloadIAHistory);
    return () => window.removeEventListener('ia-history-updated', reloadIAHistory);
  }, []);

  // UI State
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(new Date()));
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EventCategory | 'all'>('all');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR Review Modal state
  interface OcrExtractedItem {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD or '' if not detected
    subject: string;
    time: string; // e.g. '08:30-09:30'
    hasDate: boolean;
  }
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [ocrItems, setOcrItems] = useState<OcrExtractedItem[]>([]);
  const [ocrRawText, setOcrRawText] = useState('');

  // Note Editor State
  const [noteType, setNoteType] = useState<NoteType>('libre');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteCategory, setNoteCategory] = useState<EventCategory>('etude');

  // ─── Calendar Navigation ────────────────────────────────

  const goNextMonth = useCallback(() => {
    setSlideDir('left');
    setSlideKey(k => k + 1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth]);

  const goPrevMonth = useCallback(() => {
    setSlideDir('right');
    setSlideKey(k => k + 1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth]);

  // ─── Stats ──────────────────────────────────────────────

  const [stats, setStats] = useState({
    studiedDays: 0,
    resumeCount: 0,
    quizCount: 0,
    objectifsTotal: 0,
    objectifsCompleted: 0,
    totalNotes: 0,
  });

  useEffect(() => {
    getMonthStats(currentMonth, currentYear).then(setStats);
  }, [currentMonth, currentYear, notes, events]);

  // ─── Calendar Data ──────────────────────────────────────

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: Array<{ day: number; dateKey: string; isCurrentMonth: boolean }> = [];

    // Previous month padding
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      cells.push({
        day: d,
        dateKey: formatDateKey(new Date(prevYear, prevMonth, d)),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateKey: formatDateKey(new Date(currentYear, currentMonth, d)),
        isCurrentMonth: true,
      });
    }

    // Next month padding (fill to 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        dateKey: formatDateKey(new Date(nextYear, nextMonth, d)),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentMonth, currentYear]);

  const getDotsForDate = useCallback((dateKey: string): EventCategory[] => {
    const dayNotes = notes.filter(n => n.date === dateKey);
    const dayEvents = events.filter(e => e.date === dateKey);
    const cats = new Set<EventCategory>();
    dayNotes.forEach(n => cats.add(n.category));
    dayEvents.forEach(e => cats.add(e.category));
    // Check IA history  
    const iaItems = iaHistory.filter(item => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
      return itemDate === dateKey;
    });
    if (iaItems.length > 0) cats.add('etude');
    return Array.from(cats);
  }, [notes, events, iaHistory]);

  const todayKey = formatDateKey(today);

  // ─── Note Editor ────────────────────────────────────────

  const resetNoteEditor = useCallback(() => {
    setNoteType('libre');
    setNoteTitle('');
    setNoteContent('');
    setNoteSubject('');
    setNoteCategory('etude');
    setShowNoteEditor(false);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!noteTitle.trim() || !selectedDate) return;
    const updated = await saveNote({
      date: selectedDate,
      type: noteType,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      subject: noteSubject.trim() || undefined,
      category: noteCategory,
      checked: false,
    });
    setNotes(updated);
    resetNoteEditor();
  }, [selectedDate, noteType, noteTitle, noteContent, noteSubject, noteCategory, resetNoteEditor]);

  const handleDeleteNote = useCallback(async (id: string) => {
    const updated = await deleteNote(id);
    setNotes(updated);
  }, []);

  const handleToggleChecked = useCallback(async (id: string) => {
    const updated = await toggleNoteChecked(id);
    setNotes(updated);
  }, []);

  // ─── File Upload (OCR) ──────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setOcrResult(null);
    setOcrItems([]);
    setOcrRawText('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(p => {
          if (p >= 85) { clearInterval(progressInterval); return 85; }
          return p + Math.random() * 15;
        });
      }, 300);

      const resp = await fetch('http://localhost:8000/api/ocr/schedule', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (resp.ok) {
        const data = await resp.json();
        const rawText = data.raw_text || '';
        setOcrRawText(rawText);

        // Build extracted items from OCR response
        const extracted: OcrExtractedItem[] = [];

        if (data.events && data.events.length > 0) {
          // Ollama parsed events — some may have dates, some may not
          data.events.forEach((e: any, i: number) => {
            const dateStr = e.date || '';
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
            extracted.push({
              id: `ocr_${Date.now()}_${i}`,
              title: e.title || `Élément ${i + 1}`,
              date: isValidDate ? dateStr : '',
              subject: e.subject || e.matiere || '',
              time: e.time || '',
              hasDate: isValidDate,
            });
          });
        } else if (rawText.trim()) {
          // No structured events — create a single item from raw text
          const lines = rawText.split('\n').filter((l: string) => l.trim().length > 3);
          lines.slice(0, 20).forEach((line: string, i: number) => {
            extracted.push({
              id: `ocr_${Date.now()}_${i}`,
              title: line.trim().substring(0, 100),
              date: '',
              subject: '',
              time: '',
              hasDate: false,
            });
          });
        }

        if (extracted.length > 0) {
          setOcrItems(extracted);
          setShowOcrReview(true);
        } else {
          setOcrResult('Erreur: Aucun élément détecté dans le document.');
        }
      } else {
        setOcrResult('Erreur: Le serveur OCR n\'est pas disponible. Vérifiez que le backend tourne.');
      }
    } catch {
      setOcrResult('Erreur: Impossible de contacter le serveur OCR. Vérifiez que le backend est lancé sur le port 8000.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ─── OCR Review: update item date ────────────────────────

  const updateOcrItemDate = useCallback((id: string, newDate: string) => {
    setOcrItems(prev => prev.map(item =>
      item.id === id ? { ...item, date: newDate, hasDate: !!newDate } : item
    ));
  }, []);

  const updateOcrItemTitle = useCallback((id: string, newTitle: string) => {
    setOcrItems(prev => prev.map(item =>
      item.id === id ? { ...item, title: newTitle } : item
    ));
  }, []);

  const updateOcrItemSubject = useCallback((id: string, newSubject: string) => {
    setOcrItems(prev => prev.map(item =>
      item.id === id ? { ...item, subject: newSubject } : item
    ));
  }, []);

  const removeOcrItem = useCallback((id: string) => {
    setOcrItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const confirmOcrImport = useCallback(async () => {
    // Only import items that have a valid date
    const validItems = ocrItems.filter(item => item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date));
    let updatedNotes = notes;

    for (const item of validItems) {
      const timeInfo = item.time ? `Créneau: ${item.time}` : '';
      updatedNotes = await saveNote({
        date: item.date,
        type: 'devoir',
        title: item.title,
        content: `Importé via OCR${timeInfo ? ' — ' + timeInfo : ''}`,
        subject: item.subject || undefined,
        category: 'etude',
        checked: false,
        source: 'ocr',
      });
    }

    setNotes(updatedNotes);
    setShowOcrReview(false);
    setOcrItems([]);
    setOcrResult(`Succès: ${validItems.length} cours importé(s) dans le calendrier !`);
    // Incrémenter le compteur global de documents importés (1 par fichier, pas par élément extrait)
    if (validItems.length > 0) {
      incrementImportedDocuments(1);
    }
  }, [ocrItems, notes]);

  const allOcrItemsHaveDates = useMemo(() => {
    return ocrItems.length > 0 && ocrItems.every(item => item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date));
  }, [ocrItems]);

  const ocrItemsWithDates = useMemo(() => ocrItems.filter(i => i.date && /^\d{4}-\d{2}-\d{2}$/.test(i.date)).length, [ocrItems]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  // ─── Selected Day Data ──────────────────────────────────

  const selectedDateNotes = useMemo(() => {
    if (!selectedDate) return [];
    return notes.filter(n => n.date === selectedDate);
  }, [selectedDate, notes]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => e.date === selectedDate);
  }, [selectedDate, events]);

  const selectedDateIA = useMemo((): RaisonnementHistoryItem[] => {
    if (!selectedDate) return [];
    return iaHistory.filter(item => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
      return itemDate === selectedDate;
    });
  }, [selectedDate, iaHistory]);

  // ─── Existing subjects for autocomplete ─────────────────

  const existingSubjects = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach(n => { if (n.subject) subs.add(n.subject); });
    // Also from IA history
    iaHistory.forEach(h => { if (h.subject) subs.add(h.subject); });
    return Array.from(subs);
  }, [notes, iaHistory]);

  // ─── Format helpers ─────────────────────────────────────

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNum = d.getDate();
    const monthName = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return `${dayNames[d.getDay()]} ${dayNum} ${monthName} ${year}`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'resume': return '📖';
      case 'qcm': return '🧠';
      case 'qr': return '❓';
      case 'qr_question': return '❓';
      case 'qr_correct': return '✅';
      default: return '📄';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'resume': return 'Résumé';
      case 'qcm': return 'QCM';
      case 'qr': return 'Q/R';
      case 'qr_question': return 'Question';
      case 'qr_correct': return 'Correction';
      default: return mode;
    }
  };

  // ─── Note Type Icons ────────────────────────────────────

  const NoteTypeIcon = ({ type, size = 18 }: { type: NoteType; size?: number }) => {
    switch (type) {
      case 'resume': return <BookOpen size={size} />;
      case 'question': return <HelpCircle size={size} />;
      case 'quiz': return <Brain size={size} />;
      case 'objectif': return <Target size={size} />;
      case 'devoir': return <ClipboardList size={size} />;
      case 'libre': return <MessageSquare size={size} />;
    }
  };

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: T.text,
      position: 'relative',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '45%', height: '45%', background: `radial-gradient(circle, ${T.accent}12, transparent)`, filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '45%', height: '45%', background: `radial-gradient(circle, ${T.accentSoft}10, transparent)`, filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* ══════════ LEFT: Calendar ══════════ */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${T.accent}40`,
            }}>
              <Calendar size={24} color={dark ? '#0b2a4a' : '#fff'} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.75rem', fontWeight: 900, margin: 0,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Mon Planning</h1>
              <p style={{ fontSize: '0.8rem', color: T.textMuted, margin: 0, fontWeight: 500 }}>
                Organisez votre temps d'étude
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme} title={dark ? 'Mode clair' : 'Mode sombre'} style={{
              width: 44, height: 44, borderRadius: 12,
              border: `1px solid ${T.border}`, background: `${T.card}80`,
              color: T.accent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s', backdropFilter: 'blur(12px)',
            }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} style={{
              width: 44, height: 44, borderRadius: 12,
              border: `1px solid ${T.border}`, background: `${T.card}80`,
              color: T.accent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s', backdropFilter: 'blur(12px)',
            }}>
              <Home size={18} />
            </button>
          </div>
        </header>

        {/* Month Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px 16px',
        }}>
          <button onClick={goPrevMonth} style={{
            width: 40, height: 40, borderRadius: 12,
            border: `1px solid ${T.border}`, background: `${T.card}60`,
            color: T.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}20`; e.currentTarget.style.borderColor = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.card}60`; e.currentTarget.style.borderColor = T.border; }}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '1.35rem', fontWeight: 800, color: T.text, margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <button onClick={goNextMonth} style={{
            width: 40, height: 40, borderRadius: 12,
            border: `1px solid ${T.border}`, background: `${T.card}60`,
            color: T.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}20`; e.currentTarget.style.borderColor = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.card}60`; e.currentTarget.style.borderColor = T.border; }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 32px 12px', flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveFilter('all')}
            className="planning-category-tag"
            style={{
              background: activeFilter === 'all' ? `${T.accent}25` : `${T.card}60`,
              color: activeFilter === 'all' ? T.accent : T.textMuted,
              border: `1px solid ${activeFilter === 'all' ? T.accent : T.border}`,
              cursor: 'pointer',
            }}
          >
            Tous
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className="planning-category-tag"
              style={{
                background: activeFilter === key ? `${cfg.color}25` : `${T.card}60`,
                color: activeFilter === key ? cfg.color : T.textMuted,
                border: `1px solid ${activeFilter === key ? cfg.color : T.border}`,
                cursor: 'pointer',
              }}
            >
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 24px' }} className="planning-scroll">
          <div
            key={slideKey}
            className={`planning-calendar-grid ${slideDir === 'left' ? 'planning-slide-left' : 'planning-slide-right'}`}
          >
            {/* Day Headers */}
            {DAY_NAMES.map(d => (
              <div key={d} className="planning-day-header" style={{ color: T.textMuted }}>
                {d}
              </div>
            ))}

            {/* Day Cells */}
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateKey === todayKey;
              const dots = getDotsForDate(cell.dateKey);
              const filteredDots = activeFilter === 'all' ? dots : dots.filter(d => d === activeFilter);
              const hasContent = dots.length > 0;
              const isSelected = cell.dateKey === selectedDate;

              return (
                <div
                  key={`${cell.dateKey}-${idx}`}
                  className="planning-day-cell"
                  onClick={() => setSelectedDate(cell.dateKey)}
                  style={{
                    background: isSelected
                      ? `${T.accent}18`
                      : hasContent
                        ? `${T.card}${cell.isCurrentMonth ? '90' : '40'}`
                        : `${T.card}${cell.isCurrentMonth ? '50' : '20'}`,
                    border: isSelected
                      ? `2px solid ${T.accent}`
                      : `1px solid ${cell.isCurrentMonth ? T.border : 'transparent'}`,
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  {/* Day Number */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                    <span
                      className={isToday ? 'planning-today-ring' : ''}
                      style={{
                        width: 28, height: 28,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: isToday ? 800 : 600,
                        color: isToday ? (dark ? '#0b2a4a' : '#fff') : T.text,
                        background: isToday ? `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})` : 'transparent',
                        boxShadow: isToday ? `0 4px 12px ${T.accent}50` : 'none',
                      }}
                    >
                      {cell.day}
                    </span>
                  </div>

                  {/* Dots */}
                  {filteredDots.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 'auto' }}>
                      {filteredDots.map((cat, i) => (
                        <span
                          key={i}
                          className="planning-dot-badge"
                          style={{
                            background: CATEGORY_CONFIG[cat]?.color || T.accent,
                            boxShadow: `0 0 6px ${CATEGORY_CONFIG[cat]?.color || T.accent}60`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <aside style={{
        width: 420,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${T.border}`,
        background: `${T.sidebarBg}`,
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="planning-scroll">

          {/* ── Stats Section ── */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: '0.7rem', fontWeight: 700, color: T.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <BarChart3 size={13} /> Statistiques — {MONTH_NAMES[currentMonth]}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Jours étudiés', value: stats.studiedDays, icon: <TrendingUp size={16} />, color: '#3b82f6' },
                { label: 'Résumés', value: stats.resumeCount, icon: <BookOpen size={16} />, color: '#8b5cf6' },
                { label: 'QCM réalisés', value: stats.quizCount, icon: <Brain size={16} />, color: '#10b981' },
                { label: 'Objectifs', value: `${stats.objectifsCompleted}/${stats.objectifsTotal}`, icon: <Target size={16} />, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className={`planning-stagger-${i + 1}`} style={{
                  background: `${T.card}80`,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: '14px 12px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: -15, right: -15,
                    width: 50, height: 50, background: s.color,
                    borderRadius: '50%', filter: 'blur(25px)', opacity: 0.15,
                  }} />
                  <div style={{ fontSize: '0.65rem', color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>
                    {s.icon} {s.label}
                  </div>
                  <div className="planning-stat-value" style={{
                    fontSize: '1.3rem', fontWeight: 900, color: s.color,
                  }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {stats.objectifsTotal > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: T.textMuted, marginBottom: 4 }}>
                  <span>Progression objectifs</span>
                  <span>{Math.round((stats.objectifsCompleted / stats.objectifsTotal) * 100)}%</span>
                </div>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: `${T.border}`,
                  overflow: 'hidden',
                }}>
                  <div
                    className="planning-progress-bar"
                    style={{
                      height: '100%',
                      width: `${(stats.objectifsCompleted / stats.objectifsTotal) * 100}%`,
                      background: `linear-gradient(90deg, ${T.accent}, ${T.accentSoft})`,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            )}
          </div>


          {/* ── Upload Section ── */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, cursor: 'pointer',
              }}
              onClick={() => setShowUpload(!showUpload)}
            >
              <h3 style={{
                fontSize: '0.7rem', fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Upload size={13} /> Importer un emploi du temps
              </h3>
              <ChevronDown size={14} color={T.textMuted} style={{
                transform: showUpload ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s',
              }} />
            </div>

            {showUpload && (
              <div className="planning-note-item">
                <div
                  className={`planning-upload-zone ${isUploading ? 'planning-upload-active' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${T.border}`,
                    borderRadius: 14,
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: `${T.card}40`,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = `${T.accent}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = `${T.card}40`; }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                  <Upload size={28} color={T.accent} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text, margin: '4px 0' }}>
                    Glissez ou cliquez pour importer
                  </p>
                  <p style={{ fontSize: '0.65rem', color: T.textMuted }}>
                    PDF, Image, DOCX — OCR automatique
                  </p>
                </div>

                {/* Progress */}
                {isUploading && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      height: 4, borderRadius: 2, background: `${T.border}`,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${uploadProgress}%`,
                        background: `linear-gradient(90deg, ${T.accent}, ${T.accentSoft})`,
                        borderRadius: 2, transition: 'width 0.3s',
                      }} />
                    </div>
                    <p style={{ fontSize: '0.65rem', color: T.textMuted, marginTop: 4 }}>
                      Analyse OCR en cours... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                {/* OCR Result */}
                {ocrResult && (
                  <div className="planning-note-item" style={{
                    marginTop: 10, padding: '10px 12px',
                    borderRadius: 10, fontSize: '0.75rem',
                    background: ocrResult.startsWith('Succès') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${ocrResult.startsWith('Succès') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    color: ocrResult.startsWith('Succès') ? '#10b981' : '#f59e0b',
                    lineHeight: 1.5,
                  }}>
                    {ocrResult}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.border}, transparent)`, marginBottom: 20 }} />

          {/* ── Selected Day Detail ── */}
          {selectedDate ? (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: T.text, margin: 0 }}>
                    {formatSelectedDate(selectedDate)}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0 }}>
                    {selectedDateNotes.length} note(s) · {selectedDateEvents.length} événement(s) · {selectedDateIA.length} activité(s) IA
                  </p>
                </div>
                <button
                  onClick={() => { setShowNoteEditor(true); }}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
                    color: dark ? '#0b2a4a' : '#fff',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${T.accent}40`,
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  title="Ajouter une note"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              {/* ── IA Activity (Raisonnement) ── */}
              {selectedDateIA.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{
                    fontSize: '0.65rem', fontWeight: 700, color: T.accent,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Brain size={12} /> Activité Raisonnement IA
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedDateIA.map((item, i) => (
                      <div key={i} className="planning-note-item" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: `${T.accent}08`,
                        border: `1px solid ${T.accent}20`,
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>{getModeIcon(item.mode)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.text }}>
                            {getModeLabel(item.mode)}
                            {item.subject && (
                              <span style={{ fontWeight: 500, color: T.accent, marginLeft: 6 }}>
                                — {item.subject}
                              </span>
                            )}
                          </div>
                          {item.text && (
                            <div style={{
                              fontSize: '0.65rem', color: T.textMuted, marginTop: 2,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.text.substring(0, 80)}...
                            </div>
                          )}
                        </div>
                        <span className="planning-ia-badge" style={{
                          background: `${T.accent}15`,
                          color: T.accent,
                        }}>
                          IA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Events ── */}
              {selectedDateEvents.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{
                    fontSize: '0.65rem', fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                  }}>
                    Événements
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedDateEvents.map((evt) => (
                      <div key={evt.id} className="planning-note-item" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: `${CATEGORY_CONFIG[evt.category]?.color || T.accent}10`,
                        border: `1px solid ${CATEGORY_CONFIG[evt.category]?.color || T.accent}25`,
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>
                          {CATEGORY_CONFIG[evt.category]?.emoji}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>
                            {evt.title}
                          </div>
                          {evt.time && (
                            <div style={{ fontSize: '0.65rem', color: T.textMuted }}>
                              {evt.time}
                            </div>
                          )}
                        </div>
                        {evt.source === 'ocr' && (
                          <span className="planning-ia-badge" style={{
                            background: 'rgba(139,92,246,0.15)',
                            color: '#8b5cf6',
                          }}>
                            OCR
                          </span>
                        )}
                        <button onClick={async () => {
                          const updated = await deleteEvent(evt.id);
                          setEvents(updated);
                        }} style={{
                          background: 'transparent', border: 'none',
                          color: T.textMuted, cursor: 'pointer', padding: 2,
                          transition: 'color 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Notes ── */}
              {selectedDateNotes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{
                    fontSize: '0.65rem', fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                  }}>
                    Notes ({selectedDateNotes.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedDateNotes.map((note) => {
                      const cfg = NOTE_TYPE_CONFIG[note.type];
                      const catCfg = CATEGORY_CONFIG[note.category];
                      return (
                        <div key={note.id} className="planning-note-item" style={{
                          padding: '12px 14px', borderRadius: 12,
                          background: `${T.card}90`,
                          border: `1px solid ${T.border}`,
                          transition: 'all 0.2s',
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                          }}>
                            {/* Checkbox for objectif/devoir */}
                            {(note.type === 'objectif' || note.type === 'devoir') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleChecked(note.id); }}
                                className={note.checked ? 'planning-checkbox-bounce' : ''}
                                style={{
                                  width: 22, height: 22, borderRadius: 6,
                                  border: `2px solid ${note.checked ? '#10b981' : T.border}`,
                                  background: note.checked ? '#10b981' : 'transparent',
                                  color: '#fff', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.3s', flexShrink: 0,
                                }}
                              >
                                {note.checked && <Check size={13} strokeWidth={3} />}
                              </button>
                            )}

                            <span style={{
                              color: cfg.color, display: 'flex', alignItems: 'center',
                            }}>
                              <NoteTypeIcon type={note.type} size={15} />
                            </span>

                            <span style={{
                              fontSize: '0.8rem', fontWeight: 700, color: T.text, flex: 1,
                              textDecoration: note.checked ? 'line-through' : 'none',
                              opacity: note.checked ? 0.6 : 1,
                            }}>
                              {note.title}
                            </span>

                            <span className="planning-category-tag" style={{
                              background: `${catCfg.color}15`,
                              color: catCfg.color,
                              border: `1px solid ${catCfg.color}30`,
                              fontSize: '0.55rem', padding: '2px 6px',
                            }}>
                              {catCfg.emoji}
                            </span>

                            <button onClick={() => handleDeleteNote(note.id)} style={{
                              background: 'transparent', border: 'none',
                              color: T.textMuted, cursor: 'pointer', padding: 2,
                              transition: 'color 0.2s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {note.subject && (
                            <div style={{ fontSize: '0.65rem', color: T.accent, fontWeight: 600, marginBottom: 4, marginLeft: note.type === 'objectif' || note.type === 'devoir' ? 30 : 0 }}>
                              📚 {note.subject}
                            </div>
                          )}

                          {note.content && (
                            <div style={{
                              fontSize: '0.72rem', color: T.textMuted, lineHeight: 1.5,
                              marginLeft: note.type === 'objectif' || note.type === 'devoir' ? 30 : 0,
                            }}>
                              {note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedDateNotes.length === 0 && selectedDateEvents.length === 0 && selectedDateIA.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: T.textMuted,
                }}>
                  <Calendar size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Aucune activité</p>
                  <p style={{ fontSize: '0.72rem' }}>Cliquez + pour ajouter une note</p>
                </div>
              )}
            </div>
          ) : (
            /* No date selected */
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: T.textMuted,
            }}>
              <Calendar size={56} style={{ opacity: 0.15, marginBottom: 16 }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6, color: T.text }}>
                Sélectionnez un jour
              </p>
              <p style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                Cliquez sur un jour du calendrier pour voir les notes, événements et activités IA
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════ NOTE EDITOR MODAL ══════════ */}
      {showNoteEditor && selectedDate && (
        <div
          className="planning-modal-overlay"
          onClick={() => resetNoteEditor()}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            className="planning-modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              width: 520, maxHeight: '85vh',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: `0 32px 64px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${T.border}`,
              background: `${T.accent}08`,
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: T.text, margin: 0 }}>
                  Nouvelle note
                </h3>
                <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0 }}>
                  {formatSelectedDate(selectedDate)}
                </p>
              </div>
              <button onClick={() => resetNoteEditor()} style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${T.border}`, border: 'none',
                color: T.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.border; e.currentTarget.style.color = T.text; }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(85vh - 140px)' }} className="planning-scroll">
              {/* Note Type Selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Type de note
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                  {(Object.entries(NOTE_TYPE_CONFIG) as [NoteType, typeof NOTE_TYPE_CONFIG[NoteType]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNoteType(key)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '12px 8px', borderRadius: 12,
                        background: noteType === key ? `${cfg.color}15` : `${T.card}60`,
                        border: `2px solid ${noteType === key ? cfg.color : T.border}`,
                        color: noteType === key ? cfg.color : T.textMuted,
                        cursor: 'pointer', transition: 'all 0.25s',
                        gap: 6,
                      }}
                    >
                      <NoteTypeIcon type={key} size={20} />
                      <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Catégorie
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNoteCategory(key)}
                      className="planning-category-tag"
                      style={{
                        background: noteCategory === key ? `${cfg.color}20` : `${T.card}60`,
                        color: noteCategory === key ? cfg.color : T.textMuted,
                        border: `2px solid ${noteCategory === key ? cfg.color : T.border}`,
                        cursor: 'pointer', padding: '6px 14px', fontSize: '0.75rem',
                      }}
                    >
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Matière (optionnel)
                </label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <input
                    list="subjects-list"
                    value={noteSubject}
                    onChange={e => setNoteSubject(e.target.value)}
                    placeholder="Ex: Mathématiques, Physique..."
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: 10, border: `1px solid ${T.border}`,
                      background: `${T.card}60`, color: T.text,
                      fontSize: '0.85rem', outline: 'none',
                      transition: 'border-color 0.3s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                  />
                  <datalist id="subjects-list">
                    {existingSubjects.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Titre *
                </label>
                <input
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Titre de la note..."
                  style={{
                    width: '100%', padding: '10px 14px', marginTop: 6,
                    borderRadius: 10, border: `1px solid ${T.border}`,
                    background: `${T.card}60`, color: T.text,
                    fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>

              {/* Content */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contenu
                </label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Détails, notes, objectifs..."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 14px', marginTop: 6,
                    borderRadius: 10, border: `1px solid ${T.border}`,
                    background: `${T.card}60`, color: T.text,
                    fontSize: '0.8rem', outline: 'none', resize: 'vertical',
                    lineHeight: 1.6, transition: 'border-color 0.3s',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveNote}
                disabled={!noteTitle.trim()}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12, border: 'none',
                  background: noteTitle.trim()
                    ? `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`
                    : T.border,
                  color: noteTitle.trim() ? (dark ? '#0b2a4a' : '#fff') : T.textMuted,
                  fontSize: '0.9rem', fontWeight: 800,
                  cursor: noteTitle.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  boxShadow: noteTitle.trim() ? `0 8px 24px ${T.accent}40` : 'none',
                }}
                onMouseEnter={e => { if (noteTitle.trim()) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={18} /> Enregistrer la note
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ OCR REVIEW MODAL ══════════ */}
      {showOcrReview && (
        <div
          className="planning-modal-overlay"
          onClick={() => setShowOcrReview(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            className="planning-modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              width: 640, maxHeight: '85vh',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${T.border}`,
              background: `${T.accent}08`,
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} color={T.accent} />
                  Résultat de l'extraction OCR
                </h3>
                <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: '4px 0 0' }}>
                  {ocrItems.length} élément(s) détecté(s) — Vérifiez et assignez les dates manquantes
                </p>
              </div>
              <button onClick={() => setShowOcrReview(false)} style={{
                width: 32, height: 32, borderRadius: 8,
                background: T.border, border: 'none',
                color: T.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.border; e.currentTarget.style.color = T.text; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Status bar */}
            <div style={{
              padding: '10px 24px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: `1px solid ${T.border}`,
              background: allOcrItemsHaveDates ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
              flexShrink: 0,
            }}>
              {allOcrItemsHaveDates ? (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    Tous les éléments ont une date — Prêt à importer !
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} color="#f59e0b" />
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                    {ocrItems.length - ocrItemsWithDates} élément(s) sans date — Assignez une date pour les importer
                  </span>
                </>
              )}
            </div>

            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }} className="planning-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ocrItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="planning-note-item"
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: item.hasDate ? `rgba(16,185,129,0.06)` : `rgba(245,158,11,0.06)`,
                      border: `1px solid ${item.hasDate ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      transition: 'all 0.3s',
                    }}
                  >
                    {/* Item header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: item.hasDate ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: item.hasDate ? '#10b981' : '#f59e0b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800,
                      }}>
                        {idx + 1}
                      </div>

                      {/* Editable title */}
                      <input
                        value={item.title}
                        onChange={e => updateOcrItemTitle(item.id, e.target.value)}
                        style={{
                          flex: 1, padding: '6px 10px',
                          borderRadius: 8, border: `1px solid ${T.border}`,
                          background: `${T.card}60`, color: T.text,
                          fontSize: '0.8rem', fontWeight: 600, outline: 'none',
                          transition: 'border-color 0.3s',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                        onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                      />

                      {/* Remove button */}
                      <button onClick={() => removeOcrItem(item.id)} style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.textMuted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Date, Subject & Time row */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Date input */}
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 700, color: item.hasDate ? '#10b981' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.hasDate ? <><CheckCircle2 size={12} /> Date détectée</> : <><AlertCircle size={12} /> Date requise</>}
                        </label>
                        <input
                          type="date"
                          value={item.date}
                          onChange={e => updateOcrItemDate(item.id, e.target.value)}
                          style={{
                            width: '100%', padding: '7px 10px', marginTop: 3,
                            borderRadius: 8,
                            border: `1px solid ${item.hasDate ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.4)'}`,
                            background: item.hasDate ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
                            color: T.text, fontSize: '0.8rem', outline: 'none',
                            transition: 'border-color 0.3s',
                            boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                          onBlur={e => { e.currentTarget.style.borderColor = item.date ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.4)'; }}
                        />
                      </div>

                      {/* Subject input */}
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 700, color: item.subject ? '#10b981' : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.subject ? <><CheckCircle2 size={12} /> Matière détectée</> : 'Matière (optionnel)'}
                        </label>
                        <input
                          list="ocr-subjects-list"
                          value={item.subject}
                          onChange={e => updateOcrItemSubject(item.id, e.target.value)}
                          placeholder="Ex: Maths..."
                          style={{
                            width: '100%', padding: '7px 10px', marginTop: 3,
                            borderRadius: 8,
                            border: `1px solid ${item.subject ? 'rgba(16,185,129,0.3)' : T.border}`,
                            background: item.subject ? 'rgba(16,185,129,0.05)' : `${T.card}60`,
                            color: T.text,
                            fontSize: '0.8rem', outline: 'none',
                            transition: 'border-color 0.3s',
                            boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                          onBlur={e => { e.currentTarget.style.borderColor = item.subject ? 'rgba(16,185,129,0.3)' : T.border; }}
                        />
                      </div>

                      {/* Time display */}
                      {item.time && (
                        <div style={{ minWidth: 100 }}>
                          <label style={{ fontSize: '0.6rem', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Créneau
                          </label>
                          <div style={{
                            padding: '7px 10px', marginTop: 3,
                            borderRadius: 8,
                            border: `1px solid ${T.accent}30`,
                            background: `${T.accent}08`,
                            color: T.text, fontSize: '0.8rem',
                            fontWeight: 600,
                          }}>
                            {item.time}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw OCR text preview */}
              {ocrRawText && (
                <details style={{ marginTop: 16 }}>
                  <summary style={{
                    fontSize: '0.7rem', fontWeight: 600, color: T.textMuted,
                    cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <FileText size={14} /> Voir le texte brut extrait
                  </summary>
                  <div style={{
                    marginTop: 8, padding: '10px 12px',
                    borderRadius: 10, fontSize: '0.7rem',
                    background: `${T.card}60`,
                    border: `1px solid ${T.border}`,
                    color: T.textMuted, lineHeight: 1.6,
                    maxHeight: 160, overflowY: 'auto',
                    whiteSpace: 'pre-wrap', fontFamily: 'monospace',
                  }}>
                    {ocrRawText.substring(0, 2000)}
                  </div>
                </details>
              )}

              <datalist id="ocr-subjects-list">
                {existingSubjects.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* Footer actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, flexShrink: 0,
            }}>
              <div style={{ fontSize: '0.7rem', color: T.textMuted }}>
                <strong style={{ color: T.accent }}>{ocrItemsWithDates}</strong> / {ocrItems.length} prêt(s) à importer
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowOcrReview(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'transparent', border: `1px solid ${T.border}`,
                    color: T.textMuted, fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmOcrImport}
                  disabled={ocrItemsWithDates === 0}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    background: ocrItemsWithDates > 0
                      ? `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`
                      : T.border,
                    color: ocrItemsWithDates > 0 ? (dark ? '#0b2a4a' : '#fff') : T.textMuted,
                    fontSize: '0.8rem', fontWeight: 800,
                    border: 'none',
                    cursor: ocrItemsWithDates > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    boxShadow: ocrItemsWithDates > 0 ? `0 6px 20px ${T.accent}40` : 'none',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (ocrItemsWithDates > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <ClipboardList size={16} />
                  Importer {ocrItemsWithDates} cours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
