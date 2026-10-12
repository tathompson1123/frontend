// First-party analytics for the /learnmore marketing page. Reports to
// POST /api/landing/event; the numbers show up under Analytics → Landing Page.
//
// Anonymous by design: a random id kept in the browser, and button labels. No names,
// emails or phone numbers ever go through here. Visits from the SORCE team (anyone logged
// in to the dashboard or /analytics on this browser) are skipped so they don't count.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE = 'learnmore';
const FLUSH_MS = 2000;

const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

function randomId() {
  return safe(() => crypto.randomUUID(), null) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getVisitorId() {
  let id = safe(() => localStorage.getItem('sorce_vid'));
  if (!id) {
    id = randomId();
    safe(() => localStorage.setItem('sorce_vid', id));
  }
  return id;
}

function getSessionId() {
  let id = safe(() => sessionStorage.getItem('sorce_sid'));
  if (!id) {
    id = randomId();
    safe(() => sessionStorage.setItem('sorce_sid', id));
  }
  return id;
}

// Add ?notrack=1 to any URL once to switch tracking off in this browser (?notrack=0 undoes it).
function isInternal() {
  const flag = safe(() => new URLSearchParams(window.location.search).get('notrack'));
  if (flag === '1') safe(() => localStorage.setItem('sorce_notrack', '1'));
  if (flag === '0') safe(() => localStorage.removeItem('sorce_notrack'));
  return !!(
    safe(() => localStorage.getItem('sorce_notrack')) ||
    safe(() => localStorage.getItem('token')) ||
    safe(() => sessionStorage.getItem('analyticsToken'))
  );
}

// UTM tags are read from the landing URL once per session, so they survive the quiz and
// booking steps that follow.
function getUtm() {
  const stored = safe(() => JSON.parse(sessionStorage.getItem('sorce_utm') || 'null'));
  if (stored) return stored;
  const q = new URLSearchParams(window.location.search);
  const utm = {
    source: q.get('utm_source') || '', medium: q.get('utm_medium') || '',
    campaign: q.get('utm_campaign') || '', content: q.get('utm_content') || '',
  };
  // Meta ads add fbclid; treat it as a facebook visit if nothing else says otherwise.
  if (!utm.source && q.get('fbclid')) { utm.source = 'facebook'; utm.medium = utm.medium || 'paid'; }
  safe(() => sessionStorage.setItem('sorce_utm', JSON.stringify(utm)));
  return utm;
}

function getReferrerHost() {
  const stored = safe(() => sessionStorage.getItem('sorce_ref'));
  if (stored !== null) return stored;
  const host = safe(() => {
    if (!document.referrer) return '';
    const h = new URL(document.referrer).hostname.replace(/^www\./, '');
    return h === window.location.hostname.replace(/^www\./, '') ? '' : h;
  }, '');
  safe(() => sessionStorage.setItem('sorce_ref', host));
  return host;
}

function getDevice() {
  const w = window.innerWidth;
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

let queue = [];
let timer = null;
let enabled = false;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!enabled || queue.length === 0) return;
  const events = queue.splice(0, 20);
  const body = JSON.stringify({
    page: PAGE, v: getVisitorId(), s: getSessionId(),
    ref: getReferrerHost(), utm: getUtm(), device: getDevice(), events,
  });
  // keepalive lets the request finish even while the tab is closing
  safe(() => fetch(`${API_URL}/api/landing/event`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true,
  }).catch(() => {}));
  if (queue.length) flush();
}

export function track(event, target, meta) {
  if (!enabled) return;
  queue.push({ event, target: target == null ? undefined : String(target), meta });
  if (!timer) timer = setTimeout(flush, FLUSH_MS);
}

// Meta Pixel standard events for the moments that matter to ads. No-ops if the pixel isn't loaded.
export function pixel(name, params) {
  safe(() => { if (typeof window.fbq === 'function') window.fbq('track', name, params); });
}

// What a clicked thing is called in the report: an explicit data-track, else its label.
function clickLabel(el) {
  const explicit = el.getAttribute('data-track');
  if (explicit) return explicit;
  const text = (el.getAttribute('aria-label') || el.innerText || el.textContent || '')
    .replace(/\s+/g, ' ').trim().slice(0, 60);
  if (text) return text;
  const href = el.getAttribute('href');
  return href ? `link: ${href.replace(/^https?:\/\//, '').slice(0, 50)}` : `${el.tagName.toLowerCase()} (no label)`;
}

/** Start tracking this page. Returns a cleanup function. */
export function startLandingTracking() {
  enabled = !isInternal();
  if (!enabled) return () => {};

  track('pageview');

  // Every button and link, by its label — "where they are clicking".
  const onClick = (e) => {
    const el = e.target.closest && e.target.closest('button, a, summary, [role="button"]');
    if (!el || el.closest('[data-track-skip]')) return;
    track('click', clickLabel(el));
  };
  document.addEventListener('click', onClick, true);

  // Scroll depth, each milestone once.
  const hit = new Set();
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = (window.scrollY / max) * 100;
    for (const m of [25, 50, 75, 100]) {
      if (pct >= m - 1 && !hit.has(m)) { hit.add(m); track('scroll', m); }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flush);

  return () => {
    document.removeEventListener('click', onClick, true);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', flush);
    flush();
    enabled = false;
  };
}
