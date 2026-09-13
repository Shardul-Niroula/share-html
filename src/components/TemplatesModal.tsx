import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { STARTER_TEMPLATES, StarterTemplate } from '../services/templates';
import './TemplatesModal.css';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StarterTemplate) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onShowToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} id="templates-modal-overlay">
      <div className="modal-dialog templates-dialog" onClick={(e) => e.stopPropagation()} id="templates-modal-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title-icon">
              <Sparkles size={18} />
            </div>
            <div className="modal-title-text">Starter Code Templates</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="close-templates-modal-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Choose a starting template to kickstart your web project with interactive components and real-time graphics.
          </p>

          <div className="templates-grid">
            {STARTER_TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className="template-card" id={`template-card-${tmpl.id}`}>
                <div className="template-info">
                  <div className="template-header-line">
                    <span className="template-name">{tmpl.name}</span>
                    <span className="template-category-tag">{tmpl.category}</span>
                  </div>
                  <span className="template-desc">{tmpl.description}</span>
                </div>
                <button
                  id={`load-template-btn-${tmpl.id}`}
                  className="template-load-btn"
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onShowToast(`Loaded "${tmpl.name}" template`, 'success');
                    onClose();
                  }}
                >
                  <span>Load</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
