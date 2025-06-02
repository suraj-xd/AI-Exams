import React, { useState } from 'react';
import { useEnhancedEduQuest } from '../hooks/useEnhancedEduQuest';
import { MultimodalFileUpload } from '../components/MultimodalFileUpload';
import { QuestionConfigComponent } from '../components/QuestionConfig';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  category: 'image' | 'document' | 'unsupported';
}

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

const EnhancedDemoPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [questionConfig, setQuestionConfig] = useState<QuestionConfig>({
    mcqs: 5,
    fillInBlanks: 5,
    trueFalse: 5,
    shortType: 3,
    longType: 2,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<any[]>([]);

  const { 
    generateWithContext,
    loading,
    error,
    clearError
  } = useEnhancedEduQuest();

  const handleGenerateQuestions = async () => {
    if (files.length === 0 && !prompt.trim()) {
      alert('Please provide either files or a text prompt');
      return;
    }

    console.log('Generating questions with:', {
      filesCount: files.length,
      prompt: prompt.slice(0, 50) + '...',
      config: questionConfig
    });

    const result = await generateWithContext(files, prompt, questionConfig);
    
    if (result) {
      setGeneratedQuestions(result.questions);
      setExtractedContent(result.extractedContent || []);
      console.log('Questions generated successfully:', result);
    }
  };

  const canGenerate = files.length > 0 || prompt.trim().length > 0;
  const totalQuestions = Object.values(questionConfig).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Enhanced EduQuest with Multimodal AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload images, documents, or add text prompts. Our AI will extract educational content 
            and generate comprehensive question papers using Gemini's multimodal capabilities.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-red-800">Error: {error.code}</h3>
                <p className="text-red-700 mt-1">{error.message}</p>
                {error.details && (
                  <pre className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                )}
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Panel - Input */}
          <div className="xl:col-span-2 space-y-6">
            {/* Chat-like Prompt Input */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                💬 Text Prompt (Optional)
              </h2>
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create questions about... 

Examples:
• Generate questions about machine learning concepts
• Create a quiz based on the uploaded textbook chapter
• Focus on advanced programming topics from the documents"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={loading}
                />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{prompt.length} characters</span>
                  {prompt.length > 0 && (
                    <button
                      onClick={() => setPrompt('')}
                      className="text-red-600 hover:text-red-800 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                📎 Upload Files (Optional)
              </h2>
              <MultimodalFileUpload
                onFilesChange={setFiles}
                maxFiles={5}
                disabled={loading}
              />
            </div>

            {/* Generation Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Ready to Generate</h2>
              
              <div className="space-y-4">
                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className={`p-3 rounded-lg ${files.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <span className={files.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                        {files.length > 0 ? '✅' : '⬜'}
                      </span>
                      <span className={files.length > 0 ? 'text-green-700 font-medium' : 'text-gray-500'}>
                        Files: {files.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${prompt.trim() ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <span className={prompt.trim() ? 'text-green-600' : 'text-gray-400'}>
                        {prompt.trim() ? '✅' : '⬜'}
                      </span>
                      <span className={prompt.trim() ? 'text-green-700 font-medium' : 'text-gray-500'}>
                        Prompt: {prompt.trim() ? 'Added' : 'None'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${totalQuestions > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <span className={totalQuestions > 0 ? 'text-green-600' : 'text-gray-400'}>
                        {totalQuestions > 0 ? '✅' : '⬜'}
                      </span>
                      <span className={totalQuestions > 0 ? 'text-green-700 font-medium' : 'text-gray-500'}>
                        Questions: {totalQuestions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateQuestions}
                  disabled={loading || !canGenerate}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : canGenerate
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating Questions...</span>
                    </div>
                  ) : (
                    `🚀 Generate ${totalQuestions} Questions`
                  )}
                </button>

                {!canGenerate && (
                  <p className="text-center text-sm text-gray-500">
                    Please add files or write a prompt to get started
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className="space-y-6">
            {/* Question Configuration */}
            <QuestionConfigComponent
              onConfigChange={setQuestionConfig}
              initialConfig={questionConfig}
              disabled={loading}
            />

            {/* Processing Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">🧠 AI Processing</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span>🔍</span>
                  <span>Extract text from images using OCR</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>📖</span>
                  <span>Analyze document content structure</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🎯</span>
                  <span>Generate contextual questions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>✨</span>
                  <span>Structured output with explanations</span>
                </li>
              </ul>
            </div>

            {/* API Status */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">📊 Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-mono text-green-600">gemini-1.5-pro</span>
                </div>
                <div className="flex justify-between">
                  <span>Multimodal:</span>
                  <span className="text-green-600">✅ Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>Structured Output:</span>
                  <span className="text-green-600">✅ Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(generatedQuestions || extractedContent.length > 0) && (
          <div className="mt-8 space-y-6">
            {/* Extracted Content Preview */}
            {extractedContent.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">📋 Extracted Content</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedContent.map((content, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Content {index + 1}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          content.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                          content.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {content.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{content.mainContent?.slice(0, 150)}...</p>
                      {content.topics && content.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {content.topics.slice(0, 3).map((topic: string, topicIndex: number) => (
                            <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Questions */}
            {generatedQuestions && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">✅ Generated Questions</h2>
                
                {/* Question Sections */}
                {generatedQuestions.mcqs && generatedQuestions.mcqs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-blue-700">📝 Multiple Choice Questions</h3>
                    <div className="space-y-4">
                      {generatedQuestions.mcqs.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                          <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {q.options?.map((option: string, optIdx: number) => (
                              <div key={optIdx} className={`p-2 rounded text-sm ${
                                option === q.answer 
                                  ? 'bg-green-100 border border-green-300 text-green-800 font-medium' 
                                  : 'bg-gray-50 border border-gray-200'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}) {option}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedQuestions.true_false && generatedQuestions.true_false.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-purple-700">✓ True/False Questions</h3>
                    <div className="space-y-3">
                      {generatedQuestions.true_false.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                          <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              q.answer 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              Answer: {q.answer ? 'True' : 'False'}
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Google Gemini 1.5 Pro • Enhanced with Vercel AI SDK • Built for Hackanova 3.0</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDemoPage; 