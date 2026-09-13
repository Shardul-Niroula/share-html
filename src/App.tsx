import React, { useState, useEffect } from 'react';
import { EditorPage } from './pages/EditorPage';
import { StandalonePreviewPage } from './pages/StandalonePreviewPage';
import './App.css';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Check if current URL is a standalone preview link: /preview/:id
  const previewMatch = currentPath.match(/^\/preview\/([^/]+)/);

  if (previewMatch && previewMatch[1]) {
    const previewId = previewMatch[1];
    return (
      <div className="app-root-container" id="app-root">
        <StandalonePreviewPage previewId={previewId} />
      </div>
    );
  }

  return (
    <div className="app-root-container" id="app-root">
      <EditorPage />
    </div>
  );
}
