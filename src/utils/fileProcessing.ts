import formidable from 'formidable';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import type { NextApiRequest } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface ProcessedFile {
  text: string;
  fileType: string;
  filename?: string;
  error?: string;
}

export const parseFormData = async (req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> => {
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
    allowEmptyFiles: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

/**
 * Extract text from image using Gemini Vision
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = "Extract and transcribe all text from this image. If it contains educational content like formulas, diagrams, or structured information, please preserve the formatting and include descriptions of visual elements that are relevant to understanding the content.";
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    return await response.text();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (only available in Node.js environment)
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Fallback: Use Gemini to process PDF if pdf-parse fails
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = "This is a PDF document. Extract all the text content from it, preserving structure and formatting where possible.";
      
      const pdfPart = {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };

      const result = await model.generateContent([prompt, pdfPart]);
      const response = await result.response;
      
      return await response.text();
    } catch (fallbackError) {
      console.error('Fallback PDF extraction also failed:', fallbackError);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Process uploaded file and extract text
 */
export async function processFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ProcessedFile> {
  try {
    let text = '';
    let fileType = 'unknown';

    // Handle different file types
    if (mimeType.startsWith('image/')) {
      text = await extractTextFromImage(fileBuffer, mimeType);
      fileType = 'image';
    } else if (mimeType === 'application/pdf') {
      text = await extractTextFromPDF(fileBuffer);
      fileType = 'pdf';
    } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      text = fileBuffer.toString('utf-8');
      fileType = 'text';
    } else if (mimeType === 'application/msword' || 
               mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For Word documents, try to extract text
      // This is a simplified approach - in production, you'd use a proper Word parser
      text = fileBuffer.toString('utf-8');
      fileType = 'document';
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Clean and validate extracted text
    text = text.trim();
    if (!text || text.length < 10) {
      throw new Error('No meaningful text could be extracted from the file');
    }

    return {
      text,
      fileType,
      filename,
    };
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error);
    return {
      text: '',
      fileType: 'error',
      filename,
      error: error instanceof Error ? error.message : 'Unknown processing error',
    };
  }
}

/**
 * Validate file before processing
 */
export function validateFile(file: {
  size: number;
  mimetype: string;
  originalFilename?: string;
}): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (10MB)`,
    };
  }

  if (!supportedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not supported`,
    };
  }

  return { valid: true };
}

/**
 * Get file type category for UI display
 */
export function getFileCategory(mimeType: string): 'image' | 'document' | 'text' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  return 'unknown';
}

export const isValidFileType = (mimeType: string): boolean => {
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
  ];
  
  return supportedTypes.includes(mimeType);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const validateFileUpload = (file: formidable.File): {
  isValid: boolean;
  error?: string;
} => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit',
    };
  }
  
  if (!isValidFileType(file.mimetype || '')) {
    return {
      isValid: false,
      error: 'Unsupported file type',
    };
  }
  
  return { isValid: true };
}; 