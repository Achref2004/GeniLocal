import { HistoryItem } from './api_ia';

export interface SubjectProgress {
  subject: string;
  qcmBefore: number | null;
  qcmBeforeLabel: string | null;
  qcmAfter: number | null;
  qcmAfterLabel: string | null;
  resumeCount: number;
  lastUpdated: string;
  qcmAttempts: number;
  remedialAttempts: number;
}

/**
 * Extrait le score d'une réponse QCM JSON (Mock stable basé sur la longueur du JSON généré)
 */
function extractQCMScore(jsonStr: string): number | null {
  try {
    let cleanStr = jsonStr.trim();
    const start = cleanStr.indexOf('[');
    const end = cleanStr.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      cleanStr = cleanStr.substring(start, end + 1);
    }
    const questions = JSON.parse(cleanStr);
    if (Array.isArray(questions) && questions.length > 0) {
      // Return pseudo-random predictable score (2 to 5)
      return (jsonStr.length % 4) + 2;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Agrège l'historique en progression par sujet
 */
export function aggregateProgress(history: HistoryItem[]): SubjectProgress[] {
  const subjectMap = new Map<string, {
    qcmScores: number[];
    remedialScores: number[];
    resumeCount: number;
    lastTimestamp: string;
    subject: string;
  }>();

  history.forEach((item) => {
    const subject = item.subject || 'Sans matière';

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        qcmScores: [],
        remedialScores: [],
        resumeCount: 0,
        lastTimestamp: item.timestamp,
        subject,
      });
    }

    const entry = subjectMap.get(subject)!;
    entry.lastTimestamp = item.timestamp;

    if (item.mode === 'resume') {
      entry.resumeCount++;
    } else if (item.mode === 'qcm' && item.result) {
      const qcmScore = extractQCMScore(item.result) ?? 3;
      entry.qcmScores.push(qcmScore);
    } else if (item.mode === 'qcm_remedial' && item.result) {
      const remedialScore = extractQCMScore(item.result) ?? 3;
      entry.remedialScores.push(remedialScore);
    }
  });

  // Convertir en array avec SOMMES (ex: 10/15) et Ratios pour les couleurs
  return Array.from(subjectMap.values()).map((entry) => {
    const qcmBeforeSum = entry.qcmScores.reduce((a, b) => a + b, 0);
    const qcmBeforeMax = entry.qcmScores.length * 5;

    const qcmAfterSum = entry.remedialScores.reduce((a, b) => a + b, 0);
    const qcmAfterMax = entry.remedialScores.length * 5;

    return {
      subject: entry.subject,

      qcmBefore: entry.qcmScores.length > 0 ? qcmBeforeSum / qcmBeforeMax : null,
      qcmBeforeLabel: entry.qcmScores.length > 0 ? `${qcmBeforeSum}/${qcmBeforeMax}` : null,

      qcmAfter: entry.remedialScores.length > 0 ? qcmAfterSum / qcmAfterMax : null,
      qcmAfterLabel: entry.remedialScores.length > 0 ? `${qcmAfterSum}/${qcmAfterMax}` : null,

      resumeCount: entry.resumeCount,
      lastUpdated: entry.lastTimestamp,
      qcmAttempts: entry.qcmScores.length,
      remedialAttempts: entry.remedialScores.length,
    };
  });
}
