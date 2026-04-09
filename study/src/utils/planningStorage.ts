// ═══════════════════════════════════════════════════════════
//  PLANNING STORAGE — Data Model + LocalStorage CRUD
// ═══════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────────

export type NoteType = 'resume' | 'question' | 'quiz' | 'objectif' | 'devoir' | 'libre';
export type EventCategory = 'etude' | 'revision' | 'examen' | 'loisir';

export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: string; color: string }> = {
  resume:   { label: 'Résumé de cours', icon: '📖', color: '#3b82f6' },
  question: { label: 'Questions',       icon: '❓', color: '#8b5cf6' },
  quiz:     { label: 'Quiz / QCM',      icon: '🧠', color: '#10b981' },
  objectif: { label: 'Objectif du jour', icon: '🎯', color: '#f59e0b' },
  devoir:   { label: 'Devoir à faire',  icon: '📝', color: '#ef4444' },
  libre:    { label: 'Note libre',       icon: '💬', color: '#64748b' },
};

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; emoji: string; color: string }> = {
  etude:    { label: 'Études',    emoji: '🔵', color: '#3b82f6' },
  revision: { label: 'Révisions', emoji: '🟢', color: '#10b981' },
  examen:   { label: 'Examens',   emoji: '🔴', color: '#ef4444' },
  loisir:   { label: 'Loisirs',   emoji: '🟡', color: '#f59e0b' },
};

export interface PlanningNote {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: NoteType;
  title: string;
  content: string;
  subject?: string;
  category: EventCategory;
  checked?: boolean; // for objectif/devoir
  createdAt: string;
}

export interface PlanningEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  category: EventCategory;
  source: 'manual' | 'ocr';
  time?: string; // "HH:mm"
}

// Raisonnement history item (from study_ia_history localStorage)
export interface RaisonnementHistoryItem {
  id: number;
  timestamp: string;
  mode: string;
  text?: string;
  subject?: string;
  result?: string;
  question?: string;
  userAnswer?: string;
  correction?: string;
}

// ─── Storage Keys ───────────────────────────────────────────

const NOTES_KEY = 'study_planning_notes';
const EVENTS_KEY = 'study_planning_events';
const IA_HISTORY_KEY = 'study_ia_history';

// ─── Notes CRUD ─────────────────────────────────────────────

export function loadNotes(): PlanningNote[] {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveNote(note: Omit<PlanningNote, 'id' | 'createdAt'>): PlanningNote[] {
  const notes = loadNotes();
  const newNote: PlanningNote = {
    ...note,
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  notes.unshift(newNote);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes;
}

export function updateNote(id: string, updates: Partial<PlanningNote>): PlanningNote[] {
  const notes = loadNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) {
    notes[idx] = { ...notes[idx], ...updates };
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }
  return notes;
}

export function deleteNote(id: string): PlanningNote[] {
  let notes = loadNotes();
  notes = notes.filter(n => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes;
}

export function toggleNoteChecked(id: string): PlanningNote[] {
  const notes = loadNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) {
    notes[idx].checked = !notes[idx].checked;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }
  return notes;
}

export function getNotesForDate(date: string): PlanningNote[] {
  return loadNotes().filter(n => n.date === date);
}

// ─── Events CRUD ────────────────────────────────────────────

export function loadEvents(): PlanningEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEvent(event: Omit<PlanningEvent, 'id'>): PlanningEvent[] {
  const events = loadEvents();
  const newEvent: PlanningEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
  events.push(newEvent);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return events;
}

export function saveBulkEvents(newEvents: Omit<PlanningEvent, 'id'>[]): PlanningEvent[] {
  const events = loadEvents();
  for (const evt of newEvents) {
    events.push({
      ...evt,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return events;
}

export function deleteEvent(id: string): PlanningEvent[] {
  let events = loadEvents();
  events = events.filter(e => e.id !== id);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  return events;
}

export function getEventsForDate(date: string): PlanningEvent[] {
  return loadEvents().filter(e => e.date === date);
}

// ─── Raisonnement Sync ──────────────────────────────────────

export function getRaisonnementForDate(date: string): RaisonnementHistoryItem[] {
  try {
    const data = localStorage.getItem(IA_HISTORY_KEY);
    if (!data) return [];
    const history: RaisonnementHistoryItem[] = JSON.parse(data);
    return history.filter(item => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
      return itemDate === date;
    });
  } catch {
    return [];
  }
}

// ─── Statistics ─────────────────────────────────────────────

export function getStudiedDaysCount(month?: number, year?: number): number {
  const notes = loadNotes();
  const iaHistory = loadIAHistory();

  const days = new Set<string>();

  for (const note of notes) {
    if (month !== undefined && year !== undefined) {
      const d = new Date(note.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    }
    days.add(note.date);
  }

  for (const item of iaHistory) {
    if (!item.timestamp) continue;
    const d = new Date(item.timestamp);
    const dateStr = d.toISOString().split('T')[0];
    if (month !== undefined && year !== undefined) {
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    }
    days.add(dateStr);
  }

  return days.size;
}

export function getMonthStats(month: number, year: number) {
  const notes = loadNotes().filter(n => {
    const d = new Date(n.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const iaHistory = loadIAHistory().filter(item => {
    if (!item.timestamp) return false;
    const d = new Date(item.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const resumeCount = notes.filter(n => n.type === 'resume').length
    + iaHistory.filter(i => i.mode === 'resume').length;
  const quizCount = notes.filter(n => n.type === 'quiz').length
    + iaHistory.filter(i => i.mode === 'qcm').length;
  const objectifs = notes.filter(n => n.type === 'objectif');
  const objectifsCompleted = objectifs.filter(n => n.checked).length;
  const studiedDays = getStudiedDaysCount(month, year);

  return {
    studiedDays,
    resumeCount,
    quizCount,
    objectifsTotal: objectifs.length,
    objectifsCompleted,
    totalNotes: notes.length,
  };
}

function loadIAHistory(): RaisonnementHistoryItem[] {
  try {
    const data = localStorage.getItem(IA_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Date Helpers ───────────────────────────────────────────

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sunday, we want 0=Monday
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
