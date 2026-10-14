import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Phone, Zap } from 'lucide-react';
import { startLandingTracking } from '../utils/landingTrack';
import { VslPlayer, WhatYouGet } from './LearnMorePage';

// The page people land on after the /learnmore form: same headline, then
// step 1 (watch the video), the unlocked VSL, and step 2 (wait for our call).
function Step({ n, children }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-3 text-2xl md:text-3xl font-bold text-gray-900">
        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 text-white text-lg flex items-center justify-center">
          {n}
        </span>
        {children}
      </span>
    </div>
  );
}

export default function WatchPage() {
  // Arriving from the /learnmore form (a client-side navigation) keeps the old scroll
  // position, so start at the top, where the headline and the video are.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => startLandingTracking('watch'), []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-center gap-1.5 pt-5">
        <div className="w-5 h-5 bg-gradient-to-br from-primary-600 to-accent-600 rounded flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" fill="currentColor" />
        </div>
        <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">SORCE</span>
      </div>
      <section className="max-w-4xl mx-auto px-6 pt-6 pb-16 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-10 text-gray-900 tracking-normal leading-[1.3]" style={{ fontFamily: "'Inter', sans-serif" }}>
          We implement recurring revenue systems for <span className="text-primary-600">detailers</span> without you spending a dime on ads.
        </h1>

        <Step n="1">Watch the video</Step>
        <ArrowDown className="mx-auto w-8 h-8 text-gray-400 my-5" />

        <VslPlayer />

        <ArrowDown className="mx-auto w-8 h-8 text-gray-400 my-5" />
        <Step n="2">Wait for our call</Step>
        <p className="text-gray-600 mt-4 flex items-center justify-center gap-2">
          <Phone className="w-4 h-4 text-primary-600" /> We'll be calling the number you gave us shortly.
        </p>
      </section>

      <WhatYouGet />

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} SORCE Integrations. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
