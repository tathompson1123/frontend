import { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Clock, MessageCircle, TrendingUp, Save, Rocket, Crown, Brain, Copy, Check, ExternalLink, ChevronRight, ChevronLeft, Zap, ArrowRight, X, AlertCircle } from 'lucide-react';

const STEPS = [
  { label: 'How It Works' },
  { label: 'Your Number'  },
  { label: 'Train Agent'  },
  { label: 'Deploy'       },
  { label: 'Stats'        },
];

export default function MissedCallTextBack({ user, apiUrl, authFetch, setCurrentView, isDeployed, onDeploymentChange, onDirtyChange }) {
  const [step, setStep] = useState(0);

  const [config, setConfig] = useState({
    enabled: false,
    smsEnabled: true,
    ringToNumber: '',
    ringTimeout: 20,
    delayMin: 30,
    delayMax: 60,
    training: { responseTone: 'friendly', agentName: '', businessContext: '', servicesInfo: '' }
  });
  const [smsTemplate, setSmsTemplate] = useState("Hey {{name}}, sorry we missed your call! How can we help you? Reply here and we'll get right back to you.");
  const [useLeadTraining, setUseLeadTraining] = useState(false);
  const [leadTrainingPreview, setLeadTrainingPreview] = useState(null); // null = not fetched, false = fetching, object = loaded

  const [stats, setStats]           = useState({ totalCalls: 0, missedCalls: 0, textsSent: 0, replies: 0 });
  const [missedCalls, setMissedCalls]         = useState([]);
  const [missedCallsTotal, setMissedCallsTotal] = useState(0);
  const [missedCallsPage, setMissedCallsPage]   = useState(1);

  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isSaving, setIsSaving]       = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [agentNumCopied, setAgentNumCopied] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'error'|'success' }

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!apiUrl) return;
    loadConfig();
    loadStats();
    setPhoneNumber(user?.twilio_phone_number || null);
  }, [apiUrl, user]);


  const loadConfig = async () => {
    try {
      const [voiceRes, bizRes, svcRes] = await Promise.all([
        authFetch(`${apiUrl}/api/voice/config`),
        authFetch(`${apiUrl}/api/business-info`).catch(() => ({ ok: false })),
        authFetch(`${apiUrl}/api/services`).catch(() => ({ ok: false })),
      ]);

      const defaults = {
        enabled: false, smsEnabled: true, ringToNumber: '', ringTimeout: 20, delayMin: 30, delayMax: 60,
        training: { responseTone: 'friendly', agentName: '', businessContext: '', servicesInfo: '' }
      };

      let savedConfig = defaults;
      if (voiceRes.ok) {
        const data = await voiceRes.json();
        savedConfig = data.config || defaults;
        if (data.smsTemplate) setSmsTemplate(data.smsTemplate);
      }

      const training = savedConfig.training || defaults.training;
      if (!training.businessContext) {
        const bizData = bizRes.ok ? await bizRes.json() : {};
        const bizInfo = bizData.businessInfo || {};
        const businessName = user?.business_name || user?.businessName || '';
        training.businessContext = [businessName, bizInfo.city, bizInfo.state].filter(Boolean).join(', ');
      }
      if (!training.servicesInfo && svcRes.ok) {
        const svcData = await svcRes.json();
        const services = (svcData.services || []).filter(s => !s.is_addon);
        if (services.length > 0) {
          training.servicesInfo = services.map(s => `${s.name}${s.price ? ` - $${s.price}` : ''}`).join('\n');
        }
      }

      const finalConfig = { ...savedConfig, training };
      setConfig(finalConfig);
      // Only default to stats if already fully deployed
      if (finalConfig.enabled) setStep(4);
    } catch (err) {
      console.error('Error loading voice config:', err);
    }
  };

  const loadLeadTrainingPreview = async () => {
    setLeadTrainingPreview(false); // fetching
    try {
      const res = await authFetch(`${apiUrl}/api/agents/lead-form/training`);
      if (res.ok) {
        const data = await res.json();
        setLeadTrainingPreview(data && Object.keys(data).length ? data : null);
      } else {
        setLeadTrainingPreview(null);
      }
    } catch {
      setLeadTrainingPreview(null);
    }
  };

  const loadStats = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/voice/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const loadMissedCalls = async (page = 1) => {
    try {
      const res = await authFetch(`${apiUrl}/api/voice/missed-calls?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setMissedCalls(data.missedCalls);
        setMissedCallsTotal(data.total);
        setMissedCallsPage(page);
      }
    } catch {}
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`${apiUrl}/api/voice/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, smsTemplate })
      });
      if (!res.ok) showToast('Failed to save configuration');
    } catch { showToast('Failed to save configuration'); }
    finally { setIsSaving(false); }
  };

  const deployAgent = async () => {
    if (!config.ringToNumber) { showToast('Enter the phone number where calls should ring.'); return; }
    if (!phoneNumber) { showToast('No SMS Agent Number found. Deploy the Lead Form Agent first.'); return; }
    setIsDeploying(true);
    try {
      const trainingData = useLeadTraining && leadTrainingPreview ? leadTrainingPreview : config.training;
      const res = await authFetch(`${apiUrl}/api/voice/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ringToNumber: config.ringToNumber,
          ringTimeout: config.ringTimeout,
          delayMin: config.delayMin,
          delayMax: config.delayMax,
          smsTemplate,
          training: trainingData
        })
      });
      if (res.ok) {
        setConfig(c => ({ ...c, enabled: true }));
        onDeploymentChange();
        setStep(4);
        loadStats();
      } else {
        const err = await res.json();
        showToast('Failed to deploy: ' + (err.error || 'Unknown error'));
      }
    } catch (err) { showToast('Failed to deploy: ' + err.message); }
    finally { setIsDeploying(false); }
  };

  const undeployAgent = async () => {
    setConfirmDisable(false);
    try {
      const res = await authFetch(`${apiUrl}/api/voice/undeploy`, { method: 'POST' });
      if (res.ok) {
        setConfig(c => ({ ...c, enabled: false }));
        onDeploymentChange();
        setStep(3);
      } else {
        showToast('Failed to disable agent');
      }
    } catch { showToast('Failed to disable agent'); }
  };

  const copyAgentNumber = () => {
    navigator.clipboard.writeText(phoneNumber);
    setAgentNumCopied(true);
    setTimeout(() => setAgentNumCopied(false), 2000);
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Unknown';
    if (phone.length === 12 && phone.startsWith('+1')) return `(${phone.slice(2,5)}) ${phone.slice(5,8)}-${phone.slice(8)}`;
    return phone;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const goTo = (i) => {
    // Stats is always accessible if deployed; other steps always accessible
    setStep(i);
    if (i === 4) loadStats();
    if (i === 4 && missedCalls.length === 0) loadMissedCalls();
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header — compact inline row */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow shadow-purple-200 flex-shrink-0">
          <PhoneOff className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">Missed Call Text-Back</h2>
          <p className="text-xs text-gray-500">Auto-text anyone who calls and you miss</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-center gap-1 flex-shrink-0">
        {STEPS.map((s, i) => {
          const isActive    = i === step;
          const isCompleted = config.enabled ? i < 4 : i < step;
          const isClickable = config.enabled || i <= step;
          return (
            <div key={i} className="flex items-center gap-1">
              <button
                onClick={() => { if (isClickable) goTo(i); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive    ? 'bg-purple-600 text-white shadow-md'
                  : isCompleted ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted && !isActive ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className={`w-3.5 h-3.5 ${isCompleted ? 'text-purple-400' : 'text-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0 ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Step Content — flex-1 so it fills remaining height, internal scroll only */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-y-auto">

        {/* ── Step 0: How It Works ── */}
        {step === 0 && (
          <div className="p-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Never Lose a Lead to a Missed Call</h3>
                <p className="text-xs text-gray-500">SORCE texts back anyone who calls and you don't answer.</p>
              </div>
            </div>

            {/* SMS Agent Number */}
            <div className={`rounded-xl border-2 px-4 py-3 mb-4 ${phoneNumber ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Your SMS Agent Number</p>
                  <p className="text-xs text-gray-400">List this on Google Business & your website</p>
                </div>
                {phoneNumber ? (
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-green-700 tracking-wide">{phoneNumber}</p>
                    <button onClick={copyAgentNumber}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${agentNumCopied ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {agentNumCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-medium">Deploy Lead Form Agent first</p>
                )}
              </div>
              {phoneNumber && (
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
                  Open Google Business Profile <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Flow visual */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Phone className="w-4 h-4 text-blue-500" />
                <div><p className="text-xs font-semibold text-gray-800">Customer calls</p><p className="text-xs text-gray-400">Your listed number</p></div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                <Phone className="w-4 h-4 text-purple-500" />
                <div><p className="text-xs font-semibold text-gray-800">Rings your phone</p><p className="text-xs text-gray-400">You can answer</p></div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" /><p className="text-xs font-medium text-green-700">Answered — normal call</p>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-red-500" /><p className="text-xs font-medium text-red-600">Missed — auto text fires</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(1)} disabled={!phoneNumber}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-md shadow-purple-200 inline-flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Your Phone Number ── */}
        {step === 1 && (
          <div className="p-5 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Where Should Calls Ring?</h3>
                <p className="text-xs text-gray-500">We'll ring this number first. If unanswered, the text-back fires.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Phone Number</label>
                <input type="tel" value={config.ringToNumber || ''}
                  onChange={(e) => setConfig(c => ({ ...c, ringToNumber: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Your cell, office line, or any number you answer on.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ring for (sec)</label>
                  <input type="number" min="10" max="60" value={config.ringTimeout ?? 20}
                    onChange={(e) => setConfig(c => ({ ...c, ringTimeout: e.target.value }))}
                    onBlur={(e) => { const v = parseInt(e.target.value); setConfig(c => ({ ...c, ringTimeout: isNaN(v) ? 20 : v })); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Before counted as missed</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Text-back delay (sec)</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="10" max="120" value={config.delayMin ?? 30}
                      onChange={(e) => setConfig(c => ({ ...c, delayMin: e.target.value }))}
                      onBlur={(e) => { const v = parseInt(e.target.value); setConfig(c => ({ ...c, delayMin: isNaN(v) ? 30 : v })); }}
                      className="w-full px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input type="number" min="10" max="180" value={config.delayMax ?? 60}
                      onChange={(e) => setConfig(c => ({ ...c, delayMax: e.target.value }))}
                      onBlur={(e) => { const v = parseInt(e.target.value); setConfig(c => ({ ...c, delayMax: isNaN(v) ? 60 : v })); }}
                      className="w-full px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Feels more human</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-5">
              <button onClick={() => setStep(0)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition inline-flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => { saveConfig(); setStep(2); }} disabled={!config.ringToNumber}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-md shadow-purple-200 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Train Agent ── */}
        {step === 2 && (
          <div className="p-5 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Train Your Agent</h3>
                <p className="text-xs text-gray-500">Tell the agent about your business so it can have real conversations.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setUseLeadTraining(false)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${!useLeadTraining ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <Brain className={`w-5 h-5 flex-shrink-0 ${!useLeadTraining ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`text-xs font-semibold ${!useLeadTraining ? 'text-purple-700' : 'text-gray-600'}`}>Custom Training</p>
                  <p className="text-xs text-gray-400">Set up from scratch</p>
                </div>
              </button>
              <button onClick={() => { setUseLeadTraining(true); loadLeadTrainingPreview(); }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${useLeadTraining ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <Zap className={`w-5 h-5 flex-shrink-0 ${useLeadTraining ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`text-xs font-semibold ${useLeadTraining ? 'text-purple-700' : 'text-gray-600'}`}>Use Lead Agent</p>
                  <p className="text-xs text-gray-400">Reuse existing settings</p>
                </div>
              </button>
            </div>

            {useLeadTraining ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                {leadTrainingPreview === false ? (
                  <p className="text-xs text-gray-400 text-center py-2">Loading...</p>
                ) : leadTrainingPreview ? (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lead Agent Preview</p>
                    {leadTrainingPreview.agentName && <p className="text-xs text-gray-700"><span className="font-medium">Name:</span> {leadTrainingPreview.agentName}</p>}
                    {leadTrainingPreview.responseTone && <p className="text-xs text-gray-700"><span className="font-medium">Tone:</span> {leadTrainingPreview.responseTone}</p>}
                    {leadTrainingPreview.businessContext && <p className="text-xs text-gray-700"><span className="font-medium">Context:</span> {leadTrainingPreview.businessContext}</p>}
                    {leadTrainingPreview.servicesInfo && <p className="text-xs text-gray-700"><span className="font-medium">Services:</span> {leadTrainingPreview.servicesInfo}</p>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No Lead Agent training found. Set it up in the Lead Form Agent tab first.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Agent Name</label>
                    <input type="text" value={config.training?.agentName || ''}
                      onChange={(e) => setConfig(c => ({ ...c, training: { ...c.training, agentName: e.target.value } }))}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tone</label>
                    <select value={config.training?.responseTone || 'friendly'}
                      onChange={(e) => setConfig(c => ({ ...c, training: { ...c.training, responseTone: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm">
                      <option value="friendly">Friendly & Warm</option>
                      <option value="formal">Professional</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Context</label>
                  <textarea value={config.training?.businessContext || ''}
                    onChange={(e) => setConfig(c => ({ ...c, training: { ...c.training, businessContext: e.target.value } }))}
                    rows="2" placeholder="Brief description of your business..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Services</label>
                  <textarea value={config.training?.servicesInfo || ''}
                    onChange={(e) => setConfig(c => ({ ...c, training: { ...c.training, servicesInfo: e.target.value } }))}
                    rows="2" placeholder="Main services and pricing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">First Text Message</label>
                    <span className={`text-xs ${smsTemplate.length > 160 ? 'text-orange-500' : 'text-gray-400'}`}>{smsTemplate.length}/160</span>
                  </div>
                  <textarea value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)}
                    rows="2" maxLength="320"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{'{{name}}'} {'{{agentName}}'} {'{{businessName}}'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition inline-flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => { saveConfig(); setStep(3); }}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-md shadow-purple-200 inline-flex items-center gap-1.5">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Deploy ── */}
        {step === 3 && (
          <div className="p-5 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow shadow-purple-200">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ready to Deploy</h3>
                <p className="text-xs text-gray-500">Review and go live. You can change any of this later.</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-200 mb-4">
              {[
                ['SMS Agent Number', <span className="text-green-700 font-semibold text-sm">{phoneNumber || '—'}</span>],
                ['Rings to', config.ringToNumber || '—'],
                ['Ring timeout', `${config.ringTimeout || 20}s`],
                ['Text-back delay', `${config.delayMin || 30}–${config.delayMax || 60}s`],
                ['Training', useLeadTraining ? 'Lead Agent settings' : 'Custom'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            {!['pro', 'expert'].includes(user?.plan?.toLowerCase()) && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">Requires a <strong>Pro plan</strong> or higher.</p>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition inline-flex items-center gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {config.enabled ? (
                confirmDisable ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Disable agent?</span>
                    <button onClick={undeployAgent}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">
                      Yes, disable
                    </button>
                    <button onClick={() => setConfirmDisable(false)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDisable(true)}
                    className="px-7 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition inline-flex items-center gap-2">
                    <PhoneOff className="w-4 h-4" /> Disable Agent
                  </button>
                )
              ) : (
                <button onClick={deployAgent} disabled={isDeploying || !phoneNumber || !config.ringToNumber}
                  className="px-7 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg shadow-purple-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Rocket className="w-4 h-4" />
                  {isDeploying ? 'Deploying...' : 'Deploy Agent'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Stats ── */}
        {step === 4 && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Text-Back Performance</h3>
                <span className="text-xs text-gray-400">This month</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { icon: <Phone className="w-4 h-4" />, label: 'Total Calls', val: stats.totalCalls, color: 'blue' },
                { icon: <PhoneOff className="w-4 h-4" />, label: 'Missed', val: stats.missedCalls, color: 'red' },
                { icon: <MessageCircle className="w-4 h-4" />, label: 'Texts Sent', val: stats.textsSent, color: 'amber' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Replies', val: stats.replies, color: 'green', action: () => setCurrentView('customers-leads') },
              ].map(({ icon, label, val, color, action }) => (
                <div key={label} className={`bg-${color}-50 rounded-xl p-3`}>
                  <div className={`flex items-center gap-1.5 text-${color}-600 mb-1`}>{icon}<span className="text-xs font-medium">{label}</span></div>
                  <p className="text-2xl font-bold text-gray-900">{val}</p>
                  {action && <button onClick={action} className={`text-xs text-${color}-600 hover:text-${color}-700 font-medium mt-0.5`}>View →</button>}
                </div>
              ))}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Recent Calls</p>
                <button onClick={() => loadMissedCalls(1)} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Refresh</button>
              </div>
              {missedCalls.length === 0 ? (
                <div className="text-center py-6">
                  <PhoneOff className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
                  <p className="text-sm text-gray-400">No calls yet</p>
                  <p className="text-xs text-gray-300 mt-0.5">Make sure your SMS Agent Number is on Google Business</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {missedCalls.map((call, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${call.call_status === 'answered' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {call.call_status === 'answered' ? <Phone className="w-3.5 h-3.5 text-green-600" /> : <PhoneOff className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatPhone(call.caller_phone)}</p>
                            <p className="text-xs text-gray-400">{call.lead_name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatDate(call.created_at)}</p>
                          <span className={`text-xs font-medium ${call.call_status === 'answered' ? 'text-green-600' : 'text-red-500'}`}>
                            {call.call_status === 'answered' ? 'Answered' : 'Missed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {missedCallsTotal > 10 && (
                    <div className="flex justify-center gap-2 px-4 py-2.5 border-t border-gray-100">
                      <button onClick={() => loadMissedCalls(missedCallsPage - 1)} disabled={missedCallsPage === 1}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                      <span className="px-2.5 py-1 text-xs text-gray-400">Page {missedCallsPage}</span>
                      <button onClick={() => loadMissedCalls(missedCallsPage + 1)} disabled={missedCallsPage * 10 >= missedCallsTotal}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
