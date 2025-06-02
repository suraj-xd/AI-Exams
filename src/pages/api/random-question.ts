import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface RandomQuestionResponse {
  success: boolean;
  question?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RandomQuestionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // In a production app, you'd want to use a proper database
    // For now, we'll look for JSON files in a temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
      await fs.access(tempDir);
    } catch {
      // If temp directory doesn't exist, create it
      await fs.mkdir(tempDir, { recursive: true });
    }

    const files = await fs.readdir(tempDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No question sets available. Please generate some questions first.',
      });
    }

    const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];
    const filePath = path.join(tempDir, randomFile);
    const data = await fs.readFile(filePath, 'utf8');
    const questions = JSON.parse(data);

    // Try different possible keys for MCQs
    const mcqsKey = questions.mcqs ? 'mcqs' : 
                   questions['5 MCQs'] ? '5 MCQs' : 
                   questions.MCQs ? 'MCQs' : null;

    if (!mcqsKey || !questions[mcqsKey] || questions[mcqsKey].length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No MCQ questions found in available question sets.',
      });
    }

    const randomQuestion = questions[mcqsKey][Math.floor(Math.random() * questions[mcqsKey].length)];

    return res.status(200).json({
      success: true,
      question: randomQuestion,
    });

  } catch (error) {
    console.error('Random question error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch random question',
    });
  }
} 