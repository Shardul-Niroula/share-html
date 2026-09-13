import React, { useState, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { EditorPane } from '../components/EditorPane';
import { PreviewPane } from '../components/PreviewPane';
import { ShareModal } from '../components/ShareModal';
import { SavedSnippetsDrawer } from '../components/SavedSnippetsDrawer';
import { AuthModal } from '../components/AuthModal';
import { SecurityNoticeModal } from '../components/SecurityNoticeModal';
import { TemplatesModal } from '../components/TemplatesModal';
import { Toast, ToastMessage } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { useCodeProject } from '../hooks/useCodeProject';
import { usePreviewBundle } from '../hooks/usePreviewBundle';
import { ExpiryRule } from '../types/types';
import './EditorPage.css';

export const EditorPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const {
    project,
    activeTab,
    viewMode,
    isSaved,
    savedProjects,
    setActiveTab,
    setViewMode,
    updateHtml,
    updateCss,
    updateJs,
    updateTitle,
    saveProject,
    loadProject,
    loadTemplate,
    createNewProject,
    deleteProject,
  } = useCodeProject(user?.id);

  const {
    isGenerating,
    activeBundle,
    generatedUrl,
    myPreviews,
    generatePreview,
    revokePreview,
  } = usePreviewBundle();

  // Modals state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [snippetsDrawerOpen, setSnippetsDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Split resize state
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(50);
  const isDraggingRef = useRef<boolean>(false);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleSave = () => {
    if (!user) {
      setAuthModalOpen(true);
      showToast('Please log in or continue as guest to save snippets', 'info');
      return;
    }
    saveProject();
    showToast(`Project "${project.title}" saved to your library!`, 'success');
  };

  const handleOpenShare = () => {
    if (!user) {
      setAuthModalOpen(true);
      showToast('Login is required to generate preview links', 'info');
      return;
    }
    if (!isSaved) {
      saveProject();
      showToast('Project automatically saved before generating preview', 'info');
    }
    setShareModalOpen(true);
  };

  const handleGeneratePreview = async (rule: ExpiryRule, customHours?: number) => {
    let customExpiryTimestamp: number | undefined;
    if (rule === 'custom' && customHours) {
      customExpiryTimestamp = Date.now() + customHours * 60 * 60 * 1000;
    }

    return await generatePreview({
      title: project.title,
      html: project.html,
      css: project.css,
      js: project.js,
      expiryRule: rule,
      customExpiryTimestamp,
      authorId: user?.id,
      authorName: user?.name,
    });
  };

  // Resize drag handlers
  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const windowWidth = window.innerWidth;
    const newPercent = (e.clientX / windowWidth) * 100;
    if (newPercent >= 20 && newPercent <= 80) {
      setEditorWidthPercent(newPercent);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="editor-page-container" id="editor-page-root">
      <Header
        title={project.title}
        onTitleChange={updateTitle}
        isSaved={isSaved}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        user={user}
        onSave={handleSave}
        onOpenShareModal={handleOpenShare}
        onOpenSnippetsDrawer={() => setSnippetsDrawerOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenTemplatesModal={() => setTemplatesModalOpen(true)}
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
      />

      <main className="editor-main-workspace" id="editor-main-workspace">
        <div
          className="workspace-pane-editor"
          style={{ 
            width: `${editorWidthPercent}%`,
            display: editorWidthPercent === 0 ? 'none' : 'block'
          }}
          id="workspace-pane-editor"
        >
          <EditorPane
            html={project.html}
            css={project.css}
            js={project.js}
            activeTab={activeTab}
            viewMode={viewMode}
            onTabChange={setActiveTab}
            onHtmlChange={updateHtml}
            onCssChange={updateCss}
            onJsChange={updateJs}
            onShowToast={showToast}
          />
        </div>

        {editorWidthPercent > 0 && editorWidthPercent < 100 && (
          <div
            className="workspace-resizer"
            onMouseDown={handleMouseDown}
            id="workspace-divider-resizer"
            title="Drag to resize editor and preview"
          />
        )}

        <div 
          className="workspace-pane-preview" 
          id="workspace-pane-preview"
          style={{ 
            display: editorWidthPercent === 100 ? 'none' : 'block',
            width: `${100 - editorWidthPercent}%`
          }}
        >
          <PreviewPane
            html={project.html}
            css={project.css}
            js={project.js}
            isMaximized={editorWidthPercent === 0}
            onToggleMaximize={() => {
              setEditorWidthPercent(prev => prev === 0 ? 50 : 0);
            }}
          />
        </div>
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={project.title}
        html={project.html}
        css={project.css}
        js={project.js}
        user={user}
        isSaved={isSaved}
        onGenerate={handleGeneratePreview}
        isGenerating={isGenerating}
        activeBundle={activeBundle}
        generatedUrl={generatedUrl}
        onShowToast={showToast}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Saved Snippets Drawer */}
      <SavedSnippetsDrawer
        isOpen={snippetsDrawerOpen}
        onClose={() => setSnippetsDrawerOpen(false)}
        savedProjects={savedProjects}
        currentProjectId={project.id}
        onLoadProject={loadProject}
        onNewProject={createNewProject}
        onDeleteProject={deleteProject}
        myPreviews={myPreviews}
        onRevokePreview={revokePreview}
        onShowToast={showToast}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        onLogin={login}
        onLogout={logout}
        onShowToast={showToast}
      />

      {/* Security & Sandboxing Info Modal */}
      <SecurityNoticeModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />

      {/* Starter Templates Modal */}
      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={loadTemplate}
        onShowToast={showToast}
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} />
    </div>
  );
};
