/**
 * Environment validation for EduQuest
 * This file ensures required environment variables are present
 */

// Only validate in server-side context
if (typeof window === 'undefined') {
  // Check for required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in production');
    }
  }
  
  // Warn about missing API key in development
  if (process.env.NODE_ENV === 'development' && !process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found. Some features may not work properly.');
    console.warn('   Create a .env.local file and add: GEMINI_API_KEY=your_api_key');
    console.warn('   Get your key from: https://aistudio.google.com/app/apikey');
  }
}

export {}; 