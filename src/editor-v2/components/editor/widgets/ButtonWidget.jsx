import { useState, useRef, useEffect } from 'react';

// ============================================
// BUTTON WIDGET
// ============================================
export default function ButtonWidget({ widget, devicePreview, isEditing, onUpdate }) {
  const [isEditingText, setIsEditingText] = useState(false);
  const buttonRef = useRef(null);
  
  const content = widget.content || {};
  const style = widget.style || {};

  // Button style presets
  const getButtonStyle = () => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: style.padding || '12px 24px',
      fontSize: style.fontSize || '16px',
      fontWeight: style.fontWeight || '600',
      borderRadius: style.borderRadius || '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      width: content.fullWidth ? '100%' : 'auto',
    };

    switch (content.style) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: style.backgroundColor || '#8b5cf6',
          color: style.color || '#ffffff',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: style.backgroundColor || '#1f2937',
          color: style.color || '#ffffff',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: style.color || '#8b5cf6',
          border: `2px solid ${style.borderColor || '#8b5cf6'}`,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: style.backgroundColor || '#8b5cf6',
          color: style.color || '#ffffff',
        };
    }
  };

  // Size presets
  const getSizeStyle = () => {
    switch (content.size) {
      case 'small':
        return { padding: '8px 16px', fontSize: '14px' };
      case 'large':
        return { padding: '16px 32px', fontSize: '18px' };
      default:
        return {};
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setIsEditingText(true);
  };

  const handleBlur = () => {
    setIsEditingText(false);
    if (buttonRef.current) {
      const newText = buttonRef.current.innerText;
      if (newText !== content.text) {
        onUpdate({
          content: { ...content, text: newText },
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buttonRef.current?.blur();
    }
    if (e.key === 'Escape') {
      buttonRef.current.innerText = content.text;
      setIsEditingText(false);
    }
  };

  useEffect(() => {
    if (isEditingText && buttonRef.current) {
      buttonRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(buttonRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditingText]);

  const combinedStyle = {
    ...getButtonStyle(),
    ...getSizeStyle(),
  };

  return (
    <div style={{ textAlign: content.alignment || 'center' }}>
      <button
        ref={buttonRef}
        style={combinedStyle}
        contentEditable={isEditingText}
        suppressContentEditableWarning
        onDoubleClick={handleDoubleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          e.preventDefault();
          if (!isEditingText) {
            // In edit mode, just select - don't navigate
          }
        }}
        className={`outline-none ${isEditingText ? 'ring-2 ring-amber-400' : ''}`}
      >
        {content.text || 'Click Here'}
      </button>
    </div>
  );
}
