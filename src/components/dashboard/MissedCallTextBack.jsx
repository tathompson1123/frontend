import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Clock, MessageCircle, TrendingUp, Save, Rocket, Crown, ChevronDown, ChevronUp, Brain, Copy, Check } from 'lucide-react';

const CARRIERS = [
  { id: '',             name: 'Select your carrier...',    type: null           },
  // ── AT&T network ──
  { id: 'att',          name: 'AT&T',                      type: 'att'          },
  { id: 'cricket',      name: 'Cricket Wireless',          type: 'att'          },
  { id: 'consumer',     name: 'Consumer Cellular',         type: 'att'          },
  { id: 'boost',        name: 'Boost Mobile',              type: 'att'          },
  { id: 'firstnet',     name: 'FirstNet',                  type: 'att'          },
  // ── Verizon network ──
  { id: 'verizon',      name: 'Verizon',                   type: 'verizon'      },
  { id: 'visible',      name: 'Visible',                   type: 'verizon'      },
  { id: 'tracfone_vzw', name: 'TracFone (Verizon SIM)',    type: 'verizon'      },
  // ── T-Mobile network ──
  { id: 'tmobile',      name: 'T-Mobile',                  type: 'tmobile'      },
  { id: 'metro',        name: 'Metro by T-Mobile',         type: 'tmobile'      },
  { id: 'mint',         name: 'Mint Mobile',               type: 'tmobile'      },
  { id: 'googlefi',     name: 'Google Fi',                 type: 'tmobile'      },
  { id: 'sprint',       name: 'Sprint (legacy)',           type: 'tmobile'      },
  { id: 'tracfone_tmo', name: 'TracFone (T-Mobile SIM)',   type: 'tmobile'      },
  // ── Other ──
  { id: 'uscellular',   name: 'US Cellular',               type: 'uscellular'   },
  { id: 'straighttalk', name: 'Straight Talk',             type: 'straighttalk' },
  { id: 'landline',     name: 'Landline / VoIP',           type: 'landline'     },
  { id: 'other',        name: 'Other / Not Listed',        type: 'other'        },
];

// '__CODE__' is replaced with the forwarding code block inline
function getCarrierSteps(carrierId, smsAgentNumber) {
  const carrier = CARRIERS.find(c => c.id === carrierId);
  const type = carrier?.type;
  const num = (smsAgentNumber || '').replace(/\D/g, '');
  const e164 = num.length === 10 ? `+1${num}` : `+${num}`;
  const attCode    = { activate: `*61*${e164}#`,  cancel: `#61#`   };
  const tmoCode    = { activate: `**61*${e164}#`, cancel: `##61#`  };

  const dialSteps = (code) => ({
    steps: [
      'Open your <strong>phone</strong> and go to the dial pad',
      '__CODE__',
      'Tap the <strong>call button</strong> — you\'ll hear a confirmation tone',
      'That\'s it! Unanswered calls will now forward to your SMS Agent Number',
    ],
    code: code.activate,
    cancelNote: `To turn off forwarding, dial <strong>${code.cancel}</strong> and press call.`,
  });

  switch (type) {
    case 'att':
      return {
        note: 'This sets no-answer forwarding only — your phone still rings first as normal.',
        ...dialSteps(attCode),
      };
    case 'verizon':
      return {
        note: 'Verizon does not support dial-code forwarding. Use the My Verizon app instead.',
        steps: [
          'Open the <strong>My Verizon</strong> app on your phone',
          'Tap <strong>Account</strong> at the bottom, then select your line',
          'Tap <strong>Manage device</strong> > <strong>Call forwarding</strong>',
          'Under <strong>"When unanswered"</strong>, enter your SMS Agent Number',
          'Tap <strong>Save</strong>',
        ],
        code: null,
        cancelNote: 'To turn off forwarding, go back to Call Forwarding in My Verizon and remove the number.',
      };
    case 'tmobile':
      return {
        note: 'This sets no-answer forwarding only — your phone still rings first as normal.',
        ...dialSteps(tmoCode),
      };
    case 'uscellular':
      return {
        note: 'US Cellular uses standard GSM forwarding codes.',
        ...dialSteps(attCode),
      };
    case 'straighttalk':
      return {
        note: 'Straight Talk SIMs run on different networks. Try the AT&T code first — if it doesn\'t work, try the T-Mobile code.',
        steps: [
          'Open your <strong>phone</strong> and go to the dial pad',
          '__CODE__',
          'Tap the <strong>call button</strong>. If you hear an error tone, try the T-Mobile code instead: <strong>' + tmoCode.activate + '</strong>',
          'You\'ll hear a confirmation tone when it activates successfully',
        ],
        code: attCode.activate,
        cancelNote: `To turn off forwarding, try <strong>${attCode.cancel}</strong> or <strong>${tmoCode.cancel}</strong> and press call.`,
      };
    case 'landline':
      return {
        note: 'Steps vary by provider. Look for "No Answer Forwarding" or "Unanswered Call Forwarding" in your admin portal.',
        steps: [
          'Log in to your <strong>phone system admin portal</strong>',
          'Common providers: RingCentral, Google Voice, Grasshopper, 8x8, Nextiva, Vonage, OpenPhone',
          'Go to <strong>Settings</strong> > <strong>Call Handling</strong> or <strong>Call Forwarding</strong>',
          'Set the condition to <strong>"No Answer"</strong> or <strong>"Unanswered"</strong>',
          'Enter your SMS Agent Number as the forwarding destination',
          'Save and test by calling your number without answering',
        ],
        code: null,
        cancelNote: 'To turn off forwarding, return to the same setting in your admin portal and remove the forwarding number.',
      };
    default:
      return {
        steps: [
          'Search <strong>"[your carrier name] no answer call forwarding"</strong> for specific steps',
          'When asked for a forwarding number, enter your SMS Agent Number',
          'Choose <strong>"No answer"</strong> or <strong>"Unanswered"</strong> forwarding — not "All calls"',
          'Test it by calling your business number and letting it ring without answering',
        ],
        code: null,
        cancelNote: 'To turn off forwarding, search "[your carrier] cancel no answer call forwarding".',
      };
  }
}

export default function MissedCallTextBack({ user, apiUrl, authFetch, setCurrentView, isDeployed, onDeploymentChange, onDirtyChange }) {
  const [config, setConfig] = useState({
    enabled: false,
    smsEnabled: true,
    forwardingNumber: '',
    delayMin: 30,
    delayMax: 60,
    training: {
      responseTone: 'friendly',
      agentName: '',
      businessContext: '',
      servicesInfo: ''
    }
  });
  const [configSnapshot, setConfigSnapshot] = useState(null);
  const [templateSnapshot, setTemplateSnapshot] = useState(null);
  const [smsTemplate, setSmsTemplate] = useState(getDefaultTemplate());
  const [stats, setStats] = useState({ totalCalls: 0, missedCalls: 0, textsSent: 0, replies: 0 });
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedCallsTotal, setMissedCallsTotal] = useState(0);
  const [missedCallsPage, setMissedCallsPage] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [agentNumCopied, setAgentNumCopied] = useState(false);

  function getDefaultTemplate() {
    return "Hey {{name}}, sorry we missed your call! How can we help you? Reply here and we'll get right back to you.";
  }

  useEffect(() => {
    if (!apiUrl) return;
    loadConfig();
    loadStats();
    setPhoneNumber(user?.twilio_phone_number || null);
  }, [apiUrl, user]);

  useEffect(() => {
    if (configSnapshot && onDirtyChange) {
      const dirty = JSON.stringify(config) !== configSnapshot || smsTemplate !== templateSnapshot;
      onDirtyChange(dirty);
    }
  }, [config, smsTemplate, configSnapshot, templateSnapshot]);

  const loadConfig = async () => {
    try {
      const [voiceRes, bizRes, svcRes] = await Promise.all([
        authFetch(`${apiUrl}/api/voice/config`),
        authFetch(`${apiUrl}/api/business-info`).catch(() => ({ ok: false })),
        authFetch(`${apiUrl}/api/services`).catch(() => ({ ok: false })),
      ]);

      const defaults = {
        enabled: false, smsEnabled: true, forwardingNumber: '', delayMin: 30, delayMax: 60,
        training: { responseTone: 'friendly', agentName: '', businessContext: '', servicesInfo: '' }
      };

      let savedConfig = defaults;
      let loadedTemplate = getDefaultTemplate();
      if (voiceRes.ok) {
        const data = await voiceRes.json();
        savedConfig = data.config || defaults;
        loadedTemplate = data.smsTemplate || getDefaultTemplate();
        setSmsTemplate(loadedTemplate);
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
      setConfigSnapshot(JSON.stringify(finalConfig));
      setTemplateSnapshot(loadedTemplate);
    } catch (error) {
      console.error('Error loading voice config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/voice/stats`);
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error('Error loading voice stats:', error); }
  };

  const loadMissedCalls = async (page = 1) => {
    try {
      const response = await authFetch(`${apiUrl}/api/voice/missed-calls?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setMissedCalls(data.missedCalls);
        setMissedCallsTotal(data.total);
        setMissedCallsPage(page);
      }
    } catch (error) { console.error('Error loading missed calls:', error); }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${apiUrl}/api/voice/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, smsTemplate })
      });
      if (response.ok) {
        setConfigSnapshot(JSON.stringify(config));
        setTemplateSnapshot(smsTemplate);
        alert('Configuration saved successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const deployAgent = async () => {
    if (!config.forwardingNumber) {
      alert('Please enter your business phone number first.');
      return;
    }
    if (!phoneNumber) {
      alert('You need a provisioned SMS Agent Number first. Deploy the Lead Form Agent to get one.');
      return;
    }
    setIsDeploying(true);
    try {
      const response = await authFetch(`${apiUrl}/api/voice/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwardingNumber: config.forwardingNumber,
          delayMin: config.delayMin,
          delayMax: config.delayMax,
          smsTemplate,
          training: config.training
        })
      });
      if (response.ok) {
        setConfig({ ...config, enabled: true });
        onDeploymentChange();
        alert(`Missed Call Text-Back is now active!\n\nSMS Agent Number: ${phoneNumber}\n\nNext step: Set up no-answer call forwarding on your business line (${config.forwardingNumber}) to forward to ${phoneNumber}. Use the setup instructions on this page for your carrier.`);
      } else {
        const error = await response.json();
        alert('Failed to deploy: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to deploy: ' + error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
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

  const carrierSteps = selectedCarrier ? getCarrierSteps(selectedCarrier, phoneNumber) : null;

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">Missed Call Text-Back</h2>
            <div className={`px-3 py-1 rounded-lg font-medium text-sm ${isDeployed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {isDeployed ? '● Active' : '○ Not Active'}
            </div>
          </div>
          <p className="text-gray-600">
            {isDeployed ? 'Auto-texting missed callers from your SMS Agent Number' : 'Automatically text back anyone who calls and you miss'}
          </p>
        </div>

        {/* Stats */}
        {isDeployed && (
          <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2"><Phone className="w-5 h-5" /><span className="text-sm font-medium">Total Calls</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2"><PhoneOff className="w-5 h-5" /><span className="text-sm font-medium">Missed Calls</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.missedCalls}</p>
              <p className="text-xs text-gray-600 mt-1">Auto-detected</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2"><MessageCircle className="w-5 h-5" /><span className="text-sm font-medium">Texts Sent</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.textsSent}</p>
              <p className="text-xs text-gray-600 mt-1">Auto text-backs</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2"><TrendingUp className="w-5 h-5" /><span className="text-sm font-medium">Replies</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.replies}</p>
              <button onClick={() => setCurrentView('customers-leads')} className="text-xs text-green-600 hover:text-green-700 font-medium mt-1">View Leads →</button>
            </div>
          </div>
        )}

        {/* SMS Agent Number */}
        <div className={`rounded-xl border-2 p-5 flex items-start gap-4 mb-6 ${phoneNumber ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phoneNumber ? 'bg-green-600' : 'bg-gray-300'}`}>
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">SMS Agent Number</p>
            {phoneNumber ? (
              <>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-lg font-bold text-green-700 tracking-wide">{phoneNumber}</p>
                  <button
                    onClick={copyAgentNumber}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded font-semibold transition-colors ${agentNumCopied ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {agentNumCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Missed callers receive an automatic text from this number. Set up call forwarding below so your business line sends missed calls here.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-0.5">No SMS Agent Number assigned yet.</p>
                <p className="text-xs text-gray-400 mt-1">Deploy the Lead Form Agent first to provision your SMS Agent Number.</p>
              </>
            )}
          </div>
        </div>

        {/* Call Forwarding Setup */}
        {phoneNumber && (
          <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Call Forwarding Setup</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Keep your existing business number. Set it to forward unanswered calls to your SMS Agent Number — no number changes needed.
              </p>
            </div>

            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select your phone carrier:</label>
              <select
                value={selectedCarrier || ''}
                onChange={(e) => { setSelectedCarrier(e.target.value || null); setCodeCopied(false); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
              >
                {CARRIERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {selectedCarrier && (() => {
                const steps = getCarrierSteps(selectedCarrier, phoneNumber);
                return (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-gray-900 text-sm">{CARRIERS.find(c => c.id === selectedCarrier)?.name} instructions</span>
                </div>

                {steps?.note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 font-medium">
                    {steps.note}
                  </div>
                )}

                <ol className="space-y-3">
                  {steps?.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {s === '__CODE__' ? (
                        <div className="flex-1 pt-0.5">
                          <span className="text-gray-700 text-sm font-medium">Open your dial pad and enter this code, then press call:</span>
                          <div className="bg-gray-900 rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
                            <code className="text-green-400 text-sm font-mono flex-1 tracking-widest">{steps.code}</code>
                            <button
                              onClick={() => copyCode(steps.code)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${codeCopied ? 'bg-green-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                            >
                              {codeCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: s }} />
                      )}
                    </li>
                  ))}
                </ol>

                {steps?.cancelNote && (
                  <p className="text-xs text-gray-500 mt-4 bg-gray-50 rounded-lg p-3" dangerouslySetInnerHTML={{ __html: `<strong>To disable:</strong> ${steps.cancelNote}` }} />
                )}
              </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>

            {/* Business Phone Number */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Business Phone Number</p>
                  <p className="text-sm text-gray-600">The number on your cards, van, website — what customers call</p>
                </div>
              </div>
              <input
                type="tel"
                value={config.forwardingNumber || ''}
                onChange={(e) => setConfig({ ...config, forwardingNumber: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">We use this to recognize when a missed call comes from your line.</p>
            </div>

            {/* SMS Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Auto Text-Back</p>
                  <p className="text-sm text-gray-600">Send SMS when a call is missed</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.smsEnabled !== false}
                  onChange={(e) => setConfig({ ...config, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* SMS Delay */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Text-Back Delay</p>
                  <p className="text-sm text-gray-600">Random delay before sending to feel human ({config.delayMin || 30}-{config.delayMax || 60}s)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Min seconds</label>
                  <input
                    type="number" min="10" max="120"
                    value={config.delayMin ?? 30}
                    onChange={(e) => setConfig({ ...config, delayMin: e.target.value })}
                    onBlur={(e) => { const v = parseInt(e.target.value); setConfig(c => ({ ...c, delayMin: (isNaN(v) || v < 10) ? 30 : v })); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Max seconds</label>
                  <input
                    type="number" min="10" max="180"
                    value={config.delayMax ?? 60}
                    onChange={(e) => setConfig({ ...config, delayMax: e.target.value })}
                    onBlur={(e) => { const v = parseInt(e.target.value); setConfig(c => ({ ...c, delayMax: (isNaN(v) || v < 10) ? 60 : v })); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SMS Template */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Text-Back Template</h3>
                <span className="text-xs text-gray-500">160 chars = 1 SMS, 320 max = 2 SMS</span>
              </div>
              <textarea
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                maxLength="320"
              />
              <div className="mt-2">
                <span className={`text-xs ${smsTemplate.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {smsTemplate.length} / 160 characters {smsTemplate.length > 160 && '(will send as 2 SMS)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{`Available variables: {{name}}, {{agentName}}, {{businessName}}`}</p>
            </div>

            <button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Deploy Panel */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <PhoneOff className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">{isDeployed ? 'Text-Back Active' : 'Deploy Text-Back'}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isDeployed ? 'Missed calls trigger automatic texts' : 'Never lose a lead to a missed call again'}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>Keep your existing business number</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                  <span>Auto-texts missed callers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Human-like response delay</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Creates leads automatically</span>
                </div>
              </div>

              {isDeployed ? (
                <div className="w-full px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm">
                  <Phone className="w-5 h-5" /> Deployed
                </div>
              ) : (
                <button
                  onClick={deployAgent}
                  disabled={isDeploying || !phoneNumber}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  <Rocket className="w-5 h-5" />
                  {isDeploying ? 'Deploying...' : 'Deploy Now'}
                </button>
              )}

              {!phoneNumber && !isDeployed && (
                <p className="text-xs text-red-600 mt-2 text-center">Deploy the Lead Form Agent first to get an SMS Agent Number</p>
              )}
              {!['pro', 'expert'].includes(user?.plan?.toLowerCase()) && (
                <div className="flex items-center gap-1 justify-center mt-3">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-500">Requires Pro plan or higher</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Training */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowTraining(!showTraining)}
          className="w-full flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">Agent Training</h3>
              <p className="text-sm text-gray-600">Customize how the agent responds to missed callers</p>
            </div>
          </div>
          {showTraining ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showTraining && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                type="text"
                value={config.training?.agentName || ''}
                onChange={(e) => setConfig({ ...config, training: { ...config.training, agentName: e.target.value } })}
                placeholder="e.g., Kurt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Used in templates as {'{{agentName}}'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Tone</label>
              <select
                value={config.training?.responseTone || 'friendly'}
                onChange={(e) => setConfig({ ...config, training: { ...config.training, responseTone: e.target.value } })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="friendly">Friendly & Warm</option>
                <option value="formal">Professional & Formal</option>
                <option value="casual">Casual & Relaxed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Context</label>
              <textarea
                value={config.training?.businessContext || ''}
                onChange={(e) => setConfig({ ...config, training: { ...config.training, businessContext: e.target.value } })}
                rows="3"
                placeholder="Brief description of your business..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
              <textarea
                value={config.training?.servicesInfo || ''}
                onChange={(e) => setConfig({ ...config, training: { ...config.training, servicesInfo: e.target.value } })}
                rows="3"
                placeholder="List your main services, pricing ranges..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Training Data'}
            </button>
          </div>
        )}
      </div>

      {/* Missed Calls Log */}
      {isDeployed && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => { setShowCallLog(!showCallLog); if (!showCallLog) loadMissedCalls(); }}
            className="w-full flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <PhoneOff className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Call Log</h3>
                <p className="text-sm text-gray-600">{missedCallsTotal} total calls recorded</p>
              </div>
            </div>
            {showCallLog ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showCallLog && (
            <div className="px-6 pb-6">
              {missedCalls.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No calls recorded yet.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Date/Time</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Caller</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Text Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missedCalls.map((call) => (
                          <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-gray-900">{formatDate(call.created_at)}</td>
                            <td className="py-3 px-2">
                              <span className="text-gray-900">{formatPhone(call.caller_phone)}</span>
                              {call.lead_name && <span className="text-xs text-gray-500 ml-2">{call.lead_name}</span>}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${call.call_status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {call.call_status === 'answered' ? 'Answered' : 'Missed'}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              {call.textback_sent ? (
                                <span className="text-green-600 text-xs font-medium">Sent</span>
                              ) : call.call_status === 'answered' ? (
                                <span className="text-gray-400 text-xs">N/A</span>
                              ) : (
                                <span className="text-amber-600 text-xs font-medium">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {missedCallsTotal > 10 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500">Page {missedCallsPage} of {Math.ceil(missedCallsTotal / 10)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => loadMissedCalls(missedCallsPage - 1)} disabled={missedCallsPage <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button onClick={() => loadMissedCalls(missedCallsPage + 1)} disabled={missedCallsPage >= Math.ceil(missedCallsTotal / 10)} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
