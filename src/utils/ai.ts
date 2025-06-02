import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_FALLBACKS = [
  "gemini-1.5-flash",        // Current stable multimodal model
  "gemini-1.5-pro",          // Higher quality option
  "gemini-pro",              // Fallback stable model
];

export const getTextModel = (apiKey?: string) => {
  const keyToUse = apiKey || process.env.GEMINI_API_KEY;
  
  if (!keyToUse) {
    throw new Error("GEMINI_API_KEY is not available");
  }

  const genAI = new GoogleGenerativeAI(keyToUse);
  
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
  },
  apiKey?: string
) => {
  try {
    console.log('Starting question generation for topic:', topic);
    console.log('Configuration:', config);
    console.log('Using custom API key:', !!apiKey);
    
    const model = getTextModel(apiKey);
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

    // Clean the response - remove any markdown formatting
    let cleanedText = text.trim();
    
    // Remove markdown code block formatting if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned response:', cleanedText);

    // Parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON:', parsedData);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Text that failed to parse:', cleanedText);
      throw new Error('Invalid JSON response from AI model');
    }

    // Validate that we have the expected structure
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Invalid response structure');
    }

    // Ensure arrays exist (they might be empty)
    const result_data = {
      mcqs: parsedData.mcqs || [],
      fill_in_the_blanks: parsedData.fill_in_the_blanks || [],
      true_false: parsedData.true_false || [],
      short_type: parsedData.short_type || [],
      long_type: parsedData.long_type || [],
    };

    console.log('Final structured data:', result_data);
    return result_data;

  } catch (error) {
    console.error('Question generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate questions');
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
}, apiKey?: string) => {
  const model = getTextModel(apiKey);
  
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