import { useState, useCallback } from 'react';
import { ExpiryRule, PreviewBundle } from '../types/types';
import { ApiService, CreatePreviewPayload } from '../services/api';
import { StorageService } from '../services/storage';

export function usePreviewBundle() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBundle, setActiveBundle] = useState<PreviewBundle | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myPreviews, setMyPreviews] = useState<PreviewBundle[]>(() => StorageService.getMyGeneratedPreviews());

  const generatePreview = useCallback(async (payload: CreatePreviewPayload) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await ApiService.createPreview(payload);
      setActiveBundle(res.bundle);
      setGeneratedUrl(res.url);
      StorageService.saveGeneratedPreview(res.bundle);
      setMyPreviews(StorageService.getMyGeneratedPreviews());
      return res;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate preview bundle';
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const isPreviewStillValid = (bundle: PreviewBundle) =>
    bundle.isPermanent || bundle.expiresAt === null || bundle.expiresAt > Date.now();

  // Restore the previously generated link for a project when switching back
  // to it (permanent or not-yet-expired links only), otherwise show nothing.
  // Also prunes any now-expired links out of local storage while at it.
  const syncBundleForProject = useCallback((projectId: string) => {
    const all = StorageService.getMyGeneratedPreviews();
    const stillValid = all.filter(isPreviewStillValid);
    if (stillValid.length !== all.length) {
      StorageService.setGeneratedPreviews(stillValid);
      setMyPreviews(stillValid);
    }

    const match = stillValid
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (match) {
      setActiveBundle(match);
      setGeneratedUrl(`/preview/${match.id}`);
    } else {
      setActiveBundle(null);
      setGeneratedUrl(null);
    }
  }, []);

  const revokePreview = useCallback(async (id: string, authorId?: string) => {
    const ok = await ApiService.deletePreview(id, authorId);
    if (ok) {
      StorageService.removeGeneratedPreview(id);
      setMyPreviews(StorageService.getMyGeneratedPreviews());
    }
    return ok;
  }, []);

  const refreshMyPreviews = useCallback(async (authorId?: string) => {
    if (authorId) {
      const serverList = await ApiService.getUserPreviews(authorId);
      if (serverList.length > 0) {
        serverList.forEach(b => StorageService.saveGeneratedPreview(b));
      }
    }
    setMyPreviews(StorageService.getMyGeneratedPreviews());
  }, []);

  return {
    isGenerating,
    activeBundle,
    generatedUrl,
    error,
    myPreviews,
    generatePreview,
    revokePreview,
    refreshMyPreviews,
    syncBundleForProject,
    clearActiveBundle: () => {
      setActiveBundle(null);
      setGeneratedUrl(null);
      setError(null);
    }
  };
}
