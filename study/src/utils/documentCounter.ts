// ─── Document Import Counter ──────────────────────────────────────────────────
// Tracks the total number of documents imported across PlanningPage and RaisonnementPage.
// Uses localStorage for cross-page persistence without backend dependency.
import { STORAGE_KEY_IMPORTED_DOCS } from '../config';

const STORAGE_KEY = STORAGE_KEY_IMPORTED_DOCS;

/**
 * Returns the current total count of imported documents.
 */
export function getImportedDocumentsCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

/**
 * Increments the document counter by `count` (default 1).
 * Returns the new total.
 */
export function incrementImportedDocuments(count: number = 1): number {
  try {
    const current = getImportedDocumentsCount();
    const updated = current + count;
    localStorage.setItem(STORAGE_KEY, String(updated));
    // Dispatch a custom event so the Dashboard can react in real time
    window.dispatchEvent(new CustomEvent('documents-imported-updated', { detail: { count: updated } }));
    return updated;
  } catch {
    return 0;
  }
}

/**
 * Resets the counter to zero (useful for testing).
 */
export function resetImportedDocuments(): void {
  localStorage.setItem(STORAGE_KEY, '0');
  window.dispatchEvent(new CustomEvent('documents-imported-updated', { detail: { count: 0 } }));
}
