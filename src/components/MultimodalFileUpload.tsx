import React, { useState, useCallback, useRef } from 'react';
import { 
  isImageFile, 
  isDocumentFile, 
  isSupportedFile,
  getFileTypeCategory,
  API_CONFIG 
} from '../config/api';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string; // For images
  category: 'image' | 'document' | 'unsupported';
}

interface MultimodalFileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const MultimodalFileUpload: React.FC<MultimodalFileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      // Validate file
      if (!isSupportedFile(file.type)) {
        alert(`Unsupported file type: ${file.name}`);
        continue;
      }

      if (file.size > API_CONFIG.MAX_FILE_SIZE) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }

      // Check if we've reached max files
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        break;
      }

      const category = getFileTypeCategory(file.type);
      const fileData: UploadedFile = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        category,
      };

      // Create preview for images
      if (category === 'image') {
        try {
          const preview = await createImagePreview(file);
          fileData.preview = preview;
        } catch (error) {
          console.error('Error creating image preview:', error);
        }
      }

      newFiles.push(fileData);
    }

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [uploadedFiles, maxFiles, onFilesChange]);

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [uploadedFiles, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    onFilesChange([]);
  }, [onFilesChange]);

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      default:
        return '📎';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-500/10 scale-105' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800/30'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.csv,.md,.doc,.docx"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="text-4xl">
            {dragActive ? '⬇️' : '📎'}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-300">
              {dragActive ? 'Drop files here' : 'Upload files'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Drag & drop or click to select • Max {maxFiles} files
            </p>
          </div>

          <div className="text-xs text-gray-500">
            <p>✅ Images: JPG, PNG, GIF, WebP</p>
            <p>✅ Documents: PDF, TXT, CSV, MD, DOC</p>
            <p>📏 Max size: 10MB per file</p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-xs text-red-400 hover:text-red-300 underline"
              disabled={disabled}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center space-x-3 p-3 bg-gray-800/50 border border-gray-600 rounded-lg shadow-sm"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.category === 'image' && uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-12 h-12 object-cover rounded border border-gray-600"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center text-xl">
                      {getFileIcon(uploadedFile.category)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span className="capitalize">{uploadedFile.category}</span>
                    <span>•</span>
                    <span>{(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                      Ready
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="flex-shrink-0 p-1 text-gray-500 hover:text-red-400 transition-colors"
                  disabled={disabled}
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Tips */}
      {uploadedFiles.length === 0 && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Tips:</h4>
          <ul className="text-xs text-blue-200/80 space-y-1">
            <li>• Upload images of textbooks, notes, or diagrams</li>
            <li>• Add PDF documents or text files for context</li>
            <li>• Mix multiple file types for comprehensive question generation</li>
            <li>• Files will be processed using AI to extract educational content</li>
          </ul>
        </div>
      )}
    </div>
  );
}; 