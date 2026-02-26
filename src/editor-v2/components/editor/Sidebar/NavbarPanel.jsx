import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { generateId } from '../../../utils/schema';

// ============================================
// NAVBAR PANEL
// Edit the navigation bar: logo, links, colors
// ============================================
export default function NavbarPanel({ navbar, onUpdate }) {
  const nav = navbar || defaultNavbar();

  const set = (updates) => onUpdate({ ...nav, ...updates });
  const setLinks = (links) => set({ links });

  const addLink = () => {
    setLinks([
      ...nav.links,
      { id: generateId(), label: 'New Link', href: '#', highlighted: false },
    ]);
  };

  const deleteLink = (id) => setLinks(nav.links.filter((l) => l.id !== id));

  const updateLink = (id, updates) =>
    setLinks(nav.links.map((l) => (l.id === id ? { ...l, ...updates } : l)));

  const moveLink = (id, dir) => {
    const idx = nav.links.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const arr = [...nav.links];
    const to = dir === 'up' ? idx - 1 : idx + 1;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setLinks(arr);
  };

  return (
    <div className="p-4 space-y-5">
      {/* Logo */}
      <Field label="Logo Text">
        <input
          type="text"
          value={nav.logo || ''}
          onChange={(e) => set({ logo: e.target.value })}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          placeholder="Brand Name"
        />
      </Field>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Background">
          <ColorPicker value={nav.backgroundColor || '#ffffff'} onChange={(v) => set({ backgroundColor: v })} />
        </Field>
        <Field label="Text Color">
          <ColorPicker value={nav.textColor || '#111827'} onChange={(v) => set({ textColor: v })} />
        </Field>
      </div>

      {/* CTA button color */}
      <Field label="CTA Button Color">
        <ColorPicker value={nav.ctaColor || '#d97706'} onChange={(v) => set({ ctaColor: v })} />
      </Field>

      {/* Sticky toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Sticky on scroll</span>
        <Toggle value={nav.sticky !== false} onChange={(v) => set({ sticky: v })} />
      </div>

      {/* Nav links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nav Links</span>
          <button
            onClick={addLink}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold"
          >
            <Plus className="w-3 h-3" />
            Add Link
          </button>
        </div>

        <div className="space-y-2">
          {(nav.links || []).map((link, idx) => (
            <LinkRow
              key={link.id}
              link={link}
              isFirst={idx === 0}
              isLast={idx === (nav.links.length - 1)}
              onUpdate={(u) => updateLink(link.id, u)}
              onDelete={() => deleteLink(link.id)}
              onMoveUp={() => moveLink(link.id, 'up')}
              onMoveDown={() => moveLink(link.id, 'down')}
            />
          ))}
          {(nav.links || []).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No links yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// LINK ROW
// ============================================
function LinkRow({ link, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-2.5">
      <div className="flex items-start gap-2">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-25"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-25"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="text"
            value={link.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Label"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={link.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
            placeholder="#section or https://..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* CTA toggle + delete */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <button
            onClick={() => onUpdate({ highlighted: !link.highlighted })}
            title={link.highlighted ? 'CTA button (click to toggle)' : 'Make CTA button'}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              link.highlighted
                ? 'bg-amber-500 border-amber-500'
                : 'bg-white border-gray-300 hover:border-amber-400'
            }`}
          />
          <button onClick={onDelete} className="text-red-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {link.highlighted && (
        <div className="mt-1.5 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-0.5">
          ★ Highlighted as CTA button
        </div>
      )}
    </div>
  );
}

// ============================================
// REUSABLE FIELD WRAPPER
// ============================================
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ============================================
// COLOR PICKER
// ============================================
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
      />
      <span className="text-xs text-gray-500 font-mono">{value}</span>
    </div>
  );
}

// ============================================
// TOGGLE
// ============================================
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        value ? 'bg-amber-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ============================================
// DEFAULT NAVBAR
// ============================================
export function defaultNavbar() {
  return {
    logo: 'My Brand',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    ctaColor: '#d97706',
    sticky: true,
    links: [
      { id: 'nav-home', label: 'Home', href: '#', highlighted: false },
      { id: 'nav-about', label: 'About', href: '#about', highlighted: false },
      { id: 'nav-services', label: 'Services', href: '#services', highlighted: false },
      { id: 'nav-contact', label: 'Contact', href: '#contact', highlighted: true },
    ],
  };
}
