import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeAnswers } from '../../utils/ai';
import { z } from 'zod';

const requestSchema = z.object({
  shortQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  longQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
});

interface AnalyzeResponse {
  success: boolean;
  feedback?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Get API key from headers (user's local API key)
    const userApiKey = req.headers['x-api-key'] as string;
    
    // Check if we have an API key (either user's or process.env)
    if (!userApiKey && !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No API key available. Please provide your own Gemini API key.',
      });
    }

    const validatedData = requestSchema.parse(req.body);
    
    if (validatedData.shortQuestions.length === 0 && validatedData.longQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No questions provided for analysis',
      });
    }

    console.log('Analyzing answers for', {
      shortQuestions: validatedData.shortQuestions.length,
      longQuestions: validatedData.longQuestions.length,
    });
    console.log('Using user API key:', !!userApiKey);

    const feedback = await analyzeAnswers(validatedData, userApiKey);

    return res.status(200).json({
      success: true,
      feedback,
    });

  } catch (error) {
    console.error('Answer analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. Please check your API key.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to analyze answers',
    });
  }
} 