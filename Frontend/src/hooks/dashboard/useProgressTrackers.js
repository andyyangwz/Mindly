import { useState, useCallback, useEffect } from "react";
import { progressTrackerService } from "../../features/dashboard/services/progressTrackerService";

export function useProgressTrackers() {
  const [relics, setRelics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRelics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await progressTrackerService.getAll();
      setRelics(data.habit_goals || []);
    } catch (err) {
      setError(err.message || "Failed to load relics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRelics();
  }, [fetchRelics]);

  const createRelic = useCallback(async (relicData) => {
    const data = await progressTrackerService.create(relicData);
    setRelics((prev) => [...prev, data.habit_goal]);
    return data.habit_goal;
  }, []);

  const updateRelic = useCallback(async (id, relicData) => {
    const data = await progressTrackerService.update(id, relicData);
    setRelics((prev) =>
      prev.map((g) => (g.id === id ? data.habit_goal : g))
    );
    return data.habit_goal;
  }, []);

  const deleteRelic = useCallback(async (id) => {
    await progressTrackerService.delete(id);
    setRelics((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const equipRelic = useCallback(async (relicId, slot) => {
    const result = await progressTrackerService.equip(relicId, slot);
    setRelics((prev) => {
      const next = [...prev];
      if (result.unequipped) {
        const oldIdx = next.findIndex((g) => g.id === result.unequipped.id);
        if (oldIdx !== -1) next[oldIdx] = result.unequipped;
      }
      const newIdx = next.findIndex((g) => g.id === result.equipped.id);
      if (newIdx !== -1) next[newIdx] = result.equipped;
      return next;
    });
    return result;
  }, []);

  const unequipRelic = useCallback(async (relicId) => {
    const data = await progressTrackerService.unequip(relicId);
    setRelics((prev) =>
      prev.map((g) => (g.id === data.habit_goal.id ? data.habit_goal : g))
    );
    return data.habit_goal;
  }, []);

  return {
    relics,
    loading,
    error,
    createRelic,
    updateRelic,
    deleteRelic,
    equipRelic,
    unequipRelic,
    refetch: fetchRelics,
  };
}
