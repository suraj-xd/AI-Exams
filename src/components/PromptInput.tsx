import React, { useRef, useEffect, useCallback } from "react";
import { FiSend, FiX } from "react-icons/fi";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Describe what you want to create questions about...",
  disabled = false,
  maxLength = 2000,
}) => {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 120,
    maxHeight: 300,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim() && onSend) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      adjustHeight();
    }
  };

  const handleClear = () => {
    onChange("");
    adjustHeight(true);
  };

  return (
    <div className="rounded-lg border border-gray-600 bg-[#383942] transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full resize-none rounded-lg bg-transparent px-4 py-4 
            text-white placeholder-gray-400 focus:outline-none
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
          style={{ minHeight: "120px" }}
        />

        {/* Action buttons */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          {value.length > 0 && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-600 hover:text-white"
              title="Clear text"
            >
              <FiX size={16} />
            </button>
          )}

          {onSend && (
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className={`
                rounded-lg p-2 transition-all duration-200
                ${
                  !disabled && value.trim()
                    ? "text-blue-400 hover:bg-blue-600 hover:text-white"
                    : "cursor-not-allowed text-gray-500"
                }
              `}
              title="Send (Enter)"
            >
              <FiSend size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Character count */}
      <div className="flex items-center justify-between px-4 pb-3 text-sm text-gray-400">
        <span>
          {value.length} / {maxLength} characters
        </span>
        {value.length > 0 && (
          <span className="text-xs">Press Shift+Enter for new line</span>
        )}
      </div>
    </div>
  );
};

export default PromptInput;
