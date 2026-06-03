import { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Plus, Share2, Trash2, ExternalLink, RefreshCw, Loader,
  CheckCircle, AlertCircle, Link2, DollarSign, Users, TrendingUp, X,
} from 'lucide-react';
import PayrollPanel from './PayrollPanel';

const fmt$ = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Monday of the week containing `d` (Date) as YYYY-MM-DD.
function mondayOf(d = new Date()) {
  const day = (d.getDay() + 6) % 7;
  const m = new Date(d);
  m.setDate(d.getDate() - day);
  return m.toISOString().slice(0, 10);
}

export default function GoogleDriveTab({ apiUrl, authFetch }) {
  const [status, setStatus] = useState(null); // { connected, configured, email }
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newKind, setNewKind] = useState('tips');
  const [creating, setCreating] = useState(false);

  const [importUrl, setImportUrl] = useState('');
  const [importKind, setImportKind] = useState('tips');
  const [importing, setImporting] = useState(false);

  const [shareFor, setShareFor] = useState(null); // sheet id being shared
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  const [weekStart, setWeekStart] = useState(mondayOf());
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStatus = () =>
    authFetch(`${apiUrl}/api/google-drive/status`).then(r => r.json()).then(setStatus).catch(() => setStatus({ connected: false }));
  const loadSheets = () =>
    authFetch(`${apiUrl}/api/google-drive/sheets`).then(r => r.json()).then(d => setSheets(d.sheets || [])).catch(() => setSheets([]));

  useEffect(() => {
    // Surface the OAuth round-trip result if we just came back from Google.
    const params = new URLSearchParams(window.location.search);
    if (params.get('gdrive') === 'success') showToast('Google account connected');
    else if (params.get('gdrive') === 'error') showToast('Could not connect Google account', 'error');
    if (params.get('gdrive')) window.history.replaceState({}, '', window.location.pathname);

    Promise.all([loadStatus(), loadSheets()]).finally(() => setLoading(false));
  }, []);

  // Pull the weekly summary whenever connected or the week changes.
  useEffect(() => {
    if (!status?.connected) return;
    setSummaryLoading(true);
    authFetch(`${apiUrl}/api/google-drive/summary?weekStart=${weekStart}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setSummary(d); })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [status?.connected, weekStart]);

  const connect = async () => {
    try {
      const r = await authFetch(`${apiUrl}/api/google-drive/auth`);
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else showToast(d.error || 'Google Drive is not configured yet', 'error');
    } catch {
      showToast('Could not start Google sign-in', 'error');
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect your Google account? Existing sheets stay in your Drive.')) return;
    await authFetch(`${apiUrl}/api/google-drive/disconnect`, { method: 'POST' });
    setStatus({ ...status, connected: false, email: null });
    setSummary(null);
    showToast('Google account disconnected');
  };

  const createSheet = async () => {
    const title = newTitle.trim() || (newKind === 'tips' ? 'Detailer Tips' : newKind === 'payroll' ? 'Payroll' : 'New Sheet');
    setCreating(true);
    try {
      const r = await authFetch(`${apiUrl}/api/google-drive/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, kind: newKind }),
      });
      const d = await r.json();
      if (d.success) {
        setSheets(s => [d.sheet, ...s]);
        setNewTitle('');
        showToast(`Created "${d.sheet.title}"`);
        // Refresh summary in case this is the new tips/payroll source.
        setWeekStart(w => w);
      } else {
        showToast(d.error || 'Could not create sheet', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const importSheet = async () => {
    if (!importUrl.trim()) { showToast('Paste your Google Sheet link', 'error'); return; }
    setImporting(true);
    try {
      const r = await authFetch(`${apiUrl}/api/google-drive/sheets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), kind: importKind }),
      });
      const d = await r.json();
      if (d.success) {
        setSheets(s => [d.sheet, ...s.filter(x => x.id !== d.sheet.id)]);
        setImportUrl('');
        showToast(d.updated ? `Updated "${d.sheet.title}"` : `Imported "${d.sheet.title}"`);
        setWeekStart(w => w); // refresh summary
      } else {
        showToast(d.error || 'Could not import sheet', 'error');
      }
    } finally {
      setImporting(false);
    }
  };

  const share = async (sheetId) => {
    if (!shareEmail.trim()) return;
    setSharing(true);
    try {
      const r = await authFetch(`${apiUrl}/api/google-drive/sheets/${sheetId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`Shared with ${d.sharedWith}`);
        setShareFor(null);
        setShareEmail('');
      } else {
        showToast(d.error || 'Could not share', 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const removeSheet = async (sheetId, title) => {
    if (!confirm(`Remove "${title}" from SORCE? The sheet stays in your Google Drive.`)) return;
    const r = await authFetch(`${apiUrl}/api/google-drive/sheets/${sheetId}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      setSheets(s => s.filter(x => x.id !== sheetId));
      showToast('Removed from SORCE');
    }
  };

  const KIND_BADGE = {
    tips: { label: 'Tips', cls: 'bg-green-100 text-green-700' },
    payroll: { label: 'Payroll', cls: 'bg-purple-100 text-purple-700' },
    general: { label: 'Sheet', cls: 'bg-gray-100 text-gray-600' },
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header / connection */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tips & Payroll Sheets</h3>
              <p className="text-sm text-gray-500">
                Create Google Sheets in your Drive, share them with your team, and SORCE adds up the numbers for you.
              </p>
            </div>
          </div>
          {status?.connected ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                <CheckCircle className="w-4 h-4" /> {status.email || 'Connected'}
              </span>
              <button onClick={disconnect} className="text-xs text-gray-400 hover:text-red-600 underline">Disconnect</button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={status && !status.configured}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <Link2 className="w-4 h-4" />
              Connect Google
            </button>
          )}
        </div>
        {status && !status.configured && (
          <div className="mt-3 flex items-start gap-2 text-amber-800 text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Google Drive isn't configured on the server yet (needs the Drive + Sheets API enabled and OAuth credentials).
          </div>
        )}
      </div>

      {status?.connected && (
        <>
          {/* Weekly summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> This Week</h4>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Week of</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={e => setWeekStart(mondayOf(new Date(e.target.value + 'T12:00:00')))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={() => setWeekStart(w => w)} className="p-1.5 text-gray-400 hover:text-gray-700" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {summaryLoading && !summary ? (
              <div className="py-6 flex justify-center"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : summary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tips */}
                <div className="rounded-xl border border-gray-100 bg-green-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 uppercase tracking-wide mb-1"><DollarSign className="w-3.5 h-3.5" /> Tips total</div>
                  <p className="text-2xl font-bold text-gray-900">{fmt$(summary.tips.total)}</p>
                  {summary.tips.sheet ? (
                    <div className="mt-2 space-y-0.5">
                      {Object.entries(summary.tips.byDetailer).slice(0, 6).map(([name, amt]) => (
                        <div key={name} className="flex justify-between text-xs text-gray-600"><span className="truncate">{name}</span><span className="font-medium">{fmt$(amt)}</span></div>
                      ))}
                      {Object.keys(summary.tips.byDetailer).length === 0 && <p className="text-xs text-gray-400">No tips entered for this week yet.</p>}
                    </div>
                  ) : <p className="text-xs text-gray-400 mt-1">Create a Tips sheet below to track these.</p>}
                </div>

                {/* Payroll */}
                <div className="rounded-xl border border-gray-100 bg-purple-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1"><Users className="w-3.5 h-3.5" /> Payroll total</div>
                  <p className="text-2xl font-bold text-gray-900">{fmt$(summary.payroll.total)}</p>
                  {summary.payroll.sheet ? (
                    <div className="mt-2 space-y-0.5">
                      {Object.entries(summary.payroll.byEmployee).slice(0, 6).map(([name, amt]) => (
                        <div key={name} className="flex justify-between text-xs text-gray-600"><span className="truncate">{name}</span><span className="font-medium">{fmt$(amt)}</span></div>
                      ))}
                      {Object.keys(summary.payroll.byEmployee).length === 0 && <p className="text-xs text-gray-400">No payroll entered for this week yet.</p>}
                    </div>
                  ) : <p className="text-xs text-gray-400 mt-1">Create a Payroll sheet below to track these.</p>}
                </div>

                {/* Revenue compare */}
                <div className="rounded-xl border border-gray-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1"><TrendingUp className="w-3.5 h-3.5" /> Revenue (Square)</div>
                  <p className="text-2xl font-bold text-gray-900">{fmt$(summary.revenue)}</p>
                  {summary.payrollPctOfRevenue != null ? (
                    <p className="text-xs mt-2 text-gray-600">
                      Payroll is <span className={`font-bold ${summary.payrollPctOfRevenue > 40 ? 'text-red-600' : 'text-gray-900'}`}>{summary.payrollPctOfRevenue}%</span> of Square revenue this week.
                    </p>
                  ) : <p className="text-xs text-gray-400 mt-2">No Square transactions this week to compare against.</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No data yet.</p>
            )}
          </div>

          {/* Create a sheet */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 mb-3">Create a sheet</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newKind}
                onChange={e => setNewKind(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm sm:w-44"
              >
                <option value="tips">Tips (auto-summed)</option>
                <option value="payroll">Payroll</option>
                <option value="general">Blank sheet</option>
              </select>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createSheet(); }}
                placeholder={newKind === 'tips' ? 'e.g. Detailer Tips — June' : newKind === 'payroll' ? 'e.g. Payroll — June' : 'Sheet title'}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button
                onClick={createSheet}
                disabled={creating}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Tips sheets use columns <strong>Date · Detailer · Tip Amount · Notes</strong>; payroll uses <strong>Week Starting · Employee · Hours · Pay Amount · Notes</strong>. SORCE reads those columns for the summary above.
            </p>
          </div>

          {/* Import an existing sheet */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 mb-1">Import a sheet you already made</h4>
            <p className="text-xs text-gray-500 mb-3">
              Paste the link to one of your existing Google Sheets and tell SORCE whether it's tips or payroll. Make sure you're signed in with the Google account that owns it.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={importKind}
                onChange={e => setImportKind(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm sm:w-44"
              >
                <option value="tips">Tips (auto-summed)</option>
                <option value="payroll">Payroll</option>
                <option value="general">Other</option>
              </select>
              <input
                type="url"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') importSheet(); }}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={importSheet}
                disabled={importing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Import
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Importing existing sheets needs an extra permission. If it fails, click <strong>Disconnect</strong> above and <strong>Connect Google</strong> again to grant it.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              For the auto-sum to work, the imported sheet's first tab should follow the same columns shown above.
            </p>
          </div>

          {/* Sheet list */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h4 className="font-bold text-gray-900 mb-3">Your sheets</h4>
            {sheets.length === 0 ? (
              <p className="text-sm text-gray-400">No sheets yet — create one above.</p>
            ) : (
              <div className="space-y-2">
                {sheets.map(s => {
                  const badge = KIND_BADGE[s.kind] || KIND_BADGE.general;
                  return (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                            {s.imported && <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Imported</span>}
                          </div>
                          <p className="text-[11px] text-gray-400">{s.imported ? 'Imported' : 'Created'} {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={s.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Open in Google Sheets"><ExternalLink className="w-4 h-4" /></a>
                          {!s.imported && (
                            <button onClick={() => { setShareFor(shareFor === s.id ? null : s.id); setShareEmail(''); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Share"><Share2 className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => removeSheet(s.id, s.title)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove from SORCE"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {shareFor === s.id && (
                        <div className="mt-3 flex gap-2 items-center border-t border-gray-100 pt-3">
                          <input
                            type="email"
                            value={shareEmail}
                            onChange={e => setShareEmail(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') share(s.id); }}
                            placeholder="teammate@email.com"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                            autoFocus
                          />
                          <button onClick={() => share(s.id)} disabled={sharing || !shareEmail.trim()} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                            {sharing ? <Loader className="w-4 h-4 animate-spin" /> : 'Share'}
                          </button>
                          <button onClick={() => setShareFor(null)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Native payroll & efficiency — works whether or not Google is connected */}
      <PayrollPanel apiUrl={apiUrl} authFetch={authFetch} />
    </div>
  );
}
