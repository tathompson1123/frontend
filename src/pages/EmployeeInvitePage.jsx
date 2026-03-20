import { useSearchParams } from 'react-router-dom';
import { Smartphone, Download, Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// TODO: Replace with actual App Store / Play Store URLs once published
const APP_STORE_URL = '#';
const PLAY_STORE_URL = '#';

export default function EmployeeInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [copied, setCopied] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/employee-auth/invite-info/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setInviteInfo(data);
      })
      .catch(() => setError('Unable to verify invite'));
  }, [token]);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Link</h1>
          <p className="text-gray-500">This invite link is missing a token. Please check the link from your email.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Expired</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {inviteInfo ? `Welcome to ${inviteInfo.businessName}!` : 'You\'re Invited!'}
          </h1>
          {inviteInfo && (
            <p className="text-gray-500 text-sm">Hi {inviteInfo.employeeName}, you've been invited to join the team.</p>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <p className="font-semibold text-gray-900">Download the SORCE Employee App</p>
              <p className="text-sm text-gray-500">Available on iOS and Android</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <p className="font-semibold text-gray-900">Open the app and tap "Have an invite?"</p>
              <p className="text-sm text-gray-500">You'll find this on the login screen</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <p className="font-semibold text-gray-900">Paste your invite code and set a password</p>
              <p className="text-sm text-gray-500">Copy the code below</p>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Invite Code</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-700 truncate">
              {token}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-1 font-medium">Copied to clipboard!</p>}
        </div>

        {/* Download Buttons */}
        <div className="space-y-3">
          <a
            href={APP_STORE_URL}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Download for iPhone
          </a>
          <a
            href={PLAY_STORE_URL}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold border border-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download for Android
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          This invite expires in 72 hours. Contact your employer if you need a new one.
        </p>
      </div>
    </div>
  );
}
