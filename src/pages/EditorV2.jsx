import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageEditor from '../components/editor/PageEditor';
import { createPage, SECTION_TEMPLATES } from '../utils/schema';
import { renderPageToHtml } from '../utils/htmlRenderer';

export default function EditorV2() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
        
        if (data.page_data) {
          setPageData(data.page_data);
          setPages(data.pages || [{ id: 'index', name: 'Home' }]);
          setCurrentPageId(data.pages?.[0]?.id || 'index');
        } else {
          const newPage = createDefaultPage();
          setPageData(newPage);
          setPages([{ id: newPage.id, name: newPage.name }]);
          setCurrentPageId(newPage.id);
        }
      } else {
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
    page.sections.push(SECTION_TEMPLATES.hero.create());
    return page;
  };

  const handleSave = async (data) => {
    try {
      const token = localStorage.getItem('token');
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
