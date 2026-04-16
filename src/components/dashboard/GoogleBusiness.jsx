import { useState, useEffect } from 'react';
import {
  Sparkles, Star, RefreshCw, Copy, CheckCircle, MessageSquare,
  Calendar, TrendingUp, Clock, Users, BarChart3, Send, Mail,
  Phone, ExternalLink, CheckCircle2, XCircle, Loader2, Info, AlertCircle,
  Link as LinkIcon, Search, Globe
} from 'lucide-react';
import GBPAnalyzer from './GBPAnalyzer';

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
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [reviewLink, setReviewLink] = useState('');
  const [savingReviewLink, setSavingReviewLink] = useState(false);
  const [showLinkInfo, setShowLinkInfo] = useState(false);
  const [assignedPhone, setAssignedPhone] = useState(null);
  const [reviewSettingsTab, setReviewSettingsTab] = useState('customization');

  useEffect(() => {
  fetchStats();
  fetchUserReviewLink();
  loadReviewConfig();
  if (activeTab === 'review-requests') {
    fetchReviewRequests();
  }
}, [activeTab]);

  const [reviewConfig, setReviewConfig] = useState({
  messageTemplate: "Hi {{name}}! Thank you for choosing {{business}}. We'd love to hear about your experience! Could you take a moment to leave us a review?",
  incentive: "$10 off your next service",
  incentiveEnabled: true,
  autoSendEnabled: true,
  sendDelay: 2,
  sendTrigger: 'booking_completed'
});

  const fetchUserReviewLink = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`);
      const data = await response.json();
      if (data.user?.google_review_link) {
        setReviewLink(data.user.google_review_link);
      }
      setAssignedPhone(data.user?.twilio_phone_number || null);
    } catch (error) {
      console.error('Error fetching review link:', error);
    }
  };

  const handleSaveReviewLink = async () => {
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
        alert('✅ Google review link saved! Your review automation is now active.');
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
          sendTrigger: data.config.send_trigger || 'booking_completed'
        });
      }
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
};

const saveReviewConfig = async () => {
  try {
    const response = await authFetch(`${apiUrl}/api/review-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewConfig)
    });
    
    if (response.ok) {
      alert('✅ Review request settings saved!');
    } else {
      alert('Failed to save settings');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    alert('Failed to save settings');
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

          {/* REVIEW REQUESTS TAB */}
          {activeTab === 'review-requests' && (
            <div className="space-y-6">

              {/* Assigned Business Phone Number */}
              <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${assignedPhone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${assignedPhone ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">SMS Agent Number</p>
                  {assignedPhone ? (
                    <>
                      <p className="text-lg font-bold text-green-700 tracking-wide mt-0.5">{assignedPhone}</p>
                      <p className="text-xs text-gray-500 mt-1">Review request SMS messages are sent from this number. Customers can reply to this number and your AI agent will respond.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mt-0.5">No number assigned yet.</p>
                      <p className="text-xs text-gray-400 mt-1">A dedicated phone number is provisioned when you upgrade to a Pro plan, so review requests come from a consistent local number.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Setup Section */}
              {!reviewLink && (
                <div className="bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-blue-300 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Setup Required: Connect Your Google Business Profile</h3>
                      <p className="text-gray-700 mb-4">
                        To enable automated review requests, paste your Google review link below. This allows us to send 
                        customers a direct link to leave reviews on your Google Business Profile.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Review Link Input */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-6 h-6 text-amber-600" />
                    <h3 className="text-lg font-bold text-gray-900">Google Review Link Setup</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLinkInfo(!showLinkInfo)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm font-medium"
                  >
                    <Info className="w-4 h-4" />
                    How to Get This Link
                  </button>
                </div>

                {showLinkInfo && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      How to Get Your Google Review Link
                    </h4>
                    <ol className="space-y-2 text-sm text-blue-900">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Business Profile</a></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <span>Click on your business</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">3.</span>
                        <span>Go to the <strong>"Home"</strong> tab</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">4.</span>
                        <span>Look for <strong>"Get more reviews"</strong> and click <strong>"Share review form"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">5.</span>
                        <span>Click <strong>"Copy"</strong> to copy the short link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">6.</span>
                        <span>Paste it in the field below</span>
                      </li>
                    </ol>
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-xs font-medium text-blue-900 mb-1">Example review links:</p>
                      <p className="font-mono text-xs text-blue-700 mb-1">https://g.page/r/...</p>
                      <p className="font-mono text-xs text-blue-700">https://search.google.com/local/writereview?placeid=...</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Review Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={reviewLink}
                      onChange={(e) => setReviewLink(e.target.value)}
                      placeholder="https://g.page/r/... or https://search.google.com/local/writereview?placeid=..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the link customers will click to leave a review
                    </p>
                  </div>

                  {reviewLink && (
                    <div className="flex gap-2">
                      <a
                        href={reviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2 font-medium"
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
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2 font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveReviewLink}
                    disabled={savingReviewLink || !reviewLink.trim()}
                    className="w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingReviewLink ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Save & Activate Review Automation
                      </>
                    )}
                  </button>
                </div>
              </div>

{/* Review Request Settings — organized with sub-tabs */}
{reviewLink && (
  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Review Request Settings</h3>
        <p className="text-sm text-gray-600 mt-1">Customize your review automation</p>
      </div>
      <button
        onClick={saveReviewConfig}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        Save Settings
      </button>
    </div>

    {/* Sub-tabs within Review Request Settings */}
    {/* Mobile dropdown */}
    <div className="md:hidden mb-4">
      <select
        value={reviewSettingsTab}
        onChange={e => setReviewSettingsTab(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 shadow-sm"
      >
        <option value="customization">Customization</option>
        <option value="timeline">Timeline</option>
        <option value="metrics">Metrics</option>
      </select>
    </div>
    {/* Desktop tabs */}
    <div className="hidden md:flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
      {[
        { id: 'customization', label: 'Customization' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'metrics', label: 'Metrics' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setReviewSettingsTab(tab.id)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition ${
            reviewSettingsTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Timeline sub-tab */}
    {reviewSettingsTab === 'timeline' && (
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
            <CheckCircle className="w-4 h-4" />
            <strong>This 5-step sequence maximizes review completion while minimizing costs (1 SMS + 4 emails)</strong>
          </p>
        </div>
      </div>
    )}

    {/* Customization sub-tab */}
    {reviewSettingsTab === 'customization' && (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
            <textarea
              value={reviewConfig.messageTemplate}
              onChange={(e) => setReviewConfig({ ...reviewConfig, messageTemplate: e.target.value })}
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter your review request message..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Available variables: <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{business}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{service}}'}</code>
            </p>
          </div>
          {/* Dual iPhone preview */}
          {(() => {
            const bizName = user?.businessName || user?.business_name || 'Your Business';
            const previewMsg = reviewConfig.messageTemplate
              .replace(/\{\{name\}\}|\{name\}/g, 'John')
              .replace(/\{\{business\}\}|\{business\}/g, bizName)
              .replace(/\{\{service\}\}|\{service\}/g, 'Full Detail');
            const msgEndsWithPunct = /[.!?]$/.test(previewMsg.trimEnd());
            const msgWithPunct = msgEndsWithPunct ? previewMsg : previewMsg.trimEnd() + '.';
            return (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* SMS iPhone */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">SMS Preview</p>
                  <div className="mx-auto w-44">
                    <div className="bg-gray-900 rounded-[2rem] p-2 shadow-xl">
                      <div className="bg-black rounded-[1.6rem] overflow-hidden">
                        <div className="bg-black flex justify-center pt-2 pb-1">
                          <div className="w-16 h-3.5 bg-gray-900 rounded-full" />
                        </div>
                        <div className="bg-gray-100 min-h-[280px] px-2 py-3 flex flex-col">
                          <p className="text-center text-gray-400 text-[8px] mb-2">Today</p>
                          {/* sender name */}
                          <p className="text-center text-[8px] font-semibold text-gray-600 mb-2">{bizName}</p>
                          <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-tl-sm px-2.5 py-2 max-w-full shadow-sm space-y-1.5">
                              <p className="text-[9px] text-gray-900 leading-relaxed break-words">
                                {msgWithPunct}
                                {reviewConfig.incentiveEnabled && reviewConfig.incentive
                                  ? ` ${reviewConfig.incentive}${/[.!?]$/.test(reviewConfig.incentive.trimEnd()) ? '' : '.'}`
                                  : ''}
                              </p>
                              {/* Review link as a tappable row, not inline text */}
                              <div className="border-t border-gray-100 pt-1.5">
                                <p className="text-[8px] text-gray-500 mb-0.5">Leave your review here:</p>
                                <p className="text-[8px] text-blue-500 font-medium break-all">
                                  {reviewLink ? 'g.page/r/your-business ↗' : '[your Google review link]'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email iPhone */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">Email Preview</p>
                  <div className="mx-auto w-44">
                    <div className="bg-gray-900 rounded-[2rem] p-2 shadow-xl">
                      <div className="bg-black rounded-[1.6rem] overflow-hidden">
                        <div className="bg-black flex justify-center pt-2 pb-1">
                          <div className="w-16 h-3.5 bg-gray-900 rounded-full" />
                        </div>
                        <div className="bg-white min-h-[280px] flex flex-col">
                          {/* Mail app top bar */}
                          <div className="bg-gray-50 px-2 py-1.5 flex items-center justify-between border-b border-gray-200">
                            <span className="text-[8px] text-blue-500 font-medium">‹ Inbox</span>
                            <span className="text-[8px] text-gray-400">⋯</span>
                          </div>
                          {/* From / To / Subject */}
                          <div className="px-2 py-1.5 border-b border-gray-100 space-y-0.5">
                            <p className="text-[8px] text-gray-500"><span className="font-semibold text-gray-700">From:</span> {bizName}</p>
                            <p className="text-[8px] text-gray-500"><span className="font-semibold text-gray-700">To:</span> john@example.com</p>
                            <p className="text-[8px] font-semibold text-gray-800 truncate">How was your experience?</p>
                          </div>
                          {/* Body */}
                          <div className="px-2 py-2 flex-1 space-y-2">
                            <p className="text-[8px] text-gray-700 leading-relaxed">
                              Hi John,
                            </p>
                            <p className="text-[8px] text-gray-700 leading-relaxed">
                              {msgWithPunct}
                            </p>
                            {reviewConfig.incentiveEnabled && reviewConfig.incentive && (
                              <p className="text-[8px] text-green-700 font-semibold">
                                🎁 {reviewConfig.incentive}
                              </p>
                            )}
                            {/* CTA button */}
                            <div className="bg-blue-600 rounded-md px-2 py-1.5 text-center mt-1">
                              <p className="text-[8px] text-white font-bold">⭐ Leave a Review</p>
                            </div>
                            <p className="text-[7px] text-gray-400 pt-1">
                              You're receiving this because you recently used {bizName}. Reply STOP to unsubscribe.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incentive Offer</label>
              <input type="text" value={reviewConfig.incentive} onChange={(e) => setReviewConfig({ ...reviewConfig, incentive: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., $10 off your next service" />
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-amber-700 font-semibold">🔥 The more compelling the offer, the more reviews you'll get.</p>
                <p className="text-xs text-gray-500">Strong examples:</p>
                <ul className="text-xs text-gray-500 space-y-0.5 ml-2">
                  <li>• "Enter to win a FREE full car detail — one winner every month!"</li>
                  <li>• "Leave a review and get your next oil change FREE"</li>
                  <li>• "Review us this week and we'll upgrade your next visit at no charge"</li>
                  <li>• "Every review enters you in our monthly $100 gift card raffle"</li>
                </ul>
              </div>
            </div>
          )}
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
          {reviewConfig.autoSendEnabled && (
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
          )}
          <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-medium text-gray-900 mb-3">💡 Pro Tips:</p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li>• 2 hours after service is the sweet spot — customers still remember the experience</li>
              <li>• Personalize with customer names — first-name texts get far higher response rates</li>
              <li>• Always include your Google review link so customers can tap straight to it</li>
              <li>• Keep incentives short and clear — "10% off your next visit" beats a long offer</li>
              <li>• Use the "service duration ends" trigger to send hands-free, no manual steps needed</li>
            </ul>
          </div>
        </div>
      </div>
    )}

    {/* Metrics sub-tab */}
    {reviewSettingsTab === 'metrics' && (
      <div className="space-y-6">
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
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
                : 'Set up your Google review link above to enable automated review requests'
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
    )}

  </div>
)}
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
