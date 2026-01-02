import React, { useState } from 'react';
import { Wand2, ArrowLeft, Upload, X } from 'lucide-react';
import PricingPage from './PricingPage';
import HomePage from './HomePage';

const AIWebsiteBuilder = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'builder', 'preview', 'pricing'
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState('');
  const [designStyle, setDesignStyle] = useState('professional');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages(prev => [...prev, { url: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateWebsite = async () => {
    if (!businessName.trim() || !businessType.trim()) {
      alert('Please fill in at least Business Name and Type');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Generating your website...');

    // Cycle through loading messages
    const loadingMessages = [
      'Generating your website...',
      'Styling your sections...',
      'Adding color scheme...',
      'Creating your hero section...',
      'Building service cards...',
      'Perfecting the layout...',
      'Almost ready...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setGenerationStep(loadingMessages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    const prompt = `You are an expert web designer. Create a professional single-page website for a ${businessType} business.

Business: ${businessName}
${phone ? `Phone: ${phone}` : ''}
${address ? `Address: ${address}` : ''}
${services ? `Services: ${services}` : ''}

Create a modern, clean website with these sections in order:

1. HERO SECTION:
- Full-width background image from: https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')}
- Dark overlay for text readability
- Center everything vertically and horizontally
- Large white headline: "${businessName}"
- Subheadline: "Professional ${businessType} Services"
- Two large buttons: "GET FREE QUOTE" and "CALL ${phone || '(555) 123-4567'}"

2. SERVICES:
- White background
- Heading: "Our Services"
- Show 3-4 service cards in a grid
- Each card: icon, title, description, price/CTA

3. WHY CHOOSE US:
- Light gray background
- 3 benefits: "Licensed & Insured", "Same Day Service", "Satisfaction Guaranteed"

4. CONTACT CTA:
- Purple gradient background
- Large heading: "Ready to Get Started?"
- Big "CALL NOW" button with phone number

5. FOOTER:
- Dark background
- Business name, phone, address

Design Rules:
- Use purple (#7C3AED) and blue (#3B82F6) colors
- Modern fonts from Google Fonts
- Mobile responsive
- All sections perfectly centered
- Smooth animations on scroll
- Clean, professional look

Generate complete HTML with inline CSS and JavaScript. Make it look professional and modern.`;

    try {
      setGenerationProgress(10);

      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationProgress(20);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          style: designStyle
        }),
      });

      setGenerationProgress(40);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate website');
      }

      const data = await response.json();
      
      setGenerationProgress(70);

      await new Promise(resolve => setTimeout(resolve, 600));
      setGenerationProgress(85);

      let htmlContent = data.html;
      
      if (htmlContent.includes('```html')) {
        htmlContent = htmlContent.split('```html')[1].split('```')[0].trim();
      } else if (htmlContent.includes('```')) {
        htmlContent = htmlContent.split('```')[1].split('```')[0].trim();
      }

      setGenerationProgress(100);
      setGenerationStep('Complete!');
      setGeneratedHTML(htmlContent);
      
      clearInterval(messageInterval); // Stop cycling messages
      
      setTimeout(() => {
        setCurrentView('preview');
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('Generation error:', error);
      clearInterval(messageInterval); // Stop cycling messages on error
      alert(`Failed to generate website: ${error.message}`);
      setIsGenerating(false);
    }
  };

  const downloadHTML = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName.replace(/\s+/g, '-').toLowerCase()}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startOver = () => {
    setCurrentView('builder');
    setGeneratedHTML('');
    setBusinessName('');
    setBusinessType('');
    setAddress('');
    setPhone('');
    setServices('');
    setDescription('');
    setUploadedImages([]);
    setDesignStyle('professional');
  };

  // Home Page View
  if (currentView === 'home') {
    return <HomePage onNavigate={setCurrentView} />;
  }

  // Pricing Page View
  if (currentView === 'pricing') {
    return <PricingPage onBack={() => setCurrentView('home')} />;
  }

  // Preview View
  if (currentView === 'preview') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
        <div className="bg-white shadow-sm border-b z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('builder')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Editor</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('pricing')}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg font-semibold"
              >
                Launch My Website
              </button>
              <button
                onClick={startOver}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full h-full bg-white">
          <iframe
            srcDoc={generatedHTML}
            className="w-full h-full border-0"
            title="Generated Website Preview"
            style={{ minHeight: '100%' }}
          />
        </div>
      </div>
    );
  }

  // Builder View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {!isGenerating ? (
        // Form View
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back to Home */}
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">AI-Powered</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Create Your Website
              </h1>
              <p className="text-xl text-gray-600">
                Just fill in the basics, AI handles the rest
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                  placeholder="e.g., Elite Window Cleaning"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type *
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                  placeholder="e.g., Window Cleaning"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Services You Offer
                </label>
                <textarea
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                  rows="3"
                  placeholder="e.g., Residential window cleaning, Commercial cleaning, Pressure washing"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateWebsite}
                disabled={!businessName.trim() || !businessType.trim()}
                className={`w-full py-5 px-6 rounded-xl font-bold text-xl transition-all ${
                  businessName.trim() && businessType.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Wand2 className="w-6 h-6" />
                  <span>Generate My Website</span>
                </div>
              </button>

              <p className="text-center text-sm text-gray-500">
                Takes 30-60 seconds • No credit card required
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Loading Screen (Full Page)
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-12">
              {/* Animated Spinner */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-8 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-3 border-8 border-transparent border-t-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
              </div>

              {/* Loading Text */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {generationStep}
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Creating your professional website...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{generationProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWebsiteBuilder;
