import { useState, useEffect } from 'react';
import {
  Plus, X, Copy, CopyPlus, Check, Trash2, ChevronLeft, ChevronUp, ChevronDown,
  FileText, Eye, Code, Pencil, MessageSquare, Mail, Send,
} from 'lucide-react';

const embedBaseUrl =
  import.meta.env.VITE_EMBED_URL ||
  import.meta.env.VITE_PRODUCTION_BACKEND_URL ||
  'https://backend-production-ab50.up.railway.app';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

const STANDARD_PRESETS = [
  { key: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { key: 'email', type: 'email', label: 'Email', placeholder: 'you@email.com', required: true },
  { key: 'phone', type: 'tel', label: 'Phone', placeholder: '(555) 123-4567', required: true },
  { key: 'service', type: 'text', label: 'Service Interested In', placeholder: 'What service?', required: false },
  { key: 'message', type: 'textarea', label: 'Message', placeholder: 'How can we help?', required: false },
];

const slugify = (s) =>
  String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'embed_form';

// The email a visitor gets right after submitting: what happens next, step by step.
// Mirrors DEFAULT_FOLLOWUP in the backend (utils/formFollowupEmail.js).
const DEFAULT_FOLLOWUP = {
  enabled: true,
  subject: "Thanks {{first_name}} — here's what happens next",
  heading: 'We got your request, {{first_name}}!',
  intro: 'Thanks for reaching out to {{business_name}}. Here is exactly what to expect:',
  steps_title: 'What happens next',
  steps: [
    { title: 'We review your request', description: 'Someone from our team looks over what you sent — usually within a few hours during business days.' },
    { title: 'We reach out to you', description: "We'll call or text you to confirm the details and answer any questions." },
    { title: 'We get you scheduled', description: 'Once everything looks good, we lock in a time that works for you.' },
  ],
  button_label: '',
  button_url: '',
  closing: 'Need something sooner? Just reply to this email.',
};
const MAX_STEPS = 8;
// Mirrors DEFAULT_FOLLOWUP_SMS in the backend (utils/formFollowupSms.js). Off by default:
// turning it on adds a required consent checkbox to the form.
const DEFAULT_FOLLOWUP_SMS = {
  enabled: false,
  message: "Hi {{first_name}}, thanks for contacting {{business_name}}! Here's what happens next: 1) We review your request 2) We call or text you to confirm details 3) We get you scheduled. Questions? Just reply here.",
};
const SMS_MAX = 600;
const sampleFill = (t) => String(t || '')
  .replace(/\{\{\s*first_name\s*\}\}/g, 'Alex')
  .replace(/\{\{\s*name\s*\}\}/g, 'Alex Sample')
  .replace(/\{\{\s*business_name\s*\}\}/g, 'your business')
  .replace(/\{\{\s*form_name\s*\}\}/g, 'this form');

const newDraft = () => ({
  name: 'New Form',
  source: 'new_form',
  title: 'Get in touch',
  description: '',
  submit_text: 'Submit',
  success_message: "Thanks! We'll be in touch shortly.",
  theme_color: '#d97706',
  field_color: '#d1d5db',
  sms_followup: true,
  followup_email: { ...DEFAULT_FOLLOWUP, steps: DEFAULT_FOLLOWUP.steps.map(x => ({ ...x })) },
  followup_sms: { ...DEFAULT_FOLLOWUP_SMS },
  fields: [
    { ...STANDARD_PRESETS[0] },
    { ...STANDARD_PRESETS[1] },
    { ...STANDARD_PRESETS[2] },
    { ...STANDARD_PRESETS[4] },
  ],
});

export default function EmbedForms({ apiUrl, authFetch }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sourceTouched, setSourceTouched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/api/embed-forms`);
      const data = await res.json();
      setForms(data.forms || []);
    } catch (e) {
      console.error('Failed to load forms', e);
    } finally {
      setLoading(false);
    }
  };

  const snippetFor = (publicId) =>
    `<div data-sorce-form="${publicId}"></div>\n<script src="${embedBaseUrl}/forms.js" async></script>`;

  const copySnippet = (publicId) => {
    navigator.clipboard.writeText(snippetFor(publicId));
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startCreate = () => { setSaveError(''); setDraft(newDraft()); setEditingId(null); setSourceTouched(false); setView('edit'); };
  const startEdit = (f) => {
    setSaveError('');
    setDraft({
      name: f.name, source: f.source, title: f.title, description: f.description || '',
      submit_text: f.submit_text, success_message: f.success_message, theme_color: f.theme_color,
      field_color: f.field_color || '#d1d5db',
      sms_followup: f.sms_followup, fields: Array.isArray(f.fields) ? f.fields : [],
      // Forms built before this existed have no email configured: start it OFF with the default copy ready to edit.
      followup_email: f.followup_email || { ...DEFAULT_FOLLOWUP, enabled: false, steps: DEFAULT_FOLLOWUP.steps.map(x => ({ ...x })) },
      followup_sms: f.followup_sms || { ...DEFAULT_FOLLOWUP_SMS },
    });
    setEditingId(f.id);
    setSourceTouched(true);
    setView('edit');
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this form? The embed snippet will stop working.')) return;
    await authFetch(`${apiUrl}/api/embed-forms/${id}`, { method: 'DELETE' });
    load();
  };

  const duplicate = async (id) => {
    setDuplicatingId(id);
    try {
      const res = await authFetch(`${apiUrl}/api/embed-forms/${id}/duplicate`, { method: 'POST' });
      if (res.ok) await load();
    } catch (e) {
      console.error('Duplicate failed', e);
    } finally {
      setDuplicatingId(null);
    }
  };

  const [testState, setTestState] = useState({ busy: false, msg: '' });
  const fu = draft?.followup_email;
  const setFu = (patch) => setDraft({ ...draft, followup_email: { ...draft.followup_email, ...patch } });
  const setStep = (i, patch) => setFu({ steps: fu.steps.map((st, idx) => (idx === i ? { ...st, ...patch } : st)) });
  const moveStep = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= fu.steps.length) return;
    const steps = [...fu.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    setFu({ steps });
  };
  const fs = draft?.followup_sms;
  const setFs = (patch) => setDraft({ ...draft, followup_sms: { ...draft.followup_sms, ...patch } });
  const smsPreview = fs ? (() => {
    const t = sampleFill(fs.message).trim();
    return /\bstop\b/i.test(t) ? t : `${t} Reply STOP to opt out.`;
  })() : '';
  const sendTest = async () => {
    setTestState({ busy: true, msg: '' });
    try {
      const res = await authFetch(`${apiUrl}/api/embed-forms/${editingId}/followup-test`, {
        method: 'POST', body: JSON.stringify({ followup_email: draft.followup_email }),
      });
      const data = await res.json();
      setTestState({ busy: false, msg: res.ok ? `Test sent to ${data.sentTo}` : (data.error || 'Could not send the test') });
    } catch {
      setTestState({ busy: false, msg: 'Could not send the test' });
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...draft, source: slugify(draft.source || draft.name) };
      const res = editingId
        ? await authFetch(`${apiUrl}/api/embed-forms/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await authFetch(`${apiUrl}/api/embed-forms`, { method: 'POST', body: JSON.stringify(payload) });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON error body */ }
      if (!res.ok) {
        setSaveError(data.error || `Save failed (error ${res.status}). Nothing was changed.`);
        return;
      }
      // Confirm the server actually kept the next-steps settings. A server still running an older
      // version saves the form but silently drops them — say so rather than closing as if all was saved.
      const saved = data.form || {};
      const keptEmail = !draft.followup_email || (saved.followup_email && saved.followup_email.enabled === draft.followup_email.enabled && saved.followup_email.subject === draft.followup_email.subject);
      const keptSms = !draft.followup_sms || (saved.followup_sms && saved.followup_sms.enabled === draft.followup_sms.enabled);
      if (!keptEmail || !keptSms) {
        await load();
        setSaveError("The form saved, but the server didn't keep the next-steps email/text settings — it is probably still updating. Wait a minute or two, then press Save Form again.");
        return;
      }
      setSaveError('');
      await load();
      setView('list');
    } catch (e) {
      console.error('Save failed', e);
      setSaveError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── draft field helpers ──
  const setField = (idx, patch) => {
    const fields = draft.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setDraft({ ...draft, fields });
  };
  const removeField = (idx) => setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== idx) });
  const moveField = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= draft.fields.length) return;
    const fields = [...draft.fields];
    [fields[idx], fields[j]] = [fields[j], fields[idx]];
    setDraft({ ...draft, fields });
  };
  const addPreset = (preset) => {
    if (draft.fields.some((f) => f.key === preset.key)) return;
    setDraft({ ...draft, fields: [...draft.fields, { ...preset }] });
  };
  const addCustom = () => {
    const n = draft.fields.filter((f) => f.key.startsWith('custom_')).length + 1;
    setDraft({ ...draft, fields: [...draft.fields, { key: `custom_${n}`, type: 'text', label: 'New field', placeholder: '', required: false }] });
  };

  const onNameChange = (name) => {
    setDraft((d) => ({ ...d, name, source: sourceTouched ? d.source : slugify(name) }));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  // ════════════════ LIST VIEW ════════════════
  if (view === 'list') {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Embed Forms</h3>
            <p className="text-gray-500 text-sm mt-1">Build standalone forms, drop them anywhere with a snippet, and track each one as its own lead source.</p>
          </div>
          <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition text-sm shadow-sm shadow-amber-200">
            <Plus className="w-4 h-4" /> New Form
          </button>
        </div>

        {forms.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900">No forms yet</h4>
            <p className="text-gray-500 text-sm mt-1 mb-5">Create a form, then paste its snippet on any page of your website.</p>
            <button onClick={startCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition text-sm">
              <Plus className="w-4 h-4" /> Create Your First Form
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((f) => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{f.name}</span>
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">source: {f.source}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{f.fields?.length || 0} fields</span>
                      <span>·</span>
                      <span>{Number(f.lead_count) || 0} leads</span>
                      {f.sms_followup && <><span>·</span><span className="inline-flex items-center gap-1 text-green-600"><MessageSquare className="w-3 h-3" /> SMS follow-up</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(f)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => duplicate(f.id)} disabled={duplicatingId === f.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"><CopyPlus className="w-3.5 h-3.5" /> {duplicatingId === f.id ? 'Duplicating…' : 'Duplicate'}</button>
                    <button onClick={() => remove(f.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {/* Snippet */}
                <div className="mt-3 bg-gray-900 rounded-lg p-3 flex items-start gap-2">
                  <code className="text-green-400 text-[11px] font-mono break-all flex-1 leading-relaxed whitespace-pre-wrap">{snippetFor(f.public_id)}</code>
                  <button onClick={() => copySnippet(f.public_id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${copiedId === f.public_id ? 'bg-green-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                    {copiedId === f.public_id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Code className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Paste a form's snippet wherever you want it (e.g. a Wix <strong>Embed HTML</strong> block). The form renders inline, and every submission becomes a lead tagged with that form's source — so you can see exactly where leads came from in Customers &amp; Leads.</p>
        </div>
      </div>
    );
  }

  // ════════════════ EDIT / BUILDER VIEW ════════════════
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Form' : 'New Form'}</h3>
            <p className="text-gray-500 text-sm">Build the form on the left — preview updates live.</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 text-sm">
          {saving ? 'Saving…' : 'Save Form'}
        </button>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{saveError}</div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left: editor */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Form meta */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Form Name <span className="text-gray-400">(internal)</span></label>
                <input value={draft.name} onChange={(e) => onNameChange(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="PPF Landing Form" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source Tag <span className="text-gray-400">(attribution)</span></label>
                <input value={draft.source} onChange={(e) => { setSourceTouched(true); setDraft({ ...draft, source: e.target.value }); }} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none" placeholder="ppf_landing" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Heading (shown to visitor)</label>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="Get a Free Quote" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="Fill this out and we'll text you right back." />
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Fields</span>
              <button onClick={addCustom} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition"><Plus className="w-3.5 h-3.5" /> Custom Field</button>
            </div>

            {/* Standard quick-add */}
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_PRESETS.map((p) => {
                const added = draft.fields.some((f) => f.key === p.key);
                return (
                  <button key={p.key} onClick={() => addPreset(p)} disabled={added}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${added ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
                    {added ? '✓ ' : '+ '}{p.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {draft.fields.map((f, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex flex-col">
                      <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveField(idx, 1)} disabled={idx === draft.fields.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={f.label} onChange={(e) => setField(idx, { label: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm font-medium focus:border-blue-500 focus:outline-none" placeholder="Field label" />
                    <select value={f.type} onChange={(e) => setField(idx, { type: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={() => removeField(idx)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-8">
                    {f.type !== 'checkbox' && (
                      <input value={f.placeholder || ''} onChange={(e) => setField(idx, { placeholder: e.target.value })} className="flex-1 min-w-[140px] px-2 py-1 border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none" placeholder="Placeholder text" />
                    )}
                    {f.type === 'select' && (
                      <input value={(f.options || []).join(', ')} onChange={(e) => setField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="flex-1 min-w-[140px] px-2 py-1 border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none" placeholder="Option 1, Option 2, Option 3" />
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-600">
                      <input type="checkbox" checked={!!f.required} onChange={(e) => setField(idx, { required: e.target.checked })} className="w-3.5 h-3.5" /> Required
                    </label>
                  </div>
                </div>
              ))}
              {draft.fields.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Add at least one field above.</p>}
            </div>
          </div>

          {/* Behavior + appearance */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">AI SMS follow-up</p>
                  <p className="text-xs text-gray-500">Auto-text the lead after they submit (adds a consent checkbox).</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={draft.sms_followup} onChange={(e) => setDraft({ ...draft, sms_followup: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Submit Button Text</label>
                <input value={draft.submit_text} onChange={(e) => setDraft({ ...draft, submit_text: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="Submit" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Theme Color <span className="text-gray-400">(button &amp; focus)</span></label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.theme_color} onChange={(e) => setDraft({ ...draft, theme_color: e.target.value })} className="w-9 h-9 rounded-lg border-2 border-gray-200 cursor-pointer" />
                  <input value={draft.theme_color} onChange={(e) => setDraft({ ...draft, theme_color: e.target.value })} className="flex-1 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Field Color <span className="text-gray-400">(input borders)</span></label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.field_color || '#d1d5db'} onChange={(e) => setDraft({ ...draft, field_color: e.target.value })} className="w-9 h-9 rounded-lg border-2 border-gray-200 cursor-pointer" />
                  <input value={draft.field_color || '#d1d5db'} onChange={(e) => setDraft({ ...draft, field_color: e.target.value })} className="flex-1 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Success Message (after submit)</label>
              <input value={draft.success_message} onChange={(e) => setDraft({ ...draft, success_message: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" placeholder="Thanks! We'll be in touch shortly." />
            </div>
          </div>

          {/* Next-steps email to the visitor */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Next-steps email</p>
                  <p className="text-xs text-gray-500">Emailed to the visitor right after they submit, telling them what happens next.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!!fu?.enabled} onChange={(e) => setFu({ enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {fu?.enabled && (
              <>
                {!draft.fields.some((f) => f.key === 'email') && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    This form has no Email field, so there is nowhere to send this. Add an Email field above.
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  You can use <code className="bg-gray-100 px-1 rounded">{'{{first_name}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{business_name}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{form_name}}'}</code> anywhere in the email.
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <input value={fu.subject} onChange={(e) => setFu({ subject: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Heading</label>
                  <input value={fu.heading} onChange={(e) => setFu({ heading: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Intro</label>
                  <textarea rows={2} value={fu.intro} onChange={(e) => setFu({ intro: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Steps</label>
                    <input value={fu.steps_title} onChange={(e) => setFu({ steps_title: e.target.value })} placeholder="Steps heading (e.g. What happens next)" className="w-56 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    {fu.steps.map((st, i) => (
                      <div key={i} className="flex gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">{i + 1}</span>
                        <div className="flex-1 space-y-1">
                          <input value={st.title} onChange={(e) => setStep(i, { title: e.target.value })} placeholder="Step title" className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm font-medium focus:border-blue-500 focus:outline-none" />
                          <textarea rows={2} value={st.description} onChange={(e) => setStep(i, { description: e.target.value })} placeholder="What happens in this step" className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:outline-none resize-none" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                          <button type="button" onClick={() => moveStep(i, 1)} disabled={i === fu.steps.length - 1} className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setFu({ steps: fu.steps.filter((_, idx) => idx !== i) })} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {fu.steps.length < MAX_STEPS && (
                    <button type="button" onClick={() => setFu({ steps: [...fu.steps, { title: '', description: '' }] })} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add step
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button text <span className="text-gray-400">(optional)</span></label>
                    <input value={fu.button_label} onChange={(e) => setFu({ button_label: e.target.value })} placeholder="Book a time" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button link</label>
                    <input value={fu.button_url} onChange={(e) => setFu({ button_url: e.target.value })} placeholder="https://" className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Closing line</label>
                  <textarea rows={2} value={fu.closing} onChange={(e) => setFu({ closing: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none" />
                </div>

                {/* Preview as the visitor sees it */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Preview</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white text-sm text-gray-800 space-y-3">
                    <p className="text-xs text-gray-400">Subject: {sampleFill(fu.subject)}</p>
                    {fu.heading && <p className="text-lg font-bold">{sampleFill(fu.heading)}</p>}
                    {fu.intro && <p className="whitespace-pre-wrap">{sampleFill(fu.intro)}</p>}
                    {fu.steps.length > 0 && fu.steps_title && <p className="font-bold">{sampleFill(fu.steps_title)}</p>}
                    {fu.steps.map((st, i) => (
                      <p key={i}><b>{i + 1}. {sampleFill(st.title)}</b>{st.description && <><br /><span className="whitespace-pre-wrap">{sampleFill(st.description)}</span></>}</p>
                    ))}
                    {fu.button_label && fu.button_url && <p><span className="text-blue-700 underline">{fu.button_label}</span></p>}
                    {fu.closing && <p className="whitespace-pre-wrap">{sampleFill(fu.closing)}</p>}
                    <p className="text-xs text-gray-400">— your business</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={sendTest} disabled={!editingId || testState.busy} className="px-3 py-2 text-sm font-semibold border-2 border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-40 flex items-center gap-1.5">
                    <Send className="w-4 h-4" /> {testState.busy ? 'Sending…' : 'Send me a test'}
                  </button>
                  {!editingId && <span className="text-xs text-gray-400">Save the form first to send a test.</span>}
                  {testState.msg && <span className="text-xs text-gray-600">{testState.msg}</span>}
                </div>
              </>
            )}
          </div>

          {/* Next-steps text message to the visitor */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Next-steps text message</p>
                  <p className="text-xs text-gray-500">Texted to the visitor right after they submit (adds a required consent checkbox to the form).</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!!fs?.enabled} onChange={(e) => setFs({ enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {fs?.enabled && (
              <>
                {!draft.fields.some((f) => f.key === 'phone') && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    This form has no Phone field, so there is nowhere to text. Add a Phone field above.
                  </p>
                )}
                {draft.sms_followup && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                    AI SMS follow-up is also on. The next-steps text goes first and the AI text follows about 2 minutes later.
                  </p>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">Message</label>
                    <span className={`text-xs ${fs.message.length > SMS_MAX ? 'text-red-600' : 'text-gray-400'}`}>
                      {fs.message.length}/{SMS_MAX} · about {Math.max(1, Math.ceil(smsPreview.length / 160))} text{Math.ceil(smsPreview.length / 160) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <textarea rows={5} maxLength={SMS_MAX} value={fs.message} onChange={(e) => setFs({ message: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-green-600 focus:outline-none resize-none" />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables: <code className="bg-gray-100 px-1 rounded">{'{{first_name}}'}</code>{' '}
                    <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>{' '}
                    <code className="bg-gray-100 px-1 rounded">{'{{business_name}}'}</code>{' '}
                    <code className="bg-gray-100 px-1 rounded">{'{{form_name}}'}</code>. "Reply STOP to opt out." is added automatically if you don't include it.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Preview</p>
                  <div className="max-w-xs bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">{smsPreview}</div>
                </div>
                <p className="text-xs text-gray-400">
                  Counts toward your monthly text allowance. Only sent to people who tick the consent box, and never to numbers that opted out. One per phone number per day.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Live Preview</span>
            </div>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="p-5">
                {draft.title && <h3 className="text-lg font-bold text-gray-900 mb-1">{draft.title}</h3>}
                {draft.description && <p className="text-xs text-gray-500 mb-4">{draft.description}</p>}
                <div className="space-y-3">
                  {draft.fields.map((f, i) => (
                    <div key={i}>
                      {f.type === 'checkbox' ? (
                        <label className="flex items-start gap-2 text-xs text-gray-500"><input type="checkbox" disabled className="mt-0.5" />{f.label}{f.required && <span className="text-red-400">*</span>}</label>
                      ) : (
                        <>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                          {f.type === 'textarea'
                            ? <textarea rows="2" placeholder={f.placeholder} disabled style={{ borderColor: draft.field_color }} className="w-full px-3 py-2 border-2 rounded-lg text-xs bg-gray-50 text-gray-400 resize-none" />
                            : f.type === 'select'
                              ? <select disabled style={{ borderColor: draft.field_color }} className="w-full px-3 py-2 border-2 rounded-lg text-xs bg-gray-50 text-gray-400"><option>{f.placeholder || 'Select…'}</option></select>
                              : <input type="text" placeholder={f.placeholder} disabled style={{ borderColor: draft.field_color }} className="w-full px-3 py-2 border-2 rounded-lg text-xs bg-gray-50 text-gray-400" />}
                        </>
                      )}
                    </div>
                  ))}
                  {draft.sms_followup && (
                    <label className="flex items-start gap-2 text-[11px] text-gray-400"><input type="checkbox" disabled className="mt-0.5" />I consent to receive text messages about my inquiry. Msg &amp; data rates may apply. Reply STOP to opt out.</label>
                  )}
                  <button disabled className="w-full py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: draft.theme_color }}>{draft.submit_text || 'Submit'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
