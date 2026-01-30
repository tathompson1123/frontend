import { useState, useCallback, useEffect } from 'react';
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
  PanelLeft
} from 'lucide-react';

import Section from './Section';
import WidgetPanel from './Sidebar/WidgetPanel';
import SectionPanel from './Sidebar/SectionPanel';
import StylePanel from './Sidebar/StylePanel';
import WidgetRenderer from './WidgetRenderer';
import { createWidget, createSection, SECTION_TEMPLATES } from '../../utils/schema';

// ============================================
// MAIN PAGE EDITOR COMPONENT
// ============================================
export default function PageEditor({ 
  initialData, 
  onSave, 
  onBack,
  pages = [],
  currentPageId,
  onPageChange 
}) {
  // ============================================
  // STATE
  // ============================================
  const [pageData, setPageData] = useState(initialData || { sections: [] });
  const [selectedElement, setSelectedElement] = useState(null); // { type: 'widget'|'section'|'row'|'column', id: string, path: object }
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [sidebarTab, setSidebarTab] = useState('widgets'); // 'widgets', 'sections', 'style', 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState([initialData || { sections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);

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

  // Update a specific widget
  const updateWidget = useCallback((sectionId, rowId, columnId, widgetId, updates) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const section = newData.sections.find(s => s.id === sectionId);
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
  }, [updatePageData]);

  // Update a section
  const updateSection = useCallback((sectionId, updates) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sectionIndex = newData.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;
      
      newData.sections[sectionIndex] = { ...newData.sections[sectionIndex], ...updates };
      return newData;
    });
  }, [updatePageData]);

  // Add a new section
  const addSection = useCallback((template = 'blank', position = -1) => {
    const templateCreator = SECTION_TEMPLATES[template];
    const newSection = templateCreator ? templateCreator.create() : createSection();
    
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (position === -1 || position >= newData.sections.length) {
        newData.sections.push(newSection);
      } else {
        newData.sections.splice(position, 0, newSection);
      }
      return newData;
    });
    
    setSelectedElement({ type: 'section', id: newSection.id });
  }, [updatePageData]);

  // Delete a section
  const deleteSection = useCallback((sectionId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.sections = newData.sections.filter(s => s.id !== sectionId);
      return newData;
    });
    setSelectedElement(null);
  }, [updatePageData]);

  // Move section up/down
  const moveSection = useCallback((sectionId, direction) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const index = newData.sections.findIndex(s => s.id === sectionId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newData.sections.length) return prev;
      
      const [removed] = newData.sections.splice(index, 1);
      newData.sections.splice(newIndex, 0, removed);
      return newData;
    });
  }, [updatePageData]);

  // Delete widget
  const deleteWidget = useCallback((sectionId, rowId, columnId, widgetId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const section = newData.sections.find(s => s.id === sectionId);
      if (!section) return prev;
      
      const row = section.rows.find(r => r.id === rowId);
      if (!row) return prev;
      
      const column = row.columns.find(c => c.id === columnId);
      if (!column) return prev;
      
      column.widgets = column.widgets.filter(w => w.id !== widgetId);
      return newData;
    });
    setSelectedElement(null);
  }, [updatePageData]);

  // Duplicate widget
  const duplicateWidget = useCallback((sectionId, rowId, columnId, widgetId) => {
    updatePageData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const section = newData.sections.find(s => s.id === sectionId);
      if (!section) return prev;
      
      const row = section.rows.find(r => r.id === rowId);
      if (!row) return prev;
      
      const column = row.columns.find(c => c.id === columnId);
      if (!column) return prev;
      
      const widgetIndex = column.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return prev;
      
      const originalWidget = column.widgets[widgetIndex];
      const newWidget = {
        ...JSON.parse(JSON.stringify(originalWidget)),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      column.widgets.splice(widgetIndex + 1, 0, newWidget);
      return newData;
    });
  }, [updatePageData]);

  // ============================================
  // DRAG AND DROP
  // ============================================
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Check if dragging from widget panel (new widget)
    if (active.data?.current?.isNew) {
      setDraggedWidget(active.data.current);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedWidget(null);

    if (!over) return;

    // Handle dropping new widget from panel
    if (active.data?.current?.isNew && over.data?.current?.accepts === 'widget') {
      const { sectionId, rowId, columnId, index } = over.data.current;
      const widgetType = active.data.current.widgetType;
      const newWidget = createWidget(widgetType);
      
      updatePageData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const section = newData.sections.find(s => s.id === sectionId);
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
      setSidebarTab('style');
    }

    // Handle reordering existing widgets
    if (active.data?.current?.isWidget && over.data?.current?.accepts === 'widget') {
      const fromPath = active.data.current.path;
      const toPath = over.data.current;
      
      // Remove from old position and add to new
      updatePageData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Find and remove widget from source
        const sourceSection = newData.sections.find(s => s.id === fromPath.sectionId);
        const sourceRow = sourceSection?.rows.find(r => r.id === fromPath.rowId);
        const sourceColumn = sourceRow?.columns.find(c => c.id === fromPath.columnId);
        
        if (!sourceColumn) return prev;
        
        const widgetIndex = sourceColumn.widgets.findIndex(w => w.id === active.id);
        if (widgetIndex === -1) return prev;
        
        const [widget] = sourceColumn.widgets.splice(widgetIndex, 1);
        
        // Add to target
        const targetSection = newData.sections.find(s => s.id === toPath.sectionId);
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
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-purple-500"
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
                  ? 'bg-white shadow text-purple-600'
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
                  ? 'bg-white shadow text-purple-600'
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
                  ? 'bg-white shadow text-purple-600'
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
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
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
              {/* Sidebar Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSidebarTab('widgets')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    sidebarTab === 'widgets'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-4 h-4 mx-auto mb-1" />
                  Widgets
                </button>
                <button
                  onClick={() => setSidebarTab('sections')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    sidebarTab === 'sections'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Layers className="w-4 h-4 mx-auto mb-1" />
                  Sections
                </button>
                <button
                  onClick={() => setSidebarTab('style')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    sidebarTab === 'style'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4 mx-auto mb-1" />
                  Style
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {sidebarTab === 'widgets' && <WidgetPanel />}
                {sidebarTab === 'sections' && <SectionPanel onAddSection={addSection} />}
                {sidebarTab === 'style' && (
                  <StylePanel
                    selectedElement={selectedElement}
                    pageData={pageData}
                    onUpdateWidget={updateWidget}
                    onUpdateSection={updateSection}
                    onDeleteWidget={deleteWidget}
                    onDuplicateWidget={duplicateWidget}
                  />
                )}
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
          <main className="flex-1 overflow-auto p-8 bg-gray-100">
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
              {/* Sections */}
              <SortableContext
                items={pageData.sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {pageData.sections.map((section, index) => (
                  <Section
                    key={section.id}
                    section={section}
                    index={index}
                    isSelected={selectedElement?.type === 'section' && selectedElement?.id === section.id}
                    selectedElement={selectedElement}
                    devicePreview={devicePreview}
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
                        newData.sections.splice(index + 1, 0, newSection);
                        return newData;
                      });
                    }}
                  />
                ))}
              </SortableContext>

              {/* Add Section Button */}
              {pageData.sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                  <Layers className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg mb-4">No sections yet</p>
                  <button
                    onClick={() => addSection('hero')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    Add Your First Section
                  </button>
                </div>
              ) : (
                <div className="py-8 flex justify-center">
                  <button
                    onClick={() => addSection('blank')}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-purple-400 hover:text-purple-600 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add Section
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ============================================ */}
      {/* DRAG OVERLAY */}
      {/* ============================================ */}
      <DragOverlay>
        {draggedWidget && (
          <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-purple-500 opacity-90">
            <span className="text-2xl mr-2">{draggedWidget.icon}</span>
            <span className="font-medium">{draggedWidget.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
