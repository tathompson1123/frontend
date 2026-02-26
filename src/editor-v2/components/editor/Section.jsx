import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown,
  Settings,
  MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import Row from './Row';

// ============================================
// SECTION COMPONENT
// ============================================
export default function Section({
  section,
  index,
  isSelected,
  selectedElement,
  devicePreview,
  isDraggingWidget,
  onSelect,
  onSelectWidget,
  onUpdateWidget,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    data: {
      type: 'section',
      section,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Build background style
  const getBackgroundStyle = () => {
    const bg = section.background;
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
      case 'video':
        return {}; // Video is handled separately
      default:
        return {};
    }
  };

  // Build section style
  const getSectionStyle = () => {
    const baseStyle = section.style || {};
    const responsiveStyle = section.responsive?.[devicePreview] || {};
    
    return {
      ...getBackgroundStyle(),
      paddingTop: responsiveStyle.paddingTop || baseStyle.paddingTop || '60px',
      paddingBottom: responsiveStyle.paddingBottom || baseStyle.paddingBottom || '60px',
      paddingLeft: responsiveStyle.paddingLeft || baseStyle.paddingLeft || '20px',
      paddingRight: responsiveStyle.paddingRight || baseStyle.paddingRight || '20px',
      position: 'relative',
    };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Section Toolbar - appears on hover */}
      <div
        className={`absolute -left-12 top-4 flex flex-col gap-1 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-white rounded-lg shadow border border-gray-200 cursor-grab hover:bg-gray-50"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>

        {/* Move Up */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50"
          title="Move up"
        >
          <ChevronUp className="w-4 h-4 text-gray-500" />
        </button>

        {/* Move Down */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50"
          title="Move down"
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute left-full ml-2 top-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-36 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open settings
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <hr className="my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this section?')) {
                    onDelete();
                  }
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section Label */}
      <div
        className={`absolute -top-3 left-4 px-2 py-0.5 text-xs font-medium rounded transition-opacity ${
          isSelected
            ? 'bg-amber-600 text-white opacity-100'
            : 'bg-gray-800 text-white opacity-0 group-hover:opacity-100'
        }`}
      >
        {section.name || section.type || 'Section'}
      </div>

      {/* Selection Border */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all ${
          isSelected
            ? 'ring-2 ring-amber-500 ring-inset'
            : 'ring-0 group-hover:ring-2 group-hover:ring-blue-300 group-hover:ring-inset'
        }`}
      />

      {/* Section Content */}
      <section style={getSectionStyle()}>
        {/* Video Background */}
        {section.background?.type === 'video' && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={section.background.value}
          />
        )}

        {/* Overlay */}
        {section.background?.overlay && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: section.background.overlay }}
          />
        )}

        {/* Rows */}
        <div className="relative z-10">
          {section.rows?.map((row, rowIndex) => (
            <Row
              key={row.id}
              row={row}
              sectionId={section.id}
              rowIndex={rowIndex}
              selectedElement={selectedElement}
              devicePreview={devicePreview}
              isDraggingWidget={isDraggingWidget}
              onSelectWidget={onSelectWidget}
              onUpdateWidget={onUpdateWidget}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
