import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Star, RefreshCw, Copy, CheckCircle, MessageSquare,
  Calendar, TrendingUp, Clock, Users, BarChart3, Send, Mail,
  Phone, ExternalLink, CheckCircle2, XCircle, Loader2, Info, AlertCircle,
  Link as LinkIcon, Search, Globe, Gift, Trophy, Ticket, ShieldCheck, Dices,
  ChevronRight, ChevronLeft, Check
} from 'lucide-react';
import GBPAnalyzer from './GBPAnalyzer';

// Review Requests is a guided flow (same shape as the Embed Website setup)
const REVIEW_STEPS = [
  { label: 'Get Started' },
  { label: 'Google Link' },
  { label: 'Your Message' },
  { label: 'Timing' },
  { label: 'Raffle' },
  { label: 'Results' },
];

export default function GoogleBusiness({ apiUrl, user, authFetch, inOnboarding }) {
  const [activeTab, setActiveTab] = useState('analyzer');
  
  // Review Generator State
  const [reviewCustomerName, setReviewCustomerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repliesGeneratedToday, setRepliesGeneratedToday] = useState(0);
  const [repliesGeneratedWeek, setRepliesGeneratedWeek] = useState(0);

  // Review Requests State
  const [reviewRequests, setReviewRequests] = useState([]);
  const [reviewDiagnostics, setReviewDiagnostics] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [reviewLink, setReviewLink] = useState('');
  const [savingReviewLink, setSavingReviewLink] = useState(false);
  const [assignedPhone, setAssignedPhone] = useState(null);

  // Review Requests guided flow
  const [reviewStep, setReviewStep] = useState(0);
  const [linkSaved, setLinkSaved] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const stepInitRef = useRef(false);

  useEffect(() => {
  fetchStats();
  fetchUserReviewLink();
  loadReviewConfig();
  if (activeTab === 'review-requests') {
    fetchReviewRequests();
    loadRaffleData();
  }
}, [activeTab]);

  const [reviewConfig, setReviewConfig] = useState({
  messageTemplate: "Hi {{name}}! Thank you for choosing {{business}}. We'd love to hear about your experience! Could you take a moment to leave us a review?",
  incentive: "$10 off your next service",
  incentiveEnabled: true,
  autoSendEnabled: true,
  sendDelay: 2,
  sendTrigger: 'booking_completed',
  raffleEnabled: false,
  raffleReward: '',
  raffleConsolation: '$50 off any Full Detail',
  raffleRequireVerified: false,
  repName: '',
  incentiveScore: null,
  incentiveTip: '',
  reviewLinkBase: ''
});

  const [ratingIncentive, setRatingIncentive] = useState(false);

  // Monthly raffle state
  const currentPeriod = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  // Build a list of the last 6 months as selectable periods
  const recentPeriods = (() => {
    const list = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const period = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      const label = m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ period, label });
    }
    return list;
  })();
  const [rafflePeriod, setRafflePeriod] = useState(currentPeriod);
  const [raffleHistory, setRaffleHistory] = useState([]);
  const [rafflePool, setRafflePool] = useState(null);
  const [raffleLoading, setRaffleLoading] = useState(false);
  const [rafflePreview, setRafflePreview] = useState(null);
  const [previewingRaffle, setPreviewingRaffle] = useState(false);
  const [runningRaffle, setRunningRaffle] = useState(false);

  const loadRaffleHistory = async () => {
    try {
      const histRes = await authFetch(`${apiUrl}/api/google-business/raffles`);
      const hist = await histRes.json();
      if (hist.success) setRaffleHistory(hist.raffles || []);
    } catch (error) {
      console.error('Error loading raffle history:', error);
    }
  };

  const loadRafflePool = async (period = rafflePeriod) => {
    setRaffleLoading(true);
    setRafflePreview(null);
    try {
      const poolRes = await authFetch(`${apiUrl}/api/google-business/raffle/pool?period=${period}`);
      const pool = await poolRes.json();
      if (pool.success) setRafflePool(pool);
    } catch (error) {
      console.error('Error loading raffle pool:', error);
    } finally {
      setRaffleLoading(false);
    }
  };

  const loadRaffleData = async () => {
    await Promise.all([loadRaffleHistory(), loadRafflePool(rafflePeriod)]);
  };

  // Whether this period already has a recorded draw
  const drawnPeriods = new Set(raffleHistory.map(r => r.period));

  const handlePreviewRaffle = async () => {
    setPreviewingRaffle(true);
    setRafflePreview(null);
    try {
      const res = await authFetch(`${apiUrl}/api/google-business/raffle/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: rafflePeriod, dryRun: true })
      });
      const data = await res.json();
      if (data.success) setRafflePreview(data.result);
      else alert('Could not preview the raffle. Make sure the raffle is enabled and an incentive reward is set.');
    } catch (error) {
      console.error('Error previewing raffle:', error);
      alert('Could not preview the raffle.');
    } finally {
      setPreviewingRaffle(false);
    }
  };

  const handleRunRaffle = async () => {
    const periodLabel = recentPeriods.find(p => p.period === rafflePeriod)?.label || rafflePeriod;
    const size = rafflePool?.poolSize || 0;
    if (size === 0) { alert('No entrants for this month yet — nothing to draw.'); return; }
    if (!reviewConfig.raffleEnabled) { alert('Turn on "Enable Monthly Raffle" and click Save Settings first.'); return; }
    const ok = window.confirm(
      `Draw the ${periodLabel} raffle now?\n\n` +
      `This picks 1 winner and IMMEDIATELY texts all ${size} entrant(s) — the winner gets your reward, everyone else the consolation offer. This cannot be undone, and ${periodLabel} won't be drawn again.`
    );
    if (!ok) return;
    setRunningRaffle(true);
    setRafflePreview(null);
    try {
      const res = await authFetch(`${apiUrl}/api/google-business/raffle/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: rafflePeriod, dryRun: false })
      });
      const data = await res.json();
      const r = data.result || {};
      if (data.success && r.status === 'completed') {
        alert(`🎉 Winner: ${r.winner?.name}\n${r.textsSent} text(s) sent to a pool of ${r.poolSize}.`);
      } else if (r.status === 'already_drawn') {
        alert('This month was already drawn — each month can only run once.');
      } else if (r.status === 'skipped' || r.status === 'skipped_empty') {
        alert(`Nothing drawn: ${r.notes || 'no eligible entrants'}.`);
      } else {
        alert(`Could not run the raffle: ${r.notes || r.status || 'unknown error'}.`);
      }
      await loadRaffleData();
    } catch (error) {
      console.error('Error running raffle:', error);
      alert('Could not run the raffle.');
    } finally {
      setRunningRaffle(false);
    }
  };

  const fetchUserReviewLink = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`);
      const data = await response.json();
      if (data.user?.google_review_link) {
        setReviewLink(data.user.google_review_link);
        // Already set up — land them on Results instead of the intro (once per mount)
        if (!stepInitRef.current) setReviewStep(REVIEW_STEPS.length - 1);
      }
      stepInitRef.current = true;
      setAssignedPhone(data.user?.twilio_phone_number || null);
    } catch (error) {
      console.error('Error fetching review link:', error);
    }
  };

  const handleSaveReviewLink = async ({ advance = false } = {}) => {
    if (!reviewLink.trim()) {
      alert('Please enter your Google review link');
      return;
    }

    const link = reviewLink.toLowerCase();
    if (!link.includes('g.page') && !link.includes('google.com')) {
      alert('Please enter a valid Google review link (should contain g.page or google.com)');
      return;
    }

    setSavingReviewLink(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/google-review-link`, {
        method: 'POST',
        body: JSON.stringify({ reviewLink: reviewLink.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setLinkSaved(true);
        setTimeout(() => setLinkSaved(false), 3000);
        if (advance) setReviewStep(2);
      } else {
        alert('Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving review link:', error);
      alert('Failed to save Google review link');
    } finally {
      setSavingReviewLink(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/google-business/stats`);
      const data = await response.json();
      if (data.success) {
        setRepliesGeneratedToday(data.stats.today || 0);
        setRepliesGeneratedWeek(data.stats.week || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviewRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await authFetch(`${apiUrl}/api/google-business/review-requests`);
      const data = await response.json();
      if (data.success) {
        setReviewRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching review requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
    // Why any recent booking hasn't produced a text — a customer who was skipped is
    // otherwise just silently absent from the list.
    try {
      const res = await authFetch(`${apiUrl}/api/google-business/review-diagnostics?days=30`);
      const data = await res.json();
      if (data.success) setReviewDiagnostics(data.bookings || []);
    } catch (error) {
      console.error('Error fetching review diagnostics:', error);
    }
  };

  const handleGenerateReviewReply = async () => {
    if (!reviewText.trim()) { alert('Please enter a review first'); return; }
    setIsGeneratingReply(true);
    setGeneratedReply('');
    try {
      const response = await authFetch(`${apiUrl}/api/google-business/generate-reply`, {
        method: 'POST',
        body: JSON.stringify({
          reviewText: reviewText.trim(),
          rating: reviewRating,
          businessName: user.businessName,
          customerName: reviewCustomerName.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedReply(data.reply);
        fetchStats();
      } else {
        alert('Failed to generate reply. Please try again.');
      }
    } catch (error) {
      console.error('AI reply error:', error);
      alert('Failed to generate reply. Please try again.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const filteredRequests = reviewRequests.filter(req => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'sent') return req.status === 'sent' && !req.review_completed;
    if (filterStatus === 'completed') return req.review_completed;
    if (filterStatus === 'failed') return req.status === 'failed';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const loadReviewConfig = async () => {
  try {
    const response = await authFetch(`${apiUrl}/api/review-config`);
    if (response.ok) {
      const data = await response.json();
      if (data.config) {
        setReviewConfig({
          messageTemplate: data.config.message_template,
          incentive: data.config.incentive,
          incentiveEnabled: data.config.incentive_enabled,
          autoSendEnabled: data.config.auto_send_enabled,
          sendDelay: data.config.send_delay,
          sendTrigger: data.config.send_trigger || 'booking_completed',
          raffleEnabled: data.config.raffle_enabled ?? false,
          raffleReward: data.config.raffle_reward || '',
          raffleConsolation: data.config.raffle_consolation || '$50 off any Full Detail',
          raffleRequireVerified: data.config.raffle_require_verified ?? false,
          repName: data.config.rep_name || '',
          incentiveScore: data.config.incentive_score ?? null,
          incentiveTip: data.config.incentive_tip || '',
          reviewLinkBase: data.config.review_link_base || ''
        });
      }
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
};

const saveReviewConfig = async ({ next = null } = {}) => {
  try {
    const response = await authFetch(`${apiUrl}/api/review-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewConfig)
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.incentiveScore !== undefined) {
        setReviewConfig(prev => ({ ...prev, incentiveScore: data.incentiveScore, incentiveTip: data.incentiveTip || '' }));
      }
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      if (next !== null) setReviewStep(next);
    } else {
      alert('Failed to save settings');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    alert('Failed to save settings');
  }
};

// Ask Claude to rate the incentive 1-10 (how likely it is to earn a review) on demand.
const rateIncentiveNow = async () => {
  if (!reviewConfig.incentive?.trim()) return;
  setRatingIncentive(true);
  try {
    const response = await authFetch(`${apiUrl}/api/review-config/rate-incentive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incentive: reviewConfig.incentive })
    });
    if (response.ok) {
      const data = await response.json();
      setReviewConfig(prev => ({ ...prev, incentiveScore: data.score ?? null, incentiveTip: data.tip || '' }));
    }
  } catch (e) {
    console.error('Error rating incentive:', e);
  } finally {
    setRatingIncentive(false);
  }
};

  // Onboarding flow
  const [gbpFlowDone, setGbpFlowDone] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('onboarding_flow') || '{}').flow_gbp; } catch { return false; }
  });

  const markGBPDone = () => {
    const flow = (() => { try { return JSON.parse(localStorage.getItem('onboarding_flow') || '{}'); } catch { return {}; } })();
    flow.flow_gbp = true;
    localStorage.setItem('onboarding_flow', JSON.stringify(flow));
    window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key: 'flow_gbp' } }));
    setGbpFlowDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Onboarding banner */}
      {!gbpFlowDone && (
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-orange-900 text-sm">Getting Started · Step 4: GBP Audit</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Audit your Google Business Profile to see where you stand. Use the <strong>Profile Analyzer</strong> tab below to run your audit.
          </p>
          <button
            onClick={markGBPDone}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
          >
            <Globe className="w-4 h-4" />
            Mark Done & Continue to Embed →
          </button>
        </div>
      )}

      {/* Tabs - Profile Analyzer first, Review Requests second, AI Reply Generator third */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className={`flex ${!inOnboarding ? '' : ''}`}>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 font-semibold transition-all relative border-b-2 ${
                activeTab === 'analyzer'
                  ? 'border-amber-600 text-amber-600 bg-amber-50'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Profile Analyzer</span>
            </button>
            {!inOnboarding && (
              <>
                <button
                  onClick={() => setActiveTab('review-requests')}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 font-semibold transition-all relative border-b-2 border-x border-gray-100 ${
                    activeTab === 'review-requests'
                      ? 'border-b-amber-600 text-amber-600 bg-amber-50'
                      : 'border-b-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Review Requests</span>
                </button>
                <button
                  onClick={() => setActiveTab('reply-generator')}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 font-semibold transition-all relative border-b-2 ${
                    activeTab === 'reply-generator'
                      ? 'border-amber-600 text-amber-600 bg-amber-50'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">AI Reply</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* PROFILE ANALYZER TAB */}
          {activeTab === 'analyzer' && (
            <GBPAnalyzer apiUrl={apiUrl} user={user} authFetch={authFetch} inOnboarding={inOnboarding} />
          )}

          {/* REPLY GENERATOR TAB */}
          {activeTab === 'reply-generator' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={reviewCustomerName}
                      onChange={(e) => setReviewCustomerName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= reviewRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-gray-400'
                            } transition`}
                          />
                        </button>
                      ))}
                      <span className="ml-3 text-gray-700 font-medium">
                        {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review Text</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Paste the customer's review here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Copy the review from Google Business Profile and paste it here
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReviewReply}
                    disabled={!reviewText.trim() || isGeneratingReply}
                    className="w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isGeneratingReply ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        Generating Your Reply...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generate AI Reply
                      </>
                    )}
                  </button>
                </div>

                {generatedReply && (
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-blue-50 border-2 border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-6 h-6 text-amber-600" />
                      <h4 className="font-bold text-gray-900 text-lg">Your AI-Generated Reply</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg mb-4 border border-amber-100">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{generatedReply}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedReply);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateReviewReply}
                        className="flex-1 bg-white border-2 border-amber-600 text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Regenerate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Now paste this reply in your Google Business Profile dashboard!
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Today</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{repliesGeneratedToday}</p>
                    <p className="text-xs text-blue-700 mt-1">replies generated</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <p className="text-sm font-medium text-amber-900">This Week</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{repliesGeneratedWeek}</p>
                    <p className="text-xs text-amber-700 mt-1">replies generated</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Time Saved</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      ~{Math.round((repliesGeneratedWeek * 5) / 60 * 10) / 10}h
                    </p>
                    <p className="text-xs text-green-700 mt-1">this week</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 shadow-sm border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white fill-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Why Respond to Reviews?</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg p-5 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Boosts Your Google Ranking</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            Google prioritizes businesses that actively engage with customers. Responding to
                            reviews can improve your local search ranking by up to <strong>35%</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-5 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Builds Customer Trust</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            <strong>89% of consumers</strong> read business responses to reviews. Active
                            engagement makes customers more likely to choose you.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-5 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Turns Negatives into Positives</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            <strong>45% of customers</strong> are more likely to visit a business if it responds
                            to negative reviews constructively.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-blue-600 rounded-xl p-8 shadow-lg text-white">
                  <h3 className="text-2xl font-bold mb-6">Impact by the Numbers</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-3xl font-bold">35%</span>
                      </div>
                      <p className="flex-1 text-sm">
                        Higher ranking in local search results when you respond to reviews
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-3xl font-bold">89%</span>
                      </div>
                      <p className="flex-1 text-sm">
                        Of consumers read business responses before making a decision
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-3xl font-bold">45%</span>
                      </div>
                      <p className="flex-1 text-sm">
                        More likely to visit after seeing responses to negative reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVIEW REQUESTS TAB — guided setup flow */}
          {activeTab === 'review-requests' && (
            <div className="space-y-6">

              {/* Header - centered */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-3 shadow-lg shadow-amber-200">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Automated Review Requests</h2>
                <p className="text-gray-500 mt-1">Follow up after every job and turn happy customers into Google reviews</p>
              </div>

              {/* Step Progress Bar */}
              <div className="flex items-center justify-center gap-1 px-2 flex-wrap">
                {REVIEW_STEPS.map((s, i) => {
                  const isActive = i === reviewStep;
                  const isCompleted = i < reviewStep;
                  const isClickable = i <= reviewStep || !!reviewLink;
                  return (
                    <div key={i} className="flex items-center gap-1">
                      <button
                        onClick={() => { if (isClickable) setReviewStep(i); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-md'
                            : isCompleted
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                            : isClickable
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                      {i < REVIEW_STEPS.length - 1 && (
                        <ChevronRight className={`w-3.5 h-3.5 ${isCompleted ? 'text-amber-400' : 'text-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Step 0: Get Started */}
                {reviewStep === 0 && (
                  <div className="p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                        <MessageSquare className="w-10 h-10 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Get More Google Reviews On Autopilot</h3>
                      <p className="text-gray-500 mb-6">
                        In a few steps you'll have an SMS agent that checks in after every job, asks the happy customers
                        for a Google review, and quietly escalates the unhappy ones to you before they post.
                      </p>

                      <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <Phone className="w-6 h-6 text-amber-600 mb-2" />
                          <p className="text-sm font-medium text-gray-800">Automatic Opener</p>
                          <p className="text-xs text-gray-500 mt-1">"How did the [service] go?" — sent right after the job</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                          <Sparkles className="w-6 h-6 text-green-600 mb-2" />
                          <p className="text-sm font-medium text-gray-800">AI Reads the Reply</p>
                          <p className="text-xs text-gray-500 mt-1">Happy → asks for the review. Unhappy → escalates to you</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <Gift className="w-6 h-6 text-blue-600 mb-2" />
                          <p className="text-sm font-medium text-gray-800">Incentive + Direct Link</p>
                          <p className="text-xs text-gray-500 mt-1">Your reward, plus a one-tap link to your Google page</p>
                        </div>
                      </div>

                      {/* Assigned Business Phone Number */}
                      <div className={`rounded-xl border-2 p-5 flex items-start gap-4 text-left mb-8 ${assignedPhone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${assignedPhone ? 'bg-green-600' : 'bg-gray-300'}`}>
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">SMS Agent Number</p>
                          {assignedPhone ? (
                            <>
                              <p className="text-lg font-bold text-green-700 tracking-wide mt-0.5">{assignedPhone}</p>
                              <p className="text-xs text-gray-500 mt-1">Review request texts are sent from this number. Customers can reply to it and your AI agent will respond.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-500 mt-0.5">No number assigned yet.</p>
                              <p className="text-xs text-gray-400 mt-1">A dedicated phone number is provisioned when you upgrade to a Pro plan, so review requests come from a consistent local number.</p>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setReviewStep(1)}
                        className="px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition shadow-md shadow-amber-200 inline-flex items-center gap-2"
                      >
                        {reviewLink ? 'Review Your Setup' : 'Get Started'} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Connect Your Google Review Link */}
                {reviewStep === 1 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Connect Your Google Review Link</h3>
                      <p className="text-gray-500 mt-1">This is the link customers tap to leave you a review</p>
                    </div>

                    <div className="max-w-lg mx-auto">
                      <ol className="space-y-3 mb-6">
                        {[
                          'Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" class="underline font-semibold text-blue-700">Google Business Profile</a>',
                          'Click on your business',
                          'Go to the <strong>"Home"</strong> tab',
                          'Find <strong>"Get more reviews"</strong> and click <strong>"Share review form"</strong>',
                          'Click <strong>"Copy"</strong> to copy the short link',
                          'Paste it in the field below',
                        ].map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-gray-700 text-sm leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: s }} />
                          </li>
                        ))}
                      </ol>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5">
                        <p className="text-xs font-medium text-gray-700 mb-1">Example review links:</p>
                        <p className="font-mono text-xs text-gray-500">https://g.page/r/...</p>
                        <p className="font-mono text-xs text-gray-500">https://search.google.com/local/writereview?placeid=...</p>
                      </div>

                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Review Link <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={reviewLink}
                        onChange={(e) => setReviewLink(e.target.value)}
                        placeholder="https://g.page/r/... or https://search.google.com/local/writereview?placeid=..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                      />

                      {reviewLink && (
                        <div className="flex gap-2 mt-3">
                          <a
                            href={reviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2 font-medium text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Test This Link
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(reviewLink);
                              alert('Review link copied!');
                            }}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2 font-medium text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-8 max-w-lg mx-auto">
                      <button onClick={() => setReviewStep(0)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveReviewLink({ advance: true })}
                        disabled={savingReviewLink || !reviewLink.trim()}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
                      >
                        {savingReviewLink ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : linkSaved ? (
                          <><Check className="w-4 h-4" /> Saved!</>
                        ) : (
                          <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Your Message */}
                {reviewStep === 2 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Set Up Your Message</h3>
                      <p className="text-gray-500 mt-1">The text writes itself — just tell us who's sending it and what they get</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                          <p className="text-sm font-bold text-gray-900">How the review text works</p>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p><span className="font-semibold">1. Opener (sent automatically):</span> “Hey [first name], this is {reviewConfig.repName?.trim() || 'your name'} with {user?.businessName || user?.business_name || 'your business'}. How did the [service] go?”</p>
                            <p><span className="font-semibold text-green-700">2a. If they reply positively:</span> we thank them and ask for a Google review — with your incentive woven in — plus your review link.</p>
                            <p><span className="font-semibold text-amber-700">2b. If they reply negatively:</span> we tell them we're escalating to a manager and email you to make it right.</p>
                          </div>
                          <p className="text-xs text-gray-500">It's all written automatically — there's no message template to fill in. Just set your name and incentive. →</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-sm font-medium text-gray-900 mb-3">💡 Pro Tips:</p>
                          <ul className="space-y-2 text-xs text-gray-700">
                            <li>• Personalize with customer names — first-name texts get far higher response rates</li>
                            <li>• Keep incentives short and clear — "10% off your next visit" beats a long offer</li>
                            <li>• Use a real person's name in the opener, not the business name</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your name (used in the opener text)</label>
                          <input
                            type="text"
                            value={reviewConfig.repName}
                            onChange={(e) => setReviewConfig({ ...reviewConfig, repName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Kurt"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Opener: “Hey [first name], this is {reviewConfig.repName?.trim() || 'Kurt'} with your business. How did the [service] go?”
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-sm font-semibold text-gray-900 mb-1">Your review link</p>
                          <p className="text-xs text-gray-600">
                            Texts include a tracked link carrying your business name, so customers
                            recognise it:
                          </p>
                          <p className="font-mono text-xs text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 mt-2 break-all">
                            sorceintegrations.com/r/{(user?.businessName || user?.business_name || 'your-business')
                              .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'your-business'}/k3f9qa
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Set up automatically — nothing for you to configure. One tap takes them
                            straight to your Google review page, and we record the click.
                          </p>
                          <details className="mt-3">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                              Advanced: use my own domain instead
                            </summary>
                            <div className="mt-2 space-y-2">
                              <input
                                type="text"
                                value={reviewConfig.reviewLinkBase}
                                onChange={(e) => setReviewConfig({ ...reviewConfig, reviewLinkBase: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., https://thompsonsautodetailing.com/googlereview"
                              />
                              <p className="text-xs text-gray-500">
                                Only worth it if you want your own domain in the text. Requires a
                                wildcard redirect from <span className="font-mono">/googlereview/*</span> →
                                <span className="font-mono"> https://sorceintegrations.com/r/*</span> on your
                                host. Leave blank to use the link above.
                              </p>
                            </div>
                          </details>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Offer Incentive</p>
                            <p className="text-sm text-gray-600">Encourage reviews with a reward</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={reviewConfig.incentiveEnabled} onChange={(e) => setReviewConfig({ ...reviewConfig, incentiveEnabled: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {reviewConfig.incentiveEnabled && (
                          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                            <label className="block text-base font-bold text-gray-900 mb-1">👉 Type your incentive here</label>
                            <p className="text-xs text-gray-600 mb-2">The reward a customer gets for leaving a review. We weave it into the positive-reply text automatically — for example: "leave us a quick Google review and 10% off your next detail".</p>
                            <input type="text" value={reviewConfig.incentive} onChange={(e) => setReviewConfig({ ...reviewConfig, incentive: e.target.value })} className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base" placeholder="e.g., 10% off your next detail" />
                            <div className="mt-2 flex items-center gap-3">
                              <button type="button" onClick={rateIncentiveNow} disabled={ratingIncentive || !reviewConfig.incentive?.trim()} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                {ratingIncentive ? 'Rating…' : 'Rate my incentive'}
                              </button>
                              {reviewConfig.incentiveScore != null && (
                                <span className={`text-sm font-bold ${reviewConfig.incentiveScore >= 7 ? 'text-green-600' : reviewConfig.incentiveScore >= 4 ? 'text-amber-600' : 'text-red-600'}`}>{reviewConfig.incentiveScore}/10</span>
                              )}
                            </div>
                            {reviewConfig.incentiveTip && (
                              <p className="mt-1 text-xs text-gray-600 italic">💡 {reviewConfig.incentiveTip}</p>
                            )}
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Only sent to customers who reply positively. Examples:</p>
                              <ul className="text-xs text-gray-500 space-y-0.5 ml-2">
                                <li>• "10% off your next detail"</li>
                                <li>• "a free interior wipe-down next visit"</li>
                                <li>• "entry into our monthly free-detail drawing"</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button onClick={() => setReviewStep(1)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => saveReviewConfig({ next: 3 })}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition inline-flex items-center gap-2 text-sm"
                      >
                        {configSaved ? <><Check className="w-4 h-4" /> Saved!</> : <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Timing */}
                {reviewStep === 3 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Choose When It Sends</h3>
                      <p className="text-gray-500 mt-1">Pick the trigger and delay for the first text</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Auto-Send Requests</p>
                            <p className="text-sm text-gray-600">Automatically send review requests to customers</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={reviewConfig.autoSendEnabled} onChange={(e) => setReviewConfig({ ...reviewConfig, autoSendEnabled: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {reviewConfig.autoSendEnabled ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">When to Send</label>
                              <div className="space-y-2">
                                <button
                                  onClick={() => setReviewConfig({ ...reviewConfig, sendTrigger: 'booking_completed' })}
                                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                    reviewConfig.sendTrigger === 'booking_completed'
                                      ? 'border-blue-400 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                    reviewConfig.sendTrigger === 'booking_completed' ? 'border-blue-500' : 'border-gray-300'
                                  }`}>
                                    {reviewConfig.sendTrigger === 'booking_completed' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                  </span>
                                  <div>
                                    <p className={`text-sm font-medium ${reviewConfig.sendTrigger === 'booking_completed' ? 'text-blue-800' : 'text-gray-800'}`}>
                                      After booking is marked completed
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Sends when you manually mark a booking as completed in the calendar</p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => setReviewConfig({ ...reviewConfig, sendTrigger: 'service_duration' })}
                                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                    reviewConfig.sendTrigger === 'service_duration'
                                      ? 'border-blue-400 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                    reviewConfig.sendTrigger === 'service_duration' ? 'border-blue-500' : 'border-gray-300'
                                  }`}>
                                    {reviewConfig.sendTrigger === 'service_duration' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                  </span>
                                  <div>
                                    <p className={`text-sm font-medium ${reviewConfig.sendTrigger === 'service_duration' ? 'text-blue-800' : 'text-gray-800'}`}>
                                      As soon as service duration ends
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Automatically sends when the scheduled service end time passes — no manual action needed</p>
                                  </div>
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {reviewConfig.sendTrigger === 'service_duration' ? 'Additional Delay After Service Ends' : 'Send Delay After Completion'}
                              </label>
                              <select value={reviewConfig.sendDelay} onChange={(e) => setReviewConfig({ ...reviewConfig, sendDelay: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="0">Immediately</option>
                                <option value="1">1 hour later</option>
                                <option value="2">2 hours later (recommended)</option>
                                <option value="6">6 hours later</option>
                                <option value="24">24 hours later</option>
                                <option value="48">48 hours later</option>
                                <option value="72">3 days later</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-2">📱 SMS is sent based on this delay after the trigger. Email follows the same timing.</p>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Auto-send is off — no review requests will go out until you turn it back on.</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-amber-600" />
                          Your Review Request Timeline
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">2 hours</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">SMS (Step 1)</span>
                              </div>
                              <p className="text-xs text-gray-600">Sent while the experience is still fresh</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">1 day</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-gray-900">Email (Step 2)</span>
                              </div>
                              <p className="text-xs text-gray-600">Professional follow-up with review link and incentive</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">+2 days</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-gray-900">Reminder Email (Step 3)</span>
                              </div>
                              <p className="text-xs text-gray-600">Friendly reminder about the reward</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">+4 days</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-gray-900">Urgency Email (Step 4)</span>
                              </div>
                              <p className="text-xs text-gray-600">Creating urgency - "Don't miss out!"</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">+6 days</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-gray-900">Final Email (Step 5)</span>
                              </div>
                              <p className="text-xs text-gray-600">Last chance - offer expires soon!</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded border border-green-300">
                          <p className="text-xs text-green-800 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <strong>This 5-step sequence maximizes review completion while minimizing costs (1 SMS + 4 emails)</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button onClick={() => setReviewStep(2)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => saveReviewConfig({ next: 4 })}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition inline-flex items-center gap-2 text-sm"
                      >
                        {configSaved ? <><Check className="w-4 h-4" /> Saved!</> : <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Monthly Raffle (optional) */}
                {reviewStep === 4 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Monthly Raffle <span className="text-sm font-medium text-gray-400">(optional)</span></h3>
                      <p className="text-gray-500 mt-1">Draw one winner a month from everyone who left a review</p>
                    </div>

                    <div className="space-y-6">
                      {/* Intro */}
                      <div className="bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Gift className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">Monthly Review Raffle</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              On the 1st of each month we automatically draw <strong>one winner</strong> from everyone who left a
                              Google review the previous month, and text the whole group. The winner gets your incentive reward;
                              everyone else gets your consolation offer. Entrants are customers who tapped their review link
                              (each person enters once, and past winners are excluded).
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Enable + offers */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Enable Monthly Raffle</p>
                              <p className="text-sm text-gray-600">Auto-draw a winner on the 1st of each month</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={reviewConfig.raffleEnabled} onChange={(e) => setReviewConfig({ ...reviewConfig, raffleEnabled: e.target.checked })} className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-amber-500" /> Winner Reward
                            </label>
                            <input
                              type="text"
                              value={reviewConfig.raffleReward}
                              onChange={(e) => setReviewConfig({ ...reviewConfig, raffleReward: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="e.g., a FREE Full Detail"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Used <strong>only</strong> in the winner's text: "You WON … {reviewConfig.raffleReward || 'a FREE Full Detail'}". Phrase it as the prize (a noun), e.g. <em>"a FREE Full Detail"</em> — not "you won," which the message already says. This is separate from the review-request incentive in the previous step.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-green-600" /> Consolation Offer (non-winners)
                            </label>
                            <input
                              type="text"
                              value={reviewConfig.raffleConsolation}
                              onChange={(e) => setReviewConfig({ ...reviewConfig, raffleConsolation: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="$50 off any Full Detail"
                            />
                            <p className="text-xs text-gray-500 mt-1">Everyone who didn't win gets this offer as a thank-you text.</p>
                          </div>

                          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg gap-3">
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Only enter verified reviewers</p>
                              <p className="text-sm text-gray-600">Restrict the draw to people we could confirm on Google. Note: Google only exposes a handful of recent reviews, so this usually shrinks the pool a lot — leave off unless you want to be strict.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer mt-1">
                              <input type="checkbox" checked={reviewConfig.raffleRequireVerified} onChange={(e) => setReviewConfig({ ...reviewConfig, raffleRequireVerified: e.target.checked })} className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <p className="text-xs text-gray-400">Raffle changes are saved when you click <strong>Save &amp; Finish</strong> below.</p>
                        </div>

                        {/* This month's pool */}
                        <div className="space-y-4">
                          <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-purple-600" /> Entrants
                              </h4>
                              <select
                                value={rafflePeriod}
                                onChange={(e) => { setRafflePeriod(e.target.value); loadRafflePool(e.target.value); }}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {recentPeriods.map((p) => (
                                  <option key={p.period} value={p.period}>
                                    {p.label}{p.period === currentPeriod ? ' (current)' : ''}{drawnPeriods.has(p.period) ? ' ✓ drawn' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {raffleLoading ? (
                              <div className="flex items-center gap-2 text-gray-500 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                            ) : rafflePool && rafflePool.poolSize > 0 ? (
                              <>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-3xl font-bold text-purple-600">{rafflePool.poolSize}</span>
                                  <span className="text-sm text-gray-600">entrant{rafflePool.poolSize === 1 ? '' : 's'} so far</span>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                  {rafflePool.pool.map((p, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                      {p.verified && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                                      {p.name}
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 py-4">No entrants yet this month. Customers who tap their review link will appear here.</p>
                            )}
                          </div>

                          {drawnPeriods.has(rafflePeriod) ? (
                            <div className="w-full bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" /> This month has already been drawn.
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Preview draw (dry run, no texts) */}
                              <button
                                type="button"
                                onClick={handlePreviewRaffle}
                                disabled={previewingRaffle || runningRaffle}
                                className="flex-1 bg-white border-2 border-purple-600 text-purple-700 px-4 py-3 rounded-lg font-semibold hover:bg-purple-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {previewingRaffle ? <><Loader2 className="w-5 h-5 animate-spin" /> Previewing…</> : <><Dices className="w-5 h-5" /> Preview (no texts)</>}
                              </button>
                              {/* Real draw — sends texts */}
                              <button
                                type="button"
                                onClick={handleRunRaffle}
                                disabled={runningRaffle || previewingRaffle}
                                className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {runningRaffle ? <><Loader2 className="w-5 h-5 animate-spin" /> Drawing…</> : <><Trophy className="w-5 h-5" /> Draw now &amp; text everyone</>}
                              </button>
                            </div>
                          )}

                          {rafflePreview && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                              {rafflePreview.status === 'dry_run' ? (
                                <>
                                  <p className="font-semibold text-amber-900 flex items-center gap-2"><Trophy className="w-4 h-4" /> Would win: {rafflePreview.winner?.name}</p>
                                  <p className="text-amber-800 mt-1">Pool of {rafflePreview.poolSize} · reward: {rafflePreview.reward}</p>
                                  <p className="text-xs text-amber-700 mt-2">This is just a preview — no texts were sent. The real draw runs automatically on the 1st.</p>
                                </>
                              ) : (
                                <p className="text-amber-800">Preview: {rafflePreview.status}{rafflePreview.notes ? ` — ${rafflePreview.notes}` : ''}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Past winners */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Past Winners</h4>
                        {raffleHistory.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <Gift className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 font-medium">No raffles drawn yet</p>
                            <p className="text-sm text-gray-500 mt-1">Your first winner will be drawn on the 1st of next month.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {raffleHistory.map((r) => (
                              <div key={r.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {r.status === 'completed' ? (
                                      <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {r.winner_name || 'Winner'}</span>
                                    ) : (
                                      <span className="text-gray-500">{r.status === 'skipped_empty' ? 'No entrants' : r.status}</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{r.period} · pool of {r.pool_size} · {r.texts_sent} text{r.texts_sent === 1 ? '' : 's'} sent</p>
                                </div>
                                {r.reward && r.status === 'completed' && (
                                  <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full max-w-[40%] truncate">{r.reward}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button onClick={() => setReviewStep(3)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setReviewStep(5)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm font-medium">
                          Skip for now
                        </button>
                        <button
                          onClick={() => saveReviewConfig({ next: 5 })}
                          className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition inline-flex items-center gap-2 text-sm"
                        >
                          {configSaved ? <><Check className="w-4 h-4" /> Saved!</> : <>Save &amp; Finish <ChevronRight className="w-4 h-4" /></>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Results */}
                {reviewStep === 5 && (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Your Review Requests</h3>
                      <p className="text-gray-500 mt-1">Everything sent, clicked, and completed — updated as requests go out</p>
                    </div>

                    <div className="space-y-6">
                      {/* Live status strip */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className={`flex-1 rounded-xl border-2 p-4 flex items-center gap-3 ${reviewConfig.autoSendEnabled && reviewLink ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                          {reviewConfig.autoSendEnabled && reviewLink ? (
                            <>
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                              <p className="text-sm font-medium text-green-800">Review automation is active{assignedPhone ? ` — texting from ${assignedPhone}` : ''}</p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <p className="text-sm font-medium text-amber-800">
                                {!reviewLink ? 'Add your Google review link to activate.' : 'Auto-send is turned off — no requests will go out.'}
                              </p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={fetchReviewRequests}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingRequests ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Send className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-medium text-blue-900">Total Sent</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600">{reviewRequests.filter((r) => r.status === 'sent').length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <p className="text-sm font-medium text-green-900">Completed</p>
                          </div>
                          <p className="text-3xl font-bold text-green-600">{reviewRequests.filter((r) => r.review_completed).length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm font-medium text-yellow-900">Pending</p>
                          </div>
                          <p className="text-3xl font-bold text-yellow-600">{reviewRequests.filter((r) => r.status === 'sent' && !r.review_completed).length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                            <p className="text-sm font-medium text-amber-900">Success Rate</p>
                          </div>
                          <p className="text-3xl font-bold text-amber-600">
                            {reviewRequests.filter((r) => r.status === 'sent').length > 0
                              ? Math.round((reviewRequests.filter((r) => r.review_completed).length / reviewRequests.filter((r) => r.status === 'sent').length) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">Filter:</span>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'sent', label: 'Sent' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'failed', label: 'Failed' }
                          ].map((filter) => (
                            <button
                              key={filter.value}
                              onClick={() => setFilterStatus(filter.value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                filterStatus === filter.value
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bookings that didn't produce a text, and why */}
                      {reviewDiagnostics.some(b => b.diagnostic_status !== 'sent') && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                            <p className="text-sm font-bold text-gray-900">Recent jobs with no review text</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Why each one hasn't gone out — last 30 days
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                            {reviewDiagnostics.filter(b => b.diagnostic_status !== 'sent').map(b => (
                              <div key={b.booking_id} className="px-5 py-3 flex items-start gap-3">
                                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                  b.diagnostic_status === 'blocked' ? 'bg-red-500'
                                  : b.diagnostic_status === 'waiting' ? 'bg-amber-400'
                                  : 'bg-gray-300'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {b.customer_name || 'No customer on the booking'}
                                    <span className="ml-2 text-xs font-normal text-gray-400">
                                      {new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-600 mt-0.5">{b.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Requests List */}
                      {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                          <span className="ml-3 text-gray-600">Loading review requests...</span>
                        </div>
                      ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <Send className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">No review requests found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {reviewLink
                              ? 'Mark bookings as completed to start automated review campaigns'
                              : 'Set up your Google review link in step 2 to enable automated review requests'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredRequests.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-gray-900">{request.customer_name}</h4>
                                    {request.review_completed ? (
                                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Review Completed
                                      </span>
                                    ) : request.status === 'sent' ? (
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Send className="w-3 h-3" />
                                        Sent
                                      </span>
                                    ) : request.status === 'failed' ? (
                                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <XCircle className="w-3 h-3" />
                                        Failed
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                    <div>
                                      <p className="text-gray-500">Service</p>
                                      <p className="font-medium text-gray-900">{request.service_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Scheduled Send</p>
                                      <p className="font-medium text-gray-900">
                                        {formatDate(request.scheduled_send_time)}{' '}
                                        <span className="text-gray-500 text-xs">
                                          {formatTime(request.scheduled_send_time)}
                                        </span>
                                      </p>
                                    </div>
                                    {request.actual_send_time && (
                                      <div>
                                        <p className="text-gray-500">Actually Sent</p>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(request.actual_send_time)}{' '}
                                          <span className="text-gray-500 text-xs">
                                            {formatTime(request.actual_send_time)}
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                    {request.review_completed_at && (
                                      <div>
                                        <p className="text-gray-500">Review Completed</p>
                                        <p className="font-medium text-green-700">
                                          {formatDate(request.review_completed_at)}{' '}
                                          <span className="text-gray-500 text-xs">
                                            {formatTime(request.review_completed_at)}
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 mt-3 text-sm">
                                    {request.sms_sent && (
                                      <div className="flex items-center gap-1 text-blue-600">
                                        <Phone className="w-4 h-4" />
                                        <span>SMS Sent</span>
                                      </div>
                                    )}
                                    {request.email_sent && (
                                      <div className="flex items-center gap-1 text-amber-600">
                                        <Mail className="w-4 h-4" />
                                        <span>Email Sent</span>
                                      </div>
                                    )}
                                    {request.link_clicked && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Link Clicked</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {request.incentive_code && (
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Incentive Code</p>
                                    <p className="font-mono font-bold text-amber-600 text-lg">
                                      {request.incentive_code}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button onClick={() => setReviewStep(4)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" /> Back to Raffle
                      </button>
                      <button onClick={() => setReviewStep(0)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" /> Restart Setup Guide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works - Only show on Reply Generator tab */}
      {activeTab === 'reply-generator' && (
        <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg mb-4">How It Works</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      1
                    </div>
                    <p className="text-gray-700 text-sm">
                      Open your <strong>Google Business Profile</strong> at business.google.com
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      2
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Copy the review text</strong> from a customer review
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      3
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Paste it here</strong>, select the star rating, and add the customer's name
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      4
                    </div>
                    <p className="text-gray-700 text-sm">
                      Click <strong>"Generate AI Reply"</strong> and watch the magic happen! ✨
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      5
                    </div>
                    <p className="text-gray-700 text-sm">
                      Review the AI response, click <strong>"Copy to Clipboard"</strong>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      6
                    </div>
                    <p className="text-gray-700 text-sm">
                      <strong>Paste the reply</strong> back in Google Business Profile and post! 🎉
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border-2 border-green-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-900">
                    Saves you 5-10 minutes per review reply — that's 90% faster than writing manually!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
