import { useState, useEffect } from "react";
import { Analysis } from "../types/analysis.types";
import { analysisService } from "../services/analysisService";

export function useAnalysisList() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  async function fetchAnalyses() {
    try {
      setLoading(true);
      const response = await analysisService.getAnalyses();
      setAnalyses(response.items);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { analyses, loading, error, refetch: fetchAnalyses };
}
