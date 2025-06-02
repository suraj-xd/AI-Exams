import React, { useState } from 'react';
import { FiChevronDown, FiCheck, FiCpu } from 'react-icons/fi';

interface AIModel {
  value: string;
  label: string;
  provider: 'openai' | 'claude' | 'gemini' | 'deepseek';
}

const AI_MODELS: AIModel[] = [
  { value: 'openai/gpt-4', label: 'GPT-4', provider: 'openai' },
  { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', provider: 'claude' },
  { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'claude' },
  { value: 'google/gemini-pro', label: 'Gemini Pro', provider: 'gemini' },
  { value: 'google/gemini-ultra', label: 'Gemini Ultra', provider: 'gemini' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek' },
  { value: 'deepseek/deepseek-coder', label: 'DeepSeek Coder', provider: 'deepseek' },
];

const getProviderIcon = (provider: string) => {
  const iconProps = { size: 16 };
  
  switch (provider) {
    case 'openai':
      return <FiCpu {...iconProps} className="text-green-400" />;
    case 'claude':
      return <FiCpu {...iconProps} className="text-orange-400" />;
    case 'gemini':
      return <FiCpu {...iconProps} className="text-blue-400" />;
    case 'deepseek':
      return <FiCpu {...iconProps} className="text-purple-400" />;
    default:
      return <FiCpu {...iconProps} className="text-gray-400" />;
  }
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedModelData = AI_MODELS.find(model => model.value === selectedModel);
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-4 py-3 
          bg-[#383942] hover:bg-[#424250] text-white rounded-lg 
          border border-gray-600 transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-3">
          {selectedModelData && getProviderIcon(selectedModelData.provider)}
          <span className="font-medium">
            {selectedModelData?.label || 'Select Model'}
          </span>
        </div>
        <FiChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#383942] border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {AI_MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                onModelSelect(model.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-left
                hover:bg-[#424250] transition-colors duration-150
                ${selectedModel === model.value ? 'bg-[#424250]' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                {getProviderIcon(model.provider)}
                <span className="text-white">{model.label}</span>
              </div>
              {selectedModel === model.value && (
                <FiCheck size={16} className="text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 