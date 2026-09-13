export type ExpiryRule = '1_day' | '3_days' | '1_month' | 'permanent' | 'custom';

export interface CodeProject {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  updatedAt: number;
  createdAt: number;
  userId?: string;
  tags?: string[];
}

export interface PreviewBundle {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  expiresAt: number | null; // null for permanent
  expiryRule: ExpiryRule;
  authorId?: string;
  authorName?: string;
  projectId?: string;
  viewCount: number;
  isPermanent: boolean;
  isExpired?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface SecurityReport {
  isSafe: boolean;
  warnings: string[];
  sanitizedHtml: string;
  hasExternalScripts: boolean;
  hasDangerousTags: boolean;
}

export type ActiveTab = 'html' | 'css' | 'js';
export type ViewMode = 'split' | 'tabs';
export type PreviewScreenSize = 'desktop' | 'tablet' | 'mobile' | 'responsive';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}
