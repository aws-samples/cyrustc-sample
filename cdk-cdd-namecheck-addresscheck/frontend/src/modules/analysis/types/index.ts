export type DocumentType = "MIXED" | "BANK_STATEMENT" | "ANNUAL_REPORT";

export type AnalysisStatus = "PENDING" | "STARTED" | "PROCESSING" | "PROCESSED";

export interface AnalysisSummary {
  analysisId: string;
  createdAt: string;
  description: string;
  documentType: DocumentType;
  status: AnalysisStatus;
}

export interface Analysis extends AnalysisSummary {
  objectsData: Record<string, any>;
  chatHistory: Array<any>;
  lastUpdatedAt: string;
  analysisParameters: Record<string, any>;
  analysisResults: Record<string, any>;
}

export interface CreateAnalysisRequest {
  description: string;
  documentType: DocumentType;
}

export interface CreateAnalysisResponse {
  analysisId: string;
  createdAt: string;
  status: AnalysisStatus;
}

export interface PresignedUrl {
  url: string;
  key: string;
}

export interface PresignedUrlResponse {
  urls: PresignedUrl[];
  expiresIn: number;
  generatedAt: string;
}

export interface StartAnalysisRequest {
  objectKeys: string[];
}

export interface StartAnalysisResponse {
  status: AnalysisStatus;
  lastUpdatedAt: string;
}

export interface ListAnalysesResponse {
  items: AnalysisSummary[];
  nextToken: string | null;
  fetchedAt: string;
}

export interface GetAnalysisResponse {
  analysis: Analysis;
  fetchedAt: string;
}

export interface UploadProgress {
  value: number;
  status: "in-progress" | "success" | "error";
  message: string;
}

export interface AnalysisResponse {
  data: Analysis;
  fetchedAt: string;
}
