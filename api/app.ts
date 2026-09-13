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
} from './db';

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

export default app;
