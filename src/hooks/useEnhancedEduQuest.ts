import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, QUESTION_CONFIG } from '../config/api';
import useCreditsStore from '../store/useCreditsStore';

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  category: 'image' | 'document' | 'unsupported';
}

interface QuestionSet {
  mcqs: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }>;
  fill_in_the_blanks: Array<{
    question: string;
    answer: string;
    explanation?: string;
  }>;
  true_false: Array<{
    question: string;
    answer: boolean;
    explanation?: string;
  }>;
  short_type: Array<{
    question: string;
    answer: string;
    points?: number;
  }>;
  long_type: Array<{
    question: string;
    answer: string;
    points?: number;
  }>;
}

interface GenerationResult {
  questions: QuestionSet;
  sessionId: string;
  extractedContent?: any[];
}

interface AnalysisData {
  shortQuestions: Array<{ question: string; answer: string }>;
  longQuestions: Array<{ question: string; answer: string }>;
}

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const useEnhancedEduQuest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const { 
    decrementCredits, 
    getApiKey, 
    isUsingLocalKey,
    credits 
  } = useCreditsStore();

  // Enhanced error handling
  const handleApiError = useCallback((err: unknown): ApiError => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<any>;
      
      if (axiosError.response?.data?.error) {
        const errorData = axiosError.response.data.error;
        
        // Handle both string and object error formats
        if (typeof errorData === 'string') {
          return {
            code: 'API_ERROR',
            message: errorData,
            details: axiosError.response?.status,
          };
        } else if (typeof errorData === 'object' && errorData.message) {
          return {
            code: errorData.code || 'API_ERROR',
            message: errorData.message,
            details: errorData.details || axiosError.response?.status,
          };
        }
      }
      
      return {
        code: axiosError.code || 'NETWORK_ERROR',
        message: axiosError.message || 'Network error occurred',
        details: axiosError.response?.status,
      };
    }
    
    if (err instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: err.message,
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }, []);

  // Get request headers with API key if available
  const getRequestHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    const localApiKey = getApiKey();
    
    if (localApiKey) {
      headers['x-api-key'] = localApiKey;
    }
    
    return headers;
  }, [getApiKey]);

  // Check credits before API call
  const checkCreditsAndDeduct = useCallback(async (): Promise<boolean> => {
    // If using local API key, don't check credits
    if (isUsingLocalKey()) {
      return true;
    }
    
    // Try to deduct credits (returns false if no credits available)
    return await decrementCredits();
  }, [decrementCredits, isUsingLocalKey]);

  // API call wrapper with error handling and credit management
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Generate questions with multimodal context
  const generateWithContext = useCallback(async (
    files: UploadedFile[],
    prompt?: string,
    config?: Partial<QuestionConfig>
  ): Promise<GenerationResult | null> => {
    // Check credits before making API call
    const canProceed = await checkCreditsAndDeduct();
    if (!canProceed) {
      setError({
        code: 'NO_CREDITS',
        message: 'You have 0 generations remaining. Please add your own API key to continue.',
      });
      return null;
    }

    return apiCall(async () => {
      const finalConfig = { ...QUESTION_CONFIG.DEFAULT, ...config };
      const headers = getRequestHeaders();
      
      // If we have files, use the multimodal endpoint
      if (files.length > 0) {
        const formData = new FormData();
        
        // Add files
        files.forEach((uploadedFile) => {
          formData.append('files', uploadedFile.file);
        });
        
        // Add prompt if provided
        if (prompt) {
          formData.append('prompt', prompt);
        }
        
        // Add configuration
        formData.append('config', JSON.stringify(finalConfig));
        
        const response = await axios.post(API_ENDPOINTS.GENERATE_WITH_CONTEXT, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...headers,
          },
          timeout: 60000, // 60 seconds for multimodal processing
        });
        
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        
        // Extract error message properly
        const errorData = response.data.error;
        let errorMessage = 'Failed to generate questions with context';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object' && errorData?.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // If only text prompt, use the text-only endpoint
      if (prompt) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const response = await axios.post(API_ENDPOINTS.GENERATE_QUESTIONS, {
          topic: prompt,
          config: finalConfig,
          sessionId,
        }, {
          headers,
        });
        
        if (response.data.success && response.data.data) {
          return {
            questions: response.data.data,
            sessionId: response.data.sessionId || sessionId,
          };
        }
        
        // Extract error message properly
        const errorData = response.data.error;
        let errorMessage = 'Failed to generate questions';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object' && errorData?.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error('No content provided');
    });
  }, [apiCall, checkCreditsAndDeduct, getRequestHeaders]);

  // Upload single file
  const uploadFile = useCallback(async (
    file: File
  ): Promise<{ text: string; fileType: string } | null> => {
    return apiCall(async () => {
      const formData = new FormData();
      formData.append('file', file);
      const headers = getRequestHeaders();
      
      const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers,
        },
      });
      
      if (response.data.success) {
        return {
          text: response.data.text,
          fileType: response.data.fileType || 'unknown',
        };
      }
      
      throw new Error(response.data.error || 'Upload failed');
    });
  }, [apiCall, getRequestHeaders]);

  // Analyze answers
  const analyzeAnswers = useCallback(async (
    data: AnalysisData
  ): Promise<string | null> => {
    return apiCall(async () => {
      const headers = getRequestHeaders();
      
      const response = await axios.post(API_ENDPOINTS.ANALYZE_ANSWERS, data, {
        headers,
      });
      
      if (response.data.success) {
        return response.data.data || response.data.feedback;
      }
      
      throw new Error(response.data.error || 'Analysis failed');
    });
  }, [apiCall, getRequestHeaders]);

  // Get random question
  const getRandomQuestion = useCallback(async (): Promise<string | null> => {
    return apiCall(async () => {
      const headers = getRequestHeaders();
      
      const response = await axios.get(API_ENDPOINTS.RANDOM_QUESTION, {
        headers,
      });
      
      if (response.data.success) {
        return response.data.data || response.data.question;
      }
      
      throw new Error(response.data.error || 'Failed to fetch random question');
    });
  }, [apiCall, getRequestHeaders]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    credits,
    isUsingLocalKey: isUsingLocalKey(),
    
    // Functions
    generateWithContext,
    uploadFile,
    analyzeAnswers,
    getRandomQuestion,
    
    // Utility functions
    clearError,
    
    // Constants for UI
    questionConfig: QUESTION_CONFIG,
  };
}; 