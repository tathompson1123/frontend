import { useState, useEffect } from 'react';
import { 
  Sparkles, Star, RefreshCw, Copy, CheckCircle, MessageSquare,
  Calendar, TrendingUp, Clock, Users, BarChart3
} from 'lucide-react';

export default function GoogleBusiness({ apiUrl, user, authFetch }) {
  const [reviewCustomerName, setReviewCustomerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repliesGeneratedToday, setRepliesGeneratedToday] = useState(0);
  const [repliesGeneratedWeek, setRepliesGeneratedWeek] = useState(0);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

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
        // Refresh stats after generating
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

  return (
    <div className="space-y-6">
      {/* Rest of your component stays the same */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Google Business Profile</h2>
        <p className="text-gray-600 mt-1">AI-powered review response generator</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">AI Review Reply Generator</h3>
                <p className="text-sm text-gray-600">Generate professional responses in seconds</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={reviewCustomerName} onChange={(e) => setReviewCustomerName(e.target.value)} placeholder="John Smith" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="focus:outline-none transition hover:scale-110">
                      <Star className={`w-10 h-10 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400'} transition`} />
                    </button>
                  ))}
                  <span className="ml-3 text-gray-700 font-medium">{reviewRating} {reviewRating === 1 ? 'star' : 'stars'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Text</label>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Paste the customer's review here..." rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition resize-none" />
                <p className="text-xs text-gray-500 mt-1">Copy the review from Google Business Profile and paste it here</p>
              </div>

              <button type="button" onClick={handleGenerateReviewReply} disabled={!reviewText.trim() || isGeneratingReply} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                {isGeneratingReply ? (
                  <><RefreshCw className="w-6 h-6 animate-spin" />Generating Your Reply...</>
                ) : (
                  <><Sparkles className="w-6 h-6" />Generate AI Reply</>
                )}
              </button>
            </div>

            {generatedReply && (
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <h4 className="font-bold text-gray-900 text-lg">Your AI-Generated Reply</h4>
                </div>
                <div className="bg-white p-4 rounded-lg mb-4 border border-purple-100">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{generatedReply}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { navigator.clipboard.writeText(generatedReply); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                    {copied ? <><CheckCircle className="w-5 h-5" />Copied!</> : <><Copy className="w-5 h-5" />Copy to Clipboard</>}
                  </button>
                  <button type="button" onClick={handleGenerateReviewReply} className="flex-1 bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" />Regenerate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">Now paste this reply in your Google Business Profile dashboard!</p>
              </div>
            )}
          </div>

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
              <p className="text-3xl font-bold text-green-600">~{Math.round(repliesGeneratedWeek * 5 / 60 * 10) / 10}h</p>
              <p className="text-xs text-green-700 mt-1">this week</p>
            </div>
          </div>
        </div>

        {/* Rest of the component... (keep all the Why Respond section, etc.) */}
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
                    <p className="text-gray-700 text-sm leading-relaxed">Google prioritizes businesses that actively engage with customers. Responding to reviews can improve your local search ranking by up to <strong>35%</strong>.</p>
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
                    <p className="text-gray-700 text-sm leading-relaxed"><strong>89% of consumers</strong> read business responses to reviews. Active engagement makes customers more likely to choose you.</p>
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
                    <p className="text-gray-700 text-sm leading-relaxed"><strong>45% of customers</strong> are more likely to visit a business if it responds to negative reviews constructively.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 shadow-lg text-white">
            <h3 className="text-2xl font-bold mb-6">Impact by the Numbers</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-3xl font-bold">35%</span></div>
                <p className="flex-1 text-sm">Higher ranking in local search results when you respond to reviews</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-3xl font-bold">89%</span></div>
                <p className="flex-1 text-sm">Of consumers read business responses before making a decision</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-3xl font-bold">45%</span></div>
                <p className="flex-1 text-sm">More likely to visit after seeing responses to negative reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-4">How It Works</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div><p className="text-gray-700 text-sm">Open your <strong>Google Business Profile</strong> at business.google.com</p></div>
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div><p className="text-gray-700 text-sm"><strong>Copy the review text</strong> from a customer review</p></div>
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div><p className="text-gray-700 text-sm"><strong>Paste it here</strong>, select the star rating, and add the customer's name</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">4</div><p className="text-gray-700 text-sm">Click <strong>"Generate AI Reply"</strong> and watch the magic happen! ✨</p></div>
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">5</div><p className="text-gray-700 text-sm">Review the AI response, click <strong>"Copy to Clipboard"</strong></p></div>
                <div className="flex gap-3"><div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">6</div><p className="text-gray-700 text-sm"><strong>Paste the reply</strong> back in Google Business Profile and post! 🎉</p></div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-900">Saves you 5-10 minutes per review reply — that's 90% faster than writing manually!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
