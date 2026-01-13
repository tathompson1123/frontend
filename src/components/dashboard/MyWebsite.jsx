import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Edit, ArrowRight, Eye, EyeOff, Monitor, Smartphone, Link, Check, AlertCircle, Loader, X, ExternalLink } from 'lucide-react';

export default function MyWebsite({ apiUrl, user, navigate, websiteData, authFetch }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [showDomainSetup, setShowDomainSetup] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    businessName: user.businessName || '', businessType: '', tagline: '', services: '',
    yearsInBusiness: '', certifications: '', description: '', uniqueSellingPoints: '', targetCustomer: ''
  });

  // Domain setup state
  const [vercelUrl, setVercelUrl] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domainStatus, setDomainStatus] = useState(null); // null, 'pending', 'verified'
  const [isDeploying, setIsDeploying] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);

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

  // Deploy website to Vercel
  const deployWebsite = async () => {
    setIsDeploying(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/deploy`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVercelUrl(data.url);
        alert('✅ Website deployed successfully!');
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

  // Add custom domain
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
        alert('✅ Domain added! Now follow the DNS setup instructions.');
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

  // Check domain verification status
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

  // Remove custom domain
  const removeDomain = async () => {
    if (!confirm('Remove custom domain? Your site will only be accessible via the Vercel URL.')) {
      return;
    }

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
          <p className="text-gray-600 mt-1">View and manage your AI-generated website</p>
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/editor')} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" />View/Edit Website<ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setShowEditWebsite(true)} className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />Generate New
          </button>
        </div>
        {currentWebsite && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isPublished ? <><Eye className="w-5 h-5 text-green-600" /><span className="text-green-600 font-semibold">Published</span></> : <><EyeOff className="w-5 h-5 text-gray-400" /><span className="text-gray-600">Draft</span></>}
            </div>
            <button type="button" onClick={handleTogglePublish} className={`px-6 py-2 rounded-lg text-sm font-medium transition ${isPublished ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {isPublished ? 'Unpublish' : 'Publish Now'}
            </button>
          </div>
        )}
      </div>

      {currentWebsite ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Globe className="w-4 h-4" /><span>Website Preview</span></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDevicePreview('desktop')} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
                  <Monitor className="w-4 h-4" /><span className="hidden sm:inline">Desktop</span>
                </button>
                <button type="button" onClick={() => setDevicePreview('mobile')} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
                  <Smartphone className="w-4 h-4" /><span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>
            <div className={`flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 transition-all ${devicePreview === 'mobile' ? 'min-h-[800px]' : ''}`} style={{ minHeight: devicePreview === 'desktop' ? '600px' : '800px' }}>
              {devicePreview === 'desktop' ? (
                <div className="w-full bg-white rounded-lg shadow-2xl overflow-hidden border-8 border-gray-800">
                  <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 text-center">{customDomain || user.business_name || 'Your Website'}.com</div>
                  </div>
                  <div className="overflow-hidden">
                    <iframe srcDoc={currentWebsite} title="Website Preview" className="w-full h-[600px] bg-white border-0 pointer-events-none" sandbox="" />
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
                        <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2"><Globe className="w-3 h-3" /><span className="truncate">{customDomain || user.business_name || 'website'}.com</span></div>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Website Deployment</h3>
              {vercelUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-900 font-medium">Deployed</span>
                  </div>
                  <a 
                    href={vercelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    {vercelUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={deployWebsite}
                    disabled={isDeploying}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {isDeploying ? 'Redeploying...' : 'Redeploy'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Deploy your website to make it live</p>
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

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Custom Domain</h3>
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
                    <span className={`text-sm font-medium ${
                      domainStatus === 'verified' ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {domainStatus === 'verified' ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{customDomain}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDomainSetup(true)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      View Setup
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
                  <p className="text-sm text-gray-600">Connect your own domain name</p>
                  <button
                    onClick={() => setShowDomainSetup(true)}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" />Connect Domain
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
          <p className="text-gray-600 mb-6">Generate your first website to get started</p>
          <button type="button" onClick={() => setShowEditWebsite(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />Generate Website
          </button>
        </div>
      )}

     {/* Domain Setup Modal */}
{showDomainSetup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Domain Options</h2>
          <p className="text-sm text-gray-600 mt-1">Choose how you want your website to be accessible</p>
        </div>
        <button onClick={() => setShowDomainSetup(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {!vercelUrl && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Website not deployed yet</p>
                <p className="text-sm text-yellow-700 mt-1">Please deploy your website first before setting up a domain.</p>
                <button
                  onClick={() => {
                    setShowDomainSetup(false);
                    deployWebsite();
                  }}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  Deploy Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Three Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Option 1: Free Subdomain */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Free Subdomain</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">FREE</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get a free subdomain instantly - no setup required!
            </p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-mono text-blue-900">
                {user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourbusiness'}.yoursaas.com
              </p>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Instant setup
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Free SSL certificate
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                No technical setup
              </li>
            </ul>
            <button
              disabled={!vercelUrl}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use Free Subdomain
            </button>
          </div>

          {/* Option 2: Connect Existing Domain */}
          <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              MOST POPULAR
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Connect Your Domain</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">$12/YEAR</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Already have a domain? Connect it in 3 easy steps.
            </p>
            <div className="bg-white rounded-lg p-3 mb-4 border border-blue-200">
              <p className="text-sm font-mono text-gray-900">
                yourbusiness.com
              </p>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Use your existing domain
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Professional appearance
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                We guide you through setup
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Free SSL certificate
              </li>
            </ul>
            <button
              disabled={!vercelUrl}
              onClick={() => {
                // Show DNS setup flow (existing functionality)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect Existing Domain
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Domain cost: ~$12/year from your registrar
            </p>
          </div>

          {/* Option 3: We Buy It For You */}
          <div className="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">We Handle Everything</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">$2/MONTH</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We buy and manage your domain for you - completely hands-off!
            </p>
            <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
              <p className="text-sm font-mono text-purple-900">
                yourbusiness.com
              </p>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                We purchase the domain
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Automatic setup & SSL
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Domain privacy included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Auto-renewal (no hassle)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Priority support
              </li>
            </ul>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Total: $24/year (vs $12/year DIY)
            </p>
          </div>
        </div>

        {/* Show DNS Setup Flow if connecting existing domain */}
        {customDomain && (
          <div className="space-y-6 border-t pt-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Domain: {customDomain}</h3>
                  <p className="text-sm text-gray-600">Follow the steps below to connect it</p>
                </div>
                <button
                  onClick={removeDomain}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Change
                </button>
              </div>
            </div>

            {/* DNS Setup Instructions */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add DNS Records</h3>
                  <p className="text-sm text-gray-600 mt-1">Point your domain to your website</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-medium text-gray-900 mb-3">Add these DNS records at your domain registrar:</p>
                  
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
                  <p className="font-medium text-gray-900 mb-2">📝 Step-by-Step Instructions:</p>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                    <li>Log in to where you bought {customDomain} (GoDaddy, Namecheap, etc.)</li>
                    <li>Find "DNS Settings", "DNS Management", or "Manage DNS"</li>
                    <li>Add both DNS records shown in the table above</li>
                    <li>Save your changes</li>
                    <li>Wait 5-60 minutes for changes to take effect</li>
                  </ol>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Need help? Click your registrar:</p>
                  <div className="flex gap-2 flex-wrap">
                    <a href="https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      Namecheap <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://www.godaddy.com/help/add-an-a-record-19238" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      GoDaddy <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://support.google.com/domains/answer/3290350" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      Google Domains <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://www.cloudflare.com/learning/dns/dns-records/dns-a-record/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      Cloudflare <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verify Connection</h3>
                  <p className="text-sm text-gray-600 mt-1">Check if DNS changes have propagated</p>
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
                  
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    Visit Your Website <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-yellow-200 bg-yellow-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900">DNS Propagation in Progress</p>
                        <p className="text-yellow-700 mt-1">
                          DNS changes typically take 5-60 minutes to propagate worldwide. Click "Check Status" below.
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

                  <p className="text-xs text-gray-500 text-center">
                    Still having issues? <a href="mailto:support@yoursaas.com" className="text-blue-600 hover:underline">Contact support</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show domain input if no domain yet */}
        {!customDomain && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Connect Your Existing Domain</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value.toLowerCase())}
                placeholder="yourbusiness.com"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addCustomDomain}
                disabled={domainLoading || !vercelUrl || !domainInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {domainLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500

              {!customDomain ? (
                <>
                  {/* Step 1: Enter Domain */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Enter Your Domain</h3>
                        <p className="text-sm text-gray-600 mt-1">Have an existing domain? Great! Don't have one? No problem.</p>
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

                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">Don't have a domain yet?</p>
                        <p className="text-sm text-gray-600 mb-3">
                          Purchase one from a domain registrar (typically $10-15/year):
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <a 
                            href="https://www.namecheap.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2"
                          >
                            Namecheap <ExternalLink className="w-3 h-3" />
                          </a>
                          <a 
                            href="https://www.godaddy.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 flex items-center gap-2"
                          >
                            GoDaddy <ExternalLink className="w-3 h-3" />
                          </a>
                          <a 
                            href="https://domains.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                          >
                            Google Domains <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <button
                        onClick={addCustomDomain}
                        disabled={domainLoading || !vercelUrl || !domainInput.trim()}
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
                </>
              ) : (
                <>
                  {/* Step 2: DNS Setup Instructions */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Add DNS Records</h3>
                        <p className="text-sm text-gray-600 mt-1">Point your domain to your website</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <p className="text-sm font-medium text-gray-900 mb-3">Add these DNS records to your domain registrar:</p>
                        
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
                          <li>Log in to your domain registrar (where you bought {customDomain})</li>
                          <li>Find "DNS Settings", "DNS Management", or "Nameservers"</li>
                          <li>Add the two DNS records shown in the table above</li>
                          <li>Save your changes</li>
                          <li>Wait 5-60 minutes for DNS to propagate worldwide</li>
                        </ol>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Need help? Click your registrar for instructions:</p>
                        <div className="flex gap-2 flex-wrap">
                          <a href="https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                            Namecheap <ExternalLink className="w-3 h-3" />
                          </a>
                          <a href="https://www.godaddy.com/help/add-an-a-record-19238" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                            GoDaddy <ExternalLink className="w-3 h-3" />
                          </a>
                          <a href="https://support.google.com/domains/answer/3290350" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                            Google Domains <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Verification */}
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Verify Domain</h3>
                        <p className="text-sm text-gray-600 mt-1">Check if your DNS changes have propagated</p>
                      </div>
                    </div>

                    {domainStatus === 'verified' ? (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">✅ Domain Verified!</h4>
                        <p className="text-gray-600 mb-4">
                          Your website is now live at <strong className="text-green-700">{customDomain}</strong>
                        </p>
                        
                          href={`https://${customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                        >
                          Visit Website <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-yellow-200 bg-yellow-50">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-900">DNS propagation in progress</p>
                              <p className="text-yellow-700 mt-1">
                                Changes can take 5-60 minutes to take effect worldwide. Click "Check Status" to verify.
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

                        <p className="text-xs text-gray-500 text-center">
                          Having trouble? <a href="mailto:support@yoursaas.com" className="text-blue-600 hover:underline">Contact support</a>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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
                <p className="text-gray-600 text-sm mt-1">Provide detailed information for the best results</p>
              </div>
              <button onClick={() => setShowEditWebsite(false)} className="text-gray-400 hover:text-gray-600">✕</button>
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
