import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { extractTextFromImage } from '../../utils/ai';
import { 
  parseFormData, 
  extractTextFromFile, 
  validateFileUpload 
} from '../../utils/fileProcessing';

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResponse {
  success: boolean;
  text?: string;
  error?: string;
  fileType?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { files } = await parseFormData(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Validate file
    const validation = validateFileUpload(uploadedFile);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }

    const mimeType = uploadedFile.mimetype || '';
    let extractedText = '';

    if (mimeType.startsWith('image/')) {
      // Handle image files with AI vision
      const buffer = await fs.readFile(uploadedFile.filepath);
      extractedText = await extractTextFromImage(buffer, mimeType);
    } else if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
      // Handle PDF and text files
      extractedText = await extractTextFromFile(uploadedFile.filepath, mimeType);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported file type' 
      });
    }

    // Clean up temporary file
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (error) {
      console.error('Failed to clean up temporary file:', error);
    }

    return res.status(200).json({
      success: true,
      text: extractedText,
      fileType: mimeType,
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process uploaded file',
    });
  }
} 