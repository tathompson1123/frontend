import { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function SignupModal({ isOpen, onClose, generatedWebsite, onSuccess, selectedPlan }) {
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailExistsPrompt, setShowEmailExistsPrompt] = useState(false);
  const [existingEmail, setExistingEmail] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    setError('');
    setShowEmailExistsPrompt(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowEmailExistsPrompt(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      if (mode === 'signup') {
        // Sign up
        const response = await fetch(`${apiUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            businessName: formData.businessName
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Save website if provided
          if (generatedWebsite) {
            await fetch(`${apiUrl}/api/website`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
              },
              body: JSON.stringify({
                userId: data.user.id,
                htmlContent: generatedWebsite
              })
            });
          }
          
          // Close modal and trigger success callback
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // Check if email already exists
          if (response.status === 409 || 
              data.error?.toLowerCase().includes('already') || 
              data.error?.toLowerCase().includes('exists') ||
              data.error?.toLowerCase().includes('registered')) {
            setExistingEmail(formData.email);
            setShowEmailExistsPrompt(true);
            setError('This email is already registered.');
          } else {
            setError(data.error || 'Signup failed');
          }
        }
      } else {
        // Login
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Save website if provided
          if (generatedWebsite) {
            await fetch(`${apiUrl}/api/website`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
              },
              body: JSON.stringify({
                userId: data.user.id,
                htmlContent: generatedWebsite
              })
            });
          }
          
          // Close modal and trigger success callback
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError(data.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setShowEmailExistsPrompt(false);
    setError('');
    // Keep the email, clear password and businessName
    setFormData(prev => ({
      ...prev,
      password: '',
      businessName: ''
    }));
  };

  const switchToSignup = () => {
    setMode('signup');
    setShowEmailExistsPrompt(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'signup' ? 'Get Your Website' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 mb-6">
          {mode === 'signup' 
            ? 'Create a free account to save and manage your website' 
            : 'Login to save your website and access your dashboard'}
        </p>
        
        {/* Email Already Exists Prompt */}
        {showEmailExistsPrompt && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Email Already Registered
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  An account with <strong>{existingEmail}</strong> already exists. 
                  Would you like to login instead?
                </p>
                <button
                  onClick={switchToLogin}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Login to Existing Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                placeholder="e.g., Mike's Plumbing"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          
          {error && !showEmailExistsPrompt && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading 
                ? 'Please wait...' 
                : mode === 'signup' 
                  ? 'Sign Up Free' 
                  : 'Login'}
            </button>
          </div>
        </form>

        {/* Toggle between Signup/Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => mode === 'signup' ? switchToLogin() : switchToSignup()}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
          >
            {mode === 'signup' 
              ? 'Already have an account? Login' 
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Trust Badge */}
        {mode === 'signup' && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure signup • ✨ Free forever • 🚀 No credit card required
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
