import { useState, useEffect } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Edit, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Monitor, 
  Smartphone 
} from 'lucide-react';

export default function MyWebsite({ apiUrl, user, navigate, websiteData }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    businessName: user.businessName || '',
    businessType: '',
    tagline: '',
    services: '',
    yearsInBusiness: '',
    certifications: '',
    description: '',
    uniqueSellingPoints: '',
    targetCustomer: '',
    designStyle: 'professional',
    colorTheme: ''
  });

  // Load website data when component mounts or websiteData changes
  useEffect(() => {
    if (websiteData) {
      setCurrentWebsite(websiteData.html_content);
      setIsPublished(websiteData.is_published || false);
      setCustomDomain(websiteData.custom_domain || '');
    }
  }, [websiteData]);

  const handleTogglePublish = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/website/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          isPublished: !isPublished 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsPublished(!isPublished);
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleRegenerateWebsite = async (e) => {
    e.preventDefault();
    setIsRegenerating(true);

    try {
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: websiteForm.businessName,
          businessType: websiteForm.businessType,
          tagline: websiteForm.tagline,
          services: websiteForm.services,
          yearsInBusiness: websiteForm.yearsInBusiness,
          certifications: websiteForm.certifications,
          description: websiteForm.description,
          uniqueSellingPoints: websiteForm.uniqueSellingPoints,
          targetCustomer: websiteForm.targetCustomer,
          designStyle: websiteForm.designStyle,
          colorTheme: websiteForm.colorTheme,
          userId: user.id
        })
      });

      const data = await response.json();

      if (data.success && data.html) {
        // Save to database
        const saveResponse = await fetch(`${apiUrl}/api/website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            htmlContent: data.html
          })
        });

        const saveData = await saveResponse.json();

        if (saveData.success) {
          setCurrentWebsite(data.html);
          setShowEditWebsite(false);
          alert('Website generated successfully!');
        }
      }
    } catch (error) {
      console.error('Error generating website:', error);
      alert('Failed to generate website');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title, Buttons, and Status */}
      <div className="flex justify-between items-center">
        {/* Left: Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
          <p className="text-gray-600 mt-1">View and manage your AI-generated website</p>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/editor')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            View/Edit Website
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEditWebsite(true)}
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New
          </button>
        </div>

        {/* Right: Status and Publish */}
        {currentWebsite && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isPublished ? (
                <>
                  <Eye className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold">Published</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Draft</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleTogglePublish}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                isPublished 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPublished ? 'Unpublish' : 'Publish Now'}
            </button>
          </div>
        )}
      </div>

      {currentWebsite ? (
        <>
          {/* Website Preview with Device Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Website Preview</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDevicePreview('desktop')}
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                    devicePreview === 'desktop'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreview('mobile')}
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                    devicePreview === 'mobile'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>
            
            <div 
              className={`flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 transition-all ${
                devicePreview === 'mobile' ? 'min-h-[800px]' : ''
              }`}
              style={{ minHeight: devicePreview === 'desktop' ? '600px' : '800px' }}
            >
              {devicePreview === 'desktop' ? (
                // Desktop View - Browser Window
                <div className="w-full bg-white rounded-lg shadow-2xl overflow-hidden border-8 border-gray-800">
                  <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 text-center">
                      {user.business_name || 'Your Website'}.com
                    </div>
                  </div>
                  <iframe
                    srcDoc={currentWebsite}
                    title="Website Preview"
                    className="w-full h-[600px] bg-white border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    ref={(iframe) => {
                      if (iframe && iframe.contentWindow) {
                        iframe.onload = () => {
                          try {
                            const iframeDoc = iframe.contentWindow.document;
                            
                            // Prevent ALL navigation, only allow hash changes
                            iframeDoc.addEventListener('click', (e) => {
                              const link = e.target.closest('a');
                              if (link) {
                                const href = link.getAttribute('href');
                                
                                // Allow hash navigation (same-page)
                                if (href && href.startsWith('#')) {
                                  // Let it work naturally
                                  return;
                                }
                                
                                // Allow booking links to open in new tab
                                if (href && href.includes('/book/')) {
                                  e.preventDefault();
                                  window.open(href, '_blank');
                                  return;
                                }
                                
                                // Block all other navigation
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Navigation prevented in preview:', href);
                              }
                              
                              const form = e.target.closest('form');
                              if (form) {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Form submission prevented in preview');
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
              ) : (
                // Mobile View - iPhone Mockup
                <div className="relative">
                  {/* iPhone Frame */}
                  <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] shadow-2xl p-3 border-[14px] border-gray-900">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
                    
                    {/* Screen */}
                    <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-11 bg-white z-10 flex items-center justify-between px-6 text-xs font-semibold">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Browser Bar */}
                      <div className="absolute top-11 left-0 right-0 h-12 bg-gray-100 z-10 flex items-center px-3 border-b border-gray-200">
                        <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{user.business_name || 'website'}.com</span>
                        </div>
                      </div>

                      {/* Website Content */}
                      <div className="absolute top-[92px] left-0 right-0 bottom-0 overflow-auto">
                        <iframe
                          srcDoc={currentWebsite}
                          title="Mobile Website Preview"
                          className="w-full h-full bg-white border-0"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                          style={{ minHeight: '100%' }}
                          ref={(iframe) => {
                            if (iframe && iframe.contentWindow) {
                              iframe.onload = () => {
                                try {
                                  const iframeDoc = iframe.contentWindow.document;
                                  
                                  // Prevent ALL navigation, only allow hash changes
                                  iframeDoc.addEventListener('click', (e) => {
                                    const link = e.target.closest('a');
                                    if (link) {
                                      const href = link.getAttribute('href');
                                      
                                      // Allow hash navigation (same-page)
                                      if (href && href.startsWith('#')) {
                                        // Let it work naturally
                                        return;
                                      }
                                      
                                      // Allow booking links to open in new tab
                                      if (href && href.includes('/book/')) {
                                        e.preventDefault();
                                        window.open(href, '_blank');
                                        return;
                                      }
                                      
                                      // Block all other navigation
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Navigation prevented in preview:', href);
                                    }
                                    
                                    const form = e.target.closest('form');
                                    if (form) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Form submission prevented in preview');
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

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600 mb-4">Track website performance</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                View Analytics
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Custom Domain</h3>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-2"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch(`${apiUrl}/api/website/domain`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id, customDomain })
                    });
                    alert('Domain saved!');
                  } catch (error) {
                    console.error('Error saving domain:', error);
                  }
                }}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Save Domain
              </button>
            </div>
          </div>
        </>
      ) : (
        /* No Website Yet */
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No website yet</h3>
          <p className="text-gray-600 mb-6">Generate your first website to get started</p>
          <button
            type="button"
            onClick={() => setShowEditWebsite(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Generate Website
          </button>
        </div>
      )}

      {/* Regenerate Modal */}
      {showEditWebsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentWebsite ? 'Regenerate Website' : 'Generate Website'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Provide detailed information for the best results
                </p>
              </div>
              <button
                onClick={() => setShowEditWebsite(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRegenerateWebsite} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">📋</span> Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={websiteForm.businessName}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, businessName: e.target.value })}
                      required
                      placeholder="e.g., Thompson's Auto Detailing"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <select
                      value={websiteForm.businessType}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, businessType: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select type...</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="hvac">HVAC</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="electrical">Electrical</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="painting">Painting</option>
                      <option value="roofing">Roofing</option>
                      <option value="auto-repair">Auto Repair</option>
                      <option value="auto-detailing">Auto Detailing</option>
                      <option value="salon">Hair Salon</option>
                      <option value="spa">Spa/Massage</option>
                      <option value="fitness">Fitness/Gym</option>
                      <option value="pet-grooming">Pet Grooming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={websiteForm.tagline || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, tagline: e.target.value })}
                      placeholder="e.g., Quality Service Since 1995"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will appear prominently on your homepage</p>
                  </div>
                </div>
              </div>

              {/* Services & Expertise */}
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-purple-600">🔧</span> Services & Expertise
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Services Offered *
                    </label>
                    <textarea
                      value={websiteForm.services}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, services: e.target.value })}
                      required
                      placeholder="List your main services (one per line):&#10;• Emergency repairs&#10;• Installations&#10;• Maintenance&#10;• Inspections"
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Be specific - these will become service pages</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years in Business
                    </label>
                    <input
                      type="number"
                      value={websiteForm.yearsInBusiness || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, yearsInBusiness: e.target.value })}
                      placeholder="e.g., 15"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certifications / Licenses
                    </label>
                    <input
                      type="text"
                      value={websiteForm.certifications || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, certifications: e.target.value })}
                      placeholder="e.g., Licensed, Bonded, Insured, BBB A+ Rating"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* About Your Business */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">💼</span> About Your Business
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Description *
                    </label>
                    <textarea
                      value={websiteForm.description}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })}
                      required
                      placeholder="Tell us about your business:&#10;• What makes you unique?&#10;• Your mission and values&#10;• Your service area&#10;• Customer commitment"
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used in your "About Us" section</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What Makes You Different?
                    </label>
                    <textarea
                      value={websiteForm.uniqueSellingPoints || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, uniqueSellingPoints: e.target.value })}
                      placeholder="List 3-5 key differentiators:&#10;• Same-day service available&#10;• 100% satisfaction guarantee&#10;• Eco-friendly products&#10;• Family-owned and operated"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Customer
                    </label>
                    <input
                      type="text"
                      value={websiteForm.targetCustomer || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, targetCustomer: e.target.value })}
                      placeholder="e.g., Homeowners, Property managers, Small businesses"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Design Preferences */}
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">🎨</span> Design Preferences
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Website Style
                    </label>
                    <select
                      value={websiteForm.designStyle || 'professional'}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, designStyle: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="professional">Professional & Clean</option>
                      <option value="modern">Modern & Bold</option>
                      <option value="friendly">Friendly & Approachable</option>
                      <option value="luxury">Luxury & Premium</option>
                      <option value="minimalist">Minimalist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Color Theme (Optional)
                    </label>
                    <input
                      type="text"
                      value={websiteForm.colorTheme || ''}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, colorTheme: e.target.value })}
                      placeholder="e.g., Blue and white, Green and gold, Red and black"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditWebsite(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating Amazing Website...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      {currentWebsite ? 'Regenerate Website' : 'Generate Website'}
                    </>
                  )}
                </button>
              </div>

              {/* Tips */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> The more details you provide, the better your website will be! 
                  All fields marked with * are required, but filling out optional fields will create a more personalized website.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
