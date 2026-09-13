import React from 'react';
import { 
  Code2, 
  Share2, 
  Save, 
  FolderOpen, 
  LayoutGrid, 
  Columns, 
  Sparkles, 
  ShieldCheck, 
  UserCircle2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ViewMode, UserAccount } from '../types/types';
import './Header.css';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isSaved: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  user: UserAccount | null;
  onSave: () => void;
  onOpenShareModal: () => void;
  onOpenSnippetsDrawer: () => void;
  onOpenAuthModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenSecurityModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  isSaved,
  viewMode,
  onViewModeChange,
  user,
  onSave,
  onOpenShareModal,
  onOpenSnippetsDrawer,
  onOpenAuthModal,
  onOpenTemplatesModal,
  onOpenSecurityModal,
}) => {
  return (
    <header className="header-container" id="app-header">
      <div className="header-left-section">
        <div className="brand-logo" id="brand-logo">
          <div className="brand-icon-wrapper">
            <Code2 size={18} />
          </div>
          <span>CodeSnippet</span>
        </div>

        <div className="project-title-container">
          <input
            id="project-title-input"
            className="project-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Project..."
            title="Click to rename project"
          />
          <div className={`save-status-badge ${isSaved ? 'saved' : 'unsaved'}`} id="save-status-badge">
            {isSaved ? (
              <>
                <CheckCircle2 size={12} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                <span>Unsaved</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-center-section">
        <div className="view-mode-toggle" id="view-mode-selector">
          <button
            id="tab-view-button"
            className={`view-mode-btn ${viewMode === 'tabs' ? 'active' : ''}`}
            onClick={() => onViewModeChange('tabs')}
            title="Tabbed Editor View"
          >
            <Columns size={14} />
            <span>Tabbed</span>
          </button>
          <button
            id="split-view-button"
            className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
            title="Split Multi-Pane View"
          >
            <LayoutGrid size={14} />
            <span>3-Way Split</span>
          </button>
        </div>

        <button
          id="templates-button"
          className="action-btn action-btn-secondary"
          onClick={onOpenTemplatesModal}
          title="Browse starter templates"
        >
          <Sparkles size={14} />
          <span>Templates</span>
        </button>

        <button
          id="security-info-button"
          className="action-btn action-btn-secondary"
          onClick={onOpenSecurityModal}
          title="Sandbox Security & Expiry info"
        >
          <ShieldCheck size={14} />
          <span>Sandbox Shield</span>
        </button>
      </div>

      <div className="header-right-section">
        <button
          id="snippets-drawer-button"
          className="action-btn action-btn-secondary"
          onClick={onOpenSnippetsDrawer}
          title="View saved snippets & preview links"
        >
          <FolderOpen size={14} />
          <span>My Projects</span>
        </button>

        <button
          id="save-project-button"
          className="action-btn action-btn-save"
          onClick={onSave}
          title={user ? "Save project to your account" : "Log in to save project"}
        >
          <Save size={14} />
          <span>{user ? "Save" : "Save (Login Req.)"}</span>
        </button>

        <button
          id="generate-preview-button"
          className="action-btn action-btn-share"
          onClick={onOpenShareModal}
          title={!user ? "Login required to generate preview link" : !isSaved ? "Please save project before sharing" : "Generate secure preview URL"}
        >
          <Share2 size={14} />
          <span>Generate Preview</span>
        </button>

        {user ? (
          <button
            id="user-profile-button"
            className="user-profile-button"
            onClick={onOpenAuthModal}
            title={`Logged in as ${user.name} (${user.email})`}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="user-avatar-circle" />
            ) : (
              <div className="user-avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
            )}
            <span>{user.name}</span>
          </button>
        ) : (
          <button
            id="login-modal-button"
            className="action-btn action-btn-secondary"
            onClick={onOpenAuthModal}
          >
            <UserCircle2 size={15} />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
