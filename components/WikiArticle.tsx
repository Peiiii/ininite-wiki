import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { SearchIcon } from './icons';

// --- The new selection popover component ---
interface SelectionPopoverProps {
  selection: string;
  position: { top: number; left: number };
  onExplore: (topic: string) => void;
  onClose: () => void;
}

const SelectionPopover: React.FC<SelectionPopoverProps> = ({ selection, position, onExplore, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState('');

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleExploreWithContext = () => {
    if (context.trim()) {
      onExplore(`${selection}: ${context}`);
      onClose();
    }
  };
  
  const handleExplore = () => {
      onExplore(selection);
      onClose();
  }

  if (!selection) return null;

  return (
    <div
      ref={popoverRef}
      style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
      className="absolute z-30 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 flex flex-col gap-2 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-sm text-gray-400 border-b border-gray-700 pb-2 mb-1">
        <p className="font-semibold text-gray-200">Selected Text:</p>
        <p className="italic line-clamp-2">"{selection}"</p>
      </div>

      <button
        onClick={handleExplore}
        className="w-full flex items-center justify-center gap-2 text-left p-2 rounded-md transition-colors duration-200 text-cyan-300 hover:bg-gray-700/50"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="font-semibold">Explore Topic</span>
      </button>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Add context..."
          className="flex-grow bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm px-2 py-1"
          onKeyDown={(e) => e.key === 'Enter' && handleExploreWithContext()}
        />
        <button
          onClick={handleExploreWithContext}
          disabled={!context.trim()}
          className="p-1.5 rounded-md transition-colors bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Explore with context"
        >
          <SearchIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};


// --- The updated WikiArticle component ---
interface WikiArticleProps {
  topic: string;
  content?: string;
  onLinkClick: (topic: string) => void;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({ topic, content, onLinkClick }) => {
  const [popover, setPopover] = useState<{ selection: string; position: { top: number; left: number } } | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  
  const handleMouseUp = () => {
    // Timeout to allow click events to fire before selection is cleared
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString().trim() : '';

        // Show popover only for reasonably long, non-link selections
        if (selectedText.length > 3 && selectedText.length < 100) {
            const target = selection?.anchorNode?.parentElement;
            if (target?.tagName === 'A' || target?.tagName === 'BUTTON') {
                setPopover(null);
                return;
            }

            const range = selection!.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (articleRef.current) {
                const articleRect = articleRef.current.getBoundingClientRect();
                setPopover({
                    selection: selectedText,
                    position: {
                        top: rect.bottom - articleRect.top + 5,
                        left: rect.left - articleRect.left + (rect.width / 2),
                    }
                });
            }
        } else {
            setPopover(null);
        }
    }, 10);
  };
  
  // Basic markdown parser
  const parsedContent = useMemo(() => {
    if (!content) return null;

    return content.split('\n\n').map((paragraph, pIndex) => {
        const htmlContent = paragraph
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mb-2 text-gray-100">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-3 mt-4 border-b border-gray-700 pb-2 text-gray-50">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4 mt-5 border-b-2 border-gray-600 pb-3 text-white">$1</h1>')
            .split('\n').map(line => line.trim().startsWith('* ') ? `<li>${line.substring(2)}</li>` : line).join('')
            .replace(/<li>/g, '<ul><li>')
            .replace(/<\/li>(?!<li>)/g, '</li></ul>');

        return <div key={pIndex} className="mb-4 text-lg leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    });
  }, [content]);


  return (
    <div className="relative bg-gray-800/50 p-6 sm:p-8 rounded-lg shadow-2xl w-full animate-fade-in border border-gray-700/50 flex flex-col">
      <h2 className="text-4xl font-bold mb-6 text-cyan-400 border-b-2 border-gray-700 pb-3 flex-shrink-0">{topic}</h2>
      <article ref={articleRef} onMouseUp={handleMouseUp} onMouseDown={() => setPopover(null)} className="prose prose-invert max-w-none">
        {content ? parsedContent : <SkeletonLoader />}
      </article>
      {popover && popover.selection && (
        <SelectionPopover 
          selection={popover.selection}
          position={popover.position}
          onExplore={onLinkClick}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
};