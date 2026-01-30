import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageEditor from '../editor-v2/components/editor/PageEditor';
import { createPage, SECTION_TEMPLATES } from '../editor-v2/utils/schema';
import { renderPageToHtml } from '../editor-v2/utils/htmlRenderer';

export default function EditorV2() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load existing page data or create new
  useEffect(() => {
    loadPageData();
  }, []);

 const loadPageData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/api/website`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if we have page_data in the website object
      if (data.website?.page_data) {
        // Parse if it's a string
        let pageData = data.website.page_data;
        if (typeof pageData === 'string') {
          pageData = JSON.parse(pageData);
        }
        
        setPageData(pageData);
        setPages([{ id: pageData.id || 'index', name: pageData.name || 'Home' }]);
        setCurrentPageId(pageData.id || 'index');
        console.log('✅ Loaded page_data with', pageData.sections?.length, 'sections');
      } else {
        // No page_data - create default page
        console.log('⚠️ No page_data found, creating default');
        const newPage = createDefaultPage();
        setPageData(newPage);
        setPages([{ id: newPage.id, name: newPage.name }]);
        setCurrentPageId(newPage.id);
      }
    } else {
      // No website yet - create default
      const newPage = createDefaultPage();
      setPageData(newPage);
      setPages([{ id: newPage.id, name: newPage.name }]);
      setCurrentPageId(newPage.id);
    }
  } catch (error) {
    console.error('Error loading page data:', error);
    const newPage = createDefaultPage();
    setPageData(newPage);
    setPages([{ id: newPage.id, name: newPage.name }]);
    setCurrentPageId(newPage.id);
  } finally {
    setIsLoading(false);
  }
};
  const createDefaultPage = () => {
    const page = createPage('Home', 'index');
    // Add a default hero section
    page.sections.push(SECTION_TEMPLATES.hero.create());
    return page;
  };

  const handleSave = async (data) => {
    try {
      const token = localStorage.getItem('token');
      
      // Generate HTML from schema
      const html = renderPageToHtml(data);
      
      const response = await fetch(`${apiUrl}/api/website/save-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          page_data: data,
          html_content: html
        })
      });

      if (response.ok) {
        console.log('✅ Saved successfully');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handlePageChange = (pageId) => {
    setCurrentPageId(pageId);
    // TODO: Load different page data if multi-page
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <PageEditor
      initialData={pageData}
      onSave={handleSave}
      onBack={handleBack}
      pages={pages}
      currentPageId={currentPageId}
      onPageChange={handlePageChange}
    />
  );
}
