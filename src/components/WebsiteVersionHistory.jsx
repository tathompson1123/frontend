import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Eye, X, AlertCircle } from 'lucide-react';

export default function WebsiteVersionHistory({ apiUrl, authFetch, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!confirm('Restore this version? Your current work will be saved as a new version.')) {
      return;
    }

    setRestoring(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/restore-version/${versionId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Version restored successfully!');
        onRestore(data.html_content, data.pages);
        onClose();
      } else {
        throw new Error('Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" />
              Version History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Restore a previous version of your website
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Version List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No version history yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Versions are created each time you save changes
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                      previewVersion?.id === version.id ? 'bg-amber-50 border-l-4 border-amber-600' : ''
                    }`}
                    onClick={() => setPreviewVersion(version)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index === 0 ? 'NOW' : `v${version.version_number}`}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {index === 0 ? 'Current Version' : `Version ${version.version_number}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(version.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {version.description && (
                      <p className="text-xs text-gray-600 mt-1">{version.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview & Actions */}
          <div className="flex-1 flex flex-col">
            {previewVersion ? (
              <>
                {/* Preview */}
                <div className="flex-1 overflow-hidden bg-gray-100 p-4">
                  <div className="h-full bg-white rounded-lg shadow-inner overflow-hidden">
                    <iframe
                      srcDoc={previewVersion.html_content}
                      title="Version Preview"
                      className="w-full h-full border-0"
                      sandbox=""
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Version {previewVersion.version_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(previewVersion.created_at)}
                      </p>
                    </div>
                  </div>

                  {versions[0]?.id !== previewVersion.id ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">Restoring this version will:</p>
                          <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                            <li>Save your current work as a new version</li>
                            <li>Replace your current website with this version</li>
                            <li>Allow you to edit from this point forward</li>
                          </ul>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestore(previewVersion.id)}
                        disabled={restoring}
                        className="w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        {restoring ? 'Restoring...' : 'Restore This Version'}
                      </button>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-green-800 font-medium">✓ This is your current version</p>
                      <p className="text-sm text-green-700 mt-1">No need to restore</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Select a version to preview</p>
                  <p className="text-sm mt-2">Click on a version from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
