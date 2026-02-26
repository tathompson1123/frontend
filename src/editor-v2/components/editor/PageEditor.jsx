import { useState, useCallback, useEffect, Fragment } from 'react';
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  Undo2,
  Redo2,
  Plus,
  Layers,
  Settings,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  FilePlus,
  Navigation,
  FileText,
  X,
  Trash2,
} from 'lucide-react';

import Section from './Section';
import WidgetPanel from './Sidebar/WidgetPanel';
import SectionPanel from './Sidebar/SectionPanel';
import StylePanel from './Sidebar/StylePanel';
import NewPagePanel from './Sidebar/NewPagePanel';
import NavbarPanel, { defaultNavbar } from './Sidebar/NavbarPanel';
import WidgetRenderer from './WidgetRenderer';
import { createWidget, createSection, createPageEntry, SECTION_TEMPLATES } from '../../utils/schema';

// ============================================
// MAIN PAGE EDITOR COMPONENT
// ============================================
export default function PageEditor({
  initialData,
  onSave,
  onBack,
  onAddPage,
  pages = [],
  currentPageId,
  onPageChange,
}) {
  // ============================================
  // STATE
  // ============================================
  const [pageData, setPageData] = useState(initialData || { sections: [] });
  const [selectedElement, setSelectedElement] = useState(null); // { type: 'widget'|'section'|'row'|'column', id: string, path: object }
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [openCard, setOpenCard] = useState('sections'); // which accordion card is open
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState([initialData || { sections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  // Multi-page support
  const [activePage, setActivePage] = useState(0);
  // Section insertion picker
  const [insertAtIndex, setInsertAtIndex] = useState(null); // null = closed, number = insert at this index

  // ============================================
  // HISTORY MANAGEMENT
  // ============================================
  const pushHistory = useCallback((newData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPageData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPageData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleUndo, handleRedo]);

  // ============================================
  // UPDATE FUNCTIONS
  // ============================================
  const updatePageData = useCallback((updater) => {
    setPageData((prev) => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(newData);
      return newData;
    });
  }, [pushHistory]);

  // Helper: get sections array from data (handles single-page and multi-page)
  const getSections = useCallback((data, ap) => {
    const idx = ap !== undefined ? ap : activePage;
    if (data.multiPage && Array.isArray(data.pages)) return data.pages[idx]?.sections || [];
    return data.sections || [];
  }, [activePage]);

  // Helper: get mutable sections reference from cloned data
  const getSectionsMut = (newData, ap) => {
    const idx = ap !== undefined ? ap : activePage;
    if (newData.multiPage && Array.isArray(newData.pages)) return newData.pages[idx]?.sections;
    return newData.sections;
  };

  // Update a specific widget
  const updateWidget = useCallback((sectionId, rowId, columnId, widgetId, updates) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      const section = sections.find(s => s.id === sectionId);
      if (!section) return prev;
      const row = section.rows.find(r => r.id === rowId);
      if (!row) return prev;
      const column = row.columns.find(c => c.id === columnId);
      if (!column) return prev;
      const widgetIndex = column.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return prev;
      column.widgets[widgetIndex] = { ...column.widgets[widgetIndex], ...updates };
      return newData;
    });
  }, [updatePageData, activePage]);

  // Update navbar
  const updateNavbar = useCallback((updates) => {
    updatePageData((prev) => ({
      ...prev,
      navbar: { ...(prev.navbar || defaultNavbar()), ...updates },
    }));
  }, [updatePageData]);

  // Auto-open style card when something is selected
  useEffect(() => {
    if (selectedElement) setOpenCard('style');
  }, [selectedElement]);

  // Update a section
  const updateSection = useCallback((sectionId, updates) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;
      sections[sectionIndex] = { ...sections[sectionIndex], ...updates };
      return newData;
    });
  }, [updatePageData, activePage]);

  // Add a new section (position = -1 means append)
  const addSection = useCallback((template = 'blank', position = -1) => {
    const templateCreator = SECTION_TEMPLATES[template];
    const newSection = templateCreator ? templateCreator.create() : createSection();
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      if (position === -1 || position >= sections.length) {
        sections.push(newSection);
      } else {
        sections.splice(position, 0, newSection);
      }
      return newData;
    });
    setSelectedElement({ type: 'section', id: newSection.id });
    setInsertAtIndex(null);
  }, [updatePageData, activePage]);

  // Delete a section
  const deleteSection = useCallback((sectionId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      if (newData.multiPage && Array.isArray(newData.pages)) {
        newData.pages[activePage].sections = sections.filter(s => s.id !== sectionId);
      } else {
        newData.sections = sections.filter(s => s.id !== sectionId);
      }
      return newData;
    });
    setSelectedElement(null);
  }, [updatePageData, activePage]);

  // Move section up/down
  const moveSection = useCallback((sectionId, direction) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      const index = sections.findIndex(s => s.id === sectionId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      const [removed] = sections.splice(index, 1);
      sections.splice(newIndex, 0, removed);
      return newData;
    });
  }, [updatePageData, activePage]);

  // Delete widget
  const deleteWidget = useCallback((sectionId, rowId, columnId, widgetId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      const section = sections.find(s => s.id === sectionId);
      if (!section) return prev;
      const row = section.rows.find(r => r.id === rowId);
      if (!row) return prev;
      const column = row.columns.find(c => c.id === columnId);
      if (!column) return prev;
      column.widgets = column.widgets.filter(w => w.id !== widgetId);
      return newData;
    });
    setSelectedElement(null);
  }, [updatePageData, activePage]);

  // Duplicate widget
  const duplicateWidget = useCallback((sectionId, rowId, columnId, widgetId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sections = getSectionsMut(newData, activePage);
      if (!sections) return prev;
      const section = sections.find(s => s.id === sectionId);
      if (!section) return prev;
      const row = section.rows.find(r => r.id === rowId);
      if (!row) return prev;
      const column = row.columns.find(c => c.id === columnId);
      if (!column) return prev;
      const widgetIndex = column.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return prev;
      const originalWidget = column.widgets[widgetIndex];
      const newWidget = { ...JSON.parse(JSON.stringify(originalWidget)), id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
      column.widgets.splice(widgetIndex + 1, 0, newWidget);
      return newData;
    });
  }, [updatePageData, activePage]);

  // Add a new page (multi-page sites)
  const addPage = useCallback(({ name, slug }) => {
    const newPage = { ...createPageEntry(name, slug), filename: `${slug}.html` };
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.multiPage) {
        newData.multiPage = true;
        const currentSections = newData.sections || [];
        newData.pages = [{ id: newData.id || 'page-home', name: newData.name || 'Home', slug: 'home', filename: 'index.html', title: newData.title || 'Home', description: '', sections: currentSections }];
        delete newData.sections;
      }
      newData.pages.push(newPage);
      return newData;
    });
    // Switch to the new page after state updates
    setTimeout(() => setActivePage((prev) => {
      const pd = pageData;
      return pd.multiPage ? (pd.pages?.length || 1) : 1;
    }), 50);
  }, [updatePageData, pageData]);

  // ============================================
  // DRAG AND DROP
  // ============================================
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    // Check if dragging from widget panel (new widget)
    if (active.data?.current?.isNew) {
      setDraggedWidget(active.data.current);
      setIsDraggingWidget(true);
    } else if (active.data?.current?.isWidget) {
      setIsDraggingWidget(true);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedWidget(null);
    setIsDraggingWidget(false);

    if (!over) return;

    // Handle dropping new widget from panel
    if (active.data?.current?.isNew && over.data?.current?.accepts === 'widget') {
      const { sectionId, rowId, columnId, index } = over.data.current;
      const widgetType = active.data.current.widgetType;
      const newWidget = createWidget(widgetType);
      updatePageData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const sections = getSectionsMut(newData, activePage);
        if (!sections) return prev;
        const section = sections.find(s => s.id === sectionId);
        if (!section) return prev;
        const row = section.rows.find(r => r.id === rowId);
        if (!row) return prev;
        const column = row.columns.find(c => c.id === columnId);
        if (!column) return prev;
        column.widgets.splice(index, 0, newWidget);
        return newData;
      });
      
      setSelectedElement({
        type: 'widget',
        id: newWidget.id,
        path: { sectionId, rowId, columnId },
      });
      setOpenCard('style');
    }

    // Handle reordering existing widgets
    if (active.data?.current?.isWidget && over.data?.current?.accepts === 'widget') {
      const fromPath = active.data.current.path;
      const toPath = over.data.current;
      updatePageData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const sections = getSectionsMut(newData, activePage);
        if (!sections) return prev;
        const sourceSection = sections.find(s => s.id === fromPath.sectionId);
        const sourceRow = sourceSection?.rows.find(r => r.id === fromPath.rowId);
        const sourceColumn = sourceRow?.columns.find(c => c.id === fromPath.columnId);
        if (!sourceColumn) return prev;
        const widgetIndex = sourceColumn.widgets.findIndex(w => w.id === active.id);
        if (widgetIndex === -1) return prev;
        const [widget] = sourceColumn.widgets.splice(widgetIndex, 1);
        const targetSection = sections.find(s => s.id === toPath.sectionId);
        const targetRow = targetSection?.rows.find(r => r.id === toPath.rowId);
        const targetColumn = targetRow?.columns.find(c => c.id === toPath.columnId);
        if (!targetColumn) return prev;
        targetColumn.widgets.splice(toPath.index, 0, widget);
        return newData;
      });
    }

    // Handle dropping new section from panel
    if (active.data?.current?.isNewSection && over.data?.current?.accepts === 'section') {
      const template = active.data.current.template;
      const index = over.data.current.index;
      addSection(template, index);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedWidget(null);
    setIsDraggingWidget(false);
  };

  // ============================================
  // SAVE
  // ============================================
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(pageData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-screen flex flex-col bg-gray-100">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="h-6 w-px bg-gray-300" />

            {/* Page selector */}
            {pages.length > 0 && (
              <select
                value={currentPageId || ''}
                onChange={(e) => onPageChange?.(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-amber-500"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Device Preview */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setDevicePreview('desktop')}
              className={`p-2 rounded-md transition ${
                devicePreview === 'desktop'
                  ? 'bg-white shadow text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Desktop"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevicePreview('tablet')}
              className={`p-2 rounded-md transition ${
                devicePreview === 'tablet'
                  ? 'bg-white shadow text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Tablet"
            >
              <Tablet className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDevicePreview('mobile')}
              className={`p-2 rounded-md transition ${
                devicePreview === 'mobile'
                  ? 'bg-white shadow text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-300" />

            <button
              onClick={() => window.open(`/preview/${currentPageId}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        {/* ============================================ */}
        {/* MAIN CONTENT */}
        {/* ============================================ */}
        <div className="flex-1 flex overflow-hidden">
          {/* ============================================ */}
          {/* SIDEBAR */}
          {/* ============================================ */}
          {isSidebarOpen && (
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Accordion Card Sidebar */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

                {/* PAGES CARD */}
                <SidebarCard
                  id="pages"
                  label="Pages"
                  icon={<FileText className="w-5 h-5" />}
                  openCard={openCard}
                  onToggle={setOpenCard}
                  badge={pageData.multiPage ? pageData.pages?.length : 1}
                >
                  <div className="p-3">
                    {pageData.multiPage && Array.isArray(pageData.pages) ? (
                      <>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pageData.pages.map((page, i) => (
                            <button
                              key={page.id || i}
                              onClick={() => { setActivePage(i); setSelectedElement(null); }}
                              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition ${activePage === i ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                              {page.name || (page.filename || 'page').replace('.html', '')}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => addPage({ name: 'New Page', slug: `page-${Date.now()}` })}
                          className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 py-1.5 rounded border border-dashed border-amber-300 transition font-medium"
                        >
                          <Plus className="w-3 h-3" /> Add Page
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addPage({ name: 'New Page', slug: 'new-page' })}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 py-2 rounded border border-dashed border-gray-300 hover:border-amber-300 transition font-medium"
                      >
                        <Plus className="w-3 h-3" /> Add Another Page
                      </button>
                    )}
                  </div>
                </SidebarCard>

                {/* SECTIONS CARD */}
                <SidebarCard
                  id="sections"
                  label="Sections"
                  icon={<Layers className="w-5 h-5" />}
                  openCard={openCard}
                  onToggle={setOpenCard}
                  badge={getSections(pageData, activePage).length}
                >
                  <SectionPanel onAddSection={addSection} />
                </SidebarCard>

                {/* WIDGETS CARD */}
                <SidebarCard
                  id="widgets"
                  label="Widgets"
                  icon={<Plus className="w-5 h-5" />}
                  openCard={openCard}
                  onToggle={setOpenCard}
                >
                  <WidgetPanel />
                </SidebarCard>

                {/* NAVIGATION CARD */}
                <SidebarCard
                  id="navigation"
                  label="Navigation Menu"
                  icon={<Navigation className="w-5 h-5" />}
                  openCard={openCard}
                  onToggle={setOpenCard}
                >
                  <NavbarPanel
                    navbar={pageData.navbar}
                    onUpdate={updateNavbar}
                  />
                </SidebarCard>

                {/* STYLE CARD — auto-opens on element selection */}
                <SidebarCard
                  id="style"
                  label="Style"
                  icon={<Settings className="w-5 h-5" />}
                  openCard={openCard}
                  onToggle={setOpenCard}
                  badge={selectedElement ? '●' : null}
                >
                  <StylePanel
                    selectedElement={selectedElement}
                    pageData={pageData}
                    onUpdateWidget={updateWidget}
                    onUpdateSection={updateSection}
                    onDeleteWidget={deleteWidget}
                    onDuplicateWidget={duplicateWidget}
                  />
                </SidebarCard>

              </div>
            </aside>
          )}

          {/* Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-2 shadow-sm hover:bg-gray-50"
            style={{ left: isSidebarOpen ? '288px' : '0' }}
          >
            <PanelLeft className={`w-4 h-4 transition ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>

          {/* ============================================ */}
          {/* CANVAS */}
          {/* ============================================ */}
          <main className="flex-1 overflow-auto bg-gray-100">
            {/* Page tabs for multi-page sites */}
            {pageData.multiPage && Array.isArray(pageData.pages) && (
              <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1 overflow-x-auto">
                {pageData.pages.map((page, i) => (
                  <button
                    key={page.id || i}
                    onClick={() => { setActivePage(i); setSelectedElement(null); }}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap capitalize ${
                      activePage === i
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {page.name || (page.filename || 'page').replace('.html', '')}
                  </button>
                ))}
              </div>
            )}

            <div className="p-8">
              <div
                className={`mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
                  devicePreview === 'desktop'
                    ? 'w-full max-w-none'
                    : devicePreview === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[375px]'
                }`}
                style={{ minHeight: '100vh' }}
              >
                {/* Sections with insert bars */}
                {(() => {
                  const currentSections = getSections(pageData, activePage);
                  if (currentSections.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                        <Layers className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg mb-4">No sections yet</p>
                        <button
                          onClick={() => setInsertAtIndex(0)}
                          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                        >
                          Add Your First Section
                        </button>
                      </div>
                    );
                  }
                  return (
                    <SortableContext
                      items={currentSections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {currentSections.map((section, index) => (
                        <Fragment key={section.id}>
                          <SectionInsertBar onClick={() => setInsertAtIndex(index)} />
                          <Section
                            section={section}
                            index={index}
                            isSelected={selectedElement?.type === 'section' && selectedElement?.id === section.id}
                            selectedElement={selectedElement}
                            devicePreview={devicePreview}
                            isDraggingWidget={isDraggingWidget}
                            onSelect={() => setSelectedElement({ type: 'section', id: section.id })}
                            onSelectWidget={(widgetId, path) =>
                              setSelectedElement({ type: 'widget', id: widgetId, path })
                            }
                            onUpdateWidget={updateWidget}
                            onDelete={() => deleteSection(section.id)}
                            onMoveUp={() => moveSection(section.id, 'up')}
                            onMoveDown={() => moveSection(section.id, 'down')}
                            onDuplicate={() => {
                              const newSection = JSON.parse(JSON.stringify(section));
                              newSection.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                              updatePageData((prev) => {
                                const newData = JSON.parse(JSON.stringify(prev));
                                const secs = getSectionsMut(newData, activePage);
                                if (secs) secs.splice(index + 1, 0, newSection);
                                return newData;
                              });
                            }}
                          />
                        </Fragment>
                      ))}
                      <SectionInsertBar onClick={() => setInsertAtIndex(currentSections.length)} />
                    </SortableContext>
                  );
                })()}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION PICKER MODAL */}
      {/* ============================================ */}
      {insertAtIndex !== null && (
        <SectionPickerModal
          onSelect={(templateKey) => addSection(templateKey, insertAtIndex)}
          onClose={() => setInsertAtIndex(null)}
        />
      )}

      {/* ============================================ */}
      {/* DRAG OVERLAY */}
      {/* ============================================ */}
      <DragOverlay>
        {draggedWidget && (
          <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-amber-500 opacity-90">
            <span className="text-2xl mr-2">{draggedWidget.icon}</span>
            <span className="font-medium">{draggedWidget.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================
// SIDEBAR CARD (accordion item)
// ============================================
function SidebarCard({ id, label, icon, openCard, onToggle, badge, children }) {
  const isOpen = openCard === id;

  return (
    <div>
      {/* Card Header */}
      <button
        onClick={() => onToggle(isOpen ? null : id)}
        className={`w-full flex items-center justify-between px-5 py-4 font-semibold transition-colors ${
          isOpen
            ? 'bg-amber-50 text-amber-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={isOpen ? 'text-amber-600' : 'text-gray-400'}>{icon}</span>
          <span className="text-sm">{label}</span>
          {badge !== undefined && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium leading-none">{badge}</span>
          )}
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-amber-500" />
          : <ChevronRight className="w-4 h-4 text-gray-400" />
        }
      </button>

      {/* Card Body */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION INSERT BAR
// The "+" shown between sections on the canvas
// ============================================
function SectionInsertBar({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center h-6 group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className={`absolute inset-x-0 h-0.5 transition-colors ${hovered ? 'bg-amber-400' : 'bg-transparent group-hover:bg-amber-200'}`} />
      <div className={`relative z-10 flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold transition-all ${
        hovered ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100'
      }`}>
        <Plus className="w-3 h-3" />
        {hovered && 'Add Section'}
      </div>
    </div>
  );
}

// ============================================
// SECTION PICKER MODAL
// Shown when clicking "+" between sections
// ============================================
function SectionPickerModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Section</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          {Object.entries(SECTION_TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="text-left border-2 border-gray-200 rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="bg-gray-50 group-hover:bg-amber-50/40 transition-colors">
                <SectionWireframe templateKey={key} />
              </div>
              <div className="px-3 py-2.5 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{tpl.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SECTION WIREFRAME PREVIEWS
// Mini CSS-based layout mockups per section type
// ============================================
function SectionWireframe({ templateKey }) {
  const h = { height: 80 };
  if (templateKey === 'hero') return (
    <div className="bg-gray-800 rounded-t flex flex-col items-start justify-center px-4" style={h}>
      <div className="h-3 w-28 bg-white/40 rounded mb-2" />
      <div className="h-2 w-20 bg-white/25 rounded mb-3" />
      <div className="flex gap-2"><div className="h-4 w-12 bg-amber-400 rounded-sm" /><div className="h-4 w-10 bg-white/20 rounded-sm" /></div>
    </div>
  );
  if (templateKey === 'features') return (
    <div className="bg-white rounded-t px-3 py-2" style={h}>
      <div className="h-2 w-20 bg-gray-300 rounded mx-auto mb-3" />
      <div className="flex gap-2 justify-center">
        {[1,2,3].map(i => <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-5 h-5 bg-purple-200 rounded-full" /><div className="h-1.5 w-8 bg-gray-200 rounded" /><div className="h-1 w-10 bg-gray-100 rounded" /></div>)}
      </div>
    </div>
  );
  if (templateKey === 'testimonials') return (
    <div className="bg-gray-50 rounded-t px-3 py-2" style={h}>
      <div className="h-2 w-24 bg-gray-300 rounded mx-auto mb-3" />
      <div className="flex gap-1.5">
        {[1,2,3].map(i => <div key={i} className="flex-1 bg-white rounded border border-gray-200 p-1"><div className="h-1 w-full bg-gray-200 rounded mb-1" /><div className="h-1 w-3/4 bg-gray-100 rounded mb-2" /><div className="h-1.5 w-8 bg-gray-300 rounded" /></div>)}
      </div>
    </div>
  );
  if (templateKey === 'cta') return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t flex flex-col items-center justify-center" style={h}>
      <div className="h-2.5 w-24 bg-white/50 rounded mb-2" />
      <div className="h-1.5 w-16 bg-white/30 rounded mb-3" />
      <div className="h-5 w-16 bg-white rounded-md" />
    </div>
  );
  if (templateKey === 'contact') return (
    <div className="bg-white rounded-t px-3 py-2" style={h}>
      <div className="flex gap-2 h-full items-start pt-2">
        <div className="flex-1 space-y-1.5"><div className="h-2 w-16 bg-gray-300 rounded" /><div className="h-1.5 w-20 bg-gray-100 rounded" /><div className="h-1.5 w-12 bg-gray-100 rounded" /></div>
        <div className="flex-1 space-y-1.5"><div className="h-4 bg-gray-100 rounded border border-gray-200" /><div className="h-4 bg-gray-100 rounded border border-gray-200" /><div className="h-5 w-full bg-amber-400 rounded" /></div>
      </div>
    </div>
  );
  if (templateKey === 'gallery') return (
    <div className="bg-white rounded-t px-3 py-2" style={h}>
      <div className="h-2 w-16 bg-gray-300 rounded mx-auto mb-3" />
      <div className="grid grid-cols-3 gap-1">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-200 rounded" style={{ height: 14 }} />)}</div>
    </div>
  );
  // blank
  return (
    <div className="bg-white rounded-t flex items-center justify-center border-2 border-dashed border-gray-200" style={h}>
      <Plus className="w-6 h-6 text-gray-300" />
    </div>
  );
}
