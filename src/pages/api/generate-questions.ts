import type { NextApiRequest, NextApiResponse } from 'next';
import { generateQuestions } from '../../utils/ai';
import { z } from 'zod';

const requestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  config: z.object({
    mcqs: z.number().min(0).max(20).default(5),
    fillInBlanks: z.number().min(0).max(20).default(5),
    trueFalse: z.number().min(0).max(20).default(5),
    shortType: z.number().min(0).max(10).default(3),
    longType: z.number().min(0).max(5).default(2),
  }).default({
    mcqs: 5,
    fillInBlanks: 5,
    trueFalse: 5,
    shortType: 3,
    longType: 2,
  }),
  sessionId: z.string().optional(),
});

interface GenerateQuestionsResponse {
  success: boolean;
  data?: any;
  error?: string;
  sessionId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateQuestionsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const validatedData = requestSchema.parse(req.body);
    const { topic, config, sessionId } = validatedData;

    // Generate a session ID if not provided
    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Generating questions for topic: "${topic}" with config:`, config);

    const questionsData = await generateQuestions(topic, config);

    // Store the data with session ID for later retrieval
    // In a production app, you'd want to use a proper database
    // For now, we'll return the data directly
    
    return res.status(200).json({
      success: true,
      data: questionsData,
      sessionId: currentSessionId,
    });

  } catch (error) {
    console.error('Question generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
    });
  }
} 