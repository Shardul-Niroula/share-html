import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Maximize2, 
  Minimize2,
  Terminal, 
  Trash2, 
  ExternalLink,
  ZoomIn,
  Expand
} from 'lucide-react';
import { PreviewScreenSize, ConsoleMessage } from '../types/types';
import { buildSandboxedDocument } from '../services/sanitizer';
import './PreviewPane.css';

interface PreviewPaneProps {
  html: string;
  css: string;
  js: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ 
  html, 
  css, 
  js,
  isMaximized = false,
  onToggleMaximize
}) => {
  const [screenSize, setScreenSize] = useState<PreviewScreenSize>('responsive');
  const [scaleMode, setScaleMode] = useState<'100' | '75' | '50' | 'fit'>('100');
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Listen to postMessages sent from sandboxed document
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_MESSAGE') {
        const payload = event.data.payload;
        setLogs(prev => [
          ...prev.slice(-49), // Keep last 50 logs
          {
            id: Math.random().toString(),
            type: payload.type,
            text: payload.text,
            timestamp: payload.timestamp,
          }
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update iframe document srcdoc when code changes or manual refresh triggered
  const sandboxedDoc = React.useMemo(() => {
    return buildSandboxedDocument(html, css, js);
  }, [html, css, js, refreshKey]);

  const handleManualRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const handleClearConsole = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogs([]);
  };

  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([sandboxedDoc], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(sandboxedDoc);
        newWindow.document.close();
      }
    }
  };

  // Determine scaling multiplier
  let zoomFactor = 1;
  if (scaleMode === '75') zoomFactor = 0.75;
  if (scaleMode === '50') zoomFactor = 0.5;

  return (
    <div className="preview-pane-container" id="preview-pane-container">
      {/* Top Toolbar */}
      <div className="preview-toolbar" id="preview-toolbar">
        <div className="preview-toolbar-left">
          <div className="preview-status-indicator" title="Live Sandboxed Execution Active">
            <span className="status-pulse-dot"></span>
            <span>Live Sandbox</span>
          </div>

          <div className="device-selectors-group" id="screen-size-selector">
            <button
              id="device-responsive-btn"
              className={`device-btn ${screenSize === 'responsive' ? 'active' : ''}`}
              onClick={() => { setScreenSize('responsive'); setScaleMode('100'); }}
              title="Full Responsive (Edge to Edge 100%)"
            >
              <Maximize2 size={13} />
              <span className="device-btn-label">Full</span>
            </button>
            <button
              id="device-desktop-btn"
              className={`device-btn ${screenSize === 'desktop' ? 'active' : ''}`}
              onClick={() => setScreenSize('desktop')}
              title="Desktop View (1280px container)"
            >
              <Monitor size={13} />
              <span className="device-btn-label">Desktop</span>
            </button>
            <button
              id="device-tablet-btn"
              className={`device-btn ${screenSize === 'tablet' ? 'active' : ''}`}
              onClick={() => setScreenSize('tablet')}
              title="Tablet View (768px)"
            >
              <Tablet size={13} />
              <span className="device-btn-label">Tablet</span>
            </button>
            <button
              id="device-mobile-btn"
              className={`device-btn ${screenSize === 'mobile' ? 'active' : ''}`}
              onClick={() => setScreenSize('mobile')}
              title="Mobile View (375px)"
            >
              <Smartphone size={13} />
              <span className="device-btn-label">Mobile</span>
            </button>
          </div>

          {screenSize !== 'responsive' && (
            <div className="zoom-selectors-group" id="zoom-scale-selector">
              <span className="zoom-label"><ZoomIn size={11} /> Scale:</span>
              <button
                className={`zoom-btn ${scaleMode === '100' ? 'active' : ''}`}
                onClick={() => setScaleMode('100')}
              >
                100%
              </button>
              <button
                className={`zoom-btn ${scaleMode === '75' ? 'active' : ''}`}
                onClick={() => setScaleMode('75')}
              >
                75%
              </button>
              <button
                className={`zoom-btn ${scaleMode === '50' ? 'active' : ''}`}
                onClick={() => setScaleMode('50')}
              >
                50%
              </button>
            </div>
          )}
        </div>

        <div className="preview-toolbar-right">
          {onToggleMaximize && (
            <button
              id="toggle-maximize-preview-btn"
              className={`preview-tool-btn ${isMaximized ? 'active-toggle' : ''}`}
              onClick={onToggleMaximize}
              title={isMaximized ? "Restore Split View" : "Maximize Preview Full Screen"}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Expand size={13} />}
              <span>{isMaximized ? 'Split' : 'Maximize'}</span>
            </button>
          )}

          <button
            id="popout-preview-btn"
            className="preview-tool-btn"
            onClick={handleOpenInNewTab}
            title="Open Live Preview in New Window Tab"
          >
            <ExternalLink size={13} />
            <span>New Tab</span>
          </button>

          <button
            id="toggle-console-btn"
            className={`preview-tool-btn ${consoleOpen ? 'active-toggle' : ''}`}
            onClick={() => setConsoleOpen(!consoleOpen)}
            title="Toggle Console Log Output"
          >
            <Terminal size={13} />
            <span>Console</span>
            {logs.length > 0 && <span className="console-badge">{logs.length}</span>}
          </button>

          <button
            id="manual-refresh-btn"
            className="preview-tool-btn"
            onClick={handleManualRefresh}
            title="Reload Sandbox Frame"
          >
            <RotateCw size={13} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Stage Wrapper */}
      <div 
        className={`preview-stage-wrapper ${screenSize === 'responsive' ? 'stage-responsive' : 'stage-framed'}`} 
        id="preview-stage-wrapper"
        ref={stageRef}
      >
        <div 
          className={`preview-viewport-frame ${screenSize}`} 
          id="preview-viewport-frame"
          style={
            scaleMode !== '100' && screenSize !== 'responsive'
              ? {
                  transform: `scale(${zoomFactor})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc((1 - ${zoomFactor}) * -100%)`
                }
              : undefined
          }
        >
          <iframe
            id="sandboxed-preview-frame"
            ref={iframeRef}
            className="sandboxed-iframe"
            title="User Code Sandbox Output"
            srcDoc={sandboxedDoc}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* Console Drawer */}
      {consoleOpen && (
        <div className="preview-console-drawer" style={{ height: '140px' }} id="preview-console-drawer">
          <div className="console-header">
            <div className="console-title-group">
              <Terminal size={13} />
              <span>Console & Diagnostics</span>
            </div>
            <button
              id="clear-console-logs-btn"
              className="preview-tool-btn"
              onClick={handleClearConsole}
              title="Clear logs"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div className="console-logs-list" id="console-logs-list">
            {logs.length === 0 ? (
              <div className="console-empty-state">No console logs or errors recorded.</div>
            ) : (
              logs.map((item) => (
                <div key={item.id} className={`console-entry ${item.type}`}>
                  <span className="console-entry-timestamp">{item.timestamp}</span>
                  <span className="console-entry-text">{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
