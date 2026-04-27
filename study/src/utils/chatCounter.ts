// Système de comptage des messages pour 24h
import { STORAGE_KEY_CHAT_COUNT } from '../config';

export const MAX_MESSAGES_PER_DAY = 20;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // en ms

interface MessageCount {
  count: number;
  resetTime: number; // timestamp de fin des 24h
}

const STORAGE_KEY = STORAGE_KEY_CHAT_COUNT;

/**
 * Obtient le nombre de messages actuels
 */
export function getMessageCount(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;

    const parsed: MessageCount = JSON.parse(data);
    const now = Date.now();

    // Si 24h ont passé, réinitialiser
    if (now > parsed.resetTime) {
      localStorage.removeItem(STORAGE_KEY);
      return 0;
    }

    return parsed.count;
  } catch {
    return 0;
  }
}

/**
 * Incrémente le compteur
 */
export function incrementMessageCount(): number {
  try {
    let data: MessageCount;
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // Premier message
      data = {
        count: 1,
        resetTime: Date.now() + TWENTY_FOUR_HOURS,
      };
    } else {
      data = JSON.parse(stored);
      const now = Date.now();

      // Si 24h ont passé, réinitialiser
      if (now > data.resetTime) {
        data.count = 1;
        data.resetTime = now + TWENTY_FOUR_HOURS;
      } else {
        data.count++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data.count;
  } catch {
    return 0;
  }
}

/**
 * Obtient le temps restant avant réinitialisation (en heures)
 */
export function getTimeUntilReset(): string {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return "24h";

    const parsed: MessageCount = JSON.parse(data);
    const now = Date.now();
    const remaining = parsed.resetTime - now;

    if (remaining <= 0) return "Réinitialisé";

    const hours = Math.ceil(remaining / (60 * 60 * 1000));
    return `${hours}h`;
  } catch {
    return "24h";
  }
}

/**
 * Vérifie si l'utilisateur peut envoyer un message
 */
export function canSendMessage(): boolean {
  return getMessageCount() < MAX_MESSAGES_PER_DAY;
}

/**
 * Obtient les messages restants
 */
export function getRemainingMessages(): number {
  return Math.max(0, MAX_MESSAGES_PER_DAY - getMessageCount());
}
