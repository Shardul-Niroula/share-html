import React from 'react';
import { X, ShieldCheck, Lock, Clock, AlertTriangle, Cpu, Globe } from 'lucide-react';
import './SecurityNoticeModal.css';

interface SecurityNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityNoticeModal: React.FC<SecurityNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} id="security-modal-overlay">
      <div className="modal-dialog security-dialog" onClick={(e) => e.stopPropagation()} id="security-modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="modal-title-text">Sandbox & Preview Security Architecture</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="close-security-modal-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="security-points-list">
            <div className="security-point-card">
              <Lock size={20} className="security-point-icon" />
              <div className="security-point-content">
                <h4>Isolated Iframe Sandboxing</h4>
                <p>
                  User code is rendered in an <code>&lt;iframe sandbox="allow-scripts allow-modals allow-forms"&gt;</code> without <code>allow-same-origin</code>. This prevents scripts from accessing host cookies, local storage, parent window DOM, or auth credentials.
                </p>
              </div>
            </div>

            <div className="security-point-card">
              <Globe size={20} className="security-point-icon" />
              <div className="security-point-content">
                <h4>Standalone Recipient View</h4>
                <p>
                  Shared links at <code>/preview/:id</code> serve only the compiled sandbox output to recipients. Source code and editor controls are strictly withheld to preserve snippet privacy.
                </p>
              </div>
            </div>

            <div className="security-point-card">
              <Clock size={20} className="security-point-icon" />
              <div className="security-point-content">
                <h4>Strict Server-Enforced Expiry</h4>
                <p>
                  Preview bundles are checked on every request by the backend API. Once a link expires (1 day, 3 days, 1 month, or custom), the server immediately returns a <code>410 Gone</code> status and renders the "Preview Expired" notice.
                </p>
              </div>
            </div>

            <div className="security-point-card">
              <Cpu size={20} className="security-point-icon" />
              <div className="security-point-content">
                <h4>Rate Limiting & Abuse Prevention</h4>
                <p>
                  API endpoints enforce request rate limiting (maximum 30 bundle generations per IP per 15-minute window) to protect against automated spam and resource exhaustion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-generate" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
