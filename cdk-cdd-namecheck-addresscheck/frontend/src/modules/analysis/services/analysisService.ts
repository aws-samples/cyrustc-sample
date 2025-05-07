import { axiosInstance } from "@/modules/core/lib/axios";
import type {
  AnalysisDetailsResponse,
  GetDocumentUrlResponse,
} from "../../onboarding/types";

export const analysisService = {
  async getAnalysis(id: string): Promise<AnalysisDetailsResponse> {
    const response = await axiosInstance.get<AnalysisDetailsResponse>(
      `/analyses/${id}`
    );
    return response.data;
  },

  getAnalysisDetails(id: string): Promise<AnalysisDetailsResponse> {
    return this.getAnalysis(id);
  },

  async getDocumentUrl(objectKey: string): Promise<GetDocumentUrlResponse> {
    const response = await axiosInstance.post<GetDocumentUrlResponse>(
      "/documents/get-url",
      { objectKey }
    );
    return response.data;
  },
};
