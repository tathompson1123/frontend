import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageEditor } from '../editor-v2';
import { createPage } from '../editor-v2/utils/schema';
import { convertFromTemplate } from '../editor-v2/utils/convertFromTemplate';
import { renderPageToHtml, renderSiteToHtml } from '../editor-v2/utils/htmlRenderer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Detect if data is new widget-based format vs old template format
function isNewEditorFormat(data) {
  if (!data) return false;
  // Multi-page widget format: has pages[] where each page has sections with rows
  if (data.multiPage && Array.isArray(data.pages)) {
    if (data.pages.length === 0) return true;
    return Array.isArray(data.pages[0]?.sections?.[0]?.rows);
  }
  // Single-page widget format: sections have rows
  if (!Array.isArray(data.sections)) return false;
  if (data.sections.length === 0) return true;
  return Array.isArray(data.sections[0]?.rows);
}

// ============================================
// WEBSITE EDITOR (new widget-based editor)
// ============================================
export default function WebsiteEditorNew() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/website`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        let pd = data.website?.page_data;
        if (typeof pd === 'string') pd = JSON.parse(pd);

        if (pd && isNewEditorFormat(pd)) {
          // Already widget format — load directly
          setPageData(pd);
        } else if (pd) {
          // Old template format — auto-convert to widget format
          // Pass pd.theme so conversion uses the AI-generated theme colors + fonts
          console.log('🔄 Converting template format to widget format...', pd.theme?.name || 'default theme');
          const converted = convertFromTemplate(pd, pd.theme || null);
          setPageData(converted);
          console.log('✅ Conversion complete:', converted);
        } else {
          setPageData(createPage('Home', 'home'));
        }
      } else {
        setPageData(createPage('Home', 'home'));
      }
    } catch (err) {
      console.error('Load error:', err);
      setPageData(createPage('Home', 'home'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data) => {
    const token = localStorage.getItem('token');

    // Render HTML on the frontend (widget format)
    let html_content, pages_html;
    if (data.multiPage && Array.isArray(data.pages)) {
      pages_html = renderSiteToHtml(data);
      html_content = pages_html['index.html'] || Object.values(pages_html)[0];
    } else {
      html_content = renderPageToHtml(data);
      pages_html = { 'index.html': html_content };
    }

    const res = await fetch(`${API_URL}/api/website/save-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page_data: data, html_content, pages_html }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save failed');
    }

    navigate('/dashboard?tab=website');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <PageEditor
      initialData={pageData}
      onSave={handleSave}
      onBack={() => navigate('/dashboard?tab=website')}
    />
  );
}
