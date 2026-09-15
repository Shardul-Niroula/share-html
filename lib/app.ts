import express from 'express';
import crypto from 'crypto';
import {
  StoredPreviewBundle,
  insertPreview,
  getPreview,
  incrementViewCount,
  deletePreview,
  getPreviewsByAuthor,
  countActivePreviews,
} from './db.js';
import { buildSandboxedDocument } from '../src/services/sanitizer.js';

const app = express();

app.use(express.json({ limit: '5mb' }));

// Simple in-memory rate limiter per IP (max 40 preview creations per 15 minutes).
// Note: on Vercel this is per-function-instance, not global, so it's a best-effort
// throttle rather than a hard limit across the whole deployment.
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
app.get('/api/health', async (req, res) => {
  try {
    const activePreviewsCount = await countActivePreviews();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      activePreviewsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: 'Database unreachable.' });
  }
});

// Create new preview bundle
app.post('/api/previews', rateLimitMiddleware, async (req, res) => {
  try {
    const { title, html, css, js, expiryRule, customExpiryTimestamp, authorId, authorName, projectId } = req.body;

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
      projectId: projectId ? String(projectId) : undefined,
      viewCount: 0,
      isPermanent,
    };

    await insertPreview(bundle);

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
app.get('/api/previews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bundle = await getPreview(id);

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
    await incrementViewCount(id);

    res.json({
      success: true,
      bundle,
    });
  } catch (err: any) {
    console.error('Error fetching preview bundle:', err);
    res.status(500).json({ error: 'Failed to fetch preview bundle.' });
  }
});

// Delete / Revoke preview bundle
app.delete('/api/previews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorId } = req.body;

    const bundle = await getPreview(id);
    if (!bundle) {
      return res.status(404).json({ error: 'Preview not found.' });
    }

    // If authorId specified, verify ownership
    if (bundle.authorId && authorId && bundle.authorId !== authorId) {
      return res.status(403).json({ error: 'Unauthorized to revoke this preview.' });
    }

    await deletePreview(id);

    res.json({ success: true, message: 'Preview link revoked successfully.' });
  } catch (err: any) {
    console.error('Error deleting preview bundle:', err);
    res.status(500).json({ error: 'Failed to delete preview bundle.' });
  }
});

// Get user's previews
app.get('/api/user/:userId/previews', async (req, res) => {
  try {
    const { userId } = req.params;
    const userPreviews = await getPreviewsByAuthor(userId);
    res.json({ previews: userPreviews });
  } catch (err: any) {
    console.error('Error fetching user previews:', err);
    res.status(500).json({ error: 'Failed to fetch previews.' });
  }
});

// ================= STANDALONE PREVIEW PAGES =================

// Serves a shared preview link as a real top-level HTML document instead of
// mounting it inside the SPA's iframe. Rendering it inside the SPA meant any
// real navigation from the pasted page (a link, a form submit) resolved
// against the SPA's own /preview/:id route and got caught by Vercel's SPA
// catch-all rewrite, reloading the whole app inside the iframe and leaving
// the pasted content unreachable afterward. Serving it directly here makes
// the browser tab itself the pasted page, matching how "open in new tab"
// already behaves via a blob URL.
function renderPreviewInfoPage(status: 'not-found' | 'expired' | 'error', title: string, message: string, previewId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · ShareHtml</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0f0f13; color:#f2f2f5; font-family: system-ui, -apple-system, sans-serif; padding: 24px; }
  .card { max-width: 440px; padding: 32px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  p { color: #a1a1aa; line-height: 1.5; margin: 0 0 20px; }
  .meta { font-size: 12px; color: #71717a; margin: 0 0 24px; }
  a { display:inline-block; padding:10px 20px; border-radius:8px; background:#6366f1; color:#fff; text-decoration:none; font-weight:600; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="meta">Link ID: ${previewId}</div>
    <a href="/">Create Your Own Sandbox</a>
  </div>
</body>
</html>`;
}

app.get('/preview/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const bundle = await getPreview(id);

    if (!bundle) {
      res.status(404).type('html').send(renderPreviewInfoPage(
        'not-found',
        'Preview Unavailable',
        'The requested preview link does not exist or has been removed.',
        id
      ));
      return;
    }

    if (!bundle.isPermanent && bundle.expiresAt && Date.now() > bundle.expiresAt) {
      res.status(410).type('html').send(renderPreviewInfoPage(
        'expired',
        'Preview Expired',
        'The creator configured an expiration rule for this snippet, and its active sharing window has elapsed.',
        id
      ));
      return;
    }

    await incrementViewCount(id);

    const sandboxedHtml = buildSandboxedDocument(bundle.html, bundle.css, bundle.js);
    res.status(200).type('html').send(sandboxedHtml);
  } catch (err: any) {
    console.error('Error rendering standalone preview page:', err);
    res.status(500).type('html').send(renderPreviewInfoPage(
      'error',
      'Something Went Wrong',
      'Failed to load this preview. Please try again later.',
      id
    ));
  }
});

export default app;
