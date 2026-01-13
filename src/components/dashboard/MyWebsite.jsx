import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Edit, ArrowRight, Eye, EyeOff, Monitor, Smartphone, Link, Check, AlertCircle, Loader, X, ExternalLink, Upload, Zap } from 'lucide-react';

export default function MyWebsite({ apiUrl, user, navigate, websiteData, authFetch }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [showDomainSetup, setShowDomainSetup] = useState(false);
  const [showHostingOptions, setShowHostingOptions] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    businessName: user.businessName || '', businessType: '', tagline: '', services: '',
    yearsInBusiness: '', certifications: '', description: '', uniqueSellingPoints: '', targetCustomer: ''
  });

  // Domain setup state
  const [vercelUrl, setVercelUrl] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domainStatus, setDomainStatus] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [hostingOption, setHostingOption] = useState(null); // 'we-buy-domain' or 'connect-existing'

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

  const handleTogglePublish = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/website/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished })
      });
      const data = await response.json();
      if (data.success) setIsPublished(!isPublished);
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleRegenerateWebsite = (e) => {
    e.preventDefault();
    navigate('/loading', { state: { formData: websiteForm } });
  };

  const deployWebsite = async () => {
    setIsDeploying(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/deploy`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVercelUrl(data.url);
        
        // After deployment, show hosting options
        setShowHostingOptions(true);
      } else {
        alert('Failed to deploy website. Please try again.');
      }
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Failed to deploy website');
    } finally {
      setIsDeploying(false);
    }
  };

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
        alert('✅ Domain added! Follow the DNS instructions below.');
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
            <button 
              type="button" 
              onClick={() => navigate('/editor')} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Website
            </button>
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
        <>
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
                  <div className="overflow-hidden">
                    <iframe srcDoc={currentWebsite} title="Website Preview" className="w-full h-[450px] bg-white border-0 pointer-events-none" sandbox="" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] shadow-2xl p-3 border-[14px] border-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
                    <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-11 bg-white z-10 flex items-center justify-between px-6 text-xs font-semibold">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="absolute top-11 left-0 right-0 h-12 bg-gray-100 z-10 flex items-center px-3 border-b border-gray-200">
                        <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{customDomain || 'your-website.com'}</span>
                        </div>
                      </div>
                      <div className="absolute top-[92px] left-0 right-0 bottom-0 overflow-hidden">
                        <iframe srcDoc={currentWebsite} title="Mobile Website Preview" className="w-full h-full bg-white border-0 pointer-events-none" sandbox="" style={{ minHeight: '100%' }} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deployment & Domain Management */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Deployment Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Deployment Status
              </h3>
              {vercelUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-900 font-medium">Deployed & Live</span>
                  </div>
                  <a 
                    href={vercelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                  >
                    {vercelUrl} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={deployWebsite}
                      disabled={isDeploying}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {isDeploying ? 'Redeploying...' : 'Redeploy'}
                    </button>
                    <button
                      onClick={handleTogglePublish}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        isPublished 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Deploy your website to make it accessible online</p>
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
                </div>
              )}
            </div>

            {/* Domain Management */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Link className="w-5 h-5 text-purple-600" />
                Domain & Hosting
              </h3>
              {customDomain ? (
                <div className="space-y-3">
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
                    <button
                      onClick={() => setShowDomainSetup(true)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      {domainStatus === 'verified' ? 'View Details' : 'Complete Setup'}
                    </button>
                    <button
                      onClick={removeDomain}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choose how you want to host your website</p>
                  <button
                    onClick={() => {
                      if (!vercelUrl) {
                        alert('Please deploy your website first');
                        return;
                      }
                      setShowHostingOptions(true);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Set Up Domain & Hosting
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No website yet</h3>
          <p className="text-gray-600 mb-6">Generate your first AI-powered website</p>
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

      {/* Hosting Options Modal */}
      {showHostingOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Hosting Option</h2>
                <p className="text-sm text-gray-600 mt-1">Select how you want to make your website accessible</p>
              </div>
              <button onClick={() => setShowHostingOptions(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Option 1: We Buy & Host Domain */}
                <div className="border-3 border-purple-500 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-pink-50 relative hover:shadow-xl transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                    ⭐ RECOMMENDED
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">We Handle Everything</h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-4xl font-bold text-purple-600">$3</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">All-inclusive: domain + hosting + SSL + support</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">We buy your domain</p>
                        <p className="text-sm text-gray-600">Choose any available .com domain</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Instant setup (5 minutes)</p>
                        <p className="text-sm text-gray-600">No DNS configuration needed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Free SSL certificate</p>
                        <p className="text-sm text-gray-600">Secure HTTPS included</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Domain privacy protection</p>
                        <p className="text-sm text-gray-600">Hide your personal info</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Auto-renewal & management</p>
                        <p className="text-sm text-gray-600">Never worry about expiration</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Priority support</p>
                        <p className="text-sm text-gray-600">We handle all technical issues</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setHostingOption('we-buy-domain');
                      setShowHostingOptions(false);
                      setShowDomainSetup(true);
                    }}
                    className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-purple-700 transition text-lg"
                  >
                    Choose This Option →
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Cancel anytime • No long-term commitment
                  </p>
                </div>

                {/* Option 2: Connect Existing Domain */}
                <div className="border-2 border-gray-300 rounded-2xl p-8 bg-white hover:shadow-xl transition-all">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Link className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Domain</h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-4xl font-bold text-blue-600">FREE</span>
                      <span className="text-gray-600">hosting</span>
                    </div>
                    <p className="text-sm text-gray-600">You keep your domain, we host your site</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Use your existing domain</p>
                        <p className="text-sm text-gray-600">Keep paying your registrar (~$12/year)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Free hosting on our platform</p>
                        <p className="text-sm text-gray-600">Fast, reliable, and secure</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Free SSL certificate</p>
                        <p className="text-sm text-gray-600">Secure HTTPS included</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">DNS setup required</p>
                        <p className="text-sm text-gray-600">We'll guide you step-by-step (~15 minutes)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">You manage renewals</p>
                        <p className="text-sm text-gray-600">Remember to renew at your registrar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Standard support</p>
                        <p className="text-sm text-gray-600">Email support for technical issues</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setHostingOption('connect-existing');
                      setShowHostingOptions(false);
                      setShowDomainSetup(true);
                    }}
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition text-lg"
                  >
                    Connect My Domain →
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Already have a domain? This is for you!
                  </p>
                </div>
              </div>

              {/* Comparison Note */}
              <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">💡 Which option is right for you?</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-purple-900 mb-2">Choose "We Handle Everything" if:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• You don't have a domain yet</li>
                      <li>• You want zero technical hassle</li>
                      <li>• You prefer all-in-one billing</li>
                      <li>• You want priority support</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Choose "Connect Your Domain" if:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• You already own a domain</li>
                      <li>• You're comfortable with DNS setup</li>
                      <li>• You want to save $24/year</li>
                      <li>• You want to keep your existing registrar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Setup Modal - Shows different content based on hostingOption */}
      {showDomainSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal content depends on hostingOption */}
            {hostingOption === 'we-buy-domain' ? (
              // Coming Soon UI for managed domain purchase
              <div>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Managed Domain Setup</h2>
                  <button onClick={() => setShowDomainSetup(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Very Soon!</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    We're building a seamless domain purchase experience. For now, please use the "Connect Your Domain" option if you already have one.
                  </p>
                  <button
                    onClick={() => {
                      setHostingOption('connect-existing');
                    }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    Connect Existing Domain Instead
                  </button>
                </div>
              </div>
            ) : (
              // DNS Setup Flow for connecting existing domain
              <div>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Connect Your Domain</h2>
                    <p className="text-sm text-gray-600 mt-1">3 easy steps to connect your existing domain</p>
                  </div>
                  <button onClick={() => setShowDomainSetup(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
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

                      {/* Step 2: DNS Setup */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Add DNS Records</h3>
                            <p className="text-sm text-gray-600 mt-1">Point your domain to our servers</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <p className="text-sm font-medium text-gray-900 mb-3">Add these records at your domain registrar:</p>
                            
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-blue-600">A</td>
                                    <td className="px-4 py-3 font-mono">@</td>
                                    <td className="px-4 py-3 font-mono text-blue-600">76.76.21.21</td>
                                  </tr>
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-blue-600">CNAME</td>
                                    <td className="px-4 py-3 font-mono">www</td>
                                    <td className="px-4 py-3 font-mono text-blue-600">cname.vercel-dns.com</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="font-medium text-gray-900 mb-2">📝 How to add DNS records:</p>
                            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                              <li>Log in to where you bought {customDomain}</li>
                              <li>Find "DNS Settings" or "DNS Management"</li>
                              <li>Add both records from the table above</li>
                              <li>Save changes</li>
                              <li>Wait 5-60 minutes for propagation</li>
                            </ol>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Quick guides by registrar:</p>
                            <div className="flex gap-2 flex-wrap">
                              <a href="https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                                Namecheap <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href="https://www.godaddy.com/help/add-an-a-record-19238" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                                GoDaddy <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href="https://support.google.com/domains/answer/3290350" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
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
                            <p className="text-sm text-gray-600 mt-1">Check if DNS has propagated</p>
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
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-yellow-900">Waiting for DNS Propagation</p>
                                  <p className="text-yellow-700 mt-1">
                                    This usually takes 5-60 minutes. Click "Check Status" to verify.
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

      {/* Generate Website Modal (unchanged) */}
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
    </div>
  );
}
