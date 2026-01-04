import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PricingPageTest = () => {
  const navigate = useNavigate();
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleButtonClick = () => {
    console.log('🔴 BUTTON CLICKED!');
    alert('Button clicked! Modal should open...');
    setShowSignupModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pricing Page Test</h1>
        
        {/* Test Button */}
        <button
          onClick={handleButtonClick}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all"
        >
          Click Me - Test Button
          <ArrowRight className="inline w-5 h-5 ml-2" />
        </button>

        <div className="mt-4 p-4 bg-white rounded border">
          <p>Modal State: {showSignupModal ? '✅ OPEN' : '❌ CLOSED'}</p>
          <button 
            onClick={() => setShowSignupModal(!showSignupModal)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Toggle Modal State
          </button>
        </div>

        {/* Simple Modal Test */}
        {showSignupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md">
              <h2 className="text-2xl font-bold mb-4">Test Modal</h2>
              <p className="mb-4">Modal is working! ✅</p>
              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPageTest;
