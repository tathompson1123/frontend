import { useState } from 'react';
import { Link, Plus, Trash2, Upload } from 'lucide-react';

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial,Helvetica,sans-serif' },
  { label: 'Georgia', value: 'Georgia,serif' },
  { label: 'Times New Roman', value: '"Times New Roman",Times,serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS",sans-serif' },
  { label: 'Verdana', value: 'Verdana,Geneva,sans-serif' },
  { label: 'Courier New', value: '"Courier New",Courier,monospace' },
];

const FONT_SIZES = ['10px','12px','13px','14px','15px','16px','18px','20px','22px','24px','26px','28px','32px','36px'];

function FontControls({ fontFamily, fontSize, onFontFamily, onFontSize, fontLabel = 'Font', sizeLabel = 'Font Size' }) {
  return (
    <>
      <Field label={fontLabel}>
        <select
          value={fontFamily || 'Arial,Helvetica,sans-serif'}
          onChange={e => onFontFamily(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label={sizeLabel}>
        <select
          value={fontSize || ''}
          onChange={e => onFontSize(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Default</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
    </>
  );
}

// ============================================================
// Image upload button — uploads to Cloudinary via /api/upload
// ============================================================
function ImageUpload({ onUploaded, apiUrl, authFetch }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        onUploaded(data.url);
      } else {
        const err = await res.json();
        alert('Upload failed: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
      <Upload className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600">{uploading ? 'Uploading...' : 'Upload image'}</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

// ============================================================
// Shared field primitives — defined at module level so React
// never treats them as new component types on re-render
// ============================================================
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative w-8 h-8 flex-shrink-0 cursor-pointer">
        <input
          type="color"
          value={value || '#000000'}
          onChange={onChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: value || '#000000' }}
        />
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
        placeholder="#000000"
      />
    </div>
  );
}

// ============================================================
// Block Properties Panel
// Renders editing controls based on the selected block type
// ============================================================
export default function BlockProperties({ block, onChange, apiUrl, authFetch }) {
  if (!block) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-400">Click a block to edit its properties</p>
      </div>
    );
  }

  const c = block.content || {};

  const update = (key, value) => {
    onChange({ ...block, content: { ...c, [key]: value } });
  };

  const renderFields = () => {
    switch (block.type) {
      case 'header':
        return (
          <>
            <Field label="Logo">
              <ImageUpload onUploaded={url => update('logoSrc', url)} apiUrl={apiUrl} authFetch={authFetch} />
              {c.logoSrc && (
                <div className="mt-2 relative">
                  <img src={c.logoSrc} alt="Logo preview" style={{ width: c.logoWidth ? `${c.logoWidth}px` : '200px', maxWidth: '100%', height: 'auto' }} className="rounded border border-gray-200 object-contain" />
                  <button onClick={() => update('logoSrc', '')} className="absolute top-1 right-1 p-0.5 bg-white rounded-full shadow border border-gray-200 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </Field>
            {c.logoSrc && (
              <Field label={`Logo Width: ${c.logoWidth || 200}px`}>
                <input
                  type="range"
                  min="40"
                  max="600"
                  step="10"
                  value={c.logoWidth || 200}
                  onChange={e => update('logoWidth', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </Field>
            )}
            <Field label="Business Name (optional)">
              <TextInput value={c.title || ''} onChange={e => update('title', e.target.value)} placeholder="Your Business" />
            </Field>
            <Field label="Background Color">
              <ColorInput value={c.bgColor} onChange={e => update('bgColor', e.target.value)} />
            </Field>
            <Field label="Text Color">
              <ColorInput value={c.textColor} onChange={e => update('textColor', e.target.value)} />
            </Field>
            <FontControls
              fontFamily={c.fontFamily}
              fontSize={c.titleFontSize}
              onFontFamily={v => update('fontFamily', v)}
              onFontSize={v => update('titleFontSize', v)}
              sizeLabel="Title Size"
            />
          </>
        );

      case 'hero_image':
        return (
          <>
            <Field label="Image">
              <ImageUpload
                onUploaded={url => update('src', url)}
                apiUrl={apiUrl}
                authFetch={authFetch}
              />
              <div className="flex gap-1 mt-2">
                <div className="relative flex-1">
                  <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="url"
                    value={c.src || ''}
                    onChange={e => update('src', e.target.value)}
                    placeholder="Or paste image URL..."
                    className="w-full pl-7 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              {c.src && (
                <img src={c.src} alt="Preview" className="mt-2 rounded-lg max-h-24 object-cover w-full" />
              )}
            </Field>
            <Field label="Alt Text">
              <TextInput value={c.alt || ''} onChange={e => update('alt', e.target.value)} placeholder="Describe the image" />
            </Field>
          </>
        );

      case 'urgency_bar':
        return (
          <>
            <Field label="Bar Text">
              <TextInput value={c.text || ''} onChange={e => update('text', e.target.value)} placeholder="⏰ Offer expires..." />
            </Field>
            <Field label="Background Color">
              <ColorInput value={c.bgColor} onChange={e => update('bgColor', e.target.value)} />
            </Field>
            <Field label="Text Color">
              <ColorInput value={c.textColor} onChange={e => update('textColor', e.target.value)} />
            </Field>
            <FontControls
              fontFamily={c.fontFamily}
              fontSize={c.fontSize}
              onFontFamily={v => update('fontFamily', v)}
              onFontSize={v => update('fontSize', v)}
            />
          </>
        );

      case 'body':
        return (
          <>
            <Field label="Heading">
              <input
                type="text"
                value={c.heading || ''}
                onChange={e => update('heading', e.target.value)}
                placeholder="Compelling headline..."
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </Field>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Paragraphs</label>
            {(c.paragraphs || []).map((p, i) => (
              <div key={i} className="flex gap-1 mb-2">
                <textarea
                  value={p}
                  onChange={e => {
                    const paras = [...(c.paragraphs || [])];
                    paras[i] = e.target.value;
                    update('paragraphs', paras);
                  }}
                  rows={3}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => {
                    const paras = (c.paragraphs || []).filter((_, idx) => idx !== i);
                    update('paragraphs', paras);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 self-start mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => update('paragraphs', [...(c.paragraphs || []), ''])}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add paragraph
            </button>
            <div className="border-t border-gray-100 mt-3 pt-3">
              <FontControls
                fontFamily={c.fontFamily}
                fontSize={c.headingFontSize}
                onFontFamily={v => update('fontFamily', v)}
                onFontSize={v => update('headingFontSize', v)}
                sizeLabel="Heading Size"
              />
              <Field label="Body Text Size">
                <select
                  value={c.bodyFontSize || ''}
                  onChange={e => update('bodyFontSize', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Default</option>
                  {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </>
        );

      case 'offer_box':
        return (
          <>
            <Field label="Offer Title">
              <TextInput value={c.title || ''} onChange={e => update('title', e.target.value)} placeholder="Exclusive Offer" />
            </Field>
            <Field label="Description">
              <textarea
                value={c.description || ''}
                onChange={e => update('description', e.target.value)}
                rows={3}
                placeholder="Details of the offer..."
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </Field>
            <Field label="Background Color">
              <ColorInput value={c.bgColor} onChange={e => update('bgColor', e.target.value)} />
            </Field>
            <Field label="Border Color">
              <ColorInput value={c.borderColor} onChange={e => update('borderColor', e.target.value)} />
            </Field>
          </>
        );

      case 'cta_button':
        return (
          <>
            <Field label="Button Text">
              <TextInput value={c.text || ''} onChange={e => update('text', e.target.value)} placeholder="Book Now" />
            </Field>
            <Field label="Link URL">
              <div className="relative">
                <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={c.link || ''}
                  onChange={e => update('link', e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-7 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </Field>
            <Field label="Button Color">
              <ColorInput value={c.bgColor} onChange={e => update('bgColor', e.target.value)} />
            </Field>
            <Field label="Text Color">
              <ColorInput value={c.textColor} onChange={e => update('textColor', e.target.value)} />
            </Field>
            <Field label="Border Radius">
              <TextInput value={c.borderRadius || ''} onChange={e => update('borderRadius', e.target.value)} placeholder="8px" />
            </Field>
          </>
        );

      case 'divider':
        return (
          <>
            <Field label="Color">
              <ColorInput value={c.color} onChange={e => update('color', e.target.value)} />
            </Field>
            <Field label="Thickness">
              <TextInput value={c.thickness || ''} onChange={e => update('thickness', e.target.value)} placeholder="1px" />
            </Field>
          </>
        );

      case 'spacer':
        return (
          <Field label="Height (e.g. 24px)">
            <TextInput value={c.height || ''} onChange={e => update('height', e.target.value)} placeholder="24px" />
          </Field>
        );

      case 'signoff':
        return (
          <Field label="Sign-off Text">
            <textarea
              value={c.text || ''}
              onChange={e => update('text', e.target.value)}
              rows={3}
              placeholder="The team at Your Business"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </Field>
        );

      case 'footer':
        return (
          <>
            <Field label="Footer Text">
              <textarea
                value={c.text || ''}
                onChange={e => update('text', e.target.value)}
                rows={3}
                placeholder="You're receiving this because..."
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </Field>
            <Field label="Unsubscribe Text">
              <TextInput value={c.unsubscribeText || ''} onChange={e => update('unsubscribeText', e.target.value)} placeholder="Unsubscribe" />
            </Field>
          </>
        );

      default:
        return <p className="text-sm text-gray-400">No editable properties.</p>;
    }
  };

  const blockLabels = {
    header: 'Header', hero_image: 'Hero Image', urgency_bar: 'Urgency Bar',
    body: 'Body Text', offer_box: 'Offer Box', cta_button: 'CTA Button',
    divider: 'Divider', spacer: 'Spacer', signoff: 'Sign-off', footer: 'Footer',
  };

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {blockLabels[block.type] || block.type} Properties
      </h3>
      {renderFields()}
    </div>
  );
}
