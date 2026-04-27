/// <reference types="vite/client" />
// =============================================================================
// GeniLocal — Configuration centralisée
// =============================================================================
// Toutes les constantes de configuration sont lues depuis les variables
// d'environnement Vite (préfixe VITE_) définies dans le fichier .env
// =============================================================================

// ─── URLs Backend ─────────────────────────────────────────────────────────────
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

// ─── Ollama (IA locale) ───────────────────────────────────────────────────────
export const OLLAMA_BASE_URL: string =
  import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://localhost:11434';

export const OLLAMA_MODEL: string =
  import.meta.env.VITE_OLLAMA_MODEL ?? 'mistral';

export const OLLAMA_API_GENERATE: string = `${OLLAMA_BASE_URL}/api/generate`;
export const OLLAMA_API_TAGS: string = `${OLLAMA_BASE_URL}/api/tags`;
export const OLLAMA_API_SHOW: string = `${OLLAMA_BASE_URL}/api/show`;

// ─── Paramètres IA ────────────────────────────────────────────────────────────
export const OLLAMA_TEMPERATURE: number =
  parseFloat(import.meta.env.VITE_OLLAMA_TEMPERATURE ?? '0.7');

export const OLLAMA_NUM_PREDICT: number =
  parseInt(import.meta.env.VITE_OLLAMA_NUM_PREDICT ?? '500', 10);

export const OLLAMA_CONTEXT_LENGTH: number =
  parseInt(import.meta.env.VITE_OLLAMA_CONTEXT_LENGTH ?? '2000', 10);

export const USE_OLLAMA: boolean =
  (import.meta.env.VITE_USE_OLLAMA ?? 'true') === 'true';

// ─── Clés localStorage ────────────────────────────────────────────────────────
export const STORAGE_KEY_HISTORY: string =
  import.meta.env.VITE_STORAGE_KEY_HISTORY ?? 'study_ia_history';

export const STORAGE_KEY_AVATAR: string =
  import.meta.env.VITE_STORAGE_KEY_AVATAR ?? 'study_dicebear_config_detailed';

export const STORAGE_KEY_IMPORTED_DOCS: string =
  import.meta.env.VITE_STORAGE_KEY_IMPORTED_DOCS ?? 'genilocal_imported_documents_count';

export const STORAGE_KEY_CHAT_COUNT: string =
  import.meta.env.VITE_STORAGE_KEY_CHAT_COUNT ?? 'chat_message_count';
