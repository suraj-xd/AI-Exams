"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CornerDownRight,
  Layers,
  Paperclip,
  Settings,
  Trash,
  X,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { cn } from "~/utils/cn";
import { MultimodalFileUpload } from "./MultimodalFileUpload";
import { QuestionConfigComponent } from "./QuestionConfig";

// AI Models
const AI_MODELS = [
  { value: "openai/gpt-4", label: "GPT-4" },
  { value: "openai/gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "anthropic/claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "google/gemini-pro", label: "Gemini Pro" },
];

// Model icons mapping
const MODEL_ICONS: Record<string, React.ReactNode> = {
  "openai/gpt-4": <Bot className="h-4 w-4 text-gray-400" />,
  "openai/gpt-4-turbo": <Bot className="h-4 w-4 text-gray-400" />,
  "openai/gpt-3.5-turbo": <Bot className="h-4 w-4 text-gray-400" />,
  "anthropic/claude-3-sonnet": <Bot className="h-4 w-4 text-gray-400" />,
  "anthropic/claude-3-haiku": <Bot className="h-4 w-4 text-gray-400" />,
  "google/gemini-pro": <Bot className="h-4 w-4 text-gray-400" />,
};

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

export interface EduQuestPromptProps {
  onSend?: (
    value: string,
    model: string,
    files: any[],
    questionConfig: any,
  ) => void;
  defaultModel?: string;
  value: string;
  setValue: (value: string) => void;
  files: any[];
  setFiles: (files: any[]) => void;
  questionConfig: any;
  setQuestionConfig: (config: any) => void;
  loading?: boolean;
}

export function EduQuestPrompt({
  value,
  setValue,
  onSend,
  defaultModel = "openai/gpt-4",
  files,
  setFiles,
  questionConfig,
  setQuestionConfig,
  loading = false,
}: EduQuestPromptProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  // Get display label for the selected model
  const getModelLabel = (value: string) => {
    const model = AI_MODELS.find((m) => m.value === value);
    return model ? model.label : value;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSend?.(value, selectedModel, files, questionConfig);
      setValue("");
      adjustHeight(true);
    }
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend?.(value, selectedModel, files, questionConfig);
    setValue("");
    adjustHeight(true);
  };

  const canGenerate = files.length > 0 || value.trim().length > 0;
  const totalQuestions = Object.values(questionConfig).reduce(
    (sum: number, count: any) => sum + count,
    0,
  );

  return (
    <div className="w-full pt-4">
      <div className="rounded-2xl border border-gray-600 bg-[#383942] p-1.5">
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <Textarea
                autoFocus
                value={value}
                placeholder="Describe what you want to create questions about...

Examples:
• Generate questions about machine learning concepts
• Create a quiz based on the uploaded textbook chapter  
• Focus on advanced programming topics from the documents"
                className={cn(
                  "w-full resize-none rounded-xl rounded-b-none border-none bg-[#202329] px-4 py-3 text-white placeholder:text-gray-400 placeholder:opacity-30 focus:bg-[#202329] focus-visible:ring-0 focus-visible:ring-offset-0",
                  "min-h-[72px]",
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                disabled={loading}
              />
            </div>

            <div className="flex h-14 items-center rounded-b-xl bg-[#202329]">
              <div className="absolute bottom-3 left-3 right-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Model Selector Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex h-8 items-center gap-1 rounded-md pl-1 pr-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        disabled={loading}
                      >
                        <AnimatePresence
                          key={`current-model-${selectedModel}`}
                          mode="wait"
                        >
                          <motion.div
                            key={selectedModel}
                            initial={{
                              opacity: 0,
                              y: -5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: 5,
                            }}
                            transition={{
                              duration: 0.15,
                            }}
                            className="flex items-center gap-1"
                          >
                            {MODEL_ICONS[selectedModel] || (
                              <Bot className="h-4 w-4 text-gray-400" />
                            )}
                            {getModelLabel(selectedModel)}
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "min-w-[10rem]",
                        "border-gray-600 bg-[#383942] text-white",
                      )}
                    >
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.value}
                          onSelect={() => setSelectedModel(model.value)}
                          className="flex items-center justify-between gap-2 hover:bg-gray-700 focus:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            {MODEL_ICONS[model.value] || (
                              <Bot className="h-4 w-4 text-gray-400" />
                            )}
                            <span>{model.label}</span>
                          </div>
                          {selectedModel === model.value && (
                            <Check className="h-4 w-4 text-blue-400" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="mx-0.5 h-4 w-px bg-gray-600" />

                  {/* File Upload Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-8 cursor-pointer rounded-lg bg-gray-700 p-2",
                          "hover:bg-gray-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                          "text-gray-400 hover:text-white",
                        )}
                        aria-label="Attach file"
                        disabled={loading}
                      >
                        {files.length > 0 ? (
                          <p className="text-xs text-gray-400">
                            {files.length} file{files.length !== 1 ? "s" : ""}{" "}
                            uploaded
                          </p>
                        ) : (
                          <Paperclip className="h-4 w-4 transition-colors" />
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl border-gray-600 bg-[#383942] text-white">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            Upload Files
                          </h3>
                          <p className="text-sm text-gray-400">
                            Upload documents, images, or other files to generate
                            questions from.
                          </p>
                        </div>
                        <MultimodalFileUpload
                          onFilesChange={setFiles}
                          maxFiles={5}
                          disabled={loading}
                        />
                        <div className="flex items-center justify-between">
                          <p>
                            {files.length > 0 && (
                              <div className="text-sm text-green-400">
                                ✅ {files.length} file
                                {files.length !== 1 ? "s" : ""} uploaded
                              </div>
                            )}
                          </p>
                          <DialogTrigger asChild >
                          <Button variant="default" className="gap-1">
                            <Check className="h-4 w-4 transition-colors" />
                            Done
                          </Button>
                          </DialogTrigger>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="mx-0.5 h-4 w-px bg-gray-600" />

                  {/* Question Configuration Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex h-8 items-center gap-1 rounded-md pl-1 pr-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        disabled={loading}
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        {totalQuestions} Questions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-gray-600 bg-[#383942] text-white">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            Question Configuration
                          </h3>
                          <p className="text-sm text-gray-400">
                            Configure the types and number of questions to
                            generate.
                          </p>
                        </div>
                        <QuestionConfigComponent
                          onConfigChange={setQuestionConfig}
                          initialConfig={questionConfig}
                          disabled={loading}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <button
                  type="button"
                  className={cn(
                    "rounded-lg bg-gray-700 p-2",
                    "hover:bg-gray-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                    canGenerate && !loading ? "text-white" : "text-gray-500",
                  )}
                  aria-label="Send message"
                  disabled={!canGenerate || loading}
                  onClick={handleSend}
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 text-white transition-opacity duration-200",
                        canGenerate ? "opacity-100" : "opacity-30",
                      )}
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
