import { useState, useEffect, useRef } from 'react';
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

export default function VisualEditor({ htmlContent, onUpdate, currentPage, onUndo, onRedo, canUndo, canRedo }) {
  console.log('🔵 VisualEditor rendered');
  const [selectedElements, setSelectedElements] = useState([]);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const iframeRef = useRef(null);
  const dragStateRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const dragStartedRef = useRef(false);
  const lastSavedHtmlRef = useRef('');
  const isSavingRef = useRef(false);
  
  const [initialHtml, setInitialHtml] = useState(htmlContent || '<html><body><h1>Loading...</h1></body></html>');

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

  // [Rest of the useEffect hooks remain the same until the event handlers...]
  // ... [Keep all your existing useEffect code] ...

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
      
      setSelectedElements([]);
      setGuides({ vertical: [], horizontal: [] });
      setShowPropertiesModal(false);
      dragStateRef.current = null;
    } 
    else if (isExternalChange && !isFirstLoad && iframeRef.current?.contentDocument) {
      const currentDoc = iframeRef.current.contentDocument;
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlContent, 'text/html');
      
      currentDoc.body.innerHTML = newDoc.body.innerHTML;
      
      let style = currentDoc.getElementById('editor-styles');
      if (!style) {
        style = currentDoc.createElement('style');
        style.id = 'editor-styles';
        currentDoc.head.appendChild(style);
      }
      
      style.textContent = `
        * { box-sizing: border-box; }
        body { position: relative !important; min-height: 100vh; }
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
      `;
      
      lastHtmlContentRef.current = htmlContent;
      isSavingRef.current = false;
      
      setSelectedElements([]);
      setShowPropertiesModal(false);
    } 
    else if (!htmlContent || htmlContent.length === 0) {
      // Empty content
    } 
    else {
      lastHtmlContentRef.current = htmlContent;
      isSavingRef.current = false;
    }
  }, [currentPage, htmlContent]);

  useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe?.contentDocument) return;
  const doc = iframe.contentDocument;
  
  // Monitor for ANY element removal
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
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

      // Remove old event listeners
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

      // Inject styles
      let style = doc.getElementById('editor-styles');
      if (!style) {
        style = doc.createElement('style');
        style.id = 'editor-styles';
        doc.head.appendChild(style);
      }
      
      style.textContent = `
        * { box-sizing: border-box; }
        body { position: relative !important; min-height: 100vh; }
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
      `;

      // Disable all links, buttons, and form submissions
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

      // Resize handles management
      const resizeStateRef = { current: null };
      
      const createResizeHandles = (element) => {
        doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
        
        if (!element) return;
        
        if (!element.style.position || element.style.position === 'static') {
          const rect = element.getBoundingClientRect();
          element.style.position = 'absolute';
          element.style.left = rect.left + 'px';
          element.style.top = rect.top + 'px';
        }
        
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        
        handles.forEach(position => {
          const handle = doc.createElement('div');
          handle.className = `resize-handle resize-${position}`;
          handle.dataset.position = position;
          handle.dataset.isResizeHandle = 'true'; // CRITICAL FIX: Mark as resize handle
          
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
            
            console.log('🔧 Starting resize:', position);
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
          console.log('✅ Resize complete');
          resizeStateRef.current = null;
          saveChanges();
        }
      };

      const findDraggableElement = (el) => {
        const nonDraggable = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'];
        
        const isBackground = el.classList?.contains('hero') || 
                             el.classList?.contains('background') ||
                             el.classList?.contains('bg-') ||
                             el.tagName === 'SECTION' ||
                             el.tagName === 'HEADER' ||
                             el.tagName === 'FOOTER' ||
                             el.tagName === 'MAIN';
        
        if (nonDraggable.includes(el.tagName) || isBackground) {
          return null;
        }
        
        if (el.tagName === 'SPAN' || el.tagName === 'STRONG' || el.tagName === 'EM' || 
            el.tagName === 'B' || el.tagName === 'I' || el.tagName === 'U') {
          const parent = el.closest('p, h1, h2, h3, h4, h5, h6, a, button, div, li');
          if (parent && !parent.classList?.contains('hero') && 
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

      // Setup event handlers
      const handleMouseDown = (e) => {
        console.log('🟢 MOUSEDOWN - About to select element');
        if (e.target.dataset.isResizeHandle === 'true') {
          console.log('🔧 Clicked resize handle - skipping selection logic');
          return; // Let the resize handle's own mousedown handler take over
        }

        let target = e.target;
        const draggableTarget = findDraggableElement(target);
        
        if (!draggableTarget) {
          return;
        }
        
        target = draggableTarget;
        
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
            
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            clickedEl.classList.add('editor-selected');
            setSelectedElements([clickedEl]);
            
            const iframeRect = iframe.getBoundingClientRect();
            prepareElementForDrag(clickedEl, doc);
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
              iframeRect: iframeRect
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
          
          const elemCenterX = newLeft + firstElement.width / 2;
          const elemCenterY = newTop + firstElement.height / 2;
          
          const snapThreshold = 10;
          const detectedGuides = { vertical: [], horizontal: [] };
          
          const scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft;
          const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
          
          const bodyRect = doc.body.getBoundingClientRect();
          const iframeRect = dragStateRef.current.iframeRect;
          
          const bodyCenterX = bodyRect.width / 2;
          const bodyCenterY = bodyRect.height / 2;
          
          if (Math.abs(elemCenterX - bodyCenterX) < snapThreshold) {
            newLeft = bodyCenterX - firstElement.width / 2;
            detectedGuides.vertical.push({ 
              x: bodyCenterX + iframeRect.left,
              type: 'center', 
              label: 'Page Center' 
            });
          }
          
          if (Math.abs(elemCenterY - bodyCenterY) < snapThreshold) {
            newTop = bodyCenterY - firstElement.height / 2;
            detectedGuides.horizontal.push({ 
              y: bodyCenterY + iframeRect.top,
              type: 'center', 
              label: 'Page Center' 
            });
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
            const otherLeft = otherRect.left - iframeRect.left + scrollLeft;
            const otherTop = otherRect.top - iframeRect.top + scrollTop;
            const otherCenterX = otherLeft + otherRect.width / 2;
            const otherCenterY = otherTop + otherRect.height / 2;
            
            if (Math.abs(elemCenterX - otherCenterX) < snapThreshold) {
              newLeft = otherCenterX - firstElement.width / 2;
              if (!detectedGuides.vertical.some(g => Math.abs(g.x - (otherCenterX + iframeRect.left)) < 1)) {
                detectedGuides.vertical.push({ 
                  x: otherCenterX + iframeRect.left,
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
            
            if (Math.abs(elemCenterY - otherCenterY) < snapThreshold) {
              newTop = otherCenterY - firstElement.height / 2;
              if (!detectedGuides.horizontal.some(g => Math.abs(g.y - (otherCenterY + iframeRect.top)) < 1)) {
                detectedGuides.horizontal.push({ 
                  y: otherCenterY + iframeRect.top,
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
          });
          
          setGuides({ 
            vertical: detectedGuides.vertical.slice(0, 1),
            horizontal: detectedGuides.horizontal.slice(0, 1) 
          });
          
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
  
  // ⬇️ ONLY save if we actually dragged ⬇️
  if (dragStartedRef.current && dragStateRef.current?.elements) {
    dragStateRef.current.elements.forEach(data => {
      data.el.classList.remove('editor-dragging');
    });
    
    setGuides({ vertical: [], horizontal: [] });
    
    // CRITICAL FIX: Only save if we actually moved something
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
  
  // If we didn't drag, handle selection (NO SAVE!)
  if (dragStateRef.current && !dragStateRef.current.moved) {
    console.log('✅ Selection only - NOT saving'); // ← Add this log
    const target = dragStateRef.current.clickedElement || e.target;
    
    if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
      doc.querySelectorAll('.editor-selected').forEach(el => {
        el.classList.remove('editor-selected');
      });
      doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
      setSelectedElements([]);
      dragStateRef.current = null;
      dragStartedRef.current = false;
      return;
    }
    
    if (e.shiftKey) {
      if (target.classList.contains('editor-selected')) {
        target.classList.remove('editor-selected');
        const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
        setSelectedElements(newSelected);
        doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
      } else {
        target.classList.add('editor-selected');
        const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
        setSelectedElements(newSelected);
        doc.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
    } else {
      const previouslySelected = doc.querySelectorAll('.editor-selected');
      
      previouslySelected.forEach(el => {
        el.classList.remove('editor-selected');
      });
      
      target.classList.add('editor-selected');
      setSelectedElements([target]);
      loadProps(target);
      createResizeHandles(target);
    }
  }
  
  dragStateRef.current = null;
  dragStartedRef.current = false;
  // NO SAVE HERE! ← This is the key fix
};
      const handleMouseOver = (e) => {
        if (isMouseDownRef.current || dragStartedRef.current) return;
        
        let target = e.target;
        
        const nonDraggable = ['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 
                              'SECTION', 'HEADER', 'FOOTER', 'MAIN'];
        
        if (nonDraggable.includes(target.tagName)) return;
        
        const isBackground = target.classList?.contains('hero') || 
                           target.classList?.contains('background') ||
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
          setSelectedElements([target]);
          loadProps(target);
          createResizeHandles(target);
        }
        
        setShowPropertiesModal(true);
      };

      // Attach event listeners
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
        handlers: {
          mousedown: handleMouseDown,
          mousemove: handleMouseMove,
          mouseup: handleMouseUp,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          dblclick: handleDoubleClick
        }
      };
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
          
          window.removeEventListener('mousemove', handleResizeMove);
          window.removeEventListener('mouseup', handleResizeEnd);
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [currentPage, reloadKey]);

  const prepareElementForDrag = (elem, doc) => {
    const computed = window.getComputedStyle(elem);
    
    if (computed.position === 'static' || computed.position === 'relative' || !elem.style.position) {
      const rect = elem.getBoundingClientRect();
      const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
      
      const width = rect.width;
      const height = rect.height;
      const calculatedLeft = rect.left - parentRect.left;
      const calculatedTop = rect.top - parentRect.top;
      
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
    }
  };

  const saveChanges = () => {
    console.log('🔴 saveChanges() CALLED - Stack:', new Error().stack);
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
          .replace(/\s+data-is-resize-handle="[^"]*"/g, ''); // CRITICAL FIX: Remove resize handle markers
        
        if (cleanedHTML !== lastSavedHtmlRef.current) {
        console.log('💾 Saving changes - HTML actually changed');
        lastSavedHtmlRef.current = cleanedHTML;
        isSavingRef.current = true;
        onUpdate(cleanedHTML);
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
    selectedElements.forEach(el => el.style[prop] = val);
    setElementProps(p => ({ ...p, [prop]: val }));
    saveChanges();
  };

  const deleteEl = () => {
    // DIAGNOSTIC LOGGING - Find what's calling delete
    console.log('🚨 DELETE FUNCTION CALLED!');
    console.log('  Stack trace:', new Error().stack);
    console.log('  Selected elements:', selectedElements.length);
    console.log('  showPropertiesModal:', showPropertiesModal);
    
    // TEMPORARY: Block deletion for debugging
    alert('Delete was called! Check console for details.');
    return; // ← Remove this line once you identify the issue
    
    if (!confirm('Delete selected element(s)?')) return;
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    setShowPropertiesModal(false);
    saveChanges();
  };

  const duplicate = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    selectedElements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('editor-selected', 'editor-hover', 'editor-dragging');
      
      // CRITICAL FIX: Remove resize handles from clone
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
      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg shadow-lg hover:shadow-xl transition ${
            canUndo ? 'bg-white text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg shadow-lg hover:shadow-xl transition ${
            canRedo ? 'bg-white text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

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

      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef} 
          srcDoc={initialHtml}
          key={`${currentPage}-${reloadKey}`}
          className="w-full h-full border-none"
          title="Visual Editor"
        />
        
        {/* Snap Guide Lines */}
        {guides.vertical.map((guide, i) => (
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
        ))}
        
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

      {/* Properties Popup */}
      {showPropertiesModal && selectedElements.length > 0 && (
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
                {selectedElements.length === 1 ? `Edit ${selectedElements[0].tagName}` : `${selectedElements.length} Elements`}
              </h3>
            </div>
            <button 
              onClick={() => setShowPropertiesModal(false)} 
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
}
