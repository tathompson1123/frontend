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

    // ============================================
    // DEV MODE - Free Testing (Set to false for production)
    // ============================================
    const DEV_MODE = true; // Change to false when ready to use real API
    
    if (DEV_MODE) {
      console.log('🔧 DEV MODE: Using mock HTML for testing');
      
      // Simulate loading
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStep('Generating your website...');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      setGenerationProgress(50);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress(100);
      
      // Mock HTML with real Unsplash images to test
      const mockHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - Professional ${businessType} Services</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      line-height: 1.6;
      color: #1f2937;
    }
    h1, h2, h3 { font-family: 'Poppins', sans-serif; }
    
    /* Smooth Scroll */
    html { scroll-behavior: smooth; }
    
    /* Hero Section */
    .hero {
      background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url('https://source.unsplash.com/1920x1080/?${businessType.replace(/\s+/g, ',')},professional,outdoor,business');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
      position: relative;
    }
    .hero-content {
      max-width: 900px;
      padding: 2rem;
      animation: fadeInUp 1s ease-out;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      padding: 0.5rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800;
      margin-bottom: 1rem;
      line-height: 1.1;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #10b981, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero p {
      font-size: clamp(1.1rem, 2.5vw, 1.4rem);
      margin-bottom: 2.5rem;
      opacity: 0.95;
    }
    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 1rem 2.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary { 
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 10px 30px rgba(16,185,129,0.3);
    }
    .btn-primary:hover { 
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(16,185,129,0.4);
    }
    .btn-secondary { 
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      color: white;
      border: 2px solid white;
    }
    .btn-secondary:hover { 
      background: white;
      color: #059669;
    }
    
    /* Services Section */
    .services {
      padding: 6rem 2rem;
      background: #f9fafb;
    }
    .section-header {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 4rem;
    }
    .eyebrow {
      color: #10b981;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9rem;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    .services h2 {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 700;
      margin-bottom: 1rem;
      color: #111827;
    }
    .section-header p {
      font-size: 1.1rem;
      color: #6b7280;
    }
    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .service-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.4s ease;
      cursor: pointer;
    }
    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .service-card img {
      width: 100%;
      height: 260px;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .service-card:hover img {
      transform: scale(1.05);
    }
    .service-content {
      padding: 2rem;
    }
    .service-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .service-card h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #111827;
    }
    .service-card p {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }
    .price {
      color: #10b981;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      display: block;
    }
    .service-card .btn {
      width: 100%;
      font-size: 1rem;
      padding: 0.9rem;
    }
    
    /* Testimonials Section */
    .testimonials {
      padding: 6rem 2rem;
      background: white;
    }
    .testimonial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .testimonial {
      background: #f9fafb;
      padding: 2.5rem;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    .testimonial:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }
    .stars {
      color: #fbbf24;
      font-size: 1.3rem;
      margin-bottom: 1.5rem;
    }
    .testimonial-text {
      font-style: italic;
      color: #374151;
      margin-bottom: 1.5rem;
      line-height: 1.8;
      font-size: 1.05rem;
    }
    .author {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .author img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .author-info strong {
      display: block;
      color: #111827;
      font-weight: 600;
      font-size: 1.05rem;
    }
    .author-info small {
      color: #6b7280;
      font-size: 0.9rem;
    }
    
    /* CTA Section */
    .cta-section {
      background: linear-gradient(135deg, #10b981, #059669);
      padding: 5rem 2rem;
      text-align: center;
      color: white;
    }
    .cta-section h2 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .cta-section p {
      font-size: 1.2rem;
      margin-bottom: 2.5rem;
      opacity: 0.95;
    }
    
    /* Footer */
    .footer {
      background: #1f2937;
      color: #9ca3af;
      padding: 3rem 2rem 1.5rem;
      text-align: center;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer h3 {
      color: white;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .footer p {
      margin-bottom: 2rem;
      line-height: 1.8;
    }
    .footer-bottom {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #374151;
      font-size: 0.9rem;
    }
    
    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .hero h1 { font-size: 2.5rem; }
      .services, .testimonials { padding: 4rem 1.5rem; }
      .service-grid, .testimonial-grid { gap: 1.5rem; }
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <div class="badge">✨ Premium ${businessType} Services</div>
      <h1>Transform Your <span>Lawn</span> Today</h1>
      <p>Professional lawn care services that make your outdoor space the envy of the neighborhood</p>
      <div class="cta-buttons">
        <button class="btn btn-primary">Get Free Quote</button>
        <button class="btn btn-secondary">Call ${phone || '(555) 123-4567'}</button>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section class="services">
    <div class="section-header">
      <div class="eyebrow">Our Services</div>
      <h2>Premium ${businessType} Solutions</h2>
      <p>We offer the industry's most advanced services, delivered by certified professionals</p>
    </div>
    <div class="service-grid">
      ${services ? services.split(',').map((service, i) => `
        <div class="service-card">
          <img src="https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},${service.trim().replace(/\s+/g, ',')},professional" alt="${service.trim()}">
          <div class="service-content">
            <div class="service-icon">${['🌱', '🌿', '🪴', '🌳'][i] || '✨'}</div>
            <h3>${service.trim()}</h3>
            <p>Professional ${service.trim().toLowerCase()} services tailored to your needs</p>
            <span class="price">$${(i + 1) * 75}</span>
            <button class="btn btn-primary">Book Now</button>
          </div>
        </div>
      `).join('') : `
        <div class="service-card">
          <img src="https://source.unsplash.com/800x600/?${businessType.replace(/\s+/g, ',')},service,professional" alt="Service">
          <div class="service-content">
            <div class="service-icon">🌱</div>
            <h3>Premium Service</h3>
            <p>Professional service description here</p>
            <span class="price">$75</span>
            <button class="btn btn-primary">Book Now</button>
          </div>
        </div>
      `}
    </div>
  </section>

  <!-- Testimonials Section -->
  <section class="testimonials">
    <div class="section-header">
      <div class="eyebrow">Testimonials</div>
      <h2>What Our Clients Say</h2>
      <p>Hear from our satisfied customers who trust us with their outdoor spaces</p>
    </div>
    <div class="testimonial-grid">
      <div class="testimonial">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p class="testimonial-text">"Outstanding service! My lawn has never looked better. The team was professional, punctual, and exceeded all expectations."</p>
        <div class="author">
          <img src="https://source.unsplash.com/150x150/?portrait,professional,male,headshot" alt="John Smith">
          <div class="author-info">
            <strong>John Smith</strong>
            <small>Verified Customer</small>
          </div>
        </div>
      </div>
      <div class="testimonial">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p class="testimonial-text">"I'm thoroughly impressed! They transformed our yard into something truly special. Highly recommend to anyone."</p>
        <div class="author">
          <img src="https://source.unsplash.com/150x150/?portrait,professional,female,headshot" alt="Sarah Johnson">
          <div class="author-info">
            <strong>Sarah Johnson</strong>
            <small>Verified Customer</small>
          </div>
        </div>
      </div>
      <div class="testimonial">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <p class="testimonial-text">"Best decision we made! The quality of work and attention to detail is unmatched. Worth every penny."</p>
        <div class="author">
          <img src="https://source.unsplash.com/150x150/?portrait,professional,person,headshot" alt="Mike Davis">
          <div class="author-info">
            <strong>Mike Davis</strong>
            <small>Verified Customer</small>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <h2>Ready to Transform Your Lawn?</h2>
    <p>Join 500+ satisfied customers and get started today</p>
    <div class="cta-buttons">
      <button class="btn btn-primary" style="background: white; color: #059669;">Book Free Consultation</button>
      <button class="btn btn-secondary">Call ${phone || '(555) 123-4567'}</button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-content">
      <h3>${businessName}</h3>
      <p>Premium ${businessType} services. Ceramic coatings and paint protection film installations by certified professionals.</p>
      <div class="footer-bottom">
        <p>&copy; 2025 ${businessName}. All rights reserved. | Powered by SORCE</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
      
      setGeneratedHTML(mockHTML);
      setGenerationStep('Complete!');
      
      setTimeout(() => {
        setCurrentView('preview');
        setIsGenerating(false);
      }, 500);
      
      return; // Exit here - don't call real API
    }
    // ============================================
    // END DEV MODE
    // ============================================
    
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

