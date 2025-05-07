import { useState, useEffect } from "react";
import { OnboardingDetails } from "../types";
import { onboardingService } from "../services/onboardingService";

export function useOnboardingDetails(id: string) {
  const [onboarding, setOnboarding] = useState<OnboardingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const response = await onboardingService.getOnboardingDetails(id);
        setOnboarding(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
    }
  }, [id]);

  return { onboarding, loading, error };
}
