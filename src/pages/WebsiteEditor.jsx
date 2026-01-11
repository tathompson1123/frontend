import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Save,
  Send,
  Loader2
} from 'lucide-react';

export default function WebsiteEditor() {
  const navigate = useNavigate();
  const [currentWebsite, setCurrentWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load website on mount
  useEffect(() => {
    fetchWebsite();
  }, []);

  const fetchWebsite = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/api/website`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.website) {
      setCurrentWebsite(data.website.html_content);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI website editor. I can help you make changes to your website. Just tell me what you'd like to change!\n\nFor example:\n• \"Change the hero text to 'Welcome to our shop'\"\n• \"Make the button blue\"\n• \"Add a new section about our services\""
      }]);
    }
  } catch (error) {
    console.error('Error fetching website:', error);
  }
};

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAIThinking) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAIThinking(true);

    try {
      // Call AI API to modify website
      const response = await fetch(`${apiUrl}/api/website/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentHTML: currentWebsite,
          userRequest: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update website with AI changes
        setCurrentWebsite(data.updatedHTML);
        
        // Add AI response to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || "I've made the changes you requested! Check the preview on the right."
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I couldn't make that change. Can you try rephrasing your request?"
        }]);
      }
    } catch (error) {
      console.error('AI edit error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong. Please try again."
      }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${apiUrl}/api/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          htmlContent: currentWebsite
        })
      });
      alert('Website saved successfully! ✅');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save website');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard?tab=website')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-bold text-gray-900">Website Editor</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Chat */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">AI Editor Assistant</h2>
            </div>
            <p className="text-sm text-gray-600">
              Tell me what changes you'd like to make
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isAIThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <p className="text-sm text-gray-600">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe the changes you want..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                disabled={isAIThinking}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isAIThinking}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Try: "Change the headline" or "Make the button green"
            </p>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 overflow-auto p-4">
            <div className="h-full w-full max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden h-full">
                <iframe
                  srcDoc={currentWebsite}
                  title="Website Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin"
                  ref={(iframe) => {
                    if (iframe && iframe.contentWindow) {
                      iframe.onload = () => {
                        try {
                          const iframeDoc = iframe.contentWindow.document;
                            
                            // Allow same-page navigation, prevent external navigation
                            iframeDoc.addEventListener('click', (e) => {
                              const link = e.target.closest('a');
                              if (link) {
                                const href = link.getAttribute('href');
                                
                                // Allow anchor links (same-page navigation like #services, #about)
                                if (href && href.startsWith('#')) {
                                  e.stopPropagation(); // Let the default anchor behavior work
                                  return;
                                }
                                
                                // Prevent external navigation
                                e.preventDefault();
                                console.log('External navigation prevented:', href);
                              }
                              
                              // Prevent form submissions
                              const form = e.target.closest('form');
                              if (form) {
                                e.preventDefault();
                                console.log('Form submission prevented in preview');
                              }
                            }, true);
                          } catch (err) {
                            console.log('Could not access iframe:', err);
                          }
                        };
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-mono">HTML Source</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentWebsite);
                        alert('Code copied to clipboard!');
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Copy Code
                    </button>
                  </div>
                  <textarea
                    value={currentWebsite}
                    onChange={(e) => setCurrentWebsite(e.target.value)}
                    className="flex-1 w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none resize-none"
                    spellCheck="false"
                  />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
