import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Save,
  Send,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function WebsiteEditor() {
  const navigate = useNavigate();
  const [allPages, setAllPages] = useState({});
  const [currentPage, setCurrentPage] = useState('index.html');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  
  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
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
        if (data.website.pages) {
          setAllPages(data.website.pages);
          setCurrentPage('index.html');
        } else {
          setAllPages({ 'index.html': data.website.html_content });
          setCurrentPage('index.html');
        }
        
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
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAIThinking(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/website/ai-edit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentHTML: allPages[currentPage],
          userRequest: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setAllPages(prev => ({
          ...prev,
          [currentPage]: data.updatedHTML
        }));
        
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
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/api/website`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          htmlContent: allPages['index.html'],
          pages: allPages
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

  const getPageDisplayName = (filename) => {
    return filename
      .replace('.html', '')
      .replace('-', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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
          
          <div className="bg-purple-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-purple-700">
              Editing: {getPageDisplayName(currentPage)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Preview - Full Width */}
        <div className="flex-1 flex flex-col bg-gray-100 relative">
          <div className="flex-1 overflow-auto p-4">
            <div className="h-full w-full max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden h-full">
                <iframe
                  key={currentPage}
                  srcDoc={allPages[currentPage]}
                  title={`${currentPage} Preview`}
                  className="w-full h-full border-none"
                  ref={(iframe) => {
                    if (iframe && iframe.contentWindow) {
                      iframe.onload = () => {
                        try {
                          const iframeDoc = iframe.contentWindow.document;
                          
                          iframeDoc.addEventListener('click', (e) => {
                            const link = e.target.closest('a');
                            if (link) {
                              const href = link.getAttribute('href');
                              
                              if (href && href.startsWith('#')) {
                                return;
                              }
                              
                              if (href && href.endsWith('.html')) {
                                console.log('🔍 Checking if page exists in allPages...');
                                console.log('   allPages[href]:', allPages[href] ? 'EXISTS' : 'DOES NOT EXIST');
                                
                                if (allPages[href]) {
                                  e.preventDefault();
                                  setCurrentPage(href);
                                  console.log('✅ Switched to page:', href);
                                  return;
                                }
                              }
                              
                              e.preventDefault();
                              console.log('🚫 Navigation blocked:', href);
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
            </div>
          </div>
        </div>

        {/* Right Sidebar - Page Tabs (Vertical) */}
        <div className="w-20 bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-3 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Pages
          </div>
          {Object.keys(allPages).map((pageName) => (
            <button
              key={pageName}
              onClick={() => setCurrentPage(pageName)}
              className={`w-14 h-14 rounded-lg text-xs font-medium transition flex items-center justify-center text-center leading-tight p-1 ${
                currentPage === pageName
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={getPageDisplayName(pageName)}
            >
              {getPageDisplayName(pageName)}
            </button>
          ))}
        </div>

        {/* AI Panel - Collapsible from Left */}
        <div
          className={`absolute left-0 top-0 bottom-0 bg-white border-r border-gray-200 shadow-2xl transition-all duration-300 z-20 ${
            isAIPanelOpen ? 'w-96' : 'w-0'
          }`}
        >
          {isAIPanelOpen && (
            <div className="w-96 h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="font-bold text-gray-900">AI Editor</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Tell me what changes you'd like to make to {getPageDisplayName(currentPage)}
                </p>
              </div>

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
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-r-lg shadow-lg hover:shadow-xl transition-all z-30 ${
            isAIPanelOpen ? 'translate-x-96' : 'translate-x-0'
          }`}
          title={isAIPanelOpen ? 'Close AI Editor' : 'Open AI Editor'}
        >
          {isAIPanelOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
