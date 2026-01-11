import { useState, useEffect } from 'react';
import { 
  Sparkles, Star, RefreshCw, Copy, CheckCircle, MessageSquare,
  Calendar, TrendingUp, Clock, Users, BarChart3, Send, Mail, 
  Phone, ExternalLink, CheckCircle2, XCircle, Loader2, Info, AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

export default function GoogleBusiness({ apiUrl, user, authFetch }) {
  const [activeTab, setActiveTab] = useState('reply-generator');
  
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

  useEffect(() => {
    fetchStats();
    fetchUserReviewLink();
    if (activeTab === 'review-requests') {
      fetchReviewRequests();
    }
  }, [activeTab]);

  const fetchUserReviewLink = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`);
      const data = await response.json();
      if (data.user?.google_review_link) {
        setReviewLink(data.user.google_review_link);
      }
    } catch (error) {
      console.error('Error fetching review link:', error);
    }
  };

  const handleSaveReviewLink = async () => {
    if (!reviewLink.trim()) {
      alert('Please enter your Google review link');
      return;
    }

    // Validate it's a Google review link
    if (!reviewLink.includes('google.com') || !reviewLink.includes('review')) {
      alert('Please enter a valid Google review link. It should contain "google.com" and "review".');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Google Business Profile</h2>
        <p className="text-gray-600 mt-1">Manage reviews and automate customer feedback</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('reply-generator')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'reply-generator'
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>AI Reply Generator</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('review-requests')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'review-requests'
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span>Review Requests</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Copy the review from Google Business Profile and paste it here
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReviewReply}
                    disabled={!reviewText.trim() || isGeneratingReply}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                      <h4 className="font-bold text-gray-900 text-lg">Your AI-Generated Reply</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg mb-4 border border-purple-100">
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
                        className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
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
                        className="flex-1 bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
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
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900">This Week</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{repliesGeneratedWeek}</p>
                    <p className="text-xs text-purple-700 mt-1">replies generated</p>
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
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
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

                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 shadow-lg text-white">
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
              {/* Setup Section */}
              {!reviewLink && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6">
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
                    <LinkIcon className="w-6 h-6 text-purple-600" />
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-sm"
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
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Total Sent</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {reviewRequests.filter((r) => r.status === 'sent').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Completed</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {reviewRequests.filter((r) => r.review_completed).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">Pending</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">
                    {reviewRequests.filter((r) => r.status === 'sent' && !r.review_completed).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Success Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {reviewRequests.filter((r) => r.status === 'sent').length > 0
                      ? Math.round(
                          (reviewRequests.filter((r) => r.review_completed).length /
                            reviewRequests.filter((r) => r.status === 'sent').length) *
                            100
                        )
                      : 0}
                    %
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
                          ? 'bg-purple-600 text-white'
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
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
                              <div className="flex items-center gap-1 text-purple-600">
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
                            <p className="font-mono font-bold text-purple-600 text-lg">
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
      </div>

      {/* How It Works - Only show on Reply Generator tab */}
      {activeTab === 'reply-generator' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
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
