import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { z } from 'zod';
import { 
  generateQuestionsWithContext, 
  preprocessMultimodalInput,
  QuestionSet 
} from '../../utils/multimodal';
import { ApiResponse } from '../../config/api';
import { parseMultipartForm, processMultipleFiles } from '../../utils/fileProcessing';

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const requestSchema = z.object({
  prompt: z.string().optional(),
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
});

interface GenerateWithContextResponse extends ApiResponse<{
  questions: QuestionSet;
  sessionId: string;
  extractedContent?: any[];
}> {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateWithContextResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    });
  }

  try {
    // Get API key from headers (user's local API key)
    const userApiKey = req.headers['x-api-key'] as string;
    
    // Check if we have an API key (either user's or process.env)
    if (!userApiKey && !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: 'No API key available. Please provide your own Gemini API key.'
        }
      });
    }

    console.log('Processing multimodal generation request...');
    console.log('Using user API key:', !!userApiKey);

    // Parse multipart form data
    const { fields, files } = await parseMultipartForm(req);
    
    // Extract and validate form data
    const promptField = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const configField = Array.isArray(fields.config) ? fields.config[0] : fields.config;
    
    let parsedConfig;
    try {
      parsedConfig = configField ? JSON.parse(configField) : {};
    } catch (e) {
      parsedConfig = {};
    }

    const validatedData = requestSchema.parse({
      prompt: promptField || '',
      config: parsedConfig,
    });

    console.log('Validated request data:', {
      prompt: validatedData.prompt?.slice(0, 50) + '...',
      config: validatedData.config,
      filesCount: Object.keys(files).length,
    });

    // Process uploaded files
    let processedFiles: formidable.File[] = [];
    if (files.files) {
      if (Array.isArray(files.files)) {
        processedFiles = files.files;
      } else {
        processedFiles = [files.files];
      }
    }

    console.log(`Processing ${processedFiles.length} files...`);

    // Check if we have any content to process
    if (processedFiles.length === 0 && !validatedData.prompt) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_CONTENT',
          message: 'Please provide either files to upload or a text prompt'
        }
      });
    }

    let extractedContent: any[] = [];
    let processedContext: any = {
      textContent: validatedData.prompt || '',
    };

    // Preprocess files if any
    if (processedFiles.length > 0) {
      const preprocessing = await preprocessMultimodalInput(processedFiles, userApiKey);
      extractedContent = preprocessing.extractedContent;
      processedContext = {
        ...processedContext,
        ...preprocessing.processedContext,
        textContent: (processedContext.textContent || '') + (preprocessing.processedContext.textContent || ''),
      };
    }

    // Generate questions with context
    const questions = await generateQuestionsWithContext(
      processedContext,
      validatedData.config,
      validatedData.prompt,
      userApiKey
    );

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return res.status(200).json({
      success: true,
      data: {
        questions,
        sessionId,
        extractedContent,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Multimodal generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors,
        }
      });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'API_KEY_ERROR',
          message: 'AI service configuration error. Please check your API key.',
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate questions with context',
      }
    });
  }
} 