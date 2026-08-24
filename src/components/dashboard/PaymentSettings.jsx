import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Star, Trash2, RefreshCw } from 'lucide-react';

// `drafts` = can this processor accept a draft invoice created from a booking?
// Clover is false because Clover removed its public invoicing API — there is no
// endpoint to create an invoice in a Clover account, so the button can't work there.
const processorInfo = {
  stripe: { name: 'Stripe', color: 'bg-indigo-50 border-indigo-200', icon: '💳', description: 'Accept credit cards, debit cards, and ACH bank transfers', signupNote: 'Click Connect to create your free Stripe account', drafts: true },
  square: { name: 'Square', color: 'bg-green-50 border-green-200', icon: '🟩', description: 'In-person and online payments with Square', signupUrl: 'https://squareup.com/signup', signupNote: "Don't have a Square account?", drafts: true },
  clover: { name: 'Clover', color: 'bg-emerald-50 border-emerald-200', icon: '🍀', description: 'Accept payments with Clover POS and online checkout', signupUrl: 'https://www.clover.com/signup', signupNote: "Don't have a Clover account?", drafts: false },
  paypal: { name: 'PayPal', color: 'bg-sky-50 border-sky-200', icon: '🅿️', description: 'Accept PayPal and card payments, and send PayPal invoices', signupUrl: 'https://www.paypal.com/bizsignup', signupNote: "Don't have a PayPal business account?", drafts: true },
  quickbooks: { name: 'QuickBooks', color: 'bg-lime-50 border-lime-200', icon: '📗', description: 'Accounting only — draft invoices land in QuickBooks for review. Does not take payments.', signupUrl: 'https://quickbooks.intuit.com/signup', signupNote: "Don't have a QuickBooks account?", drafts: true, accountingOnly: true },
};

export default function PaymentSettings({ apiUrl, user, authFetch, justConnected, onConnectionChange }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(justConnected || null);
  // Auto-draft: whether a booking taken on the dashboard pushes a draft invoice into
  // the primary connected processor. Lives on the user, not the connection, so it
  // survives swapping processors.
  const [draftTargets, setDraftTargets] = useState({ capable: [], autoDraft: true, autoDraftProcessor: null });
  const [savingAutoDraft, setSavingAutoDraft] = useState(false);

  useEffect(() => {
    fetchConnections();
    fetchDraftTargets();
  }, []);

  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => setSuccessBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  const fetchConnections = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/payment-connections`);
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDraftTargets = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/draft-targets`);
      const data = await res.json();
      setDraftTargets({
        capable: data.capable || [],
        autoDraft: data.autoDraft !== false,
        autoDraftProcessor: data.autoDraftProcessor || null,
      });
    } catch (err) { console.error(err); }
  };

  // Optimistic, then reconciled from the response — a toggle that lags a round-trip
  // reads as broken and invites a second click.
  const handleToggleAutoDraft = async () => {
    const next = !draftTargets.autoDraft;
    setDraftTargets(prev => ({ ...prev, autoDraft: next }));
    setSavingAutoDraft(true);
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/auto-draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setDraftTargets(prev => ({ ...prev, autoDraft: data.autoDraft !== false }));
    } catch (err) {
      console.error(err);
      setDraftTargets(prev => ({ ...prev, autoDraft: !next }));
      setConnectError('Could not save the auto-draft setting. Please try again.');
    } finally {
      setSavingAutoDraft(false);
    }
  };

  const handleConnect = async (processor) => {
    setConnecting(processor);
    setConnectError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/payment-connections/${processor}/oauth-url`);
      const data = await res.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      } else {
        setConnectError(data.error || `Could not generate ${processor} OAuth URL. Check that your API keys are configured in the server settings.`);
      }
    } catch (err) {
      console.error(err);
      setConnectError(`Failed to connect to ${processor}. Please try again.`);
    } finally {
      setConnecting(null);
    }
  };

  const handleSetPrimary = async (connectionId) => {
    try {
      await authFetch(`${apiUrl}/api/payment-connections/${connectionId}/primary`, { method: 'PUT' });
      fetchConnections();
      fetchDraftTargets();
    } catch (err) { console.error(err); }
  };

  const handleDisconnect = async (connectionId, processorName) => {
    if (!confirm(`Disconnect ${processorName}? This will remove all synced transactions and invoices from ${processorName}. You won't be able to accept payments through this processor until reconnected.`)) return;
    try {
      await authFetch(`${apiUrl}/api/payment-connections/${connectionId}`, { method: 'DELETE' });
      fetchConnections();
      fetchDraftTargets();
      if (onConnectionChange) onConnectionChange();
    } catch (err) { console.error(err); }
  };

  const handleVerify = async (connectionId) => {
    setVerifying(connectionId);
    try {
      const res = await authFetch(`${apiUrl}/api/payment-connections/${connectionId}/verify`, { method: 'POST' });
      const data = await res.json();
      alert(data.valid ? `Connection verified: ${data.accountName || 'OK'}` : `Connection issue: ${data.error}`);
      fetchConnections();
    } catch (err) { console.error(err); }
    finally { setVerifying(null); }
  };

  const connectedProcessors = connections.map(c => c.processor);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" /></div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Payment Settings</h2>
        <p className="text-gray-600 mt-1">Connect payment processors to accept payments from customers</p>
      </div>

      {/* Error Banner */}
      {connectError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium">{connectError}</p>
          <button onClick={() => setConnectError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successBanner && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">
            {processorInfo[successBanner]?.name || successBanner} connected successfully!{' '}
            {processorInfo[successBanner]?.accountingOnly
              ? `Draft invoices from a booking can now be sent to ${processorInfo[successBanner].name} for review.`
              : `You can now accept payments through ${processorInfo[successBanner]?.name || successBanner}.`}
          </p>
          <button onClick={() => setSuccessBanner(null)} className="ml-auto text-green-500 hover:text-green-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected Processors */}
      {connections.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Processors</h3>
          <div className="grid gap-4">
            {connections.map(conn => {
              // Fall back rather than crash on a processor we don't have copy for —
              // this list is whatever is in the DB, which may outlive the UI map.
              const info = processorInfo[conn.processor] || {
                name: conn.processor, color: 'bg-gray-50 border-gray-200', icon: '💠', drafts: false,
              };
              return (
                <div key={conn.id} className={`rounded-xl p-6 border-2 ${info.color}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{info.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-bold text-gray-900">{info.name}</h4>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          {conn.is_primary && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Primary</span>
                          )}
                          {info.accountingOnly && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">Invoicing only</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Connected {new Date(conn.connected_at).toLocaleDateString()}</p>
                        {info.drafts === false && (
                          <p className="text-xs text-gray-600 mt-1 max-w-md">
                            {info.name} has no invoicing API, so “Draft Invoice” on a booking can’t create one here.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Primary and Verify are payment-processor concepts. QuickBooks
                          takes no payments, and its verify path has no processor class
                          behind it, so both are hidden for accounting-only connections. */}
                      {!conn.is_primary && !info.accountingOnly && (
                        <button onClick={() => handleSetPrimary(conn.id)} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                          <Star className="w-4 h-4" /> Set Primary
                        </button>
                      )}
                      {!info.accountingOnly && (
                        <button onClick={() => handleVerify(conn.id)} disabled={verifying === conn.id}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50">
                          <RefreshCw className={`w-4 h-4 ${verifying === conn.id ? 'animate-spin' : ''}`} /> Verify
                        </button>
                      )}
                      <button onClick={() => handleDisconnect(conn.id, info.name)}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                        <Trash2 className="w-4 h-4" /> Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-draft. Only meaningful once something that can hold a draft is
          connected — Clover-only and unconnected users get nothing here. */}
      {draftTargets.capable.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoicing</h3>
          <div className="rounded-xl p-6 border-2 border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1">
                  Auto-draft an invoice for every booking
                </h4>
                <p className="text-sm text-gray-600 max-w-xl">
                  Whenever a booking is created — here, in the employee app, or from your
                  website — a matching{' '}
                  <span className="font-semibold">draft</span> invoice is created in{' '}
                  <span className="font-semibold">
                    {processorInfo[draftTargets.autoDraftProcessor]?.name || draftTargets.autoDraftProcessor}
                  </span>
                  , ready for you to review. Nothing is emailed to the customer until you
                  send it from there.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Drafts go to your primary connected processor. Turn this off to create them
                  by hand from each booking instead.
                </p>
              </div>
              {/* Native checkbox behind a switch: keeps it keyboard- and
                  screen-reader-operable without wiring ARIA by hand. */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={draftTargets.autoDraft}
                  onChange={handleToggleAutoDraft}
                  disabled={savingAutoDraft}
                />
                <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-amber-600 peer-focus:ring-2 peer-focus:ring-amber-300 peer-disabled:opacity-60 transition-colors" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Available Processors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {connections.length > 0 ? 'Add Another Processor' : 'Connect a Payment Processor'}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(processorInfo).map(([key, info]) => {
            const isConnected = connectedProcessors.includes(key);
            return (
              <div key={key} className={`rounded-xl p-6 border-2 ${isConnected ? 'border-green-200 bg-green-50 opacity-60' : 'border-gray-200 bg-white hover:border-amber-300'} transition`}>
                <span className="text-4xl mb-3 block">{info.icon}</span>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{info.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{info.description}</p>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <CheckCircle className="w-4 h-4" /> Connected
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleConnect(key)} disabled={connecting === key}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold text-sm disabled:opacity-60">
                      {connecting === key
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</>
                        : <><ExternalLink className="w-4 h-4" /> Connect {info.name}</>}
                    </button>
                    {info.signupNote && (
                      <p className="text-xs text-gray-400 text-center mt-2">
                        {info.signupUrl ? (
                          <>{info.signupNote}{' '}
                            <a href={info.signupUrl} target="_blank" rel="noopener noreferrer"
                              className="text-amber-600 hover:text-amber-700 font-semibold underline">
                              Create one free
                            </a>
                          </>
                        ) : (
                          info.signupNote
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
