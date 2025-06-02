import React, { useState, useEffect } from 'react';
import { FiX, FiKey, FiTrash2, FiExternalLink, FiShield, FiRefreshCw } from 'react-icons/fi';
import useCreditsStore from '../store/useCreditsStore';
import toast from 'react-hot-toast';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    localApiKey, 
    credits,
    usingLocalKey,
    setLocalApiKey, 
    removeLocalApiKey,
    resetCredits
  } = useCreditsStore();

  useEffect(() => {
    if (localApiKey) {
      setApiKey(localApiKey);
    }
  }, [localApiKey]);

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
      toast.success('API key saved successfully!');
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    try {
      await removeLocalApiKey();
      setApiKey('');
      toast.success('API key removed successfully');
    } catch (error) {
      toast.error('Failed to remove API key');
    }
  };

  const handleResetCredits = async () => {
    try {
      const success = await resetCredits();
      if (success) {
        toast.success('Credits reset to 4');
      } else {
        toast.error('Failed to reset credits');
      }
    } catch (error) {
      toast.error('Failed to reset credits');
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••••••••••••••' + key.substring(key.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-xl bg-[#202329] border border-gray-600 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="mt-2 text-sm text-gray-400">
            Manage your API keys and credits
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Credits Section */}
          <div className="rounded-lg bg-[#383942] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Generation Credits</h3>
              <span className="rounded-full bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-300">
                {usingLocalKey ? '∞ Unlimited' : `${credits} remaining`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {usingLocalKey 
                ? 'Using your own API key provides unlimited generations'
                : 'Each session creation uses 1 credit. You started with 4 credits.'
              }
            </p>
            {!usingLocalKey && (
              <button
                onClick={handleResetCredits}
                className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FiRefreshCw size={12} />
                <span>Reset to 4 credits (dev only)</span>
              </button>
            )}
          </div>

          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Gemini API Key</h3>
              {usingLocalKey && (
                <div className="flex items-center space-x-1 text-xs text-green-400">
                  <FiShield size={12} />
                  <span>Active</span>
                </div>
              )}
            </div>

            {localApiKey ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-600 bg-[#383942] px-3 py-2">
                  <span className="text-sm font-mono text-gray-300">
                    {maskApiKey(localApiKey)}
                  </span>
                  <button
                    onClick={handleRemoveApiKey}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Remove API Key"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-green-400">
                  ✅ You're using your own API key with unlimited generations
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key (AIza...)"
                  className="w-full rounded-lg border border-gray-600 bg-[#383942] px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !apiKey.trim()}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save API Key'}
                </button>
              </div>
            )}

            {/* How to get API Key */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-900/10 p-3">
              <h4 className="text-sm font-medium text-blue-300 mb-2">How to get your API key:</h4>
              <ol className="text-xs text-blue-200 space-y-1 mb-3">
                <li>1. Visit Google AI Studio</li>
                <li>2. Sign in with your Google account</li>
                <li>3. Create a new API key</li>
                <li>4. Copy and paste it above</li>
              </ol>
              <a
                href="https://ai.google.dev/gemini-api/docs/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FiKey className="mr-1" size={12} />
                Get your API key
                <FiExternalLink className="ml-1" size={12} />
              </a>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg border border-gray-600 bg-gray-800/20 p-3">
            <p className="text-xs text-gray-400">
              <FiShield className="mr-1 inline" size={12} />
              Your API key is stored securely in your browser's local storage and never sent to our servers.
              Credits are now managed server-side for security.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog; 