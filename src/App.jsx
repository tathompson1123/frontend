import React, { useState } from 'react';
import { Wand2, ArrowLeft, Upload, X } from 'lucide-react';
import PricingPage from './PricingPage';
import HomePage from './HomePage';
import AuthModal from './AuthModal';
import Dashboard from './Dashboard';

const AIWebsiteBuilder = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'builder', 'preview', 'pricing', 'dashboard'
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
  
  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null); // { name, email, plan }

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

  const handleSelectPlan = (planName) => {
    setSelectedPlan(planName);
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignup = async ({ name, email, password }) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          plan: selectedPlan || 'pro-plan'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      setUser(data.user);
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
      
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleLogin = async ({ email, password }) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      setUser(data.user);
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
      
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
      }

      localStorage.removeItem('authToken');
      setUser(null);
      setCurrentView('home');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout on frontend even if backend fails
      localStorage.removeItem('authToken');
      setUser(null);
      setCurrentView('home');
    }
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
    }, 3000);

    const prompt = `Create a PREMIUM, professional website for ${businessName}, a ${businessType} business.

⚠️ CRITICAL IMAGE REQUIREMENT - READ FIRST ⚠️
YOU MUST INCLUDE REAL IMAGES FROM UNSPLASH IN THE HTML.
DO NOT use placeholder text or alt tags without actual src attributes.
EVERY image below MUST have a working src="https://source.unsplash.com/..." URL.

BUSINESS INFO:
- Name: ${businessName}
- Type: ${businessType}
${phone ? `- Phone: ${phone}` : ''}
${services ? `- Services: ${services}` : ''}

STRUCTURE (sections in order):

1. HERO - Full-screen impact
   🖼️ MANDATORY BACKGROUND IMAGE:
   <section style="background-image: url('https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},professional,outdoor,business'); background-size: cover; background-position: center; min-height: 100vh;">
   
   - Dark overlay: background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))
   - Small badge above headline
   - Large headline with one word in accent color
   - Description text
   - Two CTA buttons side-by-side
   - Scroll indicator at bottom

2. SERVICES - Visual showcase
   🖼️ MANDATORY SERVICE IMAGES - Each service card MUST have:
   <img src="https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},service,work,professional" alt="Service" style="width: 100%; height: 300px; object-fit: cover;" />
   
   Card structure for EACH service:
   - Image at top (actual <img> tag with Unsplash URL above)
   - Icon emoji
   - Service title
   - Description
   - Price displayed prominently
   - "Book Now" button
   - Checkbox: "Select this service"
   - Hover: lift effect, image zoom

3. WHY CHOOSE US - Trust building  
   - Stats section (500+ customers, etc)
   - 4 benefit icons with text
   
   🖼️ MANDATORY TESTIMONIAL PHOTOS - Create 3 testimonial cards with:
   <img src="https://source.unsplash.com/150x150/?portrait,professional,person,headshot" alt="Customer" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
   
   Each testimonial MUST include:
   - 5 stars: ⭐⭐⭐⭐⭐
   - Quote text in quotation marks
   - Customer photo (actual <img> with Unsplash URL above)
   - Customer name + detail
   - Styled card with shadow

4. BOOKING FORM - Comprehensive
   TWO-COLUMN LAYOUT:
   
   LEFT: Form
   - Multi-service selection (checkboxes with prices)
   - Running total calculator
   - Contact fields (name, email, phone)
   - Date picker and time slots
   - Vehicle info (if applicable)
   - Notes textarea
   
   RIGHT: Info sidebar
   - Business hours
   - Contact info
   - Why Book benefits
   
   Auto-generate pricing:
   ${services ? services.split(',').map((s, i) => `- ${s.trim()}: $${(i + 1) * 75}`).join('\n') : '- Service 1: $75\n- Service 2: $150\n- Service 3: $225'}
   
   Submit button shows total: Book Now

5. FINAL CTA - Conversion
   - Eye-catching background
   - Strong headline
   - Large CTA button

6. FOOTER
   - 3 columns: About, Services, Contact
   - Social icons
   - Copyright

QUALITY REQUIREMENTS:

DESIGN:
- Choose appropriate colors for ${businessType} industry
- Modern, clean, professional
- High contrast for readability
- Generous spacing
- Cohesive visual system

ANIMATIONS (flowing transitions):
- Smooth scroll throughout
- Fade-in sections on scroll
- Stagger grid animations
- Hover effects: lift, scale, glow
- Parallax hero background
- Flowing section transitions

IMAGES (CRITICAL - DO NOT SKIP):
- Hero Background: MUST use https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},professional,outdoor as full-width background image
- Service Card Images: Each service MUST have image from https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},service,professional,work
- Testimonial Photos: MUST use https://source.unsplash.com/150x150/?portrait,professional,person,face for each customer photo
- All images MUST be actual img tags or background-image CSS, not placeholders
- Apply dark overlay on hero (rgba(0,0,0,0.5)) for text readability

TECHNICAL:
- Single HTML file
- Inline CSS and JavaScript
- Google Fonts (modern pairing)
- Intersection Observer for animations
- Multi-service booking with live price calc
- Form validation
- Mobile responsive
- Fast, optimized code

🖼️ IMAGE IMPLEMENTATION EXAMPLES (COPY THESE):

Hero section background:
<section style="background-image: url('https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},outdoor,professional'); background-size: cover; background-position: center; min-height: 100vh; position: relative;">
  <div style="position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5));"></div>
  <div style="position: relative; z-index: 1;">
    <!-- Hero content here -->
  </div>
</section>

Service card with image:
<div class="service-card">
  <img src="https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},service,work" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px 12px 0 0;" />
  <div class="card-content">
    <h3>Service Name</h3>
    <p>Description</p>
    <p class="price">$75</p>
    <button>Book Now</button>
  </div>
</div>

Testimonial with photo:
<div class="testimonial">
  <div class="stars">⭐⭐⭐⭐⭐</div>
  <p>"Amazing service!"</p>
  <div class="author">
    <img src="https://source.unsplash.com/150x150/?portrait,professional" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
    <div>
      <strong>John Smith</strong>
      <span>Verified Customer</span>
    </div>
  </div>
</div>

REMEMBER: Use the EXACT Unsplash URLs shown above. DO NOT use placeholders or alt text without src attributes.

Make this look like a $10,000 custom website - premium, polished, conversion-focused.`;

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
      
      clearInterval(messageInterval);
      
      setTimeout(() => {
        setCurrentView('preview');
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('Generation error:', error);
      clearInterval(messageInterval);
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

  // Dashboard View
  if (currentView === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout}
        generatedWebsite={generatedHTML}
      />
    );
  }

  // Home Page View
  if (currentView === 'home') {
    return (
      <>
        <HomePage onNavigate={setCurrentView} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSignup={handleSignup}
          onLogin={handleLogin}
          mode={authMode}
        />
      </>
    );
  }

  // Pricing Page View
  if (currentView === 'pricing') {
    return (
      <>
        <PricingPage 
          onBack={() => setCurrentView('home')}
          onSelectPlan={handleSelectPlan}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSignup={handleSignup}
          onLogin={handleLogin}
          mode={authMode}
        />
      </>
    );
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
                Takes 90-120 seconds • Premium AI quality
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
