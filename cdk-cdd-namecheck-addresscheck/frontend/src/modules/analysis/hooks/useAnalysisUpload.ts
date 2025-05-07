import { useState } from "react";
import { analysisService } from "../services/analysisService";
import { useNavigate } from "react-router-dom";
import type {
  PresignedUrlResponse,
  CreateAnalysisResponse,
  UploadProgress,
} from "../types";

export function useAnalysisUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    value: 0,
    status: "in-progress",
    message: "Starting upload process...",
  });

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({
      value: 0,
      status: "in-progress",
      message: "Creating analysis...",
    });

    try {
      // Step 1: Create new analysis (25%)
      const analysis = await analysisService.createAnalysis();

      setProgress({
        value: 25,
        status: "in-progress",
        message: "Getting upload URLs...",
      });

      // Step 2: Get presigned URLs for file uploads (50%)
      const presignedData: PresignedUrlResponse =
        await analysisService.getUploadUrls(analysis.analysisId, files.length);

      setProgress({
        value: 50,
        status: "in-progress",
        message: "Uploading files...",
      });

      // Step 3: Upload files to S3 (50% to 75%)
      const incrementPerFile = 25 / files.length;
      await Promise.all(
        files.map(async (file, index) => {
          await analysisService.uploadFileToS3(
            presignedData.urls[index].url,
            file
          );
          setProgress((prev) => ({
            value: 50 + incrementPerFile * (index + 1),
            status: "in-progress",
            message: `Uploaded ${index + 1} of ${files.length} files...`,
          }));
        })
      );

      setProgress({
        value: 75,
        status: "in-progress",
        message: "Starting analysis...",
      });

      // Step 4: Start the analysis (100%)
      await analysisService.startAnalysis(
        analysis.analysisId,
        presignedData.urls.map((item) => item.key)
      );

      setProgress({
        value: 100,
        status: "success",
        message: "Upload complete! Starting analysis...",
      });

      // Step 5: Navigate back to list
      navigate("/analysis");
    } catch (err) {
      setError((err as Error).message);
      setProgress({
        value: progress.value,
        status: "error",
        message: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    progress,
    uploadFiles,
    clearError: () => setError(null),
  };
}
