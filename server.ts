import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// In-Memory & File-backed Store for Previews
interface StoredPreviewBundle {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  expiresAt: number | null;
  expiryRule: string;
  authorId?: string;
  authorName?: string;
  viewCount: number;
  isPermanent: boolean;
}

const previewStore = new Map<string, StoredPreviewBundle>();
const DATA_FILE = path.join(process.cwd(), '.previews-db.json');

// Load stored previews from disk on startup if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      parsed.forEach((item: StoredPreviewBundle) => {
        previewStore.set(item.id, item);
      });
    }
  }
} catch (e) {
  console.warn('Could not read existing previews DB, starting fresh in-memory:', e);
}

function persistStore() {
  try {
    const arrayData = Array.from(previewStore.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(arrayData, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not persist previews to disk:', e);
  }
}

// Simple in-memory rate limiter per IP (max 40 preview creations per 15 minutes)
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 40;

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = ipRateLimits.get(clientIp);
  if (!record || now > record.resetTime) {
    ipRateLimits.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many preview creation requests. Please wait a few minutes before creating new links.',
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count++;
  next();
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activePreviewsCount: previewStore.size,
    timestamp: new Date().toISOString(),
  });
});

// Create new preview bundle
app.post('/api/previews', rateLimitMiddleware, (req, res) => {
  try {
    const { title, html, css, js, expiryRule, customExpiryTimestamp, authorId, authorName } = req.body;

    if (html === undefined || css === undefined || js === undefined) {
      return res.status(400).json({ error: 'Code fields (html, css, js) are required.' });
    }

    const now = Date.now();
    let expiresAt: number | null = null;
    let isPermanent = false;

    switch (expiryRule) {
      case '1_day':
        expiresAt = now + 24 * 60 * 60 * 1000;
        break;
      case '3_days':
        expiresAt = now + 3 * 24 * 60 * 60 * 1000;
        break;
      case '1_month':
        expiresAt = now + 30 * 24 * 60 * 60 * 1000;
        break;
      case 'permanent':
        expiresAt = null;
        isPermanent = true;
        break;
      case 'custom':
        if (customExpiryTimestamp && customExpiryTimestamp > now) {
          expiresAt = Number(customExpiryTimestamp);
        } else {
          expiresAt = now + 24 * 60 * 60 * 1000;
        }
        break;
      default:
        expiresAt = now + 3 * 24 * 60 * 60 * 1000;
    }

    // Generate unique short ID
    const id = crypto.randomBytes(6).toString('hex');

    const bundle: StoredPreviewBundle = {
      id,
      title: (title || 'Code Sandbox Preview').substring(0, 100),
      html: String(html),
      css: String(css),
      js: String(js),
      createdAt: now,
      expiresAt,
      expiryRule: expiryRule || '3_days',
      authorId: authorId ? String(authorId) : undefined,
      authorName: authorName ? String(authorName) : undefined,
      viewCount: 0,
      isPermanent,
    };

    previewStore.set(id, bundle);
    persistStore();

    const previewUrl = `/preview/${id}`;

    res.status(201).json({
      success: true,
      bundle,
      url: previewUrl,
      message: 'Preview bundle generated and secured successfully.',
    });
  } catch (err: any) {
    console.error('Error saving preview bundle:', err);
    res.status(500).json({ error: 'Failed to create preview bundle.' });
  }
});

// Fetch preview bundle by ID (enforces expiry)
app.get('/api/previews/:id', (req, res) => {
  const { id } = req.params;
  const bundle = previewStore.get(id);

  if (!bundle) {
    return res.status(404).json({
      success: false,
      error: 'Preview link not found or has been revoked.',
    });
  }

  // Check if expired
  if (!bundle.isPermanent && bundle.expiresAt && Date.now() > bundle.expiresAt) {
    return res.status(410).json({
      success: false,
      isExpired: true,
      expiresAt: bundle.expiresAt,
      message: 'This preview link has expired per creator configuration.',
    });
  }

  // Increment view count analytics
  bundle.viewCount = (bundle.viewCount || 0) + 1;
  persistStore();

  res.json({
    success: true,
    bundle,
  });
});

// Delete / Revoke preview bundle
app.delete('/api/previews/:id', (req, res) => {
  const { id } = req.params;
  const { authorId } = req.body;

  const bundle = previewStore.get(id);
  if (!bundle) {
    return res.status(404).json({ error: 'Preview not found.' });
  }

  // If authorId specified, verify ownership
  if (bundle.authorId && authorId && bundle.authorId !== authorId) {
    return res.status(403).json({ error: 'Unauthorized to revoke this preview.' });
  }

  previewStore.delete(id);
  persistStore();

  res.json({ success: true, message: 'Preview link revoked successfully.' });
});

// Get user's previews
app.get('/api/user/:userId/previews', (req, res) => {
  const { userId } = req.params;
  const userPreviews = Array.from(previewStore.values()).filter((p) => p.authorId === userId);
  res.json({ previews: userPreviews });
});

// ================= VITE / SPA MIDDLEWARE =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeSnippet Sandbox server running on http://localhost:${PORT}`);
  });
}

startServer();
