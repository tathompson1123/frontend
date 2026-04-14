import { useState, useEffect } from 'react';
import {
  Link, CheckCircle, AlertCircle, AlertTriangle, ExternalLink,
  RefreshCw, ChevronDown, ChevronUp, Search, FileText, Copy,
  TrendingUp, MapPin, Globe, Zap, Star, Clock, Users
} from 'lucide-react';

// ── Small helpers ─────────────────────────────────────────────
function authorityBadge(a) {
  if (a === 'high')   return 'bg-green-100 text-green-700';
  if (a === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-500';
}
function statusStyle(s) {
  if (s === 'submitted') return { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  label: 'Submitted' };
  if (s === 'skip')      return { dot: 'bg-gray-300',   text: 'text-gray-400',   bg: 'bg-gray-50',   label: 'Skipped' };
  return                        { dot: 'bg-amber-400',  text: 'text-amber-600',  bg: 'bg-white',     label: 'Pending' };
}

function useCopy(text, ms = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), ms); });
  return [copied, copy];
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-sm text-center">
        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        {message}
      </div>
    </div>
  );
}

// ── Tab 1: Directory Submissions ──────────────────────────────
function DirectoryTab({ apiUrl, authFetch }) {
  const [dirs, setDirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | submitted
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [justOpened, setJustOpened] = useState({}); // tracks which Submit buttons were clicked

  useEffect(() => {
    authFetch(`${apiUrl}/api/backlinks/directories`)
      .then(r => r.json())
      .then(d => { if (d.success) setDirs(d.directories); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); };

  const mark = async (directoryId, status) => {
    const dir = dirs.find(d => d.id === directoryId);
    setDirs(prev => prev.map(d => d.id === directoryId ? { ...d, status, submitted_at: status === 'submitted' ? new Date().toISOString() : d.submitted_at } : d));
    if (status === 'submitted') {
      showToast(`✓ ${dir?.name || 'Directory'} marked as submitted! It can take 2–6 weeks to appear in search results.`);
    }
    await authFetch(`${apiUrl}/api/backlinks/directories/mark`, {
      method: 'POST',
      body: JSON.stringify({ directoryId, status }),
    }).catch(() => {});
  };

  const openSubmit = (dir) => {
    setJustOpened(prev => ({ ...prev, [dir.id]: true }));
    window.open(dir.url, '_blank', 'noopener,noreferrer');
  };

  const submitted = dirs.filter(d => d.status === 'submitted').length;
  const total = dirs.length;
  const pct = total ? Math.round((submitted / total) * 100) : 0;

  const filtered = dirs.filter(d => {
    if (filter === 'pending')   return d.status === 'pending';
    if (filter === 'submitted') return d.status === 'submitted';
    return true;
  }).filter(d => categoryFilter === 'all' || d.category === categoryFilter);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {/* Progress header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">Directory Submission Progress</h3>
            <p className="text-sm text-gray-500 mt-0.5">{submitted} of {total} directories submitted — each one is a citation Google uses to verify your business</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-blue-600">{pct}%</p>
            <p className="text-xs text-gray-400">complete</p>
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-2.5 border border-blue-100">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'submitted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all capitalize ${
              filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {f === 'all' ? `All (${dirs.length})` : f === 'pending' ? `Pending (${dirs.filter(d => d.status === 'pending').length})` : `Submitted (${submitted})`}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {['all', 'general', 'service', 'local'].map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all capitalize ${
              categoryFilter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
            }`}>
            {c === 'all' ? 'All categories' : c}
          </button>
        ))}
      </div>

      {/* Directory list */}
      <div className="space-y-2">
        {filtered.map(dir => {
          const s = statusStyle(dir.status);
          return (
            <div key={dir.id} className={`flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 ${s.bg} transition-all`}>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{dir.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${authorityBadge(dir.authority)}`}>
                    {dir.authority} authority
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{dir.category}</span>
                </div>
                {dir.submitted_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(dir.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  {dir.status !== 'submitted' && (
                    <button
                      onClick={() => openSubmit(dir)}
                      className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" />
                      Open & Submit
                    </button>
                  )}
                  <button
                    onClick={() => mark(dir.id, dir.status === 'submitted' ? 'pending' : 'submitted')}
                    title={dir.status === 'submitted' ? 'Undo' : 'Mark as submitted'}
                    className={`p-1.5 rounded-lg transition-all ${
                      dir.status === 'submitted'
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : justOpened[dir.id]
                          ? 'bg-green-500 text-white animate-pulse hover:bg-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => mark(dir.id, dir.status === 'skip' ? 'pending' : 'skip')}
                    title="Skip this directory"
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all">
                    <span className="text-xs font-bold">–</span>
                  </button>
                </div>
                {justOpened[dir.id] && dir.status !== 'submitted' && (
                  <p className="text-xs text-green-600 font-medium">← Click ✓ once you've submitted</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
        <strong>How it works:</strong> Click <strong>Open & Submit</strong> — it opens the directory in a new tab. Create or claim your listing there, then come back here and click the <strong>✓ checkmark</strong> to record it as done. SORCE can't submit on your behalf, but every submission builds a citation Google uses to rank you locally.
      </div>
    </div>
  );
}

// ── Tab 2: Citation Consistency Checker ──────────────────────
function CitationTab({ apiUrl, authFetch }) {
  const [report, setReport] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    authFetch(`${apiUrl}/api/backlinks/citations/last`)
      .then(r => r.json())
      .then(d => { if (d.report) { setReport(d.report); setSavedAt(d.savedAt); } })
      .catch(() => {});
  }, []);

  const run = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await authFetch(`${apiUrl}/api/backlinks/citations/check`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run check');
      setReport(data.report);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const toggle = key => setExpanded(p => ({ ...p, [key]: !p[key] }));
  const scoreColor = s => s >= 80 ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBarColor = s => s >= 80 ? 'bg-green-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const severityColor = s => s === 'high' ? 'text-red-600 bg-red-50 border-red-200' : s === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-blue-600 bg-blue-50 border-blue-200';

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Why citation consistency matters</h3>
            <p className="text-sm text-gray-600 mt-1">
              Google cross-references your business Name, Address, and Phone (NAP) across dozens of websites.
              If your phone number appears as "(555) 123-4567" in one place and "5551234567" in another,
              Google loses trust in your listing and ranks you lower. This checker flags inconsistencies before they hurt you.
            </p>
          </div>
        </div>
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={checking}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {checking ? 'Analysing NAP data…' : report ? 'Re-run Check' : 'Run Citation Check'}
        </button>
        {savedAt && <span className="text-xs text-gray-400">Last run {new Date(savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* NAP Score */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-900">NAP Completeness Score</h4>
                <p className="text-xs text-gray-500 mt-0.5">How complete and standardisable your business info is</p>
              </div>
              <span className={`text-4xl font-black ${scoreColor(report.napScore)}`}>{report.napScore}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${scoreBarColor(report.napScore)}`} style={{ width: `${report.napScore}%` }} />
            </div>
          </div>

          {/* Standardised NAP */}
          {report.standardizedNap && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button onClick={() => toggle('nap')}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Your Standardised NAP — use this everywhere
                </span>
                {expanded.nap ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded.nap && (
                <div className="border-t border-gray-100 p-5 space-y-2">
                  {Object.entries(report.standardizedNap).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-400 w-16 uppercase">{k}</span>
                      <code className="text-sm text-gray-800 bg-gray-50 px-2 py-1 rounded flex-1">{v || '—'}</code>
                    </div>
                  ))}
                  <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg px-3 py-2">
                    Copy this exactly and use the same format on every directory listing — spacing, punctuation, and all.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Missing fields */}
          {report.missingFields?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Missing NAP fields ({report.missingFields.length})
              </p>
              <p className="text-xs text-red-600 mb-3">Add these in Business Setup to strengthen your citations.</p>
              <div className="flex flex-wrap gap-2">
                {report.missingFields.map(f => (
                  <span key={f} className="text-xs bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* NAP Issues */}
          {report.napIssues?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button onClick={() => toggle('issues')}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Potential Issues ({report.napIssues.length})
                </span>
                {expanded.issues ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded.issues && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {report.napIssues.map((issue, i) => (
                    <div key={i} className="px-5 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColor(issue.severity)}`}>{issue.severity}</span>
                        <span className="text-sm font-medium text-gray-900">{issue.field}</span>
                      </div>
                      <p className="text-xs text-gray-600">{issue.issue}</p>
                      <p className="text-xs text-blue-600 font-medium">Fix: {issue.fix}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Common mistakes */}
          {report.commonMistakes?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button onClick={() => toggle('mistakes')}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Common Mistakes to Avoid
                </span>
                {expanded.mistakes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded.mistakes && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {report.commonMistakes.map((m, i) => (
                    <div key={i} className="px-5 py-3">
                      <p className="text-sm text-gray-700">{m.mistake}</p>
                      {m.example && <p className="text-xs text-gray-400 mt-1 italic">{m.example}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {report.tips?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-800">Expert Tips</p>
              {report.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <p className="text-sm text-blue-700">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Content & Backlinks ────────────────────────────────
const CONTENT_TYPES = [
  { id: 'local-guide',    label: 'Local Guide',       desc: 'Comprehensive area guide that local sites love to link to' },
  { id: 'cost-data',      label: 'Pricing Guide',      desc: '"How much does X cost in [city]?" — high search volume, highly shareable' },
  { id: 'resource-list',  label: 'Resource List',      desc: '"Best X resources in [city]" — other businesses share these' },
  { id: 'faq-hub',        label: 'FAQ Hub',            desc: 'Answer the 10 most common local questions — earns featured snippets' },
  { id: 'seasonal-tips',  label: 'Seasonal Tips',      desc: 'Timely tips that local Facebook groups and Nextdoor love to share' },
];

function ContentTab({ apiUrl, authFetch }) {
  const [contentType, setContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [expandedSection, setExpandedSection] = useState('content');
  const [activeTemplate, setActiveTemplate] = useState('localBlogger');
  const [copiedTemplate, copyTemplate] = useCopy(result?.outreachTemplates?.[activeTemplate]?.body || '');

  useEffect(() => {
    authFetch(`${apiUrl}/api/backlinks/content/history`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.history); })
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!contentType || !topic.trim()) return;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await authFetch(`${apiUrl}/api/backlinks/content/generate`, {
        method: 'POST',
        body: JSON.stringify({ contentType, topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setResult(data.content);
      setHistory(prev => [{ content_type: contentType, topic: topic.trim(), title: data.content.title }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const [copiedContent, copyContent] = useCopy(
    result ? `${result.contentPiece?.headline}\n\n${result.contentPiece?.body}\n\n${result.contentPiece?.cta}` : ''
  );

  const toggleSection = s => setExpandedSection(p => p === s ? '' : s);

  if (generating) return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-gray-700">Generating your content + outreach templates…</p>
      <p className="text-xs text-gray-400">This takes about 20 seconds</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {!result ? (
        <>
          {/* Explainer */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-2">How content earns backlinks</h3>
            <p className="text-sm text-gray-600">
              We generate shareable, locally-focused content — then give you ready-to-send email templates to pitch it
              to local bloggers, the chamber of commerce, and news sites. Each time they link to your content,
              Google sees it as a vote of confidence and ranks you higher.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: FileText, label: 'Content piece', desc: 'Locally optimised, designed to rank AND get shared' },
                { icon: Users,    label: 'Share targets',  desc: '5 specific places to post it with how-to instructions' },
                { icon: Globe,    label: 'Outreach emails', desc: '3 ready-to-send email templates for link building' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-emerald-100">
                  <Icon className="w-4 h-4 text-emerald-600 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Content type</p>
            <div className="grid grid-cols-1 gap-2">
              {CONTENT_TYPES.map(t => (
                <button key={t.id} onClick={() => setContentType(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    contentType === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${contentType === t.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && contentType && topic.trim() && generate()}
              placeholder="e.g. How much does HVAC repair cost in Dallas?"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <button onClick={generate} disabled={!contentType || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <TrendingUp className="w-4 h-4" />
            Generate Content + Outreach Templates
          </button>

          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Previously generated</p>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setTopic(h.topic)}
                    className="w-full text-left text-xs text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span className="truncate">{h.title || h.topic}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{result.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {result.estimatedLinks && <><Star className="w-3 h-3 inline mr-1 text-amber-400" />{result.estimatedLinks} · </>}
                {result.timeToResults && <><Clock className="w-3 h-3 inline mr-1 text-gray-400" />{result.timeToResults}</>}
              </p>
            </div>
            <button onClick={() => setResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600 underline shrink-0">← New piece</button>
          </div>

          {/* Content piece */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button onClick={() => toggleSection('content')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Content Piece
              </span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); copyContent(); }}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${copiedContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                  {copiedContent ? 'Copied!' : 'Copy'}
                </button>
                {expandedSection === 'content' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>
            {expandedSection === 'content' && result.contentPiece && (
              <div className="border-t border-gray-100 p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {result.contentPiece.targetKeywords?.map(k => (
                    <span key={k} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto text-sm"
                  dangerouslySetInnerHTML={{ __html: `<h2>${result.contentPiece.headline}</h2><p><em>${result.contentPiece.subheadline}</em></p>${result.contentPiece.body}<p>${result.contentPiece.cta}</p>` }} />
                <p className="text-xs text-gray-400">Suggested URL: <code className="bg-gray-100 px-1.5 rounded">/{result.contentPiece.suggestedSlug}</code></p>
              </div>
            )}
          </div>

          {/* Share targets */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button onClick={() => toggleSection('share')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" /> Where to Share It ({result.shareTargets?.length || 0} places)
              </span>
              {expandedSection === 'share' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSection === 'share' && result.shareTargets && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {result.shareTargets.map((t, i) => (
                  <div key={i} className="px-5 py-3">
                    <p className="text-sm font-semibold text-gray-900">{t.type}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{t.where}</p>
                    <p className="text-xs text-gray-600 mt-1">{t.how}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outreach templates */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button onClick={() => toggleSection('outreach')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" /> Outreach Email Templates (3)
              </span>
              {expandedSection === 'outreach' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSection === 'outreach' && result.outreachTemplates && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                <div className="flex gap-2">
                  {Object.keys(result.outreachTemplates).map(k => (
                    <button key={k} onClick={() => setActiveTemplate(k)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                        activeTemplate === k ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}>
                      {k === 'localBlogger' ? 'Local Blogger' : k === 'chamberOfCommerce' ? 'Chamber' : 'Local News'}
                    </button>
                  ))}
                </div>
                {result.outreachTemplates[activeTemplate] && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Subject:</p>
                        <p className="text-sm font-medium text-gray-800">{result.outreachTemplates[activeTemplate].subject}</p>
                      </div>
                      <button onClick={copyTemplate}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copiedTemplate ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'}`}>
                        {copiedTemplate ? <><CheckCircle className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
                      </button>
                    </div>
                    <pre className="text-xs font-sans text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {result.outreachTemplates[activeTemplate].body}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const TABS = [
  { id: 'directories', label: 'Directory Submissions', icon: Globe,       desc: '25+ directories' },
  { id: 'citations',   label: 'Citation Checker',       icon: AlertTriangle, desc: 'NAP consistency' },
  { id: 'content',     label: 'Content & Backlinks',    icon: TrendingUp,  desc: 'Earn local links' },
];

export default function BacklinksPage({ apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('directories');

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Backlinks & Citations</h2>
        <p className="text-gray-500 mt-1">Build your local SEO authority — more citations and backlinks means higher Google rankings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              activeTab === t.id
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'directories' && <DirectoryTab apiUrl={apiUrl} authFetch={authFetch} />}
        {activeTab === 'citations'   && <CitationTab  apiUrl={apiUrl} authFetch={authFetch} />}
        {activeTab === 'content'     && <ContentTab   apiUrl={apiUrl} authFetch={authFetch} />}
      </div>
    </div>
  );
}
