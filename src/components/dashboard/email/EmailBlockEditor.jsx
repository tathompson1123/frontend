import { useState, useRef, useEffect } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Copy, Monitor, Smartphone, ChevronRight, Plus, Link, Upload, X,
} from 'lucide-react';
import { BLOCK_TYPES, createBlock, emailBlocksToHtml } from '../../../utils/emailBlocks';
import BlockProperties from './BlockProperties';

// ============================================================
// BLOCK CANVAS RENDERERS
// Each block type renders a visual representation in the editor
// ============================================================

function InlineText({ value, onChange, className = '', tag: Tag = 'p', placeholder = 'Click to edit', style }) {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);

  // Sync DOM text when value prop changes and element is not being edited
  useEffect(() => {
    if (!editing && ref.current && ref.current.innerText !== (value || placeholder)) {
      ref.current.innerText = value || placeholder;
    }
  }, [value, editing, placeholder]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }, [editing]);

  return (
    <Tag
      ref={ref}
      style={style}
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={() => setEditing(true)}
      onBlur={() => {
        setEditing(false);
        const newVal = ref.current?.innerText || '';
        if (newVal !== value) onChange(newVal);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
        if (e.key === 'Escape') { ref.current.innerText = value; setEditing(false); }
      }}
      className={`outline-none ${editing ? 'ring-2 ring-amber-400 rounded px-1' : ''} ${className}`}
    >
      {value || placeholder}
    </Tag>
  );
}

function ImagePickerModal({ onClose, onSelect }) {
  const [url, setUrl] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Change Image</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 mb-4">
          <Upload className="w-7 h-7 text-gray-400 mb-1" />
          <span className="text-sm text-gray-500">Upload image</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { onSelect(reader.result); onClose(); };
            reader.readAsDataURL(file);
          }} />
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="Paste image URL..."
              className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={e => { if (e.key === 'Enter' && url) { onSelect(url); onClose(); } }}
            />
          </div>
          <button onClick={() => { if (url) { onSelect(url); onClose(); } }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockCanvas({ block, selected, onSelect, onUpdate, onDelete, onDuplicate }) {
  const c = block.content || {};
  const [showImagePicker, setShowImagePicker] = useState(false);

  const updateContent = patch => onUpdate({ ...block, content: { ...c, ...patch } });

  const wrapperClass = `relative group cursor-pointer transition-all ${
    selected
      ? 'ring-2 ring-blue-500 ring-offset-0'
      : 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-0'
  }`;

  const BlockActions = () => (
    <div className={`absolute top-1 right-1 flex gap-1 z-10 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      <button onClick={e => { e.stopPropagation(); onDuplicate(block); }}
        className="p-1 bg-white rounded shadow text-gray-500 hover:text-blue-600 border border-gray-200">
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button onClick={e => { e.stopPropagation(); onDelete(block.id); }}
        className="p-1 bg-white rounded shadow text-gray-500 hover:text-red-500 border border-gray-200">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const content = (() => {
    switch (block.type) {
      case 'header':
        return (
          <div style={{ background: c.bgColor || '#111827', padding: '20px 24px', textAlign: 'center', fontFamily: c.fontFamily || undefined }}>
            {c.logoSrc && (
              <img src={c.logoSrc} alt="Logo" style={{ width: c.logoWidth ? `${c.logoWidth}px` : '200px', maxWidth: '100%', height: 'auto', display: 'block', margin: c.title ? '0 auto 12px' : '0 auto' }} />
            )}
            {c.title && (
              <InlineText
                value={c.title}
                onChange={v => updateContent({ title: v })}
                tag="h1"
                className="!font-bold !tracking-tight !m-0"
                style={{ color: c.textColor || '#ffffff', fontSize: c.titleFontSize || '20px', fontFamily: c.fontFamily || undefined }}
              />
            )}
          </div>
        );

      case 'hero_image':
        return (
          <div onClick={() => selected && setShowImagePicker(true)}>
            {c.src
              ? <img src={c.src} alt={c.alt || ''} style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }} />
              : <div className="h-36 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">Click to add hero image</span>
                </div>
            }
            {selected && c.src && (
              <button onClick={() => setShowImagePicker(true)}
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="bg-white px-3 py-1.5 rounded-lg text-sm font-medium shadow">Change Image</span>
              </button>
            )}
            {showImagePicker && (
              <ImagePickerModal onClose={() => setShowImagePicker(false)} onSelect={v => updateContent({ src: v })} />
            )}
          </div>
        );

      case 'urgency_bar':
        return (
          <div style={{ background: c.bgColor || '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '12px 24px', textAlign: 'center' }}>
            <InlineText
              value={c.text || ''}
              onChange={v => updateContent({ text: v })}
              className="!text-sm !font-bold !m-0"
              style={{ color: c.textColor || '#92400e' }}
            />
          </div>
        );

      case 'body':
        return (
          <div style={{ padding: '28px 24px 12px' }}>
            <InlineText
              value={c.heading || ''}
              onChange={v => updateContent({ heading: v })}
              tag="h2"
              className="!text-xl !font-bold !text-gray-900 !m-0 !mb-4"
            />
            {(c.paragraphs || []).map((p, i) => (
              <InlineText key={i}
                value={p}
                onChange={v => {
                  const paras = [...(c.paragraphs || [])];
                  paras[i] = v;
                  updateContent({ paragraphs: paras });
                }}
                className="!text-sm !text-gray-600 !leading-relaxed !mb-3"
              />
            ))}
          </div>
        );

      case 'offer_box':
        return (
          <div style={{ margin: '0 24px 20px', background: c.bgColor || '#f0fdf4', borderLeft: `4px solid ${c.borderColor || '#22c55e'}`, padding: '16px 20px', borderRadius: '8px' }}>
            <InlineText
              value={c.title || 'Exclusive Offer'}
              onChange={v => updateContent({ title: v })}
              tag="p"
              className="!text-sm !font-bold !text-gray-900 !m-0 !mb-1.5"
            />
            <InlineText
              value={c.description || ''}
              onChange={v => updateContent({ description: v })}
              className="!text-sm !text-gray-600 !leading-relaxed !m-0"
            />
          </div>
        );

      case 'cta_button':
        return (
          <div style={{ padding: '8px 24px 28px', textAlign: 'center' }}>
            <InlineText
              value={c.text || 'Book Now'}
              onChange={v => updateContent({ text: v })}
              tag="span"
              className="!text-base !font-bold cursor-pointer"
              style={{
                display: 'inline-block',
                background: c.bgColor || '#111827',
                color: c.textColor || '#ffffff',
                padding: '12px 32px',
                borderRadius: c.borderRadius || '8px',
              }}
            />
          </div>
        );

      case 'divider':
        return (
          <div style={{ padding: '4px 24px' }}>
            <hr style={{ border: 'none', borderTop: `${c.thickness || '1px'} solid ${c.color || '#e5e7eb'}`, margin: '4px 0' }} />
          </div>
        );

      case 'spacer':
        return (
          <div style={{ height: c.height || '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selected && <span className="text-xs text-gray-300 font-mono">{c.height || '24px'}</span>}
          </div>
        );

      case 'signoff':
        return (
          <div style={{ padding: '0 24px 20px' }}>
            <InlineText value={c.text || ''} onChange={v => updateContent({ text: v })} className="!text-sm !text-gray-500 !m-0" />
          </div>
        );

      case 'footer':
        return (
          <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '16px 24px', textAlign: 'center' }}>
            <InlineText value={c.text || ''} onChange={v => updateContent({ text: v })} className="!text-xs !text-gray-500 !m-0 !mb-1.5" />
            <span className="text-xs text-gray-400 underline">
              {c.unsubscribeText || 'Unsubscribe'}
            </span>
          </div>
        );

      default:
        return <div className="p-4 text-sm text-gray-400 text-center">{block.type}</div>;
    }
  })();

  return (
    <div className={wrapperClass} onClick={() => onSelect(block.id)}>
      <BlockActions />
      {content}
    </div>
  );
}

// ============================================================
// SORTABLE BLOCK WRAPPER
// ============================================================
function SortableBlock({ block, selected, onSelect, onUpdate, onDelete, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center z-20 cursor-grab active:cursor-grabbing transition-opacity ${selected ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'}`}
        style={{ left: '-20px' }}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <BlockCanvas
        block={block}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      />
    </div>
  );
}

// ============================================================
// MAIN EMAIL BLOCK EDITOR
// ============================================================
export default function EmailBlockEditor({ blocks, onChange, subject, previewText, onSubjectChange, onPreviewTextChange, fromName, fromEmail, apiUrl, authFetch }) {
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const selectedBlock = blocks.find(b => b.id === selectedId) || null;

  const handleDragStart = ({ active }) => setActiveDragId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    // Check if drag came from palette (type string) or canvas (block id)
    if (typeof active.id === 'string' && active.id.startsWith('palette:')) {
      const type = active.id.replace('palette:', '');
      const overIndex = blocks.findIndex(b => b.id === over.id);
      const newBlock = createBlock(type);
      const newBlocks = [...blocks];
      newBlocks.splice(overIndex >= 0 ? overIndex : newBlocks.length, 0, newBlock);
      onChange(newBlocks);
      setSelectedId(newBlock.id);
    } else {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    }
  };

  const handleUpdate = updatedBlock => {
    onChange(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const handleDelete = id => {
    onChange(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicate = block => {
    const copy = { ...block, id: crypto.randomUUID().slice(0, 8), content: { ...block.content } };
    const idx = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, copy);
    onChange(newBlocks);
    setSelectedId(copy.id);
  };

  const addBlock = type => {
    const newBlock = createBlock(type);
    onChange([...blocks, newBlock]);
    setSelectedId(newBlock.id);
  };

  const canvasWidth = viewMode === 'mobile' ? '375px' : '600px';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
          <button onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Monitor className="w-3 h-3" /> Desktop
          </button>
          <button onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Smartphone className="w-3 h-3" /> Mobile
          </button>
        </div>

        {/* Subject / preview text inline */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            placeholder="Subject line"
            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            value={previewText}
            onChange={e => onPreviewTextChange(e.target.value)}
            placeholder="Preview text"
            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* LEFT: Block Palette */}
          <div className="w-44 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Blocks</p>
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)}
                className="flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:shadow-sm transition-all group border-b border-gray-100 last:border-0">
                <span className="text-base leading-none">{bt.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{bt.label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight truncate">{bt.desc}</p>
                </div>
                <Plus className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          {/* CENTER: Canvas */}
          <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center py-4 min-h-0">
            <div style={{ width: canvasWidth, maxWidth: '100%' }} className="transition-all duration-200">
              {/* Email client chrome */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* From/subject header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(fromName || 'YB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{fromName || 'Your Business'}</p>
                      <p className="text-xs text-gray-600 font-medium truncate mt-0.5">{subject || '(no subject)'}</p>
                      {previewText && <p className="text-xs text-gray-400 truncate">{previewText}</p>}
                    </div>
                  </div>
                </div>

                {/* Blocks canvas */}
                <div className="relative pl-5">
                  <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.length === 0 ? (
                      <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-medium">No blocks yet</p>
                        <p className="text-xs mt-1">Click a block type in the left panel to add it</p>
                      </div>
                    ) : (
                      blocks.map(block => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          selected={selectedId === block.id}
                          onSelect={id => setSelectedId(id === selectedId ? null : id)}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      ))
                    )}
                  </SortableContext>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeDragId ? (
              <div className="bg-white shadow-xl rounded-lg border-2 border-blue-400 px-4 py-2 text-sm font-medium text-blue-700 opacity-90">
                Moving block…
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* RIGHT: Properties Panel */}
        <div className="w-52 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          {selectedBlock ? (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Properties</span>
                <button onClick={() => setSelectedId(null)}>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <BlockProperties
                block={selectedBlock}
                onChange={updatedBlock => handleUpdate(updatedBlock)}
                apiUrl={apiUrl}
                authFetch={authFetch}
              />
            </>
          ) : (
            <div className="p-4 text-center pt-8">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 font-medium">Select a block</p>
              <p className="text-xs text-gray-300 mt-0.5">to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
