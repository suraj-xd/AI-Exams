import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from 'zod';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

interface ProcessingContext {
  images?: Array<{
    data: string; // base64
    mimeType: string;
  }>;
  documents?: Array<{
    content: string;
    filename: string;
    mimeType: string;
  }>;
  textContent?: string;
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
  const model = genAI.getGenerativeModel({ model: modelName });
  
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
  const model = genAI.getGenerativeModel({ model: modelName });
  
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

/**
 * Generate questions with multimodal context using structured output
 */
export async function generateQuestionsWithContext(
  context: ProcessingContext,
  config: {
    mcqs: number;
    fillInBlanks: number;
    trueFalse: number;
    shortType: number;
    longType: number;
  },
  userPrompt?: string
): Promise<QuestionSet> {
  const modelName = "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Build context from multimodal inputs
  let contextPrompt = "Generate educational questions based on the following context:\n\n";
  
  if (userPrompt) {
    contextPrompt += `User Request: ${userPrompt}\n\n`;
  }

  if (context.textContent) {
    contextPrompt += `Text Content: ${context.textContent}\n\n`;
  }

  const questionPrompt = `${contextPrompt}

Please generate exactly:
- ${config.mcqs} multiple choice questions (4 options each)
- ${config.fillInBlanks} fill in the blank questions
- ${config.trueFalse} true/false questions  
- ${config.shortType} short answer questions
- ${config.longType} long answer questions

Each question should be relevant to the provided content. Include explanations where helpful.
For MCQs, ensure one option is clearly correct.
For fill-in-the-blanks, use _____ to indicate the blank space.
Provide comprehensive answers for short and long questions.

Return a JSON object with the following structure:
{
  "mcqs": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "..."}],
  "fill_in_the_blanks": [{"question": "...", "answer": "...", "explanation": "..."}],
  "true_false": [{"question": "...", "answer": true, "explanation": "..."}],
  "short_type": [{"question": "...", "answer": "...", "points": 5}],
  "long_type": [{"question": "...", "answer": "...", "points": 10}]
}`;

  try {
    // Prepare content for multimodal generation
    let messageContent: any[] = [questionPrompt];
    
    // Add images for multimodal content if available
    if (context.images && context.images.length > 0) {
      context.images.forEach(img => {
        messageContent.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType,
          },
        });
      });
    }

    const result = await model.generateContent(messageContent);
    const response = await result.response;
    const text = await response.text();
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        return {
          mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
          fill_in_the_blanks: Array.isArray(parsed.fill_in_the_blanks) ? parsed.fill_in_the_blanks : [],
          true_false: Array.isArray(parsed.true_false) ? parsed.true_false : [],
          short_type: Array.isArray(parsed.short_type) ? parsed.short_type : [],
          long_type: Array.isArray(parsed.long_type) ? parsed.long_type : [],
        };
      }
    } catch (parseError) {
      console.warn('JSON parsing failed for questions, generating fallback questions');
    }
    
    // Final fallback - generate basic questions from the text
    return generateFallbackQuestions(context.textContent || 'General knowledge', config);
    
  } catch (error) {
    console.error('Error generating questions with context:', error);
    throw new Error(`Failed to generate questions with multimodal context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate fallback questions when AI generation fails
 */
function generateFallbackQuestions(content: string, config: any): QuestionSet {
  const topic = content.substring(0, 100) + '...';
  
  return {
    mcqs: config.mcqs > 0 ? [{
      question: `What is the main topic discussed in: "${topic}"?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: 'This is a fallback question generated when AI processing fails.'
    }] : [],
    fill_in_the_blanks: config.fillInBlanks > 0 ? [{
      question: `The main concept discussed is _____.`,
      answer: 'the provided content',
      explanation: 'Fill in the blank based on the content provided.'
    }] : [],
    true_false: config.trueFalse > 0 ? [{
      question: 'The content provided contains educational material.',
      answer: true,
      explanation: 'This is generally true for educational content.'
    }] : [],
    short_type: config.shortType > 0 ? [{
      question: 'Summarize the main points from the provided content.',
      answer: 'Please refer to the original content for key points.',
      points: 5
    }] : [],
    long_type: config.longType > 0 ? [{
      question: 'Provide a detailed analysis of the content provided.',
      answer: 'A comprehensive analysis should include key themes, concepts, and practical applications.',
      points: 10
    }] : []
  };
}

/**
 * Preprocess multimodal inputs to extract content
 */
export async function preprocessMultimodalInput(
  files: Array<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }>
): Promise<{
  extractedContent: ContentExtraction[];
  processedContext: ProcessingContext;
}> {
  const extractedContent: ContentExtraction[] = [];
  const processedContext: ProcessingContext = {
    images: [],
    documents: [],
    textContent: '',
  };

  for (const file of files) {
    try {
      if (file.mimeType.startsWith('image/')) {
        // Process image
        const content = await extractFromImage(file.buffer, file.mimeType, file.filename);
        extractedContent.push(content);
        
        processedContext.images?.push({
          data: file.buffer.toString('base64'),
          mimeType: file.mimeType,
        });
        
        // Add extracted text to context
        processedContext.textContent += `\n\nFrom image ${file.filename}:\n${content.mainContent}`;
        
      } else if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('text/')) {
        // Process document
        const textContent = file.buffer.toString('utf-8');
        const content = await extractFromDocument(textContent, file.filename, file.mimeType);
        extractedContent.push(content);
        
        processedContext.documents?.push({
          content: textContent,
          filename: file.filename,
          mimeType: file.mimeType,
        });
        
        processedContext.textContent += `\n\nFrom document ${file.filename}:\n${content.mainContent}`;
      }
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
    }
  }

  return { extractedContent, processedContext };
} 