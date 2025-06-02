import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { z } from 'zod';
import { 
  generateQuestionsWithContext, 
  preprocessMultimodalInput,
  QuestionSet 
} from '../../utils/multimodal';
import { ApiResponse } from '../../config/api';

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

const parseFormData = async (req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> => {
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5, // Allow multiple files
    allowEmptyFiles: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

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
    const { fields, files } = await parseFormData(req);
    
    // Parse fields
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const configStr = Array.isArray(fields.config) ? fields.config[0] : fields.config;
    
    let config = {
      mcqs: 5,
      fillInBlanks: 5,
      trueFalse: 5,
      shortType: 3,
      longType: 2,
    };

    if (configStr) {
      try {
        const parsedConfig = JSON.parse(configStr);
        config = { ...config, ...parsedConfig };
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }

    // Validate the parsed data
    const validatedData = requestSchema.parse({
      prompt: prompt || undefined,
      config,
    });

    // Process uploaded files
    const fileArray = Object.values(files).flat().filter(Boolean);
    const processedFiles: Array<{
      buffer: Buffer;
      filename: string;
      mimeType: string;
    }> = [];

    for (const file of fileArray) {
      if (file && file.filepath) {
        const fs = await import('fs/promises');
        const buffer = await fs.readFile(file.filepath);
        
        processedFiles.push({
          buffer,
          filename: file.originalFilename || 'unnamed',
          mimeType: file.mimetype || 'application/octet-stream',
        });

        // Clean up temp file
        try {
          await fs.unlink(file.filepath);
        } catch (error) {
          console.error('Failed to clean up temp file:', error);
        }
      }
    }

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
      const preprocessing = await preprocessMultimodalInput(processedFiles);
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
      validatedData.prompt
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
    console.error('Error in generate-with-context:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          details: error.errors,
        }
      });
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI service configuration error',
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate questions with context',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    });
  }
} 