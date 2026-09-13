import React, { useEffect, useState } from 'react';
import { ApiService, GetPreviewResponse } from '../services/api';
import { buildSandboxedDocument } from '../services/sanitizer';
import { PreviewBundle } from '../types/types';
import { AlertOctagon, Sparkles } from 'lucide-react';
import './StandalonePreviewPage.css';

interface StandalonePreviewPageProps {
  previewId: string;
}

export const StandalonePreviewPage: React.FC<StandalonePreviewPageProps> = ({ previewId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [bundle, setBundle] = useState<PreviewBundle | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      setLoading(true);
      try {
        const res: GetPreviewResponse = await ApiService.getPreviewById(previewId);
        if (!isMounted) return;

        if (res.isExpired) {
          setIsExpired(true);
          setErrorMessage(res.message || 'This preview link has reached its expiry date and is no longer available.');
        } else if (res.success && res.bundle) {
          setBundle(res.bundle);
        } else {
          setErrorMessage(res.message || 'Preview not found or invalid identifier.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Network error occurred while fetching preview bundle.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [previewId]);

  if (loading) {
    return (
      <div className="preview-loading-screen" id="preview-loading-screen">
        <div className="preview-spinner" />
        <div>Verifying security sandbox and expiry rules...</div>
      </div>
    );
  }

  if (isExpired || errorMessage || !bundle) {
    return (
      <div className="expired-state-container" id="preview-expired-screen">
        <div className="expired-card">
          <div className="expired-icon-wrapper">
            <AlertOctagon size={28} />
          </div>
          <h1>{isExpired ? 'Preview Expired' : 'Preview Unavailable'}</h1>
          <p>
            {isExpired
              ? 'The creator configured an expiration rule for this snippet, and its active sharing window has elapsed.'
              : errorMessage || 'The requested preview link does not exist or has been removed.'}
          </p>

          <div className="expired-info-box">
            <div><strong>Link ID:</strong> {previewId}</div>
            <div><strong>Status:</strong> {isExpired ? 'Expired (HTTP 410 Gone)' : 'Not Found (HTTP 404)'}</div>
            <div><strong>Enforcement:</strong> Server-side expiration rule active</div>
          </div>

          <a href="/" className="expired-action-btn" id="create-sandbox-btn">
            <Sparkles size={16} />
            <span>Create Your Own Sandbox</span>
          </a>
        </div>
      </div>
    );
  }

  const sandboxedHtml = buildSandboxedDocument(bundle.html, bundle.css, bundle.js);

  return (
    <div className="standalone-preview-page" id="standalone-preview-page">
      {/* Sandboxed iframe with strict sandbox attribute */}
      <iframe
        id="standalone-sandboxed-iframe"
        className="standalone-iframe"
        title={bundle.title}
        srcDoc={sandboxedHtml}
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
      />
    </div>
  );
};
