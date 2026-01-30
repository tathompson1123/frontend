import { useState } from 'react';
import { Play, Link, X } from 'lucide-react';

// ============================================
// VIDEO WIDGET
// ============================================
export default function VideoWidget({ widget, isEditing, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  
  const content = widget.content || {};

  // Extract YouTube/Vimeo embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Direct video URL
    return url;
  };

  const embedUrl = getEmbedUrl(content.src);

  const handleAddVideo = () => {
    if (videoUrl.trim()) {
      onUpdate({
        content: { ...content, src: videoUrl.trim() },
      });
      setVideoUrl('');
      setShowModal(false);
    }
  };

  // No video yet
  if (!content.src) {
    return (
      <>
        <div
          onClick={() => isEditing && setShowModal(true)}
          className="w-full h-64 bg-gray-900 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition"
        >
          <Play className="w-16 h-16 text-white opacity-50 mb-4" />
          <p className="text-white opacity-70 font-medium">Click to add video</p>
          <p className="text-white opacity-50 text-sm">YouTube, Vimeo, or direct URL</p>
        </div>

        {showModal && (
          <VideoModal
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            onSubmit={handleAddVideo}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Render video
  const isEmbed = embedUrl?.includes('youtube') || embedUrl?.includes('vimeo');

  return (
    <div className="relative group">
      {isEmbed ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          src={content.src}
          controls={content.controls !== false}
          autoPlay={content.autoplay}
          muted={content.autoplay}
          loop={content.loop}
          className="w-full rounded-lg"
        />
      )}

      {/* Edit overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white rounded-lg shadow font-medium"
          >
            Change Video
          </button>
        </div>
      )}

      {showModal && (
        <VideoModal
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          onSubmit={handleAddVideo}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// VIDEO MODAL
// ============================================
function VideoModal({ videoUrl, setVideoUrl, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add Video</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video URL
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
            </div>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supports YouTube, Vimeo, or direct video URLs
          </p>
        </div>
      </div>
    </div>
  );
}
