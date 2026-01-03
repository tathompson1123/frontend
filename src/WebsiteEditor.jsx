import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Monitor, 
  Smartphone, 
  Send,
  Sparkles,
  Download,
  Loader
} from 'lucide-react';

export default function WebsiteEditor() {
  const [websiteHtml, setWebsiteHtml] = useState('');
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI website assistant. I can help you edit any part of your website. Try asking me things like:\n\n• 'Change the hero headline to [your text]'\n• 'Make the colors more professional'\n• 'Add a testimonial section'\n• 'Change the contact phone number'\n\nWhat would you like to change?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchWebsite();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchWebsite = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/website?userId=${user.id}`);
      const data = await response.json();
      if (data.website) {
        setWebsiteHtml(data.website.html_content);
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsProcessing(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${apiUrl}/api/website/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentHtml: websiteHtml,
          editRequest: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update website preview
        setWebsiteHtml(data.updatedHtml);

        // Add AI response to chat
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.explanation || "I've updated your website! Check the preview on the right." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Sorry, I couldn't make that change. Could you try rephrasing your request?" 
        }]);
      }
    } catch (error) {
      console.error('Error editing website:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oops! Something went wrong. Please try again." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveWebsite = async () => {
    setIsSaving(true);
    try {
      await fetch(`${apiUrl}/api/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          htmlContent: websiteHtml
        })
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Website saved successfully!'
      }]);
    } catch (error) {
      console.error('Error saving website:', error);
      alert('Failed to save website');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([websiteHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.businessName || 'my'}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Website Editor</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Download</span>
          </button>
          <button
            onClick={handleSaveWebsite}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - AI Chat */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-500">Ask me to edit anything</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Updating your website...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me to edit your website..."
                disabled={isProcessing}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !userInput.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Be specific! Example: "Change the hero headline to 'Welcome to {user.businessName}'"
            </p>
          </div>
        </div>

        {/* Right Side - Website Preview */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>Live Preview</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDevicePreview('desktop')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition ${
                  devicePreview === 'desktop'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              <button
                onClick={() => setDevicePreview('mobile')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition ${
                  devicePreview === 'mobile'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div
              className={`mx-auto bg-white shadow-2xl transition-all ${
                devicePreview === 'mobile' ? 'max-w-md' : 'w-full max-w-6xl'
              }`}
              style={{ minHeight: '100%' }}
            >
              {websiteHtml ? (
                <iframe
                  srcDoc={websiteHtml}
                  title="Website Preview"
                  className="w-full h-full border-0"
                  style={{ minHeight: '800px' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading your website...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
