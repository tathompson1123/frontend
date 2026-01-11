import { 
  ArrowLeft, 
  Sparkles, 
  Save,
  Send,
  Loader2,
  Monitor,
  Smartphone,
  X,
  MessageCircle,
  Undo2,
  Redo2
} from 'lucide-react';
import VisualEditor from './VisualEditor';

export default function WebsiteEditor() {
  const navigate = useNavigate();
  const [allPages, setAllPages] = useState({});
  const [currentPage, setCurrentPage] = useState('index.html');
  const [isSaving, setIsSaving] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
const [historyIndex, setHistoryIndex] = useState(-1);
  
  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

useEffect(() => {
  const handleKeyboard = (e) => {
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    
    // Ctrl+Y or Cmd+Shift+Z for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
    }
  };

  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, [historyIndex, history]);
  
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
      let pages;
      if (data.website.pages) {
        pages = data.website.pages;
        setAllPages(pages);
        setCurrentPage('index.html');
      } else {
        pages = { 'index.html': data.website.html_content };
        setAllPages(pages);
        setCurrentPage('index.html');
      }
      
      // Initialize history with first state
      setHistory([pages]);
      setHistoryIndex(0);
      
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI website editor. Tell me what you'd like to change!\n\nExamples:\n• \"Change the hero text\"\n• \"Make the button blue\"\n• \"Add a services section\""
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
          content: data.message || "I've made the changes! Check the preview."
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I couldn't make that change. Try rephrasing?"
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

  const handleVisualUpdate = (updatedHTML) => {
  const newPages = {
    ...allPages,
    [currentPage]: updatedHTML
  };
  
  setAllPages(newPages);
  
  // Add to history
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newPages);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

const handleUndo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    setAllPages(history[historyIndex - 1]);
  }
};

const handleRedo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1);
    setAllPages(history[historyIndex + 1]);
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
      
      navigate('/dashboard?tab=website');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save website');
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
  <div className="flex items-center gap-6 flex-1 overflow-x-auto">
    <button
      type="button"
      onClick={() => navigate('/dashboard?tab=website')}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition flex-shrink-0"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium hidden md:inline">Back</span>
    </button>
    
    <div className="h-6 w-px bg-gray-300 hidden md:block" />
    
    {/* Desktop - Full Controls */}
    <div className="hidden lg:flex items-center gap-4 flex-1">
      <h1 className="text-lg font-bold text-gray-900">Editing:</h1>
      
      {/* Page Tabs */}
      <div className="flex gap-2">
        {Object.keys(allPages).map((pageName) => (
          <button
            key={pageName}
            onClick={() => setCurrentPage(pageName)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === pageName
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getPageDisplayName(pageName)}
          </button>
        ))}
      </div>
      
      {/* Device Preview Toggle */}
      <div className="h-6 w-px bg-gray-300" />
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => setDevicePreview('desktop')} 
          className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
            devicePreview === 'desktop' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Desktop</span>
        </button>
        <button 
          type="button" 
          onClick={() => setDevicePreview('mobile')} 
          className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
            devicePreview === 'mobile' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile</span>
        </button>
      </div>

    {/* Mobile - Compact Logo + Menu */}
    <div className="flex lg:hidden items-center gap-4 flex-1">
      <h1 className="text-lg font-bold text-gray-900 flex-shrink-0">Editor</h1>
      
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="ml-auto p-2 hover:bg-gray-100 rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>

  <button
    type="button"
    onClick={handleSave}
    disabled={isSaving}
    className="px-4 lg:px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 flex-shrink-0 ml-4"
  >
    {isSaving ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Save className="w-4 h-4" />
    )}
    <span className="hidden md:inline">Save Changes</span>
  </button>
</header>

{/* Mobile Dropdown Menu */}
{isMobileMenuOpen && (
  <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-4 z-10">
    {/* Page Tabs */}
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">PAGE</label>
      <div className="flex flex-wrap gap-2">
        {Object.keys(allPages).map((pageName) => (
          <button
            key={pageName}
            onClick={() => {
              setCurrentPage(pageName);
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              currentPage === pageName
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {getPageDisplayName(pageName)}
          </button>
        ))}
      </div>
    </div>

    {/* Device Toggle */}
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">PREVIEW</label>
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => setDevicePreview('desktop')} 
          className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-2 ${
            devicePreview === 'desktop' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Desktop</span>
        </button>
        <button 
          type="button" 
          onClick={() => setDevicePreview('mobile')} 
          className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-2 ${
            devicePreview === 'mobile' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile</span>
        </button>
      </div>
    </div>
    
     {/* Main Content */}
<div className="flex-1 flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200">
  
  {/* Undo/Redo Buttons - Top Left Above Preview */}
  <div className="absolute top-4 left-4 z-30 flex gap-2">
    <button
      onClick={handleUndo}
      disabled={historyIndex <= 0}
      className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Undo (Ctrl+Z)"
    >
      <Undo2 className="w-5 h-5 text-gray-700" />
    </button>
    <button
      onClick={handleRedo}
      disabled={historyIndex >= history.length - 1}
      className="p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Redo (Ctrl+Y)"
    >
      <Redo2 className="w-5 h-5 text-gray-700" />
    </button>
  </div>
  
        {/* Centered Preview */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ 
  width: devicePreview === 'desktop' ? '100%' : '375px',
  height: devicePreview === 'desktop' ? '100%' : '667px'
}}>
  {devicePreview === 'desktop' ? (
    <VisualEditor 
      htmlContent={allPages[currentPage]}
      onUpdate={handleVisualUpdate}
      currentPage={currentPage}
    />
  ) : (
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
                            
                            if (href && href.endsWith('.html') && allPages[href]) {
                              e.preventDefault();
                              setCurrentPage(href);
                              return;
                            }
                            
                            e.preventDefault();
                          }
                        }, true);
                      } catch (err) {
                        console.log('Could not access iframe:', err);
                      }
                    };
                  }
                }}
              />
            )
          ) : (
           <div className="w-full h-full flex items-center justify-center bg-gray-100">
  <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] shadow-2xl p-3 border-[14px] border-gray-900">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
    <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-11 bg-white z-10 flex items-center justify-between px-6 text-xs font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          <span>100%</span>
        </div>
      </div>
      <div className="absolute top-[92px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden">
  <iframe
    key={currentPage + '-mobile'}
    srcDoc={allPages[currentPage]}
    title={`${currentPage} Mobile Preview`}
    className="border-none"
    style={{ 
      width: '375px',
      minWidth: '375px',
      height: '100%',
      minHeight: '100%'
    }}
    ref={(iframe) => {
      if (iframe && iframe.contentWindow) {
        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentWindow.document;
            
            // Add viewport meta tag to force mobile width
            const viewport = iframeDoc.querySelector('meta[name="viewport"]');
            if (!viewport) {
              const meta = iframeDoc.createElement('meta');
              meta.name = 'viewport';
              meta.content = 'width=375, initial-scale=1, maximum-scale=1, user-scalable=no';
              iframeDoc.head.appendChild(meta);
            }
            
            iframeDoc.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              if (link) {
                const href = link.getAttribute('href');
                
                if (href && href.startsWith('#')) {
                  return;
                }
                
                if (href && href.endsWith('.html') && allPages[href]) {
                  e.preventDefault();
                  setCurrentPage(href);
                  return;
                }
                
                e.preventDefault();
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
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50"></div>
  </div>
</div>
          )}
        </div>

        {/* AI Chat Widget */}
        {!isAIChatOpen ? (
          /* Collapsed - Floating Button */
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all z-50 flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span className="font-semibold">AI Assistant</span>
          </button>
        ) : (
          /* Expanded - Chat Widget */
          <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
            {/* Widget Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsAIChatOpen(false)}
                className="p-1 hover:bg-white rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isAIThinking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    <p className="text-xs text-gray-600">AI is thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask AI to make changes..."
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  disabled={isAIThinking}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isAIThinking}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Try: "Make the button blue"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
