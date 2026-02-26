import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Edit, ArrowRight, Eye, EyeOff, Monitor, Send, Smartphone, Link, Check, AlertCircle, Loader, X, ExternalLink, Upload, Code } from 'lucide-react';
import PublishWizard from './PublishWizard';
import EmbedCode from './EmbedCode';
import FeatureGate from './FeatureGate';

export default function MyWebsite({ apiUrl, user, navigate, websiteData, authFetch, setCurrentView, refreshWebsiteData, onUserPlanUpdate }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [vercelUrl, setVercelUrl] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConnectWebsite, setShowConnectWebsite] = useState(false);
  const [existingWebsiteUrl, setExistingWebsiteUrl] = useState('');
  const [subTab, setSubTab] = useState('website');

  // Publish wizard state
  const [showPublishWizard, setShowPublishWizard] = useState(false);
  const [wizardStartStep, setWizardStartStep] = useState(1);

  const [websiteForm, setWebsiteForm] = useState({
    businessName: user.businessName || '', businessType: '', tagline: '', services: '',
    yearsInBusiness: '', certifications: '', description: '', uniqueSellingPoints: '', targetCustomer: '',
    phone: '', email: '', city: '', state: '',
  });

  // Business settings gate
  const [businessSettingsComplete, setBusinessSettingsComplete] = useState(null);
  const [missingSettings, setMissingSettings] = useState([]);

  // Check if business settings are complete
  useEffect(() => {
    const checkBusinessSettings = async () => {
      try {
        const [businessInfoRes, servicesRes, employeesRes] = await Promise.all([
          authFetch(`${apiUrl}/api/business-info`),
          authFetch(`${apiUrl}/api/services`),
          authFetch(`${apiUrl}/api/employees`)
        ]);

        const businessInfo = await businessInfoRes.json();
        const servicesData = await servicesRes.json();
        const employeesData = await employeesRes.json();

        const info = businessInfo?.businessInfo || {};
        const services = servicesData?.services || [];
        const employees = employeesData?.employees || [];

        const missing = [];
        if (!info.phone || !info.email) missing.push('Contact info (phone & email)');
        if (!info.address || !info.city || !info.state || !info.zip_code) missing.push('Business location');
        if (!((info.service_area_type === 'zipcodes' && info.service_zip_codes?.length > 0) ||
              (info.service_area_type === 'radius' && info.center_zip_code && info.service_radius > 0))) {
          missing.push('Service area');
        }
        if (services.length === 0) missing.push('At least one service');
        if (employees.length === 0) missing.push('At least one team member');

        setMissingSettings(missing);
        setBusinessSettingsComplete(missing.length === 0);
      } catch (error) {
        console.error('Error checking business settings:', error);
        setBusinessSettingsComplete(false);
        setMissingSettings(['Unable to verify business settings']);
      }
    };

    if (apiUrl && authFetch) {
      checkBusinessSettings();
    }
  }, [apiUrl, authFetch]);

  useEffect(() => {
    if (websiteData) {
      setCurrentWebsite(websiteData.html_content);
      setIsPublished(websiteData.is_published || false);
      setCustomDomain(websiteData.custom_domain || '');
      setDomainVerified(websiteData.domain_verified || false);
      setVercelUrl(websiteData.vercel_url || '');
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

        if (refreshWebsiteData) {
          await refreshWebsiteData();
        }

        sessionStorage.setItem('trigger-onboarding-step-2', 'true');
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { detail: { step: 2 } }));
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate website. Please try again.');
      setIsRegenerating(false);
    }
  };

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
        alert('Website connected! You can now manage it from your dashboard.');

        window.dispatchEvent(new CustomEvent('onboarding-step-complete', {
          detail: { step: 2 }
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

  // Smart publish button state
  const getPublishButton = () => {
    if (!user?.plan) {
      return {
        label: 'Publish Website',
        icon: Send,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 animate-pulse',
        disabled: false,
        onClick: () => { setWizardStartStep(1); setShowPublishWizard(true); }
      };
    }
    if (!isPublished) {
      return {
        label: 'Publish Changes',
        icon: Send,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 animate-pulse',
        disabled: false,
        onClick: () => { setWizardStartStep(4); setShowPublishWizard(true); }
      };
    }
    if (!customDomain || !domainVerified) {
      return {
        label: 'Configure Domain',
        icon: Globe,
        className: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105',
        disabled: false,
        onClick: () => { setWizardStartStep(3); setShowPublishWizard(true); }
      };
    }
    return {
      label: 'Published',
      icon: Check,
      className: 'bg-gray-300 text-gray-600 cursor-default',
      disabled: true,
      onClick: () => {}
    };
  };

  const publishBtn = currentWebsite ? getPublishButton() : null;
  const PublishIcon = publishBtn?.icon;

  // Show loading state while checking business settings
  if (businessSettingsComplete === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  // Hard gate only for re-generation when settings are still incomplete after first website
  if (!businessSettingsComplete && currentWebsite) {
    // Already have a website — show soft reminder but don't block (handled inline below)
  }

  return (
    <div className="space-y-6">
      {/* Soft business settings reminder for users without a website yet */}
      {!businessSettingsComplete && !currentWebsite && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Complete your business settings for best results</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Missing:{' '}
              <span className="font-medium">{missingSettings.join(', ')}</span>.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('business-settings')}
            className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Complete Settings
          </button>
        </div>
      )}

      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
          <p className="text-gray-600 mt-1">Manage your website and domain</p>
        </div>
        {subTab === 'website' && (
          <div className="flex gap-3">
            {currentWebsite && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/editor-v2')}
                  className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-amber-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Website
                </button>

                {/* Smart Publish Button */}
                <button
                  onClick={publishBtn.onClick}
                  disabled={publishBtn.disabled}
                  className={`px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${publishBtn.className}`}
                >
                  <PublishIcon className="w-4 h-4" />
                  {publishBtn.label}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowEditWebsite(true)}
              className="bg-white border-2 border-amber-600 text-amber-600 px-6 py-2 rounded-lg font-semibold hover:bg-amber-50 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate New
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSubTab('website')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
            subTab === 'website'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          Website
        </button>
      </div>

      {subTab === 'website' && currentWebsite ? (
        <div className="space-y-4">
          {/* Inline Status Bar */}
          {isPublished && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
                {customDomain ? (
                  <a href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {customDomain} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : vercelUrl ? (
                  <a href={vercelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {vercelUrl.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
              {!customDomain && isPublished && (
                <button
                  onClick={() => { setWizardStartStep(3); setShowPublishWizard(true); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Add Custom Domain
                </button>
              )}
            </div>
          )}

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
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${devicePreview === 'desktop' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreview('mobile')}
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition ${devicePreview === 'mobile' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
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
                <div className="flex justify-center items-center w-full">
                  <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] shadow-2xl p-3 border-[14px] border-gray-900 flex-shrink-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                      <div className="absolute top-0 left-0 right-0 h-11 bg-white z-10 flex items-center justify-between px-6 text-xs font-semibold">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="absolute top-11 left-0 right-0 h-12 bg-gray-100 z-10 flex items-center px-3 border-b border-gray-200">
                        <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2 min-w-0">
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customDomain || vercelUrl?.replace('https://', '') || 'your-website.com'}</span>
                        </div>
                      </div>
                      <div
                        className="absolute top-[92px] left-0 right-0 bottom-0 overflow-hidden"
                        style={{ overflow: 'hidden' }}
                      >
                        <iframe
                          srcDoc={currentWebsite || ''}
                          title="Mobile Website Preview"
                          className="border-0 bg-white pointer-events-none"
                          sandbox="allow-scripts allow-same-origin"
                          style={{
                            width: '375px',
                            height: 'calc(667px - 92px)',
                            display: 'block',
                            overflow: 'hidden'
                          }}
                          scrolling="no"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : subTab === 'website' ? (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No website yet</h3>
          <p className="text-gray-600 mb-6">Generate an AI-powered website or connect your existing one</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setShowEditWebsite(true)}
              className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Generate New Website
            </button>

            <button
              type="button"
              onClick={() => setShowConnectWebsite(true)}
              className="flex-1 bg-white border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all inline-flex items-center justify-center gap-2"
            >
              <Link className="w-5 h-5" />
              Connect Existing Website
            </button>
          </div>
        </div>
      ) : null}

      {/* Publish Wizard */}
      {showPublishWizard && (
        <PublishWizard
          isOpen={showPublishWizard}
          onClose={() => {
            setShowPublishWizard(false);
            if (refreshWebsiteData) refreshWebsiteData();
          }}
          startStep={wizardStartStep}
          user={user}
          apiUrl={apiUrl}
          authFetch={authFetch}
          websiteData={websiteData}
          refreshWebsiteData={refreshWebsiteData}
          onUserPlanUpdate={onUserPlanUpdate}
        />
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
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-blue-600">Basic Information</span></h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                    <input type="text" value={websiteForm.businessName} onChange={(e) => setWebsiteForm({ ...websiteForm, businessName: e.target.value })} required placeholder="e.g., Thompson's Auto Detailing" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                    <input type="text" value={websiteForm.businessType} onChange={(e) => setWebsiteForm({ ...websiteForm, businessType: e.target.value })} required placeholder="e.g., Plumbing, Auto Detailing, Hair Salon" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline / Slogan</label>
                    <input type="text" value={websiteForm.tagline || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, tagline: e.target.value })} placeholder="e.g., Quality Service Since 1995" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-green-600">Contact & Location</span></h3>
                <p className="text-xs text-gray-500 mb-4">This info appears on your website and auto-saves to Business Settings</p>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
                      <input type="tel" value={websiteForm.phone} onChange={(e) => setWebsiteForm({ ...websiteForm, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
                      <input type="email" value={websiteForm.email} onChange={(e) => setWebsiteForm({ ...websiteForm, email: e.target.value })} placeholder="contact@mybusiness.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input type="text" value={websiteForm.city} onChange={(e) => setWebsiteForm({ ...websiteForm, city: e.target.value })} placeholder="e.g., Seattle" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input type="text" value={websiteForm.state} onChange={(e) => setWebsiteForm({ ...websiteForm, state: e.target.value })} placeholder="e.g., WA" maxLength="2" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-amber-600">Services & Expertise</span></h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Services Offered *</label>
                    <textarea value={websiteForm.services} onChange={(e) => setWebsiteForm({ ...websiteForm, services: e.target.value })} required placeholder="List your main services..." rows={5} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Years in Business</label>
                    <input type="number" value={websiteForm.yearsInBusiness || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, yearsInBusiness: e.target.value })} placeholder="e.g., 15" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications / Licenses</label>
                    <input type="text" value={websiteForm.certifications || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, certifications: e.target.value })} placeholder="e.g., Licensed, Bonded, Insured" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-green-600">About Your Business</span></h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description *</label>
                    <textarea value={websiteForm.description} onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })} required placeholder="Tell us about your business..." rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What Makes You Different?</label>
                    <textarea value={websiteForm.uniqueSellingPoints || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, uniqueSellingPoints: e.target.value })} placeholder="List 3-5 key differentiators..." rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Customer</label>
                    <input type="text" value={websiteForm.targetCustomer || ''} onChange={(e) => setWebsiteForm({ ...websiteForm, targetCustomer: e.target.value })} placeholder="e.g., Homeowners, Property managers" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                <button type="button" onClick={() => setShowEditWebsite(false)} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isRegenerating} className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
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
                  className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
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
