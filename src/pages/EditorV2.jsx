import { useState, useEffect, useCallback } from 'react';
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
  Edit3
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
      ctaLink: { type: 'text', label: 'CTA Button Link' },
      links: {
        type: 'array',
        label: 'Navigation Links',
        itemFields: {
          text: { type: 'text', label: 'Link Text' },
          url: { type: 'text', label: 'Link URL' }
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
      ctaLink: { type: 'text', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'text', label: 'Secondary Button Link' },
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
      ctaLink: { type: 'text', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'text', label: 'Secondary Button Link' }
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
      ctaLink: { type: 'text', label: 'CTA Button Link' },
      services: {
        type: 'array',
        label: 'Services',
        itemFields: {
          name: { type: 'text', label: 'Service Name' },
          description: { type: 'textarea', label: 'Description' },
          price: { type: 'text', label: 'Price' },
          image: { type: 'image', label: 'Image URL' },
          link: { type: 'text', label: 'Link' }
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
      ctaLink: { type: 'text', label: 'Primary Button Link' },
      ctaText2: { type: 'text', label: 'Secondary Button Text' },
      ctaLink2: { type: 'text', label: 'Secondary Button Link' },
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
      buttonLink: { type: 'text', label: 'Button Link' },
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
  }
};

// Available templates for adding new sections
const AVAILABLE_TEMPLATES = [
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
  { id: 'footer-4col-dark', category: 'Footer' }
];

// ============================================
// FIELD EDITOR COMPONENT
// ============================================
function FieldEditor({ field, value, onChange, fieldKey }) {
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

  if (field.type === 'image') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {value && (
          <img src={value} alt="Preview" className="mt-2 max-h-32 rounded-lg object-cover" />
        )}
      </div>
    );
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
function ArrayFieldEditor({ field, value = [], onChange, fieldKey }) {
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
            {Object.entries(field.itemFields).map(([itemKey, itemField]) => (
              <FieldEditor
                key={itemKey}
                field={itemField}
                value={item[itemKey]}
                onChange={(_, val) => updateItem(index, itemKey, val)}
                fieldKey={itemKey}
              />
            ))}
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
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalSections - 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
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
  const [activeEditorPage, setActiveEditorPage] = useState(0);
  const [allPagesHtml, setAllPagesHtml] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ============================================
  // LOAD PAGE DATA
  // ============================================
  useEffect(() => {
    loadPageData();
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
  // ADD SECTION
  // ============================================
  const addSection = useCallback((templateId) => {
    if (!templateId) return;

    const newSection = {
      id: `s${Date.now()}`,
      template: templateId,
      content: {}
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

    // Determine which field key this section uses
    const secs = pageData?.multiPage
      ? pageData.pages?.[activeEditorPage]?.sections
      : pageData?.sections;
    const section = secs?.[selectedSectionIndex];
    const templateDef = TEMPLATE_DEFINITIONS[section?.template];
    const hasTestimonials = templateDef?.fields?.testimonials;

    if (hasTestimonials) {
      // Map to testimonials format (quote/author/role/rating)
      const testimonials = fetchedGoogleReviews.reviews.map(r => ({
        quote: r.text,
        author: r.name,
        role: 'Verified Customer',
        rating: r.stars || r.rating || 5
      }));
      updateSectionContent(selectedSectionIndex, 'testimonials', testimonials);
    } else {
      updateSectionContent(selectedSectionIndex, 'reviews', fetchedGoogleReviews.reviews);
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
        const data = await response.json();
        if (data.html) {
          setPreviewHtml(data.html);
        }
        if (data.pages) {
          setAllPagesHtml(data.pages);
        }
        console.log('✅ Saved successfully');
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

  const selectedSection = selectedSectionIndex !== null ? currentSections[selectedSectionIndex] : null;
  const selectedTemplateDef = selectedSection ? TEMPLATE_DEFINITIONS[selectedSection.template] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard?tab=website')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Device Preview */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
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
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Page</p>
                  <div className="flex flex-wrap gap-1">
                    {pageData.pages.map((page, i) => (
                      <button
                        key={i}
                        onClick={() => { setActiveEditorPage(i); setSelectedSectionIndex(null); setIsEditingSection(false); }}
                        className={`px-2 py-1 text-xs rounded font-medium capitalize ${
                          activeEditorPage === i ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {(page.filename || `page-${i + 1}`).replace('.html', '')}
                      </button>
                    ))}
                  </div>
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
                {Object.entries(selectedTemplateDef.fields || {}).map(([fieldKey, field]) => {
                  if (field.type === 'array') {
                    return (
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
                        />
                      </div>
                    );
                  }
                  return (
                    <FieldEditor
                      key={fieldKey}
                      field={field}
                      value={selectedSection.content?.[fieldKey]}
                      onChange={(_, value) => updateSectionContent(selectedSectionIndex, fieldKey, value)}
                      fieldKey={fieldKey}
                    />
                  );
                })}
              </div>
            </>
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
                srcDoc={
                  pageData?.multiPage && allPagesHtml
                    ? (allPagesHtml[pageData.pages?.[activeEditorPage]?.filename] || previewHtml)
                    : previewHtml
                }
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

      {/* Link Google Reviews Modal */}
      {showGoogleImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Link Google Reviews</h2>
                <p className="text-xs text-gray-500">Pull real reviews from your Google Business Profile</p>
              </div>
              <button onClick={() => { setShowGoogleImportModal(false); setFetchedGoogleReviews(null); }} className="p-1 hover:bg-gray-100 rounded">
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

              {/* Review Preview */}
              {fetchedGoogleReviews && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{fetchedGoogleReviews.businessName}</p>
                      <p className="text-sm text-gray-600">
                        {fetchedGoogleReviews.averageRating} ★ · {fetchedGoogleReviews.totalReviews} total reviews · {fetchedGoogleReviews.reviews.length} loaded
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {fetchedGoogleReviews.reviews.map((r, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{r.name}</span>
                          <span className="text-amber-500">{'★'.repeat(r.stars)}</span>
                          <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => { setShowGoogleImportModal(false); setFetchedGoogleReviews(null); }}
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
