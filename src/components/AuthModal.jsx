import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, mode, onModeChange, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';

      const payload = mode === 'signup' 
        ? {
            email: formData.email,
            password: formData.password,
            businessName: formData.businessName,
            fullName: formData.fullName
          }
        : {
            email: formData.email,
            password: formData.password
          };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (onSuccess) {
        onSuccess(data.user, data.token);
      }

      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
              />
              <input
                type="text"
                name="businessName"
                placeholder="Business Name"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
              />
            </>
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
          />
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (mode === 'signup' ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onModeChange(mode === 'signup' ? 'login' : 'signup');
              setError('');
            }}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            {mode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 text-gray-600 hover:text-gray-900 w-full text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
