import React, { useState } from 'react';
import { Wand2, ArrowLeft, Upload, X } from 'lucide-react';

const AIWebsiteBuilder = () => {
  const [currentView, setCurrentView] = useState('builder');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState('');
  const [colorScheme, setColorScheme] = useState('terracotta');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  const colorSchemes = {
    terracotta: { name: 'Warm Terracotta', from: 'from-primary-600', to: 'to-accent-600', accent: 'bg-primary-600' },
    teal: { name: 'Deep Teal', from: 'from-teal-600', to: 'to-teal-700', accent: 'bg-teal-600' },
    blue: { name: 'Ocean Blue', from: 'from-blue-600', to: 'to-cyan-600', accent: 'bg-blue-600' },
    purple: { name: 'Royal Purple', from: 'from-purple-600', to: 'to-pink-600', accent: 'bg-purple-600' },
    green: { name: 'Forest Green', from: 'from-green-600', to: 'to-emerald-600', accent: 'bg-green-600' },
    slate: { name: 'Professional Gray', from: 'from-slate-700', to: 'to-gray-800', accent: 'bg-slate-700' }
  };

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
    setGenerationStep('Analyzing your business...');
    
    const steps = [
      { progress: 20, step: 'Designing layout...' },
      { progress: 40, step: 'Creating sections...' },
      { progress: 60, step: 'Adding your content...' },
      { progress: 80, step: 'Styling your website...' },
      { progress: 95, step: 'Final touches...' }
    ];
    
    let currentStepIndex = 0;
    const progressInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setGenerationProgress(steps[currentStepIndex].progress);
        setGenerationStep(steps[currentStepIndex].step);
        currentStepIndex++;
      }
    }, 800);
    
    try {
      const scheme = colorSchemes[colorScheme];
      const servicesList = services ? services.split(',').map(s => s.trim()).slice(0, 8) : ['Service 1', 'Service 2', 'Service 3', 'Service 4', 'Service 5', 'Service 6'];
      
      const prompt = `Create a complete, professional, LONG scrolling website for ${businessName}, a ${businessType} business.

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Type: ${businessType}
${phone ? `- Phone: ${phone}` : ''}
${address ? `- Address: ${address}` : ''}
- Services Offered: ${servicesList.join(', ')}
${description ? `- Description: ${description}` : ''}

NAVIGATION (CRITICAL - MUST BE FIRST):
Create a fixed navigation bar at the very top:
<nav class="fixed top-0 w-full bg-white/95 backdrop-blur shadow-lg z-50">
  <div class="container mx-auto px-8 py-4 flex justify-between items-center">
    <div class="text-2xl font-bold text-gray-900">${businessName}</div>
    <div class="hidden md:flex space-x-6 text-sm font-semibold">
      <a href="#home" class="hover:text-blue-600 transition-colors">Home</a>
      <a href="#services" class="hover:text-blue-600 transition-colors">Services</a>
      <a href="#about" class="hover:text-blue-600 transition-colors">About</a>
      <a href="#testimonials" class="hover:text-blue-600 transition-colors">Reviews</a>
      <a href="#pricing" class="hover:text-blue-600 transition-colors">Pricing</a>
      <a href="#gallery" class="hover:text-blue-600 transition-colors">Gallery</a>
      <a href="#faq" class="hover:text-blue-600 transition-colors">FAQ</a>
      <a href="#contact" class="hover:text-blue-600 transition-colors">Contact</a>
      <a href="#contact" class="bg-gradient-to-r ${scheme.from} ${scheme.to} text-white px-6 py-2 rounded-full hover:shadow-xl transition-all">Book Now</a>
    </div>
  </div>
</nav>

REQUIRED SECTIONS (in this exact order):

1. HERO SECTION (id="home"):
- Add pt-20 to account for fixed nav
- MUST have a background image: <div class="relative min-h-screen"><div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920');"></div><div class="absolute inset-0 bg-black/50"></div><div class="relative z-10">CONTENT HERE</div></div>
- Large headline with business name
- Compelling tagline about ${businessType}
- Large "Book Now" button with gradient ${scheme.from} ${scheme.to}
- Make this section TALL and impressive

2. SERVICES SECTION (id="services"):
- Heading: "Our Services"
- Grid of ${servicesList.length} service cards
- Each card: icon emoji, service name from list (${servicesList.join(', ')}), 2 sentences description
- Use bg-white with shadows, rounded-3xl
- Hover effects with transform

3. ABOUT SECTION (id="about"):
- Heading: "About ${businessName}"
- 3-4 paragraphs about the business, experience, quality, commitment
- Include why customers should choose this business
- Professional but friendly tone
- Use gradient ${scheme.from} ${scheme.to} background for this section

4. WHY CHOOSE US SECTION (id="why-choose"):
- Heading: "Why Choose ${businessName}?"
- 6 benefit cards in a grid
- Benefits: Licensed & Insured, Years of Experience, Satisfaction Guaranteed, Affordable Pricing, Professional Team, Fast Service
- Each card: emoji icon, bold title, short description
- bg-white cards with hover effects

5. TESTIMONIALS SECTION (id="testimonials"):
- Heading: "What Our Customers Say"
- 3 customer testimonial cards
- Each: customer name, 5-star rating (⭐⭐⭐⭐⭐), detailed review (3-4 sentences)
- Make reviews sound genuine and specific to ${businessType}
- bg-gradient background

6. PRICING SECTION (id="pricing"):
- Heading: "Our Pricing Plans"
- 3 pricing tiers side by side:
  * BASIC: $99 - List 4 features, "Choose Plan" button
  * STANDARD: $199 - List 6 features, highlighted with scale-105 and gradient background, "Most Popular" badge, "Choose Plan" button
  * PREMIUM: $299 - List 8 features, "Choose Plan" button
- Each "Choose Plan" button should say "Book Now" and use gradient ${scheme.from} ${scheme.to}

7. GALLERY SECTION (id="gallery"):
- Heading: "Our Work"
- Grid of 6 images
- Use placeholder gradients or Unsplash images related to ${businessType}
- Each image: rounded-2xl, hover:scale-105 transition
- Make this section visually impressive

8. FAQ SECTION (id="faq"):
- Heading: "Frequently Asked Questions"
- 6 FAQs relevant to ${businessType} business
- Format: Question in bold, answer below
- Questions like: How do I book?, What areas do you serve?, Do you offer guarantees?, What's included?, How long does it take?, Do you have insurance?
- bg-white cards with proper spacing

9. CONTACT SECTION (id="contact"):
- Heading: "Get In Touch"
- Display: Phone: ${phone || '(555) 123-4567'}, Address: ${address || '123 Main Street, Your City, ST 12345'}, Email: info@${businessName.toLowerCase().replace(/\s+/g, '')}.com
- Large "Book Your Service Now" button with gradient ${scheme.from} ${scheme.to}
- Hours: Mon-Fri 8am-6pm, Sat 9am-4pm, Sun Closed
- Social media icons placeholders
- Use gradient background

DESIGN REQUIREMENTS:
- Use Tailwind CSS exclusively
- Color scheme: ${scheme.from} ${scheme.to} for gradients and accents
- Make each section LONG with substantial content and padding (py-20 or more)
- Add smooth hover effects on all interactive elements
- Use rounded-3xl for cards, shadows for depth
- Responsive design (container mx-auto px-8)
- Modern, clean, professional aesthetic
- Add subtle animations on hover
- Ensure proper spacing between all sections
- Each section MUST have the id attribute specified above

CRITICAL: Return ONLY the HTML for the body content. No explanations, no markdown, just pure HTML starting with the nav element.`;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to generate');
      
      const data = await response.json();
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStep('Complete! 🎉');
      
      // Post-process HTML to ensure navigation works
      let finalHTML = data.html;
      
      // If there's no fixed navigation, add it
      if (!finalHTML.includes('fixed') && !finalHTML.includes('sticky')) {
        const nav = `<nav class="fixed top-0 w-full bg-white shadow-lg z-50">
          <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div class="text-2xl font-bold text-gray-900">${businessName}</div>
            <div class="flex space-x-6 text-sm font-semibold">
              <a href="#home" class="hover:text-blue-600 transition">Home</a>
              <a href="#services" class="hover:text-blue-600 transition">Services</a>
              <a href="#about" class="hover:text-blue-600 transition">About</a>
              <a href="#pricing" class="hover:text-blue-600 transition">Pricing</a>
              <a href="#contact" class="hover:text-blue-600 transition">Contact</a>
              <a href="#contact" class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">Book Now</a>
            </div>
          </div>
        </nav>
        <div class="h-20"></div>`;
        finalHTML = nav + finalHTML;
      }
      
      // Ensure sections have proper IDs and spacing
      finalHTML = finalHTML.replace(/<section/g, '<section class="py-20"');
      
      setTimeout(() => {
        setGeneratedHTML(finalHTML);
        setCurrentView('preview');
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStep('');
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      alert('Failed to generate website. Please try again.');
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
    }
  };

  if (currentView === 'preview') {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-center shadow-xl sticky top-0 z-50">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setCurrentView('builder')} 
              className="flex items-center gap-2 px-5 py-3 bg-white/20 border-2 border-white rounded-xl text-white font-bold hover:bg-white/30 transition"
            >
              <ArrowLeft size={18} />
              Create Another Website
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-white">✨ Here is Your New Website!</h1>
              <p className="text-white/90 text-sm mt-1">Click the navigation links to jump to different sections!</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
        </div>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
     <div className="bg-white/95 backdrop-blur border-b px-8 py-5 flex items-center gap-4 shadow-lg sticky top-0 z-50">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
          <Wand2 className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">AI Website Builder</h1>
          <p className="text-sm text-gray-600">Build your professional website in minutes</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-12">
           <h2 className="text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">🚀 Let's Build Your Website</h2>
            <p className="text-xl text-gray-600">Fill in your business details and we'll create a stunning website for you</p>
          </div>

          <div className="space-y-8">
            {/* Business Basics */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-3">📋 Business Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g., Crystal Clear Window Cleaning"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Business Type *</label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    placeholder="e.g., Window Cleaning Service"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Business Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Services You Offer</label>
                <input
                  type="text"
                  value={services}
                  onChange={e => setServices(e.target.value)}
                  placeholder="e.g., Residential Cleaning, Commercial Cleaning, Deep Cleaning"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple services with commas</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us about your business, what makes you special, your experience, etc."
                  className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>

            {/* Color Scheme */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-3">🎨 Choose Your Color Scheme</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <button
                    key={key}
                    onClick={() => setColorScheme(key)}
                    className={`p-6 rounded-2xl border-4 transition-all ${
                      colorScheme === key 
                        ? 'border-indigo-600 shadow-xl scale-105' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className={`h-16 rounded-xl bg-gradient-to-r ${scheme.from} ${scheme.to} mb-3`} />
                    <p className="font-bold text-gray-900">{scheme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-3">📸 Upload Images (Optional)</h3>
              <p className="text-gray-600">Add photos of your work, team, or business (we'll use placeholders if you skip this)</p>
              
              <label className="block">
                <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 cursor-pointer transition">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-bold text-gray-700">Click to upload images</p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img.url} alt={img.name} className="w-full h-32 object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="pt-8">
              {isGenerating && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 border-8 border-gray-200 rounded-full"></div>
                      <div className="w-20 h-20 border-8 border-indigo-600 rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-indigo-600">{generationStep}</span>
                    <span className="text-lg font-bold text-indigo-600">{generationProgress}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">⏱️ This usually takes 60-90 seconds to create your perfect website...</p>
                </div>
              )}
              
              <button
                onClick={generateWebsite}
                disabled={isGenerating || !businessName.trim() || !businessType.trim()}
                className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-2xl font-extrabold hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
              >
                <Wand2 size={28} />
                {isGenerating ? 'Creating Your Website...' : 'Generate My Website'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWebsiteBuilder;
