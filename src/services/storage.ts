import { CodeProject, UserAccount, PreviewBundle } from '../types/types';

const STORAGE_KEYS = {
  CURRENT_PROJECT: 'codesandbox_current_project',
  SAVED_PROJECTS: 'codesandbox_saved_projects',
  AUTH_USER: 'codesandbox_user',
  GENERATED_PREVIEWS: 'codesandbox_my_previews',
};

export const StorageService = {
  getCurrentProject(): CodeProject | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCurrentProject(project: CodeProject): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(project));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  },

  getSavedProjects(): CodeProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProjectToList(project: CodeProject): CodeProject[] {
    const list = this.getSavedProjects();
    const index = list.findIndex(p => p.id === project.id);
    if (index >= 0) {
      list[index] = { ...project, updatedAt: Date.now() };
    } else {
      list.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving project list:', e);
    }
    return list;
  },

  deleteSavedProject(id: string): CodeProject[] {
    const list = this.getSavedProjects().filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(list));
    } catch (e) {}
    return list;
  },

  getUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: UserAccount | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {}
  },

  getMyGeneratedPreviews(): PreviewBundle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GENERATED_PREVIEWS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGeneratedPreview(preview: PreviewBundle): void {
    const list = this.getMyGeneratedPreviews();
    const index = list.findIndex(p => p.id === preview.id);
    if (index >= 0) {
      list[index] = preview;
    } else {
      list.unshift(preview);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.GENERATED_PREVIEWS, JSON.stringify(list));
    } catch (e) {}
  },

  removeGeneratedPreview(id: string): void {
    const list = this.getMyGeneratedPreviews().filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.GENERATED_PREVIEWS, JSON.stringify(list));
    } catch (e) {}
  },

  setGeneratedPreviews(list: PreviewBundle[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GENERATED_PREVIEWS, JSON.stringify(list));
    } catch (e) {}
  }
};
