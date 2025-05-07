import { useState, useEffect } from "react";
import { AnalysisDetails } from "../../onboarding/types";
import { analysisService } from "../services/analysisService";

export function useAnalysisDetails(analysisId?: string) {
  const [analysis, setAnalysis] = useState<AnalysisDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!analysisId) return;

      try {
        setLoading(true);
        const response = await analysisService.getAnalysisDetails(analysisId);
        setAnalysis(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [analysisId]);

  return { analysis, loading, error };
}
