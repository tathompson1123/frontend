import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Save,
  Send,
  Loader2,
  Monitor,
  Smartphone,
  X,
  Undo2,
  Redo2,
  Check,
  Clock
} from 'lucide-react';
import VisualEditor from './VisualEditor';
import WebsiteVersionHistory from '../components/WebsiteVersionHistory';

export default function WebsiteEditor() {
  const navigate = useNavigate();
  const [allPages, setAllPages] = useState({});
  const [currentPage, setCurrentPage] = useState('index.html');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
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

  const handleRestoreVersion = (html_content, pages) => {
  setAllPages(pages || { 'index.html': html_content });
  setCurrentPage('index.html');

    const newPages = pages || { 'index.html': html_content };
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newPages);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
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
    console.log('═══════════════════════════════════');
    console.log('📝 HANDLE VISUAL UPDATE');
    console.log('  - Current historyIndex:', historyIndex);
    console.log('  - Current history length:', history.length);
    console.log('  - Current page:', currentPage);
    console.log('  - Updated HTML length:', updatedHTML?.length);
    
    const newPages = {
      ...allPages,
      [currentPage]: updatedHTML
    };
    
    setAllPages(newPages);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    
    console.log('  - New history length:', newHistory.length);
    console.log('  - New historyIndex will be:', newHistory.length - 1);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log('✅ UPDATE COMPLETE - History updated');
    console.log('═══════════════════════════════════');
  };
  
  const handleUndo = () => {
    console.log('🔙 UNDO CLICKED');
    console.log('  - Current historyIndex:', historyIndex);
    console.log('  - History length:', history.length);
    console.log('  - Can undo?:', historyIndex > 0);
    
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      console.log('  - Going to index:', newIndex);
      console.log('  - Restoring pages:', history[newIndex]);
      
      setHistoryIndex(newIndex);
      setAllPages(history[newIndex]);
      
      console.log('  ✅ Undo complete');
    } else {
      console.log('  ❌ Cannot undo - at beginning of history');
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
    
    // Just save to database - NO auto-publish
    const saveResponse = await fetch(`${apiUrl}/api/website/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        html_content: allPages['index.html'],
        pages: allPages
      })
    });
    
    if (saveResponse.ok) {
      // Mark as unpublished in the backend
      await fetch(`${apiUrl}/api/website/mark-unpublished`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Show success toast
      setShowSaveSuccess(true);
      
      // Wait 1.5 seconds then navigate
      setTimeout(() => {
        navigate('/dashboard?tab=website');
      }, 1500);
    } else {
      throw new Error('Save failed');
    }
    
  } catch (error) {
    console.error('Save error:', error);
    alert('Failed to save website');
    setIsSaving(false);
    setShowSaveSuccess(false);
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
      {/* Success Toast Notification */}
      {showSaveSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <div className="bg-white rounded-full p-1">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold">Changes Saved Successfully!</p>
              <p className="text-sm text-green-100">Returning to dashboard...</p>
            </div>
          </div>
        </div>
      )}

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
    </div>

    {/* Mobile - Compact Logo + Menu */}
    <div className="flex lg:hidden items-center gap-4 flex-1">
      <h1 className="text-lg font-bold text-gray-900 flex-shrink-0">Editor</h1>
      
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

 {/* Action Buttons */}
<div className="flex items-center gap-3 ml-4 flex-shrink-0">
  {/* Version History Button */}
  <button
    type="button"
    onClick={() => setShowVersionHistory(true)}
    className="px-4 lg:px-6 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2"
  >
    <Clock className="w-4 h-4" />
    <span className="hidden md:inline">History</span>
  </button>

  {/* Save Changes Button */}
  <button
    type="button"
    onClick={handleSave}
    disabled={isSaving}
    className="px-4 lg:px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
  >
    {isSaving ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden md:inline">Saving...</span>
      </>
    ) : (
      <>
        <Save className="w-4 h-4" />
        <span className="hidden md:inline">Save Changes</span>
      </>
    )}
  </button>
</div>
</header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-4 z-10">
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
        </div>
      )}
     
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200">
        
       {/* Centered Preview */}
<div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ 
  width: devicePreview === 'desktop' ? '100%' : '375px',
  height: devicePreview === 'desktop' ? '100%' : '667px'
}}>
  {devicePreview === 'desktop' ? (
  allPages[currentPage] ? (
    <VisualEditor 
      htmlContent={allPages[currentPage]}
      onUpdate={handleVisualUpdate}
      currentPage={currentPage}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={historyIndex > 0}
      canRedo={historyIndex < history.length - 1}
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Loading page content...</div>
    </div>
  )
) : (
  <div className="w-full h-full flex flex-col bg-gray-100">
    {/* Mobile Editor Header - Dropdown Menu*/}
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-gray-900">Mobile View</span>
      </div>
      
      {/* Page Dropdown */}
      <select
        value={currentPage}
        onChange={(e) => setCurrentPage(e.target.value)}
        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:border-purple-500 focus:outline-none bg-white"
      >
        {Object.keys(allPages).map((pageName) => (
          <option key={pageName} value={pageName}>
            {getPageDisplayName(pageName)}
          </option>
        ))}
      </select>
      
      <div className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-medium">
        375px
      </div>
    </div>

    {/* Mobile Content - Scrollable Editor */}
    <div className="flex-1 overflow-auto flex justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200">
      <div 
        className="bg-white shadow-2xl" 
        style={{ 
          width: '375px',
          minHeight: '100%'
        }}
      >
        {allPages[currentPage] ? (
          <VisualEditor 
            htmlContent={allPages[currentPage]}
            onUpdate={handleVisualUpdate}
            currentPage={currentPage}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-gray-500">Loading page content...</div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
  </div>

        {/* AI Chat Widget */}
        {!isAIChatOpen ? (
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all z-50 flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span className="font-semibold">AI Assistant</span>
          </button>
        ) : (
          <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
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
      {/* VERSION HISTORY MODAL - ADD HERE */}
      {showVersionHistory && (
        <WebsiteVersionHistory
          apiUrl={apiUrl}
          authFetch={(url, options) => {
            const token = localStorage.getItem('token');
            return fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'Authorization': `Bearer ${token}`
              }
            });
          }}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div> 
  );
}
