// ============================================
// RENDER PAGE SCHEMA TO HTML
// Converts JSON schema to static HTML for publishing
// ============================================

// ============================================
// RENDER MULTI-PAGE SITE TO HTML MAP
// Returns { 'index.html': html, 'services.html': html, ... }
// ============================================
export function renderSiteToHtml(siteData) {
  if (!siteData?.multiPage || !Array.isArray(siteData.pages)) {
    // Single-page fallback
    return { 'index.html': renderPageToHtml(siteData) };
  }

  const result = {};
  siteData.pages.forEach((page) => {
    const pageForRender = {
      ...page,
      navbar: siteData.navbar, // shared navbar
      title: page.title || page.name,
      description: page.description || '',
      settings: siteData.settings || {},
    };
    const filename = page.filename || `${page.slug || page.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    result[filename] = renderPageToHtml(pageForRender);
  });
  return result;
}

export function renderPageToHtml(pageData, options = {}) {
  const { includeDoctype = true, includeHead = true } = options;

  const navbarHtml = pageData.navbar ? renderNavbar(pageData.navbar) : '';
  const sectionsHtml = pageData.sections
    .map((section) => renderSection(section))
    .join('\n');

  if (!includeHead) {
    return (navbarHtml ? navbarHtml + '\n' : '') + sectionsHtml;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageData.title || 'Untitled Page'}</title>
  <meta name="description" content="${pageData.description || ''}">
  ${pageData.settings?.favicon ? `<link rel="icon" href="${pageData.settings.favicon}">` : ''}
  ${pageData.settings?.ogImage ? `<meta property="og:image" content="${pageData.settings.ogImage}">` : ''}
  <style>
    ${getBaseStyles()}
  </style>
</head>
<body>
  ${navbarHtml}
  ${sectionsHtml}
</body>
</html>
  `.trim();

  return html;
}

// ============================================
// RENDER NAVBAR
// ============================================
function renderNavbar(navbar) {
  const {
    logo = 'My Brand',
    backgroundColor = '#ffffff',
    textColor = '#111827',
    ctaColor = '#d97706',
    sticky = true,
    links = [],
  } = navbar;

  const positionStyle = sticky ? 'position: sticky; top: 0; z-index: 1000;' : '';

  const linksHtml = links
    .map((link) => {
      if (link.highlighted) {
        return `<a href="${escapeHtml(link.href || '#')}" style="display: inline-block; padding: 8px 20px; background-color: ${ctaColor}; color: #ffffff; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none;">${escapeHtml(link.label)}</a>`;
      }
      return `<a href="${escapeHtml(link.href || '#')}" style="color: ${textColor}; font-size: 14px; font-weight: 500; text-decoration: none; opacity: 0.85; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85">${escapeHtml(link.label)}</a>`;
    })
    .join('\n    ');

  return `
<nav style="background-color: ${backgroundColor}; ${positionStyle} padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
  <div style="font-weight: 700; font-size: 20px; color: ${textColor};">${escapeHtml(logo)}</div>
  <div style="display: flex; align-items: center; gap: 28px;">
    ${linksHtml}
  </div>
</nav>
  `.trim();
}

// ============================================
// RENDER SECTION
// ============================================
function renderSection(section) {
  const bgStyle = getBackgroundStyle(section.background);
  const sectionStyle = {
    ...bgStyle,
    paddingTop: section.style?.paddingTop || '60px',
    paddingBottom: section.style?.paddingBottom || '60px',
    paddingLeft: section.style?.paddingLeft || '20px',
    paddingRight: section.style?.paddingRight || '20px',
    position: 'relative',
  };

  const styleAttr = objectToStyleString(sectionStyle);
  const rowsHtml = section.rows?.map((row) => renderRow(row)).join('\n') || '';

  // Overlay div if needed
  const overlayHtml = section.background?.overlay
    ? `<div style="position: absolute; inset: 0; background-color: ${section.background.overlay};"></div>`
    : '';

  return `
<section class="section section-${section.type || 'content'}" style="${styleAttr}">
  ${overlayHtml}
  <div style="position: relative; z-index: 1;">
    ${rowsHtml}
  </div>
</section>
  `.trim();
}

// ============================================
// RENDER ROW
// ============================================
function renderRow(row) {
  const rowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: row.style?.gap || '24px',
    maxWidth: row.style?.maxWidth || '1200px',
    margin: row.style?.margin || '0 auto',
    padding: row.style?.padding || '20px 0',
  };

  const columnsHtml = row.columns?.map((col) => renderColumn(col, row.columns.length)).join('\n') || '';

  return `
<div class="row" style="${objectToStyleString(rowStyle)}">
  ${columnsHtml}
</div>
  `.trim();
}

// ============================================
// RENDER COLUMN
// ============================================
function renderColumn(column, totalColumns) {
  const colStyle = {
    width: column.width || `${100 / totalColumns}%`,
    minWidth: '0',
    padding: column.style?.padding || '0',
    display: 'flex',
    flexDirection: 'column',
  };

  const widgetsHtml = column.widgets?.map((w) => renderWidget(w)).join('\n') || '';

  return `
<div class="column" style="${objectToStyleString(colStyle)}">
  ${widgetsHtml}
</div>
  `.trim();
}

// ============================================
// RENDER WIDGET
// ============================================
function renderWidget(widget) {
  switch (widget.type) {
    case 'text':
      return renderTextWidget(widget);
    case 'image':
      return renderImageWidget(widget);
    case 'video':
      return renderVideoWidget(widget);
    case 'button':
      return renderButtonWidget(widget);
    case 'button-group':
      return renderButtonGroupWidget(widget);
    case 'spacer':
      return renderSpacerWidget(widget);
    case 'divider':
      return renderDividerWidget(widget);
    case 'form':
      return renderFormWidget(widget);
    case 'testimonial':
      return renderTestimonialWidget(widget);
    case 'html':
      return widget.content?.code || '';
    default:
      return `<!-- Unknown widget type: ${widget.type} -->`;
  }
}

// ============================================
// WIDGET RENDERERS
// ============================================

function renderTextWidget(widget) {
  const content = widget.content || {};
  const style = widget.style || {};
  const tag = content.tag || 'p';

  const textStyle = {
    fontSize: style.fontSize || '16px',
    fontWeight: style.fontWeight || 'normal',
    color: style.color || '#1f2937',
    lineHeight: style.lineHeight || '1.6',
    textAlign: content.alignment || 'left',
    marginBottom: style.marginBottom || '16px',
    maxWidth: style.maxWidth || 'none',
  };

  return `<${tag} style="${objectToStyleString(textStyle)}">${escapeHtml(content.text || '')}</${tag}>`;
}

function renderImageWidget(widget) {
  const content = widget.content || {};
  const style = widget.style || {};

  if (!content.src) return '';

  const imgStyle = {
    width: content.width || '100%',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: style.borderRadius || '0',
    display: 'block',
  };

  const img = `<img src="${content.src}" alt="${escapeHtml(content.alt || '')}" style="${objectToStyleString(imgStyle)}">`;

  if (content.link) {
    return `<a href="${content.link}">${img}</a>`;
  }

  return img;
}

function renderVideoWidget(widget) {
  const content = widget.content || {};

  if (!content.src) return '';

  // YouTube/Vimeo embed
  const ytMatch = content.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) {
    return `
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
    `.trim();
  }

  const vimeoMatch = content.src.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
</div>
    `.trim();
  }

  // Direct video
  return `
<video src="${content.src}" ${content.controls !== false ? 'controls' : ''} ${content.autoplay ? 'autoplay muted' : ''} ${content.loop ? 'loop' : ''} style="width: 100%; display: block;"></video>
  `.trim();
}

function renderButtonWidget(widget) {
  const content = widget.content || {};
  const style = widget.style || {};

  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: style.padding || '12px 24px',
    fontSize: style.fontSize || '16px',
    fontWeight: style.fontWeight || '600',
    borderRadius: style.borderRadius || '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    border: content.style === 'outline' ? `2px solid ${style.borderColor || '#8b5cf6'}` : 'none',
    backgroundColor: content.style === 'outline' ? 'transparent' : (style.backgroundColor || '#8b5cf6'),
    color: style.color || (content.style === 'outline' ? '#8b5cf6' : '#ffffff'),
  };

  return `
<div style="text-align: ${content.alignment || 'center'};">
  <a href="${content.link || '#'}" style="${objectToStyleString(btnStyle)}">${escapeHtml(content.text || 'Click Here')}</a>
</div>
  `.trim();
}

function renderButtonGroupWidget(widget) {
  const content = widget.content || {};
  const buttons = content.buttons || [];

  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: content.gap || '16px',
    justifyContent: content.alignment || 'center',
  };

  const buttonsHtml = buttons.map((btn) => {
    const btnStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      textDecoration: 'none',
      border: btn.style === 'outline' ? '2px solid #8b5cf6' : 'none',
      backgroundColor: btn.style === 'outline' ? 'transparent' : (btn.style === 'secondary' ? '#1f2937' : '#8b5cf6'),
      color: btn.style === 'outline' ? '#8b5cf6' : '#ffffff',
    };

    return `<a href="${btn.link || '#'}" style="${objectToStyleString(btnStyle)}">${escapeHtml(btn.text)}</a>`;
  }).join('\n');

  return `
<div style="${objectToStyleString(containerStyle)}">
  ${buttonsHtml}
</div>
  `.trim();
}

function renderSpacerWidget(widget) {
  const content = widget.content || {};
  return `<div style="height: ${content.height || '40px'};"></div>`;
}

function renderDividerWidget(widget) {
  const content = widget.content || {};
  const hrStyle = {
    width: content.width || '100%',
    borderStyle: content.style || 'solid',
    borderColor: content.color || '#e5e7eb',
    borderWidth: `${content.thickness || '1px'} 0 0 0`,
    margin: '16px auto',
  };

  return `<hr style="${objectToStyleString(hrStyle)}">`;
}

function renderFormWidget(widget) {
  const content = widget.content || {};
  const fields = content.fields || [];

  const fieldsHtml = fields.map((field) => {
    const label = `<label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">${escapeHtml(field.label)}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}</label>`;

    let input;
    if (field.type === 'textarea') {
      input = `<textarea rows="4" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
    } else {
      input = `<input type="${field.type || 'text'}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
    }

    return `<div style="margin-bottom: 16px;">${label}${input}</div>`;
  }).join('\n');

  return `
<form style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
  ${fieldsHtml}
  <button type="submit" style="width: 100%; padding: 12px; background: #8b5cf6; color: #ffffff; font-size: 16px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
    ${escapeHtml(content.submitText || 'Submit')}
  </button>
</form>
  `.trim();
}

function renderTestimonialWidget(widget) {
  const content = widget.content || {};

  const starsHtml = content.rating
    ? `<div style="font-size: 20px; margin-bottom: 12px;">${'★'.repeat(content.rating)}${'☆'.repeat(5 - content.rating)}</div>`
    : '';

  const avatarHtml = content.avatar
    ? `<img src="${content.avatar}" alt="${escapeHtml(content.author)}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">`
    : `<div style="width: 48px; height: 48px; border-radius: 50%; background: #ede9fe; display: flex; align-items: center; justify-content: center; color: #8b5cf6; font-weight: bold; font-size: 18px;">${(content.author || 'A')[0].toUpperCase()}</div>`;

  return `
<div style="background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #f3f4f6;">
  ${starsHtml}
  <blockquote style="color: #374151; font-size: 18px; font-style: italic; margin-bottom: 16px;">
    "${escapeHtml(content.quote || '')}"
  </blockquote>
  <div style="display: flex; align-items: center; gap: 12px;">
    ${avatarHtml}
    <div>
      <p style="font-weight: 600; color: #111827; margin: 0;">${escapeHtml(content.author || 'Customer')}</p>
      ${content.role ? `<p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">${escapeHtml(content.role)}</p>` : ''}
    </div>
  </div>
</div>
  `.trim();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getBackgroundStyle(bg) {
  if (!bg) return {};

  switch (bg.type) {
    case 'color':
      return { backgroundColor: bg.value };
    case 'gradient':
      return { background: bg.value };
    case 'image':
      return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return {};
  }
}

function objectToStyleString(styleObj) {
  return Object.entries(styleObj)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function getBaseStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
    
    @media (max-width: 768px) {
      .row { flex-direction: column !important; }
      .column { width: 100% !important; min-width: 100% !important; }
    }
  `.trim();
}
