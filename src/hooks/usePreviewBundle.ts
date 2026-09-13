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
    clearActiveBundle: () => {
      setActiveBundle(null);
      setGeneratedUrl(null);
      setError(null);
    }
  };
}
