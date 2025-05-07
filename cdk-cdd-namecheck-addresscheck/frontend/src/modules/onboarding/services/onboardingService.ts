import { axiosInstance } from "@/modules/core/lib/axios";
import type {
  ListOnboardingResponse,
  OnboardingDetailsResponse,
  GenerateEmailResponse,
} from "../types";

export const onboardingService = {
  async getOnboardings(
    nextToken?: string,
    limit: number = 50
  ): Promise<ListOnboardingResponse> {
    const response = await axiosInstance.get<ListOnboardingResponse>(
      "/onboarding",
      {
        params: { nextToken, limit },
      }
    );
    return response.data;
  },

  async getOnboardingDetails(id: string): Promise<OnboardingDetailsResponse> {
    const response = await axiosInstance.get<OnboardingDetailsResponse>(
      `/onboarding/${id}`
    );
    return response.data;
  },

  async generateEmail(issue: string): Promise<GenerateEmailResponse> {
    const response = await axiosInstance.post<GenerateEmailResponse>(
      "/onboarding/email/generate",
      { issue }
    );
    return response.data;
  },
};
