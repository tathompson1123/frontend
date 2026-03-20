import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Star, Trash2, RefreshCw } from 'lucide-react';

const processorInfo = {
  stripe: { name: 'Stripe', color: 'bg-indigo-50 border-indigo-200', icon: '💳', description: 'Accept credit cards, debit cards, and ACH bank transfers', signupNote: 'Click Connect to create your free Stripe account' },
  square: { name: 'Square', color: 'bg-green-50 border-green-200', icon: '🟩', description: 'In-person and online payments with Square', signupUrl: 'https://squareup.com/signup', signupNote: "Don't have a Square account?" },
  clover: { name: 'Clover', color: 'bg-emerald-50 border-emerald-200', icon: '🍀', description: 'Accept payments with Clover POS and online checkout', signupUrl: 'https://www.clover.com/signup', signupNote: "Don't have a Clover account?" },
};

export default function PaymentSettings({ apiUrl, user, authFetch, justConnected }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(justConnected || null);

  useEffect(() => {
    fetchConnections();
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
    } catch (err) { console.error(err); }
  };

  const handleDisconnect = async (connectionId, processorName) => {
    if (!confirm(`Disconnect ${processorName}? This will remove all synced transactions and invoices from ${processorName}. You won't be able to accept payments through this processor until reconnected.`)) return;
    try {
      await authFetch(`${apiUrl}/api/payment-connections/${connectionId}`, { method: 'DELETE' });
      fetchConnections();
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
            {processorInfo[successBanner]?.name || successBanner} connected successfully! You can now accept payments through {processorInfo[successBanner]?.name || successBanner}.
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
              const info = processorInfo[conn.processor];
              return (
                <div key={conn.id} className={`rounded-xl p-6 border-2 ${info.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{info.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900">{info.name}</h4>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          {conn.is_primary && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Primary</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Connected {new Date(conn.connected_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!conn.is_primary && (
                        <button onClick={() => handleSetPrimary(conn.id)} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                          <Star className="w-4 h-4" /> Set Primary
                        </button>
                      )}
                      <button onClick={() => handleVerify(conn.id)} disabled={verifying === conn.id}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${verifying === conn.id ? 'animate-spin' : ''}`} /> Verify
                      </button>
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
