import type { NextApiRequest, NextApiResponse } from 'next';
import { parseMultipartForm, extractTextFromFile } from '../../utils/fileProcessing';

interface UploadResponse {
  success: boolean;
  text?: string;
  fileType?: string;
  filename?: string;
  error?: string;
}

// Disable body parser for multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Get API key from headers (user's local API key)
    const userApiKey = req.headers['x-api-key'] as string;
    
    // Check if we have an API key (either user's or process.env)
    if (!userApiKey && !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No API key available. Please provide your own Gemini API key.',
      });
    }

    console.log('Processing file upload...');
    console.log('Using user API key:', !!userApiKey);

    // Parse multipart form data
    const { files } = await parseMultipartForm(req);
    
    // Get the uploaded file
    let uploadedFile;
    if (files.file) {
      uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Process the file
    const result = await extractTextFromFile(uploadedFile, userApiKey);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      text: result.text,
      fileType: result.fileType,
      filename: result.filename,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. Please check your API key.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process file upload',
    });
  }
} 