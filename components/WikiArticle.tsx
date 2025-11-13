import React, { useState, useRef, useMemo } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { SearchIcon } from './icons';
import { Popover, PopoverContent } from './Popover';

interface WikiArticleProps {
  topic: string;
  content?: string;
  onLinkClick: (topic: string) => void;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({ topic, content, onLinkClick }) => {
  const articleRef = useRef<HTMLElement>(null);
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverContentText, setPopoverContentText] = useState('');
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null);

  const handleMouseUp = () => {
    // Use a timeout to allow the browser to register the selection
    setTimeout(() => {
      const domSelection = window.getSelection();
      const selectedText = domSelection ? domSelection.toString().trim() : '';

      if (selectedText.length > 2 && selectedText.length < 100 && domSelection) {
        const target = domSelection.anchorNode?.parentElement;
        // Prevent popover on non-article text
        if (target?.closest('a, button, h1, h2, h3')) {
          setPopoverOpen(false);
          return;
        }

        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Ensure the selection has a physical presence in the DOM
        if (rect.width > 0 || rect.height > 0) {
          setPopoverAnchorRect(rect);
          setPopoverContentText(selectedText);
          setPopoverOpen(true);
        } else {
          setPopoverOpen(false);
        }
      } else if (selectedText.length === 0) {
         // Close popover if selection is cleared
         setPopoverOpen(false);
      }
    }, 10);
  };
  
  const handleExplore = () => {
    if (popoverContentText) {
      onLinkClick(popoverContentText);
      setPopoverOpen(false);
    }
  };

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
      <article ref={articleRef} onMouseUp={handleMouseUp} className="prose prose-invert max-w-none">
        {content ? parsedContent : <SkeletonLoader />}
      </article>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen} virtualAnchor={popoverAnchorRect}>
        <PopoverContent 
            side="top" 
            align="center"
            sideOffset={8}
            className="z-30 bg-gray-800 border border-gray-700 rounded-md shadow-2xl p-2 flex items-center gap-2 w-64"
        >
          <button
            onClick={handleExplore}
            className="flex items-center gap-2 text-left p-2 rounded-md transition-colors duration-200 text-cyan-300 hover:bg-gray-700/50 w-full"
          >
            <SearchIcon className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold truncate">Explore: "{popoverContentText}"</span>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
