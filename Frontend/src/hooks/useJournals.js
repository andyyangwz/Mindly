import { useState, useCallback } from "react";
import { journalService } from "../services/journalService";

export function useJournals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [foldersLoading, setFoldersLoading] = useState(false);

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

  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true);
    try {
      const result = await journalService.getFolders();
      setFolders(result.folders);
    } catch {
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const createJournal = useCallback(async (data) => {
    const journal = await journalService.create(data);
    setJournals(prev => [journal, ...prev]);
    if (journal.folderIds?.length) fetchFolders();
    return journal;
  }, [fetchFolders]);

  const updateJournal = useCallback(async (id, data) => {
    const updated = await journalService.update(id, data);
    setJournals(prev => prev.map(j => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const deleteJournal = useCallback(async (id) => {
    await journalService.delete(id);
    setJournals(prev => prev.filter(j => j.id !== id));
  }, []);

  const createFolder = useCallback(async (data) => {
    const folder = await journalService.createFolder(data);
    setFolders(prev => [folder, ...prev]);
    return folder;
  }, []);

  const updateFolder = useCallback(async (id, data) => {
    const updated = await journalService.updateFolder(id, data);
    setFolders(prev => prev.map(f => (f.id === id ? updated : f)));
    return updated;
  }, []);

  const deleteFolder = useCallback(async (id) => {
    await journalService.deleteFolder(id);
    setFolders(prev => prev.filter(f => f.id !== id));
    if (activeFolderId === id) setActiveFolderId(null);
  }, [activeFolderId]);

  const openFolder = useCallback((folderId) => {
    setActiveFolderId(folderId);
  }, []);

  const closeFolder = useCallback(() => {
    setActiveFolderId(null);
  }, []);

  const assignJournalFolders = useCallback(async (journalId, folderIds) => {
    await journalService.setJournalFolders(journalId, folderIds);
    setJournals(prev => prev.map(j =>
      j.id === journalId ? { ...j, folderIds } : j
    ));
    fetchFolders();
  }, [fetchFolders]);

  return {
    journals,
    loading,
    error,
    folders,
    foldersLoading,
    activeFolderId,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    openFolder,
    closeFolder,
    assignJournalFolders,
  };
}
