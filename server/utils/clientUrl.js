/**
 * clientUrl.js — Dynamic Frontend Client URL Resolver
 * ───────────────────────────────────────────────────
 * Dynamically determines the client URL for email links (verification, password reset, etc.).
 * Automatically extracts the caller's live domain from request headers (Origin / Referer),
 * so links generated in emails point to the live Vercel frontend even if process.env.CLIENT_URL
 * was not explicitly configured on the backend hosting platform (e.g. Render).
 */

function getClientUrl(req) {
  // 1. If incoming request has an Origin header from a live production frontend (e.g., https://xxx.vercel.app)
  const reqOrigin = req?.get?.('origin') || req?.headers?.origin;
  if (reqOrigin && typeof reqOrigin === 'string' && reqOrigin.startsWith('http')) {
    const cleanOrigin = reqOrigin.trim().replace(/\/$/, '');
    if (!cleanOrigin.includes('localhost') && !cleanOrigin.includes('127.0.0.1')) {
      return cleanOrigin;
    }
  }

  // 2. If incoming request has a Referer header (e.g., https://xxx.vercel.app/login)
  const reqReferer = req?.get?.('referer') || req?.headers?.referer;
  if (reqReferer && typeof reqReferer === 'string' && reqReferer.startsWith('http')) {
    try {
      const parsed = new URL(reqReferer);
      if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return parsed.origin;
      }
    } catch (_) {}
  }

  // 3. Environment variable CLIENT_URL if configured
  if (process.env.CLIENT_URL && typeof process.env.CLIENT_URL === 'string') {
    const envUrl = process.env.CLIENT_URL.trim().replace(/\/$/, '');
    if (envUrl.length > 0) {
      return envUrl;
    }
  }

  // 4. If request is local (dev environment)
  if (reqOrigin) {
    return reqOrigin.trim().replace(/\/$/, '');
  }

  // 5. Default fallback
  return 'http://localhost:3000';
}

module.exports = { getClientUrl };
