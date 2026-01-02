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
    // TODO: Integrate with your backend API
    // For now, simulate signup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      name,
      email,
      plan: selectedPlan || 'pro-plan',
      createdAt: new Date().toISOString()
    };
    
    setUser(newUser);
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
  };

  const handleLogin = async ({ email, password }) => {
    // TODO: Integrate with your backend API
    // For now, simulate login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingUser = {
      name: 'John Doe',
      email,
      plan: 'pro-plan'
    };
    
    setUser(existingUser);
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
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

    const prompt = `You are an elite web designer creating a premium, conversion-optimized website for a ${businessType} business. This needs to be pixel-perfect, modern, and professional.

BUSINESS DETAILS:
Company: ${businessName}
Industry: ${businessType}
${phone ? `Phone: ${phone}` : 'Phone: (555) 123-4567'}
${services ? `Services Offered: ${services}` : ''}

DESIGN PHILOSOPHY:
Create a stunning, high-end website that looks like it cost $5,000+. Think luxury service websites with sophisticated animations, premium imagery, and conversion-optimized layout. Every element should scream "professional" and "trustworthy."

═══════════════════════════════════════════════════════════

SECTION 1: HERO SECTION (Full-Screen Impact)
═══════════════════════════════════════════════════════════

Visual Requirements:
- Full viewport height hero with stunning background image
- Use: https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},professional,service
- Apply dark gradient overlay (linear-gradient from rgba(0,0,0,0.6) to rgba(0,0,0,0.3))
- Subtle parallax scroll effect on background image

Content Layout (All Centered):
- Company logo or icon at top (elegant, minimal)
- Main Headline: "${businessName}" in LARGE, BOLD, white text (60-80px)
- Tagline: "Premium ${businessType} Services" (24px, light white/gray)
- Trust Line: "Licensed • Insured • 5-Star Rated" with star icons
- Two prominent CTA buttons (side by side):
  * PRIMARY: "GET FREE QUOTE" - Bright gradient (orange #FF6B35 to red #F7931E), large, rounded, with arrow icon
  * SECONDARY: "CALL ${phone || '(555) 123-4567'}" - White outline, phone icon, same size
- Scroll indicator at bottom (animated arrow pointing down)

Animations:
- Fade in headline with slide up effect
- Buttons scale on hover with shadow
- Subtle float animation on scroll indicator

═══════════════════════════════════════════════════════════

SECTION 2: SERVICES SHOWCASE (Premium Service Cards)
═══════════════════════════════════════════════════════════

Layout:
- White/light gray background with subtle texture
- Section heading: "Our Services" (40px, centered, bold)
- Subheading: "Professional solutions tailored to your needs"
- Grid of ${services ? services.split(',').length : '4'} service cards (3 columns desktop, 2 tablet, 1 mobile)

Each Service Card Design:
- High-quality relevant image from Unsplash at top (400x300)
- Image has subtle hover zoom effect
- White card with premium shadow (0 10px 40px rgba(0,0,0,0.1))
- Service icon/emoji before title
- Service name as bold headline (24px)
- 2-3 sentence description of service
- PRICING displayed prominently: "Starting at $XX" or "From $XX/hr"
- "Book This Service" button (gradient purple to blue, full width)
- Checkbox option: "Add to booking" for multi-service selection

Service Pricing Structure:
${services ? services.split(',').map((service, i) => `- ${service.trim()}: Starting at $${49 + (i * 25)}`).join('\n') : `
- Basic Service: Starting at $49
- Standard Service: Starting at $99
- Premium Service: Starting at $149
- Deluxe Package: Starting at $249
`}

Card Animations:
- Fade in on scroll with stagger delay
- Lift on hover with increased shadow
- Button color shift on hover

═══════════════════════════════════════════════════════════

SECTION 3: WHY CHOOSE US (Trust Builder Section)
═══════════════════════════════════════════════════════════

Background: Light gradient (from white to very light purple #F8F7FF)

Content:
- Heading: "Why Choose ${businessName}?"
- 4 trust badges in a row (icons + text):
  1. "Licensed & Insured" - Shield icon, bold text, description
  2. "Same-Day Service" - Clock icon, bold text, description  
  3. "100% Satisfaction Guaranteed" - Star icon, bold text, description
  4. "10+ Years Experience" - Trophy icon, bold text, description

Design:
- Large icons (60px) with gradient colors
- Each badge in a subtle white card with hover effect
- Include relevant statistics (e.g., "500+ Happy Customers", "5-Star Reviews")

Visual Elements:
- Include 2-3 small customer review snippets with 5-star ratings
- Professional headshots (use Unsplash portraits)
- Quote marks, customer names, dates

═══════════════════════════════════════════════════════════

SECTION 4: MULTI-SERVICE BOOKING FORM
═══════════════════════════════════════════════════════════

Background: White with subtle shadow/border

Heading: "Book Your Service Online"
Subheading: "Choose one or multiple services - Get instant confirmation"

Form Layout (Two Columns on Desktop):

LEFT COLUMN:
- Service Selection:
  * Checkbox list of all services with prices
  * Each checkbox shows: [✓] Service Name - $Price
  * Allow multiple selections
  * Running total at bottom: "Total: $XXX"

- Date & Time Selection:
  * Calendar date picker (flatpickr style)
  * Time slot buttons (9 AM - 5 PM in 1-hour increments)
  * Visual indicator for available/booked slots

RIGHT COLUMN:
- Customer Information:
  * Full Name (required)
  * Email (required)
  * Phone Number (required)
  * Address/Service Location (required)
  * Special Instructions (textarea)

- Booking Summary Box:
  * Selected Services listed
  * Chosen date and time
  * Total price displayed prominently
  * Estimated duration

Submit Button:
- LARGE "CONFIRM BOOKING - $XXX" button
- Full width, gradient (green #10B981 to teal #14B8A6)
- Include lock icon for security
- Hover effect with pulse animation

Form Validation:
- Real-time validation with error messages
- Success checkmarks when fields are valid
- Clear error states in red

Success Message (After Submit):
- Checkmark icon animation
- "Booking Confirmed!" heading
- Summary of booking details
- "We'll send you a confirmation email"
- Add to calendar button

═══════════════════════════════════════════════════════════

SECTION 5: FINAL CTA SECTION
═══════════════════════════════════════════════════════════

Background: Bold gradient (purple #7C3AED to blue #3B82F6)
Full-width, high-impact section

Content (All white text, centered):
- Large heading: "Ready to Get Started?"
- Subheading: "Join 500+ satisfied customers today"
- Two CTAs:
  * "BOOK NOW" - Large white button with purple text
  * "CALL ${phone || '(555) 123-4567'}" - Outline white button
- Trust badges: "Money-Back Guarantee • Same-Day Service • No Hidden Fees"

═══════════════════════════════════════════════════════════

SECTION 6: FOOTER
═══════════════════════════════════════════════════════════

Background: Dark navy (#1E293B)
Color: Light gray/white text

Three Columns:
LEFT: Company info (name, tagline, brief description)
CENTER: Quick Links (Services, About, Contact, Book Online)
RIGHT: Contact info (phone, email, address, hours)

Bottom Bar:
- Copyright © 2025 ${businessName}
- Social media icons (Facebook, Instagram, Twitter)
- "Powered by SORCE" (small, subtle)

═══════════════════════════════════════════════════════════

CRITICAL DESIGN REQUIREMENTS
═══════════════════════════════════════════════════════════

COLOR PALETTE:
- Primary: Purple #7C3AED
- Secondary: Blue #3B82F6  
- Accent: Orange #FF6B35
- Success: Green #10B981
- Dark: Navy #1E293B
- Light: Off-white #F9FAFB

TYPOGRAPHY:
- Headings: 'Poppins', bold, large (40-60px for h1, 32-40px for h2)
- Body: 'Inter', 16-18px, line-height 1.6
- Import from Google Fonts: 
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');

SPACING:
- Section padding: 100px top/bottom (60px mobile)
- Container max-width: 1200px
- Consistent 40px gaps between elements

IMAGES:
- All images from Unsplash with relevant keywords
- Hero: https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},professional
- Service cards: https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},service,professional
- Use overlay gradients for text readability
- All images have subtle hover zoom (transform: scale(1.05))

ANIMATIONS & EFFECTS:
- Smooth scroll behavior (scroll-behavior: smooth)
- Fade-in on scroll using Intersection Observer
- All buttons: transform + shadow on hover
- Cards: lift effect on hover (translateY(-5px))
- Parallax on hero background
- Stagger animations for service cards (0.1s delay between each)
- Loading spinners on form submit

RESPONSIVE DESIGN:
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Stack columns on mobile
- Larger touch targets (min 44px)
- Simplified animations on mobile
- Hamburger menu if navigation exists

CALL-TO-ACTIONS:
- Every section has a clear CTA
- Minimum 3 "Book Now" or "Get Quote" buttons throughout
- Phone number clickable (tel: link) everywhere
- CTAs use action words: "Get Started", "Book Now", "Call Today"
- Prominent, can't-miss button styling

TRUST SIGNALS:
- Display licensing/insurance info
- Show years in business
- Include guarantee statements
- Add review snippets/ratings
- Security badges on forms

BOOKING FUNCTIONALITY:
- Multi-service checkbox selection
- Running price calculator
- Date/time picker with visual calendar
- Form validation with helpful errors
- Clear booking summary
- Success confirmation with details

═══════════════════════════════════════════════════════════

TECHNICAL REQUIREMENTS
═══════════════════════════════════════════════════════════

- Single HTML file with all CSS in <style> tag and JavaScript in <script> tag
- Use modern CSS (Flexbox, Grid, CSS Variables)
- Smooth animations with CSS transitions and @keyframes
- Intersection Observer for scroll animations
- Form validation with JavaScript
- Multi-service selection logic with price calculation
- Mobile-responsive with media queries
- Semantic HTML5 (header, nav, section, footer)
- Accessible (ARIA labels, proper contrast, keyboard navigation)
- Fast loading, optimized code
- NO external dependencies except Google Fonts

═══════════════════════════════════════════════════════════

Generate a complete, production-ready HTML file. Make this website look premium, professional, and conversion-focused. Every detail matters - this should be a $5,000+ quality website.`;

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
