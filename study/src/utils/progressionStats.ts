import { HistoryItem } from './api_ia';

export interface SubjectProgress {
  subject: string;
  qcmBefore: number | null;
  qcmBeforeLabel: string | null;
  qcmAfter: number | null;
  qcmAfterLabel: string | null;
  qrScore: number | null;
  qrScoreLabel: string | null;
  resumeCount: number;
  lastUpdated: string;
  qcmAttempts: number;
  remedialAttempts: number;
  qrAttempts: number;
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
 * Évalue une réponse Q/R basée sur la correction
 */
function evaluateQRAnswer(user_answer: string | undefined, correction: string | undefined): number {
  if (!user_answer || !correction) return 0;
  // Simple: si la correction n'a pas "incorrect" et conctient des mots clés, considérer comme partiel
  const correctionLower = correction.toLowerCase();
  if (correctionLower.includes('incorrect') || correctionLower.includes('faux') || correctionLower.includes('non')) {
    return 2; // 2/5 pour mauvaise réponse
  } else if (correctionLower.includes('partiellement') || correctionLower.includes('presque')) {
    return 3; // 3/5 pour réponse partielle
  } else if (correctionLower.includes('correct') || correctionLower.includes('exact') || correctionLower.includes('bien')) {
    return 5; // 5/5 pour bonne réponse
  }
  return 2; // Par défaut, 2/5
}

/**
 * Agrège l'historique en progression par sujet
 */
export function aggregateProgress(history: HistoryItem[]): SubjectProgress[] {
  const subjectMap = new Map<string, {
    qcmScores: number[];
    remedialScores: number[];
    qrScores: number[];
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
        qrScores: [],
        resumeCount: 0,
        lastTimestamp: item.timestamp,
        subject,
      });
    }

    const entry = subjectMap.get(subject)!;
    entry.lastTimestamp = item.timestamp;

    if (item.mode === 'resume') {
      // Compter les résumés
      entry.resumeCount++;
    } else if (item.mode === 'qcm' && item.result) {
      // Estimer le score du QCM (0-5)
      const qcmScore = extractQCMScore(item.result) ?? 3;
      entry.qcmScores.push(qcmScore);
    } else if (item.mode === 'qcm_remedial' && item.result) {
      const remedialScore = extractQCMScore(item.result) ?? 3;
      entry.remedialScores.push(remedialScore);
    } else if (item.mode === 'qr' && item.userAnswer && item.correction) {
      const qrScore = evaluateQRAnswer(item.userAnswer, item.correction);
      entry.qrScores.push(qrScore);
    }
  });

  // Convertir en array avec SOMMES (ex: 10/15) et Ratios pour les couleurs
  return Array.from(subjectMap.values()).map((entry) => {
    const qcmBeforeSum = entry.qcmScores.reduce((a, b) => a + b, 0);
    const qcmBeforeMax = entry.qcmScores.length * 5;
    
    const qcmAfterSum = entry.remedialScores.reduce((a, b) => a + b, 0);
    const qcmAfterMax = entry.remedialScores.length * 5;
    
    const qrSum = entry.qrScores.reduce((a, b) => a + b, 0);
    const qrMax = entry.qrScores.length * 5;

    return {
      subject: entry.subject,
      
      qcmBefore: entry.qcmScores.length > 0 ? qcmBeforeSum / qcmBeforeMax : null,
      qcmBeforeLabel: entry.qcmScores.length > 0 ? `${qcmBeforeSum}/${qcmBeforeMax}` : null,
      
      qcmAfter: entry.remedialScores.length > 0 ? qcmAfterSum / qcmAfterMax : null,
      qcmAfterLabel: entry.remedialScores.length > 0 ? `${qcmAfterSum}/${qcmAfterMax}` : null,
      
      qrScore: entry.qrScores.length > 0 ? qrSum / qrMax : null,
      qrScoreLabel: entry.qrScores.length > 0 ? `${qrSum}/${qrMax}` : null,

      resumeCount: entry.resumeCount,
    lastUpdated: entry.lastTimestamp,
    qcmAttempts: entry.qcmScores.length,
    remedialAttempts: entry.remedialScores.length,
    qrAttempts: entry.qrScores.length,
    };
  });
}
