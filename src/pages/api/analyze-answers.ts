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

    const feedback = await analyzeAnswers(validatedData);

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

    return res.status(500).json({
      success: false,
      error: 'Failed to analyze answers',
    });
  }
} 