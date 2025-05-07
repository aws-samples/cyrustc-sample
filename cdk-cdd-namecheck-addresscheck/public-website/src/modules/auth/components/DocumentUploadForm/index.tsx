'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/modules/core/components/Button';
import { Upload, X, Check } from 'lucide-react';
import styles from './styles.module.css';
import { createAnalysis, generateUploadUrls, uploadFile } from '../../services/onboarding';

interface DocumentUploadFormProps {
  onPrevious: () => void;
  onSubmit: (documents: string[], analysisId: string) => Promise<void>;
  isSubmitting?: boolean;
  email: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

interface SuccessMessageProps {
  email: string;
}

function SuccessMessage({ email }: SuccessMessageProps) {
  return (
    <div className={styles.success}>
      <Check className={styles.successIcon} />
      <h3 className={styles.successTitle}>Thank you for signing up!</h3>
      <p className={styles.successText}>
        Your account has been created but is currently in Pending Verification status. 
        We will review your documents and notify you at {email} once verification is complete.
      </p>
    </div>
  );
}

export function DocumentUploadForm({ 
  onPrevious, 
  onSubmit,
  isSubmitting = false,
  email
}: DocumentUploadFormProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const invalidFiles = fileArray.filter(file => file.type !== 'application/pdf');
    
    if (invalidFiles.length > 0) {
      setError('Only PDF files are allowed');
      return;
    }

    setError('');
    setFiles(prev => [...prev, ...fileArray]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    try {
      setUploadProgress('Creating analysis...');
      // Step 1: Create analysis
      const analysis = await createAnalysis();

      // Step 2: Generate upload URLs
      setUploadProgress('Generating upload URLs...');
      const urlsResponse = await generateUploadUrls(analysis.analysisId, files.length);

      // Step 3: Upload files
      setUploadProgress('Uploading files...');
      await Promise.all(
        files.map((file, index) => 
          uploadFile(urlsResponse.urls[index].url, file)
        )
      );

      // Step 4: Submit onboarding with document keys
      const objectKeys = urlsResponse.urls.map(url => url.key);
      await onSubmit(objectKeys, analysis.analysisId);
      
      // Show success message
      setIsSuccess(true);

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload documents. Please try again.');
      setUploadProgress('');
    }
  };

  if (isSuccess) {
    return <SuccessMessage email={email} />;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div
        className={styles.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className={styles.icon} />
        <p className={styles.text}>
          Drag and drop your PDF files here, or{' '}
          <label className={styles.button}>
            browse
            <input
              type="file"
              multiple
              accept=".pdf"
              className={styles.input}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
        <p className={styles.hint}>Supported file type: PDF</p>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {uploadProgress && <p className={styles.progress}>{uploadProgress}</p>}

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemoveFile(index)}
                disabled={isSubmitting}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.buttons}>
        <Button 
          variant="ghost" 
          type="button" 
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Previous
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Complete Sign Up'}
        </Button>
      </div>
    </form>
  );
} 