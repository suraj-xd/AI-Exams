import React, { useState } from 'react';
import { FiX, FiKey, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import useCreditsStore from '../store/useCreditsStore';
import toast from 'react-hot-toast';

interface CreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: () => void;
}

const CreditsDialog: React.FC<CreditsDialogProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setLocalApiKey } = useCreditsStore();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate API key format (basic validation)
      if (!apiKey.startsWith('AI') || apiKey.length < 20) {
        toast.error('Please enter a valid Gemini API key');
        return;
      }

      await setLocalApiKey(apiKey.trim());
      toast.success('API key saved successfully! You can now use unlimited generations.');
      onApiKeySet();
      onClose();
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-xl bg-[#202329] border border-gray-600 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/20 text-red-400">
            <FiAlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Credits Exhausted</h2>
          <p className="mt-2 text-sm text-gray-400">
            You have 0 generations remaining. Our pricing model is in progress.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="rounded-lg bg-[#383942] p-4">
            <h3 className="flex items-center text-sm font-medium text-white">
              <FiKey className="mr-2" />
              Use Your Own API Key
            </h3>
            <p className="mt-2 text-xs text-gray-400">
              Enter your Gemini API key to continue generating questions with unlimited usage.
            </p>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-lg border border-gray-600 bg-[#383942] px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* How to get API Key */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-3">
            <h4 className="text-sm font-medium text-blue-300 mb-2">How to get your API key:</h4>
            <ol className="text-xs text-blue-200 space-y-1">
              <li>1. Visit Google AI Studio</li>
              <li>2. Sign in with your Google account</li>
              <li>3. Create a new API key</li>
              <li>4. Copy and paste it above</li>
            </ol>
            <a
              href="https://ai.google.dev/gemini-api/docs/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Get your API key
              <FiExternalLink className="ml-1" size={12} />
            </a>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveApiKey}
              disabled={isLoading || !apiKey.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsDialog; 