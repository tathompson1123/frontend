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
  Check
} from 'lucide-react';
import VisualEditor from './VisualEditor';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSavedPages, setLastSavedPages] = useState(null);
  
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
    
    const newPages = {
      ...allPages,
      [currentPage]: updatedHTML
    };
    
    setAllPages(newPages);
    setHasUnsavedChanges(true);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    console.log('✅ UPDATE COMPLETE - Changes marked as unsaved');
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
      const response = await fetch(`${apiUrl}/api/website/save`, {
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
      
      if (response.ok) {
        setLastSavedPages(allPages);
        setHasUnsavedChanges(false);
        setShowSaveSuccess(true);
        
        setTimeout(() => {
          setShowSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/website/publish`, {
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
      
      const data = await response.json();
      
      if (response.ok) {
        setLastSavedPages(allPages);
        setHasUnsavedChanges(false);
        alert(`✅ Website published successfully!\n\nLive at: ${data.url}`);
      } else {
        throw new Error(data.error || 'Publish failed');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish website: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBackToDashboard = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard?tab=website');
      }
    } else {
      navigate('/dashboard?tab=website');
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
              <p className="font-semibold">Changes Saved!</p>
              <p className="text-sm text-green-100">Click "Publish Changes" to go live</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-6 flex-1 overflow-x-auto">
          <button
            type="button"
            onClick={handleBackToDashboard}
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

            {/* Undo/Redo */}
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
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
          {/* Save Button - Only show when there are unsaved changes */}
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 lg:px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden md:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden md:inline">Save</span>
                </>
              )}
            </button>
          )}

          {/* Publish Button - Green when changes exist, gray when published */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || !hasUnsavedChanges}
            className={`px-4 lg:px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              hasUnsavedChanges
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden md:inline">Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden md:inline">
                  {hasUnsavedChanges ? 'Publish Changes' : 'Published ✓'}
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-4">
          {/* Page Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Page</label>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.keys(allPages).map((pageName) => (
                <option key={pageName} value={pageName}>
                  {getPageDisplayName(pageName)}
                </option>
              ))}
            </select>
          </div>

          {/* Device Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setDevicePreview('desktop')} 
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 ${
                  devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              <button 
                onClick={() => setDevicePreview('mobile')} 
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 ${
                  devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="flex-1 px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="flex-1 px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Redo2 className="w-4 h-4" />
              Redo
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Visual Editor */}
      <main className="flex-1 overflow-hidden">
       <VisualEditor
  htmlContent={allPages[currentPage] || ''}
  onUpdate={handleVisualUpdate}
  currentPage={currentPage}
/>
      </main>

      {/* AI Chat Widget */}
      {isAIChatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Editor Assistant</h3>
            </div>
            <button onClick={() => setIsAIChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {isAIThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tell me what to change..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isAIThinking}
              />
              <button
                onClick={handleSendMessage}
                disabled={isAIThinking || !inputMessage.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Toggle Button */}
      {!isAIChatOpen && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center z-40"
          title="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
