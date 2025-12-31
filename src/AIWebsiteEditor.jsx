import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Sparkles, X } from 'lucide-react';

const AIWebsiteEditor = ({ currentHTML, onHTMLUpdate, businessInfo }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI website assistant. Tell me what changes you'd like to make to your website. For example:\n\n• \"Change the hero section headline\"\n• \"Make the contact button green\"\n• \"Add a testimonials section\"\n• \"Change the phone number to...\"\n• \"Make it more colorful\""
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create detailed prompt for Claude
      const editPrompt = `You are helping edit an existing website. Here is the current HTML:

${currentHTML}

The user wants to make this change: "${userMessage}"

IMPORTANT INSTRUCTIONS:
- Make ONLY the specific changes the user requested
- Keep all other parts of the website exactly the same
- Return the COMPLETE updated HTML (not just the changed section)
- Maintain all existing styling and functionality
- If the change is unclear, make your best interpretation

Business context:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
${businessInfo.phone ? `- Phone: ${businessInfo.phone}` : ''}
${businessInfo.address ? `- Address: ${businessInfo.address}` : ''}

Return ONLY the complete HTML code with the requested changes, no explanations.`;

      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: editPrompt,
          style: 'professional'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process your request');
      }

      const data = await response.json();
      let updatedHTML = data.html;
      
      // Clean up the response
      if (updatedHTML.includes('```html')) {
        updatedHTML = updatedHTML.split('```html')[1].split('```')[0].trim();
      } else if (updatedHTML.includes('```')) {
        updatedHTML = updatedHTML.split('```')[1].split('```')[0].trim();
      }

      // Update the HTML
      onHTMLUpdate(updatedHTML);

      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "✅ Done! I've updated your website. Check the preview to see the changes. Need anything else?" 
      }]);

    } catch (error) {
      console.error('Edit error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ Sorry, I couldn't make that change. Please try rephrasing your request or be more specific." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold text-lg">AI Website Editor</h3>
        </div>
        <p className="text-sm text-purple-100 mt-1">
          Tell me what changes you'd like to make
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-purple-600" />
              <p className="text-sm text-gray-600">Making changes...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your changes here... (e.g., 'Change the header to say...')"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows="2"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              inputMessage.trim() && !isProcessing
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIWebsiteEditor;
