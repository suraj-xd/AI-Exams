import React, { useState } from 'react';
import { useEduQuest } from '../hooks/useEduQuest';
import { QuestionConfigComponent } from '../components/QuestionConfig';
import { FileUpload } from '../components/FileUpload';

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

const DemoPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questionConfig, setQuestionConfig] = useState<QuestionConfig>({
    mcqs: 5,
    fillInBlanks: 5,
    trueFalse: 5,
    shortType: 3,
    longType: 2,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);
  const [extractedText, setExtractedText] = useState('');
  const [feedback, setFeedback] = useState('');

  const { 
    uploadFile, 
    generateQuestions, 
    analyzeAnswers, 
    getRandomQuestion, 
    loading, 
    error, 
    clearError 
  } = useEduQuest();

  const handleGenerateQuestions = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic first');
      return;
    }

    const result = await generateQuestions(topic, questionConfig);
    if (result) {
      setGeneratedQuestions(result.data);
    }
  };

  const handleFileProcessed = (text: string, fileType: string) => {
    setExtractedText(text);
    setTopic(text.slice(0, 100) + '...'); // Use first 100 chars as topic
  };

  const handleAnalyzeAnswers = async () => {
    const sampleData = {
      shortQuestions: [
        {
          question: "What is machine learning?",
          answer: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
        }
      ],
      longQuestions: [
        {
          question: "Explain the difference between supervised and unsupervised learning.",
          answer: "Supervised learning uses labeled training data to learn a mapping from inputs to outputs, while unsupervised learning finds patterns in data without labeled examples."
        }
      ]
    };

    const result = await analyzeAnswers(sampleData);
    if (result) {
      setFeedback(result);
    }
  };

  const handleRandomQuestion = async () => {
    const question = await getRandomQuestion();
    if (question) {
      alert(`Random Question: ${question.question}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EduQuest API Demo
          </h1>
          <p className="text-xl text-gray-600">
            Test the enhanced educational assessment platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">File Upload & Text Extraction</h2>
            <FileUpload
              onFileProcessed={handleFileProcessed}
              disabled={loading}
            />
            {extractedText && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">Extracted Text:</h3>
                <p className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {extractedText}
                </p>
              </div>
            )}
          </div>

          {/* Question Generation Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Question Generation</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your topic (e.g., Machine Learning, React, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <QuestionConfigComponent
              onConfigChange={setQuestionConfig}
              initialConfig={questionConfig}
              disabled={loading}
            />

            <button
              onClick={handleGenerateQuestions}
              disabled={loading || !topic.trim()}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>

        {/* Generated Questions Display */}
        {generatedQuestions && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Generated Questions</h2>
            
            <div className="space-y-6">
              {generatedQuestions.mcqs && generatedQuestions.mcqs.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Multiple Choice Questions</h3>
                  {generatedQuestions.mcqs.slice(0, 2).map((q: any, idx: number) => (
                    <div key={idx} className="mb-4 p-4 bg-gray-50 rounded border">
                      <p className="font-medium mb-2">{q.question}</p>
                      <ul className="space-y-1">
                        {q.options?.map((option: string, optIdx: number) => (
                          <li key={optIdx} className="text-sm text-gray-700">
                            {String.fromCharCode(65 + optIdx)}) {option}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-green-600 mt-2">Answer: {q.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {generatedQuestions.true_false && generatedQuestions.true_false.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">True/False Questions</h3>
                  {generatedQuestions.true_false.slice(0, 2).map((q: any, idx: number) => (
                    <div key={idx} className="mb-4 p-4 bg-gray-50 rounded border">
                      <p className="font-medium">{q.question}</p>
                      <p className="text-sm text-green-600 mt-2">
                        Answer: {q.answer ? 'True' : 'False'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Answer Analysis</h2>
            <p className="text-gray-600 mb-4">
              Test the AI-powered answer analysis with sample data
            </p>
            <button
              onClick={handleAnalyzeAnswers}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Sample Answers'}
            </button>
            {feedback && (
              <div className="mt-4 p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">AI Feedback:</h3>
                <p className="text-sm text-gray-700">{feedback}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Random Question</h2>
            <p className="text-gray-600 mb-4">
              Get a random question from previously generated sets
            </p>
            <button
              onClick={handleRandomQuestion}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Random Question'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in your project root</li>
            <li>Add your Gemini API key: <code className="bg-gray-200 px-1 rounded">GEMINI_API_KEY=your_key_here</code></li>
            <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></li>
            <li>Upload a file or enter a topic to test the functionality</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DemoPage; 