import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Updated model fallback priority - using current available models
const MODEL_FALLBACKS = [
  "gemini-1.5-flash",        // Current stable multimodal model
  "gemini-1.5-pro",          // Higher quality option
  "gemini-pro",              // Fallback stable model
];

export const getTextModel = () => {
  // Try models in order of preference
  for (const modelName of MODEL_FALLBACKS) {
    try {
      console.log(`Attempting to initialize model: ${modelName}`);
      return genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
      console.warn(`Failed to initialize model ${modelName}:`, error);
    }
  }
  throw new Error("All Gemini models failed to initialize");
};

export const getVisionModel = () => {
  // All modern Gemini models handle multimodal input, so use the same fallback
  return getTextModel();
};

export const generateQuestions = async (
  topic: string,
  config: {
    mcqs: number;
    fillInBlanks: number;
    trueFalse: number;
    shortType: number;
    longType: number;
  }
) => {
  try {
    console.log('Starting question generation for topic:', topic);
    console.log('Configuration:', config);
    
    const model = getTextModel();
    console.log('Model initialized successfully');
    
    const prompt = `Generate educational assessment questions for the topic: "${topic}"

Please create exactly:
- ${config.mcqs} multiple choice questions (MCQs)
- ${config.fillInBlanks} fill in the blank questions
- ${config.trueFalse} true/false questions
- ${config.shortType} short answer questions
- ${config.longType} long answer questions

Return a valid JSON object with this exact structure:
{
  "mcqs": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option"
    }
  ],
  "fill_in_the_blanks": [
    {
      "question": "Question with _____ blank",
      "answer": "correct answer"
    }
  ],
  "true_false": [
    {
      "question": "Statement to evaluate",
      "answer": true
    }
  ],
  "short_type": [
    {
      "question": "Short answer question",
      "answer": "Expected short answer"
    }
  ],
  "long_type": [
    {
      "question": "Long answer question",
      "answer": "Expected detailed answer"
    }
  ]
}

Ensure all questions are educational, appropriate, and relevant to the topic. Make the JSON valid without any markdown formatting.`;

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    console.log('Received response from Gemini API');
    
    const response = await result.response;
    const text = await response.text();
    console.log('Raw AI response:', text);
    
    // Clean the response to extract JSON
    let cleanedText = text
      .replace(/^```(json|JSON)?/gm, '')
      .replace(/```$/gm, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();
    
    console.log('Cleaned text for parsing:', cleanedText);
    
    try {
      const parsedResult = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON result');
      return parsedResult;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Cleaned text was:", cleanedText);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error("AI generated invalid JSON response: " + errorMessage);
    }
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred during question generation");
  }
};

export const extractTextFromImage = async (
  imageBuffer: Buffer,
  mimeType: string
) => {
  const model = getVisionModel();
  const prompt = "Extract all the textual content from the provided image accurately. Return only the extracted text without any additional formatting or commentary.";
  
  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  return await response.text();
};

export const analyzeAnswers = async (data: {
  shortQuestions: Array<{ question: string; answer: string }>;
  longQuestions: Array<{ question: string; answer: string }>;
}) => {
  const model = getTextModel();
  
  const prompt = `Analyze the following student answers and provide feedback:

Short Questions:
${data.shortQuestions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}`).join('\n')}

Long Questions:
${data.longQuestions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}`).join('\n')}

Please evaluate these answers on:
1. Accuracy and correctness
2. Completeness of response
3. Understanding demonstrated
4. Whether answers appear authentic (not AI-generated)

Provide a score from 0-100 and constructive feedback in under 100 words.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return await response.text();
}; 