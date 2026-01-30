import { useState } from 'react';
import { Upload, Link, X } from 'lucide-react';

// ============================================
// IMAGE WIDGET
// ============================================
export default function ImageWidget({ widget, devicePreview, isEditing, onUpdate }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const content = widget.content || {};
  const style = widget.style || {};

  const handleImageClick = () => {
    if (isEditing) {
      setShowUploadModal(true);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onUpdate({
        content: { ...content, src: imageUrl.trim() },
      });
      setImageUrl('');
      setShowUploadModal(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a server/CDN
      // For now, use a data URL
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({
          content: { ...content, src: reader.result },
        });
        setShowUploadModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const imageStyle = {
    width: content.width || '100%',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: style.borderRadius || '0',
    ...style,
  };

  // No image yet - show placeholder
  if (!content.src) {
    return (
      <>
        <div
          onClick={handleImageClick}
          className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-gray-500 font-medium">Click to add image</p>
          <p className="text-gray-400 text-sm">Upload or paste URL</p>
        </div>

        {showUploadModal && (
          <ImageUploadModal
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            onUrlSubmit={handleUrlSubmit}
            onFileUpload={handleFileUpload}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative group">
        <img
          src={content.src}
          alt={content.alt || ''}
          style={imageStyle}
          onClick={handleImageClick}
          className="cursor-pointer"
        />
        
        {/* Edit overlay */}
        {isEditing && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleImageClick}
              className="px-4 py-2 bg-white rounded-lg shadow font-medium"
            >
              Change Image
            </button>
          </div>
        )}
      </div>

      {showUploadModal && (
        <ImageUploadModal
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          onUrlSubmit={handleUrlSubmit}
          onFileUpload={handleFileUpload}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}

// ============================================
// IMAGE UPLOAD MODAL
// ============================================
function ImageUploadModal({ imageUrl, setImageUrl, onUrlSubmit, onFileUpload, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload from computer */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload from computer
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Or divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Paste URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste image URL
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === 'Enter' && onUrlSubmit()}
              />
            </div>
            <button
              onClick={onUrlSubmit}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
