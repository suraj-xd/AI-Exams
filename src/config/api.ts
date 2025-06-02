/**
 * API Configuration for EduQuest
 * Centralized API endpoints and configuration
 */

// API Base Configuration
export const API_CONFIG = {
  BASE_URL: '', // Empty for Next.js API routes (same origin)
  TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/bmp'
  ],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
} as const;

// API Endpoints - Next.js API routes
export const API_ENDPOINTS = {
  // File processing
  UPLOAD: '/api/upload',
  
  // Question generation
  GENERATE_QUESTIONS: '/api/generate-questions',
  GENERATE_WITH_CONTEXT: '/api/generate-with-context',
  
  // Analysis
  ANALYZE_ANSWERS: '/api/analyze-answers',
  
  // Utilities
  RANDOM_QUESTION: '/api/random-question',
  HEALTH_CHECK: '/api/health'
} as const;

// Question generation configuration
export const QUESTION_CONFIG = {
  DEFAULT: {
    mcqs: 5,
    fillInBlanks: 5,
    trueFalse: 5,
    shortType: 3,
    longType: 2,
  },
  LIMITS: {
    mcqs: { min: 0, max: 20 },
    fillInBlanks: { min: 0, max: 20 },
    trueFalse: { min: 0, max: 20 },
    shortType: { min: 0, max: 10 },
    longType: { min: 0, max: 5 },
  }
} as const;

// File type utilities
export const isImageFile = (mimeType: string): boolean => {
  return API_CONFIG.SUPPORTED_IMAGE_TYPES.includes(mimeType as any);
};

export const isDocumentFile = (mimeType: string): boolean => {
  return API_CONFIG.SUPPORTED_DOCUMENT_TYPES.includes(mimeType as any);
};

export const isSupportedFile = (mimeType: string): boolean => {
  return isImageFile(mimeType) || isDocumentFile(mimeType);
};

export const getFileTypeCategory = (mimeType: string): 'image' | 'document' | 'unsupported' => {
  if (isImageFile(mimeType)) return 'image';
  if (isDocumentFile(mimeType)) return 'document';
  return 'unsupported';
};

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
} 