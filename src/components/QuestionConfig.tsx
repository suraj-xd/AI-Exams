import React, { useState } from 'react';

interface QuestionConfig {
  mcqs: number;
  fillInBlanks: number;
  trueFalse: number;
  shortType: number;
  longType: number;
}

interface QuestionConfigProps {
  onConfigChange: (config: QuestionConfig) => void;
  initialConfig?: Partial<QuestionConfig>;
  disabled?: boolean;
}

const defaultConfig: QuestionConfig = {
  mcqs: 5,
  fillInBlanks: 5,
  trueFalse: 5,
  shortType: 3,
  longType: 2,
};

export const QuestionConfigComponent: React.FC<QuestionConfigProps> = ({
  onConfigChange,
  initialConfig = {},
  disabled = false,
}) => {
  const [config, setConfig] = useState<QuestionConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const handleChange = (field: keyof QuestionConfig, value: number) => {
    const newConfig = { ...config, [field]: Math.max(0, value) };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const InputField = ({ 
    label, 
    field, 
    max 
  }: { 
    label: string; 
    field: keyof QuestionConfig; 
    max: number;
  }) => (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => handleChange(field, config[field] - 1)}
          disabled={disabled || config[field] <= 0}
          className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          max={max}
          value={config[field]}
          onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
          disabled={disabled}
          className="w-16 px-2 py-1 text-center bg-gray-800 border border-gray-600 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700"
        />
        <button
          type="button"
          onClick={() => handleChange(field, config[field] + 1)}
          disabled={disabled || config[field] >= max}
          className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );

  const totalQuestions = Object.values(config).reduce((sum, count) => sum + count, 0);

  return (
    <div className="p-6 rounded-lg border border-gray-600 bg-gray-800/30">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">
        🎯 Question Configuration
      </h3>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <InputField 
          label="📝 Multiple Choice Questions" 
          field="mcqs" 
          max={20} 
        />
        <InputField 
          label="📋 Fill in the Blanks" 
          field="fillInBlanks" 
          max={20} 
        />
        <InputField 
          label="✓ True/False Questions" 
          field="trueFalse" 
          max={20} 
        />
        <InputField 
          label="📄 Short Answer Questions" 
          field="shortType" 
          max={10} 
        />
        <InputField 
          label="📖 Long Answer Questions" 
          field="longType" 
          max={5} 
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-600">
        <div className="text-sm text-gray-400">
          Total Questions: <span className="font-medium text-gray-200">{totalQuestions}</span>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setConfig(defaultConfig);
            onConfigChange(defaultConfig);
          }}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset to Default
        </button>
      </div>

      {totalQuestions === 0 && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded">
          <p className="text-sm text-yellow-300">
            Please select at least one type of question to generate.
          </p>
        </div>
      )}
    </div>
  );
}; 