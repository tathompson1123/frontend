// ============================================
// EDITOR V2 - MAIN EXPORTS
// ============================================

// Main Editor Component
export { default as PageEditor } from './components/editor/PageEditor';

// Schema utilities
export {
  generateId,
  WIDGET_TYPES,
  WIDGET_CATALOG,
  SECTION_TEMPLATES,
  createWidget,
  createColumn,
  createRow,
  createSection,
  createPage,
  getDefaultWidgetContent,
  getDefaultWidgetStyle,
} from './utils/schema';

// HTML Renderer
export { renderPageToHtml } from './utils/htmlRenderer';
