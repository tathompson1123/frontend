import { useState, useCallback } from 'react';
import {
  ArrowLeft, Save, RefreshCw, ChevronDown, ChevronRight,
  GripVertical, Trash2, Plus, ChevronUp, Navigation, Layers,
  Image, Type, Link as LinkIcon,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// CONTENT FIELD DEFINITIONS
// Maps section template IDs → editable fields
// ============================================
const TEXT = 'text';
const TEXTAREA = 'textarea';
const URL = 'url';
const IMAGE = 'image';
const ARRAY = 'array';

const CONTENT_FIELDS = {
  'hero-fullscreen-dark': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'highlightText', label: 'Highlight Text', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL },
    { key: 'backgroundImage', label: 'Background Image URL', type: IMAGE },
  ],
  'hero-gradient': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'highlightText', label: 'Highlight Text', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL },
  ],
  'hero-page-banner': [
    { key: 'title', label: 'Title', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'bgImage', label: 'Background Image URL', type: IMAGE },
  ],
  'hero-split-portrait': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL },
    { key: 'portraitImage', label: 'Portrait Image URL', type: IMAGE },
  ],
  'features-icon-row': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'features', label: 'Features', type: ARRAY, itemFields: [
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'title', label: 'Title', type: TEXT },
      { key: 'text', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'importance-split': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'body1', label: 'Body Text 1', type: TEXTAREA },
    { key: 'body2', label: 'Body Text 2', type: TEXTAREA },
    { key: 'image', label: 'Image URL', type: IMAGE },
  ],
  'services-cards-3col': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'CTA Button Text', type: TEXT },
    { key: 'ctaLink', label: 'CTA Button Link', type: URL },
    { key: 'services', label: 'Services', type: ARRAY, itemFields: [
      { key: 'name', label: 'Service Name', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
      { key: 'price', label: 'Price', type: TEXT },
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'image', label: 'Image URL', type: IMAGE },
    ]},
  ],
  'services-carousel': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'services', label: 'Services', type: ARRAY, itemFields: [
      { key: 'name', label: 'Service Name', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
      { key: 'price', label: 'Price', type: TEXT },
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
    ]},
  ],
  'testimonials-3col': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Testimonials', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Quote', type: TEXTAREA },
      { key: 'author', label: 'Author Name', type: TEXT },
      { key: 'role', label: 'Role / Title', type: TEXT },
      { key: 'rating', label: 'Rating (1-5)', type: TEXT },
    ]},
  ],
  'review-marquee': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Reviews', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Quote', type: TEXTAREA },
      { key: 'author', label: 'Author Name', type: TEXT },
      { key: 'role', label: 'Role', type: TEXT },
    ]},
  ],
  'trust-banner-scroll': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Reviews', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Quote', type: TEXTAREA },
      { key: 'author', label: 'Author Name', type: TEXT },
    ]},
  ],
  'cta-gradient-full': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL },
  ],
  'cta-card': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL },
  ],
  'contact-split': [
    { key: 'formTitle', label: 'Section Title', type: TEXT },
    { key: 'formSubtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'submitText', label: 'Submit Button Text', type: TEXT },
    { key: 'phone', label: 'Phone Number', type: TEXT },
    { key: 'email', label: 'Email Address', type: TEXT },
    { key: 'hours', label: 'Business Hours', type: TEXTAREA },
    { key: 'serviceArea', label: 'Service Area', type: TEXT },
    { key: 'businessName', label: 'Business Name', type: TEXT },
  ],
  'benefits-numbered': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'benefits', label: 'Benefits', type: ARRAY, itemFields: [
      { key: 'title', label: 'Title', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'benefits-cards': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'benefits', label: 'Benefits', type: ARRAY, itemFields: [
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'title', label: 'Title', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'before-after-cards': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'items', label: 'Before/After Items', type: ARRAY, itemFields: [
      { key: 'label', label: 'Label', type: TEXT },
      { key: 'before', label: 'Before Image URL', type: IMAGE },
      { key: 'after', label: 'After Image URL', type: IMAGE },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'gallery-mixed-grid': [
    { key: 'title', label: 'Gallery Title', type: TEXT },
    { key: 'items', label: 'Gallery Images', type: ARRAY, itemFields: [
      { key: 'url', label: 'Image URL', type: IMAGE },
      { key: 'title', label: 'Caption', type: TEXT },
    ]},
  ],
  'gallery-filtered': [
    { key: 'title', label: 'Gallery Title', type: TEXT },
    { key: 'items', label: 'Gallery Images', type: ARRAY, itemFields: [
      { key: 'url', label: 'Image URL', type: IMAGE },
      { key: 'title', label: 'Caption', type: TEXT },
      { key: 'category', label: 'Category', type: TEXT },
    ]},
  ],
  'split-image-cta': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'body', label: 'Body Text', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL },
    { key: 'image', label: 'Image URL', type: IMAGE },
  ],
  'content-block': [
    { key: 'title', label: 'Title', type: TEXT },
    { key: 'body', label: 'Body Text', type: TEXTAREA },
  ],
};

// Default content for adding new sections
const SECTION_DEFAULTS = {
  'hero-fullscreen-dark': { headline: 'Your Headline Here', subtitle: 'Your subtitle text here.', ctaText: 'Get Started', ctaLink: '#contact' },
  'features-icon-row': { title: 'Our Features', features: [{ icon: '⭐', title: 'Feature 1', text: 'Description here.' }] },
  'services-cards-3col': { title: 'Our Services', services: [{ name: 'Service 1', description: 'Description here.', price: '' }] },
  'testimonials-3col': { title: 'What Customers Say', testimonials: [{ quote: 'Great service!', author: 'Customer Name', role: 'Happy Client', rating: 5 }] },
  'cta-gradient-full': { headline: 'Ready to Get Started?', subtitle: 'Contact us today.', ctaText: 'Contact Us', ctaLink: '#contact' },
  'cta-card': { headline: 'Ready to Get Started?', subtitle: 'Contact us today.', ctaText: 'Contact Us', ctaLink: '#contact' },
  'contact-split': { formTitle: 'Get in Touch', phone: '', email: '', hours: 'Mon-Fri 8am-6pm' },
  'benefits-numbered': { title: 'Why Choose Us', benefits: [{ title: 'Benefit 1', description: 'Description here.' }] },
  'gallery-mixed-grid': { title: 'Our Work', items: [] },
  'content-block': { title: 'About Us', body: 'Tell your story here.' },
};

// Template display names and icons for the section picker
const SECTION_TEMPLATES_LIST = [
  { id: 'hero-fullscreen-dark', name: 'Hero Banner', icon: '🦸' },
  { id: 'features-icon-row', name: 'Features', icon: '⭐' },
  { id: 'services-cards-3col', name: 'Services', icon: '📦' },
  { id: 'testimonials-3col', name: 'Testimonials', icon: '💬' },
  { id: 'cta-gradient-full', name: 'Call to Action', icon: '🎯' },
  { id: 'contact-split', name: 'Contact Form', icon: '📩' },
  { id: 'benefits-numbered', name: 'Benefits', icon: '✅' },
  { id: 'gallery-mixed-grid', name: 'Gallery', icon: '🖼️' },
  { id: 'split-image-cta', name: 'Image + Text', icon: '🖼️' },
  { id: 'content-block', name: 'Text Block', icon: '📝' },
];

// Get section display name from template ID
function getSectionName(template) {
  const found = SECTION_TEMPLATES_LIST.find(t => t.id === template);
  if (found) return found.name;
  return (template || 'Section')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getSectionIcon(template) {
  const found = SECTION_TEMPLATES_LIST.find(t => t.id === template);
  return found?.icon || '📄';
}

// Generate a unique ID
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================
// FIELD RENDERERS
// ============================================
function FieldInput({ field, value, onChange }) {
  const base = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 bg-white';

  if (field.type === TEXTAREA) {
    return (
      <textarea
        rows={3}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={base}
        placeholder={field.label}
      />
    );
  }

  if (field.type === ARRAY) {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {field.label.replace(/s$/, '')} {i + 1}
              </span>
              <button
                onClick={() => {
                  const updated = [...items];
                  updated.splice(i, 1);
                  onChange(updated);
                }}
                className="text-red-400 hover:text-red-600 text-xs px-2 py-0.5 rounded hover:bg-red-50 transition"
              >
                Remove
              </button>
            </div>
            <div className="space-y-2">
              {(field.itemFields || []).map(subField => (
                <div key={subField.key}>
                  <label className="block text-xs text-gray-400 mb-1">{subField.label}</label>
                  <FieldInput
                    field={subField}
                    value={item[subField.key] || ''}
                    onChange={val => {
                      const updated = [...items];
                      updated[i] = { ...updated[i], [subField.key]: val };
                      onChange(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => {
            const template = {};
            (field.itemFields || []).forEach(f => { template[f.key] = ''; });
            onChange([...items, template]);
          }}
          className="w-full py-2 text-sm text-amber-600 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition font-medium"
        >
          + Add {field.label.replace(/s$/, '')}
        </button>
      </div>
    );
  }

  if (field.type === IMAGE) {
    return (
      <div className="space-y-1">
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={base}
          placeholder="https://example.com/image.jpg"
        />
        {value && (
          <img src={value} alt="preview" className="w-full h-24 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display = 'none'} />
        )}
      </div>
    );
  }

  return (
    <input
      type={field.type === URL ? 'url' : 'text'}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={base}
      placeholder={field.label}
    />
  );
}

// ============================================
// SECTION CONTENT FORM
// Renders all editable fields for a section
// ============================================
function SectionContentForm({ section, onContentChange }) {
  const fields = CONTENT_FIELDS[section.template];

  if (!fields) {
    // Generic fallback: show all string values in content as text inputs
    const entries = Object.entries(section.content || {}).filter(([, v]) => typeof v === 'string');
    if (entries.length === 0) {
      return (
        <div className="p-4 text-sm text-gray-400 text-center">
          No editable fields for this section type.<br />
          <span className="text-xs text-gray-300">{section.template}</span>
        </div>
      );
    }
    return (
      <div className="space-y-3 p-4">
        {entries.map(([key, val]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
            </label>
            <input
              type="text"
              value={val}
              onChange={e => onContentChange(key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {field.label}
          </label>
          <FieldInput
            field={field}
            value={section.content?.[field.key]}
            onChange={val => onContentChange(field.key, val)}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================
// NAV CONTENT FORM
// ============================================
function NavContentForm({ navSection, onChange }) {
  if (!navSection) {
    return <p className="p-4 text-sm text-gray-400">No navigation found in this website.</p>;
  }
  const c = navSection.content || {};

  const updateField = (key, val) => {
    onChange({ ...navSection, content: { ...c, [key]: val } });
  };

  const links = Array.isArray(c.links) ? c.links : [];

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Logo / Brand Name</label>
        <input
          type="text"
          value={c.logo || c.brandName || ''}
          onChange={e => updateField(c.logo !== undefined ? 'logo' : 'brandName', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Button Text</label>
        <input
          type="text"
          value={c.ctaText || ''}
          onChange={e => updateField('ctaText', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Link</label>
        <input
          type="url"
          value={c.ctaLink || ''}
          onChange={e => updateField('ctaLink', e.target.value)}
          placeholder="#contact"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Nav Links</label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.text || link.label || ''}
                onChange={e => {
                  const updated = [...links];
                  updated[i] = { ...updated[i], text: e.target.value, label: e.target.value };
                  updateField('links', updated);
                }}
                placeholder="Link text"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
              />
              <input
                type="text"
                value={link.url || link.href || ''}
                onChange={e => {
                  const updated = [...links];
                  updated[i] = { ...updated[i], url: e.target.value, href: e.target.value };
                  updateField('links', updated);
                }}
                placeholder="#section"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
              />
              <button
                onClick={() => {
                  const updated = [...links];
                  updated.splice(i, 1);
                  updateField('links', updated);
                }}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => updateField('links', [...links, { text: 'New Link', label: 'New Link', url: '#', href: '#' }])}
            className="w-full py-1.5 text-sm text-amber-600 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition font-medium"
          >
            + Add Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACCORDION CARD
// ============================================
function SidebarCard({ id, label, icon, openCard, setOpenCard, badge, children }) {
  const isOpen = openCard === id;
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpenCard(isOpen ? null : id)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-gray-500">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
        {badge != null && (
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">{badge}</span>
        )}
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-gray-400" />
          : <ChevronRight className="w-4 h-4 text-gray-400" />
        }
      </button>
      {isOpen && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ============================================
// MAIN TEMPLATE EDITOR
// ============================================
export default function TemplateEditor({ initialSchema, initialHtml, onSave, onBack }) {
  const [schema, setSchema] = useState(() => JSON.parse(JSON.stringify(initialSchema || {})));
  const [previewHtml, setPreviewHtml] = useState(initialHtml || '');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [openCard, setOpenCard] = useState('sections');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  // Get the sections array (single-page or active page of multi-page)
  const getSections = useCallback((s) => {
    if (s.multiPage && Array.isArray(s.pages) && s.pages.length > 0) {
      return s.pages[0].sections || [];
    }
    return s.sections || [];
  }, []);

  const setSections = useCallback((s, newSections) => {
    const updated = JSON.parse(JSON.stringify(s));
    if (updated.multiPage && Array.isArray(updated.pages) && updated.pages.length > 0) {
      updated.pages[0].sections = newSections;
    } else {
      updated.sections = newSections;
    }
    return updated;
  }, []);

  // Editable sections = all except nav and footer
  const editableSections = getSections(schema).filter(s => {
    const t = s.template || '';
    return !t.startsWith('nav-') && !t.startsWith('footer');
  });

  // Find nav section
  const navSection = schema.nav || getSections(schema).find(s => (s.template || '').startsWith('nav-')) || null;

  // ============================================
  // MUTATIONS
  // ============================================
  const updateSectionContent = useCallback((idx, key, val) => {
    setSchema(prev => {
      const sections = getSections(prev);
      const editIdx = getSections(prev)
        .filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'))
        .findIndex((_, i) => i === idx);
      // Find actual index in full sections array
      const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
      const actualSection = editables[idx];
      if (!actualSection) return prev;
      const actualIdx = sections.indexOf(actualSection);
      if (actualIdx === -1) return prev;

      const updated = JSON.parse(JSON.stringify(prev));
      const updatedSections = getSections(updated);
      updatedSections[actualIdx] = {
        ...updatedSections[actualIdx],
        content: { ...updatedSections[actualIdx].content, [key]: val },
      };
      return setSections(updated, updatedSections);
    });
  }, [getSections, setSections]);

  const moveSection = useCallback((idx, direction) => {
    setSchema(prev => {
      const sections = [...getSections(prev)];
      const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
      const section = editables[idx];
      const actualIdx = sections.indexOf(section);
      const targetIdx = direction === 'up' ? actualIdx - 1 : actualIdx + 1;
      if (targetIdx < 0 || targetIdx >= sections.length) return prev;
      // Swap, but skip nav/footer when looking for swap target
      const temp = sections[targetIdx];
      sections[targetIdx] = sections[actualIdx];
      sections[actualIdx] = temp;
      return setSections(JSON.parse(JSON.stringify(prev)), sections);
    });
    setSelectedIdx(null);
  }, [getSections, setSections]);

  const deleteSection = useCallback((idx) => {
    setSchema(prev => {
      const sections = getSections(prev);
      const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
      const section = editables[idx];
      const actualIdx = sections.indexOf(section);
      if (actualIdx === -1) return prev;
      const updated = sections.filter((_, i) => i !== actualIdx);
      return setSections(JSON.parse(JSON.stringify(prev)), updated);
    });
    setSelectedIdx(null);
  }, [getSections, setSections]);

  const addSection = useCallback((templateId) => {
    const defaultContent = SECTION_DEFAULTS[templateId] || {};
    const newSection = {
      id: genId(),
      template: templateId,
      content: JSON.parse(JSON.stringify(defaultContent)),
    };
    setSchema(prev => {
      const sections = [...getSections(prev)];
      // Insert before footer if present, else append
      const footerIdx = sections.findIndex(s => (s.template || '').startsWith('footer'));
      if (footerIdx !== -1) {
        sections.splice(footerIdx, 0, newSection);
      } else {
        sections.push(newSection);
      }
      return setSections(JSON.parse(JSON.stringify(prev)), sections);
    });
    setShowAddSection(false);
  }, [getSections, setSections]);

  const updateNav = useCallback((updatedNavSection) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated.nav) {
        updated.nav = updatedNavSection;
      } else {
        // Nav might be in sections array
        const sections = getSections(updated);
        const navIdx = sections.findIndex(s => (s.template || '').startsWith('nav-'));
        if (navIdx !== -1) {
          sections[navIdx] = updatedNavSection;
          return setSections(updated, sections);
        }
      }
      return updated;
    });
  }, [getSections, setSections]);

  // ============================================
  // REFRESH PREVIEW
  // ============================================
  const refreshPreview = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/website/render-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ page_data: schema }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html);
      } else {
        console.error('Preview render failed:', await res.text());
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [schema]);

  // ============================================
  // SAVE
  // ============================================
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(schema);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800">Website Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title="Refresh canvas preview"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Navigation card */}
            <SidebarCard
              id="nav"
              label="Navigation"
              icon={<Navigation className="w-5 h-5" />}
              openCard={openCard}
              setOpenCard={setOpenCard}
            >
              <NavContentForm navSection={navSection} onChange={updateNav} />
            </SidebarCard>

            {/* Sections card */}
            <SidebarCard
              id="sections"
              label="Sections"
              icon={<Layers className="w-5 h-5" />}
              openCard={openCard}
              setOpenCard={setOpenCard}
              badge={editableSections.length}
            >
              {selectedIdx === null ? (
                /* Section list */
                <div>
                  <div className="divide-y divide-gray-100">
                    {editableSections.map((section, i) => (
                      <div
                        key={section.id || i}
                        className="flex items-center gap-2 px-3 py-3 hover:bg-white group cursor-pointer transition"
                        onClick={() => setSelectedIdx(i)}
                      >
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <span className="text-lg flex-shrink-0">{getSectionIcon(section.template)}</span>
                        <span className="flex-1 text-sm text-gray-700 font-medium truncate">
                          {getSectionName(section.template)}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(i, 'up'); }}
                            disabled={i === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(i, 'down'); }}
                            disabled={i === editableSections.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm('Delete this section?')) deleteSection(i);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Delete section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Section button */}
                  {!showAddSection ? (
                    <div className="p-3 border-t border-gray-100">
                      <button
                        onClick={() => setShowAddSection(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-amber-600 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Section
                      </button>
                    </div>
                  ) : (
                    /* Section template picker */
                    <div className="p-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose Section Type</span>
                        <button onClick={() => setShowAddSection(false)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTION_TEMPLATES_LIST.map(tmpl => (
                          <button
                            key={tmpl.id}
                            onClick={() => addSection(tmpl.id)}
                            className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition text-center"
                          >
                            <span className="text-2xl">{tmpl.icon}</span>
                            <span className="text-xs font-medium text-gray-700 leading-tight">{tmpl.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Section content editor */
                <div>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
                    <button
                      onClick={() => setSelectedIdx(null)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      Sections
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {getSectionName(editableSections[selectedIdx]?.template || '')}
                    </span>
                  </div>
                  {editableSections[selectedIdx] && (
                    <SectionContentForm
                      section={editableSections[selectedIdx]}
                      onContentChange={(key, val) => updateSectionContent(selectedIdx, key, val)}
                    />
                  )}
                </div>
              )}
            </SidebarCard>
          </div>

          {/* Hint */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Edit content in the sidebar, then click<br />
              <strong className="text-gray-500">Refresh Preview</strong> to see changes.
            </p>
          </div>
        </div>

        {/* Canvas — iframe with the real rendered HTML */}
        <div className="flex-1 bg-gray-300 overflow-hidden relative">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">No preview yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Refresh Preview" to load your website</p>
              </div>
            </div>
          )}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                Re-rendering with your changes...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
