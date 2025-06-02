import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from 'zod';

// Schemas for structured outputs
export const QuestionSchema = z.object({
  mcqs: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    explanation: z.string().optional(),
  })),
  fill_in_the_blanks: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    explanation: z.string().optional(),
  })),
  true_false: z.array(z.object({
    question: z.string(),
    answer: z.boolean(),
    explanation: z.string().optional(),
  })),
  short_type: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    points: z.number().optional(),
  })),
  long_type: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    points: z.number().optional(),
  })),
});

export const ContentExtractionSchema = z.object({
  mainContent: z.string(),
  topics: z.array(z.string()),
  keyPoints: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedReadingTime: z.number().optional(),
});

export type QuestionSet = z.infer<typeof QuestionSchema>;
export type ContentExtraction = z.infer<typeof ContentExtractionSchema>;

interface ProcessedContext {
  textContent: string;
  imageData?: {
    data: string;
    mimeType: string;
  }[];
  documentData?: {
    type: string;
    content: string;
  }[];
}

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

/**
 * Generate questions with multimodal context (text + images + documents)
 */
export async function generateQuestionsWithContext(
  context: ProcessedContext,
  config: QuestionConfig,
  additionalPrompt?: string,
  apiKey?: string
): Promise<QuestionSet> {
  try {
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    
    if (!keyToUse) {
      throw new Error("GEMINI_API_KEY is not available");
    }

    const genAI = new GoogleGenerativeAI(keyToUse);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const basePrompt = `Based on the provided content, generate educational assessment questions with the following requirements:

- ${config.mcqs} multiple choice questions (MCQs) with 4 options each
- ${config.fillInBlanks} fill in the blank questions
- ${config.trueFalse} true/false questions  
- ${config.shortType} short answer questions
- ${config.longType} long answer questions

${additionalPrompt ? `Additional context: ${additionalPrompt}` : ''}

Return a valid JSON object with this exact structure:
{
  "mcqs": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option",
      "explanation": "Brief explanation (optional)"
    }
  ],
  "fill_in_the_blanks": [
    {
      "question": "Question with _____ blank",
      "answer": "correct answer",
      "explanation": "Brief explanation (optional)"
    }
  ],
  "true_false": [
    {
      "question": "Statement to evaluate",
      "answer": true,
      "explanation": "Brief explanation (optional)"
    }
  ],
  "short_type": [
    {
      "question": "Short answer question",
      "answer": "Expected short answer",
      "points": 2
    }
  ],
  "long_type": [
    {
      "question": "Long answer question",
      "answer": "Expected detailed answer",
      "points": 5
    }
  ]
}

Make questions comprehensive, covering key concepts from the provided material. Ensure JSON is valid without markdown formatting.`;

    const contentParts: any[] = [basePrompt];

    // Add text content
    if (context.textContent) {
      contentParts.push(`\n\nText Content:\n${context.textContent}`);
    }

    // Add image data if present
    if (context.imageData && context.imageData.length > 0) {
      context.imageData.forEach((img, index) => {
        contentParts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType,
          },
        });
        contentParts.push(`\n[Image ${index + 1} above should be analyzed for content]`);
      });
    }

    // Add document data
    if (context.documentData && context.documentData.length > 0) {
      context.documentData.forEach((doc, index) => {
        contentParts.push(`\n\nDocument ${index + 1} (${doc.type}):\n${doc.content}`);
      });
    }

    console.log('Generating questions with multimodal context...');
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = await response.text();

    console.log('Raw multimodal response:', text);

    // Clean the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('Cleaned multimodal response:', cleanedText);

    // Parse and validate
    const parsedData = JSON.parse(cleanedText);
    const validatedData = QuestionSchema.parse(parsedData);

    console.log('Successfully generated multimodal questions:', validatedData);
    return validatedData;

  } catch (error) {
    console.error('Error generating questions with context:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Question format validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to generate questions with context');
  }
}

/**
 * Preprocess multimodal input files
 */
export async function preprocessMultimodalInput(files: any[], apiKey?: string): Promise<{
  extractedContent: any[];
  processedContext: ProcessedContext;
}> {
  const extractedContent: any[] = [];
  const processedContext: ProcessedContext = {
    textContent: '',
    imageData: [],
    documentData: [],
  };

  for (const uploadedFile of files) {
    try {
      const file = uploadedFile.file;
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const mimeType = file.type;

      if (mimeType.startsWith('image/')) {
        // Handle images
        const base64Data = Buffer.from(uint8Array).toString('base64');
        
        processedContext.imageData = processedContext.imageData || [];
        processedContext.imageData.push({
          data: base64Data,
          mimeType: mimeType,
        });

        // Also extract text from image using Gemini
        try {
          const keyToUse = apiKey || process.env.GEMINI_API_KEY;
          
          if (keyToUse) {
            const genAI = new GoogleGenerativeAI(keyToUse);
            const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const visionPrompt = "Extract and describe all text and educational content from this image. Include formulas, diagrams, and any relevant information that could be used to generate questions.";
            
            const imagePart = {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            };

            const visionResult = await visionModel.generateContent([visionPrompt, imagePart]);
            const visionResponse = await visionResult.response;
            const extractedText = await visionResponse.text();
            
            processedContext.textContent += `\n\nExtracted from image: ${extractedText}`;
            
            extractedContent.push({
              type: 'image',
              filename: file.name,
              mimeType: mimeType,
              extractedText: extractedText,
            });
          }
        } catch (visionError) {
          console.warn('Failed to extract text from image:', visionError);
        }

      } else if (mimeType === 'application/pdf') {
        // Handle PDFs - try to extract text
        try {
          const textContent = uint8Array.toString(); // This is simplified - in production use proper PDF parser
          processedContext.textContent += `\n\n${textContent}`;
          
          processedContext.documentData = processedContext.documentData || [];
          processedContext.documentData.push({
            type: 'pdf',
            content: textContent,
          });

          extractedContent.push({
            type: 'pdf',
            filename: file.name,
            textContent: textContent,
          });
        } catch (pdfError) {
          console.warn('Failed to extract text from PDF:', pdfError);
        }

      } else if (mimeType.startsWith('text/')) {
        // Handle text files
        const textContent = new TextDecoder().decode(uint8Array);
        processedContext.textContent += `\n\n${textContent}`;
        
        processedContext.documentData = processedContext.documentData || [];
        processedContext.documentData.push({
          type: 'text',
          content: textContent,
        });

        extractedContent.push({
          type: 'text',
          filename: file.name,
          textContent: textContent,
        });
      }

    } catch (error) {
      console.error(`Error processing file ${uploadedFile.file?.name}:`, error);
      extractedContent.push({
        type: 'error',
        filename: uploadedFile.file?.name || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    extractedContent,
    processedContext,
  };
}

/**
 * Extract and analyze content from images using Gemini Vision
 */
export async function extractFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<ContentExtraction> {
  // Use the more reliable gemini-2.0-flash for multimodal tasks
  const modelName = "gemini-2.0-flash";
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: modelName });
  
  const prompt = `Analyze this image and extract educational content. Focus on:
1. Main textual content (OCR if needed)
2. Key topics and concepts shown
3. Important points or takeaways
4. Educational difficulty level
5. Any diagrams, charts, or visual information

Return a JSON object with the following structure:
{
  "mainContent": "detailed text content",
  "topics": ["topic1", "topic2"],
  "keyPoints": ["point1", "point2"],
  "difficulty": "beginner|intermediate|advanced"
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  try {
    // Use basic Google AI with JSON parsing
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = await response.text();
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mainContent: parsed.mainContent || text,
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) 
            ? parsed.difficulty 
            : 'intermediate' as const,
        };
      }
    } catch (parseError) {
      console.warn('JSON parsing failed, using raw text');
    }
    
    // Final fallback - return basic analysis
    return {
      mainContent: text,
      topics: [],
      keyPoints: [],
      difficulty: 'intermediate' as const,
    };
  } catch (error) {
    console.error('Error extracting from image:', error);
    throw new Error(`Failed to extract content from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process PDF documents using Gemini's document understanding
 */
export async function extractFromDocument(
  content: string,
  filename: string,
  mimeType: string
): Promise<ContentExtraction> {
  const modelName = "gemini-2.0-flash";
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: modelName });
  
  const prompt = `Analyze this document content and extract educational information:

Document: ${filename}
Content: ${content}

Extract:
1. Main educational content and concepts
2. Key topics covered
3. Important learning points
4. Difficulty level assessment
5. Estimated reading/study time

Return a JSON object with the following structure:
{
  "mainContent": "detailed educational content",
  "topics": ["topic1", "topic2"],
  "keyPoints": ["point1", "point2"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedReadingTime": 15
}`;

  try {
    // Try structured generation if AI SDK is available
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mainContent: parsed.mainContent || text,
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) 
            ? parsed.difficulty 
            : 'intermediate' as const,
          estimatedReadingTime: typeof parsed.estimatedReadingTime === 'number' 
            ? parsed.estimatedReadingTime 
            : undefined,
        };
      }
    } catch (parseError) {
      console.warn('JSON parsing failed for document, using raw text');
    }
    
    // Final fallback
    return {
      mainContent: text,
      topics: [],
      keyPoints: [],
      difficulty: 'intermediate' as const,
    };
  } catch (error) {
    console.error('Error extracting from document:', error);
    throw new Error(`Failed to extract content from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 