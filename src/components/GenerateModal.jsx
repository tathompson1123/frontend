// ============================================
// GenerateModal
// Self-contained website generation form + loading screen.
// Used on the homepage AND in the dashboard regenerate flow.
// Handles: form → API call → GenerationProgress → success redirect.
// ============================================

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Wand2, X, RefreshCw } from 'lucide-react';
import GenerationProgress from './GenerationProgress';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function GenerateModal({ isOpen, onClose, defaultValues = {}, isRegeneration = false, onSuccess }) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    tagline: '',
    services: '',
    description: '',
    yearsInBusiness: '',
    certifications: '',
    uniqueSellingPoints: '',
    targetCustomer: '',
    phone: '',
    email: '',
    city: '',
    state: '',
  });

  // Merge in defaultValues whenever they change (e.g. pre-filled from business settings)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData(prev => ({ ...prev, ...defaultValues }));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const simulateProgress = () => {
    const steps = [8, 20, 37, 50, 65, 80, 92];
    let i = 0;
    const durations = [4000, 6000, 8000, 7000, 6000, 6000, 8000];
    const tick = () => {
      if (i < steps.length) {
        setProgress(steps[i]);
        setTimeout(() => { i++; tick(); }, durations[i] || 6000);
      }
    };
    tick();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    flushSync(() => {
      setIsGenerating(true);
      setError(null);
      setProgress(0);
    });
    simulateProgress();

    const bodyPayload = {
      businessName: formData.businessName,
      businessType: formData.businessType,
      tagline: formData.tagline,
      services: formData.services,
      yearsInBusiness: formData.yearsInBusiness,
      certifications: formData.certifications,
      description: formData.description,
      uniqueSellingPoints: formData.uniqueSellingPoints,
      targetCustomer: formData.targetCustomer,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      state: formData.state,
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      const endpoint = isLoggedIn ? '/api/generate-v2' : '/api/generate-preview';
      if (isLoggedIn) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      if (data.success) {
        setProgress(100);
        setTimeout(() => {
          setIsGenerating(false);
          if (isLoggedIn) {
            if (onSuccess) {
              onSuccess();
            } else {
              navigate('/dashboard?tab=website', { state: { showSuccess: true } });
            }
          } else {
            // Store preview data and navigate to preview page
            sessionStorage.setItem('previewWebsite', JSON.stringify({
              html: data.html,
              pages: data.pages,
              schema: data.schema,
              theme: data.theme,
              formData: data.formData || bodyPayload,
            }));
            navigate('/preview');
          }
        }, 600);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setIsGenerating(false);
      setProgress(0);
      setError(err.message || 'Failed to generate. Please try again.');
    }
  };

  // Show full-screen loading while generating (replaces everything)
  if (isGenerating) {
    return (
      <GenerationProgress
        businessName={formData.businessName}
        progress={progress}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isRegeneration ? 'Regenerate Website' : 'Generate Your Website'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isRegeneration
                ? 'Update your business info and we\'ll rebuild your site'
                : 'Fill in your business details — AI does the rest in ~60 seconds'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Basic Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="text-blue-600">📋</span> Basic Information
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name *</label>
              <input
                type="text" name="businessName" value={formData.businessName}
                onChange={handleChange} required
                placeholder="e.g. Mike's Plumbing Service"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Type *</label>
              <input
                type="text" name="businessType" value={formData.businessType}
                onChange={handleChange} required
                placeholder="e.g. Plumbing, HVAC, Photography, Cleaning..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline / Slogan</label>
              <input
                type="text" name="tagline" value={formData.tagline}
                onChange={handleChange}
                placeholder="e.g. Quality Service Since 1995"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="text-green-600">📍</span> Contact & Location
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="(555) 123-4567"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="contact@mybusiness.com"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text" name="city" value={formData.city}
                  onChange={handleChange} placeholder="e.g. Seattle"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text" name="state" value={formData.state}
                  onChange={handleChange} placeholder="WA" maxLength="2"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm uppercase"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="text-amber-600">🔧</span> Services & Description
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Services Offered</label>
              <input
                type="text" name="services" value={formData.services}
                onChange={handleChange}
                placeholder="e.g. Emergency repairs, drain cleaning, water heater installation"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Description</label>
              <textarea
                name="description" value={formData.description}
                onChange={handleChange} rows={3}
                placeholder="Tell us about your business, what makes you special, your experience..."
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {isRegeneration
                ? <><RefreshCw className="w-4 h-4" /> Regenerate Website</>
                : <><Wand2 className="w-4 h-4" /> Generate My Website</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
