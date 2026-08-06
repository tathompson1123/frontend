import { useState, useEffect, useRef } from 'react';
import {
  Mail, Send, CheckCircle, AlertCircle, Loader, Sparkles,
  Settings, Users, Clock, ChevronDown, ChevronUp, FlaskConical,
  History, X, Zap, Upload, ArrowRight, FolderOpen, BookmarkPlus, Trash2,
} from 'lucide-react';
import OakameLoader from '../OakameLoader';

// ── CSV parsing (mirrors CustomersLeads logic) ────────────────
function parseCustomerCSV(text) {
  const rows = [];
  let inQuote = false, cur = '', cells = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ''; }
    else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (cur.trim() || cells.length) { cells.push(cur.trim()); rows.push(cells); }
      cur = ''; cells = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else { cur += ch; }
  }
  if (cur.trim() || cells.length) { cells.push(cur.trim()); rows.push(cells); }
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["']/, '').replace(/["']$/, '').toLowerCase().trim());
  const resolve = (...terms) => {
    for (const t of terms) {
      const idx = headers.findIndex(h => h.includes(t) || t.includes(h));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  const nameIdx = resolve('full name', 'name');
  const firstIdx = resolve('first name', 'first');
  const lastIdx = resolve('last name', 'last');
  const emailIdx = resolve('email');
  const phoneIdx = resolve('phone', 'mobile', 'cell');

  const customers = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    let name = '';
    if (nameIdx !== -1) name = (row[nameIdx] || '').replace(/^[+'"]/, '').trim();
    else {
      const fn = firstIdx !== -1 ? (row[firstIdx] || '').trim() : '';
      const ln = lastIdx !== -1 ? (row[lastIdx] || '').trim() : '';
      name = [fn, ln].filter(Boolean).join(' ');
    }
    const email = emailIdx !== -1 ? (row[emailIdx] || '').replace(/^[+'"]/, '').trim() : '';
    const phone = phoneIdx !== -1 ? (row[phoneIdx] || '').replace(/^[+'"]/, '').trim() : '';
    if (name || email || phone) customers.push({ name: name || email.split('@')[0] || 'Customer', email, phone });
  }
  return customers;
}

// ── First-time import screen ──────────────────────────────────
function FirstTimeImportScreen({ apiUrl, authFetch, onImportDone }) {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setImporting(true);
    try {
      const text = await file.text();
      const customers = parseCustomerCSV(text);
      if (customers.length === 0) { setError('No valid rows found. Make sure your CSV has name, email, or phone columns.'); setImporting(false); return; }
      const res = await authFetch(`${apiUrl}/api/customers/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers }),
      });
      const data = await res.json();
      if (data.success || data.imported !== undefined) {
        setImported(data.imported || customers.length);
        setTimeout(() => onImportDone(), 2200);
      } else {
        setError(data.error || 'Import failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to read file. Please try again.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (imported > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customers imported!</h2>
          <p className="text-gray-600 mb-1">{imported} customers added to your list.</p>
          <p className="text-sm text-gray-400">Generating your first email campaign…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Import your customer list
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Upload a CSV from your current CRM or wherever you track customers — we'll build a personalized email campaign for them instantly.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-amber-300 rounded-2xl p-10 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all mb-4"
        >
          <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-800 mb-1">Click to upload your customer CSV</p>
          <p className="text-sm text-gray-500">Supports Name, Email, Phone columns from any CRM</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {importing && (
          <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-medium mb-4">
            <Loader className="w-4 h-4 animate-spin" />
            Importing customers…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-xs text-center text-gray-400">
          After this, if you want to import more customers use the <strong>Customers &amp; Leads</strong> tab.
        </p>
      </div>
    </div>
  );
}

// ── Settings Modal ───────────────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return { value: i, label: `${h}:00 ${i < 12 ? 'AM' : 'PM'}` };
});

function SettingsModal({ config, onSave, onClose }) {
  const [local, setLocal] = useState({
    from_name: config.from_name || '',
    from_email: config.from_email || '',
    send_day: config.send_day || 'monday',
    send_hour: config.send_hour ?? 9,
    enabled: config.enabled ?? true,
    auto_send: config.auto_send ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Campaign Settings</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">From Name</label>
            <input
              type="text"
              value={local.from_name}
              onChange={e => setLocal(p => ({ ...p, from_name: e.target.value }))}
              placeholder="Your Business Name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reply-To Email</label>
            <input
              type="email"
              value={local.from_email}
              onChange={e => setLocal(p => ({ ...p, from_email: e.target.value }))}
              placeholder="hello@yourbusiness.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Send Day</label>
              <select
                value={local.send_day}
                onChange={e => setLocal(p => ({ ...p, send_day: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time (UTC)</label>
              <select
                value={local.send_hour}
                onChange={e => setLocal(p => ({ ...p, send_hour: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          {/* Weekly generation mode */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">Weekly Campaign Mode</p>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: true, auto_send: false }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${local.enabled && !local.auto_send ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${local.enabled && !local.auto_send ? 'text-blue-700' : 'text-gray-800'}`}>Manual Approval</p>
              <p className="text-xs text-gray-500 mt-0.5">SORCE prepares a campaign every week. You review and approve before it sends.</p>
            </button>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: true, auto_send: true }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${local.enabled && local.auto_send ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${local.enabled && local.auto_send ? 'text-purple-700' : 'text-gray-800'}`}>Fully Automated</p>
              <p className="text-xs text-gray-500 mt-0.5">SORCE generates and sends automatically every week. No action needed from you.</p>
            </button>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: false, auto_send: false }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${!local.enabled ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${!local.enabled ? 'text-gray-700' : 'text-gray-600'}`}>Off</p>
              <p className="text-xs text-gray-500 mt-0.5">Pause weekly campaigns entirely.</p>
            </button>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-all"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Block y-position map (% down the email each block typically appears) ─────
const BLOCK_Y_PCT = {
  header:       4,
  hero_image:   22,
  urgency_bar:  36,
  body:         52,
  offer_box:    67,
  cta_button:   80,
  signoff:      90,
  footer:       96,
};

// ── Annotation ink colors ────────────────────────────────────
const ANNOTATION_INKS = [
  { color: '#2563eb', light: '#dbeafe' }, // blue
  { color: '#7c3aed', light: '#ede9fe' }, // purple
  { color: '#d97706', light: '#fef3c7' }, // amber
  { color: '#059669', light: '#d1fae5' }, // green
  { color: '#dc2626', light: '#fee2e2' }, // red
];

// ── Onboarding intro screen ───────────────────────────────────
const INTRO_TEXT = "Let's get this started with a bang and generate some sales!";

function IntroScreen({ onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Brief pause so the loader registers, then start typing
    const startDelay = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDisplayed(INTRO_TEXT.slice(0, i));
        if (i >= INTRO_TEXT.length) {
          clearInterval(iv);
          setTimeout(() => {
            setFading(true);
            setTimeout(onDone, 500);
          }, 1400);
        }
      }, 38);
      return () => clearInterval(iv);
    }, 600);
    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center py-24 px-8 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Oakame three-bar loader */}
      <div className="mb-10">
        <OakameLoader size="xl" color="#f59e0b" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center max-w-md leading-snug min-h-[3rem]">
        {displayed}
        {displayed.length > 0 && displayed.length < INTRO_TEXT.length && (
          <span className="inline-block w-0.5 h-7 bg-amber-500 ml-0.5 align-middle animate-pulse" />
        )}
      </h1>
    </div>
  );
}

// ── Annotation note card ─────────────────────────────────────
function AnnotationCard({ a, i, side }) {
  const ink = ANNOTATION_INKS[i % ANNOTATION_INKS.length];
  // Arrow points toward the email (right for left-side notes, left for right-side notes)
  const arrowSide = side === 'left' ? 'right' : 'left';
  return (
    <div className="relative" style={{ marginBottom: '10px' }}>
      {/* Card */}
      <div
        className="relative rounded-lg px-3 py-2.5 shadow-sm"
        style={{ backgroundColor: ink.light, border: `1px solid ${ink.color}30` }}
      >
        {/* Ruled lines */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent, transparent 22px, ${ink.color}15 23px)`,
            backgroundPosition: '0 10px',
          }}
        />
        {/* Label */}
        <span
          className="relative block font-sans uppercase tracking-widest mb-0.5"
          style={{ fontSize: '0.6rem', fontWeight: 700, color: ink.color, opacity: 0.55 }}
        >
          {a.label}
        </span>
        {/* Note text */}
        <p
          className="relative leading-snug"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1rem',
            fontWeight: 600,
            color: ink.color,
            lineHeight: '1.45',
          }}
        >
          {a.note}
        </p>
        {/* Arrow pointing toward email */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            [arrowSide === 'right' ? 'right' : 'left']: -9,
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            [arrowSide === 'right' ? 'borderLeft' : 'borderRight']: `9px solid ${ink.color}40`,
          }}
        />
      </div>
    </div>
  );
}

// ── Email iframe only (no annotations) ──────────────────────
function EmailPreview({ html, onHeightChange }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:#f3f4f6;font-family:Arial,sans-serif}*{box-sizing:border-box}</style></head><body>${html}</body></html>`);
    doc.close();
    const resize = () => {
      try {
        const h = doc.body.scrollHeight + 32;
        iframe.style.height = h + 'px';
        onHeightChange?.(h);
      } catch {}
    };
    setTimeout(resize, 100);
  }, [html]);

  return (
    <div className="flex-1 bg-gray-100 py-4 px-3">
      <iframe
        ref={iframeRef}
        title="Email Preview"
        className="w-full rounded-xl border border-gray-200 bg-white"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}

// ── Past Campaigns ────────────────────────────────────────────
// Per-campaign click detail, loaded on expand rather than with the list — most rows never
// get opened, and the recipient breakdown is the expensive half of the query.
function CampaignClicks({ apiUrl, authFetch, campaignId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    authFetch(`${apiUrl}/api/email-campaigns/${campaignId}/clicks`)
      .then(r => r.json())
      .then(d => { if (live) { d.success ? setData(d) : setError(true); } })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [apiUrl, authFetch, campaignId]);

  if (error) return <p className="text-xs text-gray-400 px-5 pb-3">Couldn't load click data.</p>;
  if (!data) return <p className="text-xs text-gray-400 px-5 pb-3">Loading…</p>;

  // A campaign sent before click tracking existed has no recipient rows, which would
  // otherwise render as a confident "0 clicks" and send someone hunting a reporting bug.
  if (!data.tracked) {
    return <p className="text-xs text-gray-400 px-5 pb-3">This campaign was sent before click tracking was added.</p>;
  }

  return (
    <div className="px-5 pb-4 space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="text-gray-700"><strong>{data.uniqueClickers}</strong> of {data.delivered} clicked</span>
        {data.clickRate != null && (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{data.clickRate}%</span>
        )}
        <span className="text-gray-400">{data.totalClicks} total click{data.totalClicks === 1 ? '' : 's'}</span>
      </div>

      {data.links.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Links</p>
          {data.links.map(l => (
            <div key={l.id} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-gray-700 font-medium w-10 flex-shrink-0">{l.clicks}</span>
              <span className="text-gray-500 truncate" title={l.destination}>{l.destination}</span>
            </div>
          ))}
        </div>
      )}

      {data.recipients.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Who clicked</p>
          <div className="max-h-44 overflow-y-auto">
            {data.recipients.map(r => (
              <div key={r.email} className="flex items-center gap-2 text-xs py-0.5">
                <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline truncate flex-1">{r.email}</a>
                <span className="text-gray-400 flex-shrink-0">
                  {r.clicks}× · {new Date(r.last_click).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recipients.length === 0 && (
        <p className="text-xs text-gray-400">No clicks yet.</p>
      )}
    </div>
  );
}

function PastCampaigns({ history, apiUrl, authFetch }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const sent = history.filter(c => c.status === 'sent');
  if (sent.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Past Campaigns</span>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{sent.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="divide-y divide-gray-100 bg-white border-t border-gray-100">
          {sent.slice(0, 10).map(c => (
            <div key={c.id}>
              <button
                onClick={() => setExpanded(e => (e === c.id ? null : c.id))}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.sent_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {c.recipient_count ? ` · ${c.recipient_count} recipients` : ''}
                  </p>
                </div>
                {c.unique_clickers > 0 && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 flex-shrink-0">
                    {c.unique_clickers} clicked
                  </span>
                )}
                {expanded === c.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {expanded === c.id && (
                <CampaignClicks apiUrl={apiUrl} authFetch={authFetch} campaignId={c.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function EmailCampaigns({ apiUrl, authFetch, user, inOnboarding }) {
  const [campaign, setCampaign] = useState(null);  // current draft
  const [draftId, setDraftId] = useState(null);
  const [config, setConfig] = useState({ from_name: '', from_email: '', send_day: 'monday', send_hour: 9, enabled: true, auto_send: false, cta_link: '' });
  const [ctaLink, setCtaLink] = useState('');
  const [savingCtaLink, setSavingCtaLink] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  // Loading states
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [refining, setRefining] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Feedback input
  const [feedback, setFeedback] = useState('');
  const feedbackRef = useRef(null);

  // First-time import screen
  const [showImportScreen, setShowImportScreen] = useState(false);

  // Onboarding intro
  const [showIntro, setShowIntro] = useState(() => {
    if (!inOnboarding) return false;
    const seen = localStorage.getItem('email_intro_seen');
    return !seen;
  });

  // Email height for annotation column positioning
  const [emailHeight, setEmailHeight] = useState(640);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState(null);

  const loadTemplates = async () => {
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/templates`);
      const data = await r.json();
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    }
  };

  const openTemplatesModal = async () => {
    setShowTemplatesModal(true);
    await loadTemplates();
  };

  const handleSaveAsTemplate = async () => {
    if (!campaign) return;
    const name = templateName.trim();
    if (!name) return;
    setSavingTemplate(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject: campaign.subject || '',
          preview_text: campaign.preview_text || '',
          blocks: campaign.blocks || [],
          body_html: campaign.body_html || '',
          body_text: campaign.body_text || '',
        }),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Saved template "${name}"`);
        setShowSaveTemplateModal(false);
        setTemplateName('');
      } else {
        showToast(data.error || 'Could not save template', 'error');
      }
    } catch (e) {
      showToast('Could not save template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = async (tplId) => {
    setApplyingTemplateId(tplId);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/templates/${tplId}/apply`, { method: 'POST' });
      const data = await r.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
        setDraftId(data.campaign.id);
        setShowTemplatesModal(false);
        showToast('Template loaded into draft');
      } else {
        showToast(data.error || 'Could not load template', 'error');
      }
    } catch {
      showToast('Could not load template', 'error');
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (tplId, name) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/templates/${tplId}`, { method: 'DELETE' });
      const data = await r.json();
      if (data.success) {
        setTemplates(ts => ts.filter(t => t.id !== tplId));
        showToast('Template deleted');
      }
    } catch {
      showToast('Could not delete template', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load everything on mount
  useEffect(() => {
    Promise.all([
      authFetch(`${apiUrl}/api/email-campaigns/config`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/email-campaigns/stats`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/business-info`).then(r => r.json()).catch(() => ({})),
    ]).then(([configData, histData, statsData, bizData]) => {
      const savedConfig = configData.config || {};
      const bizInfo = bizData.businessInfo || {};
      setConfig({
        enabled: false, send_day: 'monday', send_hour: 9,
        ...savedConfig,
        from_name: savedConfig.from_name || user?.business_name || '',
        from_email: savedConfig.from_email || bizInfo.email || user?.email || '',
      auto_send: savedConfig.auto_send ?? false,
      cta_link: savedConfig.cta_link || '',
      });
      setCtaLink(savedConfig.cta_link || '');
      if (histData.campaigns) setHistory(histData.campaigns);
      if (statsData.subscriberCount !== undefined) {
        setStats(statsData);
        if ((statsData.subscriberCount ?? 0) === 0) setShowImportScreen(true);
      }
    });

    // Fetch or auto-generate this week's campaign
    authFetch(`${apiUrl}/api/email-campaigns/current-draft`)
      .then(r => r.json())
      .then(data => {
        if (data.campaign) {
          setCampaign(data.campaign);
          setDraftId(data.campaign.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false));
  }, []);

  const saveCtaLink = async () => {
    setSavingCtaLink(true);
    try {
      const merged = { ...config, cta_link: ctaLink };
      setConfig(merged);
      await authFetch(`${apiUrl}/api/email-campaigns/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      showToast('Button link saved — applies to future campaigns');
    } finally {
      setSavingCtaLink(false);
    }
  };

  const saveSettings = async (newConfig) => {
    const merged = { ...config, ...newConfig };
    setConfig(merged);
    await authFetch(`${apiUrl}/api/email-campaigns/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
    // Refresh stats
    authFetch(`${apiUrl}/api/email-campaigns/stats`).then(r => r.json()).then(d => {
      if (d.subscriberCount !== undefined) setStats(d);
    }).catch(() => {});
    showToast('Settings saved');
  };

  const handleRefine = async () => {
    if (!feedback.trim() || !draftId) return;
    setRefining(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, feedback: feedback.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        // Merge so annotations (not returned by refine) are preserved
        setCampaign(prev => ({ ...prev, ...data.campaign }));
        setFeedback('');
        showToast('Campaign updated');
      } else {
        showToast(data.error || 'Failed to update', 'error');
      }
    } finally {
      setRefining(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Delete current draft then fetch a new one
      if (draftId) {
        await authFetch(`${apiUrl}/api/email-campaigns/drafts/${draftId}`, { method: 'DELETE' }).catch(() => {});
      }
      const r = await authFetch(`${apiUrl}/api/email-campaigns/current-draft`);
      const data = await r.json();
      if (data.campaign) {
        setCampaign(data.campaign);
        setDraftId(data.campaign.id);
        showToast('Fresh campaign generated');
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestSend = async () => {
    if (!config.from_email) { showToast('Add a reply-to email below before sending', 'error'); return; }
    setSendingTest(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await r.json();
      if (data.success) showToast(`Test sent to ${data.sentTo}`);
      else showToast(data.error || 'Test failed', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleApprove = async () => {
    if (!config.from_email) { showToast('Add a reply-to email below before sending', 'error'); return; }
    const count = stats?.subscriberCount ?? 'your';
    if (!confirm(`Send this campaign to ${count} customers now?`)) return;
    setSending(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Sent to ${data.sent} customers`);
        setCampaign(null);
        setDraftId(null);
        // Refresh history
        authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()).then(d => {
          if (d.campaigns) setHistory(d.campaigns);
        }).catch(() => {});
      } else {
        showToast(data.error || 'Send failed', 'error');
        // A stale / already-sent draft can't be sent again — drop it and pull a fresh one so
        // the user isn't stuck staring at a dead draft that keeps 404/409-ing.
        if (data.stale || r.status === 404 || r.status === 409) {
          setCampaign(null);
          setDraftId(null);
          authFetch(`${apiUrl}/api/email-campaigns/current-draft`)
            .then(res => res.json())
            .then(d => { if (d.campaign) { setCampaign(d.campaign); setDraftId(d.campaign.id); } })
            .catch(() => {});
        }
      }
    } finally {
      setSending(false);
    }
  };

  const handleImportDone = () => {
    setShowImportScreen(false);
    authFetch(`${apiUrl}/api/email-campaigns/stats`).then(r => r.json()).then(d => {
      if (d.subscriberCount !== undefined) setStats(d);
    }).catch(() => {});
    authFetch(`${apiUrl}/api/email-campaigns/current-draft`)
      .then(r => r.json())
      .then(data => {
        if (data.campaign) { setCampaign(data.campaign); setDraftId(data.campaign.id); }
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false));
  };

  const sendDay = config.send_day
    ? config.send_day.charAt(0).toUpperCase() + config.send_day.slice(1)
    : 'Monday';

  if (showIntro) {
    return (
      <IntroScreen onDone={() => {
        localStorage.setItem('email_intro_seen', '1');
        setShowIntro(false);
      }} />
    );
  }

  if (showImportScreen) {
    return <FirstTimeImportScreen apiUrl={apiUrl} authFetch={authFetch} onImportDone={handleImportDone} />;
  }

  // Annotation layout helpers (computed here so JSX stays clean)
  const campaignAnnotations = campaign?.annotations || [];
  const hasAnnotations = campaignAnnotations.length > 0;
  const leftAnnotations = campaignAnnotations.filter((_, i) => i % 2 === 0);
  const rightAnnotations = campaignAnnotations.filter((_, i) => i % 2 === 1);

  return (
    <div className="flex flex-col bg-gray-50" style={inOnboarding ? {} : { minHeight: 'calc(100vh - 112px)' }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal config={config} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* Templates picker modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowTemplatesModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Email Templates</h3>
                <p className="text-xs text-gray-500 mt-0.5">Load a saved design into your current draft</p>
              </div>
              <button onClick={() => setShowTemplatesModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {templates.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <FolderOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>No saved templates yet.</p>
                  <p className="text-xs mt-1">Use "Save as Template" on any campaign to start your library.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                        {t.subject && <p className="text-xs text-gray-500 truncate">Subject: {t.subject}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Saved {new Date(t.updated_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <button
                          onClick={() => handleApplyTemplate(t.id)}
                          disabled={applyingTemplateId === t.id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {applyingTemplateId === t.id ? 'Loading…' : 'Use'}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save as template modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveTemplateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Save as Template</h3>
              <button onClick={() => setShowSaveTemplateModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Saves the current subject, preview text, and all content blocks so you can reuse this campaign later.</p>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Template name</label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && templateName.trim()) handleSaveAsTemplate(); }}
              placeholder="e.g. Spring Promo, Monthly Newsletter, Review Request"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSaveAsTemplate}
                disabled={!templateName.trim() || savingTemplate}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {savingTemplate ? 'Saving…' : 'Save Template'}
              </button>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div className={inOnboarding ? '' : 'flex-1 overflow-y-auto min-h-0'}>

        {/* Onboarding continue button — top */}
        {inOnboarding && campaign && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex justify-end">
            <button
              onClick={() => {
                try {
                  const flow = JSON.parse(localStorage.getItem('onboarding_flow') || '{}');
                  flow.flow_csv = true;
                  localStorage.setItem('onboarding_flow', JSON.stringify(flow));
                  window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key: 'flow_csv' } }));
                } catch (_) {}
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              Looks good, continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Header (stays max-w-2xl) ── */}
        <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email Marketing</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {stats && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stats.subscriberCount} subscribers
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Every {sendDay}
                  </span>
                  {config.enabled && config.auto_send ? (
                    <span className="flex items-center gap-1 text-purple-600 font-semibold">
                      <Zap className="w-3 h-3" />
                      Fully automated
                    </span>
                  ) : config.enabled ? (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Approval required
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Campaign section — wider flex layout so annotations can float beside the card ── */}
        <div className="w-full px-4 pb-6">

          {(loadingDraft || stats === null) ? (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="flex justify-center mb-5">
                <OakameLoader size="lg" color="#3b82f6" />
              </div>
              <p className="font-semibold text-gray-700">SORCE is preparing this week's campaign…</p>
              <p className="text-sm text-gray-400 mt-1">Crafting a fresh offer for your customers</p>
            </div>
          ) : campaign ? (

            /* Outer flex row: [left notes] [card] [right notes] */
            <div
              className="mx-auto flex items-start gap-3"
              style={{ maxWidth: hasAnnotations ? 980 : 672 }}
            >
              {/* Left annotation column — hidden on mobile */}
              {hasAnnotations && leftAnnotations.length > 0 && (
                <div
                  className="hidden md:block w-40 flex-shrink-0 relative"
                  style={{ height: emailHeight, marginTop: 86 }}
                >
                  {leftAnnotations.map((a, i) => {
                    const yPct = BLOCK_Y_PCT[a.blockType] ?? (15 + i * 35);
                    return (
                      <div key={i} style={{ position: 'absolute', top: `${yPct}%`, transform: 'translateY(-50%)', left: 0, right: 0 }}>
                        <AnnotationCard a={a} i={i * 2} side="left" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campaign card — email fills its full natural width */}
              <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Meta bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">This Week's Campaign</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{campaign.subject}</p>
                    {campaign.previewText && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{campaign.previewText}</p>
                    )}
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    title="Generate a completely new campaign"
                    className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-all"
                  >
                    {regenerating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Regenerate
                  </button>
                </div>

                {/* Email preview — full width of the card */}
                <EmailPreview
                  html={campaign.bodyHtml || campaign.body_html || ''}
                  onHeightChange={setEmailHeight}
                />

                {/* Sender + CTA link */}
                <div className="px-5 pb-3 border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Business name</p>
                      <input
                        type="text"
                        value={config.from_name}
                        onChange={e => setConfig(p => ({ ...p, from_name: e.target.value }))}
                        onBlur={() => saveSettings(config)}
                        placeholder="Your Business Name"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Reply-to email</p>
                      <input
                        type="email"
                        value={config.from_email}
                        onChange={e => setConfig(p => ({ ...p, from_email: e.target.value }))}
                        onBlur={() => saveSettings(config)}
                        placeholder="hello@yourbusiness.com"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Button link URL</p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={ctaLink}
                        onChange={e => setCtaLink(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveCtaLink(); }}
                        placeholder="https://yourbusiness.com/book"
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                      <button
                        onClick={saveCtaLink}
                        disabled={savingCtaLink}
                        className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all flex-shrink-0"
                      >
                        {savingCtaLink ? <Loader className="w-4 h-4 animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 px-5 pb-5">
                  <button
                    onClick={openTemplatesModal}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                    title="Load a saved template"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Templates
                  </button>
                  <button
                    onClick={() => { setTemplateName(campaign?.subject || ''); setShowSaveTemplateModal(true); }}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                    title="Save the current campaign as a reusable template"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    Save as Template
                  </button>
                  <button
                    onClick={handleTestSend}
                    disabled={sendingTest}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    {sendingTest ? <Loader className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                    {sendingTest ? 'Sending…' : 'Send Test to Me'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={sending}
                    className="flex-1 min-w-[220px] flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
                  >
                    {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending…' : `Approve & Send to ${stats?.subscriberCount ?? 'All'} Customers`}
                  </button>
                </div>
              </div>

              {/* Right annotation column — hidden on mobile */}
              {hasAnnotations && rightAnnotations.length > 0 && (
                <div
                  className="hidden md:block w-40 flex-shrink-0 relative"
                  style={{ height: emailHeight, marginTop: 86 }}
                >
                  {rightAnnotations.map((a, i) => {
                    const yPct = BLOCK_Y_PCT[a.blockType] ?? (30 + i * 35);
                    return (
                      <div key={i} style={{ position: 'absolute', top: `${yPct}%`, transform: 'translateY(-50%)', left: 0, right: 0 }}>
                        <AnnotationCard a={a} i={i * 2 + 1} side="right" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ) : (
            /* No campaign state */
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-semibold text-gray-700">Campaign sent!</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">Next week's campaign will appear here automatically.</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all mx-auto"
              >
                {regenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {regenerating ? 'Generating…' : 'Generate Now'}
              </button>
            </div>
          )}

          {/* Past campaigns */}
          <div className="max-w-2xl mx-auto mt-5">
            <PastCampaigns history={history} apiUrl={apiUrl} authFetch={authFetch} />
          </div>

          {/* Onboarding continue button */}
          {inOnboarding && campaign && (
            <div className="max-w-2xl mx-auto mt-6 mb-4 flex justify-end">
              <button
                onClick={() => {
                  try {
                    const flow = JSON.parse(localStorage.getItem('onboarding_flow') || '{}');
                    flow.flow_csv = true;
                    localStorage.setItem('onboarding_flow', JSON.stringify(flow));
                    window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key: 'flow_csv' } }));
                  } catch (_) {}
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
              >
                Looks good, continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        {/* Ask SORCE — sticky at bottom of scroll container */}
        {campaign && (
          <div className="sticky bottom-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_-6px_24px_rgba(59,130,246,0.25)]">
            <div className="max-w-2xl mx-auto w-full px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Ask SORCE to change something</p>
              </div>
              <div className="flex gap-2">
                <input
                  ref={feedbackRef}
                  type="text"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
                  placeholder='e.g. "Make the offer 20% off" or "Add more urgency"'
                  disabled={refining}
                  className="flex-1 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-white/50 outline-none disabled:opacity-60 bg-white/15 text-white placeholder-blue-200"
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !feedback.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-all flex-shrink-0 shadow-sm"
                >
                  {refining ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {refining ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
