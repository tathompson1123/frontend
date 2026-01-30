import { WIDGET_TYPES } from '../../utils/schema';
import TextWidget from './widgets/TextWidget';
import ImageWidget from './widgets/ImageWidget';
import ButtonWidget from './widgets/ButtonWidget';
import ButtonGroupWidget from './widgets/ButtonGroupWidget';
import SpacerWidget from './widgets/SpacerWidget';
import DividerWidget from './widgets/DividerWidget';
import FormWidget from './widgets/FormWidget';
import IconWidget from './widgets/IconWidget';
import VideoWidget from './widgets/VideoWidget';
import TestimonialWidget from './widgets/TestimonialWidget';

// ============================================
// WIDGET RENDERER
// Routes to correct widget component by type
// ============================================
export default function WidgetRenderer({
  widget,
  devicePreview,
  isEditing,
  onUpdate,
}) {
  const props = {
    widget,
    devicePreview,
    isEditing,
    onUpdate,
  };

  switch (widget.type) {
    case WIDGET_TYPES.TEXT:
      return <TextWidget {...props} />;
    
    case WIDGET_TYPES.IMAGE:
      return <ImageWidget {...props} />;
    
    case WIDGET_TYPES.VIDEO:
      return <VideoWidget {...props} />;
    
    case WIDGET_TYPES.BUTTON:
      return <ButtonWidget {...props} />;
    
    case WIDGET_TYPES.BUTTON_GROUP:
      return <ButtonGroupWidget {...props} />;
    
    case WIDGET_TYPES.SPACER:
      return <SpacerWidget {...props} />;
    
    case WIDGET_TYPES.DIVIDER:
      return <DividerWidget {...props} />;
    
    case WIDGET_TYPES.FORM:
      return <FormWidget {...props} />;
    
    case WIDGET_TYPES.ICON:
      return <IconWidget {...props} />;
    
    case WIDGET_TYPES.TESTIMONIAL:
      return <TestimonialWidget {...props} />;
    
    case WIDGET_TYPES.HTML:
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: widget.content?.code || '' }}
          className="html-widget"
        />
      );
    
    case WIDGET_TYPES.SOCIAL:
      return <SocialWidget {...props} />;
    
    case WIDGET_TYPES.PRICING:
      return <PricingWidget {...props} />;
    
    case WIDGET_TYPES.GALLERY:
      return <GalleryWidget {...props} />;
    
    default:
      return (
        <div className="p-4 bg-gray-100 rounded text-center text-gray-500">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}

// ============================================
// PLACEHOLDER WIDGETS (to be fully implemented)
// ============================================

function SocialWidget({ widget }) {
  const links = widget.content?.links || [];
  
  return (
    <div className="flex gap-4 justify-center py-2">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
          onClick={(e) => e.preventDefault()}
        >
          <span className="text-lg">
            {link.platform === 'facebook' && '📘'}
            {link.platform === 'instagram' && '📷'}
            {link.platform === 'twitter' && '🐦'}
            {link.platform === 'linkedin' && '💼'}
            {link.platform === 'youtube' && '📺'}
          </span>
        </a>
      ))}
    </div>
  );
}

function PricingWidget({ widget }) {
  const content = widget.content || {};
  
  return (
    <div className={`p-6 rounded-xl border-2 ${content.highlighted ? 'border-purple-500 shadow-lg' : 'border-gray-200'}`}>
      <h3 className="text-xl font-bold text-center mb-2">{content.title}</h3>
      <div className="text-center mb-4">
        <span className="text-4xl font-bold">{content.price}</span>
        <span className="text-gray-500">{content.period}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {content.features?.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
        {content.buttonText}
      </button>
    </div>
  );
}

function GalleryWidget({ widget }) {
  const content = widget.content || {};
  const images = content.images || [];
  
  if (images.length === 0) {
    return (
      <div className="p-8 bg-gray-100 rounded-lg text-center text-gray-500">
        <p>No images yet</p>
        <p className="text-sm">Click to add images</p>
      </div>
    );
  }
  
  return (
    <div 
      className="grid gap-4"
      style={{ 
        gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)`,
        gap: content.gap || '16px'
      }}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt || ''}
          className="w-full h-48 object-cover rounded-lg"
        />
      ))}
    </div>
  );
}
