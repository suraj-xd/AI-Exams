# EduQuest API Documentation

## Overview

The EduQuest API provides comprehensive educational assessment tools powered by Google's Gemini AI. The API supports file uploads, question generation, answer analysis, and more.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in your project root:

```env
# Google Generative AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI API Key for alternative AI services
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your environment file

## API Endpoints

### 1. File Upload and Text Extraction

**Endpoint:** `POST /api/upload`

**Description:** Upload and extract text from images, PDFs, or text files.

**Supported File Types:**
- Images: JPG, PNG, GIF, WebP
- Documents: PDF
- Text: TXT, CSV, Markdown

**Request:**
```typescript
// FormData with file
const formData = new FormData();
formData.append('file', file);

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

**Response:**
```typescript
{
  success: boolean;
  text?: string;        // Extracted text content
  fileType?: string;    // MIME type of uploaded file
  error?: string;       // Error message if failed
}
```

**Example Usage:**
```typescript
import { useEduQuest } from '../hooks/useEduQuest';

const { uploadFile } = useEduQuest();
const result = await uploadFile(file);
if (result) {
  console.log('Extracted text:', result.text);
}
```

### 2. Generate Questions

**Endpoint:** `POST /api/generate-questions`

**Description:** Generate customizable educational questions based on a topic.

**Request Body:**
```typescript
{
  topic: string;                    // Required: Subject/topic for questions
  config?: {                       // Optional: Question configuration
    mcqs?: number;                 // Multiple choice questions (0-20, default: 5)
    fillInBlanks?: number;         // Fill in the blank questions (0-20, default: 5)
    trueFalse?: number;            // True/false questions (0-20, default: 5)
    shortType?: number;            // Short answer questions (0-10, default: 3)
    longType?: number;             // Long answer questions (0-5, default: 2)
  };
  sessionId?: string;              // Optional: Session identifier
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    mcqs: Array<{
      question: string;
      options: string[];
      answer: string;
    }>;
    fill_in_the_blanks: Array<{
      question: string;
      answer: string;
    }>;
    true_false: Array<{
      question: string;
      answer: boolean;
    }>;
    short_type: Array<{
      question: string;
      answer: string;
    }>;
    long_type: Array<{
      question: string;
      answer: string;
    }>;
  };
  sessionId?: string;
  error?: string;
}
```

**Example Usage:**
```typescript
const { generateQuestions } = useEduQuest();

const result = await generateQuestions('Machine Learning', {
  mcqs: 10,
  fillInBlanks: 5,
  trueFalse: 5,
  shortType: 3,
  longType: 2
});

if (result) {
  console.log('Generated questions:', result.data);
  console.log('Session ID:', result.sessionId);
}
```

### 3. Analyze Answers

**Endpoint:** `POST /api/analyze-answers`

**Description:** Analyze student answers for authenticity and accuracy.

**Request Body:**
```typescript
{
  shortQuestions: Array<{
    question: string;
    answer: string;
  }>;
  longQuestions: Array<{
    question: string;
    answer: string;
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  feedback?: string;    // AI-generated feedback and scoring
  error?: string;
}
```

**Example Usage:**
```typescript
const { analyzeAnswers } = useEduQuest();

const analysisData = {
  shortQuestions: [
    {
      question: "What is machine learning?",
      answer: "Machine learning is a subset of AI that enables computers to learn without explicit programming."
    }
  ],
  longQuestions: [
    {
      question: "Explain the difference between supervised and unsupervised learning.",
      answer: "Supervised learning uses labeled data to train models..."
    }
  ]
};

const feedback = await analyzeAnswers(analysisData);
if (feedback) {
  console.log('AI Feedback:', feedback);
}
```

### 4. Random Question

**Endpoint:** `GET /api/random-question`

**Description:** Fetch a random question from previously generated question sets.

**Response:**
```typescript
{
  success: boolean;
  question?: {
    question: string;
    options?: string[];     // For MCQs
    answer: string | boolean;
  };
  error?: string;
}
```

**Example Usage:**
```typescript
const { getRandomQuestion } = useEduQuest();

const randomQ = await getRandomQuestion();
if (randomQ) {
  console.log('Random question:', randomQ);
}
```

## React Components

### QuestionConfigComponent

Configure question generation parameters:

```tsx
import { QuestionConfigComponent } from '../components/QuestionConfig';

<QuestionConfigComponent
  onConfigChange={(config) => setQuestionConfig(config)}
  initialConfig={{ mcqs: 10, shortType: 5 }}
  disabled={loading}
/>
```

### FileUpload

Handle file uploads with drag-and-drop:

```tsx
import { FileUpload } from '../components/FileUpload';

<FileUpload
  onFileProcessed={(text, fileType) => {
    console.log('Extracted text:', text);
    console.log('File type:', fileType);
  }}
  disabled={loading}
/>
```

## Error Handling

All API endpoints return standardized error responses:

```typescript
{
  success: false;
  error: string;    // Human-readable error message
}
```

Common error scenarios:
- **400 Bad Request:** Invalid input data or missing required fields
- **413 Payload Too Large:** File size exceeds 10MB limit
- **415 Unsupported Media Type:** Invalid file type
- **500 Internal Server Error:** AI service errors or server issues

## Rate Limiting

The API uses Google's Gemini AI service, which has its own rate limits:
- Free tier: 15 requests per minute
- Paid tier: Higher limits based on your plan

## Best Practices

### 1. Error Handling
Always check the `success` field in responses:

```typescript
const result = await generateQuestions(topic, config);
if (!result) {
  // Handle error - check the error state from useEduQuest hook
  console.error('Failed to generate questions');
  return;
}
// Use result.data safely
```

### 2. File Upload Validation
Validate files on the client side before uploading:

```typescript
const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
};
```

### 3. Loading States
Always show loading states during API calls:

```typescript
const { loading, error } = useEduQuest();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

## TypeScript Support

The API includes full TypeScript support with type definitions for all requests and responses. Import types from the hook:

```typescript
import { useEduQuest } from '../hooks/useEduQuest';
import type { QuestionSet, Question, AnalysisData } from '../hooks/useEduQuest';
```

## Migration from Old Backend

If migrating from the old Express.js backend:

1. **Environment Variables:** Update your `.env` file with `GEMINI_API_KEY`
2. **API Endpoints:** Update client code to use new endpoint paths (`/api/*`)
3. **Response Format:** Update to handle new standardized response format
4. **File Handling:** Update file upload to use new FormData structure
5. **Question Configuration:** Use new configurable question generation

## Contributing

When contributing to the API:

1. **Follow TypeScript conventions:** Use proper types for all functions
2. **Error Handling:** Always return standardized error responses
3. **Validation:** Use Zod schemas for request validation
4. **Documentation:** Update this documentation for any API changes
5. **Testing:** Test all endpoints with various input scenarios

## Security Considerations

- **API Key Security:** Never expose your Gemini API key in client-side code
- **File Validation:** Always validate uploaded files for type and size
- **Input Sanitization:** Validate and sanitize all user inputs
- **Rate Limiting:** Implement client-side rate limiting to avoid hitting API limits 