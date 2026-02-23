'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentUpload } from '@/hooks/use-document-upload';

interface DocumentUploadProps {
  type: 'aadhaar' | 'shop-image' | 'bike-image';
  resourceId: number; // userId for aadhaar, shopId for shop-image, bikeId for bike-image
  onUploadSuccess?: (fileUrl: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

/**
 * Reusable document upload component
 * Handles uploads to OneDrive with progress indication
 */
export function DocumentUpload({
  type,
  resourceId,
  onUploadSuccess,
  label,
  accept = 'image/*',
  className = '',
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadAadhaarCard, uploadShopImage, uploadBikeImage, isLoading, error } =
    useDocumentUpload({
      onSuccess: (response) => {
        if (response.file) {
          setUploadedFile({
            name: response.file.name,
            url: response.file.url,
          });
          onUploadSuccess?.(response.file.url);
          setUploadError(null);
        }
      },
      onError: (err) => {
        setUploadError(err.message);
      },
    });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      let result;

      switch (type) {
        case 'aadhaar':
          result = await uploadAadhaarCard(file);
          break;
        case 'shop-image':
          result = await uploadShopImage(file, resourceId);
          break;
        case 'bike-image':
          result = await uploadBikeImage(file, resourceId);
          break;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result?.file) {
        throw new Error('Upload failed');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayLabel = label || {
    aadhaar: 'Upload Aadhaar Card',
    'shop-image': 'Upload Shop Image',
    'bike-image': 'Upload Bike Image',
  }[type];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        {type === 'aadhaar' && 'Upload a clear photo of your Aadhaar card (PDF or Image)'}
        {type === 'shop-image' && 'Upload shop profile photos (JPG, PNG, max 10MB)'}
        {type === 'bike-image' && 'Upload bike photos from different angles (JPG, PNG, max 10MB)'}
      </p>

      {/* Upload area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading || isLoading}
          className="hidden"
          aria-label={displayLabel}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
          className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-brand-blue hover:bg-brand-blue/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{displayLabel}</span>
          </div>
          {isUploading && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-brand-blue h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </button>
      </div>

      {/* Uploaded file display */}
      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline"
            >
              View file
            </a>
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-green-200 rounded transition"
            title="Remove file"
          >
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Error display */}
      {(uploadError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900">{uploadError || error}</p>
        </div>
      )}
    </div>
  );
}
