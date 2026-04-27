import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../reutilisable/Themecontext';
import { loadHistory } from '../utils/api_ia';
import { aggregateProgress, SubjectProgress } from '../utils/progressionStats';
import { ArrowUp, ArrowDown, Home, TrendingUp } from 'lucide-react';

export default function ProgressionPage() {
  const navigate = useNavigate();
  const { dark, T } = useTheme();
  const [progressData, setProgressData] = useState<SubjectProgress[]>([]);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    const loadProgressData = async () => {
      const history = await loadHistory();
      const progress = aggregateProgress(history);
      setProgressData(progress.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    };

    loadProgressData();
    const interval = setInterval(loadProgressData, 1000); // Refresh toutes les 1s
    return () => clearInterval(interval);
  }, []);

  // Calcul des statistiques globales
  const globalStats = useMemo(() => {
    if (progressData.length === 0) {
      return {
        avgQCMBefore: 0,
        avgQCMAfter: 0,
        improvement: 0,
        totalSubjects: 0,
      };
    }

    const validQCMBefore = progressData.filter(p => p.qcmBefore !== null);
    const validQCMAfter = progressData.filter(p => p.qcmAfter !== null);

    const avgQCMBefore = validQCMBefore.length > 0 ? validQCMBefore.reduce((s, p) => s + (p.qcmBefore || 0), 0) / validQCMBefore.length : 0;
    const avgQCMAfter = validQCMAfter.length > 0 ? validQCMAfter.reduce((s, p) => s + (p.qcmAfter || 0), 0) / validQCMAfter.length : 0;
    const improvement = avgQCMAfter - avgQCMBefore;

    return {
      avgQCMBefore,
      avgQCMAfter,
      improvement,
      totalSubjects: progressData.length,
    };
  }, [progressData]);

  const getProgressColor = (before: number | null, after: number | null) => {
    if (before === null || after === null) return T.textMuted;
    const diff = after - before;
    if (diff > 0.1) return '#10b981'; // vert
    if (diff < -0.1) return '#ef4444'; // rouge
    return '#f59e0b'; // orange
  };

  // Système de notation avec couleurs
  const getGradeColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // Vert - Excellent
    if (score >= 0.65) return '#f59e0b'; // Orange/Jaune - Bien
    if (score >= 0.5) return '#f97316'; // Orange - Moyenne
    return '#ef4444'; // Rouge - Mauvaise/À réviser
  };

  const getGradeLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.65) return 'Bien';
    if (score >= 0.5) return 'Moyenne';
    return 'À réviser';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Orbs décoratifs */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${T.accent}30 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${T.accentSoft}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
              }}
            >
               Votre Progression
            </h1>
            <p style={{ color: T.textMuted, fontSize: '1rem' }}>
              Suivez vos améliorations à travers toutes les matières
            </p>
          </div>
          <button
            onClick={() => navigate('/raisonnement')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${T.accent}20`,
              border: `2px solid ${T.accent}`,
              color: T.accent,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            title="Retour"
          >
            <Home size={24} />
          </button>
        </div>


        {/* Tableau Principal */}
        {progressData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
              border: `1px solid ${T.border}`,
              borderRadius: '20px',
              overflow: 'hidden',
              backdropFilter: 'blur(32px)',
              boxShadow: `0 8px 32px ${T.accent}20`,
            }}
          >
            {/* En-têtes du tableau */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 0.8fr',
                gap: '16px',
                padding: '24px',
                background: `linear-gradient(135deg, ${T.accent}20 0%, ${T.accentSoft}10 100%)`,
                borderBottom: `1px solid ${T.border}`,
                fontWeight: 'bold',
                color: T.accent,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              <div>Matière</div>
              <div style={{ textAlign: 'center' }}>Résumé</div>
              <div style={{ textAlign: 'center' }}>QCM Avant</div>
              <div style={{ textAlign: 'center' }}>QCM Après</div>
              <div style={{ textAlign: 'center' }}>Progrès</div>
            </div>

            {/* Rows */}
            {progressData.map((row, idx) => {
              const improvement = row.qcmBefore && row.qcmAfter ? row.qcmAfter - row.qcmBefore : null;
              const isHovered = hoveredRow === row.subject;
              const progressColor = getProgressColor(row.qcmBefore, row.qcmAfter);

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 0.8fr',
                    gap: '16px',
                    padding: '24px',
                    borderBottom: `2px solid ${T.border}`,
                    background: isHovered ? `${T.accent}10` : 'transparent',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    alignItems: 'center',
                  }}
                  onMouseEnter={() => setHoveredRow(row.subject)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Matière */}
                  <div>
                    <p style={{ color: T.text, fontWeight: '600', fontSize: '1rem', marginBottom: '4px' }}>
                      {row.subject}
                    </p>
                    <p style={{ color: T.textMuted, fontSize: '0.75rem' }}>
                      Mis à jour: {formatDate(row.lastUpdated)}
                    </p>
                  </div>

                  {/* Résumé */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: T.text, margin: 0 }}>
                      {row.resumeCount}
                    </p>
                  </div>

                  {/* QCM Avant */}
                  <div style={{ textAlign: 'center' }}>
                    {row.qcmBeforeLabel !== null && row.qcmBefore !== null ? (
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getGradeColor(row.qcmBefore), margin: 0 }} title={getGradeLabel(row.qcmBefore)}>
                        {row.qcmBeforeLabel}
                      </p>
                    ) : (
                      <p style={{ color: T.textMuted, margin: 0 }}>—</p>
                    )}
                  </div>

                  {/* QCM Après */}
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    {row.qcmAfterLabel !== null && row.qcmAfter !== null ? (
                      <>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getGradeColor(row.qcmAfter), margin: 0 }} title={getGradeLabel(row.qcmAfter)}>
                          {row.qcmAfterLabel}
                        </p>
                        {improvement !== null && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '0',
                              background: improvement > 0 ? '#10b981' : '#ef4444',
                              color: 'white',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {improvement > 0 ? '+' : ''}{(improvement * 100).toFixed(0)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ color: T.textMuted, margin: 0 }}>—</p>
                    )}
                  </div>


                  {/* Progrès */}
                  <div style={{ textAlign: 'center' }}>
                    {improvement !== null ? (
                      <>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: improvement > 0 ? '#10b981' : improvement < 0 ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {improvement > 0 ? <ArrowUp size={20} /> : improvement < 0 ? <ArrowDown size={20} /> : '—'}
                          {Math.abs(improvement * 100).toFixed(0)}%
                        </div>
                      </>
                    ) : (
                      <p style={{ color: T.textMuted }}>—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend/Grading System */}
          <div style={{ marginTop: '32px', padding: '24px', background: `${T.card}40`, borderRadius: '16px', border: `1px solid ${T.border}40` }}>
            <p style={{ color: T.textMuted, fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
               Système de notation
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { score: 0.9, label: 'Excellent ', color: '#10b981', description: '≥ 80%' },
                { score: 0.72, label: 'Bien ', color: '#f59e0b', description: '65-80%' },
                { score: 0.57, label: 'Moyenne ', color: '#f97316', description: '50-65%' },
                { score: 0.4, label: 'À réviser ', color: '#ef4444', description: '< 50%' },
              ].map((grade, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: `${grade.color}15`,
                    border: `1px solid ${grade.color}40`,
                    borderRadius: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${grade.color} 0%, ${grade.color}80 100%)`,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ color: grade.color, fontWeight: '600', fontSize: '0.875rem' }}>{grade.label}</p>
                    <p style={{ color: T.textMuted, fontSize: '0.75rem' }}>{grade.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        ) : (
          <div
            style={{
              background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
              border: `1px solid ${T.border}`,
              borderRadius: '20px',
              padding: '60px 24px',
              textAlign: 'center',
              backdropFilter: 'blur(32px)',
            }}
          >
            <TrendingUp size={64} style={{ color: T.textMuted, marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: T.textMuted, fontSize: '1.125rem', marginBottom: '24px' }}>
              Aucune donnée de progression encore
            </p>
            <button
              onClick={() => navigate('/raisonnement')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
                color: dark ? '#0b2a4a' : '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              ➜ Commencer maintenant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
