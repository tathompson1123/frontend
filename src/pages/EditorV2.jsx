import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Settings,
  Palette,
  Layout,
  Type,
  Image,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  Zap,
  Edit3,
  RefreshCw,
  Upload,
  Loader,
  Link2,
  Undo2,
  Redo2,
  Minus,
  AlignLeft,
  FileText,
  Home,
  Camera,
  HelpCircle,
  DollarSign
} from 'lucide-react';

// ============================================
// TEMPLATE DEFINITIONS
// Maps template IDs to their editable fields
// ============================================
const TEMPLATE_DEFINITIONS = {
  'review-marquee': {
    name: 'Review Marquee',
    icon: Star,
    category: 'trust',
    fields: {
      reviews: {
        type: 'array',
        label: 'Reviews',
        itemFields: {
          name: { type: 'text', label: 'Reviewer Name' },
          date: { type: 'text', label: 'Date' },
          text: { type: 'textarea', label: 'Review Text' },
          stars: { type: 'number', label: 'Stars (1-5)', min: 1, max: 5 },
          avatarColor: { type: 'text', label: 'Avatar Color' }
        }
      }
    }
  },
  'trust-banner-scroll': {
    name: 'Trust Banner (Scrolling)',
    icon: Star,
    category: 'trust',
    fields: {
      reviews: {
        type: 'array',
        label: 'Reviews',
        itemFields: {
          text: { type: 'textarea', label: 'Review Text' },
          author: { type: 'text', label: 'Author Name' },
          rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 }
        }
      }
    }
  },
  'nav-sticky-dark': {
    name: 'Navigation (Dark)',
    icon: Layout,
    category: 'nav',
    fields: {
      logo: { type: 'text', label: 'Logo Text' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
      ctaLink: { type: 'url', label: 'CTA Button Link' },
      links: {
        type: 'array',
        label: 'Navigation Links',
        itemFields: {
          text: { type: 'text', label: 'Link Text' },
          url: { type: 'url', label: 'Link URL' }
        }
      }
    }
  },
  'hero-fullscreen-dark': {
    name: 'Hero (Fullscreen Dark)',
    icon: Zap,
    category: 'hero',
    fields: {
      headline: { type: 'text', label: 'Headline' },
      highlightText: { type: 'text', label: 'Highlighted Text' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'Primary Button Text' },
      ctaLink: { type: 'url', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'url', label: 'Secondary Button Link' },
      backgroundImage: { type: 'image', label: 'Background Image URL' }
    }
  },
  'hero-gradient': {
    name: 'Hero (Gradient)',
    icon: Zap,
    category: 'hero',
    fields: {
      headline: { type: 'text', label: 'Headline' },
      highlightText: { type: 'text', label: 'Highlighted Text' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'Primary Button Text' },
      ctaLink: { type: 'url', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'url', label: 'Secondary Button Link' }
    }
  },
  'features-icon-row': {
    name: 'Features (Icon Row)',
    icon: Star,
    category: 'features',
    fields: {
      features: {
        type: 'array',
        label: 'Features',
        itemFields: {
          icon: { type: 'text', label: 'Icon (emoji)' },
          title: { type: 'text', label: 'Title' },
          text: { type: 'textarea', label: 'Description' }
        }
      }
    }
  },
  'services-cards-3col': {
    name: 'Services (3 Column Cards)',
    icon: Layout,
    category: 'services',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
      ctaLink: { type: 'url', label: 'CTA Button Link' },
      services: {
        type: 'array',
        label: 'Services',
        itemFields: {
          name: { type: 'text', label: 'Service Name' },
          description: { type: 'textarea', label: 'Description' },
          price: { type: 'text', label: 'Price' },
          image: { type: 'image', label: 'Image URL' },
          link: { type: 'url', label: 'Link' }
        }
      }
    }
  },
  'benefits-numbered': {
    name: 'Benefits (Numbered)',
    icon: Star,
    category: 'benefits',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      benefits: {
        type: 'array',
        label: 'Benefits',
        itemFields: {
          title: { type: 'text', label: 'Benefit Title' },
          description: { type: 'textarea', label: 'Description' }
        }
      }
    }
  },
  'gallery-mixed-grid': {
    name: 'Gallery (Mixed Grid)',
    icon: Image,
    category: 'gallery',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      items: {
        type: 'array',
        label: 'Gallery Items',
        itemFields: {
          image: { type: 'image', label: 'Image URL' },
          title: { type: 'text', label: 'Title' },
          caption: { type: 'text', label: 'Caption' },
          large: { type: 'checkbox', label: 'Large Size' }
        }
      }
    }
  },
  'testimonials-3col': {
    name: 'Testimonials (3 Column)',
    icon: MessageSquare,
    category: 'testimonials',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      testimonials: {
        type: 'array',
        label: 'Testimonials',
        itemFields: {
          quote: { type: 'textarea', label: 'Quote' },
          author: { type: 'text', label: 'Author Name' },
          role: { type: 'text', label: 'Role/Title' },
          rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 }
        }
      }
    }
  },
  'cta-gradient-full': {
    name: 'CTA (Full Width Gradient)',
    icon: Zap,
    category: 'cta',
    fields: {
      badge: { type: 'text', label: 'Badge Text' },
      headline: { type: 'text', label: 'Headline' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'Primary Button Text' },
      ctaLink: { type: 'url', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'url', label: 'Secondary Button Link' },
      features: {
        type: 'array',
        label: 'Feature List',
        itemFields: {
          text: { type: 'text', label: 'Feature Text' }
        }
      }
    }
  },
  'content-block': {
    name: 'Content Block',
    icon: Type,
    category: 'content',
    fields: {
      heading: { type: 'text', label: 'Heading (optional)' },
      text: { type: 'textarea', label: 'Text Content (optional)' },
      imageUrl: { type: 'text', label: 'Image URL (optional)' },
      imageAlt: { type: 'text', label: 'Image Alt Text' },
      buttonText: { type: 'text', label: 'Button Text (optional)' },
      buttonLink: { type: 'url', label: 'Button Link' },
      align: { type: 'text', label: 'Alignment (left/center/right)' }
    }
  },
  'contact-split': {
    name: 'Contact (Split Layout)',
    icon: Phone,
    category: 'contact',
    fields: {
      formTitle: { type: 'text', label: 'Form Title' },
      formSubtitle: { type: 'textarea', label: 'Form Subtitle' },
      submitText: { type: 'text', label: 'Submit Button Text' },
      phone: { type: 'text', label: 'Phone Number' },
      phoneClean: { type: 'text', label: 'Phone (digits only)' },
      email: { type: 'text', label: 'Email Address' },
      hours: { type: 'textarea', label: 'Business Hours' },
      serviceArea: { type: 'text', label: 'Service Area' },
      businessName: { type: 'text', label: 'Business Name' },
      highlights: {
        type: 'array',
        label: 'Highlights',
        itemFields: {
          text: { type: 'text', label: 'Highlight Text' }
        }
      }
    }
  },
  'footer-4col-dark': {
    name: 'Footer (4 Column Dark)',
    icon: Layout,
    category: 'footer',
    fields: {
      logo: { type: 'text', label: 'Logo/Business Name' },
      tagline: { type: 'text', label: 'Tagline' },
      phone: { type: 'text', label: 'Phone' },
      email: { type: 'text', label: 'Email' },
      hours: { type: 'textarea', label: 'Hours' },
      services: {
        type: 'array',
        label: 'Services List',
        itemFields: {
          text: { type: 'text', label: 'Service Name' }
        }
      }
    }
  },

  // ── Organic / Landscaping templates ────────────────────────────────
  'nav-sticky-organic': {
    name: 'Navigation (Organic)',
    icon: Layout,
    category: 'nav',
    fields: {
      logo: { type: 'text', label: 'Logo Text' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
      ctaLink: { type: 'url', label: 'CTA Button Link' },
      links: {
        type: 'array',
        label: 'Navigation Links',
        itemFields: {
          text: { type: 'text', label: 'Link Text' },
          url: { type: 'url', label: 'Link URL' }
        }
      }
    }
  },
  'hero-split-portrait': {
    name: 'Hero (Split Portrait)',
    icon: Zap,
    category: 'hero',
    fields: {
      badge: { type: 'text', label: 'Badge Text' },
      headline: { type: 'text', label: 'Headline' },
      highlightText: { type: 'text', label: 'Highlighted Word' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'Primary Button Text' },
      ctaLink: { type: 'url', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'url', label: 'Secondary Button Link' },
      floatBadge: { type: 'text', label: 'Float Badge Number (e.g. 10+)' },
      floatBadgeLabel: { type: 'text', label: 'Float Badge Label (e.g. Years Experience)' },
      portraitImage: { type: 'image', label: 'Portrait Image URL' },
      bgImage: { type: 'image', label: 'Background Image URL' }
    }
  },
  'importance-split': {
    name: 'Why It Matters (Split)',
    icon: Star,
    category: 'features',
    fields: {
      badge: { type: 'text', label: 'Badge Text' },
      headline: { type: 'text', label: 'Headline' },
      body1: { type: 'textarea', label: 'First Paragraph' },
      body2: { type: 'textarea', label: 'Second Paragraph' },
      image: { type: 'image', label: 'Image URL' },
      imageAlt: { type: 'text', label: 'Image Alt Text' },
      highlights: {
        type: 'array',
        label: 'Highlight Points',
        itemFields: {
          icon: { type: 'text', label: 'Icon (emoji)' },
          text: { type: 'text', label: 'Highlight Text' }
        }
      }
    }
  },
  'services-carousel': {
    name: 'Services Carousel',
    icon: Layout,
    category: 'services',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      subtitle: { type: 'text', label: 'Section Subtitle' },
      services: {
        type: 'array',
        label: 'Services',
        itemFields: {
          title: { type: 'text', label: 'Service Name' },
          category: { type: 'text', label: 'Category' },
          price: { type: 'text', label: 'Price (e.g. From $199)' },
          image: { type: 'image', label: 'Image URL' },
          features: {
            type: 'array',
            label: 'Features',
            itemFields: {
              text: { type: 'text', label: 'Feature' }
            }
          }
        }
      }
    }
  },
  'before-after-cards': {
    name: 'Before & After Cards',
    icon: Image,
    category: 'gallery',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      subtitle: { type: 'text', label: 'Section Subtitle' },
      cards: {
        type: 'array',
        label: 'Transformation Cards',
        itemFields: {
          title: { type: 'text', label: 'Project Title' },
          description: { type: 'textarea', label: 'Description' },
          beforeImage: { type: 'image', label: 'Before Image URL' },
          afterImage: { type: 'image', label: 'After Image URL' }
        }
      }
    }
  },
  'hero-page-banner': {
    name: 'Page Banner Hero',
    icon: Zap,
    category: 'hero',
    fields: {
      title: { type: 'text', label: 'Page Title' },
      subtitle: { type: 'text', label: 'Page Subtitle' },
      bgImage: { type: 'image', label: 'Background Image URL' }
    }
  },
  'benefits-cards': {
    name: 'Benefits Cards',
    icon: Star,
    category: 'benefits',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      subtitle: { type: 'text', label: 'Section Subtitle' },
      benefits: {
        type: 'array',
        label: 'Benefits',
        itemFields: {
          icon: { type: 'text', label: 'Icon (emoji)' },
          title: { type: 'text', label: 'Benefit Title' },
          description: { type: 'textarea', label: 'Description' }
        }
      }
    }
  },
  'gallery-filtered': {
    name: 'Gallery (Filtered)',
    icon: Image,
    category: 'gallery',
    fields: {
      title: { type: 'text', label: 'Section Title' },
      subtitle: { type: 'text', label: 'Section Subtitle' },
      items: {
        type: 'array',
        label: 'Gallery Items',
        itemFields: {
          url: { type: 'image', label: 'Image URL' },
          title: { type: 'text', label: 'Title' },
          category: { type: 'text', label: 'Category' }
        }
      }
    }
  },
  'cta-card': {
    name: 'CTA Card',
    icon: Zap,
    category: 'cta',
    fields: {
      headline: { type: 'text', label: 'Headline' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'Primary Button Text' },
      ctaLink: { type: 'url', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'url', label: 'Secondary Button Link' }
    }
  },
  'lead-magnet-landscaping': {
    name: 'Landscape Estimator',
    icon: Zap,
    category: 'lead-magnet',
    defaultContent: {
      headline: 'Get Your Free Landscape Estimate',
      subheadline: 'Answer 4 quick questions and see your personalized price range instantly.',
      ctaText: 'See My Estimate',
    },
    fields: {
      headline: { type: 'text', label: 'Headline' },
      subheadline: { type: 'textarea', label: 'Subheadline' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
    }
  },
  'lead-magnet-auto-wrap': {
    name: 'Vehicle Wrap Designer',
    icon: Zap,
    category: 'lead-magnet',
    defaultContent: {
      headline: 'Design Your Vehicle Wrap',
      subheadline: 'Get an instant price estimate in under 2 minutes.',
      ctaText: 'Get My Estimate',
    },
    fields: {
      headline: { type: 'text', label: 'Headline' },
      subheadline: { type: 'textarea', label: 'Subheadline' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
    }
  },
  'custom-row': {
    name: 'Custom Row',
    icon: Layout,
    category: 'custom',
    isCustomRow: true,
    defaultContent: {
      layout: '2col',
      bgColor: '',
      padding: 'normal',
      columns: [{ elements: [] }, { elements: [] }],
    },
    fields: {}
  },
};

// Available templates for adding new sections
const AVAILABLE_TEMPLATES = [
  { id: 'custom-row', category: 'Custom' },
  { id: 'trust-banner-scroll', category: 'Trust' },
  { id: 'nav-sticky-dark', category: 'Navigation' },
  { id: 'hero-fullscreen-dark', category: 'Hero' },
  { id: 'hero-gradient', category: 'Hero' },
  { id: 'features-icon-row', category: 'Features' },
  { id: 'services-cards-3col', category: 'Services' },
  { id: 'benefits-numbered', category: 'Benefits' },
  { id: 'gallery-mixed-grid', category: 'Gallery' },
  { id: 'testimonials-3col', category: 'Testimonials' },
  { id: 'cta-gradient-full', category: 'CTA' },
  { id: 'content-block', category: 'Content' },
  { id: 'contact-split', category: 'Contact' },
  { id: 'footer-4col-dark', category: 'Footer' },
  { id: 'lead-magnet-landscaping', category: 'Lead Magnets' },
  { id: 'lead-magnet-auto-wrap', category: 'Lead Magnets' },
];

// ============================================
// COLUMN LAYOUTS for Custom Row
// ============================================
const COLUMN_LAYOUTS = [
  { id: '1col',            label: 'Full Width',   preview: '████████████' },
  { id: '2col',            label: '50 / 50',       preview: '██████  ██████' },
  { id: '2col-wide-left',  label: '66 / 33',       preview: '████████  ████' },
  { id: '2col-wide-right', label: '33 / 66',       preview: '████  ████████' },
  { id: '3col',            label: '33 / 33 / 33',  preview: '████ ████ ████' },
];

// ============================================
// ELEMENT TYPES for Custom Row columns
// ============================================
const ELEMENT_TYPES = [
  { id: 'heading',  label: 'Heading',  icon: Type,      defaultProps: { tag: 'h2', text: 'Your Heading Here', align: 'left', color: '' } },
  { id: 'text',     label: 'Text',     icon: AlignLeft,  defaultProps: { text: 'Your text content here.', align: 'left', color: '' } },
  { id: 'image',    label: 'Image',    icon: Image,      defaultProps: { url: '', alt: '', rounded: true, shadow: true } },
  { id: 'button',   label: 'Button',   icon: Zap,        defaultProps: { text: 'Click Here', link: '#', style: 'primary', size: 'medium', align: 'left' } },
  { id: 'spacer',   label: 'Spacer',   icon: Minus,      defaultProps: { height: 32 } },
  { id: 'divider',  label: 'Divider',  icon: Minus,      defaultProps: { color: '#e5e7eb', margin: 16 } },
];

// ============================================
// PAGE TEMPLATES for Add Page modal
// ============================================
const PAGE_TEMPLATES = [
  {
    id: 'home',
    label: 'Home Page',
    icon: Home,
    description: 'Hero, reviews, features, services, CTA',
    filenameDefault: 'index.html',
    sections: ['hero-fullscreen-dark', 'review-marquee', 'features-icon-row', 'services-cards-3col', 'cta-gradient-full'],
  },
  {
    id: 'services',
    label: 'Services',
    icon: Settings,
    description: 'Banner, services list, benefits, testimonials',
    filenameDefault: 'services.html',
    sections: ['hero-page-banner', 'services-carousel', 'benefits-numbered', 'testimonials-3col', 'cta-card'],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: Camera,
    description: 'Filterable photo gallery with CTA',
    filenameDefault: 'gallery.html',
    sections: ['hero-page-banner', 'gallery-mixed-grid', 'cta-card'],
  },
  {
    id: 'about',
    label: 'About',
    icon: Star,
    description: 'Your story, mission, and values',
    filenameDefault: 'about.html',
    sections: ['hero-page-banner', 'importance-split', 'features-icon-row', 'cta-card'],
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Phone,
    description: 'Contact form, phone, hours, location',
    filenameDefault: 'contact.html',
    sections: ['contact-split'],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: DollarSign,
    description: 'Packages, pricing cards, FAQ',
    filenameDefault: 'pricing.html',
    sections: ['hero-page-banner', 'services-cards-3col', 'benefits-numbered', 'cta-card'],
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    description: 'Frequently asked questions',
    filenameDefault: 'faq.html',
    sections: ['hero-page-banner', 'benefits-numbered', 'cta-card'],
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: MessageSquare,
    description: 'Client reviews and success stories',
    filenameDefault: 'testimonials.html',
    sections: ['hero-page-banner', 'testimonials-3col', 'review-marquee', 'cta-card'],
  },
  {
    id: 'blank',
    label: 'Blank Page',
    icon: FileText,
    description: 'Start from scratch',
    filenameDefault: '',
    sections: [],
  },
];

// ============================================
// IMAGE FIELD EDITOR — URL input + file upload
// ============================================
function ImageFieldEditor({ field, value, onChange, fieldKey, apiUrl: apiUrlProp }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const apiUrl = apiUrlProp || import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(fieldKey, data.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder="https://..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
        <label className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition ${
          uploading
            ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
            : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
        }`}>
          {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? '' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
      </div>
      {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
      {value && (
        <img src={value} alt="Preview" className="mt-2 max-h-32 w-full rounded-lg object-cover" />
      )}
    </div>
  );
}

// ============================================
// LINK HELPERS
// ============================================
function friendlyLinkName(link, sectionIds = [], pages = []) {
  if (!link) return null;
  if (link === '#') return 'Top of page';
  if (link.startsWith('tel:')) {
    const num = link.slice(4);
    return num ? `Call ${num}` : 'Phone number';
  }
  if (link.startsWith('mailto:')) {
    const email = link.slice(7);
    return email ? `Email ${email}` : 'Email address';
  }
  if (link.startsWith('#')) {
    const id = link.slice(1);
    const pg = pages.find(p => p.filename?.replace('.html', '') === id);
    if (pg) return `${pg.meta?.title || id} page`;
    return `${id.charAt(0).toUpperCase() + id.slice(1)} section`;
  }
  if (link === '/' || link === 'index.html') return 'Home page';
  const pg = pages.find(p => p.filename === link || p.filename === link.replace(/^\//, ''));
  if (pg) return `${pg.meta?.title || link} page`;
  if (link.endsWith('.html')) {
    const name = link.replace('.html', '');
    return `${name.charAt(0).toUpperCase() + name.slice(1)} page`;
  }
  if (link.startsWith('http')) {
    try { return new URL(link).hostname; } catch { return link; }
  }
  return link;
}

// Shared picker dropdown used by both UrlFieldEditor and ButtonPairFieldEditor
function LinkPickerDropdown({ sectionIds, pages, onSelect }) {
  return (
    <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden z-10">
      {sectionIds.length > 0 && (
        <div className="p-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">Sections on this page</p>
          <div className="flex flex-wrap gap-1">
            {sectionIds.map(id => (
              <button key={id} type="button" onClick={() => onSelect(`#${id}`)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition">
                {friendlyLinkName(`#${id}`, sectionIds, pages)}
              </button>
            ))}
          </div>
        </div>
      )}
      {pages.length > 0 && (
        <div className="p-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">Pages</p>
          <div className="flex flex-wrap gap-1">
            {pages.map(page => (
              <button key={page.filename} type="button"
                onClick={() => onSelect(page.filename === 'index.html' ? '/' : page.filename)}
                className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition">
                {page.meta?.title || page.filename}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">Special</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => onSelect('tel:')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100 transition">
            <Phone className="w-3 h-3" /> Phone (tel:)
          </button>
          <button type="button" onClick={() => onSelect('mailto:')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100 transition">
            <Mail className="w-3 h-3" /> Email (mailto:)
          </button>
          <button type="button" onClick={() => onSelect('#')}
            className="px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100 transition">
            # (top of page)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BUTTON PAIR FIELD EDITOR
// Text input + inline link picker, combined in one row
// Used when a 'text' field is immediately followed by a 'url' field
// ============================================
function ButtonPairFieldEditor({ label, textValue, linkValue, onTextChange, onLinkChange, pages = [], sectionIds = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const linkLabel = friendlyLinkName(linkValue, sectionIds, pages);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={textValue || ''}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Button text..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition ${
            showPicker ? 'border-amber-500 bg-amber-100 text-amber-700'
              : linkValue ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-300 text-gray-600 hover:border-amber-300 hover:text-amber-700'
          }`}
          title={linkLabel || 'Set link target'}
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      {linkLabel && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600">
          <Link2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{linkLabel}</span>
          <button type="button" onClick={() => { onLinkChange(''); setShowPicker(false); }}
            className="ml-auto flex-shrink-0 text-gray-300 hover:text-red-400 transition" title="Remove link">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {showPicker && (
        <LinkPickerDropdown
          sectionIds={sectionIds}
          pages={pages}
          onSelect={(href) => { onLinkChange(href); setShowPicker(false); }}
        />
      )}
    </div>
  );
}

// ============================================
// URL FIELD EDITOR COMPONENT
// Standalone URL field (no paired text input)
// ============================================
function UrlFieldEditor({ field, value, onChange, fieldKey, pages = [], sectionIds = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const linkLabel = friendlyLinkName(value, sectionIds, pages);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={field.placeholder || '#section or https://...'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition ${
            showPicker ? 'border-amber-500 bg-amber-100 text-amber-700'
              : value ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-300 text-gray-600 hover:border-amber-300 hover:text-amber-700'
          }`}
          title="Pick a link target"
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      {linkLabel && (
        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
          <Link2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{linkLabel}</span>
        </div>
      )}
      {showPicker && (
        <LinkPickerDropdown
          sectionIds={sectionIds}
          pages={pages}
          onSelect={(href) => { onChange(fieldKey, href); setShowPicker(false); }}
        />
      )}
    </div>
  );
}

// ============================================
// FIELD EDITOR COMPONENT
// ============================================
function FieldEditor({ field, value, onChange, fieldKey, apiUrl, pages, sectionIds }) {
  if (field.type === 'text') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <input
          type="number"
          value={value || ''}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(fieldKey, parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
    );
  }

  if (field.type === 'url') {
    return <UrlFieldEditor field={field} value={value} onChange={onChange} fieldKey={fieldKey} pages={pages} sectionIds={sectionIds} />;
  }

  if (field.type === 'image') {
    return <ImageFieldEditor field={field} value={value} onChange={onChange} fieldKey={fieldKey} apiUrl={apiUrl} />;
  }

  if (field.type === 'checkbox') {
    return (
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
        />
        <label className="text-sm font-medium text-gray-700">{field.label}</label>
      </div>
    );
  }

  return null;
}

// ============================================
// ARRAY FIELD EDITOR
// ============================================
function ArrayFieldEditor({ field, value = [], onChange, fieldKey, apiUrl, pages, sectionIds }) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    const newItem = {};
    Object.keys(field.itemFields).forEach(key => {
      newItem[key] = '';
    });
    onChange(fieldKey, [...items, newItem]);
  };

  const updateItem = (index, itemKey, itemValue) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [itemKey]: itemValue };
    onChange(fieldKey, newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(fieldKey, newItems);
  };

  const moveItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(fieldKey, newItems);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500">Item {index + 1}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {(() => {
              const itemEntries = Object.entries(field.itemFields);
              const rendered = [];
              let skipNext = false;
              itemEntries.forEach(([itemKey, itemField], i) => {
                if (skipNext) { skipNext = false; return; }
                const nextEntry = i < itemEntries.length - 1 ? itemEntries[i + 1] : null;
                if (itemField.type === 'text' && nextEntry && nextEntry[1].type === 'url') {
                  const [linkKey] = nextEntry;
                  rendered.push(
                    <ButtonPairFieldEditor
                      key={itemKey}
                      label={itemField.label}
                      textValue={item[itemKey]}
                      linkValue={item[linkKey]}
                      onTextChange={(val) => updateItem(index, itemKey, val)}
                      onLinkChange={(val) => updateItem(index, linkKey, val)}
                      pages={pages}
                      sectionIds={sectionIds}
                    />
                  );
                  skipNext = true;
                  return;
                }
                rendered.push(
                  <FieldEditor
                    key={itemKey}
                    field={itemField}
                    value={item[itemKey]}
                    onChange={(_, val) => updateItem(index, itemKey, val)}
                    fieldKey={itemKey}
                    apiUrl={apiUrl}
                    pages={pages}
                    sectionIds={sectionIds}
                  />
                );
              });
              return rendered;
            })()}
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-2 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
      >
        <Plus className="w-4 h-4" /> Add Item
      </button>
    </div>
  );
}

// ============================================
// SECTION CARD COMPONENT
// ============================================
function SectionCard({ section, index, isSelected, onSelect, onMoveUp, onMoveDown, onDelete, totalSections }) {
  const templateDef = TEMPLATE_DEFINITIONS[section.template] || { 
    name: section.template, 
    icon: Layout,
    category: 'unknown'
  };
  const IconComponent = templateDef.icon;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-50 shadow-lg ring-2 ring-amber-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-100' : 'bg-gray-100'}`}>
            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{templateDef.name}</h3>
            <p className="text-xs text-gray-500">Section {index + 1}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Move section up"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            title="Move section down"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalSections - 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            title="Delete section"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CUSTOM ROW EDITOR
// ============================================
function CustomRowEditor({ content = {}, onChange, apiUrl }) {
  const [editingEl, setEditingEl] = useState(null); // { colIdx, elIdx }
  const [addingEl, setAddingEl] = useState(null);   // colIdx

  const layout = content.layout || '2col';
  const columns = content.columns || [{ elements: [] }, { elements: [] }];
  const bgColor = content.bgColor || '';
  const padding = content.padding || 'normal';

  const colCount = layout === '1col' ? 1 : layout === '3col' ? 3 : 2;

  // Ensure columns array matches colCount
  const normalizedCols = Array.from({ length: colCount }, (_, i) => columns[i] || { elements: [] });

  const update = (patch) => {
    onChange({ ...content, ...patch });
  };

  const updateLayout = (newLayout) => {
    const newColCount = newLayout === '1col' ? 1 : newLayout === '3col' ? 3 : 2;
    const newCols = Array.from({ length: newColCount }, (_, i) => columns[i] || { elements: [] });
    setEditingEl(null);
    setAddingEl(null);
    onChange({ ...content, layout: newLayout, columns: newCols });
  };

  const updateColumn = (colIdx, newCol) => {
    const newCols = normalizedCols.map((c, i) => i === colIdx ? newCol : c);
    onChange({ ...content, columns: newCols });
  };

  const addElement = (colIdx, typeId) => {
    const typeDef = ELEMENT_TYPES.find(t => t.id === typeId);
    if (!typeDef) return;
    const col = normalizedCols[colIdx];
    const newEl = { type: typeId, ...typeDef.defaultProps };
    const newElements = [...(col.elements || []), newEl];
    updateColumn(colIdx, { ...col, elements: newElements });
    setAddingEl(null);
    setEditingEl({ colIdx, elIdx: newElements.length - 1 });
  };

  const removeElement = (colIdx, elIdx) => {
    const col = normalizedCols[colIdx];
    const newElements = col.elements.filter((_, i) => i !== elIdx);
    updateColumn(colIdx, { ...col, elements: newElements });
    if (editingEl?.colIdx === colIdx && editingEl?.elIdx === elIdx) setEditingEl(null);
  };

  const moveElement = (colIdx, elIdx, dir) => {
    const col = normalizedCols[colIdx];
    const els = [...col.elements];
    const newIdx = elIdx + (dir === 'up' ? -1 : 1);
    if (newIdx < 0 || newIdx >= els.length) return;
    [els[elIdx], els[newIdx]] = [els[newIdx], els[elIdx]];
    updateColumn(colIdx, { ...col, elements: els });
    setEditingEl({ colIdx, elIdx: newIdx });
  };

  const updateElement = (colIdx, elIdx, patch) => {
    const col = normalizedCols[colIdx];
    const els = col.elements.map((el, i) => i === elIdx ? { ...el, ...patch } : el);
    updateColumn(colIdx, { ...col, elements: els });
  };

  const renderElementEditor = (el, colIdx, elIdx) => {
    const isEditing = editingEl?.colIdx === colIdx && editingEl?.elIdx === elIdx;
    const typeDef = ELEMENT_TYPES.find(t => t.id === el.type);
    const Icon = typeDef?.icon || Layout;

    return (
      <div key={elIdx} className={`border rounded-lg overflow-hidden ${isEditing ? 'border-amber-400 shadow-sm' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50">
          <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 flex-1 truncate">{el.type === 'heading' ? `${el.tag?.toUpperCase() || 'H2'}: ${el.text?.slice(0, 20) || ''}` : el.type === 'text' ? (el.text?.slice(0, 24) || 'Text') : el.type === 'image' ? 'Image' : el.type === 'button' ? el.text || 'Button' : el.type === 'spacer' ? `Spacer (${el.height}px)` : 'Divider'}</span>
          <div className="flex gap-0.5">
            <button title="Move up" onClick={() => moveElement(colIdx, elIdx, 'up')} disabled={elIdx === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button title="Move down" onClick={() => moveElement(colIdx, elIdx, 'down')} disabled={elIdx === (normalizedCols[colIdx]?.elements?.length || 0) - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
            <button title="Edit" onClick={() => setEditingEl(isEditing ? null : { colIdx, elIdx })} className={`p-0.5 transition ${isEditing ? 'text-amber-600' : 'text-gray-400 hover:text-amber-600'}`}><Edit3 className="w-3.5 h-3.5" /></button>
            <button title="Delete" onClick={() => removeElement(colIdx, elIdx)} className="p-0.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {isEditing && (
          <div className="p-2 bg-white border-t border-gray-100 space-y-2">
            {el.type === 'heading' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Level</label>
                  <select value={el.tag || 'h2'} onChange={e => updateElement(colIdx, elIdx, { tag: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                    <option value="h1">H1 — Largest</option>
                    <option value="h2">H2 — Large</option>
                    <option value="h3">H3 — Medium</option>
                    <option value="h4">H4 — Small</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Text</label>
                  <input type="text" value={el.text || ''} onChange={e => updateElement(colIdx, elIdx, { text: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Align</label>
                  <select value={el.align || 'left'} onChange={e => updateElement(colIdx, elIdx, { align: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}
            {el.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Text</label>
                  <textarea value={el.text || ''} onChange={e => updateElement(colIdx, elIdx, { text: e.target.value })} rows={3} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Align</label>
                  <select value={el.align || 'left'} onChange={e => updateElement(colIdx, elIdx, { align: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}
            {el.type === 'image' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Image URL</label>
                  <div className="flex gap-1">
                    <input type="text" value={el.url || ''} onChange={e => updateElement(colIdx, elIdx, { url: e.target.value })} placeholder="https://..." className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                    <label className="flex items-center px-2 py-1 border border-amber-300 text-amber-700 bg-amber-50 rounded text-xs cursor-pointer hover:bg-amber-100 transition">
                      <Upload className="w-3 h-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${apiUrl}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                        const d = await res.json();
                        if (res.ok) updateElement(colIdx, elIdx, { url: d.url });
                      }} />
                    </label>
                  </div>
                  {el.url && <img src={el.url} alt="" className="mt-1 max-h-20 w-full rounded object-cover" />}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Alt Text</label>
                  <input type="text" value={el.alt || ''} onChange={e => updateElement(colIdx, elIdx, { alt: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" checked={el.rounded !== false} onChange={e => updateElement(colIdx, elIdx, { rounded: e.target.checked })} className="w-3 h-3" /> Rounded
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" checked={el.shadow !== false} onChange={e => updateElement(colIdx, elIdx, { shadow: e.target.checked })} className="w-3 h-3" /> Shadow
                  </label>
                </div>
              </>
            )}
            {el.type === 'button' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Button Text</label>
                  <input type="text" value={el.text || ''} onChange={e => updateElement(colIdx, elIdx, { text: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Link</label>
                  <input type="text" value={el.link || ''} onChange={e => updateElement(colIdx, elIdx, { link: e.target.value })} placeholder="#section or /page or https://..." className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Style</label>
                    <select value={el.style || 'primary'} onChange={e => updateElement(colIdx, elIdx, { style: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Size</label>
                    <select value={el.size || 'medium'} onChange={e => updateElement(colIdx, elIdx, { size: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Align</label>
                  <select value={el.align || 'left'} onChange={e => updateElement(colIdx, elIdx, { align: e.target.value })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}
            {el.type === 'spacer' && (
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Height (px)</label>
                <input type="number" value={el.height || 32} min={8} max={200} onChange={e => updateElement(colIdx, elIdx, { height: parseInt(e.target.value) || 32 })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
              </div>
            )}
            {el.type === 'divider' && (
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Margin (px)</label>
                <input type="number" value={el.margin || 16} min={0} max={64} onChange={e => updateElement(colIdx, elIdx, { margin: parseInt(e.target.value) || 16 })} className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Layout picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Layout</label>
        <div className="grid grid-cols-1 gap-1">
          {COLUMN_LAYOUTS.map(cl => (
            <button key={cl.id} type="button" onClick={() => updateLayout(cl.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition ${layout === cl.id ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <span>{cl.label}</span>
              <span className="font-mono text-gray-400">{cl.preview}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Background & Padding */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Background</label>
          <div className="flex items-center gap-1.5">
            <input type="color" value={bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })} className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0" />
            <input type="text" value={bgColor || ''} onChange={e => update({ bgColor: e.target.value })} placeholder="default" className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Padding</label>
          <select value={padding} onChange={e => update({ padding: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-400">
            <option value="none">None</option>
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      {/* Columns */}
      {normalizedCols.map((col, colIdx) => (
        <div key={colIdx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600">
              {colCount === 1 ? 'Content' : `Column ${colIdx + 1}`}
            </span>
          </div>
          <div className="p-2 space-y-1.5">
            {(col.elements || []).map((el, elIdx) => renderElementEditor(el, colIdx, elIdx))}

            {addingEl === colIdx ? (
              <div>
                <div className="grid grid-cols-3 gap-1 mb-1">
                  {ELEMENT_TYPES.map(et => {
                    const EIcon = et.icon;
                    return (
                      <button key={et.id} onClick={() => addElement(colIdx, et.id)}
                        className="flex flex-col items-center gap-0.5 p-2 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition text-xs text-gray-600">
                        <EIcon className="w-4 h-4 text-gray-500" />
                        {et.label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setAddingEl(null)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingEl(colIdx)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded border border-dashed border-amber-200 transition">
                <Plus className="w-3.5 h-3.5" /> Add Element
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ADD PAGE MODAL
// ============================================
function AddPageModal({ isOpen, onClose, onAdd, existingPages = [] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pageName, setPageName] = useState('');

  if (!isOpen) return null;

  const handleTemplateSelect = (tpl) => {
    setSelectedTemplate(tpl);
    if (!pageName || PAGE_TEMPLATES.find(t => t.label.toLowerCase() === pageName.toLowerCase())) {
      setPageName(tpl.label === 'Home Page' ? 'Home' : tpl.label);
    }
  };

  const handleAdd = () => {
    if (!selectedTemplate || !pageName.trim()) return;
    onAdd({ template: selectedTemplate, name: pageName.trim() });
    setSelectedTemplate(null);
    setPageName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Add Page</h2>
            <p className="text-xs text-gray-500">Choose a template to start with</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            {PAGE_TEMPLATES.map(tpl => {
              const Icon = tpl.icon;
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <button key={tpl.id} onClick={() => handleTemplateSelect(tpl)}
                  className={`p-4 rounded-xl border-2 text-left transition flex flex-col gap-2 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tpl.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tpl.description}</div>
                  </div>
                  {tpl.sections.length > 0 && (
                    <div className="text-xs text-gray-400">{tpl.sections.length} sections</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedTemplate && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={pageName}
                onChange={e => setPageName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. About Us"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm"
              />
              <button onClick={handleAdd} disabled={!pageName.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium text-sm transition">
                Add Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// DELETE PAGE MODAL
// ============================================
function DeletePageModal({ page, onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);

  if (!page) return null;
  const sectionCount = page.sections?.length || 0;
  const pageName = (page.filename || '').replace('.html', '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Delete "{pageName}" page?</h2>
              <p className="text-sm text-gray-500 mt-1">
                {sectionCount > 0
                  ? `This will permanently delete this page and its ${sectionCount} section${sectionCount !== 1 ? 's' : ''}. This cannot be undone.`
                  : 'This will permanently delete this page. This cannot be undone.'}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
            <span className="text-sm text-red-700 font-medium">I understand this cannot be undone</span>
          </label>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
          <button onClick={onConfirm} disabled={!confirmed} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition font-medium">
            Delete Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD SECTION MODAL
// ============================================
function AddSectionModal({ isOpen, onClose, onAdd }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  if (!isOpen) return null;

  const categories = [...new Set(AVAILABLE_TEMPLATES.map(t => t.category))];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Add Section</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TEMPLATES.filter(t => t.category === category).map(template => {
                  const def = TEMPLATE_DEFINITIONS[template.id];
                  const Icon = def?.icon || Layout;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        selectedTemplate === template.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">{def?.name || template.id}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => { onAdd(selectedTemplate); onClose(); }}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN EDITOR COMPONENT
// ============================================
export default function EditorV2() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [showGoogleImportModal, setShowGoogleImportModal] = useState(false);
  const [googleUrl, setGoogleUrl] = useState('');
  const [importingReviews, setImportingReviews] = useState(false);
  const [reviewStarFilter, setReviewStarFilter] = useState('above');
  const [activeEditorPage, setActiveEditorPage] = useState(0);
  const [allPagesHtml, setAllPagesHtml] = useState(null);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [deletingPage, setDeletingPage] = useState(null); // { index, page }

  // Undo/Redo
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const historyTimerRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ============================================
  // LOAD PAGE DATA
  // ============================================
  useEffect(() => {
    loadPageData();
  }, []);

  // ============================================
  // PREVIEW IFRAME: Listen for page-nav messages
  // so clicking nav links switches the active page
  // ============================================
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'preview-navigate' && pageData?.multiPage) {
        const target = e.data.page; // e.g. 'services.html'
        const idx = pageData.pages?.findIndex(p => p.filename === target);
        if (idx !== -1 && idx !== undefined) {
          setActiveEditorPage(idx);
          setSelectedSectionIndex(null);
          setIsEditingSection(false);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [pageData]);

  // ============================================
  // UNDO / REDO
  // ============================================
  const pushHistory = useCallback((pd) => {
    if (isUndoRedoRef.current) return;
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      const snapshot = JSON.stringify(pd);
      if (historyRef.current[historyIdxRef.current] === snapshot) return;
      // Trim future states
      historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 50) historyRef.current.shift();
      historyIdxRef.current = historyRef.current.length - 1;
      setCanUndo(historyIdxRef.current > 0);
      setCanRedo(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (pageData && !isLoading) pushHistory(pageData);
  }, [pageData, isLoading, pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    isUndoRedoRef.current = true;
    historyIdxRef.current--;
    setPageData(JSON.parse(historyRef.current[historyIdxRef.current]));
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
    requestAnimationFrame(() => { isUndoRedoRef.current = false; });
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    isUndoRedoRef.current = true;
    historyIdxRef.current++;
    setPageData(JSON.parse(historyRef.current[historyIdxRef.current]));
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    requestAnimationFrame(() => { isUndoRedoRef.current = false; });
  }, []);

  const loadPageData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/website`, {
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.website?.page_data) {
          let pd = data.website.page_data;
          if (typeof pd === 'string') {
            pd = JSON.parse(pd);
          }
          setPageData(pd);
          const sectionCount = pd.multiPage
            ? pd.pages?.reduce((sum, p) => sum + (p.sections?.length || 0), 0)
            : pd.sections?.length;
          console.log('✅ Loaded V2 schema with', sectionCount, 'sections (multiPage:', !!pd.multiPage, ')');
        } else {
          // No page_data - create empty schema
          setPageData({ meta: {}, theme: {}, sections: [] });
        }
        
        // Also load preview HTML
        if (data.website?.html_content) {
          setPreviewHtml(data.website.html_content);
        }

        // Load all pages HTML for multi-page sites
        if (data.website?.pages) {
          setAllPagesHtml(data.website.pages);
        }
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      setPageData({ meta: {}, theme: {}, sections: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // UPDATE SECTION CONTENT
  // ============================================
  const updateSectionContent = useCallback((sectionIndex, fieldKey, value) => {
    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const secs = newData.multiPage ? newData.pages[activeEditorPage].sections : newData.sections;
      if (!secs[sectionIndex].content) secs[sectionIndex].content = {};
      secs[sectionIndex].content[fieldKey] = value;
      return newData;
    });
  }, [activeEditorPage]);

  // ============================================
  // MOVE SECTION
  // ============================================
  const moveSection = useCallback((index, direction) => {
    const sections = pageData?.multiPage ? pageData.pages[activeEditorPage]?.sections : pageData?.sections;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= (sections?.length || 0)) return;

    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const secs = newData.multiPage ? newData.pages[activeEditorPage].sections : newData.sections;
      const [removed] = secs.splice(index, 1);
      secs.splice(newIndex, 0, removed);
      return newData;
    });

    setSelectedSectionIndex(newIndex);
  }, [pageData, activeEditorPage]);

  // ============================================
  // DELETE SECTION
  // ============================================
  const deleteSection = useCallback((index) => {
    if (!confirm('Delete this section?')) return;

    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (newData.multiPage) {
        newData.pages[activeEditorPage].sections.splice(index, 1);
      } else {
        newData.sections.splice(index, 1);
      }
      return newData;
    });

    setSelectedSectionIndex(null);
  }, [activeEditorPage]);

  // ============================================
  // ADD / DELETE PAGE
  // ============================================
  const handleAddPage = useCallback(({ template, name }) => {
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.html';
    const sections = (template.sections || []).map(tId => ({
      id: `s${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      template: tId,
      content: TEMPLATE_DEFINITIONS[tId]?.defaultContent ? { ...TEMPLATE_DEFINITIONS[tId].defaultContent } : {}
    }));

    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.multiPage) {
        newData.multiPage = true;
        newData.pages = [{ filename: 'index.html', meta: newData.meta || {}, sections: newData.sections || [] }];
        delete newData.sections;
      }
      const safeFilename = newData.pages.some(p => p.filename === filename)
        ? filename.replace('.html', `-${Date.now()}.html`)
        : filename;
      newData.pages.push({ filename: safeFilename, meta: { title: name, description: '' }, sections });
      return newData;
    });

    setShowAddPageModal(false);
    setActiveEditorPage((pageData?.pages?.length || 1));
    setSelectedSectionIndex(null);
    setIsEditingSection(false);
  }, [pageData]);

  const handleDeletePage = useCallback(() => {
    if (!deletingPage) return;
    const { index: i } = deletingPage;

    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.pages.splice(i, 1);
      return newData;
    });
    setActiveEditorPage(prev => (prev >= i ? Math.max(0, prev - 1) : prev));
    setSelectedSectionIndex(null);
    setIsEditingSection(false);
    setDeletingPage(null);
  }, [deletingPage]);

  // ============================================
  // ADD SECTION
  // ============================================
  const addSection = useCallback((templateId) => {
    if (!templateId) return;

    const def = TEMPLATE_DEFINITIONS[templateId];
    const newSection = {
      id: `s${Date.now()}`,
      template: templateId,
      content: def?.defaultContent ? { ...def.defaultContent } : {}
    };

    const currentSecs = pageData?.multiPage ? pageData.pages[activeEditorPage]?.sections : pageData?.sections;
    setPageData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (newData.multiPage) {
        newData.pages[activeEditorPage].sections.push(newSection);
      } else {
        newData.sections.push(newSection);
      }
      return newData;
    });

    setSelectedSectionIndex(currentSecs?.length || 0);
  }, [pageData, activeEditorPage]);

  // ============================================
  // IMPORT GOOGLE REVIEWS
  // ============================================
  const [fetchedGoogleReviews, setFetchedGoogleReviews] = useState(null);

  const importGoogleReviews = async () => {
    if (!googleUrl.trim()) {
      alert('Please enter your business name or Place ID');
      return;
    }

    setImportingReviews(true);
    setFetchedGoogleReviews(null);

    try {
      const token = localStorage.getItem('token');
      // Use Places API endpoint (reliable) instead of Puppeteer scraper
      const isPlaceId = googleUrl.startsWith('ChIJ') || googleUrl.startsWith('places/');
      const body = isPlaceId
        ? { placeId: googleUrl.replace('places/', '') }
        : { query: googleUrl };

      const response = await fetch(`${apiUrl}/api/google-business/fetch-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to fetch reviews');
        return;
      }

      if (data.reviews && data.reviews.length > 0) {
        setFetchedGoogleReviews(data);
      } else {
        alert(data.message || 'No reviews found. Try a more specific business name.');
      }

    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to fetch reviews. Please try again.');
    } finally {
      setImportingReviews(false);
    }
  };

  const applyGoogleReviews = () => {
    if (!fetchedGoogleReviews?.reviews) return;

    // Apply star filter
    const filtered = fetchedGoogleReviews.reviews.filter(r => {
      const stars = r.stars || r.rating || 5;
      return reviewStarFilter === 'above' ? stars >= 4 : stars < 4;
    });

    if (filtered.length === 0) {
      alert(`No reviews match the selected filter (${reviewStarFilter === 'above' ? '4+ stars' : 'under 4 stars'}). Try the other filter.`);
      return;
    }

    // Determine which field key this section uses
    const secs = pageData?.multiPage
      ? pageData.pages?.[activeEditorPage]?.sections
      : pageData?.sections;
    const section = secs?.[selectedSectionIndex];
    const templateDef = TEMPLATE_DEFINITIONS[section?.template];
    const hasTestimonials = templateDef?.fields?.testimonials;

    if (hasTestimonials) {
      // Map to testimonials format (quote/author/role/rating)
      const testimonials = filtered.map(r => ({
        quote: r.text,
        author: r.name,
        role: 'Verified Customer',
        rating: r.stars || r.rating || 5
      }));
      updateSectionContent(selectedSectionIndex, 'testimonials', testimonials);
    } else {
      updateSectionContent(selectedSectionIndex, 'reviews', filtered);
    }

    setShowGoogleImportModal(false);
    setGoogleUrl('');
    setFetchedGoogleReviews(null);
  };

  // ============================================
  // LIVE PREVIEW - Debounced auto-update
  // ============================================
  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasContent = pageData && !isLoading && (
        (pageData.multiPage && pageData.pages?.some(p => p.sections?.length > 0)) ||
        (!pageData.multiPage && pageData.sections?.length > 0)
      );
      if (hasContent) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${apiUrl}/api/website/save-schema`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ page_data: pageData })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.html) {
              setPreviewHtml(data.html);
            }
            if (data.pages) {
              setAllPagesHtml(data.pages);
            }
          }
        } catch (error) {
          console.error('Live preview update error:', error);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [pageData, isLoading]);

  // ============================================
  // SAVE
  // ============================================
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Call backend to re-render and save
      const response = await fetch(`${apiUrl}/api/website/save-schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page_data: pageData })
      });

      if (response.ok) {
        navigate('/dashboard?tab=website');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  const currentSections = pageData?.multiPage
    ? (pageData.pages?.[activeEditorPage]?.sections || [])
    : (pageData?.sections || []);

  // For URL field picker
  const currentSectionIds = [...new Set(currentSections.map(sec => sec.id || sec.template).filter(Boolean))];
  const currentPages = pageData?.multiPage ? (pageData.pages || []) : [];

  const selectedSection = selectedSectionIndex !== null ? currentSections[selectedSectionIndex] : null;
  const selectedTemplateDef = selectedSection ? TEMPLATE_DEFINITIONS[selectedSection.template] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard?tab=website')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
            <button
              title="Undo"
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              title="Redo"
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device Preview */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            title="Desktop preview"
            onClick={() => setDevicePreview('desktop')}
            className={`p-2 rounded-md transition ${
              devicePreview === 'desktop'
                ? 'bg-white shadow text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>
          <button
            title="Tablet preview"
            onClick={() => setDevicePreview('tablet')}
            className={`p-2 rounded-md transition ${
              devicePreview === 'tablet'
                ? 'bg-white shadow text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tablet className="w-5 h-5" />
          </button>
          <button
            title="Mobile preview"
            onClick={() => setDevicePreview('mobile')}
            className={`p-2 rounded-md transition ${
              devicePreview === 'mobile'
                ? 'bg-white shadow text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(previewHtml ? URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' })) : '#', '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================ */}
        {/* LEFT SIDEBAR - Section List OR Editor */}
        {/* ============================================ */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {!isEditingSection ? (
            <>
              {/* Section List Mode */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Sections</h2>
                <p className="text-sm text-gray-500">{currentSections.length} sections</p>
              </div>

              {/* Page tabs for multi-page schemas */}
              {pageData?.multiPage && (
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Pages</p>
                    <button
                      onClick={() => setShowAddPageModal(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition text-xs font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add Page
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pageData.pages.map((page, i) => (
                      <div key={i} className={`flex items-center gap-0.5 rounded text-xs font-medium ${activeEditorPage === i ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        <button
                          onClick={() => { setActiveEditorPage(i); setSelectedSectionIndex(null); setIsEditingSection(false); }}
                          className="px-2 py-1 capitalize"
                        >
                          {(page.filename || `page-${i + 1}`).replace('.html', '')}
                        </button>
                        {page.filename !== 'index.html' && (
                          <button
                            title={`Delete ${page.filename.replace('.html', '')} page`}
                            onClick={() => setDeletingPage({ index: i, page })}
                            className={`pr-1.5 opacity-50 hover:opacity-100 transition ${activeEditorPage === i ? 'text-amber-200 hover:text-white' : 'text-gray-500 hover:text-red-600'}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add page button for single-page sites */}
              {!pageData?.multiPage && (
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowAddPageModal(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 py-1.5 rounded transition font-medium"
                  >
                    <Plus className="w-3 h-3" /> Add Another Page
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {currentSections.map((section, index) => (
                  <SectionCard
                    key={section.id || index}
                    section={section}
                    index={index}
                    isSelected={selectedSectionIndex === index}
                    onSelect={() => { setSelectedSectionIndex(index); setIsEditingSection(true); }}
                    onMoveUp={() => moveSection(index, 'up')}
                    onMoveDown={() => moveSection(index, 'down')}
                    onDelete={() => deleteSection(index)}
                    totalSections={currentSections.length}
                  />
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            </>
          ) : selectedSection && selectedTemplateDef ? (
            <>
              {/* Section Editor Mode */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-blue-50">
                <button
                  onClick={() => setIsEditingSection(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition mb-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to Sections</span>
                </button>
                <div className="flex items-center gap-2 mb-1">
                  {selectedTemplateDef.icon && <selectedTemplateDef.icon className="w-5 h-5 text-amber-600" />}
                  <h2 className="font-semibold text-gray-900">{selectedTemplateDef.name}</h2>
                </div>
                <p className="text-sm text-amber-600 font-medium">Editing Section {selectedSectionIndex + 1}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedTemplateDef.isCustomRow ? (
                  <CustomRowEditor
                    content={selectedSection.content || {}}
                    onChange={(newContent) => {
                      setPageData(prev => {
                        const newData = JSON.parse(JSON.stringify(prev));
                        const secs = newData.multiPage ? newData.pages[activeEditorPage].sections : newData.sections;
                        secs[selectedSectionIndex].content = newContent;
                        return newData;
                      });
                    }}
                    apiUrl={apiUrl}
                  />
                ) : (
                  (() => {
                    const entries = Object.entries(selectedTemplateDef.fields || {});
                    const result = [];
                    let skipNext = false;
                    entries.forEach(([fieldKey, field], index) => {
                      if (skipNext) { skipNext = false; return; }
                      if (field.type === 'array') {
                        result.push(
                          <div key={fieldKey}>
                            {(fieldKey === 'reviews' || fieldKey === 'testimonials') && (
                              <button
                                onClick={() => { setFetchedGoogleReviews(null); setShowGoogleImportModal(true); }}
                                className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                <Star className="w-4 h-4" />
                                Link Google Reviews
                              </button>
                            )}
                            <ArrayFieldEditor
                              field={field}
                              value={selectedSection.content?.[fieldKey]}
                              onChange={(_, value) => updateSectionContent(selectedSectionIndex, fieldKey, value)}
                              fieldKey={fieldKey}
                              apiUrl={apiUrl}
                              pages={currentPages}
                              sectionIds={currentSectionIds}
                            />
                          </div>
                        );
                        return;
                      }
                      // Pair adjacent text + url fields as a single button row
                      const nextEntry = index < entries.length - 1 ? entries[index + 1] : null;
                      if (field.type === 'text' && nextEntry && nextEntry[1].type === 'url') {
                        const [linkKey] = nextEntry;
                        result.push(
                          <ButtonPairFieldEditor
                            key={fieldKey}
                            label={field.label}
                            textValue={selectedSection.content?.[fieldKey]}
                            linkValue={selectedSection.content?.[linkKey]}
                            onTextChange={(val) => updateSectionContent(selectedSectionIndex, fieldKey, val)}
                            onLinkChange={(val) => updateSectionContent(selectedSectionIndex, linkKey, val)}
                            pages={currentPages}
                            sectionIds={currentSectionIds}
                          />
                        );
                        skipNext = true;
                        return;
                      }
                      result.push(
                        <FieldEditor
                          key={fieldKey}
                          field={field}
                          value={selectedSection.content?.[fieldKey]}
                          onChange={(_, value) => updateSectionContent(selectedSectionIndex, fieldKey, value)}
                          fieldKey={fieldKey}
                          apiUrl={apiUrl}
                          pages={currentPages}
                          sectionIds={currentSectionIds}
                        />
                      );
                    });
                    return result;
                  })()
                )}
              </div>
            </>
          ) : isEditingSection ? (
            // Template not in TEMPLATE_DEFINITIONS — show back button + message
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-blue-50">
                <button
                  onClick={() => setIsEditingSection(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to Sections</span>
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
                <div className="text-center">
                  <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No editable fields</p>
                  <p className="text-xs text-gray-400">{selectedSection?.template}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
              <div className="text-center">
                <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a section to edit</p>
              </div>
            </div>
          )}
        </aside>

        {/* ============================================ */}
        {/* CENTER - Preview */}
        {/* ============================================ */}
        <main className="flex-1 overflow-auto p-8 bg-gray-200">
          <div
            className={`mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
              devicePreview === 'desktop'
                ? 'w-full max-w-none'
                : devicePreview === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px]'
            }`}
            style={{ minHeight: '100vh' }}
          >
            {previewHtml ? (
              <iframe
                key={activeEditorPage}
                srcDoc={(() => {
                  const raw = pageData?.multiPage && allPagesHtml
                    ? (allPagesHtml[pageData.pages?.[activeEditorPage]?.filename] || previewHtml)
                    : previewHtml;
                  // Intercept .html page links: prevent navigation, post message to parent to switch page
                  const guard = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a){var h=a.getAttribute('href');if(h&&!h.startsWith('#')&&!h.startsWith('http')&&!h.startsWith('mailto')&&!h.startsWith('tel')){e.preventDefault();window.parent.postMessage({type:'preview-navigate',page:h},'*');}}},true);<\/script>`;
                  return raw.replace('</body>', guard + '</body>');
                })()}
                className="w-full h-full min-h-screen border-0"
                title="Website Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <p>Save changes to see preview</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSection}
      />

      {/* Add Page Modal */}
      <AddPageModal
        isOpen={showAddPageModal}
        onClose={() => setShowAddPageModal(false)}
        onAdd={handleAddPage}
        existingPages={pageData?.pages || []}
      />

      {/* Delete Page Modal */}
      <DeletePageModal
        page={deletingPage?.page || null}
        onClose={() => setDeletingPage(null)}
        onConfirm={handleDeletePage}
      />

      {/* Link Google Reviews Modal */}
      {showGoogleImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Link Google Reviews</h2>
                <p className="text-xs text-gray-500">Pull real reviews from your Google Business Profile</p>
              </div>
              <button onClick={() => { setShowGoogleImportModal(false); setFetchedGoogleReviews(null); setReviewStarFilter('above'); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search your business name
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="e.g. Joe's Auto Detailing Dallas"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && importGoogleReviews()}
                />
                <button
                  onClick={importGoogleReviews}
                  disabled={importingReviews || !googleUrl.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                >
                  {importingReviews ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Searching</>
                  ) : (
                    <><Star className="w-4 h-4" /> Search</>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Enter your business name and city, or a Google Place ID
              </p>

              {/* Star Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which reviews do you want to pull?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStarFilter('above')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                      reviewStarFilter === 'above'
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-amber-400">★★★★★</span> 4 stars &amp; above
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStarFilter('below')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                      reviewStarFilter === 'below'
                        ? 'border-red-400 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-red-400">★★★☆☆</span> Under 4 stars
                  </button>
                </div>
              </div>

              {/* Review Preview */}
              {fetchedGoogleReviews && (() => {
                const visibleReviews = fetchedGoogleReviews.reviews.filter(r => {
                  const stars = r.stars || r.rating || 5;
                  return reviewStarFilter === 'above' ? stars >= 4 : stars < 4;
                });
                return (
                  <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{fetchedGoogleReviews.businessName}</p>
                        <p className="text-sm text-gray-600">
                          {fetchedGoogleReviews.averageRating} ★ · {fetchedGoogleReviews.totalReviews} total reviews · <strong>{visibleReviews.length}</strong> match filter
                        </p>
                      </div>
                    </div>
                    {visibleReviews.length === 0 ? (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                        No reviews match this filter. Try switching to the other option.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {visibleReviews.map((r, i) => (
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
              <button
                onClick={() => { setShowGoogleImportModal(false); setFetchedGoogleReviews(null); setReviewStarFilter('above'); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              {fetchedGoogleReviews && (
                <button
                  onClick={applyGoogleReviews}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Use These Reviews
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
