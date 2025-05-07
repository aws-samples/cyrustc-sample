import { axios } from "@/modules/core/lib/axios";

export interface OnboardingData {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  country: string;
  documents: string[];
  analysisId: string;
}

export interface OnboardingResponse {
  uniqueId: string;
  status: string;
  createdAt: string;
}

interface CreateAnalysisResponse {
  analysisId: string;
  status: string;
  createdAt: string;
}

interface GenerateUrlsResponse {
  urls: Array<{
    url: string;
    key: string;
  }>;
  expiresIn: number;
  generatedAt: string;
}

export async function createAnalysis(): Promise<CreateAnalysisResponse> {
  const response = await axios.post<CreateAnalysisResponse>("/analyses");
  return response.data;
}

export async function generateUploadUrls(
  analysisId: string,
  fileCount: number
): Promise<GenerateUrlsResponse> {
  const response = await axios.post<GenerateUrlsResponse>(
    `/analyses/${analysisId}/upload-urls`,
    { fileCount }
  );
  return response.data;
}

export async function uploadFile(url: string, file: File): Promise<void> {
  await axios.put(url, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
}

export async function createOnboarding(
  data: OnboardingData
): Promise<OnboardingResponse> {
  const response = await axios.post<OnboardingResponse>("/onboarding", data);
  return response.data;
}
