import DOMPurify from 'dompurify';

// The dashboard keeps its login token in localStorage, so any script that runs on the page
// can take over the account. Several screens render text that came from an AI model or from
// a third party's website as HTML; everything of that kind goes through here first.

// For content that is supposed to contain formatting (headings, lists, links).
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(String(html ?? ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
  });
}

// For text that should be shown as text, with a little markup added by us afterwards.
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
