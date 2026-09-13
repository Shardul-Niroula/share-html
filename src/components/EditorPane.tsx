import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html as langHtml } from '@codemirror/lang-html';
import { css as langCss } from '@codemirror/lang-css';
import { javascript as langJs } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { ActiveTab, ViewMode } from '../types/types';
import { Copy, RotateCcw, Check, Sparkles, ChevronDown } from 'lucide-react';
import './EditorPane.css';

interface EditorPaneProps {
  html: string;
  css: string;
  js: string;
  activeTab: ActiveTab;
  viewMode: ViewMode;
  onTabChange: (tab: ActiveTab) => void;
  onHtmlChange: (val: string) => void;
  onCssChange: (val: string) => void;
  onJsChange: (val: string) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  html,
  css,
  js,
  activeTab,
  viewMode,
  onTabChange,
  onHtmlChange,
  onCssChange,
  onJsChange,
  onShowToast,
}) => {
  const [copiedTab, setCopiedTab] = React.useState<string | null>(null);
  const [isClearMenuOpen, setIsClearMenuOpen] = React.useState(false);
  const [isClearMenuPinned, setIsClearMenuPinned] = React.useState(false);
  const clearMenuRef = React.useRef<HTMLDivElement>(null);
  const clearMenuCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClearMenuCloseTimeout = () => {
    if (clearMenuCloseTimeoutRef.current) {
      clearTimeout(clearMenuCloseTimeoutRef.current);
      clearMenuCloseTimeoutRef.current = null;
    }
  };

  const closeClearMenu = () => {
    cancelClearMenuCloseTimeout();
    setIsClearMenuPinned(false);
    setIsClearMenuOpen(false);
  };

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(label);
    onShowToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedTab(null), 1800);
  };

  const handleClear = (tab: ActiveTab) => {
    if (tab === 'html') onHtmlChange('');
    if (tab === 'css') onCssChange('');
    if (tab === 'js') onJsChange('');
    onShowToast(`Cleared ${tab.toUpperCase()} editor`, 'info');
    closeClearMenu();
  };

  const handleClearAll = () => {
    onHtmlChange('');
    onCssChange('');
    onJsChange('');
    onShowToast('Cleared HTML, CSS and JS editors', 'info');
    closeClearMenu();
  };

  React.useEffect(() => {
    if (!isClearMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (clearMenuRef.current && !clearMenuRef.current.contains(e.target as Node)) {
        closeClearMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isClearMenuOpen]);

  React.useEffect(() => {
    return () => cancelClearMenuCloseTimeout();
  }, []);

  return (
    <div className="editor-pane-container" id="editor-pane-container">
      {viewMode === 'tabs' ? (
        <>
          <div className="editor-tabs-bar" id="editor-tabs-bar">
            <div className="editor-tabs-list">
              <button
                id="tab-btn-html"
                className={`editor-tab-btn ${activeTab === 'html' ? 'active' : ''}`}
                onClick={() => onTabChange('html')}
              >
                <span className="lang-dot lang-dot-html"></span>
                <span>index.html</span>
              </button>
              <button
                id="tab-btn-css"
                className={`editor-tab-btn ${activeTab === 'css' ? 'active' : ''}`}
                onClick={() => onTabChange('css')}
              >
                <span className="lang-dot lang-dot-css"></span>
                <span>styles.css</span>
              </button>
              <button
                id="tab-btn-js"
                className={`editor-tab-btn ${activeTab === 'js' ? 'active' : ''}`}
                onClick={() => onTabChange('js')}
              >
                <span className="lang-dot lang-dot-js"></span>
                <span>script.js</span>
              </button>
            </div>

            <div className="editor-tools-group">
              <button
                id="copy-active-tab-button"
                className="editor-tool-btn"
                title="Copy current editor content"
                onClick={() => {
                  const content = activeTab === 'html' ? html : activeTab === 'css' ? css : js;
                  handleCopy(content, activeTab.toUpperCase());
                }}
              >
                {copiedTab === activeTab.toUpperCase() ? <Check size={14} color="#3fb950" /> : <Copy size={14} />}
              </button>
              <div
                className="clear-dropdown-wrapper"
                ref={clearMenuRef}
                onMouseEnter={() => {
                  cancelClearMenuCloseTimeout();
                  setIsClearMenuOpen(true);
                }}
                onMouseLeave={() => {
                  if (isClearMenuPinned) return;
                  cancelClearMenuCloseTimeout();
                  clearMenuCloseTimeoutRef.current = setTimeout(() => {
                    setIsClearMenuOpen(false);
                  }, 200);
                }}
              >
                <button
                  id="clear-active-tab-button"
                  className="editor-tool-btn clear-trigger-btn"
                  title="Clear editor content"
                  onClick={() => {
                    cancelClearMenuCloseTimeout();
                    setIsClearMenuPinned((pinned) => {
                      const nextPinned = !pinned;
                      setIsClearMenuOpen(nextPinned);
                      return nextPinned;
                    });
                  }}
                >
                  <RotateCcw size={14} />
                  <ChevronDown size={11} className="clear-trigger-chevron" />
                </button>

                {isClearMenuOpen && (
                  <div className="clear-dropdown-menu" id="clear-dropdown-menu">
                    <button
                      className="clear-dropdown-item"
                      onClick={() => handleClear(activeTab)}
                    >
                      <span className={`lang-dot lang-dot-${activeTab}`}></span>
                      Clear current ({activeTab.toUpperCase()})
                    </button>
                    <button
                      className="clear-dropdown-item clear-dropdown-item-all"
                      onClick={handleClearAll}
                    >
                      Clear all (HTML, CSS, JS)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="editor-content-area" id="editor-content-area">
            {activeTab === 'html' && (
              <div className="editor-single-view" id="editor-wrapper-html">
                <CodeMirror
                  value={html}
                  height="100%"
                  theme={oneDark}
                  extensions={[langHtml()]}
                  onChange={onHtmlChange}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    autocompletion: true,
                    bracketMatching: true,
                    closeBrackets: true,
                  }}
                />
              </div>
            )}

            {activeTab === 'css' && (
              <div className="editor-single-view" id="editor-wrapper-css">
                <CodeMirror
                  value={css}
                  height="100%"
                  theme={oneDark}
                  extensions={[langCss()]}
                  onChange={onCssChange}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    autocompletion: true,
                    bracketMatching: true,
                    closeBrackets: true,
                  }}
                />
              </div>
            )}

            {activeTab === 'js' && (
              <div className="editor-single-view" id="editor-wrapper-js">
                <CodeMirror
                  value={js}
                  height="100%"
                  theme={oneDark}
                  extensions={[langJs()]}
                  onChange={onJsChange}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    foldGutter: true,
                    autocompletion: true,
                    bracketMatching: true,
                    closeBrackets: true,
                  }}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="editor-split-view" id="editor-split-view">
          {/* HTML Section */}
          <div className="split-section" id="split-section-html">
            <div className="split-section-header">
              <div className="split-section-title">
                <span className="lang-dot lang-dot-html"></span>
                <span>HTML</span>
              </div>
              <div className="editor-tools-group">
                <button
                  className="editor-tool-btn"
                  title="Copy HTML"
                  onClick={() => handleCopy(html, 'HTML')}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="split-editor-body">
              <CodeMirror
                value={html}
                height="100%"
                theme={oneDark}
                extensions={[langHtml()]}
                onChange={onHtmlChange}
                basicSetup={{ lineNumbers: true, foldGutter: true }}
              />
            </div>
          </div>

          {/* CSS Section */}
          <div className="split-section" id="split-section-css">
            <div className="split-section-header">
              <div className="split-section-title">
                <span className="lang-dot lang-dot-css"></span>
                <span>CSS</span>
              </div>
              <div className="editor-tools-group">
                <button
                  className="editor-tool-btn"
                  title="Copy CSS"
                  onClick={() => handleCopy(css, 'CSS')}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="split-editor-body">
              <CodeMirror
                value={css}
                height="100%"
                theme={oneDark}
                extensions={[langCss()]}
                onChange={onCssChange}
                basicSetup={{ lineNumbers: true, foldGutter: true }}
              />
            </div>
          </div>

          {/* JS Section */}
          <div className="split-section" id="split-section-js">
            <div className="split-section-header">
              <div className="split-section-title">
                <span className="lang-dot lang-dot-js"></span>
                <span>JavaScript</span>
              </div>
              <div className="editor-tools-group">
                <button
                  className="editor-tool-btn"
                  title="Copy JS"
                  onClick={() => handleCopy(js, 'JS')}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="split-editor-body">
              <CodeMirror
                value={js}
                height="100%"
                theme={oneDark}
                extensions={[langJs()]}
                onChange={onJsChange}
                basicSetup={{ lineNumbers: true, foldGutter: true }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
