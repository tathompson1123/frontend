// ============================================
// TEMPLATE → WIDGET FORMAT CONVERTER
// Converts AI-generated template-based page_data
// into the widget-based editor format
// ============================================

import {
  generateId,
  WIDGET_TYPES,
  createWidget,
  createColumn,
  createRow,
  createSection,
  createNavbar,
} from './schema';

// ============================================
// THEME VARS HELPER
// Normalizes theme from AI schema into usable vars
// ============================================
function getThemeVars(rawTheme) {
  const t = rawTheme || {};
  const primaryColor = t.primaryColor || '#d97706';
  const accentColor = t.accentColor || '#f59e0b';
  const bgColor = t.bgColor || '#020617';
  const surfaceColor = t.surfaceColor || '#0f172a';
  const textColor = t.textColor || '#ffffff';
  const textMuted = t.textMuted || 'rgba(255,255,255,0.6)';
  const buttonRadius = t.buttonRadius || '8px';

  // Light theme detection: text is dark-colored (not white/near-white)
  const isDark =
    textColor === '#ffffff' ||
    textColor === '#fff' ||
    textColor.toLowerCase() === '#ffffff';

  // For light themes, use sensible light-mode text colors
  const sectionText = isDark ? textColor : '#1f2937';
  const sectionMuted = isDark ? textMuted : '#6b7280';
  const sectionBg = isDark ? surfaceColor : '#ffffff';
  const altSectionBg = isDark ? bgColor : '#f9fafb';

  return {
    primary: primaryColor,
    accent: accentColor,
    bg: bgColor,
    surface: surfaceColor,
    text: sectionText,
    muted: sectionMuted,
    sectionBg,
    altSectionBg,
    buttonRadius,
    isDark,
  };
}

// ============================================
// HELPERS
// ============================================
function makeWidget(type, content, style = {}) {
  return { ...createWidget(type), content: { ...createWidget(type).content, ...content }, style: { ...createWidget(type).style, ...style } };
}

function makeTextWidget(text, tag = 'p', alignment = 'left', style = {}) {
  return makeWidget(WIDGET_TYPES.TEXT, { text, tag, alignment }, style);
}

function makeButtonGroup(buttons, alignment = 'left', primaryColor = '#d97706') {
  return {
    ...createWidget(WIDGET_TYPES.BUTTON_GROUP),
    content: {
      buttons: buttons.filter(Boolean).map(b => ({
        id: generateId(),
        text: b.text || 'Click Here',
        link: b.link || '#',
        style: b.variant || 'primary',
        primaryColor,
      })),
      alignment,
      gap: '16px',
    },
  };
}

function makeColumn(width, widgets) {
  const col = createColumn(width);
  col.widgets = widgets.filter(Boolean);
  return col;
}

function makeRow(columns) {
  const row = createRow(1);
  row.columns = columns.filter(Boolean);
  return row;
}

function makeTitleRow(title, subtitle, tv) {
  const widgets = [];
  if (title) widgets.push(makeTextWidget(title, 'h2', 'center', { fontSize: '36px', fontWeight: 'bold', color: tv.text, marginBottom: '16px' }));
  if (subtitle) widgets.push(makeTextWidget(subtitle, 'p', 'center', { fontSize: '18px', color: tv.muted, marginBottom: '40px' }));
  return makeRow([makeColumn('100%', widgets)]);
}

// ============================================
// TEMPLATE CONVERTERS
// Each returns a widget-based section object
// ============================================

function convertHero(content = {}, type = 'dark', tv) {
  const section = createSection('hero');
  section.name = 'Hero';
  section.style.paddingTop = '120px';
  section.style.paddingBottom = '120px';

  const hasBg = content.backgroundImage || content.bgImage;
  if (hasBg) {
    section.background = { type: 'image', value: hasBg, overlay: 'rgba(0,0,0,0.55)' };
  } else {
    section.background = {
      type: 'gradient',
      value: `linear-gradient(135deg, ${tv.bg} 0%, ${tv.surface} 100%)`,
      overlay: '',
    };
  }

  const textColor = (hasBg || tv.isDark) ? '#ffffff' : tv.text;
  const subtitleColor = (hasBg || tv.isDark) ? 'rgba(255,255,255,0.85)' : tv.muted;

  const widgets = [];
  const headline = content.headline || content.title || '';
  const highlight = content.highlightText || '';
  const fullHeadline = highlight ? `${headline} ${highlight}` : headline;
  if (fullHeadline) widgets.push(makeTextWidget(fullHeadline, 'h1', 'left', { fontSize: '52px', fontWeight: 'bold', color: textColor, lineHeight: '1.15', marginBottom: '20px' }));

  const subtitle = content.subtitle || content.subheadline || content.description || '';
  if (subtitle) widgets.push(makeTextWidget(subtitle, 'p', 'left', { fontSize: '20px', color: subtitleColor, marginBottom: '36px', maxWidth: '600px' }));

  const ctaBtns = [];
  if (content.ctaText) ctaBtns.push({ text: content.ctaText, link: content.ctaLink || '#contact', variant: 'primary' });
  if (content.ctaText2) ctaBtns.push({ text: content.ctaText2, link: content.ctaLink2 || '#', variant: 'outline' });
  if (ctaBtns.length) widgets.push(makeButtonGroup(ctaBtns, 'left', tv.primary));

  section.rows = [makeRow([makeColumn('65%', widgets)])];
  return section;
}

function convertFeatures(content = {}, tv) {
  const section = createSection('features');
  section.name = 'Features';
  section.background = { type: 'color', value: tv.sectionBg, overlay: '' };

  const rows = [];
  const titleRow = makeTitleRow(content.title || content.headline || 'Our Features', content.subtitle || '', tv);
  rows.push(titleRow);

  const items = content.features || content.items || [];
  if (items.length > 0) {
    const cols = items.slice(0, 4).map(feat => {
      const widgets = [];
      if (feat.icon) widgets.push(makeTextWidget(feat.icon, 'p', 'center', { fontSize: '40px', marginBottom: '12px' }));
      if (feat.title) widgets.push(makeTextWidget(feat.title, 'h3', 'center', { fontSize: '20px', fontWeight: '600', color: tv.text, marginBottom: '8px' }));
      if (feat.text || feat.description) widgets.push(makeTextWidget(feat.text || feat.description, 'p', 'center', { fontSize: '15px', color: tv.muted }));
      const w = items.length >= 4 ? '25%' : items.length === 3 ? '33.33%' : items.length === 2 ? '50%' : '100%';
      return makeColumn(w, widgets);
    });
    rows.push(makeRow(cols));
  }

  section.rows = rows;
  return section;
}

function convertServices(content = {}, tv) {
  const section = createSection('services');
  section.name = 'Services';
  section.background = { type: 'color', value: tv.altSectionBg, overlay: '' };

  const rows = [];
  rows.push(makeTitleRow(content.title || content.headline || 'Our Services', content.subtitle || '', tv));

  const items = content.services || content.cards || content.items || [];
  if (items.length > 0) {
    const cols = items.slice(0, 3).map(svc => {
      const widgets = [];
      if (svc.icon) widgets.push(makeTextWidget(svc.icon, 'p', 'center', { fontSize: '36px', marginBottom: '12px' }));
      if (svc.title || svc.name) widgets.push(makeTextWidget(svc.title || svc.name, 'h3', 'center', { fontSize: '20px', fontWeight: '600', color: tv.text, marginBottom: '8px' }));
      if (svc.description || svc.text) widgets.push(makeTextWidget(svc.description || svc.text, 'p', 'center', { fontSize: '15px', color: tv.muted, marginBottom: '16px' }));
      if (svc.price) widgets.push(makeTextWidget(svc.price, 'p', 'center', { fontSize: '18px', fontWeight: 'bold', color: tv.primary }));
      const w = items.length >= 3 ? '33.33%' : items.length === 2 ? '50%' : '100%';
      return makeColumn(w, widgets);
    });
    rows.push(makeRow(cols));
  }

  section.rows = rows;
  return section;
}

function convertTestimonials(content = {}, tv) {
  const section = createSection('testimonials');
  section.name = 'Testimonials';
  section.background = { type: 'color', value: tv.altSectionBg, overlay: '' };

  const rows = [];
  rows.push(makeTitleRow(content.title || 'What Our Customers Say', content.subtitle || '', tv));

  const items = content.reviews || content.testimonials || [];
  if (items.length > 0) {
    const cols = items.slice(0, 3).map(item => {
      const w = { ...createWidget(WIDGET_TYPES.TESTIMONIAL) };
      w.content = {
        quote: item.text || item.quote || '',
        author: item.name || item.author || 'Happy Customer',
        role: item.role || 'Verified Customer',
        avatar: item.avatar || '',
        rating: item.stars || item.rating || 5,
      };
      const width = items.length >= 3 ? '33.33%' : items.length === 2 ? '50%' : '100%';
      return makeColumn(width, [w]);
    });
    rows.push(makeRow(cols));
  }

  section.rows = rows;
  return section;
}

function convertCta(content = {}, tv) {
  const section = createSection('cta');
  section.name = 'Call to Action';
  section.background = {
    type: 'gradient',
    value: `linear-gradient(135deg, ${tv.primary} 0%, ${tv.accent} 100%)`,
    overlay: '',
  };
  section.style.paddingTop = '80px';
  section.style.paddingBottom = '80px';

  const widgets = [];
  const headline = content.headline || content.title || 'Ready to Get Started?';
  widgets.push(makeTextWidget(headline, 'h2', 'center', { fontSize: '36px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }));
  const sub = content.subtitle || content.text || '';
  if (sub) widgets.push(makeTextWidget(sub, 'p', 'center', { fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }));

  const btns = [];
  if (content.ctaText) btns.push({ text: content.ctaText, link: content.ctaLink || '#contact', variant: 'primary' });
  if (content.ctaText2) btns.push({ text: content.ctaText2, link: content.ctaLink2 || '#', variant: 'outline' });
  if (btns.length) widgets.push(makeButtonGroup(btns, 'center', tv.primary));

  section.rows = [makeRow([makeColumn('100%', widgets)])];
  return section;
}

function convertContact(content = {}, tv) {
  const section = createSection('contact');
  section.name = 'Contact';
  section.background = { type: 'color', value: tv.sectionBg, overlay: '' };

  const leftWidgets = [];
  leftWidgets.push(makeTextWidget(content.title || content.headline || 'Get in Touch', 'h2', 'left', { fontSize: '36px', fontWeight: 'bold', color: tv.text, marginBottom: '16px' }));
  if (content.subtitle || content.text) {
    leftWidgets.push(makeTextWidget(content.subtitle || content.text, 'p', 'left', { fontSize: '16px', color: tv.muted, marginBottom: '24px' }));
  }
  if (content.phone) leftWidgets.push(makeTextWidget(`📞 ${content.phone}`, 'p', 'left', { fontSize: '16px', color: tv.text, marginBottom: '8px' }));
  if (content.email) leftWidgets.push(makeTextWidget(`✉️ ${content.email}`, 'p', 'left', { fontSize: '16px', color: tv.text, marginBottom: '8px' }));
  if (content.address) leftWidgets.push(makeTextWidget(`📍 ${content.address}`, 'p', 'left', { fontSize: '16px', color: tv.text, marginBottom: '8px' }));

  const formWidget = { ...createWidget(WIDGET_TYPES.FORM) };

  section.rows = [makeRow([makeColumn('50%', leftWidgets), makeColumn('50%', [formWidget])])];
  return section;
}

function convertBenefits(content = {}, tv) {
  const section = createSection('benefits');
  section.name = 'Benefits';
  section.background = { type: 'color', value: tv.sectionBg, overlay: '' };

  const rows = [];
  rows.push(makeTitleRow(content.title || content.headline || 'Why Choose Us', content.subtitle || '', tv));

  const items = content.benefits || content.items || content.features || [];
  items.slice(0, 6).forEach((item, i) => {
    const widgets = [];
    const num = makeTextWidget(`${i + 1}`, 'p', 'center', { fontSize: '32px', fontWeight: 'bold', color: tv.primary, marginBottom: '8px' });
    if (item.title || item.name) {
      widgets.push(makeTextWidget(item.title || item.name, 'h3', 'left', { fontSize: '18px', fontWeight: '600', color: tv.text, marginBottom: '8px' }));
    }
    if (item.description || item.text) {
      widgets.push(makeTextWidget(item.description || item.text, 'p', 'left', { fontSize: '15px', color: tv.muted }));
    }
    rows.push(makeRow([makeColumn('10%', [num]), makeColumn('90%', widgets)]));
  });

  section.rows = rows;
  return section;
}

function convertLeadMagnet(content = {}, templateId = '', tv) {
  const section = createSection('lead-magnet');
  section.name = templateId.includes('landscaping') ? 'Landscape Estimator' : 'Vehicle Wrap Designer';
  section.background = {
    type: 'gradient',
    value: `linear-gradient(135deg, ${tv.primary} 0%, ${tv.accent} 100%)`,
    overlay: '',
  };
  section.style.paddingTop = '80px';
  section.style.paddingBottom = '80px';

  const widgets = [];
  widgets.push(makeTextWidget(content.headline || 'Get Your Free Estimate', 'h2', 'center', { fontSize: '36px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }));
  if (content.subheadline) widgets.push(makeTextWidget(content.subheadline, 'p', 'center', { fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }));
  widgets.push(makeButtonGroup([{ text: content.ctaText || 'Get My Estimate', link: '#', variant: 'primary' }], 'center', tv.primary));

  section.rows = [makeRow([makeColumn('100%', widgets)])];
  return section;
}

function convertCustomRow(content = {}, tv) {
  const section = createSection('content');
  section.name = 'Custom Row';
  if (content.bgColor) {
    section.background = { type: 'color', value: content.bgColor, overlay: '' };
  } else {
    section.background = { type: 'color', value: tv.sectionBg, overlay: '' };
  }

  const layoutMap = {
    '1col': ['100%'],
    '2col': ['50%', '50%'],
    '2col-wide-left': ['66%', '34%'],
    '2col-wide-right': ['34%', '66%'],
    '3col': ['33.33%', '33.33%', '33.33%'],
  };
  const widths = layoutMap[content.layout] || ['100%'];
  const templateCols = content.columns || [];

  const cols = widths.map((w, i) => {
    const templateCol = templateCols[i] || { elements: [] };
    const widgets = (templateCol.elements || []).map(el => {
      if (el.type === 'heading') return makeTextWidget(el.text || '', el.tag || 'h2', el.align || 'left', { color: el.color || tv.text });
      if (el.type === 'text') return makeTextWidget(el.text || '', 'p', el.align || 'left', { color: el.color || tv.muted });
      if (el.type === 'image') return makeWidget(WIDGET_TYPES.IMAGE, { src: el.url || '', alt: el.alt || '' });
      if (el.type === 'button') return makeWidget(WIDGET_TYPES.BUTTON, { text: el.text, link: el.link || '#', style: el.style || 'primary', size: el.size || 'medium', primaryColor: tv.primary });
      if (el.type === 'spacer') return makeWidget(WIDGET_TYPES.SPACER, { height: `${el.height || 32}px` });
      if (el.type === 'divider') return makeWidget(WIDGET_TYPES.DIVIDER, { color: el.color || '#e5e7eb' });
      return null;
    }).filter(Boolean);
    return makeColumn(w, widgets);
  });

  section.rows = [makeRow(cols)];
  return section;
}

function convertUnknown(templateId, tv) {
  const section = createSection('content');
  section.name = templateId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  section.background = { type: 'color', value: tv.sectionBg, overlay: '' };
  section.rows = [makeRow([makeColumn('100%', [
    makeTextWidget(`Section: ${section.name}`, 'h3', 'center', { fontSize: '24px', color: tv.muted }),
    makeTextWidget('This section was imported from your generated website. Use the sidebar to add and arrange content.', 'p', 'center', { color: tv.muted }),
  ])])];
  return section;
}

// ============================================
// NAVBAR EXTRACTOR
// ============================================
function extractNavbar(navSection, tv) {
  if (!navSection) return null;
  const c = navSection.content || {};
  const links = (c.links || []).map(l => ({
    id: generateId(),
    label: l.text || l.label || 'Link',
    href: l.url || l.href || '#',
    highlighted: false,
  }));
  if (c.ctaText) {
    links.push({ id: generateId(), label: c.ctaText, href: c.ctaLink || '#contact', highlighted: true });
  }
  return {
    logo: c.logo || c.brandName || 'My Brand',
    backgroundColor: tv ? tv.bg : '#111827',
    textColor: tv ? tv.text : '#ffffff',
    ctaColor: tv ? tv.primary : '#d97706',
    sticky: true,
    links: links.length ? links : createNavbar().links,
  };
}

// ============================================
// MAIN SECTION CONVERTER
// ============================================
function convertSection(section, tv) {
  const t = section.template || '';
  const c = section.content || {};

  if (t.startsWith('hero') || t === 'hero-fullscreen-dark' || t === 'hero-gradient' || t === 'hero-page-banner' || t === 'hero-split-portrait') return convertHero(c, t, tv);
  if (t === 'features-icon-row' || t === 'importance-split' || t === 'split-image-cta' || t === 'before-after-cards') return convertFeatures(c, tv);
  if (t.startsWith('services')) return convertServices(c, tv);
  if (t.startsWith('testimonials')) return convertTestimonials(c, tv);
  if (t === 'review-marquee' || t === 'trust-banner-scroll') return convertTestimonials(c, tv);
  if (t.startsWith('cta')) return convertCta(c, tv);
  if (t === 'contact-split') return convertContact(c, tv);
  if (t.startsWith('benefits')) return convertBenefits(c, tv);
  if (t.startsWith('lead-magnet')) return convertLeadMagnet(c, t, tv);
  if (t === 'custom-row') return convertCustomRow(c, tv);
  if (t === 'gallery-mixed-grid' || t === 'gallery-filtered') {
    const sec = createSection('gallery');
    sec.name = 'Gallery';
    sec.background = { type: 'color', value: tv.sectionBg, overlay: '' };
    sec.rows[0].columns[0].widgets = [
      makeTextWidget(c.title || 'Our Work', 'h2', 'center', { fontSize: '36px', fontWeight: 'bold', color: tv.text, marginBottom: '40px' }),
      { ...createWidget(WIDGET_TYPES.GALLERY), content: { images: (c.items || []).map(i => ({ src: i.url || i.src || '', alt: i.title || '' })), columns: 3, gap: '16px', lightbox: true } },
    ];
    return sec;
  }
  if (t === 'content-block') {
    const sec = createSection('content');
    sec.name = 'Content';
    sec.background = { type: 'color', value: tv.sectionBg, overlay: '' };
    sec.rows[0].columns[0].widgets = [
      makeTextWidget(c.title || '', 'h2', 'left', { fontSize: '28px', fontWeight: 'bold', color: tv.text, marginBottom: '16px' }),
      makeTextWidget(c.body || c.content || c.text || '', 'p', 'left', { fontSize: '16px', color: tv.muted }),
    ].filter(w => w.content.text);
    return sec;
  }
  // Skip footer and standalone nav sections (handled separately)
  if (t.startsWith('footer') || t.startsWith('nav-')) return null;

  return convertUnknown(t, tv);
}

// ============================================
// CONVERT A SINGLE PAGE'S SECTIONS
// ============================================
function convertPageSections(sections = [], tv) {
  // Filter out nav and footer (handled at site level)
  const toConvert = sections.filter(s => {
    const t = s.template || '';
    return !t.startsWith('nav-') && !t.startsWith('footer');
  });
  return toConvert.map(s => convertSection(s, tv)).filter(Boolean);
}

// ============================================
// ENTRY POINT
// ============================================
export function convertFromTemplate(templatePageData, rawTheme = null) {
  if (!templatePageData) return null;

  // Resolve theme: explicit param > schema.theme > defaults
  const resolvedTheme = rawTheme || templatePageData.theme || null;
  const tv = getThemeVars(resolvedTheme);

  // Find navbar from nav section or dedicated nav field
  const navSection = templatePageData.nav || null;
  const navbar = extractNavbar(navSection, tv) || createNavbar();

  if (templatePageData.multiPage && Array.isArray(templatePageData.pages)) {
    // Multi-page: convert each page to widget format
    const pages = templatePageData.pages.map((page, i) => {
      const slug = (page.filename || `page-${i + 1}`).replace('.html', '');
      const name = page.meta?.title || (slug === 'index' ? 'Home' : slug.charAt(0).toUpperCase() + slug.slice(1));
      const sections = convertPageSections(page.sections || [], tv);
      return {
        id: generateId(),
        name,
        slug: slug === 'index' ? 'home' : slug,
        filename: page.filename || `${slug}.html`,
        title: name,
        description: page.meta?.description || '',
        sections,
      };
    });

    return {
      id: generateId(),
      multiPage: true,
      navbar,
      pages,
      theme: resolvedTheme,
      settings: { favicon: '', ogImage: '' },
    };
  }

  // Single-page
  const sections = convertPageSections(templatePageData.sections || [], tv);
  return {
    id: generateId(),
    name: templatePageData.meta?.title || 'Home',
    slug: 'home',
    title: templatePageData.meta?.title || '',
    description: templatePageData.meta?.description || '',
    navbar,
    sections,
    theme: resolvedTheme,
    settings: { favicon: '', ogImage: '' },
  };
}
