// ============================================================
// Email Block Schema Utilities
// ============================================================

const uid = () => crypto.randomUUID().slice(0, 8);

export const BLOCK_TYPES = [
  { type: 'header',      label: 'Header',      icon: '🏷️',  desc: 'Business name banner' },
  { type: 'hero_image',  label: 'Hero Image',  icon: '🖼️',  desc: 'Full-width image' },
  { type: 'urgency_bar', label: 'Urgency Bar', icon: '⏰',  desc: 'Offer expiry notice' },
  { type: 'body',        label: 'Body Text',   icon: '📝',  desc: 'Heading + paragraphs' },
  { type: 'offer_box',   label: 'Offer Box',   icon: '🎁',  desc: 'Highlighted offer card' },
  { type: 'cta_button',  label: 'CTA Button',  icon: '🔘',  desc: 'Call-to-action button' },
  { type: 'divider',     label: 'Divider',     icon: '➖',  desc: 'Horizontal rule' },
  { type: 'spacer',      label: 'Spacer',      icon: '↕️',  desc: 'Vertical space' },
  { type: 'signoff',     label: 'Sign-off',    icon: '✍️',  desc: 'Personal closing' },
  { type: 'footer',      label: 'Footer',      icon: '📄',  desc: 'Footer & unsubscribe' },
];

export function createBlock(type, overrides = {}) {
  const id = uid();
  const defaults = {
    header:      { title: 'Your Business', bgColor: '#111827', textColor: '#ffffff' },
    hero_image:  { src: '', alt: 'Email hero image' },
    urgency_bar: { text: '⏰ Limited time offer — don\'t miss out', bgColor: '#fef3c7', textColor: '#92400e' },
    body:        { heading: 'Here\'s something special for you', paragraphs: ['We wanted to reach out with an exclusive offer just for you.', 'Take advantage of this opportunity before it\'s gone.'] },
    offer_box:   { title: 'Exclusive Offer', description: 'Get our special deal — available this week only.', bgColor: '#f0fdf4', borderColor: '#22c55e' },
    cta_button:  { text: 'Book Now', link: '', bgColor: '#111827', textColor: '#ffffff', borderRadius: '8px' },
    divider:     { color: '#e5e7eb', thickness: '1px' },
    spacer:      { height: '24px' },
    signoff:     { text: 'The team at Your Business' },
    footer:      { text: 'You\'re receiving this because you\'ve used our services before.', unsubscribeText: 'Unsubscribe' },
  };
  return { id, type, content: { ...defaults[type], ...overrides } };
}

// ============================================================
// Serialize blocks → email-safe HTML (inline CSS, max 600px)
// ============================================================
export function emailBlocksToHtml(blocks) {
  if (!blocks || blocks.length === 0) return '';
  const inner = blocks.map(renderBlock).join('\n');
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10)">\n${inner}\n</div>`;
}

function renderBlock(block) {
  const c = block.content || {};
  switch (block.type) {
    case 'header':
      return `  <div style="background:${c.bgColor || '#111827'};padding:20px 24px;text-align:center">
    <h1 style="color:${c.textColor || '#ffffff'};margin:0;font-size:20px;font-weight:700;letter-spacing:-0.3px">${esc(c.title || 'Your Business')}</h1>
  </div>`;

    case 'hero_image':
      return c.src
        ? `  <img src="${esc(c.src)}" alt="${esc(c.alt || '')}" style="width:100%;display:block;max-height:280px;object-fit:cover" />`
        : `  <!-- hero image placeholder -->`;

    case 'urgency_bar':
      return `  <div style="background:${c.bgColor || '#fef3c7'};border-bottom:2px solid #f59e0b;padding:12px 24px;text-align:center">
    <p style="margin:0;font-size:14px;font-weight:700;color:${c.textColor || '#92400e'}">${esc(c.text || '')}</p>
  </div>`;

    case 'body': {
      const paras = (c.paragraphs || []).map(p =>
        `    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65">${esc(p)}</p>`
      ).join('\n');
      return `  <div style="padding:32px 28px 8px">
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;line-height:1.3">${esc(c.heading || '')}</h2>
${paras}
  </div>`;
    }

    case 'offer_box':
      return `  <div style="margin:0 28px 24px;background:${c.bgColor || '#f0fdf4'};border-left:4px solid ${c.borderColor || '#22c55e'};padding:16px 20px;border-radius:8px">
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827">${esc(c.title || 'Exclusive Offer')}</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.55">${esc(c.description || '')}</p>
  </div>`;

    case 'cta_button':
      return `  <div style="padding:8px 28px 32px;text-align:center">
    <a href="${esc(c.link || '#')}" style="display:inline-block;background:${c.bgColor || '#111827'};color:${c.textColor || '#ffffff'};padding:14px 36px;border-radius:${c.borderRadius || '8px'};text-decoration:none;font-weight:700;font-size:16px">${esc(c.text || 'Book Now')}</a>
  </div>`;

    case 'divider':
      return `  <div style="padding:0 28px"><hr style="border:none;border-top:${c.thickness || '1px'} solid ${c.color || '#e5e7eb'};margin:8px 0" /></div>`;

    case 'spacer':
      return `  <div style="height:${c.height || '24px'}"></div>`;

    case 'signoff':
      return `  <div style="padding:0 28px 24px">
    <p style="margin:0;font-size:14px;color:#6b7280">${esc(c.text || '')}</p>
  </div>`;

    case 'footer':
      return `  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 28px;text-align:center">
    <p style="margin:0 0 8px;font-size:12px;color:#6b7280">${esc(c.text || '')}</p>
    <a href="#" style="font-size:12px;color:#6b7280;text-decoration:underline">${esc(c.unsubscribeText || 'Unsubscribe')}</a>
  </div>`;

    default:
      return '';
  }
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
