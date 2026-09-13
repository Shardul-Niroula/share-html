import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Clock, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Lock, 
  Infinity, 
  Loader2,
  Calendar
} from 'lucide-react';
import { ExpiryRule, PreviewBundle, UserAccount } from '../types/types';
import { validateCodeSecurity } from '../services/sanitizer';
import './ShareModal.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  html: string;
  css: string;
  js: string;
  user: UserAccount | null;
  isSaved: boolean;
  onGenerate: (rule: ExpiryRule, customHours?: number) => Promise<any>;
  isGenerating: boolean;
  activeBundle: PreviewBundle | null;
  generatedUrl: string | null;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onOpenAuth: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  html,
  css,
  js,
  user,
  isSaved,
  onGenerate,
  isGenerating,
  activeBundle,
  generatedUrl,
  onShowToast,
  onOpenAuth,
}) => {
  const [selectedRule, setSelectedRule] = useState<ExpiryRule>('3_days');
  const [customHours, setCustomHours] = useState<number>(12);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const securityReport = validateCodeSecurity(html, js);

  const handleCopy = () => {
    if (generatedUrl) {
      const fullUrl = window.location.origin + generatedUrl;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      onShowToast('Shareable preview URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateClick = async () => {
    try {
      await onGenerate(selectedRule, selectedRule === 'custom' ? customHours : undefined);
      onShowToast('Secure preview link generated successfully!', 'success');
    } catch (e: any) {
      onShowToast(e.message || 'Generation failed', 'error');
    }
  };

  const fullPreviewUrl = generatedUrl ? `${window.location.origin}${generatedUrl}` : '';

  return (
    <div className="modal-overlay" onClick={onClose} id="share-modal-overlay">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} id="share-modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              <Share2 size={18} />
            </div>
            <div className="modal-title-text">Generate Secure Preview Link</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="close-share-modal-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* User & Save Requirement Check */}
          {!user ? (
            <div className="warning-callout-box" id="auth-required-warning">
              <Lock size={16} />
              <div>
                <strong>Authentication Required:</strong> You must be signed in to generate public preview links.
                <div style={{ marginTop: '8px' }}>
                  <button
                    className="modal-btn-generate"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                  >
                    Sign In to Continue
                  </button>
                </div>
              </div>
            </div>
          ) : !isSaved ? (
            <div className="warning-callout-box" id="save-required-warning">
              <AlertTriangle size={16} />
              <div>
                <strong>Unsaved Code Warning:</strong> Please save your project to your account before generating a shareable link.
              </div>
            </div>
          ) : null}

          {/* Expiry Rule Selector */}
          <div>
            <label className="form-group-label">Select Expiry Rule</label>
            <div className="expiry-options-grid" id="expiry-rules-grid">
              <div
                id="expiry-rule-1day"
                className={`expiry-radio-card ${selectedRule === '1_day' ? 'selected' : ''}`}
                onClick={() => setSelectedRule('1_day')}
              >
                <Clock size={18} color="#38bdf8" />
                <div className="expiry-radio-info">
                  <span className="expiry-radio-title">1 Day</span>
                  <span className="expiry-radio-desc">Expires after 24 hours</span>
                </div>
              </div>

              <div
                id="expiry-rule-3days"
                className={`expiry-radio-card ${selectedRule === '3_days' ? 'selected' : ''}`}
                onClick={() => setSelectedRule('3_days')}
              >
                <Clock size={18} color="#38bdf8" />
                <div className="expiry-radio-info">
                  <span className="expiry-radio-title">3 Days (Default)</span>
                  <span className="expiry-radio-desc">Expires after 72 hours</span>
                </div>
              </div>

              <div
                id="expiry-rule-1month"
                className={`expiry-radio-card ${selectedRule === '1_month' ? 'selected' : ''}`}
                onClick={() => setSelectedRule('1_month')}
              >
                <Calendar size={18} color="#a855f7" />
                <div className="expiry-radio-info">
                  <span className="expiry-radio-title">1 Month</span>
                  <span className="expiry-radio-desc">Expires after 30 days</span>
                </div>
              </div>

              <div
                id="expiry-rule-permanent"
                className={`expiry-radio-card ${selectedRule === 'permanent' ? 'selected' : ''}`}
                onClick={() => setSelectedRule('permanent')}
              >
                <Infinity size={18} color="#22c55e" />
                <div className="expiry-radio-info">
                  <span className="expiry-radio-title">Permanent</span>
                  <span className="expiry-radio-desc">Never auto-expires</span>
                </div>
              </div>
            </div>

            {selectedRule === 'custom' && (
              <div className="custom-expiry-input-container">
                <label className="form-group-label" style={{ marginTop: '8px' }}>Custom Expiration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  className="custom-hours-input"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}
          </div>

          {/* Security & Sandboxing Verification */}
          <div className="security-summary-badge" id="security-verification-badge">
            <ShieldCheck size={18} className="security-badge-icon" />
            <div className="security-badge-content">
              <strong>Sandboxed Sandbox Execution:</strong> Recipient preview URL will strictly render the iframe output in an isolated origin. No source code or editor tools are exposed to viewers.
              {securityReport.warnings.length > 0 && (
                <div style={{ marginTop: '4px', color: 'var(--warning-accent)' }}>
                  Note: {securityReport.warnings[0]}
                </div>
              )}
            </div>
          </div>

          {/* Generated Result Display */}
          {generatedUrl && activeBundle && (
            <div className="share-result-container" id="generated-result-container">
              <div className="result-header-line">
                <span className="result-success-tag">
                  <Check size={16} />
                  <span>Preview Ready to Share</span>
                </span>
                <span className="expiry-countdown-pill">
                  {activeBundle.isPermanent 
                    ? 'Permanent Link' 
                    : activeBundle.expiresAt 
                    ? `Expires: ${new Date(activeBundle.expiresAt).toLocaleDateString()}` 
                    : 'Time-limited'}
                </span>
              </div>

              <div className="url-copy-input-row">
                <input
                  type="text"
                  readOnly
                  className="generated-url-input"
                  value={fullPreviewUrl}
                />
                <button
                  id="copy-generated-url-btn"
                  className="url-action-btn btn-copy"
                  onClick={handleCopy}
                  title="Copy link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  id="open-generated-preview-link"
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="url-action-btn btn-open-preview"
                  title="Open preview in new tab"
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose} id="cancel-share-modal-btn">
            Close
          </button>
          <button
            id="submit-generate-link-btn"
            className="modal-btn-generate"
            disabled={!user || !isSaved || isGenerating}
            onClick={handleGenerateClick}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="spin-animate" />
                <span>Generating Bundle...</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>{generatedUrl ? 'Regenerate Link' : 'Generate Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
