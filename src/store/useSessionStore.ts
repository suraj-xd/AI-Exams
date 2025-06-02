import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'fill' | 'true_false' | 'short' | 'long';
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string | boolean;
  isCorrect?: boolean;
  timestamp: Date;
}

export interface SessionAnalysis {
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback: string;
  accuracyScore: number;
  timestamp: Date;
}

export interface QuizSession {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  userAnswers: UserAnswer[];
  createdAt: Date;
  lastAccessed: Date;
  isCompleted: boolean;
  analysis?: SessionAnalysis;
  topic: string;
  config: {
    mcqs: number;
    fillInBlanks: number;
    trueFalse: number;
    shortType: number;
    longType: number;
  };
}

interface SessionState {
  sessions: QuizSession[];
  currentSession: QuizSession | null;
  isHydrated: boolean;
  
  // Session Management
  createSession: (name: string, topic: string, questions: any, config: any) => string;
  updateSessionName: (sessionId: string, name: string) => void;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  refreshSession: (sessionId: string) => QuizSession | null;
  
  // Progress Management
  saveAnswer: (questionId: string, answer: string | boolean) => void;
  clearAnswers: (sessionId: string) => void;
  markSessionCompleted: (sessionId: string) => void;
  resetSession: (sessionId: string) => void;
  
  // Analysis
  saveAnalysis: (sessionId: string, analysis: SessionAnalysis) => void;
  
  // Utilities
  getRecentSessions: (limit?: number) => QuizSession[];
  getSessionById: (sessionId: string) => QuizSession | undefined;
  getCompletedSessions: () => QuizSession[];
  getIncompleteSessions: () => QuizSession[];
  
  // Hydration
  setHydrated: (hydrated: boolean) => void;
}

// Helper function to convert old format to new format
const convertQuestionsFormat = (data: any): Question[] => {
  console.log('convertQuestionsFormat received data:', data);
  const questions: Question[] = [];
  
  // Convert MCQs
  if (data.mcqs) {
    console.log('Converting MCQs:', data.mcqs.length, 'questions');
    data.mcqs.forEach((mcq: any, index: number) => {
      questions.push({
        id: `mcq_${index}`,
        question: mcq.question,
        type: 'mcq',
        options: mcq.options,
        answer: mcq.answer,
        explanation: mcq.explanation,
      });
    });
  }
  
  // Convert Fill in blanks
  if (data.fill_in_the_blanks) {
    console.log('Converting Fill-in-blanks:', data.fill_in_the_blanks.length, 'questions');
    data.fill_in_the_blanks.forEach((fill: any, index: number) => {
      questions.push({
        id: `fill_${index}`,
        question: fill.question,
        type: 'fill',
        answer: fill.answer,
        explanation: fill.explanation,
      });
    });
  }
  
  // Convert True/False
  if (data.true_false) {
    console.log('Converting True/False:', data.true_false.length, 'questions');
    data.true_false.forEach((tf: any, index: number) => {
      questions.push({
        id: `tf_${index}`,
        question: tf.question,
        type: 'true_false',
        answer: tf.answer.toString(),
        explanation: tf.explanation,
      });
    });
  }
  
  // Convert Short Type
  if (data.short_type) {
    console.log('Converting Short Type:', data.short_type.length, 'questions');
    data.short_type.forEach((short: any, index: number) => {
      questions.push({
        id: `short_${index}`,
        question: short.question,
        type: 'short',
        answer: short.answer,
        points: short.points,
      });
    });
  }
  
  // Convert Long Type
  if (data.long_type) {
    console.log('Converting Long Type:', data.long_type.length, 'questions');
    data.long_type.forEach((long: any, index: number) => {
      questions.push({
        id: `long_${index}`,
        question: long.question,
        type: 'long',
        answer: long.answer,
        points: long.points,
      });
    });
  }
  
  console.log('convertQuestionsFormat returning:', questions.length, 'questions total');
  return questions;
};

const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      isHydrated: false,
      
      createSession: (name: string, topic: string, questions: any, config: any) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        const newSession: QuizSession = {
          id: sessionId,
          name: name || `Quiz on ${topic}`,
          description: `Assessment on ${topic}`,
          questions: convertQuestionsFormat(questions),
          userAnswers: [],
          createdAt: now,
          lastAccessed: now,
          isCompleted: false,
          topic,
          config,
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
        }));
        
        return sessionId;
      },
      
      updateSessionName: (sessionId: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, name } : session
          ),
        }));
      },
      
      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
      },
      
      setCurrentSession: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          const updatedSession = { ...session, lastAccessed: new Date() };
          set((state) => ({
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? updatedSession : s
            ),
          }));
        }
      },
      
      saveAnswer: (questionId: string, answer: string | boolean) => {
        set((state) => {
          if (!state.currentSession) return state;
          
          const existingAnswerIndex = state.currentSession.userAnswers.findIndex(
            (a) => a.questionId === questionId
          );
          
          const newAnswer: UserAnswer = {
            questionId,
            answer,
            timestamp: new Date(),
          };
          
          const updatedAnswers = [...state.currentSession.userAnswers];
          if (existingAnswerIndex >= 0) {
            updatedAnswers[existingAnswerIndex] = newAnswer;
          } else {
            updatedAnswers.push(newAnswer);
          }
          
          const updatedSession = {
            ...state.currentSession,
            userAnswers: updatedAnswers,
            lastAccessed: new Date(),
          };
          
          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === state.currentSession!.id ? updatedSession : s
            ),
          };
        });
      },
      
      clearAnswers: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, userAnswers: [], isCompleted: false, analysis: undefined }
              : session
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, userAnswers: [], isCompleted: false, analysis: undefined }
              : state.currentSession,
        }));
      },
      
      markSessionCompleted: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, isCompleted: true } : session
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, isCompleted: true }
              : state.currentSession,
        }));
      },
      
      resetSession: (sessionId: string) => {
        get().clearAnswers(sessionId);
      },
      
      saveAnalysis: (sessionId: string, analysis: SessionAnalysis) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, analysis, isCompleted: true } : session
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, analysis, isCompleted: true }
              : state.currentSession,
        }));
      },
      
      getRecentSessions: (limit = 5) => {
        return get()
          .sessions
          .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
          .slice(0, limit);
      },
      
      getSessionById: (sessionId: string) => {
        return get().sessions.find((session) => session.id === sessionId);
      },
      
      getCompletedSessions: () => {
        return get().sessions.filter((session) => session.isCompleted);
      },
      
      getIncompleteSessions: () => {
        return get().sessions.filter((session) => !session.isCompleted);
      },
      
      refreshSession: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          const updatedSession = { ...session, lastAccessed: new Date() };
          set((state) => ({
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? updatedSession : s
            ),
          }));
          return updatedSession;
        }
        return null;
      },
      
      setHydrated: (hydrated: boolean) => {
        set((state) => ({
          isHydrated: hydrated,
        }));
      },
    }),
    {
      name: 'eduquest-sessions',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.log('Error rehydrating sessions store:', error);
        } else {
          console.log('Sessions store rehydrated successfully');
          if (state) {
            state.setHydrated(true);
            console.log('Rehydrated sessions count:', state.sessions.length);
          }
        }
      },
    }
  )
);

export default useSessionStore; 