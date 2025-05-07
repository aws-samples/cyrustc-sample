import { useState, useEffect } from "react";
import { OnboardingSummary } from "../types";
import { onboardingService } from "../services/onboardingService";

export function useOnboardingList() {
  const [onboardings, setOnboardings] = useState<OnboardingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchOnboardings();
  }, []);

  async function fetchOnboardings() {
    try {
      setLoading(true);
      const response = await onboardingService.getOnboardings();
      setOnboardings(response.items);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { onboardings, loading, error, refetch: fetchOnboardings };
}
