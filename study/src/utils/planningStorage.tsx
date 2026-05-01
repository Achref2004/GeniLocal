// ═══════════════════════════════════════════════════════════
//  PLANNING STORAGE — Data Model + LocalStorage CRUD
// ═══════════════════════════════════════════════════════════

import React, { ReactNode } from 'react';
import { BookOpen, HelpCircle, Brain, Target, FileText, MessageSquare, GraduationCap, PenTool, AlertCircle, Sparkles } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '../config';

// ─── Types ──────────────────────────────────────────────────

export type NoteType = 'resume' | 'question' | 'quiz' | 'objectif' | 'devoir' | 'libre';
export type EventCategory = 'etude' | 'revision' | 'examen' | 'loisir';

export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: ReactNode; color: string }> = {
  resume:   { label: 'Résumé de cours', icon: <BookOpen size={16} />, color: '#3b82f6' },
  question: { label: 'Questions',       icon: <HelpCircle size={16} />, color: '#8b5cf6' },
  quiz:     { label: 'Quiz / QCM',      icon: <Brain size={16} />, color: '#10b981' },
  objectif: { label: 'Objectif du jour', icon: <Target size={16} />, color: '#f59e0b' },
  devoir:   { label: 'Devoir à faire',  icon: <FileText size={16} />, color: '#ef4444' },
  libre:    { label: 'Note libre',       icon: <MessageSquare size={16} />, color: '#64748b' },
};

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; emoji: ReactNode; color: string }> = {
  etude:    { label: 'Études',    emoji: <GraduationCap size={16} />, color: '#3b82f6' },
  revision: { label: 'Révisions', emoji: <PenTool size={16} />, color: '#10b981' },
  examen:   { label: 'Examens',   emoji: <AlertCircle size={16} />, color: '#ef4444' },
  loisir:   { label: 'Loisirs',   emoji: <Sparkles size={16} />, color: '#f59e0b' },
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
  source?: 'manual' | 'ocr';
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



// ─── Notes CRUD ─────────────────────────────────────────────

export async function loadNotes(): Promise<PlanningNote[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`${API_BASE}/planning/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch {
  }
  return [];
}

export async function saveNote(note: Omit<PlanningNote, 'id' | 'createdAt'>): Promise<PlanningNote[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const newNote = {
        ...note,
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        item_type: 'note',
        source: 'manual',
      };
      await fetch(`${API_BASE}/planning/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newNote)
      });
    }
  } catch (e) { console.error(e); }
  return await loadNotes();
}

export async function updateNote(id: string, updates: Partial<PlanningNote>): Promise<PlanningNote[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const notes = await loadNotes();
      const existing = notes.find(n => n.id === id);
      if (existing) {
        await fetch(`${API_BASE}/planning/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...existing, ...updates, item_type: 'note' })
        });
      }
    }
  } catch (e) { console.error(e); }
  return await loadNotes();
}

export async function deleteNote(id: string): Promise<PlanningNote[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${API_BASE}/planning/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (e) { console.error(e); }
  return await loadNotes();
}

export async function toggleNoteChecked(id: string): Promise<PlanningNote[]> {
  try {
    const notes = await loadNotes();
    const existing = notes.find(n => n.id === id);
    if (existing) {
      return await updateNote(id, { checked: !existing.checked });
    }
  } catch (e) { console.error(e); }
  return await loadNotes();
}

export async function getNotesForDate(date: string): Promise<PlanningNote[]> {
  const notes = await loadNotes();
  return notes.filter(n => n.date === date);
}

// ─── Events CRUD ────────────────────────────────────────────

export async function loadEvents(): Promise<PlanningEvent[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`${API_BASE}/planning/events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch {
  }
  return [];
}

export async function saveEvent(event: Omit<PlanningEvent, 'id'>): Promise<PlanningEvent[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const newEvent = {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        item_type: 'event'
      };
      await fetch(`${API_BASE}/planning/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify([newEvent])
      });
    }
  } catch (e) { console.error(e); }
  return await loadEvents();
}

export async function saveBulkEvents(newEvents: Omit<PlanningEvent, 'id'>[]): Promise<PlanningEvent[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payloads = newEvents.map(evt => ({
        ...evt,
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        item_type: 'event'
      }));
      await fetch(`${API_BASE}/planning/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payloads)
      });
    }
  } catch (e) { console.error(e); }
  return await loadEvents();
}

export async function deleteEvent(id: string): Promise<PlanningEvent[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${API_BASE}/planning/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (e) { console.error(e); }
  return await loadEvents();
}

export async function getEventsForDate(date: string): Promise<PlanningEvent[]> {
  const events = await loadEvents();
  return events.filter(e => e.date === date);
}

// ─── Raisonnement Sync ──────────────────────────────────────

export async function getRaisonnementForDate(date: string): Promise<RaisonnementHistoryItem[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`${API_BASE}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const rawHistory = await res.json();
        const history: RaisonnementHistoryItem[] = (rawHistory || []).map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          mode: item.mode === 'qr_correct' ? 'qr' : item.mode,
          text: item.input_text || item.text || '',
          subject: item.subject || '',
          result: item.result || '',
          question: item.question || '',
          userAnswer: item.user_answer || item.userAnswer || '',
          correction: item.correction || '',
        }));
        return history.filter(item => {
          if (!item.timestamp) return false;
          const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
          return itemDate === date;
        });
    }
  } catch {
  }
  return [];
}

// ─── Statistics ─────────────────────────────────────────────

export async function getStudiedDaysCount(month?: number, year?: number): Promise<number> {
  const notes = await loadNotes();
  const iaHistory = await loadIAHistory();

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

export async function getMonthStats(month: number, year: number) {
  const allNotes = await loadNotes();
  const notes = allNotes.filter(n => {
    const d = new Date(n.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const allIAHistory = await loadIAHistory();
  const iaHistory = allIAHistory.filter(item => {
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
  const studiedDays = await getStudiedDaysCount(month, year);

  return {
    studiedDays,
    resumeCount,
    quizCount,
    objectifsTotal: objectifs.length,
    objectifsCompleted,
    totalNotes: notes.length,
  };
}

export async function loadIAHistory(): Promise<RaisonnementHistoryItem[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`${API_BASE}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const rawHistory = await res.json();
        return (rawHistory || []).map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          mode: item.mode === 'qr_correct' ? 'qr' : item.mode,
          text: item.input_text || item.text || '',
          subject: item.subject || '',
          result: item.result || '',
          question: item.question || '',
          userAnswer: item.user_answer || item.userAnswer || '',
          correction: item.correction || '',
        }));
    }
  } catch {
  }
  return [];
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
