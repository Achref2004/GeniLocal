import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { fetchStream, saveToHistory } from '../utils/api_ia';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export type IaTaskMode = 'resume' | 'qcm' | 'qr' | 'qr_question' | 'qr_correct' | 'qcm_remedial';

export interface IaTask {
  id: string; // Mode + Subject
  mode: IaTaskMode;
  subject: string;
  sourceText: string;
  status: 'streaming' | 'completed' | 'error';
  content: string; // Gathers the streamed content
  question?: string; // For Q/R mode
  error?: string;
}

interface IaTaskContextType {
  tasks: Record<string, IaTask>;
  startStreamTask: (
    mode: IaTaskMode,
    text: string,
    subject: string,
    language: string,
    existingQuestion?: string
  ) => string;
  cancelTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
}

const IaTaskContext = createContext<IaTaskContextType | undefined>(undefined);

// --- Custom Global notification Toast ---
const GlobalAlertToast = ({ task, onDismiss }: { task: IaTask, onDismiss: () => void }) => {
  useEffect(() => {
    if (task.status !== 'streaming') {
      const timer = setTimeout(onDismiss, 6000);
      return () => clearTimeout(timer);
    }
  }, [task.status, onDismiss]);

  const modeLabels: Record<string, string> = { resume: 'Résumé', qcm: 'QCM', qr: 'Q/R', qcm_remedial: 'Rattrapage' };

  return (
    <div style={{
      padding: '16px 20px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${task.status === 'completed' ? '#10b981' : task.status === 'error' ? '#ef4444' : '#3b82f6'}`,
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      width: 380,
      maxWidth: '90vw',
      animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: task.status === 'completed' ? 'rgba(16,185,129,0.1)' : task.status === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
        color: task.status === 'completed' ? '#10b981' : task.status === 'error' ? '#ef4444' : '#3b82f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {task.status === 'completed' ? <CheckCircle2 size={22} /> : task.status === 'error' ? <AlertTriangle size={22} /> : <div style={{width: 18, height: 18, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}/>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
          {modeLabels[task.mode] || 'IA'} - {task.subject.substring(0, 20)}{task.subject.length > 20 ? '...' : ''}
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          {task.status === 'streaming' ? 'Génération en cours...' : task.status === 'error' ? 'Une erreur est survenue.' : 'Génération terminée et sauvegardée !'}
        </p>
      </div>
      <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
        <X size={16} />
      </button>
    </div>
  );
};

export const IaTaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Record<string, IaTask>>({});
  const controllersRef = useRef<Record<string, AbortController>>({});

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    if (controllersRef.current[taskId]) {
      controllersRef.current[taskId].abort();
      delete controllersRef.current[taskId];
    }
    removeTask(taskId);
  }, [removeTask]);

  const startStreamTask = useCallback(
    (mode: IaTaskMode, text: string, subject: string, language: string, existingQuestion?: string) => {
      const taskId = `${mode}_${subject || 'general'}_${Date.now()}`;
      
      const newTask: IaTask = {
        id: taskId,
        mode,
        subject: subject || 'Sans matière',
        sourceText: text,
        status: 'streaming',
        content: '',
        question: existingQuestion
      };

      setTasks(prev => ({ ...prev, [taskId]: newTask }));

      const queryObj: any = { mode, text, subject, language };
      if (existingQuestion) {
        // For qcm_remedial mode, pass the topics as wrongTopics
        if (mode === 'qcm_remedial') {
          queryObj.wrongTopics = existingQuestion;
        } else {
          queryObj.question = existingQuestion;
        }
      }

      const controller = fetchStream(
        queryObj,
        (_token, fullText) => {
          setTasks(prev => {
            if (!prev[taskId]) return prev;
            return { ...prev, [taskId]: { ...prev[taskId], content: fullText } };
          });
        },
        async (fullText) => {
          setTasks(prev => {
            if (!prev[taskId]) return prev;
            return { ...prev, [taskId]: { ...prev[taskId], status: 'completed', content: fullText } };
          });
          delete controllersRef.current[taskId];

          // Save to history automatically
          await saveToHistory({ 
            mode, 
            text: text.substring(0, 200), 
            subject, 
            result: fullText, 
            question: existingQuestion 
          });
        },
        (err) => {
          setTasks(prev => {
            if (!prev[taskId]) return prev;
            return { ...prev, [taskId]: { ...prev[taskId], status: 'error', error: err.message, content: err.message } };
          });
          delete controllersRef.current[taskId];
        }
      );

      controllersRef.current[taskId] = controller;
      return taskId;
    },
    []
  );

  return (
    <IaTaskContext.Provider value={{ tasks, startStreamTask, cancelTask, removeTask }}>
      {children}
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 16, pointerEvents: 'none' }}>
        {Object.values(tasks).map(task => (
           <GlobalAlertToast key={task.id} task={task} onDismiss={() => removeTask(task.id)} />
        ))}
      </div>
    </IaTaskContext.Provider>
  );
};

export const useIaTaskContext = () => {
  const context = useContext(IaTaskContext);
  if (context === undefined) {
    throw new Error('useIaTaskContext must be used within an IaTaskProvider');
  }
  return context;
};
