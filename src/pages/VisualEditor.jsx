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
  Italic
} from 'lucide-react';

export default function VisualEditor({ htmlContent, onUpdate, currentPage }) {
  const [selectedElements, setSelectedElements] = useState([]);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const iframeRef = useRef(null);
  const dragStateRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(null);
  const isMouseDownRef = useRef(false); // Use ref instead of local variable
  const dragStartedRef = useRef(false); // Use ref instead of local variable
  const lastSavedHtmlRef = useRef(''); // Track last saved HTML to prevent reload loops
  const isEditingRef = useRef(false); // Track if currently editing text
  
  // CRITICAL: Initialize with htmlContent, but handle undefined case
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

  // Track the last page to detect actual page changes
  const lastPageRef = useRef(currentPage);
  const hasLoadedRef = useRef(false);

  // Update initial HTML only when page changes, not on every htmlContent update
  useEffect(() => {
    const pageChanged = lastPageRef.current !== currentPage;
    const isFirstLoad = !hasLoadedRef.current;
    
    console.log('📄 Page/content changed - currentPage:', currentPage);
    console.log('   htmlContent length:', htmlContent?.length);
    console.log('   pageChanged:', pageChanged, '| isFirstLoad:', isFirstLoad);
    console.log('   htmlContent preview:', htmlContent?.substring(0, 200));
    
    // Only update if page changed OR first load with valid content
    if ((pageChanged || isFirstLoad) && htmlContent && htmlContent.length > 0) {
      console.log('   ✅ Updating initialHtml (page changed or first load)');
      setInitialHtml(htmlContent);
      hasLoadedRef.current = true;
      lastPageRef.current = currentPage;
      
      // Reset editor state
      setSelectedElements([]);
      setGuides({ vertical: [], horizontal: [] });
      dragStateRef.current = null;
    } else if (!htmlContent || htmlContent.length === 0) {
      console.log('   ⚠️ htmlContent is empty or undefined, waiting...');
    } else {
      console.log('   ℹ️ Skipping - same page content update (no reload)');
    }
  }, [currentPage, htmlContent]); // Watch BOTH to catch when content loads

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log('❌ No iframe ref');
      return;
    }

    console.log('🔄 Setting up editor for page:', currentPage);
    
    let retryCount = 0;
    const maxRetries = 20; // Max 2 seconds of retrying

    const initEditor = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        console.log('❌ No contentDocument');
        return;
      }
      
      if (!doc.body) {
        console.log('❌ No body yet, waiting...');
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initEditor, 100);
        } else {
          console.error('❌ TIMEOUT: Body never loaded after', maxRetries, 'retries');
        }
        return;
      }
      
      // CRITICAL: Wait for actual content, not just empty body
      // Check multiple times because content might load progressively
      const bodyHasContent = doc.body.children && doc.body.children.length > 0;
      const bodyHasText = doc.body.textContent && doc.body.textContent.trim().length > 0;
      
      if (!bodyHasContent && !bodyHasText) {
        console.log('⏳ Body is empty (retry', retryCount + 1, '/', maxRetries, ')');
        console.log('   - children:', doc.body.children?.length);
        console.log('   - text length:', doc.body.textContent?.length);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initEditor, 100);
        } else {
          console.warn('⚠️ Body still empty after', maxRetries, 'retries - initializing anyway');
          console.log('   This might mean the srcDoc content is empty or invalid');
          console.log('   htmlContent length:', htmlContent?.length);
          console.log('   initialHtml length:', initialHtml?.length);
          // Continue with initialization anyway
        }
        
        if (retryCount >= maxRetries) {
          // Force continue after max retries
        } else {
          return;
        }
      }

      console.log('✅ Initializing editor on body with', doc.body.children.length, 'children');
      console.log('   Body text length:', doc.body.textContent?.length);

      // Remove old event listeners if they exist
      if (eventHandlersRef.current) {
        console.log('🧹 Cleaning up old handlers');
        const { doc: oldDoc, handlers } = eventHandlersRef.current;
        try {
          oldDoc.removeEventListener('mousedown', handlers.mousedown);
          oldDoc.removeEventListener('mousemove', handlers.mousemove);
          oldDoc.removeEventListener('mouseup', handlers.mouseup);
          oldDoc.removeEventListener('mouseover', handlers.mouseover);
          oldDoc.removeEventListener('mouseout', handlers.mouseout);
          oldDoc.removeEventListener('dblclick', handlers.dblclick);
        } catch (e) {
          console.log('Cleanup error (ok):', e.message);
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
        * { 
          box-sizing: border-box;
        }
        body { 
          position: relative !important;
          min-height: 100vh;
        }
        .editor-selected { 
          outline: 3px solid #8b5cf6 !important; 
          outline-offset: 2px !important;
          cursor: grab !important;
        }
        .editor-selected:active {
          cursor: grabbing !important;
        }
        .editor-hover { 
          outline: 2px dashed #3b82f6 !important; 
          outline-offset: 2px !important;
        }
        .editor-dragging {
          opacity: 0.8 !important;
          cursor: grabbing !important;
        }
      `;

      // Disable all links, buttons, and form submissions
      const preventDefaultActions = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      doc.addEventListener('click', preventDefaultActions, true);
      doc.addEventListener('submit', preventDefaultActions, true);
      
      // Also prevent navigation on links
      doc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', preventDefaultActions, true);
      });
      
      doc.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', preventDefaultActions, true);
      });

      // Setup event handlers
      const handleMouseDown = (e) => {
        // Don't allow dragging if we're editing text
        if (isEditingRef.current) {
          console.log('⚠️ Ignoring mousedown - text editing in progress');
          return;
        }
        
        let target = e.target;
        
        // CRITICAL: Find the right element to select/drag
        // Skip up to a meaningful draggable element
        const findDraggableElement = (el) => {
          // Don't allow dragging these elements
          const nonDraggable = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'];
          
          // Don't allow dragging background/hero sections
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
          
          // If clicking on text inside an element, find the parent container
          // But stop at sections/headers/etc
          if (el.tagName === 'SPAN' || el.tagName === 'STRONG' || el.tagName === 'EM' || 
              el.tagName === 'B' || el.tagName === 'I' || el.tagName === 'U') {
            const parent = el.closest('p, h1, h2, h3, h4, h5, h6, a, button, div, li');
            if (parent && !isBackground) {
              return parent;
            }
          }
          
          // For container divs, check if they have draggable children
          // If a div only contains other divs/sections, it's not draggable
          if (el.tagName === 'DIV') {
            const children = Array.from(el.children);
            
            // Check if it's a pure container (only has structural elements)
            const onlyStructural = children.every(child => 
              ['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'ASIDE', 'NAV'].includes(child.tagName)
            );
            
            // Also check if it's a wrapper with no direct text content
            const hasDirectText = Array.from(el.childNodes).some(node => 
              node.nodeType === 3 && node.textContent.trim().length > 0
            );
            
            // If it's a container with only structural elements and no direct text, don't allow dragging
            if (onlyStructural && children.length > 0 && !hasDirectText) {
              console.log('  ⚠️ Skipping container div with only structural children');
              return null;
            }
            
            // Also skip very large containers (likely layout containers)
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.8 && children.length > 3) {
              console.log('  ⚠️ Skipping large layout container');
              return null;
            }
          }
          
          return el;
        };
        
        const draggableTarget = findDraggableElement(target);
        
        if (!draggableTarget) {
          console.log('⚠️ Clicked non-draggable element:', target.tagName, target.className);
          return;
        }
        
        target = draggableTarget;
        
        console.log('═══════════════════════════════════════');
        console.log('🟢 MOUSEDOWN EVENT');
        console.log('Target:', target.tagName, target.className);
        console.log('State BEFORE:');
        console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
        console.log('  - dragStartedRef.current:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - Has editor-selected class:', target.classList.contains('editor-selected'));
        console.log('  - Currently selected elements:', doc.querySelectorAll('.editor-selected').length);
        console.log('  - Event handlers attached:', !!eventHandlersRef.current);
        
        // Ignore structural elements
        if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          console.log('❌ IGNORING - Structural element');
          console.log('═══════════════════════════════════════');
          return;
        }

        // ALWAYS prevent default for all clicks in editor mode
        e.preventDefault();
        e.stopPropagation();
        
        console.log('⚙️ Setting state variables...');
        isMouseDownRef.current = true;
        dragStartedRef.current = false;
        
        console.log('State AFTER setting refs:');
        console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
        console.log('  - dragStartedRef.current:', dragStartedRef.current);
        console.log('  - Refs are working:', isMouseDownRef.current === true);

        // If clicking on already selected element, prepare to drag
        if (target.classList.contains('editor-selected')) {
          console.log('✅ PREPARING TO DRAG (element already selected)');
          const iframeRect = iframe.getBoundingClientRect();
          const currentlySelected = Array.from(doc.querySelectorAll('.editor-selected'));
          console.log('  - Found', currentlySelected.length, 'selected elements');
          console.log('  - iframeRect:', iframeRect);
          
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
          
          console.log('  - Created dragStateRef with', elementsData.length, 'elements');
          console.log('  - Start position:', e.clientX, e.clientY);
          console.log('  - dragStateRef.current is set:', !!dragStateRef.current);
        } else {
          // Clicking on new element
          console.log('✅ PREPARING TO SELECT (new element)');
          dragStateRef.current = {
            clickedElement: target,
            startX: e.clientX,
            startY: e.clientY,
            moved: false
          };
          console.log('  - Stored clickedElement for selection on mouseup');
        }
        
        console.log('Final state check:');
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
        console.log('  - dragStartedRef.current:', dragStartedRef.current);
        console.log('═══════════════════════════════════════');
      };

      const handleMouseMove = (e) => {
        // Check if we should be moving at all
        const shouldMove = isMouseDownRef.current && dragStateRef.current;
        
        if (!shouldMove) {
          // Only log occasionally to avoid spam
          if (isMouseDownRef.current && !dragStateRef.current) {
            console.log('⚠️ MOUSEMOVE - isMouseDown true but no dragStateRef!');
            console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
            console.log('  - dragStateRef.current:', dragStateRef.current);
            console.log('  - This should never happen!');
          }
          return;
        }

        const dx = e.clientX - dragStateRef.current.startX;
        const dy = e.clientY - dragStateRef.current.startY;
        
        // Only start drag if moved more than 5px
        if (!dragStartedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          console.log('───────────────────────────────────────');
          console.log('🔄 STARTING DRAG (moved >5px)');
          console.log('  - dx:', dx, 'dy:', dy);
          console.log('  - dragStateRef.current.elements:', dragStateRef.current.elements?.length);
          console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
          console.log('  - dragStartedRef.current (before):', dragStartedRef.current);
          
          // CRITICAL FIX: If we don't have elements, we clicked a new element and need to prepare it
          if (!dragStateRef.current.elements && dragStateRef.current.clickedElement) {
            console.log('  - 🔧 FIX: Converting click to drag - preparing element...');
            const clickedEl = dragStateRef.current.clickedElement;
            
            // First select it
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            clickedEl.classList.add('editor-selected');
            setSelectedElements([clickedEl]);
            
            // Then prepare for drag
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
            
            console.log('  - ✅ Element prepared, now has', dragStateRef.current.elements.length, 'elements');
          }
          
          dragStartedRef.current = true;
          dragStateRef.current.moved = true;
          
          console.log('  - dragStartedRef.current (after):', dragStartedRef.current);
          console.log('  - dragStateRef.current.moved:', dragStateRef.current.moved);
          
          if (dragStateRef.current.elements) {
            dragStateRef.current.elements.forEach(data => {
              data.el.classList.add('editor-dragging');
            });
            console.log('  - Added editor-dragging class to', dragStateRef.current.elements.length, 'elements');
          } else {
            console.log('  - ⚠️ NO ELEMENTS TO DRAG!');
          }
          console.log('───────────────────────────────────────');
        }
        
        // Perform drag with snapping (only log when actually dragging)
        if (dragStartedRef.current && dragStateRef.current.elements) {
          const firstElement = dragStateRef.current.elements[0];
          
          let newLeft = firstElement.startLeft + dx;
          let newTop = firstElement.startTop + dy;
          
          // Log every 10th mousemove to avoid spam
          if (Math.random() < 0.1) {
            console.log('🖱️ Dragging:');
            console.log('  - dx:', dx, 'dy:', dy);
            console.log('  - startLeft:', firstElement.startLeft, 'startTop:', firstElement.startTop);
            console.log('  - newLeft:', newLeft, 'newTop:', newTop);
            console.log('  - Current style.left:', firstElement.el.style.left, 'style.top:', firstElement.el.style.top);
          }
          
          // Use document coordinates, not viewport coordinates
          const elemCenterX = newLeft + firstElement.width / 2;
          const elemCenterY = newTop + firstElement.height / 2;
          
          const snapThreshold = 10; // Slightly larger threshold for easier snapping
          const detectedGuides = { vertical: [], horizontal: [] };
          
          // Calculate the center of the VIEWPORT (visible page area)
          const iframeRect = dragStateRef.current.iframeRect;
          const viewportCenterX = iframeRect.width / 2;
          const viewportCenterY = iframeRect.height / 2;
          
          // Convert element position to viewport coordinates for comparison
          const elemViewportCenterX = newLeft + firstElement.width / 2;
          const elemViewportCenterY = newTop + firstElement.height / 2;
          
          if (Math.random() < 0.1) {
            console.log('📐 Snap calculations:');
            console.log('  - elemViewportCenterX:', elemViewportCenterX, 'viewportCenterX:', viewportCenterX);
            console.log('  - Difference:', Math.abs(elemViewportCenterX - viewportCenterX));
          }
          
          // SNAP TO PAGE CENTER (Horizontal)
          if (Math.abs(elemViewportCenterX - viewportCenterX) < snapThreshold) {
            newLeft = viewportCenterX - firstElement.width / 2;
            detectedGuides.vertical.push({ 
              x: viewportCenterX, 
              type: 'center', 
              label: 'Page Center' 
            });
          }
          
          // SNAP TO PAGE CENTER (Vertical)
          if (Math.abs(elemViewportCenterY - viewportCenterY) < snapThreshold) {
            newTop = viewportCenterY - firstElement.height / 2;
            detectedGuides.horizontal.push({ 
              y: viewportCenterY, 
              type: 'center', 
              label: 'Page Center' 
            });
          }
          
          // Get document scroll for element-to-element snapping
          const scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft;
          const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
          
          // Find parent section/container for sibling element detection
          const draggingElement = firstElement.el;
          let parentSection = draggingElement.closest('section, header, footer, main, article, aside, div[class*="container"], div[class*="section"]');
          
          if (!parentSection) {
            parentSection = doc.body;
          }
          
          // SNAP TO OTHER ELEMENTS (Center to Center only) - also in document coordinates
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
            // Convert to document coordinates
            const otherLeft = otherRect.left - iframeRect.left + scrollLeft;
            const otherTop = otherRect.top - iframeRect.top + scrollTop;
            const otherCenterX = otherLeft + otherRect.width / 2;
            const otherCenterY = otherTop + otherRect.height / 2;
            
            // Snap center to center (horizontal)
            if (Math.abs(elemCenterX - otherCenterX) < snapThreshold) {
              newLeft = otherCenterX - firstElement.width / 2;
              if (!detectedGuides.vertical.some(g => g.x === otherCenterX)) {
                detectedGuides.vertical.push({ 
                  x: otherCenterX, 
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
            
            // Snap center to center (vertical)
            if (Math.abs(elemCenterY - otherCenterY) < snapThreshold) {
              newTop = otherCenterY - firstElement.height / 2;
              if (!detectedGuides.horizontal.some(g => g.y === otherCenterY)) {
                detectedGuides.horizontal.push({ 
                  y: otherCenterY, 
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
          });
          
          // Limit to 1 guide per direction for cleaner UI
          setGuides({ 
            vertical: detectedGuides.vertical.slice(0, 1),
            horizontal: detectedGuides.horizontal.slice(0, 1) 
          });
          
          const deltaX = newLeft - firstElement.startLeft;
          const deltaY = newTop - firstElement.startTop;
          
          dragStateRef.current.elements.forEach((data, index) => {
            const finalLeft = data.startLeft + deltaX;
            const finalTop = data.startTop + deltaY;
            data.el.style.left = finalLeft + 'px';
            data.el.style.top = finalTop + 'px';
            
            if (index === 0 && Math.random() < 0.1) {
              console.log('  - Applied: left=' + finalLeft + 'px, top=' + finalTop + 'px');
            }
          });
        }
      };

      const handleMouseUp = (e) => {
        console.log('═══════════════════════════════════════');
        console.log('🔵 MOUSEUP EVENT');
        console.log('State at mouseup:');
        console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
        console.log('  - dragStartedRef.current:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - dragStateRef.current?.moved:', dragStateRef.current?.moved);
        console.log('  - Event handlers still attached:', !!eventHandlersRef.current);
        
        if (!isMouseDownRef.current) {
          console.log('❌ ABORT - isMouseDown is false (event already handled or never started)');
          console.log('   This might indicate handlers were removed or refs were reset');
          console.log('═══════════════════════════════════════');
          return;
        }
        
        console.log('⚙️ Setting isMouseDownRef.current = false');
        isMouseDownRef.current = false;
        console.log('   Confirmed: isMouseDownRef.current =', isMouseDownRef.current);
        
        // If we were dragging, save and cleanup
        if (dragStartedRef.current && dragStateRef.current?.elements) {
          console.log('✅ FINISHING DRAG');
          console.log('  - Removing editor-dragging class from', dragStateRef.current.elements.length, 'elements');
          
          dragStateRef.current.elements.forEach(data => {
            data.el.classList.remove('editor-dragging');
            console.log('    - Cleaned up:', data.el.tagName, 'position:', data.el.style.position);
          });
          
          setGuides({ vertical: [], horizontal: [] });
          
          console.log('  - Calling saveChanges()...');
          saveChanges();
          
          console.log('  - Resetting drag state...');
          dragStateRef.current = null;
          dragStartedRef.current = false;
          
          console.log('✅ DRAG COMPLETE - All state reset');
          console.log('Post-drag state:');
          console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
          console.log('  - dragStartedRef.current:', dragStartedRef.current);
          console.log('  - dragStateRef.current:', dragStateRef.current);
          console.log('  - Event handlers ref:', !!eventHandlersRef.current);
          console.log('  - Doc still accessible:', !!doc);
          console.log('═══════════════════════════════════════');
          
          // CRITICAL: Test if handlers are still working
          console.log('🧪 TESTING: Click again to verify handlers are still attached');
          return;
        }
        
        // If we didn't drag, handle selection
        if (dragStateRef.current && !dragStateRef.current.moved) {
          console.log('✅ HANDLING SELECTION (no drag occurred)');
          const target = dragStateRef.current.clickedElement || e.target;
          
          console.log('  - Target to select:', target.tagName, target.className);
          
          if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
            console.log('  - Clearing selection (structural element)');
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            setSelectedElements([]);
            dragStateRef.current = null;
            dragStartedRef.current = false;
            console.log('═══════════════════════════════════════');
            return;
          }
          
          // Multi-select with shift
          if (e.shiftKey) {
            console.log('  - MULTI-SELECT MODE (Shift held)');
            if (target.classList.contains('editor-selected')) {
              console.log('    - Deselecting element');
              target.classList.remove('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              console.log('    - Now', newSelected.length, 'elements selected');
              setSelectedElements(newSelected);
            } else {
              console.log('    - Adding to selection');
              target.classList.add('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              console.log('    - Now', newSelected.length, 'elements selected');
              setSelectedElements(newSelected);
            }
          } else {
            // Single select
            console.log('  - SINGLE SELECT MODE');
            const previouslySelected = doc.querySelectorAll('.editor-selected');
            console.log('    - Clearing', previouslySelected.length, 'previously selected elements');
            
            previouslySelected.forEach(el => {
              el.classList.remove('editor-selected');
              console.log('      - Removed from:', el.tagName);
            });
            
            target.classList.add('editor-selected');
            console.log('    - ✅ Added editor-selected to:', target.tagName);
            console.log('    - Class list now:', target.className);
            
            setSelectedElements([target]);
            loadProps(target);
            console.log('    - Updated React state with 1 element');
          }
        } else if (!dragStateRef.current) {
          console.log('⚠️ No dragStateRef - this shouldn\'t happen');
        } else if (dragStateRef.current.moved) {
          console.log('⚠️ dragStateRef.moved is true but dragStarted is false - inconsistent state');
        }
        
        console.log('⚙️ Final cleanup...');
        dragStateRef.current = null;
        dragStartedRef.current = false;
        
        console.log('✅ SELECTION/MOUSEUP COMPLETE - State reset');
        console.log('Final state check:');
        console.log('  - isMouseDownRef.current:', isMouseDownRef.current);
        console.log('  - dragStartedRef.current:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - Elements with .editor-selected:', doc.querySelectorAll('.editor-selected').length);
        console.log('  - Event handlers still there:', !!eventHandlersRef.current);
        console.log('═══════════════════════════════════════');
      };

      const handleMouseOver = (e) => {
        if (isMouseDownRef.current || dragStartedRef.current) return;
        
        let target = e.target;
        
        // Use same logic as mousedown to find draggable element
        const nonDraggable = ['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 
                              'SECTION', 'HEADER', 'FOOTER', 'MAIN'];
        
        if (nonDraggable.includes(target.tagName)) return;
        
        // Skip background classes
        const isBackground = target.classList?.contains('hero') || 
                           target.classList?.contains('background') ||
                           target.classList?.contains('bg-');
        if (isBackground) return;
        
        // For text elements, hover the parent
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
        
        let target = e.target;
        
        // Use the same smart targeting as mousedown to find the right element
        if (['SPAN', 'STRONG', 'EM', 'B', 'I', 'U'].includes(target.tagName)) {
          const parent = target.closest('p, h1, h2, h3, h4, h5, h6, a, button, div, li');
          if (parent) target = parent;
        }
        
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV','LI'].includes(target.tagName)) {
          console.log('✏️ Starting text edit mode');
          
          // Set editing flag to block dragging
          isEditingRef.current = true;
          
          // Remove hover and selected classes temporarily
          target.classList.remove('editor-hover');
          const wasSelected = target.classList.contains('editor-selected');
          target.classList.remove('editor-selected');
          
          // Make editable
          target.contentEditable = 'true';
          target.style.cursor = 'text';
          target.focus();
          
          // Select all text
          const range = doc.createRange();
          range.selectNodeContents(target);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          const handleBlur = () => {
            console.log('✏️ Ending text edit mode');
            target.contentEditable = 'false';
            target.style.cursor = '';
            target.removeEventListener('blur', handleBlur);
            
            // Restore selected state if it was selected
            if (wasSelected) {
              target.classList.add('editor-selected');
            }
            
            // Re-enable dragging
            isEditingRef.current = false;
            
            saveChanges();
          };
          
          target.addEventListener('blur', handleBlur);
        }
      };

      // Attach event listeners
      doc.addEventListener('mousedown', handleMouseDown);
      doc.addEventListener('mousemove', handleMouseMove);
      doc.addEventListener('mouseup', handleMouseUp);
      doc.addEventListener('mouseover', handleMouseOver);
      doc.addEventListener('mouseout', handleMouseOut);
      doc.addEventListener('dblclick', handleDoubleClick);

      console.log('✅ Event listeners attached');
      console.log('   - mousedown:', !!handleMouseDown);
      console.log('   - mousemove:', !!handleMouseMove);
      console.log('   - mouseup:', !!handleMouseUp);

      // Store handlers for cleanup
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
      
      // Test that events work
      console.log('🧪 Testing event system...');
      doc.body.addEventListener('click', () => console.log('✅ Click event works!'), { once: true });
    };

    // Try multiple initialization strategies
    if (iframe.contentDocument?.readyState === 'complete') {
      console.log('📄 Document already complete');
      initEditor();
    } else {
      console.log('⏳ Waiting for iframe load...');
      iframe.onload = () => {
        console.log('✅ Iframe loaded');
        initEditor();
      };
      
      // Backup: try after a short delay
      setTimeout(() => {
        if (!eventHandlersRef.current) {
          console.log('⚠️ Handlers not attached, retrying...');
          initEditor();
        }
      }, 500);
    }

    return () => {
      // Cleanup on unmount
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
          // Ignore cleanup errors
        }
      }
    };
  }, [currentPage]); // ONLY depend on currentPage, NOT htmlContent!

  const prepareElementForDrag = (elem, doc) => {
    const computed = window.getComputedStyle(elem);
    
    console.log('🔧 prepareElementForDrag called:');
    console.log('  - Element:', elem.tagName, elem.className);
    console.log('  - Current position:', computed.position);
    console.log('  - Has placeholder already:', !!elem.dataset.hasPlaceholder);
    
    if (computed.position === 'static' || computed.position === 'relative' || !elem.style.position) {
      const rect = elem.getBoundingClientRect();
      const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
      
      const width = rect.width;
      const height = rect.height;
      const calculatedLeft = rect.left - parentRect.left;
      const calculatedTop = rect.top - parentRect.top;
      
      console.log('  - Rect:', {left: rect.left, top: rect.top, width, height});
      console.log('  - Parent rect:', {left: parentRect.left, top: parentRect.top});
      console.log('  - Calculated position:', {left: calculatedLeft, top: calculatedTop});
      
      // Create a placeholder to maintain layout
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
        
        // Insert placeholder before the element
        elem.parentNode.insertBefore(placeholder, elem);
        elem.dataset.hasPlaceholder = 'true';
        elem.dataset.placeholderId = 'placeholder-' + Date.now() + '-' + Math.random();
        placeholder.dataset.placeholderId = elem.dataset.placeholderId;
        
        console.log('  - ✅ Created placeholder');
      } else {
        console.log('  - ℹ️ Placeholder already exists');
      }
      
      // Convert to absolute positioning
      elem.style.position = 'absolute';
      elem.style.left = calculatedLeft + 'px';
      elem.style.top = calculatedTop + 'px';
      elem.style.width = width + 'px';
      elem.style.height = height + 'px';
      elem.style.margin = '0';
      elem.style.zIndex = '1000';
      
      console.log('  - ✅ Set position to: left=' + elem.style.left + ', top=' + elem.style.top);
    } else {
      console.log('  - ℹ️ Already absolute/fixed, skipping');
    }
  };

  const saveChanges = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    
    updateTimeoutRef.current = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        
        console.log('💾 SAVING CHANGES...');
        console.log('  - Placeholders before cleanup:', doc.querySelectorAll('.drag-placeholder').length);
        console.log('  - Elements with hasPlaceholder:', doc.querySelectorAll('[data-has-placeholder]').length);
        
        // Store which elements are selected before save
        const selectedElementsData = Array.from(doc.querySelectorAll('.editor-selected')).map(el => {
          return {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            textContent: el.textContent?.substring(0, 50) // First 50 chars for identification
          };
        });
        console.log('  - Selected elements before save:', selectedElementsData.length);
        
        // DON'T remove placeholders - keep them in the document to maintain layout
        // Just clean them from the saved HTML
        
        const html = doc.documentElement.outerHTML;
        
        const cleanedHTML = html
          .replace(/<div[^>]*class="[^"]*drag-placeholder[^"]*"[^>]*><\/div>/g, '') // Remove placeholder divs
          .replace(/\s*class="([^"]*)"/g, (match, classes) => {
            const cleaned = classes
              .replace(/\s*editor-selected\s*/g, ' ')
              .replace(/\s*editor-hover\s*/g, ' ')
              .replace(/\s*editor-dragging\s*/g, ' ')
              .replace(/\s*drag-placeholder\s*/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return cleaned ? ` class="${cleaned}"` : '';
          })
          .replace(/\s+class=""\s*/g, ' ')
          .replace(/\s+data-has-placeholder="[^"]*"/g, '')
          .replace(/\s+data-placeholder-id="[^"]*"/g, '');
        
        console.log('  - Cleaned HTML length:', cleanedHTML.length);
        console.log('  - Original HTML length:', html.length);
        
        // Only call onUpdate if HTML actually changed
        if (cleanedHTML !== lastSavedHtmlRef.current) {
          console.log('  - HTML changed, calling onUpdate...');
          lastSavedHtmlRef.current = cleanedHTML;
          onUpdate(cleanedHTML);
        } else {
          console.log('  - HTML unchanged, skipping onUpdate');
        }
        
        console.log('💾 SAVE COMPLETE');
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
    if (!confirm('Delete selected element(s)?')) return;
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    saveChanges();
  };

  const duplicate = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    selectedElements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('editor-selected', 'editor-hover', 'editor-dragging');
      
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
        {/* Undo/Redo Buttons */}
        <button
          onClick={() => {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              // Implement undo via browser history if needed
              console.log('Undo clicked');
            }
          }}
          className="p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
          title="Undo"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              console.log('Redo clicked');
            }
          }}
          className="p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
          title="Redo"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        {/* Info Icon with Tooltip */}
        <div className="relative group">
          <button className="p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-0 top-12 w-80 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
            <div className="text-sm font-medium space-y-1">
              <p>💡 <strong>Click</strong> to select</p>
              <p>🖱️ <strong>Drag</strong> to move (auto-snap)</p>
              <p>✏️ <strong>Double-click</strong> to edit text</p>
              <p>⌨️ <strong>Shift+Click</strong> for multi-select</p>
            </div>
            {/* Arrow */}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-purple-600 transform rotate-45"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef} 
          srcDoc={initialHtml}
          key={currentPage} 
          className="w-full h-full border-none"
          title="Visual Editor"
        />
        
        {/* Snap Guide Lines - Only Center Alignment */}
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

      {selectedElements.length > 0 && (
        <div className="w-72 bg-white border-l overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b bg-purple-50 flex justify-between items-center">
            <span className="font-bold text-sm">
              {selectedElements.length === 1 ? `${selectedElements[0].tagName}` : `${selectedElements.length} Selected`}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={duplicate} 
                className="p-1.5 hover:bg-white rounded transition" 
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={deleteEl} 
                className="p-1.5 hover:bg-white rounded transition" 
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1">Width</label>
              <input 
                type="text" 
                value={elementProps.width} 
                onChange={(e) => updateProp('width', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="auto" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Height</label>
              <input 
                type="text" 
                value={elementProps.height} 
                onChange={(e) => updateProp('height', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="auto" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Font Size</label>
              <input 
                type="text" 
                value={elementProps.fontSize} 
                onChange={(e) => updateProp('fontSize', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'normal' : 'bold')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('fontStyle', elementProps.fontStyle === 'italic' ? 'normal' : 'italic')} 
                className="flex-1 p-2 border rounded hover:bg-gray-50 transition"
              >
                <Italic className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => updateProp('textAlign', 'left')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'left' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignLeft className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('textAlign', 'center')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'center' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignCenter className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('textAlign', 'right')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'right' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignRight className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Text Color</label>
              <input 
                type="color" 
                value={elementProps.color} 
                onChange={(e) => updateProp('color', e.target.value)} 
                className="w-full h-10 cursor-pointer rounded" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Background Color</label>
              <input 
                type="color" 
                value={elementProps.backgroundColor} 
                onChange={(e) => updateProp('backgroundColor', e.target.value)} 
                className="w-full h-10 cursor-pointer rounded" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Padding</label>
              <input 
                type="text" 
                value={elementProps.padding} 
                onChange={(e) => updateProp('padding', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="0px" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Margin</label>
              <input 
                type="text" 
                value={elementProps.margin} 
                onChange={(e) => updateProp('margin', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="0px" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
