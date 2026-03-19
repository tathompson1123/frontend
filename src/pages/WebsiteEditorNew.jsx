import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageEditor } from '../editor-v2';
import { createPage } from '../editor-v2/utils/schema';
import TemplateEditor from '../editor-v2/components/editor/TemplateEditor';

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
// WEBSITE EDITOR (smart routing)
// - Template-format (AI-generated) → TemplateEditor (iframe + content forms)
// - Widget-format (editor-created)  → PageEditor (drag-drop widgets)
// ============================================
export default function WebsiteEditorNew() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [editorMode, setEditorMode] = useState(null); // 'template' | 'widget'
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userPlan = user?.plan || null;

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
        const html = data.website?.html_content || '';
        if (typeof pd === 'string') pd = JSON.parse(pd);

        setHtmlContent(html);

        if (pd && isNewEditorFormat(pd)) {
          // Already widget format — use widget editor
          setPageData(pd);
          setEditorMode('widget');
        } else if (pd) {
          // Template format (AI-generated) — use template editor, DO NOT convert
          console.log('📄 Template format detected — loading template editor');
          setPageData(pd);
          setEditorMode('template');
        } else {
          // No data — start fresh with widget editor
          setPageData(createPage('Home', 'home'));
          setEditorMode('widget');
        }
      } else {
        setPageData(createPage('Home', 'home'));
        setEditorMode('widget');
      }
    } catch (err) {
      console.error('Load error:', err);
      setPageData(createPage('Home', 'home'));
      setEditorMode('widget');
    } finally {
      setIsLoading(false);
    }
  };

  // Template save: send schema WITHOUT html_content → backend uses full template renderer
  // This preserves all CSS, animations, fonts, and JavaScript from the original generation
  // If site isn't published yet, automatically publish after saving
  const handleTemplateSave = async (schema) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/website/save-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page_data: schema }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save failed');
    }

    const saveData = await res.json();

    // If the backend already auto-redeployed, we're done
    if (saveData.deployed) {
      navigate('/dashboard?tab=website&saved=1');
      return;
    }

    // Site wasn't published yet — call publish endpoint to deploy for the first time
    const publishRes = await fetch(`${API_URL}/api/website/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        html_content: saveData.html,
        pages: saveData.pages,
      }),
    });

    if (!publishRes.ok) {
      const err = await publishRes.json().catch(() => ({}));
      throw new Error(err.error || 'Publish failed');
    }

    navigate('/dashboard?tab=website&saved=1');
  };

  // Template draft save: same as above but passes draft: true to skip Vercel redeployment
  const handleTemplateSaveDraft = async (schema) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/website/save-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page_data: schema, draft: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save failed');
    }

    navigate('/dashboard?tab=website&saved=draft');
  };

  // Widget save: render HTML on frontend, send pre-rendered HTML + schema
  const handleWidgetSave = async (data) => {
    const token = localStorage.getItem('token');

    // Dynamic import to avoid loading heavy renderer code for template-format users
    const { renderPageToHtml, renderSiteToHtml } = await import('../editor-v2/utils/htmlRenderer');

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

    const saveData = await res.json();

    // If the backend already auto-redeployed, we're done
    if (saveData.deployed) {
      navigate('/dashboard?tab=website&saved=1');
      return;
    }

    // Site wasn't published yet — call publish endpoint to deploy for the first time
    const publishRes = await fetch(`${API_URL}/api/website/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        html_content: html_content,
        pages: pages_html,
      }),
    });

    if (!publishRes.ok) {
      const err = await publishRes.json().catch(() => ({}));
      throw new Error(err.error || 'Publish failed');
    }

    navigate('/dashboard?tab=website&saved=1');
  };

  // Widget draft save: same but passes draft: true
  const handleWidgetSaveDraft = async (data) => {
    const token = localStorage.getItem('token');
    const { renderPageToHtml, renderSiteToHtml } = await import('../editor-v2/utils/htmlRenderer');

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
      body: JSON.stringify({ page_data: data, html_content, pages_html, draft: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save failed');
    }

    navigate('/dashboard?tab=website&saved=draft');
  };

  if (isLoading || editorMode === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  const handleUpgrade = () => navigate('/dashboard?tab=billing');

  if (editorMode === 'template') {
    return (
      <TemplateEditor
        initialSchema={pageData}
        initialHtml={htmlContent}
        onSave={userPlan ? handleTemplateSave : null}
        onSaveDraft={handleTemplateSaveDraft}
        onBack={() => navigate('/dashboard?tab=website')}
        onUpgrade={!userPlan ? handleUpgrade : null}
      />
    );
  }

  return (
    <PageEditor
      initialData={pageData}
      onSave={userPlan ? handleWidgetSave : null}
      onSaveDraft={handleWidgetSaveDraft}
      onBack={() => navigate('/dashboard?tab=website')}
      onUpgrade={!userPlan ? handleUpgrade : null}
    />
  );
}
