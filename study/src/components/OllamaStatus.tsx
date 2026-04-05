import { useEffect, useState } from 'react';
import { checkOllamaAvailable, getModelInfo, OLLAMA_SETUP_GUIDE } from '../../utils/ollamaConfig';

export default function OllamaStatus() {
  const [available, setAvailable] = useState(false);
  const [modelInfo, setModelInfo] = useState<{ name: string; size: string; details?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const isAvailable = await checkOllamaAvailable();
      setAvailable(isAvailable);

      if (isAvailable) {
        const info = await getModelInfo();
        setModelInfo(info);
      }
      setLoading(false);
    };

    check();
    const interval = setInterval(check, 10000); // Vérifier toutes les 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>⏳ Vérification Ollama...</p>
      </div>
    );
  }

  if (available && modelInfo) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          borderRadius: '8px',
          fontSize: '0.875rem',
        }}
      >
        <p style={{ color: '#22c55e', margin: '0 0 8px 0', fontWeight: '600' }}>✅ Ollama Actif (Hors Ligne)</p>
        <p style={{ color: '#cbd5e1', margin: 0 }}>
          Modèle: <strong>{modelInfo.name}</strong> ({modelInfo.size})
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
          Toutes les générations fonctionnent hors ligne
        </p>
      </div>
    );
  }

  // Ollama non disponible
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        borderRadius: '8px',
        fontSize: '0.875rem',
      }}
    >
      <p style={{ color: '#ef4444', margin: '0 0 12px 0', fontWeight: '600' }}>⚠️ Ollama Non Disponible</p>
      <p style={{ color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: '1.5' }}>
        Le service Ollama n'est pas accessible sur <code>http://localhost:11434</code>. Les générations IA ne
        fonctionneront pas.
      </p>

      <details style={{ cursor: 'pointer' }}>
        <summary style={{ color: '#06b6d4', fontWeight: '600', marginBottom: '8px', userSelect: 'none' }}>
          📖 Instructions Installation
        </summary>
        <pre
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '12px',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.75rem',
            color: '#cbd5e1',
            margin: '8px 0 0 0',
          }}
        >
          {OLLAMA_SETUP_GUIDE}
        </pre>
      </details>
    </div>
  );
}
