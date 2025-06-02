import { useState, useCallback } from 'react';
import axios from 'axios';

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

interface Question {
  question: string;
  options?: string[];
  answer: string | boolean;
}

interface QuestionSet {
  mcqs: Question[];
  fill_in_the_blanks: Question[];
  true_false: Question[];
  short_type: Question[];
  long_type: Question[];
}

interface AnalysisData {
  shortQuestions: Array<{ question: string; answer: string }>;
  longQuestions: Array<{ question: string; answer: string }>;
}

export const useEduQuest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<{ text: string; fileType: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return {
          text: response.data.text,
          fileType: response.data.fileType,
        };
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateQuestions = useCallback(async (
    topic: string, 
    config?: Partial<QuestionConfig>
  ): Promise<{ data: QuestionSet; sessionId: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const defaultConfig: QuestionConfig = {
        mcqs: 5,
        fillInBlanks: 5,
        trueFalse: 5,
        shortType: 3,
        longType: 2,
      };

      const response = await axios.post('/api/generate-questions', {
        topic,
        config: { ...defaultConfig, ...config },
      });

      if (response.data.success) {
        return {
          data: response.data.data,
          sessionId: response.data.sessionId,
        };
      } else {
        throw new Error(response.data.error || 'Question generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Question generation failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeAnswers = useCallback(async (data: AnalysisData): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/analyze-answers', data);

      if (response.data.success) {
        return response.data.feedback;
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRandomQuestion = useCallback(async (): Promise<Question | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/random-question');

      if (response.data.success) {
        return response.data.question;
      } else {
        throw new Error(response.data.error || 'Failed to fetch random question');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch random question';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    uploadFile,
    generateQuestions,
    analyzeAnswers,
    getRandomQuestion,
    clearError,
  };
}; 