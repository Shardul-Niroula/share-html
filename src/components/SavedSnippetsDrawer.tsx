import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Clock, 
  Copy, 
  Check, 
  Share2, 
  Code2,
  AlertCircle
} from 'lucide-react';
import { CodeProject, PreviewBundle } from '../types/types';
import './SavedSnippetsDrawer.css';

interface SavedSnippetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: CodeProject[];
  currentProjectId: string;
  onLoadProject: (project: CodeProject) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  myPreviews: PreviewBundle[];
  onRevokePreview: (id: string) => Promise<boolean>;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SavedSnippetsDrawer: React.FC<SavedSnippetsDrawerProps> = ({
  isOpen,
  onClose,
  savedProjects,
  currentProjectId,
  onLoadProject,
  onNewProject,
  onDeleteProject,
  myPreviews,
  onRevokePreview,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'previews'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyPreviewLink = (id: string) => {
    const url = `${window.location.origin}/preview/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onShowToast('Preview link copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    const success = await onRevokePreview(id);
    if (success) {
      onShowToast('Preview link revoked successfully', 'info');
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose} id="snippets-drawer-overlay">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()} id="snippets-drawer-panel">
        <div className="drawer-header">
          <div className="drawer-title-group">
            <FolderOpen size={18} />
            <span>Workspace Library</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="close-drawer-btn">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-nav-tabs">
          <button
            id="drawer-tab-projects"
            className={`drawer-nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Saved Projects ({savedProjects.length})
          </button>
          <button
            id="drawer-tab-previews"
            className={`drawer-nav-tab ${activeTab === 'previews' ? 'active' : ''}`}
            onClick={() => setActiveTab('previews')}
          >
            Preview Links ({myPreviews.length})
          </button>
        </div>

        <div className="drawer-content">
          {activeTab === 'projects' ? (
            <>
              <button
                id="create-new-project-btn"
                className="new-project-btn"
                onClick={() => {
                  onNewProject();
                  onClose();
                  onShowToast('Created new project workspace', 'info');
                }}
              >
                <Plus size={16} />
                <span>Create New Project</span>
              </button>

              {savedProjects.length === 0 ? (
                <div className="empty-drawer-state">
                  <Code2 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <p>No saved projects yet.</p>
                  <p>Click "Save" on the top header to preserve your work to your account library.</p>
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div key={proj.id} className="project-item-card" id={`project-card-${proj.id}`}>
                    <div className="project-card-header">
                      <span className="project-card-title">{proj.title}</span>
                      {proj.id === currentProjectId && (
                        <span className="save-status-badge saved" style={{ fontSize: '10px' }}>Active</span>
                      )}
                    </div>
                    <span className="project-card-meta">
                      Updated {new Date(proj.updatedAt).toLocaleDateString()} at {new Date(proj.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="project-card-actions">
                      <button
                        className="card-action-btn delete"
                        onClick={() => {
                          onDeleteProject(proj.id);
                          onShowToast('Project removed', 'info');
                        }}
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                      <button
                        className="card-action-btn"
                        onClick={() => {
                          onLoadProject(proj);
                          onClose();
                          onShowToast(`Loaded "${proj.title}"`, 'success');
                        }}
                      >
                        <span>Open Project</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {myPreviews.length === 0 ? (
                <div className="empty-drawer-state">
                  <Share2 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <p>No generated preview links yet.</p>
                  <p>Click "Generate Preview" in the header to create secure, time-limited shareable URLs.</p>
                </div>
              ) : (
                myPreviews.map((bundle) => {
                  const isExpired = bundle.expiresAt ? Date.now() > bundle.expiresAt : false;
                  return (
                    <div key={bundle.id} className="preview-item-card" id={`preview-card-${bundle.id}`}>
                      <div className="project-card-header">
                        <span className="project-card-title">{bundle.title}</span>
                        <span className={`preview-badge-status ${isExpired ? 'expired' : 'active'}`}>
                          {isExpired ? 'Expired' : bundle.isPermanent ? 'Permanent' : 'Active'}
                        </span>
                      </div>
                      <div className="project-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>
                          {bundle.isPermanent
                            ? 'Permanent (no expiry)'
                            : bundle.expiresAt
                            ? `Expires ${new Date(bundle.expiresAt).toLocaleDateString()}`
                            : 'Active'}
                        </span>
                      </div>
                      <div className="preview-analytics-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} />
                          <span>Views: <b>{bundle.viewCount || 0}</b></span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="card-action-btn"
                            onClick={() => handleCopyPreviewLink(bundle.id)}
                            title="Copy link"
                          >
                            {copiedId === bundle.id ? <Check size={12} color="#3fb950" /> : <Copy size={12} />}
                            <span>{copiedId === bundle.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <a
                            href={`/preview/${bundle.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-action-btn"
                            title="View preview"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            className="card-action-btn delete"
                            onClick={() => handleRevoke(bundle.id)}
                            title="Revoke / delete link"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
