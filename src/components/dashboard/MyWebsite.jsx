import { useState, useEffect } from 'react';
import { Globe, Sparkles, RefreshCw, ExternalLink, Eye } from 'lucide-react';

export default function MyWebsite({ apiUrl, user, navigate, websiteData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(websiteData?.url || user.websiteUrl || '');
  const [showPreview, setShowPreview] = useState(!!(websiteData?.url || user.websiteUrl));

  // Update when websiteData prop changes
  useEffect(() => {
    if (websiteData?.url) {
      setWebsiteUrl(websiteData.url);
      setShowPreview(true);
    }
  }, [websiteData]);

  const handleGenerateWebsite = async () => {
    setIsGenerating(true);
    try {
      // Get user data for website generation
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessName: user.businessName || 'My Business',
          businessType: 'service business',
          services: 'Professional services',
          description: 'Quality service you can trust'
        })
      });

      const data = await response.json();
      
      if (data.success && data.html) {
        // Save the generated HTML to the database
        const saveResponse = await fetch(`${apiUrl}/api/website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            htmlContent: data.html
          })
        });

        const saveData = await saveResponse.json();
        
        if (saveData.success) {
          // Create a preview URL (you can customize this)
          const previewUrl = `${apiUrl}/preview/${saveData.website.id}`;
          setWebsiteUrl(previewUrl);
          setShowPreview(true);
          
          // Update user in localStorage
          const updatedUser = { ...user, websiteUrl: previewUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          alert('Failed to save website');
        }
      } else {
        alert('Failed to generate website');
      }
    } catch (error) {
      console.error('Error generating website:', error);
      alert('Failed to generate website');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
          <p className="text-gray-600 mt-1">AI-generated website for your business</p>
        </div>
        <div className="flex gap-3">
          {websiteUrl && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                View Live Site
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleGenerateWebsite}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {websiteUrl ? 'Regenerate Website' : 'Generate Website'}
              </>
            )}
          </button>
        </div>
      </div>

      {!websiteUrl && !isGenerating && (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Website Yet</h3>
          <p className="text-gray-600 mb-6">Generate an AI-powered website for your business in seconds</p>
          <button
            type="button"
            onClick={handleGenerateWebsite}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
          >
            <Sparkles className="w-6 h-6 inline-block mr-2" />
            Generate My Website
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="bg-white rounded-xl p-12 text-center">
          <RefreshCw className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Website...</h3>
          <p className="text-gray-600">This will take about 30 seconds</p>
        </div>
      )}

      {showPreview && websiteUrl && !isGenerating && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Globe className="w-5 h-5" />
              <span className="font-semibold">Website Preview</span>
            </div>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
          <div className="relative" style={{ paddingBottom: '75%' }}>
            <iframe
              src={websiteUrl}
              title="Website Preview"
              className="absolute inset-0 w-full h-full"
              style={{ minHeight: '600px' }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">AI-Powered Design</h3>
          <p className="text-sm text-gray-700">
            Your website is automatically generated using AI based on your business information
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Fully Responsive</h3>
          <p className="text-sm text-gray-700">
            Works perfectly on desktop, tablet, and mobile devices
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Easy Updates</h3>
          <p className="text-sm text-gray-700">
            Regenerate anytime to update with your latest services and information
          </p>
        </div>
      </div>
    </div>
  );
}
