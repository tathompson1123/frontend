import { useState, useEffect } from 'react';
import { Globe, RefreshCw, Edit, ArrowRight, Eye, EyeOff, Send, Link, Check, AlertCircle, Loader, X, ExternalLink, Upload, Code } from 'lucide-react';
import PublishWizard from './PublishWizard';
import EmbedCode from './EmbedCode';
import FeatureGate from './FeatureGate';
import GenerateModal from '../GenerateModal';

export default function MyWebsite({ apiUrl, user, navigate, websiteData, authFetch, setCurrentView, refreshWebsiteData, onUserPlanUpdate, inOnboarding }) {
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [domainManagedByUs, setDomainManagedByUs] = useState(false);
  const [domainPurchaseDate, setDomainPurchaseDate] = useState(null);
  const [dnsPropagated, setDnsPropagated] = useState(false);
  const [vercelUrl, setVercelUrl] = useState('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [showConnectWebsite, setShowConnectWebsite] = useState(false);
  const [existingWebsiteUrl, setExistingWebsiteUrl] = useState('');
  const [subTab, setSubTab] = useState('integrate');

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
      setDomainManagedByUs(websiteData.domain_managed_by_us || false);
      setDomainPurchaseDate(websiteData.domain_purchase_date || null);
      // Normalize vercel_url — strip ALL protocol prefixes and ensure single https://
      let rawUrl = websiteData.vercel_url || '';
      if (rawUrl) {
        // Remove any combination of http/https with or without colon and slashes
        rawUrl = rawUrl.replace(/^(https?:?\/?\/?\/?)+/i, '');
        rawUrl = `https://${rawUrl}`;
      }
      setVercelUrl(rawUrl);

    }
  }, [websiteData]);

  // Poll DNS propagation status every 2 minutes when domain is managed by us and not yet propagated
  useEffect(() => {
    if (!domainManagedByUs || !customDomain || !authFetch || !apiUrl) return;

    const checkDns = async () => {
      try {
        const res = await authFetch(`${apiUrl}/api/website/domain-dns-status?domain=${customDomain}`);
        const data = await res.json();
        if (data.propagated) setDnsPropagated(true);
      } catch {}
    };

    checkDns();
    if (!dnsPropagated) {
      const interval = setInterval(checkDns, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [domainManagedByUs, customDomain, dnsPropagated, authFetch, apiUrl]);

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

      {/* Sub-tabs — Sorce Website hidden; Integrate Website is the active focus */}
      {/* <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit"> ... </div> */}

      {/* Header with action buttons */}
      <div className={`flex justify-between items-center ${subTab === 'integrate' ? 'hidden' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sorce Website</h2>
          <p className="text-gray-600 mt-1">Manage your website and domain</p>
        </div>
        {subTab === 'website' && (
          <div className="flex gap-3">
            {currentWebsite && (
              /* Smart Publish Button */
              <button
                onClick={publishBtn.onClick}
                disabled={publishBtn.disabled}
                className={`px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ${publishBtn.className}`}
              >
                <PublishIcon className="w-4 h-4" />
                {publishBtn.label}
              </button>
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


      {subTab === 'website' && currentWebsite ? (
        <div className="space-y-4">
          {/* Inline Status Bar */}
          {isPublished && domainManagedByUs && customDomain && !dnsPropagated && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>DNS is propagating — <strong>{customDomain}</strong> may take 1–12 hours to go live worldwide.</span>
            </div>
          )}
          {isPublished && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {domainManagedByUs && customDomain && !dnsPropagated ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                    Processing
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
                {customDomain ? (
                  <a href={`https://${customDomain.replace(/^https?:?\/*/, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {customDomain.replace(/^https?:?\/*/, '')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : vercelUrl ? (
                  <a href={vercelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {vercelUrl.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/editor-v2')}
                  className="group relative overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="tracking-wide">Edit Website</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200" style={{ minHeight: '450px' }}>
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
                <div className="overflow-hidden relative" style={{ height: '600px' }}>
                  <iframe
                    srcDoc={currentWebsite || ''}
                    title="Website Preview"
                    className="w-full h-full bg-white border-0"
                    sandbox="allow-scripts"
                    scrolling="no"
                    style={{ overflow: 'hidden' }}
                  />
                  <div className="absolute inset-0 z-10" style={{ cursor: 'default', pointerEvents: 'all' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : subTab === 'integrate' ? (
        <EmbedCode apiUrl={apiUrl} authFetch={authFetch} setCurrentView={setCurrentView} inOnboarding={inOnboarding} />
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

      {/* Generate / Regenerate Website Modal */}
      <GenerateModal
        isOpen={showEditWebsite}
        onClose={() => setShowEditWebsite(false)}
        defaultValues={websiteForm}
        isRegeneration={!!currentWebsite}
        onSuccess={() => {
          setShowEditWebsite(false);
          refreshWebsiteData();
        }}
      />

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
