// Visitor analytics and error monitoring, both built to keep children's data out.
//
// Analytics: Vercel Web Analytics (cookie-free). Loads only on the live site, only after the visitor
// presses "Accept" on the cookie notice, and only counts public pages (never lessons or dashboards).
// Errors: Sentry, only when VITE_SENTRY_DSN is set. No names, emails, IDs, tokens or page queries are sent.

export const CONSENT_KEY = 'ai_tutor_cookie_consent';
export const PUBLIC_PATHS = ['/', '/login', '/try-classroom', '/privacy', '/terms', '/cookies', '/join'];

const isPublic = (url) => {
  try {
    return PUBLIC_PATHS.includes(new URL(url, window.location.origin).pathname);
  } catch {
    return false;
  }
};

const hasConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'all';
  } catch {
    return false;
  }
};

// Drops query strings (e.g. /join?code=...) and anything that is not a public page.
export const analyticsBeforeSend = (event) => {
  if (!event?.url || !isPublic(event.url)) return null;
  const url = new URL(event.url, window.location.origin);
  return { ...event, url: `${url.origin}${url.pathname}` };
};

let analyticsLoaded = false;
export const enableAnalytics = () => {
  if (analyticsLoaded || !import.meta.env.PROD || !hasConsent()) return;
  analyticsLoaded = true;
  window.va = window.va || function va(...args) {
    (window.vaq = window.vaq || []).push(args);
  };
  window.va('beforeSend', analyticsBeforeSend);
  const script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  document.head.appendChild(script);
};

// --- Sentry --------------------------------------------------------------------

const SECRET_KEYS = /token|password|authorization|cookie|email|first_name|last_name|user/i;

export const scrubEvent = (event) => {
  const clean = { ...event };
  delete clean.user;
  if (clean.request) {
    const request = { ...clean.request };
    delete request.cookies;
    delete request.data;
    delete request.headers;
    delete request.query_string;
    if (request.url) request.url = request.url.split('?')[0];
    clean.request = request;
  }
  if (clean.breadcrumbs) {
    clean.breadcrumbs = clean.breadcrumbs.map((b) => {
      const crumb = { ...b };
      if (crumb.data?.url) crumb.data = { ...crumb.data, url: String(crumb.data.url).split('?')[0] };
      if (crumb.message && SECRET_KEYS.test(crumb.message)) crumb.message = '[removed]';
      return crumb;
    });
  }
  return clean;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_VERCEL_ENV || import.meta.env.MODE,
        sendDefaultPii: false,
        tracesSampleRate: 0, // errors only: no performance tracing, no session replay
        beforeSend: scrubEvent,
      });
    })
    .catch(() => {
      // Monitoring must never break the app.
    });
};
