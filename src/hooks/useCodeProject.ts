import { useState, useEffect, useCallback } from 'react';
import { CodeProject, ActiveTab, ViewMode } from '../types/types';
import { StorageService } from '../services/storage';
import { STARTER_TEMPLATES, StarterTemplate } from '../services/templates';

const DEFAULT_PROJECT: CodeProject = {
  id: 'proj_default',
  title: 'My Sandboxed Project',
  html: STARTER_TEMPLATES[0].html,
  css: STARTER_TEMPLATES[0].css,
  js: STARTER_TEMPLATES[0].js,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export function useCodeProject(userId?: string) {
  const [project, setProject] = useState<CodeProject>(() => {
    const saved = StorageService.getCurrentProject();
    return saved || DEFAULT_PROJECT;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('html');
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [savedProjects, setSavedProjects] = useState<CodeProject[]>(() => StorageService.getSavedProjects());

  // Save current drafting work locally
  useEffect(() => {
    StorageService.saveCurrentProject(project);
  }, [project]);

  const updateHtml = useCallback((html: string) => {
    setProject(prev => ({ ...prev, html, updatedAt: Date.now() }));
    setIsSaved(false);
  }, []);

  const updateCss = useCallback((css: string) => {
    setProject(prev => ({ ...prev, css, updatedAt: Date.now() }));
    setIsSaved(false);
  }, []);

  const updateJs = useCallback((js: string) => {
    setProject(prev => ({ ...prev, js, updatedAt: Date.now() }));
    setIsSaved(false);
  }, []);

  const updateTitle = useCallback((title: string) => {
    setProject(prev => ({ ...prev, title: title.trim() || 'Untitled Project', updatedAt: Date.now() }));
    setIsSaved(false);
  }, []);

  const saveProject = useCallback(() => {
    const updatedProject = {
      ...project,
      userId: userId || project.userId,
      updatedAt: Date.now(),
    };
    const updatedList = StorageService.saveProjectToList(updatedProject);
    setSavedProjects(updatedList);
    setProject(updatedProject);
    setIsSaved(true);
    return updatedProject;
  }, [project, userId]);

  const loadProject = useCallback((targetProject: CodeProject) => {
    setProject(targetProject);
    setIsSaved(true);
  }, []);

  const loadTemplate = useCallback((template: StarterTemplate) => {
    const newProj: CodeProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      title: template.name,
      html: template.html,
      css: template.css,
      js: template.js,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId,
    };
    setProject(newProj);
    setIsSaved(false);
  }, [userId]);

  const createNewProject = useCallback(() => {
    const newProj: CodeProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      title: 'New Code Project',
      html: '<!-- Write your HTML structure here -->\n<div class="container">\n  <h1>Hello Sandbox!</h1>\n  <p>Start editing to see changes instantly.</p>\n  <button id="action-btn">Click Me</button>\n</div>',
      css: '/* Write your CSS rules here */\nbody {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #0f172a;\n  color: #f8fafc;\n}\n\n.container {\n  text-align: center;\n  padding: 32px;\n  background: #1e293b;\n  border-radius: 12px;\n  box-shadow: 0 10px 25px rgba(0,0,0,0.3);\n}\n\nbutton {\n  background: #38bdf8;\n  color: #0f172a;\n  border: none;\n  padding: 10px 20px;\n  border-radius: 6px;\n  font-weight: 600;\n  cursor: pointer;\n  margin-top: 16px;\n}',
      js: '// Write your JavaScript here\nconst btn = document.getElementById("action-btn");\nbtn.addEventListener("click", () => {\n  console.log("Button clicked!");\n  alert("Welcome to the Code Sandbox!");\n});',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId,
    };
    setProject(newProj);
    setIsSaved(false);
  }, [userId]);

  const deleteProject = useCallback((id: string) => {
    const updated = StorageService.deleteSavedProject(id);
    setSavedProjects(updated);
  }, []);

  return {
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
  };
}
