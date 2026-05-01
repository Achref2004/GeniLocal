import { useMemo } from 'react';
import type { HistoryItem } from '../../utils/api_ia';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const groups: Record<string, HistoryItem[]> = {
      "Aujourd'hui": [],
      'Hier': [],
      'Plus ancien': [],
    };
    history.forEach(item => {
      const d = new Date(item.timestamp).toDateString();
      if (d === today) groups["Aujourd'hui"].push(item);
      else if (d === yesterday) groups['Hier'].push(item);
      else groups['Plus ancien'].push(item);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [history]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'resume': return '📚';
      case 'qcm': return '✅';
      case 'qr': return '❓';
      default: return '📄';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'resume': return 'Résumé';
      case 'qcm': return 'QCM';
      case 'qr': return 'Q/R';
      default: return mode;
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">📭</div>
        <p className="text-gray-500 text-sm">Aucun historique</p>
        <p className="text-gray-600 text-xs mt-1">Vos sessions apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([label, items]) => (
        <div key={label}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            {label}
          </h4>
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-gray-800/50 transition-all group flex items-start gap-2"
              >
                <span className="text-sm mt-0.5">{getModeIcon(item.mode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-sky-400">{getModeLabel(item.mode)}</span>
                    {item.subject && <span className="text-xs text-gray-500">• {item.subject}</span>}
                    {item.result ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">✓</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-900/40 text-yellow-400 rounded">!</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {item.text?.substring(0, 60)}...
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onClear}
        className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-red-400 transition-colors border border-gray-800 rounded-lg hover:border-red-500/30"
      >
        🗑️ Effacer l'historique
      </button>
    </div>
  );
}
