export interface AnalysisTableItem {
  pk: string; // ID#{analysisId}
  sk: string; // METADATA
  analysisId: string;
  description: string;
  documentType: string;
  objectsData: Array<{
    object: string;
    data: Array<{
      page: number;
      content: string;
      tokenInput: number;
      tokenOutput: number;
    }>;
    numberOfPages: number;
    tokenInput: number;
    tokenOutput: number;
  }>;
  chatHistory: Array<{
    role: "human" | "assistant";
    content: string;
    timestamp: string;
  }>;
  status: string;
  yearMonth: string;
  createdAt: string;
  lastUpdatedAt: string;
  ttl?: number;
}
