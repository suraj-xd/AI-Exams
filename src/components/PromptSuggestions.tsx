import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { LuLightbulb } from 'react-icons/lu';

interface PromptSuggestionsProps {
  label?: string;
  onSuggestionClick: (suggestion: string) => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Generate questions about machine learning fundamentals and neural networks",
  "Create a quiz based on React.js components and hooks",
  "Focus on data structures and algorithms concepts",
  "Build questions about Python programming and best practices",
  "Generate questions from uploaded textbook chapters",
  "Create questions about database design and SQL queries"
];

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  label = "Example questions",
  onSuggestionClick,
  suggestions = DEFAULT_SUGGESTIONS
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-orange-400">
        <LuLightbulb size={20} />
        <h3 className="text-lg font-medium">{label}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="group p-4 bg-[#383942] hover:bg-[#424250] border border-gray-600 hover:border-orange-400 rounded-lg text-left transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between space-x-3">
              <p className="text-white text-sm leading-relaxed flex-1">
                {suggestion}
              </p>
              <FiArrowRight 
                size={16} 
                className="text-gray-400 group-hover:text-orange-400 flex-shrink-0 mt-0.5 transition-colors duration-200" 
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions; 