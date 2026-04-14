import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronDown, Loader2, RotateCcw, Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'How do I embed my booking widget on Wix?',
  'How do I add the SEO code to my website?',
  'How do I upload my llms.txt file?',
  'Why isn\'t my widget showing on my website?',
  'How do I add an add-on service to a booking?',
  'How do I set up the AI chat agent?',
  'How do I import contacts for email campaigns?',
  'How do I submit to directories for backlinks?',
];

function AssistantMessage({ content }) {
  // Render numbered lists and bold formatting
  const lines = content.split('\n');
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold text between **
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Inline code
        const withCode = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: withCode }} />
        );
      })}
    </div>
  );
}

export default function SorceAssistant({ apiUrl, authFetch }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setShowSuggestions(true);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && !loading) {
      inputRef.current?.focus();
    }
  }, [open, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      const res = await authFetch(`${apiUrl}/api/sorce-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I couldn\'t get a response. Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([]);
    setInput('');
    setShowSuggestions(true);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
        }`}
        title="SORCE Assistant"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: 520 }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">SORCE Assistant</p>
              <p className="text-xs text-indigo-200">Ask me anything about your dashboard</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition"
                  title="Start new conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-sm font-semibold text-indigo-900 mb-1">Hi! I'm your SORCE Assistant.</p>
                  <p className="text-xs text-indigo-700">I know everything about your dashboard. Ask me how to set anything up, fix an issue, or get more out of SORCE.</p>
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Common questions</p>
                <div className="space-y-1.5">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-sm text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm text-white">{msg.content}</p>
                  ) : (
                    <AssistantMessage content={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any SORCE feature..."
                rows={1}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all"
                style={{ minHeight: 38, maxHeight: 100 }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
