import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AutoDetailingMagnet from '../components/lead-magnets/AutoDetailingMagnet';
import LandscapingMagnet from '../components/lead-magnets/LandscapingMagnet';
import CarpetCleaningMagnet from '../components/lead-magnets/CarpetCleaningMagnet';
import WindowCleaningMagnet from '../components/lead-magnets/WindowCleaningMagnet';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TYPE_LABELS = {
  'auto-detailing': 'Auto Detailing',
  'landscaping': 'Landscaping',
  'carpet-cleaning': 'Carpet Cleaning',
  'window-cleaning': 'Window Cleaning',
};

const TYPE_THEMES = {
  'auto-detailing': { accent: 'bg-blue-600', text: 'Auto Detailing Quote Tool' },
  'landscaping': { accent: 'bg-emerald-600', text: 'Backyard Vision Estimator' },
  'carpet-cleaning': { accent: 'bg-purple-600', text: 'Carpet Health Calculator' },
  'window-cleaning': { accent: 'bg-sky-500', text: 'Window Cleaning Estimator' },
};

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500">The lead magnet type you requested doesn't exist.</p>
        <p className="text-sm text-gray-400 mt-2">
          Valid types: auto-detailing, landscaping, carpet-cleaning, window-cleaning
        </p>
      </div>
    </div>
  );
}

export default function LeadMagnetPage() {
  const { userId, type } = useParams();
  const [businessName, setBusinessName] = useState('');
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${apiUrl}/api/leads/public/${userId}/info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.businessName) setBusinessName(data.businessName);
      })
      .catch(() => {})
      .finally(() => setLoadingBiz(false));
  }, [userId]);

  const theme = TYPE_THEMES[type];
  if (!theme) return <NotFound />;

  const serviceLabel = TYPE_LABELS[type];
  const displayName = businessName || serviceLabel;

  const magnetProps = { userId, businessName: displayName, apiUrl };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              {theme.text}
            </p>
            <h1 className="text-lg font-bold leading-tight">
              {loadingBiz ? (
                <span className="inline-block w-32 h-5 bg-gray-700 rounded animate-pulse" />
              ) : (
                displayName
              )}
            </h1>
          </div>
          <div className={`${theme.accent} px-3 py-1 rounded-full text-xs font-semibold`}>
            Free Estimate
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {type === 'auto-detailing' && <AutoDetailingMagnet {...magnetProps} />}
        {type === 'landscaping' && <LandscapingMagnet {...magnetProps} />}
        {type === 'carpet-cleaning' && <CarpetCleaningMagnet {...magnetProps} />}
        {type === 'window-cleaning' && <WindowCleaningMagnet {...magnetProps} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 text-center text-xs py-3">
        Powered by{' '}
        <span className="text-white font-semibold">SORCE</span>
      </footer>
    </div>
  );
}
