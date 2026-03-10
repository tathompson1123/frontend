import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Save, RefreshCw, ChevronDown, ChevronRight,
  GripVertical, Trash2, Plus, ChevronUp, Navigation, Layers,
  Palette, Upload, X, Monitor, Smartphone, Tablet, PanelBottom,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Inject highlight listener into rendered HTML so the iframe can respond to postMessage
function injectHighlightScript(html) {
  const script = `<style>
.sorce-glow{outline:3px solid #f59e0b!important;box-shadow:0 0 0 6px rgba(245,158,11,0.18)!important;transition:outline 0.15s,box-shadow 0.15s;position:relative;z-index:1;}
a[class*="logo"],a[class*="brand"],[class*="logo"]>a,[class*="brand"]>a,[class*="-nav-"]>a:first-child{pointer-events:none!important;cursor:default!important;}
</style><script>
// Prevent page/app navigation in editor preview; allow # anchors, empty hrefs, and javascript: calls
document.addEventListener('click',function(e){
  var a=e.target.closest('a');
  if(a){var h=a.getAttribute('href')||'';if(h&&!h.startsWith('#')&&!h.startsWith('javascript:'))e.preventDefault();}
},true);
// Prevent form submissions from navigating the iframe
document.addEventListener('submit',function(e){e.preventDefault();},true);
// postMessage bridge: highlight, scroll capture/restore
window.addEventListener('message',function(e){
  if(!e.data)return;
  if(e.data.type==='sorce-highlight'){
    document.querySelectorAll('.sorce-glow').forEach(function(el){el.classList.remove('sorce-glow');});
    if(e.data.id){var el=document.getElementById(e.data.id);if(el)el.classList.add('sorce-glow');}
  }
  if(e.data.type==='sorce-get-scroll'){
    try{window.parent.postMessage({type:'sorce-scroll-pos',y:window.scrollY},'*');}catch(err){}
  }
  if(e.data.type==='sorce-scroll-to'){
    try{window.scrollTo(0,e.data.y||0);}catch(err){}
  }
});
<\/script>`;
  return html.includes('</body>') ? html.replace('</body>', script + '</body>') : html + script;
}

// ============================================
// GOOGLE FONTS AVAILABLE IN THEMES
// ============================================
const HEADING_FONTS = [
  'Montserrat', 'Playfair Display', 'Lora', 'Cormorant Garamond',
  'Raleway', 'Oswald', 'Bebas Neue', 'Abril Fatface', 'Nunito',
  'Poppins', 'Inter', 'Roboto', 'Open Sans',
];
const BODY_FONTS = [
  'Rajdhani', 'Archivo', 'Montserrat', 'Open Sans', 'Inter',
  'Roboto', 'Lato', 'Nunito', 'Source Sans Pro', 'Work Sans',
  'DM Sans', 'Manrope',
];

// ============================================
// CONTENT FIELD DEFINITIONS
// ============================================
const TEXT = 'text';
const TEXTAREA = 'textarea';
const URL_FIELD = 'url';
const IMAGE = 'image';
const ARRAY = 'array';
const COLOR = 'color';

const CONTENT_FIELDS = {
  'hero-fullscreen-dark': [
    { key: 'badge', label: 'Badge / Small Label (above headline)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'highlightText', label: 'Highlight Text (colored accent)', type: TEXT },
    { key: 'subtitle', label: 'Subtitle / Description', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL_FIELD },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL_FIELD },
    { key: 'backgroundImage', label: 'Background Image', type: IMAGE },
  ],
  'hero-fullscreen-light': [
    { key: 'badge', label: 'Badge / Small Label (above headline)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'highlightText', label: 'Highlight Text (colored accent)', type: TEXT },
    { key: 'subtitle', label: 'Subtitle / Description', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL_FIELD },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL_FIELD },
    { key: 'backgroundImage', label: 'Background Image', type: IMAGE },
  ],
  'hero-gradient': [
    { key: 'badge', label: 'Badge / Small Label (above headline)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle / Description', type: TEXTAREA },
    { key: 'features', label: 'Feature Pills', type: ARRAY, itemFields: [
      { key: 'text', label: 'Feature Text', type: TEXT },
    ]},
  ],
  'hero-page-banner': [
    { key: 'title', label: 'Title', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'bgImage', label: 'Background Image', type: IMAGE },
  ],
  'hero-split-portrait': [
    { key: 'badge', label: 'Badge / Small Label (above headline)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'highlightText', label: 'Highlight Text (italic color)', type: TEXT },
    { key: 'subtitle', label: 'Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL_FIELD },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL_FIELD },
    { key: 'portraitImage', label: 'Portrait / Profile Image', type: IMAGE },
    { key: 'bgImage', label: 'Background Image (low opacity overlay)', type: IMAGE },
    { key: 'floatBadge', label: 'Floating Badge Number (e.g. "25+")', type: TEXT },
    { key: 'floatBadgeLabel', label: 'Floating Badge Label', type: TEXT },
  ],
  'features-icon-row': [
    { key: 'features', label: 'Features', type: ARRAY, itemFields: [
      { key: 'icon', label: 'Icon (emoji or symbol)', type: TEXT },
      { key: 'title', label: 'Feature Title', type: TEXT },
      { key: 'text', label: 'Feature Description', type: TEXTAREA },
    ]},
  ],
  'importance-split': [
    { key: 'badge', label: 'Badge / Small Label (above headline)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'body1', label: 'Body Text 1', type: TEXTAREA },
    { key: 'body2', label: 'Body Text 2', type: TEXTAREA },
    { key: 'highlights', label: 'Highlight Points', type: ARRAY, itemFields: [
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'text', label: 'Highlight Text', type: TEXT },
    ]},
    { key: 'image', label: 'Side Image', type: IMAGE },
    { key: 'imageAlt', label: 'Image Alt Text', type: TEXT },
  ],
  'split-image-cta': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'body', label: 'Body Text', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL_FIELD },
    { key: 'image', label: 'Side Image', type: IMAGE },
  ],
  'services-cards-3col': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL_FIELD },
    { key: 'services', label: 'Services', type: ARRAY, itemFields: [
      { key: 'name', label: 'Service Name', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
      { key: 'price', label: 'Price (optional)', type: TEXT },
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'image', label: 'Service Image', type: IMAGE },
    ]},
  ],
  'services-carousel': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'services', label: 'Services', type: ARRAY, itemFields: [
      { key: 'name', label: 'Service Name', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
      { key: 'price', label: 'Price (optional)', type: TEXT },
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'image', label: 'Service Image', type: IMAGE },
    ]},
  ],
  'testimonials-3col': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Testimonials', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Quote / Review Text', type: TEXTAREA },
      { key: 'author', label: 'Customer Name', type: TEXT },
      { key: 'role', label: 'Role / Location (optional)', type: TEXT },
      { key: 'rating', label: 'Star Rating (1–5)', type: TEXT },
    ]},
  ],
  'review-marquee': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Reviews', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Review Text', type: TEXTAREA },
      { key: 'author', label: 'Customer Name', type: TEXT },
      { key: 'role', label: 'Role (optional)', type: TEXT },
    ]},
  ],
  'trust-banner-scroll': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'testimonials', label: 'Reviews', type: ARRAY, itemFields: [
      { key: 'quote', label: 'Review Text', type: TEXTAREA },
      { key: 'author', label: 'Customer Name', type: TEXT },
    ]},
  ],
  'cta-gradient-full': [
    { key: 'badge', label: 'Badge / Small Label (optional)', type: TEXT },
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle / Supporting Text', type: TEXTAREA },
    { key: 'ctaText', label: 'Primary Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Primary Button Link', type: URL_FIELD },
    { key: 'ctaText2', label: 'Secondary Button Text', type: TEXT },
    { key: 'ctaLink2', label: 'Secondary Button Link', type: URL_FIELD },
    { key: 'features', label: 'Feature Pills (optional)', type: ARRAY, itemFields: [
      { key: 'text', label: 'Feature Text', type: TEXT },
    ]},
  ],
  'cta-card': [
    { key: 'headline', label: 'Headline', type: TEXT },
    { key: 'subtitle', label: 'Subtitle / Supporting Text', type: TEXTAREA },
    { key: 'ctaText', label: 'Button Text', type: TEXT },
    { key: 'ctaLink', label: 'Button Link', type: URL_FIELD },
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
      { key: 'title', label: 'Benefit Title', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'benefits-cards': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'benefits', label: 'Benefits', type: ARRAY, itemFields: [
      { key: 'icon', label: 'Icon (emoji)', type: TEXT },
      { key: 'title', label: 'Benefit Title', type: TEXT },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'before-after-cards': [
    { key: 'title', label: 'Section Title', type: TEXT },
    { key: 'subtitle', label: 'Section Subtitle', type: TEXTAREA },
    { key: 'items', label: 'Before/After Items', type: ARRAY, itemFields: [
      { key: 'label', label: 'Item Label', type: TEXT },
      { key: 'before', label: 'Before Image', type: IMAGE },
      { key: 'after', label: 'After Image', type: IMAGE },
      { key: 'description', label: 'Description', type: TEXTAREA },
    ]},
  ],
  'gallery-mixed-grid': [
    { key: 'title', label: 'Gallery Title', type: TEXT },
    { key: 'items', label: 'Photos', type: ARRAY, itemFields: [
      { key: 'url', label: 'Photo', type: IMAGE },
      { key: 'title', label: 'Caption (optional)', type: TEXT },
    ]},
  ],
  'gallery-filtered': [
    { key: 'title', label: 'Gallery Title', type: TEXT },
    { key: 'items', label: 'Photos', type: ARRAY, itemFields: [
      { key: 'url', label: 'Photo', type: IMAGE },
      { key: 'title', label: 'Caption (optional)', type: TEXT },
      { key: 'category', label: 'Filter Category', type: TEXT },
    ]},
  ],
  'content-block': [
    { key: 'heading', label: 'Heading', type: TEXT },
    { key: 'text', label: 'Body Text', type: TEXTAREA },
    { key: 'imageUrl', label: 'Image (optional)', type: IMAGE },
    { key: 'buttonText', label: 'Button Text (optional)', type: TEXT },
    { key: 'buttonLink', label: 'Button Link (optional)', type: URL_FIELD },
  ],
  'footer-4col-dark': [
    { key: 'logo',            label: 'Business Name',         type: TEXT },
    { key: 'tagline',         label: 'Tagline',               type: TEXTAREA },
    { key: 'phone',           label: 'Phone Number',          type: TEXT },
    { key: 'email',           label: 'Email Address',         type: TEXT },
    { key: 'hours',           label: 'Business Hours',        type: TEXTAREA },
    { key: 'services',        label: 'Services List',         type: ARRAY, itemFields: [
      { key: 'text', label: 'Service Name', type: TEXT },
    ]},
    { key: 'footerLinks',     label: 'Quick Links (Navigation)', type: ARRAY, itemFields: [
      { key: 'text', label: 'Link Text', type: TEXT },
      { key: 'url',  label: 'URL',       type: URL_FIELD },
    ]},
    { key: 'socialLabel',     label: 'Social Media Label (e.g. "Follow us")', type: TEXT },
    { key: 'socialFacebook',  label: 'Facebook URL',          type: TEXT },
    { key: 'socialInstagram', label: 'Instagram URL',         type: TEXT },
    { key: 'socialGoogle',    label: 'Google Business URL',   type: TEXT },
    { key: 'socialTiktok',    label: 'TikTok URL',            type: TEXT },
    { key: 'socialX',         label: 'X (Twitter) URL',       type: TEXT },
    { key: 'privacyUrl',      label: 'Privacy Policy URL',    type: URL_FIELD },
    { key: 'termsUrl',        label: 'Terms of Service URL',  type: URL_FIELD },
  ],
};

// Default content for adding new sections
const SECTION_DEFAULTS = {
  'hero-fullscreen-dark': { headline: 'Your Headline Here', subtitle: 'Describe what makes you different in one sentence.', ctaText: 'Get Started', ctaLink: '#contact', backgroundImage: '' },
  'features-icon-row': { title: 'Our Features', subtitle: '', features: [{ icon: '⭐', title: 'Feature 1', text: 'What makes this feature great.' }, { icon: '🚀', title: 'Feature 2', text: 'What makes this feature great.' }, { icon: '💡', title: 'Feature 3', text: 'What makes this feature great.' }] },
  'services-cards-3col': { title: 'Our Services', subtitle: '', ctaText: 'Get a Quote', ctaLink: '#contact', services: [{ name: 'Service 1', description: 'Description of this service.', price: '', icon: '🔧' }, { name: 'Service 2', description: 'Description of this service.', price: '', icon: '⚡' }, { name: 'Service 3', description: 'Description of this service.', price: '', icon: '✅' }] },
  'testimonials-3col': { title: 'What Customers Say', testimonials: [{ quote: 'Amazing service! Highly recommend to everyone.', author: 'Customer Name', role: 'Happy Client', rating: 5 }] },
  'cta-gradient-full': { headline: 'Ready to Get Started?', subtitle: 'Contact us today for a free consultation.', ctaText: 'Contact Us', ctaLink: '#contact' },
  'cta-card': { headline: 'Ready to Get Started?', subtitle: 'We\'re here to help.', ctaText: 'Contact Us', ctaLink: '#contact' },
  'contact-split': { formTitle: 'Get in Touch', formSubtitle: 'We\'d love to hear from you.', phone: '', email: '', hours: 'Mon–Fri: 8am–6pm', submitText: 'Send Message' },
  'benefits-numbered': { title: 'Why Choose Us', subtitle: '', benefits: [{ title: 'Benefit 1', description: 'Why this matters to your customers.' }, { title: 'Benefit 2', description: 'Why this matters to your customers.' }] },
  'gallery-mixed-grid': { title: 'Our Work', items: [] },
  'split-image-cta': { headline: 'About Us', body: 'Tell your story here.', ctaText: 'Learn More', ctaLink: '#contact', image: '' },
  'content-block': { heading: 'About Us', text: 'Tell your story here.' },
};

// Section template picker options
const SECTION_TEMPLATES_LIST = [
  { id: 'hero-fullscreen-dark', name: 'Hero Banner', icon: '🦸', desc: 'Big hero with headline and CTA buttons' },
  { id: 'features-icon-row', name: 'Features', icon: '⭐', desc: 'Grid of feature highlights with icons' },
  { id: 'services-cards-3col', name: 'Services', icon: '📦', desc: 'Service cards in a 3-column grid' },
  { id: 'testimonials-3col', name: 'Testimonials', icon: '💬', desc: 'Customer reviews and ratings' },
  { id: 'cta-gradient-full', name: 'Call to Action', icon: '🎯', desc: 'Full-width CTA with gradient' },
  { id: 'cta-card', name: 'CTA Card', icon: '📣', desc: 'Compact call-to-action card' },
  { id: 'contact-split', name: 'Contact Form', icon: '📩', desc: 'Contact details and lead form' },
  { id: 'benefits-numbered', name: 'Benefits', icon: '✅', desc: 'Numbered list of key benefits' },
  { id: 'gallery-mixed-grid', name: 'Photo Gallery', icon: '🖼️', desc: 'Grid of photos / portfolio' },
  { id: 'split-image-cta', name: 'Image + Text', icon: '🖼️', desc: 'Side-by-side image and text block' },
  { id: 'content-block', name: 'Text Block', icon: '📝', desc: 'Simple text content block' },
];

function getSectionName(template) {
  const found = SECTION_TEMPLATES_LIST.find(t => t.id === template);
  if (found) return found.name;
  return (template || 'Section').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function getSectionIcon(template) {
  return SECTION_TEMPLATES_LIST.find(t => t.id === template)?.icon || '📄';
}
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================
// IMAGE UPLOAD FIELD
// ============================================
function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url || data.secure_url || '');
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100" style={{ height: 100 }}>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={e => e.target.style.display = 'none'}
          />
          <button
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Upload / URL row */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex-shrink-0"
        >
          {uploading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Or paste image URL"
          className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 bg-white"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

// ============================================
// LINK PICKER FIELD — section dropdown (+ optional pages)
// ============================================
const PAGE_OPTIONS = [
  { label: 'Home', value: '/' },
  { label: 'About', value: '/about' },
  { label: 'Services', value: '/services' },
  { label: 'Contact Form', value: '/contact' },
  { label: 'Online Booking', value: '/booking' },
  { label: 'Portfolio', value: '/portfolio' },
  { label: 'Gallery', value: '/gallery' },
  { label: 'Blog', value: '/blog' },
  { label: 'Pricing', value: '/pricing' },
];

// Normalize page paths for matching: strip .html, strip leading /, lowercase
function normPath(p = '') {
  let s = p.replace(/\.html$/, '').replace(/^\//, '').toLowerCase();
  if (s === '' || s === 'index') return 'home';
  return s;
}

function LinkPickerField({ value, onChange, sections = [], includePages = false }) {
  const sectionOptions = [
    { label: 'Top of Page', value: '#top' },
    ...sections.map(s => ({
      label: getSectionName(s.template),
      value: `#${s.id || s.template}`,
    })),
  ];
  const allKnown = includePages ? [...PAGE_OPTIONS, ...sectionOptions] : sectionOptions;
  // Normalize match so gallery.html matches /gallery, about.html matches /about, etc.
  const matchedOption = value
    ? allKnown.find(o => o.value === value || (includePages && !value.startsWith('#') && normPath(o.value) === normPath(value)))
    : null;
  const hasCustomValue = value && !matchedOption;

  return (
    <div className="space-y-1.5">
      {includePages ? (
        <select
          value={matchedOption ? matchedOption.value : (value || '')}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
        >
          <option value="">— Select destination —</option>
          <optgroup label="Pages">
            {PAGE_OPTIONS.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
          <optgroup label="Sections on this page">
            {sectionOptions.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        </select>
      ) : (
        <select
          value={matchedOption ? matchedOption.value : (value || '')}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
        >
          <option value="">— Select section —</option>
          {sectionOptions.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      {hasCustomValue && (
        <p className="text-xs text-amber-600 font-mono truncate">Current: {value}</p>
      )}
    </div>
  );
}

// ============================================
// GOOGLE REVIEW IMPORT BUTTON + MODAL
// ============================================
function ReviewImportButton({ onImport }) {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('above');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const token = localStorage.getItem('token');
      const isPlaceId = query.startsWith('ChIJ');
      const body = isPlaceId ? { placeId: query } : { query };
      const res = await fetch(`${API_URL}/api/google-business/fetch-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) setResults(data);
      else alert(data.error || 'Failed to fetch reviews');
    } catch {
      alert('Failed to fetch reviews. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!results?.reviews) return;
    const filtered = results.reviews.filter(r => {
      const stars = r.stars || r.rating || 5;
      return filter === 'above' ? stars >= 4 : stars < 4;
    });
    if (!filtered.length) { alert('No reviews match that filter. Try the other option.'); return; }
    const testimonials = filtered.map(r => ({
      quote: r.text,
      author: r.name,
      role: 'Verified Customer',
      rating: String(r.stars || r.rating || 5),
    }));
    onImport(testimonials);
    setShow(false);
    setQuery('');
    setResults(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition font-semibold"
      >
        ★ Import from Google Reviews
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Import Google Reviews</h2>
                <p className="text-xs text-gray-500">Pull real reviews from your Google Business Profile</p>
              </div>
              <button onClick={() => { setShow(false); setResults(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search your business name</label>
              <div className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Joe's Auto Detailing Dallas"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
                <button
                  onClick={search}
                  disabled={loading || !query.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 flex-shrink-0 text-sm font-medium"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>★</span>}
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Enter business name and city, or a Google Place ID</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Which reviews to import?</label>
                <div className="flex gap-2">
                  {[
                    { id: 'above', label: '4 stars & above', stars: '★★★★★' },
                    { id: 'below', label: 'Under 4 stars', stars: '★★★☆☆' },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setFilter(opt.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 text-xs font-medium transition ${
                        filter === opt.id
                          ? opt.id === 'above' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-red-400 bg-red-50 text-red-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.stars} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {results && (() => {
                const visible = (results.reviews || []).filter(r => {
                  const stars = r.stars || r.rating || 5;
                  return filter === 'above' ? stars >= 4 : stars < 4;
                });
                return (
                  <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{results.businessName}</p>
                      <p className="text-sm text-gray-600">
                        {results.averageRating} ★ · {results.totalReviews} total · <strong>{visible.length}</strong> match filter
                      </p>
                    </div>
                    {visible.length === 0 ? (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">No reviews match this filter. Try the other option.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {visible.map((r, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{r.name}</span>
                              <span className="text-amber-500">{'★'.repeat(r.stars || r.rating || 5)}</span>
                              <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button onClick={() => { setShow(false); setResults(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              {results && (
                <button onClick={apply} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
                  ★ Use These Reviews
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// FIELD INPUT (handles all field types)
// ============================================
function FieldInput({ field, value, onChange, sections }) {
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 bg-white';

  if (field.type === TEXTAREA) {
    return (
      <textarea
        rows={3}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={inputClass}
        placeholder={field.label}
      />
    );
  }

  if (field.type === IMAGE) {
    return <ImageUploadField value={value || ''} onChange={onChange} />;
  }

  if (field.type === COLOR) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white font-mono"
          placeholder="#000000"
        />
      </div>
    );
  }

  if (field.type === URL_FIELD) {
    return <LinkPickerField value={value || ''} onChange={onChange} sections={sections} includePages={true} />;
  }

  if (field.type === ARRAY) {
    const items = Array.isArray(value) ? value : [];
    const singular = field.label.endsWith('s') ? field.label.slice(0, -1) : field.label;
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500">{singular} {i + 1}</span>
              <button
                onClick={() => {
                  const updated = [...items];
                  updated.splice(i, 1);
                  onChange(updated);
                }}
                className="text-red-400 hover:text-red-600 text-xs px-2 py-0.5 rounded hover:bg-red-50 transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
            <div className="p-3 space-y-3">
              {(field.itemFields || []).map(subField => (
                <div key={subField.key}>
                  <label className="block text-xs text-gray-400 mb-1">{subField.label}</label>
                  <FieldInput
                    field={subField}
                    value={item[subField.key] || ''}
                    sections={sections}
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
          className="w-full py-2.5 text-sm text-amber-600 border border-dashed border-amber-300 rounded-xl hover:bg-amber-50 transition font-semibold"
        >
          + Add {singular}
        </button>
        {/* No inline import button here — shown at top of SectionContentForm */}
      </div>
    );
  }

  // text / default
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={inputClass}
      placeholder={field.label}
    />
  );
}

// ============================================
// SECTION COLORS PANEL
// Reusable color override panel shown at the bottom of every section editor
// ============================================
function SectionColorsPanel({ bgColor, colors = {}, onBgChange, onColorsChange }) {
  const inputClass = 'flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white font-mono';
  const colorRow = (label, value, onChange, onReset) => (
    <div key={label} className="flex items-center gap-2">
      <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{label}</span>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="theme default" className={inputClass} />
      {value
        ? <button onClick={onReset} className="text-xs text-gray-300 hover:text-red-400 flex-shrink-0">✕</button>
        : <span className="text-xs text-gray-300 flex-shrink-0 w-4"></span>
      }
    </div>
  );

  return (
    <div className="pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Section Colors</p>
      <div className="space-y-2">
        {colorRow('Background', bgColor, onBgChange, () => onBgChange(''))}
        {onColorsChange && colorRow('Accent / Buttons', colors.primaryColor, v => onColorsChange('primaryColor', v), () => onColorsChange('primaryColor', ''))}
        {onColorsChange && colorRow('Text Color', colors.textColor, v => onColorsChange('textColor', v), () => onColorsChange('textColor', ''))}
      </div>
    </div>
  );
}

// ============================================
// SECTION CONTENT FORM
// ============================================
function SectionContentForm({ section, onContentChange, onColorsChange, sections }) {
  const fields = CONTENT_FIELDS[section.template];

  const prettyKey = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
  // Detect URL-type fields by name so extraEntries/fallback render the link picker
  const isUrlKey = (key) => /link|url|href|src$/i.test(key);
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white';

  if (!fields) {
    // Generic fallback — show ALL string fields from content (except bgColor, handled below)
    const content = section.content || {};
    const entries = Object.entries(content).filter(([k, v]) => typeof v === 'string' && k !== 'bgColor');
    if (!entries.length) {
      return (
        <div className="p-5 text-center text-sm text-gray-400">
          <p>No editable fields for</p>
          <code className="text-xs text-gray-300">{section.template}</code>
        </div>
      );
    }
    const isLong = (val) => val.length > 80 || val.includes('\n');
    return (
      <div className="space-y-4 p-4">
        {entries.map(([key, val]) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {prettyKey(key)}
            </label>
            {isUrlKey(key) ? (
              <LinkPickerField value={val} onChange={v => onContentChange(key, v)} sections={sections} includePages={true} />
            ) : isLong(val) ? (
              <textarea rows={3} value={val} onChange={e => onContentChange(key, e.target.value)} className={inputClass} />
            ) : (
              <input type="text" value={val} onChange={e => onContentChange(key, e.target.value)} className={inputClass} />
            )}
          </div>
        ))}
        <SectionColorsPanel
          bgColor={section.content?.bgColor}
          colors={section.colors}
          onBgChange={val => onContentChange('bgColor', val)}
          onColorsChange={onColorsChange}
        />
      </div>
    );
  }

  // Also show any content fields not in the definition (catches AI-generated extras)
  const definedKeys = new Set(fields.map(f => f.key));
  const extraEntries = Object.entries(section.content || {}).filter(
    ([k, v]) => !definedKeys.has(k) && typeof v === 'string' && k !== 'bgColor'
  );

  // Find the testimonials/reviews array field to put import button at top
  const reviewField = fields.find(f => f.type === ARRAY && (f.key === 'testimonials' || f.key === 'reviews'));

  return (
    <div className="space-y-5 p-4">
      {/* Import from Google Reviews — shown at top if this section has reviews */}
      {reviewField && (
        <ReviewImportButton onImport={reviews => onContentChange(reviewField.key, reviews)} />
      )}
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {field.label}
          </label>
          <FieldInput
            field={field}
            value={section.content?.[field.key]}
            sections={sections}
            onChange={val => onContentChange(field.key, val)}
          />
        </div>
      ))}
      {extraEntries.map(([key, val]) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {prettyKey(key)}
          </label>
          {isUrlKey(key) ? (
            <LinkPickerField value={val} onChange={v => onContentChange(key, v)} sections={sections} includePages={true} />
          ) : (
            <input type="text" value={val} onChange={e => onContentChange(key, e.target.value)} className={inputClass} />
          )}
        </div>
      ))}

      {/* Section Colors — always available at the bottom */}
      <SectionColorsPanel
        bgColor={section.content?.bgColor}
        colors={section.colors}
        onBgChange={val => onContentChange('bgColor', val)}
        onColorsChange={onColorsChange}
      />
    </div>
  );
}

// ============================================
// NAV CONTENT FORM
// ============================================
function NavContentForm({ navSection, onChange, onColorsChange, sections }) {
  if (!navSection) return (
    <div className="p-4 text-sm text-gray-400">No navigation found in this website.</div>
  );
  const c = navSection.content || {};
  const navColors = navSection.colors || {};

  const updateField = (key, val) => onChange({ ...navSection, content: { ...c, [key]: val } });
  const links = Array.isArray(c.links) ? c.links : [];

  return (
    <div className="space-y-5 px-3 py-4">
      {/* Logo */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Logo</label>
        {/* Type toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
          {['text', 'image'].map(type => (
            <button
              key={type}
              onClick={() => updateField('logoType', type)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                (c.logoType || 'text') === type
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {(c.logoType || 'text') === 'image' ? (
          <div className="space-y-2">
            <ImageUploadField value={c.logoImage || ''} onChange={val => updateField('logoImage', val)} />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alt Text (for screen readers)</label>
              <input
                type="text"
                value={c.logo || ''}
                onChange={e => updateField('logo', e.target.value)}
                placeholder="Business Name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={c.logo || c.brandName || ''}
              onChange={e => {
                const updated = { ...c, logo: e.target.value, brandName: e.target.value };
                onChange({ ...navSection, content: updated });
              }}
              placeholder="Business Name"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 flex-shrink-0">Logo Color</label>
              <input
                type="color"
                value={c.logoColor || '#ff6b35'}
                onChange={e => updateField('logoColor', e.target.value)}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
              />
              <span className="text-xs text-gray-400 font-mono flex-1 truncate">{c.logoColor || 'theme default'}</span>
              {c.logoColor && (
                <button onClick={() => updateField('logoColor', '')} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">Reset</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Navigation Links</label>
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 leading-4">
                  Link {i + 1}
                </span>
                <input
                  type="text"
                  value={link.text || link.label || ''}
                  onChange={e => {
                    const updated = [...links];
                    updated[i] = { ...updated[i], text: e.target.value, label: e.target.value };
                    updateField('links', updated);
                  }}
                  placeholder="Link name"
                  className="flex-1 px-2 py-1.5 text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
                />
                <button
                  onClick={() => {
                    if (i === 0) return;
                    const updated = [...links];
                    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                    updateField('links', updated);
                  }}
                  disabled={i === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 flex-shrink-0"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (i === links.length - 1) return;
                    const updated = [...links];
                    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
                    updateField('links', updated);
                  }}
                  disabled={i === links.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 flex-shrink-0"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => {
                  const updated = [...links]; updated.splice(i, 1); updateField('links', updated);
                }} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <LinkPickerField
                  value={link.url || link.href || ''}
                  onChange={val => {
                    const updated = [...links];
                    updated[i] = { ...updated[i], url: val, href: val };
                    updateField('links', updated);
                  }}
                  sections={sections}
                  includePages={true}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => updateField('links', [...links, { text: 'New Link', label: 'New Link', url: '#', href: '#' }])}
            className="w-full py-2 text-sm text-amber-600 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition font-semibold"
          >
            + Add Link
          </button>
        </div>
      </div>

      {/* Nav Button — at bottom since it appears last in the nav */}
      <div className="pt-1 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Nav Button</p>
        <div className="space-y-3">
          {/* CTA Destination Toggle */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Button Destination</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField('ctaLink', '/contact')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                  (c.ctaLink || '/contact') === '/contact' || (!c.ctaLink)
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-sm mb-0.5">📋</div>
                Contact Form
              </button>
              <button
                type="button"
                onClick={() => updateField('ctaLink', '/booking')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                  c.ctaLink === '/booking'
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className="text-sm mb-0.5">📅</div>
                Online Booking
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Button Text</label>
            <input type="text" value={c.ctaText || ''} onChange={e => updateField('ctaText', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Custom Link (optional)</label>
            <LinkPickerField value={c.ctaLink || ''} onChange={val => updateField('ctaLink', val)} sections={sections} includePages={true} />
          </div>
        </div>
      </div>

      {/* Nav Colors */}
      {onColorsChange && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Nav Colors</p>
          <div className="space-y-2">
            {[
              { key: 'primaryColor', label: 'CTA Button / Accent' },
              { key: 'bgColor',      label: 'Background (scrolled)' },
              { key: 'textColor',    label: 'Link Color' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input type="color" value={navColors[key] || '#ffffff'} onChange={e => onColorsChange(key, e.target.value)}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{label}</span>
                <input type="text" value={navColors[key] || ''} onChange={e => onColorsChange(key, e.target.value)}
                  placeholder="theme default"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white font-mono" />
                {navColors[key]
                  ? <button onClick={() => onColorsChange(key, '')} className="text-xs text-gray-300 hover:text-red-400 flex-shrink-0">✕</button>
                  : <span className="w-4 flex-shrink-0" />
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// THEME / COLORS & FONTS PANEL
// ============================================
function ThemePanel({ theme, onChange }) {
  const t = theme || {};

  const update = (key, val) => onChange({ ...t, [key]: val });

  return (
    <div className="p-4 space-y-5">
      {/* Colors */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Brand Colors</p>
        <div className="space-y-3">
          {[
            { key: 'primaryColor', label: 'Primary Color (buttons, accents)' },
            { key: 'accentColor', label: 'Accent / Highlight Color' },
            { key: 'bgColor', label: 'Background Color' },
            { key: 'surfaceColor', label: 'Card / Surface Color' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t[key] || '#000000'}
                  onChange={e => update(key, e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={t[key] || ''}
                  onChange={e => update(key, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text colors */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Text Colors</p>
        <div className="space-y-3">
          {[
            { key: 'textColor', label: 'Primary Text Color' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={t[key] || '#000000'} onChange={e => update(key, e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                <input type="text" value={t[key] || ''} onChange={e => update(key, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white font-mono" placeholder="#000000" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Typography</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Heading Font</label>
            <select
              value={t.headingFont || ''}
              onChange={e => update('headingFont', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="">— Keep current —</option>
              {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Body Font</label>
            <select
              value={t.bodyFont || ''}
              onChange={e => update('bodyFont', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="">— Keep current —</option>
              {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Border Radius</label>
            <select
              value={t.buttonRadius || '8px'}
              onChange={e => update('buttonRadius', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="0px">Square (0px)</option>
              <option value="4px">Slight (4px)</option>
              <option value="8px">Rounded (8px)</option>
              <option value="12px">More rounded (12px)</option>
              <option value="50px">Pill (50px)</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 italic">
        Color and font changes apply to the whole website.
      </p>
    </div>
  );
}

// ============================================
// ACCORDION CARD
// ============================================
function SidebarCard({ id, label, icon: Icon, openCard, setOpenCard, badge, children }) {
  const isOpen = openCard === id;
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpenCard(isOpen ? null : id)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-100 transition-colors"
      >
        <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
        {badge != null && (
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">{badge}</span>
        )}
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
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
  const [previewHtml, setPreviewHtml] = useState(() => initialHtml ? injectHighlightScript(initialHtml) : '');
  const iframeRef = useRef(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [openCard, setOpenCard] = useState('sections');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [activePage, setActivePage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null); // index of section awaiting inline confirm
  const [pendingPageDelete, setPendingPageDelete] = useState(false); // page delete inline confirm

  // Reset section selection and refresh preview when switching pages
  const isFirstPageSwitch = useRef(true);
  useEffect(() => {
    setSelectedIdx(null);
    setShowAddSection(false);
    setPendingDelete(null);
    setPendingPageDelete(false);
    if (isFirstPageSwitch.current) { isFirstPageSwitch.current = false; return; }
    // Refresh preview for the newly selected page (immediate, no debounce)
    // Use a short delay so schema state is stable
    const filename = schema.multiPage ? schema.pages?.[activePage]?.filename : null;
    doRenderPreview(schema, filename);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  // Resolve sections (single-page or multi-page, active page)
  const getSections = useCallback((s) => {
    if (s.multiPage && Array.isArray(s.pages) && s.pages.length > activePage) return s.pages[activePage].sections || [];
    return s.sections || [];
  }, [activePage]);

  const setSections = useCallback((s, newSections) => {
    const updated = JSON.parse(JSON.stringify(s));
    if (updated.multiPage && Array.isArray(updated.pages) && updated.pages.length > activePage) {
      updated.pages[activePage].sections = newSections;
    } else {
      updated.sections = newSections;
    }
    return updated;
  }, [activePage]);

  const editableSections = getSections(schema).filter(s => {
    const t = s.template || '';
    return !t.startsWith('nav-') && !t.startsWith('footer');
  });

  const navSection = schema.nav || getSections(schema).find(s => (s.template || '').startsWith('nav-')) || null;
  const navLinks = Array.isArray(navSection?.content?.links) ? navSection.content.links : [];
  // Footer may be at schema.footer (multi-page) or inside a page's sections array
  const footerSection = (() => {
    if (schema.footer && (schema.footer.template || '').startsWith('footer')) return schema.footer;
    const allSections = schema.multiPage && Array.isArray(schema.pages)
      ? schema.pages.flatMap(p => p.sections || [])
      : (schema.sections || []);
    return allSections.find(s => (s.template || '').startsWith('footer')) || null;
  })();

  // Page management helpers (multi-page only)
  const getPageNavName = (page) => {
    const filename = page.filename || '';
    // Only look up nav link if there's an actual filename — empty string normalizes to 'home'
    // which would incorrectly match the Home page nav link for brand new pages
    if (filename) {
      const link = navLinks.find(l => {
        const url = l.url || l.href || '';
        return url === filename || normPath(url) === normPath(filename);
      });
      if (link) return link.text || link.label || page.name || 'Page';
    }
    return page.name || 'Page';
  };
  const isPageInNav = (page) => {
    const filename = page.filename || '';
    return !!filename && navLinks.some(l => {
      const url = l.url || l.href || '';
      return url === filename || normPath(url) === normPath(filename);
    });
  };
  const isPageNavButton = (page) => {
    const filename = page.filename || '';
    const ctaLink = navSection?.content?.ctaLink || '';
    return !!filename && (ctaLink === filename || normPath(ctaLink) === normPath(filename));
  };

  // ============================================
  // REFRESH PREVIEW — must be defined before any mutation that calls it
  // ============================================
  const doRenderPreview = useCallback(async (schemaData, pageFilename = null) => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const body = { page_data: schemaData };
      if (pageFilename) body.pageFilename = pageFilename;
      const res = await fetch(`${API_URL}/api/website/render-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(injectHighlightScript(data.html));
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []); // no schema dep — receives schema and optional pageFilename as arguments

  // ============================================
  // MUTATIONS
  // ============================================
  const updateSectionContent = useCallback((editableIdx, key, val) => {
    setSchema(prev => {
      const sections = getSections(prev);
      const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
      const target = editables[editableIdx];
      if (!target) return prev;
      const actualIdx = sections.indexOf(target);
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

  const updateSectionColors = useCallback((editableIdx, key, val) => {
    setSchema(prev => {
      const sections = getSections(prev);
      const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
      const target = editables[editableIdx];
      if (!target) return prev;
      const actualIdx = sections.indexOf(target);
      if (actualIdx === -1) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      const updatedSections = getSections(updated);
      const current = updatedSections[actualIdx];
      const newColors = { ...(current.colors || {}) };
      if (val) newColors[key] = val;
      else delete newColors[key];
      updatedSections[actualIdx] = { ...current, colors: newColors };
      return setSections(updated, updatedSections);
    });
  }, [getSections, setSections]);

  const moveSection = useCallback((idx, direction) => {
    const sections = [...getSections(schema)];
    const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
    const section = editables[idx];
    const actualIdx = sections.indexOf(section);
    const targetIdx = direction === 'up' ? actualIdx - 1 : actualIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    [sections[targetIdx], sections[actualIdx]] = [sections[actualIdx], sections[targetIdx]];
    const newSchema = setSections(JSON.parse(JSON.stringify(schema)), sections);
    setSchema(newSchema);
    setSelectedIdx(null);
    const filename = newSchema.multiPage ? newSchema.pages?.[activePage]?.filename : null;
    doRenderPreview(newSchema, filename);
  }, [schema, getSections, setSections, activePage, doRenderPreview]);

  const deleteSection = useCallback((idx) => {
    const sections = getSections(schema);
    const editables = sections.filter(s => !s.template?.startsWith('nav-') && !s.template?.startsWith('footer'));
    const target = editables[idx];
    const actualIdx = sections.indexOf(target);
    if (actualIdx === -1) return;
    const newSections = sections.filter((_, i) => i !== actualIdx);
    const newSchema = setSections(JSON.parse(JSON.stringify(schema)), newSections);
    setSchema(newSchema);
    setSelectedIdx(null);
    const filename = newSchema.multiPage ? newSchema.pages?.[activePage]?.filename : null;
    doRenderPreview(newSchema, filename);
  }, [schema, getSections, setSections, activePage, doRenderPreview]);

  const addSection = useCallback((templateId) => {
    const defaultContent = JSON.parse(JSON.stringify(SECTION_DEFAULTS[templateId] || {}));

    // For hero sections without a background image, inherit from existing hero in the schema
    if (templateId.startsWith('hero-') && !defaultContent.backgroundImage) {
      const allSecs = schema.multiPage
        ? (schema.pages || []).flatMap(p => p.sections || [])
        : (schema.sections || []);
      const existingHero = allSecs.find(s => s.template?.startsWith('hero-') && s.content?.backgroundImage);
      if (existingHero?.content?.backgroundImage) {
        defaultContent.backgroundImage = existingHero.content.backgroundImage;
      }
    }

    const newSection = { id: genId(), template: templateId, content: defaultContent };
    const sections = [...getSections(schema)];
    const footerIdx = sections.findIndex(s => (s.template || '').startsWith('footer'));
    if (footerIdx !== -1) sections.splice(footerIdx, 0, newSection);
    else sections.push(newSection);
    const newSchema = setSections(JSON.parse(JSON.stringify(schema)), sections);
    setSchema(newSchema);
    setShowAddSection(false);
    setSelectedIdx(editableSections.length);
    setOpenCard('sections');
    const filename = newSchema.multiPage ? newSchema.pages?.[activePage]?.filename : null;
    doRenderPreview(newSchema, filename);
  }, [schema, getSections, setSections, editableSections.length, activePage, doRenderPreview]);

  const updateNav = useCallback((updatedNav) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated.nav) {
        updated.nav = updatedNav;
      } else {
        const sections = getSections(updated);
        const navIdx = sections.findIndex(s => (s.template || '').startsWith('nav-'));
        if (navIdx !== -1) {
          sections[navIdx] = updatedNav;
          return setSections(updated, sections);
        }
      }
      return updated;
    });
  }, [getSections, setSections]);

  const updateNavColors = useCallback((key, val) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const applyColors = (nav) => {
        const newColors = { ...(nav.colors || {}) };
        if (val) newColors[key] = val;
        else delete newColors[key];
        return { ...nav, colors: newColors };
      };
      if (updated.nav) {
        updated.nav = applyColors(updated.nav);
        return updated;
      }
      const sections = getSections(updated);
      const navIdx = sections.findIndex(s => (s.template || '').startsWith('nav-'));
      if (navIdx !== -1) {
        sections[navIdx] = applyColors(sections[navIdx]);
        return setSections(updated, sections);
      }
      return updated;
    });
  }, [getSections, setSections]);

  const updateFooterContent = useCallback((key, val) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      // Top-level schema.footer (multi-page photography-style schemas)
      if (updated.footer && (updated.footer.template || '').startsWith('footer')) {
        updated.footer = { ...updated.footer, content: { ...updated.footer.content, [key]: val } };
        return updated;
      }
      // Footer embedded inside a page's sections array
      if (updated.multiPage && Array.isArray(updated.pages)) {
        for (const page of updated.pages) {
          const idx = (page.sections || []).findIndex(s => (s.template || '').startsWith('footer'));
          if (idx !== -1) {
            page.sections[idx] = { ...page.sections[idx], content: { ...page.sections[idx].content, [key]: val } };
            return updated;
          }
        }
        return prev;
      }
      const idx = (updated.sections || []).findIndex(s => (s.template || '').startsWith('footer'));
      if (idx === -1) return prev;
      updated.sections[idx] = { ...updated.sections[idx], content: { ...updated.sections[idx].content, [key]: val } };
      return updated;
    });
  }, []);

  const updateFooterColors = useCallback((key, val) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const applyColors = (section) => {
        const newColors = { ...(section.colors || {}) };
        if (val) newColors[key] = val;
        else delete newColors[key];
        return { ...section, colors: newColors };
      };
      if (updated.footer && (updated.footer.template || '').startsWith('footer')) {
        updated.footer = applyColors(updated.footer);
        return updated;
      }
      if (updated.multiPage && Array.isArray(updated.pages)) {
        for (const page of updated.pages) {
          const idx = (page.sections || []).findIndex(s => (s.template || '').startsWith('footer'));
          if (idx !== -1) { page.sections[idx] = applyColors(page.sections[idx]); return updated; }
        }
        return prev;
      }
      const idx = (updated.sections || []).findIndex(s => (s.template || '').startsWith('footer'));
      if (idx === -1) return prev;
      updated.sections[idx] = applyColors(updated.sections[idx]);
      return updated;
    });
  }, []);

  const updatePageName = useCallback((pageIdx, name) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const page = updated.pages?.[pageIdx];
      if (!page) return prev;
      page.name = name;
      const filename = page.filename || '';
      if (updated.nav?.content?.links && filename) {
        const link = updated.nav.content.links.find(l => {
          const url = l.url || l.href || '';
          return url === filename || normPath(url) === normPath(filename);
        });
        if (link) { link.text = name; link.label = name; }
      }
      return updated;
    });
  }, []);

  const togglePageInNav = useCallback((pageIdx, show) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const page = updated.pages?.[pageIdx];
      if (!page || !updated.nav?.content) return prev;
      const filename = page.filename || '';
      if (!filename) return prev;
      if (show) {
        if (!updated.nav.content.links) updated.nav.content.links = [];
        const exists = updated.nav.content.links.some(l => {
          const url = l.url || l.href || '';
          return url === filename || normPath(url) === normPath(filename);
        });
        if (!exists) {
          updated.nav.content.links.push({ text: page.name || 'Page', label: page.name || 'Page', url: filename, href: filename });
        }
      } else {
        updated.nav.content.links = (updated.nav.content.links || []).filter(l => {
          const url = l.url || l.href || '';
          return url !== filename && normPath(url) !== normPath(filename);
        });
      }
      return updated;
    });
  }, []);

  const togglePageNavButton = useCallback((pageIdx, isButton) => {
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const page = updated.pages?.[pageIdx];
      if (!page || !updated.nav?.content) return prev;
      const filename = page.filename || '';
      if (!filename) return prev;
      if (isButton) {
        if (!updated.nav.content.ctaText) updated.nav.content.ctaText = page.name;
        updated.nav.content.ctaLink = filename;
        // Remove from regular links
        updated.nav.content.links = (updated.nav.content.links || []).filter(l => {
          const url = l.url || l.href || '';
          return url !== filename && normPath(url) !== normPath(filename);
        });
      } else {
        const ctaLink = updated.nav.content.ctaLink || '';
        if (ctaLink === filename || normPath(ctaLink) === normPath(filename)) {
          updated.nav.content.ctaLink = '';
          if (!updated.nav.content.links) updated.nav.content.links = [];
          updated.nav.content.links.push({ text: page.name || 'Page', label: page.name || 'Page', url: filename, href: filename });
        }
      }
      return updated;
    });
  }, []);

  const addPage = useCallback((name = 'New Page') => {
    if (!schema.multiPage || !Array.isArray(schema.pages)) return;
    const newIdx = schema.pages.length;
    const filename = `page-${newIdx + 1}.html`;
    setSchema(prev => {
      if (!prev.multiPage || !Array.isArray(prev.pages)) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      updated.pages.push({
        name,
        filename,
        sections: [{
          id: genId(),
          template: 'hero-page-banner',
          content: { title: name, subtitle: '' },
        }],
      });
      return updated;
    });
    setActivePage(newIdx);
    setOpenCard('sections');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.multiPage, schema.pages]);

  const deletePage = useCallback((pageIdx) => {
    if (!schema.pages || schema.pages.length <= 1) return; // can't delete only page
    setSchema(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.pages || updated.pages.length <= 1) return prev;
      updated.pages.splice(pageIdx, 1);
      return updated;
    });
    setActivePage(prev => Math.max(0, prev >= pageIdx ? prev - 1 : prev));
    setPendingPageDelete(false);
    setSelectedIdx(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.pages]);

  const updateTheme = useCallback((newTheme) => {
    setSchema(prev => ({ ...prev, theme: newTheme }));
  }, []);

  // Active page ref so debounce can access current page without dep issues
  const activePageRef = useRef(activePage);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);

  // Capture scroll position before preview refresh so it can be restored after iframe reload.
  // Uses postMessage so it works without allow-same-origin (direct contentWindow.scrollY access
  // requires same-origin which was removed to fix logo/link parent frame navigation).
  const scrollRestoreRef = useRef(null);

  // Shared render-with-scroll-restore: requests scrollY from iframe via postMessage,
  // waits up to 150ms for reply, then re-renders and restores position on load.
  const renderWithScrollRestore = useCallback((schemaData, filename) => {
    const iframe = iframeRef.current;
    const onScrollPos = (e) => {
      if (e.data?.type !== 'sorce-scroll-pos') return;
      window.removeEventListener('message', onScrollPos);
      clearTimeout(fallbackTimer);
      scrollRestoreRef.current = e.data.y;
      doRenderPreview(schemaData, filename);
    };
    window.addEventListener('message', onScrollPos);
    const fallbackTimer = setTimeout(() => {
      window.removeEventListener('message', onScrollPos);
      doRenderPreview(schemaData, filename);
    }, 150);
    try {
      iframe?.contentWindow?.postMessage({ type: 'sorce-get-scroll' }, '*');
    } catch (e) {
      window.removeEventListener('message', onScrollPos);
      clearTimeout(fallbackTimer);
      doRenderPreview(schemaData, filename);
    }
  }, [doRenderPreview]);

  // Manual refresh (header button)
  const refreshPreview = useCallback(() => {
    const filename = schema.multiPage ? schema.pages?.[activePageRef.current]?.filename : null;
    renderWithScrollRestore(schema, filename);
  }, [schema, renderWithScrollRestore]);

  // Auto-refresh: debounced 1.2s after any schema change.
  // Scroll position is restored via postMessage so the view doesn't jump.
  // Structural changes (add/delete/move section) bypass this and refresh immediately.
  useEffect(() => {
    const timer = setTimeout(() => {
      const filename = schema.multiPage ? schema.pages?.[activePageRef.current]?.filename : null;
      renderWithScrollRestore(schema, filename);
    }, 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  // Highlight selected section in iframe via postMessage
  useEffect(() => {
    const section = selectedIdx !== null ? editableSections[selectedIdx] : null;
    const id = section?.id || null;
    const send = () => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'sorce-highlight', id }, '*');
    };
    send();
    const iframe = iframeRef.current;
    iframe?.addEventListener('load', send);
    return () => iframe?.removeEventListener('load', send);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx, previewHtml]);

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

  // Canvas widths for device preview
  const canvasWidth = devicePreview === 'mobile' ? '390px' : devicePreview === 'tablet' ? '768px' : '100%';

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800">Website Editor</span>
        </div>

        {/* Device preview toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'desktop', Icon: Monitor },
            { id: 'tablet', Icon: Tablet },
            { id: 'mobile', Icon: Smartphone },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setDevicePreview(id)}
              className={`p-1.5 rounded-md transition ${devicePreview === id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refreshPreview}
            disabled={isRefreshing}
            title="Force refresh preview now"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
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

            {/* Page selector — shown above Navigation for multi-page schemas */}
            {schema.multiPage && Array.isArray(schema.pages) && schema.pages.length > 0 && (() => {
              const page = schema.pages[activePage];
              const inNav = page ? isPageInNav(page) : false;
              const asButton = page ? isPageNavButton(page) : false;
              return (
                <div className="border-b border-gray-200 bg-white">
                  {/* Page dropdown row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">Page</span>
                    <select
                      value={activePage}
                      onChange={e => setActivePage(Number(e.target.value))}
                      className="flex-1 px-2 py-1.5 text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white min-w-0"
                    >
                      {schema.pages.map((p, i) => (
                        <option key={i} value={i}>{getPageNavName(p)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => addPage()}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Add new page"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Page name + nav visibility settings */}
                  {page && (
                    <div className="px-3 py-2 bg-gray-50 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={getPageNavName(page)}
                          onChange={e => { updatePageName(activePage, e.target.value); setPendingPageDelete(false); }}
                          className="flex-1 px-2 py-1 text-xs font-semibold text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:border-amber-400 bg-white min-w-0"
                          placeholder="Page name"
                        />
                        {schema.pages.length > 1 && (
                          pendingPageDelete ? (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-gray-500">Delete?</span>
                              <button
                                onClick={() => deletePage(activePage)}
                                className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-md"
                              >Yes</button>
                              <button
                                onClick={() => setPendingPageDelete(false)}
                                className="px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                              >No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPendingPageDelete(true)}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                              title="Delete this page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={inNav || asButton}
                            onChange={e => {
                              if (e.target.checked) togglePageInNav(activePage, true);
                              else { togglePageInNav(activePage, false); togglePageNavButton(activePage, false); }
                            }}
                            className="rounded border-gray-300 accent-amber-500"
                          />
                          Show in nav
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Navigation */}
            <SidebarCard id="nav" label="Navigation" icon={Navigation} openCard={openCard} setOpenCard={setOpenCard}>
              <NavContentForm navSection={navSection} onChange={updateNav} onColorsChange={updateNavColors} sections={editableSections} />
            </SidebarCard>

            {/* Sections */}
            <SidebarCard id="sections" label="Sections" icon={Layers} openCard={openCard} setOpenCard={setOpenCard} badge={editableSections.length}>
              {selectedIdx === null ? (
                <div>
                  <div className="divide-y divide-gray-100">
                    {editableSections.map((section, i) => (
                      <div
                        key={section.id || i}
                        className="flex items-center gap-2 px-3 py-3 hover:bg-white group cursor-pointer transition"
                        onClick={() => setSelectedIdx(i)}
                      >
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <span className="text-xl flex-shrink-0">{getSectionIcon(section.template)}</span>
                        <span className="flex-1 text-sm text-gray-700 font-medium truncate">{getSectionName(section.template)}</span>
                        {pendingDelete === i ? (
                          <div className="flex items-center gap-1.5 ml-auto" onClick={e => e.stopPropagation()}>
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => { deleteSection(i); setPendingDelete(null); }}
                              className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-md"
                            >Yes</button>
                            <button
                              onClick={() => setPendingDelete(null)}
                              className="px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >No</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={e => { e.stopPropagation(); moveSection(i, 'up'); }} disabled={i === 0}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); moveSection(i, 'down'); }} disabled={i === editableSections.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setPendingDelete(i); }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!showAddSection ? (
                    <div className="p-3 border-t border-gray-100">
                      <button onClick={() => setShowAddSection(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-amber-600 border border-dashed border-amber-300 rounded-xl hover:bg-amber-50 transition font-semibold">
                        <Plus className="w-4 h-4" /> Add Section
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose Section Type</span>
                        <button onClick={() => setShowAddSection(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTION_TEMPLATES_LIST.map(tmpl => (
                          <button
                            key={tmpl.id}
                            onClick={() => addSection(tmpl.id)}
                            className="flex flex-col items-start gap-1 p-3 border border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition text-left bg-white"
                          >
                            <span className="text-2xl">{tmpl.icon}</span>
                            <span className="text-xs font-semibold text-gray-700 leading-tight">{tmpl.name}</span>
                            <span className="text-xs text-gray-400 leading-tight">{tmpl.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Section content editor */
                <div>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => setSelectedIdx(null)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition">
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Sections
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {getSectionName(editableSections[selectedIdx]?.template || '')}
                    </span>
                  </div>
                  {editableSections[selectedIdx] && (
                    <SectionContentForm
                      section={editableSections[selectedIdx]}
                      sections={editableSections}
                      onContentChange={(key, val) => updateSectionContent(selectedIdx, key, val)}
                      onColorsChange={(key, val) => updateSectionColors(selectedIdx, key, val)}
                    />
                  )}
                </div>
              )}
            </SidebarCard>

            {/* Footer */}
            {footerSection && (
              <SidebarCard id="footer" label="Footer" icon={PanelBottom} openCard={openCard} setOpenCard={setOpenCard}>
                <SectionContentForm
                  section={footerSection}
                  sections={editableSections}
                  onContentChange={updateFooterContent}
                  onColorsChange={updateFooterColors}
                />
              </SidebarCard>
            )}

            {/* Colors & Fonts */}
            <SidebarCard id="theme" label="Colors & Fonts" icon={Palette} openCard={openCard} setOpenCard={setOpenCard}>
              <ThemePanel theme={schema.theme} onChange={updateTheme} />
            </SidebarCard>

          </div>

        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-200 overflow-hidden flex justify-center">
          <div
            style={{ width: canvasWidth, height: '100%', transition: 'width 0.3s ease', position: 'relative' }}
          >
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                title="Website Preview"
                sandbox="allow-scripts allow-forms"
                onLoad={() => {
                  // Restore scroll position via postMessage (no allow-same-origin needed)
                  if (scrollRestoreRef.current !== null) {
                    const y = scrollRestoreRef.current;
                    scrollRestoreRef.current = null;
                    iframeRef.current?.contentWindow?.postMessage({ type: 'sorce-scroll-to', y }, '*');
                  }
                }}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-screen">
                <div className="text-center bg-white rounded-2xl p-10 shadow-sm">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No preview loaded</p>
                  <p className="text-xs text-gray-400 mb-4">Click "Refresh Preview" to load your website</p>
                  <button onClick={refreshPreview} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition">
                    Load Preview
                  </button>
                </div>
              </div>
            )}

            {isRefreshing && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-lg text-sm text-gray-700 font-semibold">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                  Re-rendering your website...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
