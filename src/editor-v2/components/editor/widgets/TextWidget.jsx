import { useState, useRef, useEffect } from 'react';

// ============================================
// TEXT WIDGET
// Inline-editable text (headings, paragraphs)
// ============================================
export default function TextWidget({ widget, devicePreview, isEditing, onUpdate }) {
  const [isEditingText, setIsEditingText] = useState(false);
  const textRef = useRef(null);
  
  const content = widget.content || {};
  const style = widget.style || {};
  const responsiveStyle = widget.responsive?.[devicePreview] || {};

  // Combined styles
  const combinedStyle = {
    fontSize: responsiveStyle.fontSize || style.fontSize || '16px',
    fontWeight: responsiveStyle.fontWeight || style.fontWeight || 'normal',
    color: responsiveStyle.color || style.color || '#1f2937',
    lineHeight: responsiveStyle.lineHeight || style.lineHeight || '1.6',
    textAlign: responsiveStyle.textAlign || content.alignment || 'left',
    marginBottom: responsiveStyle.marginBottom || style.marginBottom || '16px',
    maxWidth: style.maxWidth || 'none',
    margin: style.margin || undefined,
  };

  // Handle inline editing
  const handleDoubleClick = () => {
    setIsEditingText(true);
  };

  const handleBlur = () => {
    setIsEditingText(false);
    if (textRef.current) {
      const newText = textRef.current.innerText;
      if (newText !== content.text) {
        onUpdate({
          content: { ...content, text: newText },
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textRef.current?.blur();
    }
    if (e.key === 'Escape') {
      textRef.current.innerText = content.text;
      setIsEditingText(false);
    }
  };

  // Focus when editing starts
  useEffect(() => {
    if (isEditingText && textRef.current) {
      textRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditingText]);

  // Render the appropriate tag
  const Tag = content.tag || 'p';

  return (
    <Tag
      ref={textRef}
      style={combinedStyle}
      contentEditable={isEditingText}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none ${isEditingText ? 'ring-2 ring-purple-400 rounded px-1' : ''}`}
    >
      {content.text || 'Click to edit text'}
    </Tag>
  );
}
