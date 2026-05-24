import { useState, useCallback } from "react";
import { journalService } from "../services/journalService";

export function useJournals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJournals = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await journalService.getAll(params);
      setJournals(result.journals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJournal = useCallback(async (data) => {
    const journal = await journalService.create(data);
    setJournals(prev => [journal, ...prev]);
    return journal;
  }, []);

  const updateJournal = useCallback(async (id, data) => {
    const updated = await journalService.update(id, data);
    setJournals(prev => prev.map(j => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const deleteJournal = useCallback(async (id) => {
    await journalService.delete(id);
    setJournals(prev => prev.filter(j => j.id !== id));
  }, []);

  return {
    journals,
    loading,
    error,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
  };
}
