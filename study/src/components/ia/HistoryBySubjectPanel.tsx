import { useMemo, useState } from 'react';
import { useTheme } from '../../reutilisable/Themecontext';
import { ChevronDown, BookOpen, CheckCircle, MessageSquare, MoreVertical, Plus } from 'lucide-react';
import type { HistoryItem } from '../../utils/api_ia';

interface HistoryBySubjectPanelProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onCreateNew: (subject: string, mode: 'resume' | 'qcm' | 'qr' | 'chat') => void;
}

export default function HistoryBySubjectPanel({
  history,
  onSelectItem,
  onCreateNew
}: HistoryBySubjectPanelProps) {
  const { dark, T } = useTheme();
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Grouper par sujet
  const groupedBySubject = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};

    history.forEach(item => {
      const subject = item.subject || 'Non catégorisé';
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [history]);

  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'resume': return '📚';
      case 'qcm': return '✅';
      case 'qr': return '❓';
      case 'chat': return '💬';
      default: return '📄';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'resume': return 'Résumé';
      case 'qcm': return 'QCM';
      case 'qr': return 'Q/R';
      case 'chat': return 'Discussion';
      default: return mode;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  };

  if (history.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 16px',
        color: T.textMuted,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
        <p style={{ fontSize: '0.9rem', margin: 0 }}>Aucun historique</p>
        <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0', opacity: 0.7 }}>Les éléments que vous créez apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 0',
    }}>
      {groupedBySubject.map(([subject, items]) => {
        const isExpanded = expandedSubjects.has(subject);
        // Compter par type
        const counts = {
          resume: items.filter(i => i.mode === 'resume').length,
          qcm: items.filter(i => i.mode === 'qcm').length,
          qr: items.filter(i => i.mode === 'qr').length,
          chat: items.filter(i => i.mode === 'chat').length,
        };

        return (
          <div key={subject} style={{
            borderRadius: '8px',
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
            background: isExpanded ? `${T.card}80` : 'transparent',
            transition: 'all 0.2s'
          }}>
            {/* Subject Header */}
            <div
              onClick={() => toggleSubject(subject)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${T.accent}20 0%, ${T.accentSoft}20 100%)`,
                transition: 'all 0.2s',
                borderBottom: isExpanded ? `1px solid ${T.border}` : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(135deg, ${T.accent}30 0%, ${T.accentSoft}30 100%)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(135deg, ${T.accent}20 0%, ${T.accentSoft}20 100%)`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <BookOpen size={18} color={T.accent} />
                <div>
                  <div style={{ fontWeight: 'bold', color: T.text }}>
                    {subject}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '2px' }}>
                    {Object.entries(counts)
                      .filter(([_, count]) => count > 0)
                      .map(([mode, count]) => `${count} ${getModeLabel(mode)}`)
                      .join(' • ')}
                  </div>
                </div>
              </div>

              <ChevronDown
                size={18}
                style={{
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: T.accent,
                }}
              />
            </div>

            {/* Content - Items List */}
            {isExpanded && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '8px',
                gap: '4px',
                background: `${T.card}40`,
              }}>
                {/* Grouped by Mode */}
                {(['resume', 'qcm', 'qr', 'chat'] as const).map(mode => {
                  const modeItems = items.filter(i => i.mode === mode);
                  if (modeItems.length === 0) return null;

                  return (
                    <div key={mode} style={{ marginBottom: '8px' }}>
                      {/* Mode Header */}
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: T.textMuted,
                        padding: '8px 8px 4px 8px',
                        textTransform: 'uppercase',
                        opacity: 0.7,
                      }}>
                        {getModeIcon(mode)} {getModeLabel(mode)}
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {modeItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => onSelectItem(item)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              background: dark ? `${T.card}60` : `${T.card}40`,
                              border: `1px solid ${T.border}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background = `${T.accent}20`;
                              (e.currentTarget as HTMLDivElement).style.borderColor = T.accent;
                              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background = dark ? `${T.card}60` : `${T.card}40`;
                              (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
                              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.85rem',
                                color: T.text,
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {mode === 'resume' && item.result
                                  ? item.result.substring(0, 50) + '...'
                                  : mode === 'qcm'
                                  ? item.result ? `${item.result.split('\n').length} questions` : 'QCM'
                                  : mode === 'qr'
                                  ? item.question?.substring(0, 40) + '...' || 'Question'
                                  : item.userAnswer?.substring(0, 40) + '...' || 'Message'
                                }
                              </div>
                              <div style={{
                                fontSize: '0.7rem',
                                color: T.textMuted,
                                marginTop: '2px',
                              }}>
                                {getTimeAgo(item.timestamp)}
                              </div>
                            </div>

                            <CheckCircle
                              size={16}
                              color={T.accent}
                              style={{ marginLeft: '8px', flexShrink: 0 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Create New Button for this Subject */}
                <div style={{
                  borderTop: `1px solid ${T.border}`,
                  paddingTop: '8px',
                  marginTop: '8px',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                  }}>
                    <button
                      onClick={() => onCreateNew(subject, 'resume')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${T.border}`,
                        background: `${T.accent}10`,
                        color: T.accent,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}25`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      }}
                    >
                      <Plus size={12} /> Résumé
                    </button>
                    <button
                      onClick={() => onCreateNew(subject, 'qcm')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${T.border}`,
                        background: `${T.accent}10`,
                        color: T.accent,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}25`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      }}
                    >
                      <Plus size={12} /> QCM
                    </button>
                    <button
                      onClick={() => onCreateNew(subject, 'qr')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${T.border}`,
                        background: `${T.accent}10`,
                        color: T.accent,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}25`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      }}
                    >
                      <Plus size={12} /> Q/R
                    </button>
                    <button
                      onClick={() => onCreateNew(subject, 'chat')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${T.border}`,
                        background: `${T.accent}10`,
                        color: T.accent,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}25`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      }}
                    >
                      <Plus size={12} /> Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
