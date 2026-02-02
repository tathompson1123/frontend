import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Edit, ArrowRight, Eye, EyeOff, Monitor, Send, Smartphone, Link, Check, AlertCircle, Loader, X, ExternalLink, Upload, Zap, ShoppingCart, CreditCard } from 'lucide-react';
import FeatureGate from './FeatureGate';

export default function MyWebsite({ apiUrl, user, navigate, websiteData, authFetch, setCurrentView, refreshWebsiteData }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [showDomainSetup, setShowDomainSetup] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
const [websiteForm, setWebsiteForm] = useState({
  businessName: user.businessName || '', businessType: '', tagline: '', services: '',
  yearsInBusiness: '', certifications: '', description: '', uniqueSellingPoints: '', targetCustomer: '',
  phone: '', email: '', city: '', state: '',
});

  // Domain setup state
  const [vercelUrl, setVercelUrl] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domainStatus, setDomainStatus] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainSetupMode, setDomainSetupMode] = useState(null); // 'buy' or 'connect'

  // Domain purchase state
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [showConnectWebsite, setShowConnectWebsite] = useState(false);
  const [existingWebsiteUrl, setExistingWebsiteUrl] = useState('');

  useEffect(() => {
  if (websiteData) {
    setCurrentWebsite(websiteData.html_content);
    setIsPublished(websiteData.is_published || false);
    setCustomDomain(websiteData.custom_domain || '');
    setVercelUrl(websiteData.vercel_url || '');
    if (websiteData.custom_domain) {
      setDomainStatus(websiteData.domain_verified ? 'verified' : 'pending');
    }
  }
}, [websiteData]);

// Pre-fill form from saved business info when modal opens
useEffect(() => {
  if (showEditWebsite) {
    const fetchBizInfo = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/business-info`);
        const data = await response.json();
        if (data.businessInfo) {
          setWebsiteForm(prev => ({
            ...prev,
            phone: prev.phone || data.businessInfo.phone || '',
            email: prev.email || data.businessInfo.email || '',
            city: prev.city || data.businessInfo.city || '',
            state: prev.state || data.businessInfo.state || '',
          }));
        }
      } catch (err) {
        console.log('Could not pre-fill business info:', err);
      }
    };
    fetchBizInfo();
  }
}, [showEditWebsite]);

const handleRegenerateWebsite = async (e) => {
  e.preventDefault();
  setIsRegenerating(true);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/api/generate-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
        phone: websiteForm.phone,
        email: websiteForm.email,
        city: websiteForm.city,
        state: websiteForm.state,
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.html) {
      setCurrentWebsite(data.html);
      setShowEditWebsite(false);
      setIsRegenerating(false);
      
      // Refresh parent's data
      if (refreshWebsiteData) {
        await refreshWebsiteData();
      }
      
      // Trigger onboarding step completion
      sessionStorage.setItem('trigger-onboarding-step-1', 'true');
      window.dispatchEvent(new CustomEvent('onboarding-step-complete', { detail: { step: 1 } }));
    } else {
      throw new Error(data.error || 'Generation failed');
    }
  } catch (error) {
    console.error('Generation error:', error);
    alert('Failed to generate website. Please try again.');
    setIsRegenerating(false);
  }
};

  // After your other functions (deployWebsite, etc.)

const handleConnectExistingWebsite = async () => {
  if (!existingWebsiteUrl.trim()) {
    alert('Please enter a website URL');
    return;
  }

  try {
    const response = await authFetch(`${apiUrl}/api/website/connect-existing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: existingWebsiteUrl.trim() })
    });
    
    if (response.ok) {
      const data = await response.json();
      setCurrentWebsite(data.html_content);
      setShowConnectWebsite(false);
      alert('✅ Website connected! You can now manage it from your dashboard.');
      
      // Trigger step 1 completion
      window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
        detail: { step: 1 } 
      }));
    } else {
      const error = await response.json();
      alert('Failed to connect website: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error connecting website:', error);
    alert('Failed to connect website');
  }
};

  // Search for available domains
  const searchDomains = async () => {
    if (!domainSearchQuery.trim()) {
      alert('Please enter a domain name to search');
      return;
    }

    setIsSearching(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/search-domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: domainSearchQuery.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableDomains(data.domains || []);
      } else {
        alert('Failed to search domains');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search domains');
    } finally {
      setIsSearching(false);
    }
  };

  // Purchase domain
  const purchaseDomain = async () => {
    if (!selectedDomain) return;

    setIsPurchasing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/purchase-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain.name })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomDomain(data.domain);
        setDomainStatus('verified'); // Auto-verified since we manage it
        alert('🎉 Domain purchased and connected! Your website is live!');
        setShowDomainSetup(false);
        setDomainSetupMode(null);
      } else {
        const error = await response.json();
        alert('Failed to purchase domain: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase domain');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Connect existing domain
  const addCustomDomain = async () => {
    if (!domainInput.trim()) {
      alert('Please enter a domain');
      return;
    }

    setDomainLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/add-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomDomain(data.domain);
        setDomainStatus('pending');
        alert('✅ Domain added! Follow the nameserver instructions below.');
      } else {
        const error = await response.json();
        alert('Failed to add domain: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Add domain error:', error);
      alert('Failed to add domain');
    } finally {
      setDomainLoading(false);
    }
  };

  const checkDomainStatus = async () => {
    setDomainLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/domain-status`);
      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setDomainStatus('verified');
          alert('🎉 Domain verified! Your website is now live at ' + customDomain);
        } else {
          alert('Domain not verified yet. DNS changes can take 5-60 minutes.');
        }
      }
    } catch (error) {
      console.error('Check domain error:', error);
    } finally {
      setDomainLoading(false);
    }
  };

  const removeDomain = async () => {
    if (!confirm('Remove custom domain?')) return;

    try {
      const response = await authFetch(`${apiUrl}/api/website/remove-domain`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setCustomDomain('');
        setDomainStatus(null);
        setDomainInput('');
        alert('Domain removed successfully');
      }
    } catch (error) {
      console.error('Remove domain error:', error);
      alert('Failed to remove domain');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
          <p className="text-gray-600 mt-1">Manage your website and domain</p>
        </div>
       <div className="flex gap-3">
 {currentWebsite && (
  <>
    <button 
      type="button" 
      onClick={() => navigate('/editor-v2')} 
      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center gap-2"
    >
      <Edit className="w-4 h-4" />
      Edit Website
    </button>
    
    {/* PUBLISH BUTTON with nudge animation when unpublished */}
    <FeatureGate 
      user={user} 
      feature="publish"
      onUpgradeClick={() => setCurrentView && setCurrentView('billing')}
    >
     <button
  onClick={async () => {
    if (isPublished) return; // Do nothing if already published
    
    try {
      const token = localStorage.getItem('token');
      const response = await authFetch(`${apiUrl}/api/website/publish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          html_content: websiteData.html_content,
          pages: websiteData.pages
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsPublished(true);
        
        // Update vercel URL if returned
        if (data.url) {
          setVercelUrl(data.url);
        }
        
        alert('✅ Website published successfully!');
        // Removed window.location.reload() - just update state!
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish website');
    }
  }}
  disabled={isPublished}
  className={`px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${
    isPublished
      ? 'bg-gray-300 text-gray-600 cursor-default'
      : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 animate-pulse'
  }`}
>
  <Send className="w-4 h-4" />
  {isPublished ? 'Published ✓' : 'Publish Changes'}
</button>
    </FeatureGate>
  </>
)}
  <button 
    type="button" 
    onClick={() => setShowEditWebsite(true)} 
    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center gap-2"
  >
    <RefreshCw className="w-4 h-4" />
    Generate New
  </button>
</div>
      </div>

      {currentWebsite ? (
        <div className="space-y-6">
          {/* Website Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>Website Preview</span>
                </div>
                {isPublished ? (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    <Eye className="w-3 h-3" />Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    <EyeOff className="w-3 h-3" />Draft
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setDevicePreview('desktop')} 
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setDevicePreview('mobile')} 
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>
            <div className={`flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 transition-all`} style={{ minHeight: devicePreview === 'desktop' ? '450px' : '800px' }}>
              {devicePreview === 'desktop' ? (
                <div className="w-full bg-white rounded-lg shadow-2xl overflow-hidden border-8 border-gray-800">
                  <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 text-center">
                      {customDomain || vercelUrl?.replace('https://', '') || 'your-website.com'}
                    </div>
                  </div>
                  <div className="overflow-hidden" style={{ height: '600px' }}>
                    <iframe 
                      srcDoc={currentWebsite || ''} 
                      title="Desktop Website Preview" 
                      className="w-full h-full bg-white border-0 pointer-events-none" 
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div> 
              ) : (
                /* ============================================
                   MOBILE PREVIEW - FIXED VERSION
                   - Non-scrollable, non-interactive preview
                   - Uses scale transform to fit content
                   ============================================ */
                <div className="flex justify-center items-center w-full">
                  {/* Phone Frame */}
                  <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] shadow-2xl p-3 border-[14px] border-gray-900 flex-shrink-0">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
                    
                    {/* Screen Container */}
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
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
                      
                      {/* URL Bar */}
                      <div className="absolute top-11 left-0 right-0 h-12 bg-gray-100 z-10 flex items-center px-3 border-b border-gray-200">
                        <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2 min-w-0">
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customDomain || vercelUrl?.replace('https://', '') || 'your-website.com'}</span>
                        </div>
                      </div>
                      
                      {/* FIXED: iframe content area - scaled to fit, no scroll */}
                      <div 
                        className="absolute top-[92px] left-0 right-0 bottom-0 overflow-hidden"
                        style={{ 
                          /* Hide any overflow from scaled content */
                          overflow: 'hidden'
                        }}
                      >
                        {/* 
                          FIXED: Scale the iframe to show full-width content
                          - iframe renders at 375px wide (mobile width)
                          - Content height is set tall enough to show above-the-fold
                          - pointer-events-none prevents any interaction
                          - No scrolling - this is just a preview thumbnail
                        */}
                        <iframe 
                          srcDoc={currentWebsite || ''} 
                          title="Mobile Website Preview" 
                          className="border-0 bg-white pointer-events-none"
                          sandbox="allow-scripts allow-same-origin"
                          style={{ 
                            width: '375px',
                            height: 'calc(667px - 92px)', /* Exact height of visible area */
                            display: 'block',
                            overflow: 'hidden'
                          }}
                          scrolling="no"
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
          {/* Deployment & Domain Management */}
          <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Deployment Status */}
<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
    <Zap className="w-5 h-5 text-blue-600" />
    Deployment Status
  </h3>
  {vercelUrl ? (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
        isPublished 
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        {isPublished ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-900 font-medium">Published & Live</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-900 font-medium">Unpublished Changes</span>
          </>
        )}
      </div>
      <a 
        href={vercelUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
      >
        {vercelUrl} <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    </div>
  ) : (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Deploy your website to make it accessible online</p>
      <FeatureGate 
        user={user} 
        feature="deploy"
        onUpgradeClick={() => setCurrentView && setCurrentView('billing')}
      >
        <button
          onClick={deployWebsite}
          disabled={isDeploying}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isDeploying ? (
            <><Loader className="w-4 h-4 animate-spin" />Deploying...</>
          ) : (
            <><Globe className="w-4 h-4" />Deploy Website</>
          )}
        </button>
      </FeatureGate>
    </div>
  )}
</div>

        {/* Domain Management */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Link className="w-5 h-5 text-purple-600" />
                Domain & Hosting
              </h3>
              {customDomain ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    domainStatus === 'verified' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    {domainStatus === 'verified' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        domainStatus === 'verified' ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        {domainStatus === 'verified' ? 'Connected' : 'Pending Verification'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{customDomain}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {domainStatus !== 'verified' && (
                      <button
                        onClick={checkDomainStatus}
                        disabled={domainLoading}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {domainLoading ? 'Checking...' : 'Check Status'}
                      </button>
                    )}
                    <button
                      onClick={removeDomain}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <p className="text-sm text-gray-600 mb-4">Choose how you want to get your domain:</p>
                  
                  {/* Side by side domain options */}
                  <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-auto">
                    {/* Buy Domain Option */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200 flex flex-col min-h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Buy a Domain</h4>
                          <p className="text-xs text-gray-600">$15/year</p>
                        </div>
                      </div>
                      <ul className="space-y-1 text-xs text-gray-700 mb-4 flex-1">
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Fully managed</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Instant activation</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Privacy included</span>
                        </li>
                      </ul>
                      <div className="text-center mb-3">
                        <p className="text-xs text-gray-600">Annual Price</p>
                        <p className="text-2xl font-bold text-purple-600">$15</p>
                        <p className="text-xs text-gray-500">per year</p>
                      </div>
                      <button
                        onClick={() => {
                          setDomainSetupMode('buy');
                          setShowDomainSetup(true);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Search & Buy Domain
                      </button>
                    </div>

                    {/* Connect Domain Option */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200 flex flex-col min-h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Link className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Connect Domain</h4>
                          <p className="text-xs text-gray-600">Free hosting</p>
                        </div>
                      </div>
                      <ul className="space-y-1 text-xs text-gray-700 mb-4 flex-1">
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Use your domain</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Free SSL & hosting</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>2-step setup</span>
                        </li>
                      </ul>
                      <div className="text-center mb-3">
                        <p className="text-xs text-gray-600">Hosting Cost</p>
                        <p className="text-2xl font-bold text-blue-600">Free</p>
                        <p className="text-xs text-gray-500">included</p>
                      </div>
                      <button
                        onClick={() => {
                          setDomainSetupMode('connect');
                          setShowDomainSetup(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Link className="w-4 h-4" />
                        Connect My Domain
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No website yet</h3>
          <p className="text-gray-600 mb-6">Generate an AI-powered website or connect your existing one</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button 
              type="button" 
              onClick={() => setShowEditWebsite(true)} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Generate New Website
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowConnectWebsite(true)} 
              className="flex-1 bg-white border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all inline-flex items-center justify-center gap-2"
            >
              <Link className="w-5 h-5" />
              Connect Existing Website
            </button>
          </div>
        </div>
      )}

      {/* Domain Setup Modal */}

      {/* Domain Setup Modal */}
      {showDomainSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {domainSetupMode === 'buy' ? (
              // BUY DOMAIN FLOW
              <div>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Buy Your Domain</h2>
                    <p className="text-sm text-gray-600 mt-1">$15/year • Fully managed • Instant setup</p>
                  </div>
                  <button onClick={() => {
                    setShowDomainSetup(false);
                    setDomainSetupMode(null);
                    setAvailableDomains([]);
                    setSelectedDomain(null);
                  }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {/* Search Domain */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      Search for your perfect domain
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={domainSearchQuery}
                        onChange={(e) => setDomainSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        onKeyPress={(e) => e.key === 'Enter' && searchDomains()}
                        placeholder="mybusiness"
                        className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                      />
                      <button
                        onClick={searchDomains}
                        disabled={isSearching || !domainSearchQuery.trim()}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSearching ? (
                          <><Loader className="w-5 h-5 animate-spin" />Searching...</>
                        ) : (
                          <>Search</>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">We'll show you available .com, .net, .org options</p>
                  </div>

                  {/* Available Domains */}
                  {availableDomains.length > 0 && (
                    <div className="space-y-3">
                      {availableDomains.filter(d => d.available && !d.isSuggestion).length > 0 ? (
                        <>
                          <h3 className="font-semibold text-gray-900">Available Domains:</h3>
                          <div className="grid gap-3">
                            {availableDomains.filter(d => d.available && !d.isSuggestion).map((domain) => (
                              <div
                                key={domain.name}
                                onClick={() => setSelectedDomain(domain)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                                  selectedDomain?.name === domain.name
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedDomain?.name === domain.name
                                        ? 'border-purple-600 bg-purple-600'
                                        : 'border-gray-300'
                                    }`}>
                                      {selectedDomain?.name === domain.name && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-lg">{domain.name}</p>
                                      <p className="text-sm text-green-600 font-medium">✓ Available</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">${domain.price}</p>
                                    <p className="text-xs text-gray-500">per year</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                      
                      {/* Suggested Alternatives */}
                      {availableDomains.filter(d => d.available && d.isSuggestion).length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-900 mb-2">💡 Suggested Alternatives:</h3>
                          <p className="text-xs text-gray-500 mb-3">Similar domains that are available</p>
                          <div className="grid gap-3">
                            {availableDomains.filter(d => d.available && d.isSuggestion).map((domain) => (
                              <div
                                key={domain.name}
                                onClick={() => setSelectedDomain(domain)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                                  selectedDomain?.name === domain.name
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-blue-200 hover:border-blue-300 bg-blue-50/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedDomain?.name === domain.name
                                        ? 'border-blue-600 bg-blue-600'
                                        : 'border-blue-300'
                                    }`}>
                                      {selectedDomain?.name === domain.name && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-lg">{domain.name}</p>
                                      <p className="text-sm text-blue-600 font-medium">✓ Available</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">${domain.price}</p>
                                    <p className="text-xs text-gray-500">per year</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* All Taken Message */}
                      {availableDomains.filter(d => d.available).length === 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                          <h3 className="font-semibold text-gray-900 mb-2">All domains are taken</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            <strong>{domainSearchQuery}.com</strong>, <strong>.net</strong>, and <strong>.org</strong> are all registered.
                          </p>
                          <p className="text-xs text-gray-500">
                            Try a different name or variation
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchase Button */}
                  {selectedDomain && (
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">Ready to purchase?</h3>
                          <p className="text-sm text-gray-600">You'll be charged ${selectedDomain.price}/year. Auto-renews annually.</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700">Domain:</span>
                          <span className="font-semibold text-gray-900">{selectedDomain.name}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700">Annual cost:</span>
                          <span className="font-semibold text-gray-900">${selectedDomain.price}/year</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <Check className="w-4 h-4" />
                            <span>Includes hosting, SSL, and auto-renewal</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={purchaseDomain}
                        disabled={isPurchasing}
                        className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPurchasing ? (
                          <><Loader className="w-6 h-6 animate-spin" />Processing Purchase...</>
                        ) : (
                          <><ShoppingCart className="w-6 h-6" />Purchase Domain - ${selectedDomain.price}/year</>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-3">
                        Secure payment • Auto-renews annually • Cancel anytime
                      </p>
                    </div>
                  )}

                  {/* What's Included */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">✨ What's included:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Domain registration</p>
                          <p className="text-sm text-gray-600">We buy and manage it for you</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Instant setup</p>
                          <p className="text-sm text-gray-600">Live in under 5 minutes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Free SSL certificate</p>
                          <p className="text-sm text-gray-600">Secure HTTPS included</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Auto-renewal</p>
                          <p className="text-sm text-gray-600">Never worry about expiration</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Domain privacy</p>
                          <p className="text-sm text-gray-600">Hide your personal info</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Priority support</p>
                          <p className="text-sm text-gray-600">We handle all issues</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // CONNECT EXISTING DOMAIN FLOW
              <div>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Connect Your Domain</h2>
                    <p className="text-sm text-gray-600 mt-1">Free hosting • Just update nameservers</p>
                  </div>
                  <button onClick={() => {
                    setShowDomainSetup(false);
                    setDomainSetupMode(null);
                  }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {!customDomain ? (
                    // Step 1: Enter Domain
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Enter Your Domain</h3>
                          <p className="text-sm text-gray-600 mt-1">The domain you already own</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Domain Name
                          </label>
                          <input
                            type="text"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value.toLowerCase())}
                            placeholder="yourbusiness.com"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={addCustomDomain}
                          disabled={domainLoading || !domainInput.trim()}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {domainLoading ? (
                            <><Loader className="w-5 h-5 animate-spin" />Adding Domain...</>
                          ) : (
                            <>Continue <ArrowRight className="w-5 h-5" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Domain Confirmed */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            <Check className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">Domain: {customDomain}</h3>
                            <p className="text-sm text-gray-600">Ready to connect</p>
                          </div>
                          <button
                            onClick={removeDomain}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Update Nameservers */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Update Your Nameservers</h3>
                            <p className="text-sm text-gray-600 mt-1">Copy these 2 nameservers to your domain registrar</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <span className="font-mono text-purple-900 font-semibold flex-1">ns1.vercel-dns.com</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText('ns1.vercel-dns.com');
                                    alert('Copied!');
                                  }}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <span className="font-mono text-purple-900 font-semibold flex-1">ns2.vercel-dns.com</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText('ns2.vercel-dns.com');
                                    alert('Copied!');
                                  }}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="font-medium text-gray-900 mb-2">📝 Quick Guide:</p>
                            <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
                              <li>Log in to where you bought {customDomain}</li>
                              <li>Find "Nameservers" or "DNS Management"</li>
                              <li>Replace existing nameservers with the two above</li>
                              <li>Save changes</li>
                              <li>Wait 5-60 minutes for DNS to update</li>
                            </ol>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Need help? Quick guides:</p>
                            <div className="flex gap-2 flex-wrap">
                              <a href="https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                                Namecheap <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href="https://www.godaddy.com/help/change-nameservers-for-my-domains-664" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                                GoDaddy <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href="https://support.google.com/domains/answer/3290309" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                                Google Domains <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Verify */}
                      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            3
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Verify Connection</h3>
                            <p className="text-sm text-gray-600 mt-1">Check if nameservers have updated</p>
                          </div>
                        </div>

                        {domainStatus === 'verified' ? (
                          <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">🎉 Domain Connected!</h4>
                            <p className="text-gray-600 mb-4">
                              Your website is now live at <strong className="text-green-700">{customDomain}</strong>
                            </p>
                            <button
                              onClick={() => window.open(`https://${customDomain}`, '_blank')}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                            >
                              Visit Your Website <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-yellow-200 bg-yellow-50">
                              <div className="flex items-start gap-3">
                                <Loader className="w-5 h-5 text-yellow-600 animate-spin mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-yellow-900">Waiting for Nameserver Update</p>
                                  <p className="text-yellow-700 mt-1">
                                    This usually takes 5-60 minutes. Sometimes up to 24 hours.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={checkDomainStatus}
                              disabled={domainLoading}
                              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {domainLoading ? (
                                <><Loader className="w-5 h-5 animate-spin" />Checking...</>
                              ) : (
                                <><RefreshCw className="w-5 h-5" />Check Status</>
                              )}
                            </button>

                            <div className="text-center">
                              <p className="text-xs text-gray-500">
                                Taking longer than expected? <button onClick={() => window.open('mailto:support@yoursaas.com?subject=Domain Help&body=Domain: ' + customDomain, '_blank')} className="text-blue-600 hover:underline">Contact Support</button>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Website Modal */}
      {showEditWebsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentWebsite ? 'Regenerate Website' : 'Generate Website'}</h2>
                <p className="text-gray-600 text-sm mt-1">Provide detailed information for best results</p>
              </div>
              <button onClick={() => setShowEditWebsite(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleRegenerateWebsite} className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-blue-600">📋</span> Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                    <input type="text" value={websiteForm.businessName} onChange={(e) => setWebsiteForm({ ...websiteForm, businessName: e.target.value })} required placeholder="e.g., Thompson's Auto Detailing" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                    <input type="text" value={websiteForm.businessType} onChange={(e) => setWebsiteForm({ ...websiteForm, businessType: e.target.value })} required placeholder="e.g., Plumbing, Auto Detailing, Hair Salon" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline / Slogan</label>
                    <input type="text" value={websiteForm.tagline || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, tagline: e.target.value })} placeholder="e.g., Quality Service Since 1995" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Contact & Location - NEW */}
<div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-green-600">📍</span> Contact & Location</h3>
  <p className="text-xs text-gray-500 mb-4">This info appears on your website and auto-saves to Business Settings</p>
  <div className="space-y-4">
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
        <input type="tel" value={websiteForm.phone} onChange={(e) => setWebsiteForm({ ...websiteForm, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
        <input type="email" value={websiteForm.email} onChange={(e) => setWebsiteForm({ ...websiteForm, email: e.target.value })} placeholder="contact@mybusiness.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
        <input type="text" value={websiteForm.city} onChange={(e) => setWebsiteForm({ ...websiteForm, city: e.target.value })} placeholder="e.g., Seattle" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
        <input type="text" value={websiteForm.state} onChange={(e) => setWebsiteForm({ ...websiteForm, state: e.target.value })} placeholder="e.g., WA" maxLength="2" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none uppercase" />
      </div>
    </div>
  </div>
</div>

              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-purple-600">🔧</span> Services & Expertise</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Services Offered *</label>
                    <textarea value={websiteForm.services} onChange={(e) => setWebsiteForm({ ...websiteForm, services: e.target.value })} required placeholder="List your main services..." rows={5} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Years in Business</label>
                    <input type="number" value={websiteForm.yearsInBusiness || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, yearsInBusiness: e.target.value })} placeholder="e.g., 15" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications / Licenses</label>
                    <input type="text" value={websiteForm.certifications || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, certifications: e.target.value })} placeholder="e.g., Licensed, Bonded, Insured" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-green-600">💼</span> About Your Business</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description *</label>
                    <textarea value={websiteForm.description} onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })} required placeholder="Tell us about your business..." rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What Makes You Different?</label>
                    <textarea value={websiteForm.uniqueSellingPoints || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, uniqueSellingPoints: e.target.value })} placeholder="List 3-5 key differentiators..." rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Customer</label>
                    <input type="text" value={websiteForm.targetCustomer || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, targetCustomer: e.target.value })} placeholder="e.g., Homeowners, Property managers" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                <button type="button" onClick={() => setShowEditWebsite(false)} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isRegenerating} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isRegenerating ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><RefreshCw className="w-5 h-5" />{currentWebsite ? 'Regenerate Website' : 'Generate Website'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{/* Connect Existing Website Modal */}
      {showConnectWebsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Connect Your Website</h2>
                <p className="text-gray-600 text-sm mt-1">Enter your website URL to import it</p>
              </div>
              <button 
                onClick={() => setShowConnectWebsite(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={existingWebsiteUrl}
                  onChange={(e) => setExistingWebsiteUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>How it works:</strong>
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>We'll fetch your website's HTML</li>
                  <li>Make it editable in our visual editor</li>
                  <li>You can deploy it to our hosting or keep your current setup</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConnectWebsite(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectExistingWebsite}
                  disabled={!existingWebsiteUrl.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  Connect Website
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
