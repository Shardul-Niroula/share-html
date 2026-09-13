import { ExpiryRule, PreviewBundle } from '../types/types';

export interface CreatePreviewPayload {
  title: string;
  html: string;
  css: string;
  js: string;
  expiryRule: ExpiryRule;
  customExpiryTimestamp?: number;
  authorId?: string;
  authorName?: string;
}

export interface CreatePreviewResponse {
  success: boolean;
  bundle: PreviewBundle;
  url: string;
  message?: string;
}

export interface GetPreviewResponse {
  success: boolean;
  bundle?: PreviewBundle;
  isExpired?: boolean;
  message?: string;
  expiresAt?: number | null;
}

export const ApiService = {
  async createPreview(payload: CreatePreviewPayload): Promise<CreatePreviewResponse> {
    const res = await fetch('/api/previews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${res.status}`);
    }

    return res.json();
  },

  async getPreviewById(id: string): Promise<GetPreviewResponse> {
    const res = await fetch(`/api/previews/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.status === 410) {
      // 410 Gone indicates expired preview
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        isExpired: true,
        message: data.message || 'Preview has expired according to its expiry rule.',
        expiresAt: data.expiresAt,
      };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.error || 'Preview not found or invalid link.',
      };
    }

    const data = await res.json();
    return {
      success: true,
      bundle: data.bundle,
    };
  },

  async deletePreview(id: string, authorId?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/previews/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getUserPreviews(authorId: string): Promise<PreviewBundle[]> {
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(authorId)}/previews`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.previews || [];
    } catch {
      return [];
    }
  }
};
