import { useState, useEffect, useRef, memo } from 'react';
import { 
  Move, 
  Type, 
  Palette, 
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  X
} from 'lucide-react';

const VisualEditor = memo(function VisualEditor({ htmlContent, onUpdate, currentPage, isMobileView }) {
  console.log('🔵 VisualEditor rendered, isMobileView:', isMobileView);
  const selectedElementsRef = useRef([]);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const showPropertiesModalRef = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const iframeRef = useRef(null);
  const dragStateRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const dragStartedRef = useRef(false);
  const lastSavedHtmlRef = useRef('');
  const isSavingRef = useRef(false);
  
  const [initialHtml, setInitialHtml] = useState(htmlContent || '<html><body><h1>Loading...</h1></body></html>');

  useEffect(() => {
    console.log('🟢 VisualEditor MOUNTED, isMobileView:', isMobileView);
    eventHandlersRef.current = null;
    
    return () => {
      console.log('🔴 VisualEditor UNMOUNTING, isMobileView:', isMobileView);
    };
  }, []);

  const [elementProps, setElementProps] = useState({
    width: '',
    height: '',
    fontSize: '',
    color: '',
    backgroundColor: '',
    fontWeight: '',
    textAlign: '',
    padding: '',
    margin: ''
  });

  const lastPageRef = useRef(currentPage);
  const hasLoadedRef = useRef(false);
  const lastHtmlContentRef = useRef(null);

  useEffect(() => {
    const pageChanged = lastPageRef.current !== currentPage;
    const isFirstLoad = !hasLoadedRef.current;
    const contentChanged = lastHtmlContentRef.current !== htmlContent;
    const isExternalChange = contentChanged && !isSavingRef.current;

    console.log('📄 Content update effect triggered:', { 
      pageChanged, 
      isFirstLoad, 
      contentChanged,
      isExternalChange,
      isSaving: isSavingRef.current 
    });
    
    if ((pageChanged || isFirstLoad) && htmlContent && htmlContent.length > 0) {
      setInitialHtml(htmlContent);
      hasLoadedRef.current = true;
      lastPageRef.current = currentPage;
      lastHtmlContentRef.current = htmlContent;
      isSavingRef.current = false;
      
      selectedElementsRef.current = [];
      setGuides({ vertical: [], horizontal: [] });
      showPropertiesModalRef.current = false;  // FIXED
      setModalVisible(false);  // FIXED
      dragStateRef.current = null;
    } 
   else if (isExternalChange && !isFirstLoad && iframeRef.current?.contentDocument) {
  console.log('⚠️ EXTERNAL CHANGE DETECTED - Reloading iframe content');
  const currentDoc = iframeRef.current.contentDocument;
  
  // Remove all drag placeholders and reset positions
  currentDoc.querySelectorAll('.drag-placeholder').forEach(el => el.remove());
  currentDoc.querySelectorAll('[data-has-placeholder]').forEach(el => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.zIndex = '';
    el.style.margin = '';
    delete el.dataset.hasPlaceholder;
    delete el.dataset.placeholderId;
  });
  
  const parser = new DOMParser();
  const newDoc = parser.parseFromString(htmlContent, 'text/html');
  
  currentDoc.body.innerHTML = newDoc.body.innerHTML;
      
      let style = currentDoc.getElementById('editor-styles');
      if (!style) {
        style = currentDoc.createElement('style');
        style.id = 'editor-styles';
        currentDoc.head.appendChild(style);
      }
     // If mobile view, reset any desktop drag positions
if (isMobileView) {
  currentDoc.querySelectorAll('[style*="position: absolute"]').forEach(el => {  // ✅ use currentDoc
    // Skip editor controls
    if (el.classList.contains('resize-handle') || 
        el.classList.contains('drag-placeholder') ||
        el.classList.contains('section-height-adjuster')) {
      return;
    }
    
    // Check if left value is too large for mobile (> 400px means desktop position)
    const left = parseFloat(el.style.left);
    if (left > 400) {
      console.log('🔧 Resetting desktop position for:', el.tagName, el.className);
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.zIndex = '';
      el.style.margin = '';
    }
  });
}
      
style.textContent = `
  * { box-sizing: border-box; }
  html, body { 
    position: relative !important; 
    min-height: 100vh;
    overflow-x: hidden !important;
    max-width: 100% !important;
  }
  
/* Mobile stacking styles */
.editor-mobile-mode {
  max-width: 375px !important;
}

/* Images and videos responsive */
.editor-mobile-mode img,
.editor-mobile-mode video {
  max-width: 100% !important;
  height: auto !important;
}

/* Grid layouts - stack on mobile */
.editor-mobile-mode [class*="grid-cols"] {
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
}

/* Large flex containers - stack */
.editor-mobile-mode [class*="flex"][class*="gap-8"],
.editor-mobile-mode [class*="flex"][class*="gap-10"],
.editor-mobile-mode [class*="flex"][class*="gap-12"],
.editor-mobile-mode [class*="flex"][class*="justify-between"] {
  flex-direction: column !important;
  align-items: center !important;
}

/* Ensure all text is visible */
.editor-mobile-mode h1,
.editor-mobile-mode h2,
.editor-mobile-mode h3,
.editor-mobile-mode p,
.editor-mobile-mode span,
.editor-mobile-mode a {
  max-width: 100% !important;
  word-wrap: break-word !important;
}

/* Sections should be full width */
.editor-mobile-mode section {
  width: 100% !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
}

/* MOBILE HEADER - Keep horizontal, add hamburger */
.editor-mobile-mode header,
.editor-mobile-mode nav,
.editor-mobile-mode header > div,
.editor-mobile-mode nav > div {
  flex-direction: row !important;
  width: 100% !important;
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 12px 16px !important;
}

/* Hide nav links */
.editor-mobile-mode header nav,
.editor-mobile-mode header ul,
.editor-mobile-mode header menu,
.editor-mobile-mode nav ul,
.editor-mobile-mode nav menu,
.editor-mobile-mode header a:not(.logo):not([class*="logo"]):not([class*="brand"]),
.editor-mobile-mode nav > a:not(.logo):not([class*="logo"]):not([class*="brand"]) {
  display: none !important;
}

/* Center the logo */
.editor-mobile-mode header .logo,
.editor-mobile-mode header [class*="logo"],
.editor-mobile-mode header [class*="brand"],
.editor-mobile-mode header img:first-of-type,
.editor-mobile-mode nav .logo,
.editor-mobile-mode nav [class*="logo"],
.editor-mobile-mode nav [class*="brand"] {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin: 0 !important;
}

/* Add hamburger menu icon */
.editor-mobile-mode header::before,
.editor-mobile-mode nav::before {
  content: '' !important;
  display: block !important;
  width: 24px !important;
  height: 2px !important;
  background: currentColor !important;
  box-shadow: 0 8px 0 currentColor, 0 16px 0 currentColor !important;
  position: absolute !important;
  left: 16px !important;
  top: 50% !important;
  transform: translateY(-8px) !important;
}

/* Hide CTA buttons in header for mobile */
.editor-mobile-mode header button,
.editor-mobile-mode header [class*="btn"],
.editor-mobile-mode header [class*="cta"],
.editor-mobile-mode nav button,
.editor-mobile-mode nav [class*="btn"],
.editor-mobile-mode nav [class*="cta"] {
  display: none !important;
}
  /* Editor selection styles */
  .editor-selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px !important; cursor: grab !important; }
  .editor-selected:active { cursor: grabbing !important; }
  .editor-hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px !important; }
  .editor-dragging { opacity: 0.8 !important; cursor: grabbing !important; }
  .resize-handle { position: absolute; background: #8b5cf6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .resize-handle:hover { background: #7c3aed; transform: scale(1.2); }
  .resize-nw { top: -6px; left: -6px; cursor: nw-resize; }
  .resize-ne { top: -6px; right: -6px; cursor: ne-resize; }
  .resize-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
  .resize-se { bottom: -6px; right: -6px; cursor: se-resize; }
  .resize-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  .resize-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  .resize-w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
  .resize-e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }

 /* Trust banner - MUST be last to override */
  .editor-mobile-mode .trust-banner {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow: hidden !important;
    width: 100% !important;
    gap: 0 !important;
  }
  .editor-mobile-mode .trust-banner > div {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 24px !important;
    animation: none !important;
  }
  .editor-mobile-mode .trust-banner div,
  .editor-mobile-mode .trust-banner span,
  .editor-mobile-mode .trust-banner p,
  .editor-mobile-mode [class*="trust"] span,
  .editor-mobile-mode [class*="marquee"],
  .editor-mobile-mode [class*="banner"]:not(header):not(nav) {
    flex-direction: row !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  /* Hero section - proper mobile layout */
  .editor-mobile-mode .hero {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    padding: 40px 20px !important;
    min-height: auto !important;
  }
  .editor-mobile-mode .hero > div {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    width: 100% !important;
    gap: 16px !important;
  }
  .editor-mobile-mode .hero h1,
.editor-mobile-mode .hero h2 {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  font-size: 2rem !important;
  line-height: 1.2 !important;
  text-align: center !important;
}
  .editor-mobile-mode .hero p,
  .editor-mobile-mode .hero span {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: 100% !important;
    font-size: 1rem !important;
    text-align: center !important;
  }
  .editor-mobile-mode .hero a,
  .editor-mobile-mode .hero button {
    display: inline-flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: auto !important;
    margin: 8px !important;
  }
  .editor-mobile-mode .hero img {
    max-width: 80% !important;
    height: auto !important;
    margin: 20px auto !important;
  }
`;
      
      lastHtmlContentRef.current = htmlContent;
      isSavingRef.current = false;
      
      selectedElementsRef.current = [];
      showPropertiesModalRef.current = false;  // FIXED
      setModalVisible(false);  // FIXED
    } 
    else if (!htmlContent || htmlContent.length === 0) {
      // Empty content
    } 
    else {
      console.log('✅ Content same as last saved - skipping reload');
      lastHtmlContentRef.current = htmlContent;
    }
  }, [currentPage, htmlContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            console.log('🗑️ ELEMENT REMOVED:', node.tagName, node.className);
            console.log('Stack trace:', new Error().stack);
          }
        });
      });
    });
    
    observer.observe(doc.body, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, [currentPage]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    console.log('🔄 Setting up editor for page:', currentPage);
    console.log('🔍 Current event handlers:', eventHandlersRef.current?.currentPage);
    
   if (eventHandlersRef.current?.currentPage === currentPage && 
    eventHandlersRef.current?.isMobileView === isMobileView) {
  console.log('⏭️ Editor already set up for this page/view, skipping');
  return;
}
    
    let retryCount = 0;
    const maxRetries = 20;

    const initEditor = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initEditor, 100);
        }
        return;
      }
      
      const bodyHasContent = doc.body.children && doc.body.children.length > 0;
      const bodyHasText = doc.body.textContent && doc.body.textContent.trim().length > 0;
      
      if (!bodyHasContent && !bodyHasText && retryCount < maxRetries) {
        retryCount++;
        setTimeout(initEditor, 100);
        return;
      }

      if (eventHandlersRef.current) {
        const { doc: oldDoc, handlers } = eventHandlersRef.current;
        try {
          oldDoc.removeEventListener('mousedown', handlers.mousedown);
          oldDoc.removeEventListener('mousemove', handlers.mousemove);
          oldDoc.removeEventListener('mouseup', handlers.mouseup);
          oldDoc.removeEventListener('mouseover', handlers.mouseover);
          oldDoc.removeEventListener('mouseout', handlers.mouseout);
          oldDoc.removeEventListener('dblclick', handlers.dblclick);
        } catch (e) {
          // Ignore
        }
      }

const addSectionResizers = () => {
  const doc = iframe.contentDocument;
  if (!doc) return;
  
  // Remove existing resizers
  doc.querySelectorAll('.section-height-adjuster').forEach(el => el.remove());
  
  // Find all major sections
  const sections = doc.querySelectorAll('section, .section, [class*="section"], main > div, body > div');
  
  sections.forEach((section, index) => {
    if (section.classList.contains('section-height-adjuster')) return;
    if (section.offsetHeight < 50) return; // Skip tiny sections
    
    // Create adjuster
    const adjuster = doc.createElement('div');
    adjuster.className = 'section-height-adjuster';
    adjuster.innerHTML = `
      <div class="adjuster-line"></div>
      <div class="adjuster-handle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <div class="adjuster-tooltip">Adjust section height or double click to remove any extra space above.</div>
    `;
    
    section.style.position = 'relative';
    section.appendChild(adjuster);
    
    // Handle dragging
    const handle = adjuster.querySelector('.adjuster-handle');
    const tooltip = adjuster.querySelector('.adjuster-tooltip');
    
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    
    handle.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });
    
    handle.addEventListener('mouseleave', () => {
      if (!isDragging) {
        tooltip.style.display = 'none';
      }
    });
    
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startHeight = section.offsetHeight;
      handle.style.cursor = 'ns-resize';
      tooltip.style.display = 'none';
    });
    
    doc.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      section.style.height = newHeight + 'px';
      section.style.minHeight = newHeight + 'px';
    });
    
    doc.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'pointer';
        
        // Trigger save
        if (onUpdate) {
          onUpdate(doc.documentElement.outerHTML);
        }
      }
    });
    
    // Double click to auto-adjust
    handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove extra padding/margin from section
      section.style.paddingTop = '20px';
      section.style.paddingBottom = '20px';
      section.style.height = 'auto';
      section.style.minHeight = 'auto';
      
      if (onUpdate) {
        onUpdate(doc.documentElement.outerHTML);
      }
    });
  });
};

     let style = doc.getElementById('editor-styles');
if (!style) {
  style = doc.createElement('style');
  style.id = 'editor-styles';
  doc.head.appendChild(style);
}

// Apply mobile mode class
if (isMobileView) {
  doc.body.classList.add('editor-mobile-mode');
} else {
  doc.body.classList.remove('editor-mobile-mode');
}

style.textContent = `
  * { box-sizing: border-box; }
  html, body { 
    position: relative !important; 
    min-height: 100vh;
    overflow-x: hidden !important;
    max-width: 100% !important;
  }
  
  /* Mobile stacking styles */
  .editor-mobile-mode {
    max-width: 375px !important;
  }
  
  .editor-mobile-mode img,
  .editor-mobile-mode video {
    max-width: 100% !important;
    height: auto !important;
  }
  .editor-mobile-mode [class*="flex-row"],
  .editor-mobile-mode [class*="grid-cols"] {
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* MOBILE HEADER - Keep horizontal, add hamburger */
  .editor-mobile-mode header,
  .editor-mobile-mode nav,
  .editor-mobile-mode header > div,
  .editor-mobile-mode nav > div {
    flex-direction: row !important;
    width: 100% !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 12px 16px !important;
  }
  
  /* Hide nav links */
  .editor-mobile-mode header nav,
  .editor-mobile-mode header ul,
  .editor-mobile-mode header menu,
  .editor-mobile-mode nav ul,
  .editor-mobile-mode nav menu,
  .editor-mobile-mode header a:not(.logo):not([class*="logo"]):not([class*="brand"]),
  .editor-mobile-mode nav > a:not(.logo):not([class*="logo"]):not([class*="brand"]) {
    display: none !important;
  }
  
  /* Center the logo */
  .editor-mobile-mode header .logo,
  .editor-mobile-mode header [class*="logo"],
  .editor-mobile-mode header [class*="brand"],
  .editor-mobile-mode header img:first-of-type,
  .editor-mobile-mode nav .logo,
  .editor-mobile-mode nav [class*="logo"],
  .editor-mobile-mode nav [class*="brand"] {
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    margin: 0 !important;
  }
  
  /* Add hamburger menu icon */
  .editor-mobile-mode header::before,
  .editor-mobile-mode nav::before {
    content: '' !important;
    display: block !important;
    width: 24px !important;
    height: 2px !important;
    background: currentColor !important;
    box-shadow: 0 8px 0 currentColor, 0 16px 0 currentColor !important;
    position: absolute !important;
    left: 16px !important;
    top: 50% !important;
    transform: translateY(-8px) !important;
  }
  
  /* Hide CTA buttons in header for mobile */
  .editor-mobile-mode header button,
  .editor-mobile-mode header [class*="btn"],
  .editor-mobile-mode header [class*="cta"],
  .editor-mobile-mode nav button,
  .editor-mobile-mode nav [class*="btn"],
  .editor-mobile-mode nav [class*="cta"] {
    display: none !important;
  }

  /* Editor selection styles */
  .editor-selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px !important; cursor: grab !important; }
  .editor-selected:active { cursor: grabbing !important; }
  .editor-hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px !important; }
  .editor-dragging { opacity: 0.8 !important; cursor: grabbing !important; }
  .resize-handle { position: absolute; background: #8b5cf6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.2); pointer-events: auto !important; }
  .resize-handle:hover { background: #7c3aed; transform: scale(1.2); }
  .resize-nw { top: -6px; left: -6px; cursor: nw-resize; }
  .resize-ne { top: -6px; right: -6px; cursor: ne-resize; }
  .resize-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
  .resize-se { bottom: -6px; right: -6px; cursor: se-resize; }
  .resize-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  .resize-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  .resize-w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
  .resize-e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
       
/* Trust banner - MUST be last to override */
  .editor-mobile-mode .trust-banner {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow: hidden !important;
    width: 100% !important;
    gap: 0 !important;
  }
  .editor-mobile-mode .trust-banner > div {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 24px !important;
    animation: none !important;
  }
  .editor-mobile-mode .trust-banner div,
  .editor-mobile-mode .trust-banner span,
  .editor-mobile-mode .trust-banner p,
  .editor-mobile-mode [class*="trust"] span,
  .editor-mobile-mode [class*="marquee"],
  .editor-mobile-mode [class*="banner"]:not(header):not(nav) {
    flex-direction: row !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  /* Hero section - proper mobile layout */
  .editor-mobile-mode .hero {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    padding: 40px 20px !important;
    min-height: auto !important;
  }
  .editor-mobile-mode .hero > div {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    width: 100% !important;
    gap: 16px !important;
  }
 .editor-mobile-mode .hero h1,
.editor-mobile-mode .hero h2 {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  font-size: 2rem !important;
  line-height: 1.2 !important;
  text-align: center !important;
}
  .editor-mobile-mode .hero p,
  .editor-mobile-mode .hero span {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: 100% !important;
    font-size: 1rem !important;
    text-align: center !important;
  }
  .editor-mobile-mode .hero a,
  .editor-mobile-mode .hero button {
    display: inline-flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: auto !important;
    margin: 8px !important;
  }
`;

      const preventDefaultActions = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      doc.addEventListener('click', preventDefaultActions, true);
      doc.addEventListener('submit', preventDefaultActions, true);
      
      doc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', preventDefaultActions, true);
      });
      
      doc.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', preventDefaultActions, true);
      });

      const resizeStateRef = { current: null };
      

const createResizeHandles = (element) => {
  doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
  
  if (!element) return;
  
  // REMOVED: prepareElementForDrag call - only do this when dragging starts
  
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  
  handles.forEach(position => {
    const handle = doc.createElement('div');
    handle.className = `resize-handle resize-${position}`;
    handle.dataset.position = position;
    handle.dataset.isResizeHandle = 'true';
    
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = element.offsetWidth;
      const startHeight = element.offsetHeight;
      const startLeft = parseFloat(element.style.left) || 0;
      const startTop = parseFloat(element.style.top) || 0;
      
      const originalFontSizes = new Map();
      const textElements = element.querySelectorAll('*');
      textElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const fontSize = parseFloat(computedStyle.fontSize);
        if (fontSize) {
          originalFontSizes.set(el, fontSize);
        }
      });
      
      const elementFontSize = parseFloat(window.getComputedStyle(element).fontSize);
      if (elementFontSize) {
        originalFontSizes.set(element, elementFontSize);
      }
      
      resizeStateRef.current = {
        element,
        position,
        startX,
        startY,
        startWidth,
        startHeight,
        startLeft,
        startTop,
        originalFontSizes
      };
    });
    
    element.appendChild(handle);
  });
};
      
      const handleResizeMove = (e) => {
        if (!resizeStateRef.current) return;
        
        const { element, position, startX, startY, startWidth, startHeight, startLeft, startTop, originalFontSizes } = resizeStateRef.current;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        if (position.includes('e')) {
          newWidth = Math.max(20, startWidth + dx);
        }
        if (position.includes('w')) {
          newWidth = Math.max(20, startWidth - dx);
          newLeft = startLeft + dx;
        }
        if (position.includes('s')) {
          newHeight = Math.max(20, startHeight + dy);
        }
        if (position.includes('n')) {
          newHeight = Math.max(20, startHeight - dy);
          newTop = startTop + dy;
        }
        
        const widthScale = newWidth / startWidth;
        const heightScale = newHeight / startHeight;
        const fontScale = (widthScale + heightScale) / 2;
        
        element.style.width = newWidth + 'px';
        element.style.height = newHeight + 'px';
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        
        if (originalFontSizes) {
          originalFontSizes.forEach((originalSize, el) => {
            const newSize = originalSize * fontScale;
            el.style.fontSize = newSize + 'px';
          });
        }
        
        createResizeHandles(element);
      };
      
      const handleResizeEnd = () => {
        if (resizeStateRef.current) {
          resizeStateRef.current = null;
          saveChanges();
        }
      };

      const findDraggableElement = (el) => {
        const nonDraggable = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'];
        
        const isBackground = el.tagName === 'SECTION' ||
                     el.tagName === 'HEADER' ||
                     el.tagName === 'FOOTER' ||
                     el.tagName === 'MAIN';

if (nonDraggable.includes(el.tagName) || isBackground) {
  return null;
}
        
        if (el.tagName === 'SPAN' || el.tagName === 'STRONG' || el.tagName === 'EM' || 
            el.tagName === 'B' || el.tagName === 'I' || el.tagName === 'U') {
          const parent = el.closest('p, h1, h2, h3, h4, h5, h6, a, button, div, li');
          if (parent && 
    !parent.classList?.contains('background') && 
    !parent.classList?.contains('bg-') &&
              parent.tagName !== 'SECTION' &&
              parent.tagName !== 'HEADER' &&
              parent.tagName !== 'FOOTER') {
            return parent;
          }
        }
        
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(el.tagName)) {
          const parent = el.parentElement;
          
          if (parent && parent.tagName === 'DIV') {
            const siblings = Array.from(parent.children);
            
            const onlyTextElements = siblings.every(child => 
              ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN'].includes(child.tagName)
            );
            
            const rect = parent.getBoundingClientRect();
            const isSmallContainer = rect.width < el.ownerDocument.defaultView.innerWidth * 0.5;
            
            if (onlyTextElements && siblings.length > 1 && siblings.length <= 5 && isSmallContainer) {
              return parent;
            }
          }
        }
        
        if (el.tagName === 'DIV') {
          const children = Array.from(el.children);
          
          const onlyStructural = children.every(child => 
            ['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'ASIDE', 'NAV', 'UL', 'OL'].includes(child.tagName)
          );
          
          const hasDirectText = Array.from(el.childNodes).some(node => 
            node.nodeType === 3 && node.textContent.trim().length > 0
          );
          
          const hasImages = el.querySelectorAll('img').length > 0;
          const hasButtons = el.querySelectorAll('button, a.btn, a.button').length > 0;
          
          if (onlyStructural && children.length > 0 && !hasDirectText && !hasImages && !hasButtons) {
            return null;
          }
          
          const computedStyle = el.ownerDocument.defaultView.getComputedStyle(el);
          const isGrid = computedStyle.display?.includes('grid') || 
                        el.classList?.toString().includes('grid') ||
                        computedStyle.display === 'flex' ||
                        el.classList?.toString().includes('flex');
          
          if (isGrid && children.length >= 3) {
            return null;
          }
          
          const rect = el.getBoundingClientRect();
          const windowWidth = el.ownerDocument.defaultView.innerWidth;
          if (rect.width > windowWidth * 0.7 && children.length > 2) {
            return null;
          }
          
          const textContent = el.textContent?.trim() || '';
          if (textContent.length < 10 && children.length > 1) {
            return null;
          }
        }
        
        return el;
      };

     const handleMouseDown = (e) => {
  console.log('🟢 MOUSEDOWN - About to select element');
  console.log('🎯 Clicked element:', {
    tag: e.target.tagName,
    classes: e.target.className,
    isResizeHandle: e.target.dataset.isResizeHandle
  });
  
  if (e.target.dataset.isResizeHandle === 'true') {
    console.log('🔧 Clicked resize handle - skipping selection logic');
    return;
  }

  let target = e.target;
  
  // If clicking an already selected element, allow it to be dragged even if findDraggableElement would reject it
  const isAlreadySelected = target.classList.contains('editor-selected');
  
  if (!isAlreadySelected) {
    const draggableTarget = findDraggableElement(target);
    
    console.log('🔍 findDraggableElement result:', {
      original: target.tagName,
      draggable: draggableTarget?.tagName || 'NULL',
      rejected: !draggableTarget
    });
    
    if (!draggableTarget) {
      console.log('❌ Element rejected by findDraggableElement');
      return;
    }
    
    target = draggableTarget;
  } else {
    console.log('✅ Element already selected, allowing drag');
  }
  
  if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
        
        isMouseDownRef.current = true;
        dragStartedRef.current = false;

        if (target.classList.contains('editor-selected')) {
          const iframeRect = iframe.getBoundingClientRect();
          const currentlySelected = Array.from(doc.querySelectorAll('.editor-selected'));
          
          const elementsData = currentlySelected.map(elem => {
            prepareElementForDrag(elem, doc);
            const rect = elem.getBoundingClientRect();
            
            return {
              el: elem,
              startLeft: parseFloat(elem.style.left) || 0,
              startTop: parseFloat(elem.style.top) || 0,
              width: rect.width,
              height: rect.height
            };
          });
          
          dragStateRef.current = {
            elements: elementsData,
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
            iframeRect: iframeRect
          };
        } else {
          dragStateRef.current = {
            clickedElement: target,
            startX: e.clientX,
            startY: e.clientY,
            moved: false
          };
        }
      };

      const handleMouseMove = (e) => {
        if (resizeStateRef.current) {
          handleResizeMove(e);
          return;
        }
        
        const shouldMove = isMouseDownRef.current && dragStateRef.current;
        
        if (!shouldMove) return;

        const dx = e.clientX - dragStateRef.current.startX;
        const dy = e.clientY - dragStateRef.current.startY;
        
       if (!dragStartedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
  if (!dragStateRef.current.elements && dragStateRef.current.clickedElement) {
    const clickedEl = dragStateRef.current.clickedElement;
    
    console.log('🎬 Starting drag for:', {
      tag: clickedEl.tagName,
      currentPosition: clickedEl.style.position,
      computedPosition: window.getComputedStyle(clickedEl).position,
      currentLeft: clickedEl.style.left,
      currentTop: clickedEl.style.top,
      parent: clickedEl.parentElement?.tagName,
      offsetParent: clickedEl.offsetParent?.tagName
    });
    
    doc.querySelectorAll('.editor-selected').forEach(el => {
      el.classList.remove('editor-selected');
    });
    clickedEl.classList.add('editor-selected');
    selectedElementsRef.current = [clickedEl];
    
    const iframeRect = iframe.getBoundingClientRect();
    
    // Only prepare if not already absolute positioned
    const computedPosition = window.getComputedStyle(clickedEl).position;
    if (computedPosition === 'static' || computedPosition === 'relative' || !clickedEl.style.position) {
      console.log('🔧 Preparing element for drag');
      prepareElementForDrag(clickedEl, doc);
    } else {
      console.log('⏭️ Element already positioned, skipping prepare');
    }
    
    const rect = clickedEl.getBoundingClientRect();
    
            dragStateRef.current = {
              elements: [{
                el: clickedEl,
                startLeft: parseFloat(clickedEl.style.left) || 0,
                startTop: parseFloat(clickedEl.style.top) || 0,
                width: rect.width,
                height: rect.height
              }],
              startX: dragStateRef.current.startX,
              startY: dragStateRef.current.startY,
              moved: true,
              iframeRect: iframeRect,
              wasSnappedX: false,  // ADD THIS
  wasSnappedY: false 
            };
          }
          
          dragStartedRef.current = true;
          dragStateRef.current.moved = true;
          
          if (dragStateRef.current.elements) {
            dragStateRef.current.elements.forEach(data => {
              data.el.classList.add('editor-dragging');
            });
          }
        }
        
        if (dragStartedRef.current && dragStateRef.current.elements) {
          const firstElement = dragStateRef.current.elements[0];
          
         let newLeft = firstElement.startLeft + dx;
let newTop = firstElement.startTop + dy;

const iframeRect = dragStateRef.current.iframeRect;
const scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft;
const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;

// Get the ACTUAL visual dimensions
const elemRect = firstElement.el.getBoundingClientRect();
const actualWidth = elemRect.width;
const actualHeight = elemRect.height;

// Calculate center from the INTENDED new position with ACTUAL dimensions
const elemCenterX = newLeft + actualWidth / 2;
const elemCenterY = newTop + actualHeight / 2;
          
const snapThreshold = 10;
const detectedGuides = { vertical: [], horizontal: [] };

// Use iframe width for true viewport center
const viewportCenterX = iframeRect.width / 2;
const viewportCenterY = iframeRect.height / 2;

console.log('📐 Snap calculation:', {
  elemCenterX,
  viewportCenterX,
  iframeWidth: iframeRect.width,
  scrollLeft,
  elementLeft: newLeft,
  elementWidth: firstElement.width
});

const distanceFromCenter = Math.abs(elemCenterX - viewportCenterX);

if (distanceFromCenter < snapThreshold) {
  // Only snap if we're moving TOWARD center, not away from it
  const wasCentered = dragStateRef.current.wasSnappedX;
  const movingTowardCenter = !wasCentered || distanceFromCenter < (snapThreshold - 5);
  
  if (movingTowardCenter) {
    newLeft = viewportCenterX - actualWidth / 2;
    dragStateRef.current.wasSnappedX = true;
  console.log('✨ SNAPPED TO CENTER:', {
  calculatedLeft: newLeft,
  elementWidth: firstElement.width,
  elementTag: firstElement.el.tagName,
  elementClasses: firstElement.el.className,
  computedWidth: window.getComputedStyle(firstElement.el).width,
  offsetWidth: firstElement.el.offsetWidth,
  clientWidth: firstElement.el.clientWidth,
  scrollWidth: firstElement.el.scrollWidth,  // ADD THIS
  boxSizing: window.getComputedStyle(firstElement.el).boxSizing,  // ADD THIS
  border: window.getComputedStyle(firstElement.el).border,  // ADD THIS
  paddingLeft: window.getComputedStyle(firstElement.el).paddingLeft,
  paddingRight: window.getComputedStyle(firstElement.el).paddingRight,
  marginLeft: window.getComputedStyle(firstElement.el).marginLeft,
  marginRight: window.getComputedStyle(firstElement.el).marginRight
  });
  detectedGuides.vertical.push({ 
      x: viewportCenterX,
      type: 'center', 
      label: 'Page Center' 
    });
  }
} else {
  dragStateRef.current.wasSnappedX = false;
}

const distanceFromCenterY = Math.abs(elemCenterY - viewportCenterY);

if (distanceFromCenterY < snapThreshold) {
  const wasCentered = dragStateRef.current.wasSnappedY;
  const movingTowardCenter = !wasCentered || distanceFromCenterY < (snapThreshold - 5);
  
  if (movingTowardCenter) {
    newTop = viewportCenterY - actualHeight / 2;
    dragStateRef.current.wasSnappedY = true;
    
    detectedGuides.horizontal.push({ 
      y: viewportCenterY,
      type: 'center', 
      label: 'Page Center' 
    });
  }
} else {
  dragStateRef.current.wasSnappedY = false;
}
          
          const draggingElement = firstElement.el;
          let parentSection = draggingElement.closest('section, header, footer, main, article, aside, div[class*="container"], div[class*="section"]');
          
          if (!parentSection) {
            parentSection = doc.body;
          }
          
          const siblingElements = Array.from(parentSection.querySelectorAll('*')).filter(el => 
            !dragStateRef.current.elements.some(data => data.el === el) &&
            !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'ASIDE'].includes(el.tagName) &&
            el.offsetParent !== null &&
            el.getBoundingClientRect().width > 20 &&
            el.getBoundingClientRect().height > 20 &&
            parentSection.contains(el)
          );
          
        siblingElements.forEach(other => {
  const otherRect = other.getBoundingClientRect();
  
  // Get the element's actual position in document coordinates
  const otherComputedStyle = window.getComputedStyle(other);
  const otherLeft = parseFloat(other.style.left) || otherRect.left;
  const otherTop = parseFloat(other.style.top) || otherRect.top;
  const otherCenterX = otherLeft + otherRect.width / 2;
  const otherCenterY = otherTop + otherRect.height / 2;
  
  console.log('🔍 Sibling snap check:', {
    tag: other.tagName,
    className: other.className,
    otherLeft,
    otherRectLeft: otherRect.left,
    otherWidth: otherRect.width,
    otherCenterX,
    elemCenterX,
    distance: Math.abs(elemCenterX - otherCenterX),
    hasStyleLeft: !!other.style.left,
    position: otherComputedStyle.position
  });
  
  if (Math.abs(elemCenterX - otherCenterX) < snapThreshold) {
    newLeft = otherCenterX - firstElement.width / 2;
    if (!detectedGuides.vertical.some(g => Math.abs(g.x - otherCenterX) < 1)) {
      detectedGuides.vertical.push({ 
        x: otherCenterX,
        type: 'center', 
        label: 'Element Center' 
      });
    }
  }
  
  if (Math.abs(elemCenterY - otherCenterY) < snapThreshold) {
    newTop = otherCenterY - firstElement.height / 2;
    if (!detectedGuides.horizontal.some(g => Math.abs(g.y - otherCenterY) < 1)) {
      detectedGuides.horizontal.push({ 
        y: otherCenterY,
        type: 'center', 
        label: 'Element Center' 
      });
    }
  }
});
          
        //  setGuides({ 
        //    vertical: detectedGuides.vertical.slice(0, 1),
         //   horizontal: detectedGuides.horizontal.slice(0, 1) 
       //   });
          
          const deltaX = newLeft - firstElement.startLeft;
          const deltaY = newTop - firstElement.startTop;
          
          dragStateRef.current.elements.forEach((data) => {
            const finalLeft = data.startLeft + deltaX;
            const finalTop = data.startTop + deltaY;
            data.el.style.left = finalLeft + 'px';
            data.el.style.top = finalTop + 'px';
          });
        }
      };

     const handleMouseUp = (e) => {
  if (resizeStateRef.current) {
    handleResizeEnd();
    return;
  }
  
  if (!isMouseDownRef.current) {
    return;
  }
  
  isMouseDownRef.current = false;
  
  if (dragStartedRef.current && dragStateRef.current?.elements) {
    dragStateRef.current.elements.forEach(data => {
      data.el.classList.remove('editor-dragging');
    });
    
    setGuides({ vertical: [], horizontal: [] });
    
    if (dragStateRef.current.moved) {
      console.log('💾 Saving after drag');
      saveChanges();
    } else {
      console.log('⏭️ No movement detected, skipping save');
    }
    
    dragStateRef.current = null;
    dragStartedRef.current = false;
    return;
  }
        
        if (dragStateRef.current && !dragStateRef.current.moved) {
          console.log('✅ Selection only - NOT saving');
          const target = dragStateRef.current.clickedElement || e.target;
          
          if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
            selectedElementsRef.current = [];
            showPropertiesModalRef.current = false;  // FIXED
            setModalVisible(false);  // FIXED
            dragStateRef.current = null;
            dragStartedRef.current = false;
            return;
          }
          
          if (e.shiftKey) {
            if (target.classList.contains('editor-selected')) {
              target.classList.remove('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              selectedElementsRef.current = newSelected;
              doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
              if (newSelected.length === 0) {
                showPropertiesModalRef.current = false;  // FIXED
                setModalVisible(false);  // FIXED
              }
            } else {
              target.classList.add('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              selectedElementsRef.current = newSelected;
              doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
            }
         } else {
  const previouslySelected = doc.querySelectorAll('.editor-selected');
  
  previouslySelected.forEach(el => {
    el.classList.remove('editor-selected');
  });
  
  target.classList.add('editor-selected');
  selectedElementsRef.current = [target];
  createResizeHandles(target);
  
  console.log('🎯 Element selected:', {
    tagName: target.tagName,
    className: target.className,
    isInDocument: doc.body.contains(target),
    hasResizeHandles: target.querySelectorAll('.resize-handle').length
  });
}
        }
        
        dragStateRef.current = null;
        dragStartedRef.current = false;
      };

      const handleMouseOver = (e) => {
        if (isMouseDownRef.current || dragStartedRef.current) return;
        
        let target = e.target;
        
        const nonDraggable = ['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 
                              'SECTION', 'HEADER', 'FOOTER', 'MAIN'];
        
        if (nonDraggable.includes(target.tagName)) return;
        
        const isBackground = target.classList?.contains('background') ||
                   target.classList?.contains('bg-');
if (isBackground) return;
        
        if (['SPAN', 'STRONG', 'EM', 'B', 'I', 'U'].includes(target.tagName)) {
          const parent = target.closest('p, h1, h2, h3, h4, h5, h6, a, button, div, li');
          if (parent) target = parent;
        }
        
        target.classList.add('editor-hover');
      };

      const handleMouseOut = (e) => {
        e.target.classList.remove('editor-hover');
      };

     const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target;
        
        if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          return;
        }
        
        if (!target.classList.contains('editor-selected')) {
          doc.querySelectorAll('.editor-selected').forEach(el => {
            el.classList.remove('editor-selected');
          });
          target.classList.add('editor-selected');
          selectedElementsRef.current = [target];
          createResizeHandles(target);
        }

        // Load props only when opening modal
        if (selectedElementsRef.current[0]) {
          loadProps(selectedElementsRef.current[0]);
        }

        showPropertiesModalRef.current = true;
        setModalVisible(true);
      };

      // ADD ALL THE EVENT LISTENERS HERE (inside initEditor)
      doc.addEventListener('mousedown', handleMouseDown);
      doc.addEventListener('mousemove', handleMouseMove);
      doc.addEventListener('mouseup', handleMouseUp);
      doc.addEventListener('mouseover', handleMouseOver);
      doc.addEventListener('mouseout', handleMouseOut);
      doc.addEventListener('dblclick', handleDoubleClick);
      
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);

      eventHandlersRef.current = {
        doc,
        currentPage,
        isMobileView,
        handlers: {
          mousedown: handleMouseDown,
          mousemove: handleMouseMove,
          mouseup: handleMouseUp,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          dblclick: handleDoubleClick
        }
    }; 

    setTimeout(addSectionResizers, 100);
};
    
    if (iframe.contentDocument?.readyState === 'complete') {
      initEditor();
    } else {
      iframe.onload = () => {
        initEditor();
      };
      
      setTimeout(() => {
        if (!eventHandlersRef.current) {
          initEditor();
        }
      }, 500);
    }

    return () => {
      if (eventHandlersRef.current) {
        const { doc, handlers } = eventHandlersRef.current;
        try {
          doc.removeEventListener('mousedown', handlers.mousedown);
          doc.removeEventListener('mousemove', handlers.mousemove);
          doc.removeEventListener('mouseup', handlers.mouseup);
          doc.removeEventListener('mouseover', handlers.mouseover);
          doc.removeEventListener('mouseout', handlers.mouseout);
          doc.removeEventListener('dblclick', handlers.dblclick);
          
        } catch (err) {
          // Ignore
        }
      }
    };
 }, [currentPage, reloadKey, isMobileView]);

  const prepareElementForDrag = (elem, doc) => {
  const computed = window.getComputedStyle(elem);
  
  if (computed.position === 'static' || computed.position === 'relative' || !elem.style.position) {
    const rect = elem.getBoundingClientRect();
    const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
    
    // Account for scroll
    const scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft;
    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
    
    const width = rect.width;
    const height = rect.height;
    
    // Calculate position relative to offsetParent, accounting for scroll
    const calculatedLeft = rect.left - parentRect.left + (scrollLeft - (doc.documentElement.scrollLeft || 0));
    const calculatedTop = rect.top - parentRect.top + (scrollTop - (doc.documentElement.scrollTop || 0));
    
    if (!elem.dataset.hasPlaceholder) {
      const placeholder = doc.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.width = width + 'px';
      placeholder.style.height = height + 'px';
      placeholder.style.margin = computed.margin;
      placeholder.style.padding = '0';
      placeholder.style.border = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.style.pointerEvents = 'none';
      placeholder.style.display = computed.display;
      
      elem.parentNode.insertBefore(placeholder, elem);
      elem.dataset.hasPlaceholder = 'true';
      elem.dataset.placeholderId = 'placeholder-' + Date.now() + '-' + Math.random();
      placeholder.dataset.placeholderId = elem.dataset.placeholderId;
    }
    
    elem.style.position = 'absolute';
    elem.style.left = calculatedLeft + 'px';
    elem.style.top = calculatedTop + 'px';
    elem.style.width = width + 'px';
    elem.style.height = height + 'px';
    elem.style.margin = '0';
    elem.style.zIndex = '1000';
    
    console.log('🔧 Prepared element for drag:', {
      tag: elem.tagName,
      left: calculatedLeft,
      top: calculatedTop,
      width: width,
      height: height
    });
  }
};

  const saveChanges = () => {
    console.log('🔴 saveChanges() CALLED');
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    
    updateTimeoutRef.current = setTimeout(() => {
      console.log('⏰ saveChanges timeout fired');
      if (iframeRef.current?.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        
        const html = doc.documentElement.outerHTML;
        
        const cleanedHTML = html
          .replace(/<div[^>]*class="[^"]*drag-placeholder[^"]*"[^>]*><\/div>/g, '')
          .replace(/<div[^>]*class="[^"]*resize-handle[^"]*"[^>]*><\/div>/g, '')
          .replace(/\s*class="([^"]*)"/g, (match, classes) => {
            const cleaned = classes
              .replace(/\s*editor-selected\s*/g, ' ')
              .replace(/\s*editor-hover\s*/g, ' ')
              .replace(/\s*editor-dragging\s*/g, ' ')
              .replace(/\s*drag-placeholder\s*/g, ' ')
              .replace(/\s*resize-handle\s*/g, ' ')
              .replace(/\s*resize-[nesw]{1,2}\s*/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return cleaned ? ` class="${cleaned}"` : '';
          })
          .replace(/\s+class=""\s*/g, ' ')
          .replace(/\s+data-has-placeholder="[^"]*"/g, '')
          .replace(/\s+data-placeholder-id="[^"]*"/g, '')
          .replace(/\s+data-is-resize-handle="[^"]*"/g, '');
        
        if (cleanedHTML !== lastSavedHtmlRef.current) {
          console.log('💾 Saving changes - HTML actually changed');
          lastSavedHtmlRef.current = cleanedHTML;
          lastHtmlContentRef.current = cleanedHTML;
          isSavingRef.current = true;
          onUpdate(cleanedHTML);
          
          setTimeout(() => {
            isSavingRef.current = false;
            console.log('✅ Save flag reset');
          }, 100);
        } else {
          console.log('⏭️ Skipping save - HTML unchanged');
        }
      }
    }, 300);
  };

  const loadProps = (el) => {
    const s = window.getComputedStyle(el);
    setElementProps({
      width: el.style.width || s.width,
      height: el.style.height || s.height,
      fontSize: s.fontSize,
      color: rgbToHex(s.color),
      backgroundColor: rgbToHex(s.backgroundColor),
      fontWeight: s.fontWeight,
      textAlign: s.textAlign,
      padding: s.padding,
      margin: s.margin
    });
  };

  const updateProp = (prop, val) => {
    selectedElementsRef.current.forEach(el => el.style[prop] = val);
    setElementProps(p => ({ ...p, [prop]: val }));
    saveChanges();
  };

  const deleteEl = () => {
    if (!confirm('Delete selected element(s)?')) return;
    selectedElementsRef.current.forEach(el => el.remove());
    selectedElementsRef.current = [];
    showPropertiesModalRef.current = false;  // FIXED
    setModalVisible(false);  // FIXED
    saveChanges();
  };

  const duplicate = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    selectedElementsRef.current.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('editor-selected', 'editor-hover', 'editor-dragging');
      
      clone.querySelectorAll('.resize-handle').forEach(h => h.remove());
      delete clone.dataset.isResizeHandle;
      
      if (clone.style.position === 'absolute') {
        clone.style.left = (parseFloat(clone.style.left || 0) + 20) + 'px';
        clone.style.top = (parseFloat(clone.style.top || 0) + 20) + 'px';
      }
      
      el.parentNode.insertBefore(clone, el.nextSibling);
    });
    saveChanges();
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff';
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0,3).map(x => ('0' + parseInt(x).toString(16)).slice(-2)).join('');
  };

  return (
    <div className="w-full h-full flex relative">
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">

        <div className="relative group">
          <button className="p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <div className="absolute left-0 top-12 w-80 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
            <div className="text-sm font-medium space-y-1">
              <p>💡 <strong>Click</strong> to select</p>
              <p>🖱️ <strong>Drag</strong> to move (auto-snap)</p>
              <p>✏️ <strong>Double-click</strong> to edit text</p>
              <p>⌨️ <strong>Shift+Click</strong> for multi-select</p>
            </div>
            <div className="absolute -top-2 left-4 w-4 h-4 bg-purple-600 transform rotate-45"></div>
          </div>
        </div>
      </div>

     <div className="flex-1 relative overflow-hidden">
  <iframe
  ref={iframeRef} 
  srcDoc={initialHtml}
  key={`${currentPage}-${reloadKey}`}
  className="w-full h-full border-none"
  title="Visual Editor"
  style={{ 
    width: '100%',
    height: '100%',
    display: 'block',
    overflow: 'hidden'
  }}
/>
        
{guides.vertical.map((guide, i) => {
  const iframeRect = iframeRef.current?.getBoundingClientRect();
  console.log('📍 Guide rendering:', {
    guideX: guide.x,
    iframeLeft: iframeRect?.left,
    iframeWidth: iframeRect?.width,
    windowWidth: window.innerWidth,
    calculatedCenter: (iframeRect?.width || 0) / 2
  });
  console.log('📍 Guide rendering:', {
    guideX: guide.x,
    iframeLeft: iframeRef.current?.getBoundingClientRect().left,
    windowWidth: window.innerWidth
  });
  
  return (
    <div 
      key={`v-${i}`}
      className="absolute pointer-events-none z-50"
      style={{ 
        left: `${guide.x}px`,
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: '#ef4444',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
      }}
    >
      <div className="absolute top-4 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
        {guide.label}
      </div>
    </div>
  );
})}

{guides.horizontal.map((guide, i) => (
  <div 
    key={`h-${i}`}
    className="absolute pointer-events-none z-50"
    style={{ 
      top: `${guide.y}px`,
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: '#ef4444',
      boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
    }}
  >
    <div className="absolute left-4 top-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
      {guide.label}
    </div>
  </div>
))}
      </div>

      {modalVisible && selectedElementsRef.current.length > 0 && (
        <div 
          className="fixed bg-white rounded-xl shadow-2xl border-2 border-purple-500 w-80 z-50"
          style={{
            top: '80px',
            left: '20px'
          }}
        >
          <div className="p-3 border-b bg-gradient-to-r from-purple-600 to-blue-600 flex justify-between items-center rounded-t-xl">
            <div className="text-white">
              <h3 className="font-semibold text-sm">
                {selectedElementsRef.current.length === 1 ? `Edit ${selectedElementsRef.current[0].tagName}` : `${selectedElementsRef.current.length} Elements`}
              </h3>
            </div>
            <button 
              onClick={() => {
                showPropertiesModalRef.current = false;
                setModalVisible(false);
              }}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-gray-700">Font Size</label>
              <input 
                type="text" 
                value={elementProps.fontSize} 
                onChange={(e) => updateProp('fontSize', e.target.value)} 
                placeholder="16px"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-gray-700">Text Style</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'normal' : 'bold')} 
                  className={`flex-1 p-2 border-2 rounded-lg transition ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100 border-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  onClick={() => updateProp('fontStyle', elementProps.fontStyle === 'italic' ? 'normal' : 'italic')} 
                  className={`flex-1 p-2 border-2 rounded-lg transition ${elementProps.fontStyle === 'italic' ? 'bg-purple-100 border-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-gray-700">Alignment</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateProp('textAlign', 'left')} 
                  className={`flex-1 p-2 border-2 rounded-lg transition ${elementProps.textAlign === 'left' ? 'bg-purple-100 border-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  onClick={() => updateProp('textAlign', 'center')} 
                  className={`flex-1 p-2 border-2 rounded-lg transition ${elementProps.textAlign === 'center' ? 'bg-purple-100 border-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  onClick={() => updateProp('textAlign', 'right')} 
                  className={`flex-1 p-2 border-2 rounded-lg transition ${elementProps.textAlign === 'right' ? 'bg-purple-100 border-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-gray-700">Text Color</label>
                <input 
                  type="color" 
                  value={elementProps.color} 
                  onChange={(e) => updateProp('color', e.target.value)} 
                  className="w-full h-10 cursor-pointer rounded-lg border-2 border-gray-200" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-gray-700">Background</label>
                <input 
                  type="color" 
                  value={elementProps.backgroundColor} 
                  onChange={(e) => updateProp('backgroundColor', e.target.value)} 
                  className="w-full h-10 cursor-pointer rounded-lg border-2 border-gray-200" 
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button 
                onClick={duplicate} 
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button 
                onClick={deleteEl} 
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
 }, (prevProps, nextProps) => {
  const htmlChanged = prevProps.htmlContent !== nextProps.htmlContent;
  const pageChanged = prevProps.currentPage !== nextProps.currentPage;
  const mobileChanged = prevProps.isMobileView !== nextProps.isMobileView;
  
  console.log('🔍 Memo comparison:', { htmlChanged, pageChanged, mobileChanged });
  
  return !htmlChanged && !pageChanged && !mobileChanged;
});

export default VisualEditor;
