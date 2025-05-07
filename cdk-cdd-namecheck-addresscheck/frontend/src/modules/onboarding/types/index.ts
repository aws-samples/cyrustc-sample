export type OnboardingStatus =
  | "NEW"
  | "CHECKING"
  | "READY_TO_CHECK"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFICATION";

export interface OnboardingSummary {
  requestId: string;
  email: string;
  firstName: string;
  country: string;
  status: OnboardingStatus;
  createdAt: string;
}

export interface ListOnboardingResponse {
  items: OnboardingSummary[];
  nextToken: string | null;
  fetchedAt: string;
}

export interface PageData {
  page: string;
  tokenInput: string;
  tokenOutput: string;
}

export interface ObjectData {
  numberOfPages: string;
  data: PageData[];
  tokenInput: string;
  tokenOutput: string;
  object: string;
}

export interface AnalysisParameters {
  firstName: string;
  lastName: string;
  middleName: string | null;
  address: string;
}

export interface AnalysisResult {
  result: string;
  analysis: string;
  inputToken: string;
  outputToken: string;
}

export interface AnalysisDetails {
  analysisId: string;
  description: string;
  documentType: string;
  objectsData: ObjectData[];
  chatHistory: any[];
  status: string;
  createdAt: string;
  lastUpdatedAt: string;
  analysisParameters: AnalysisParameters;
  analysisResults: AnalysisResult[];
}

export interface AnalysisDetailsResponse {
  data: AnalysisDetails;
  fetchedAt: string;
}

export interface GetDocumentUrlResponse {
  url: string;
  expiresIn: number;
}

export interface NameAddressVerificationResult {
  document: {
    name: string;
    address: string;
  };
  analysis: {
    name: {
      match: boolean;
      reason: string | null;
    };
    address: {
      match: boolean;
      reason: string | null;
    };
  };
}

export interface GenerateEmailResponse {
  content: string;
  thinking: string;
  inputToken: number;
  outputToken: number;
}
