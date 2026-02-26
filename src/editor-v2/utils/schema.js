// ============================================
// PAGE SCHEMA TYPES & DEFAULTS
// ============================================

// Generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// WIDGET TYPES
// ============================================
export const WIDGET_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  BUTTON: 'button',
  BUTTON_GROUP: 'button-group',
  SPACER: 'spacer',
  DIVIDER: 'divider',
  HTML: 'html',
  FORM: 'form',
  ICON: 'icon',
  SOCIAL: 'social',
  TESTIMONIAL: 'testimonial',
  PRICING: 'pricing',
  GALLERY: 'gallery',
};

// ============================================
// DEFAULT WIDGET CONTENT BY TYPE
// ============================================
export const getDefaultWidgetContent = (type) => {
  switch (type) {
    case WIDGET_TYPES.TEXT:
      return {
        text: 'Click to edit text',
        tag: 'p',
        alignment: 'left',
      };
    case WIDGET_TYPES.IMAGE:
      return {
        src: '',
        alt: 'Image description',
        link: '',
        width: '100%',
      };
    case WIDGET_TYPES.VIDEO:
      return {
        src: '',
        type: 'youtube', // youtube, vimeo, direct
        autoplay: false,
        controls: true,
      };
    case WIDGET_TYPES.BUTTON:
      return {
        text: 'Click Here',
        link: '#',
        style: 'primary', // primary, secondary, outline
        size: 'medium', // small, medium, large
        fullWidth: false,
      };
    case WIDGET_TYPES.BUTTON_GROUP:
      return {
        buttons: [
          { id: generateId(), text: 'Primary Action', link: '#', style: 'primary' },
          { id: generateId(), text: 'Secondary Action', link: '#', style: 'secondary' },
        ],
        alignment: 'center',
        gap: '16px',
      };
    case WIDGET_TYPES.SPACER:
      return {
        height: '40px',
        mobileHeight: '20px',
      };
    case WIDGET_TYPES.DIVIDER:
      return {
        style: 'solid', // solid, dashed, dotted
        color: '#e5e7eb',
        width: '100%',
        thickness: '1px',
      };
    case WIDGET_TYPES.HTML:
      return {
        code: '<!-- Custom HTML -->',
      };
    case WIDGET_TYPES.FORM:
      return {
        type: 'contact', // contact, booking, newsletter
        fields: [
          { id: generateId(), type: 'text', label: 'Name', required: true },
          { id: generateId(), type: 'email', label: 'Email', required: true },
          { id: generateId(), type: 'textarea', label: 'Message', required: false },
        ],
        submitText: 'Send Message',
        successMessage: 'Thank you! We\'ll be in touch soon.',
      };
    case WIDGET_TYPES.ICON:
      return {
        icon: 'star',
        size: '48px',
        color: '#8b5cf6',
      };
    case WIDGET_TYPES.SOCIAL:
      return {
        links: [
          { platform: 'facebook', url: '#' },
          { platform: 'instagram', url: '#' },
          { platform: 'twitter', url: '#' },
        ],
        style: 'icons', // icons, buttons
        size: '24px',
      };
    case WIDGET_TYPES.TESTIMONIAL:
      return {
        quote: 'This is an amazing service! Highly recommended.',
        author: 'John Doe',
        role: 'Happy Customer',
        avatar: '',
        rating: 5,
      };
    case WIDGET_TYPES.PRICING:
      return {
        title: 'Basic Plan',
        price: '$29',
        period: '/month',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        buttonText: 'Get Started',
        buttonLink: '#',
        highlighted: false,
      };
    case WIDGET_TYPES.GALLERY:
      return {
        images: [],
        columns: 3,
        gap: '16px',
        lightbox: true,
      };
    default:
      return {};
  }
};

// ============================================
// DEFAULT WIDGET STYLES BY TYPE
// ============================================
export const getDefaultWidgetStyle = (type) => {
  switch (type) {
    case WIDGET_TYPES.TEXT:
      return {
        fontSize: '16px',
        fontWeight: 'normal',
        color: '#1f2937',
        lineHeight: '1.6',
        marginBottom: '16px',
      };
    case WIDGET_TYPES.BUTTON:
      return {
        backgroundColor: '#8b5cf6',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
      };
    default:
      return {};
  }
};

// ============================================
// CREATE NEW WIDGET
// ============================================
export const createWidget = (type) => ({
  id: generateId(),
  type,
  content: getDefaultWidgetContent(type),
  style: getDefaultWidgetStyle(type),
  responsive: {
    desktop: {},
    tablet: {},
    mobile: {},
  },
});

// ============================================
// CREATE NEW COLUMN
// ============================================
export const createColumn = (width = '100%') => ({
  id: generateId(),
  width,
  widgets: [],
  style: {
    padding: '0',
    verticalAlign: 'top',
  },
});

// ============================================
// CREATE NEW ROW
// ============================================
export const createRow = (columnCount = 1) => {
  const columnWidths = {
    1: ['100%'],
    2: ['50%', '50%'],
    3: ['33.33%', '33.33%', '33.33%'],
    4: ['25%', '25%', '25%', '25%'],
  };

  const widths = columnWidths[columnCount] || ['100%'];

  return {
    id: generateId(),
    columns: widths.map((width) => createColumn(width)),
    style: {
      padding: '20px 0',
      gap: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
  };
};

// ============================================
// CREATE NEW SECTION
// ============================================
export const createSection = (type = 'content') => ({
  id: generateId(),
  type,
  name: type.charAt(0).toUpperCase() + type.slice(1),
  background: {
    type: 'color',
    value: '#ffffff',
    overlay: '',
  },
  rows: [createRow(1)],
  style: {
    paddingTop: '60px',
    paddingBottom: '60px',
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  responsive: {
    desktop: {},
    tablet: {},
    mobile: {
      paddingTop: '40px',
      paddingBottom: '40px',
    },
  },
});

// ============================================
// CREATE NAVBAR
// ============================================
export const createNavbar = () => ({
  logo: 'My Brand',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  ctaColor: '#d97706',
  sticky: true,
  links: [
    { id: generateId(), label: 'Home', href: '#', highlighted: false },
    { id: generateId(), label: 'About', href: '#about', highlighted: false },
    { id: generateId(), label: 'Services', href: '#services', highlighted: false },
    { id: generateId(), label: 'Contact', href: '#contact', highlighted: true },
  ],
});

// ============================================
// CREATE NEW PAGE
// ============================================
export const createPage = (name = 'New Page', slug = 'new-page') => ({
  id: generateId(),
  name,
  slug,
  title: name,
  description: '',
  navbar: createNavbar(),
  sections: [],
  settings: {
    favicon: '',
    ogImage: '',
  },
});

// ============================================
// SECTION TEMPLATES
// ============================================
export const SECTION_TEMPLATES = {
  hero: {
    name: 'Hero',
    icon: '🦸',
    create: () => {
      const section = createSection('hero');
      section.background = {
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overlay: '',
      };
      section.style.paddingTop = '100px';
      section.style.paddingBottom = '100px';
      
      const row = section.rows[0];
      row.columns[0].widgets = [
        {
          ...createWidget(WIDGET_TYPES.TEXT),
          content: { text: 'Your Amazing Headline Here', tag: 'h1', alignment: 'center' },
          style: { fontSize: '48px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px' },
        },
        {
          ...createWidget(WIDGET_TYPES.TEXT),
          content: { text: 'A compelling subheadline that explains your value proposition and encourages visitors to take action.', tag: 'p', alignment: 'center' },
          style: { fontSize: '20px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' },
        },
        {
          ...createWidget(WIDGET_TYPES.BUTTON_GROUP),
          content: {
            buttons: [
              { id: generateId(), text: 'Get Started', link: '#', style: 'primary' },
              { id: generateId(), text: 'Learn More', link: '#', style: 'outline' },
            ],
            alignment: 'center',
            gap: '16px',
          },
        },
      ];
      
      return section;
    },
  },
  
  features: {
    name: 'Features',
    icon: '✨',
    create: () => {
      const section = createSection('features');
      section.rows = [
        {
          ...createRow(1),
          columns: [{
            ...createColumn('100%'),
            widgets: [
              {
                ...createWidget(WIDGET_TYPES.TEXT),
                content: { text: 'Our Features', tag: 'h2', alignment: 'center' },
                style: { fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' },
              },
              {
                ...createWidget(WIDGET_TYPES.TEXT),
                content: { text: 'Everything you need to succeed', tag: 'p', alignment: 'center' },
                style: { fontSize: '18px', color: '#6b7280', marginBottom: '48px' },
              },
            ],
          }],
        },
        {
          ...createRow(3),
          columns: [1, 2, 3].map(() => ({
            ...createColumn('33.33%'),
            widgets: [
              {
                ...createWidget(WIDGET_TYPES.ICON),
                content: { icon: 'star', size: '48px', color: '#8b5cf6' },
              },
              {
                ...createWidget(WIDGET_TYPES.TEXT),
                content: { text: 'Feature Title', tag: 'h3', alignment: 'center' },
                style: { fontSize: '20px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' },
              },
              {
                ...createWidget(WIDGET_TYPES.TEXT),
                content: { text: 'Brief description of this amazing feature and how it helps your customers.', tag: 'p', alignment: 'center' },
                style: { fontSize: '16px', color: '#6b7280' },
              },
            ],
          })),
        },
      ];
      
      return section;
    },
  },
  
  testimonials: {
    name: 'Testimonials',
    icon: '💬',
    create: () => {
      const section = createSection('testimonials');
      section.background.value = '#f9fafb';
      
      section.rows = [
        {
          ...createRow(1),
          columns: [{
            ...createColumn('100%'),
            widgets: [
              {
                ...createWidget(WIDGET_TYPES.TEXT),
                content: { text: 'What Our Customers Say', tag: 'h2', alignment: 'center' },
                style: { fontSize: '36px', fontWeight: 'bold', marginBottom: '48px' },
              },
            ],
          }],
        },
        {
          ...createRow(3),
          columns: [1, 2, 3].map(() => ({
            ...createColumn('33.33%'),
            widgets: [
              {
                ...createWidget(WIDGET_TYPES.TESTIMONIAL),
              },
            ],
          })),
        },
      ];
      
      return section;
    },
  },
  
  cta: {
    name: 'Call to Action',
    icon: '📣',
    create: () => {
      const section = createSection('cta');
      section.background = {
        type: 'gradient',
        value: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        overlay: '',
      };
      
      const row = section.rows[0];
      row.columns[0].widgets = [
        {
          ...createWidget(WIDGET_TYPES.TEXT),
          content: { text: 'Ready to Get Started?', tag: 'h2', alignment: 'center' },
          style: { fontSize: '36px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' },
        },
        {
          ...createWidget(WIDGET_TYPES.TEXT),
          content: { text: 'Join thousands of satisfied customers today.', tag: 'p', alignment: 'center' },
          style: { fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' },
        },
        {
          ...createWidget(WIDGET_TYPES.BUTTON),
          content: { text: 'Start Free Trial', link: '#', style: 'secondary', size: 'large' },
          style: { backgroundColor: '#ffffff', color: '#8b5cf6' },
        },
      ];
      
      return section;
    },
  },
  
  contact: {
    name: 'Contact',
    icon: '📧',
    create: () => {
      const section = createSection('contact');
      
      section.rows = [
        {
          ...createRow(2),
          columns: [
            {
              ...createColumn('50%'),
              widgets: [
                {
                  ...createWidget(WIDGET_TYPES.TEXT),
                  content: { text: 'Get in Touch', tag: 'h2', alignment: 'left' },
                  style: { fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' },
                },
                {
                  ...createWidget(WIDGET_TYPES.TEXT),
                  content: { text: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.', tag: 'p', alignment: 'left' },
                  style: { fontSize: '16px', color: '#6b7280', marginBottom: '24px' },
                },
                {
                  ...createWidget(WIDGET_TYPES.SOCIAL),
                },
              ],
            },
            {
              ...createColumn('50%'),
              widgets: [
                {
                  ...createWidget(WIDGET_TYPES.FORM),
                },
              ],
            },
          ],
        },
      ];
      
      return section;
    },
  },
  
  gallery: {
    name: 'Gallery',
    icon: '🖼️',
    create: () => {
      const section = createSection('gallery');
      
      const row = section.rows[0];
      row.columns[0].widgets = [
        {
          ...createWidget(WIDGET_TYPES.TEXT),
          content: { text: 'Our Work', tag: 'h2', alignment: 'center' },
          style: { fontSize: '36px', fontWeight: 'bold', marginBottom: '48px' },
        },
        {
          ...createWidget(WIDGET_TYPES.GALLERY),
          content: { images: [], columns: 3, gap: '16px', lightbox: true },
        },
      ];
      
      return section;
    },
  },
  
  blank: {
    name: 'Blank Section',
    icon: '➕',
    create: () => createSection('content'),
  },
};

// ============================================
// WIDGET CATALOG (for sidebar)
// ============================================
export const WIDGET_CATALOG = [
  { type: WIDGET_TYPES.TEXT, name: 'Text', icon: '📝', description: 'Headings & paragraphs' },
  { type: WIDGET_TYPES.IMAGE, name: 'Image', icon: '🖼️', description: 'Photos & graphics' },
  { type: WIDGET_TYPES.VIDEO, name: 'Video', icon: '🎬', description: 'YouTube, Vimeo, or upload' },
  { type: WIDGET_TYPES.BUTTON, name: 'Button', icon: '🔘', description: 'Call-to-action buttons' },
  { type: WIDGET_TYPES.BUTTON_GROUP, name: 'Button Group', icon: '🔲', description: 'Multiple buttons' },
  { type: WIDGET_TYPES.SPACER, name: 'Spacer', icon: '↕️', description: 'Vertical spacing' },
  { type: WIDGET_TYPES.DIVIDER, name: 'Divider', icon: '➖', description: 'Horizontal line' },
  { type: WIDGET_TYPES.FORM, name: 'Form', icon: '📋', description: 'Contact & signup forms' },
  { type: WIDGET_TYPES.HTML, name: 'HTML', icon: '🖥️', description: 'Custom code embed' },
  { type: WIDGET_TYPES.ICON, name: 'Icon', icon: '⭐', description: 'Icons & symbols' },
  { type: WIDGET_TYPES.SOCIAL, name: 'Social Links', icon: '🔗', description: 'Social media icons' },
  { type: WIDGET_TYPES.TESTIMONIAL, name: 'Testimonial', icon: '💬', description: 'Customer reviews' },
  { type: WIDGET_TYPES.PRICING, name: 'Pricing', icon: '💰', description: 'Pricing tables' },
  { type: WIDGET_TYPES.GALLERY, name: 'Gallery', icon: '🎨', description: 'Image galleries' },
];
