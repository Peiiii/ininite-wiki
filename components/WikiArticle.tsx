import React, { useState, useRef, useMemo } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { SearchIcon, LightBulbIcon, MiniSpinner } from './icons';
import { Popover, PopoverContent } from './Popover';
import { generateRelatedTopics } from '../services/geminiService';

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

  // New state for recommendations
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');


  const handleMouseUp = () => {
    // Use a timeout to allow the browser to register the selection
    setTimeout(async () => {
      const domSelection = window.getSelection();
      const selectedText = domSelection ? domSelection.toString().trim() : '';

      if (selectedText.length > 0 && selectedText.length < 100 && domSelection) {
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
          // Reset previous state and start generating
          setRecommendedTopics([]);
          setIsGeneratingTopics(true);
          setCustomPrompt('');

          try {
            const topics = await generateRelatedTopics(selectedText);
            setRecommendedTopics(topics);
          } catch (error) {
            console.error("Failed to fetch related topics", error);
            // Silently fail is fine, user can still explore or type
          } finally {
            setIsGeneratingTopics(false);
          }
        } else {
          setPopoverOpen(false);
        }
      } else if (selectedText.length === 0) {
         // Close popover if selection is cleared
         setPopoverOpen(false);
      }
    }, 10);
  };
  
  const handleExplore = (text: string) => {
    if (text.trim()) {
      onLinkClick(text.trim());
      setPopoverOpen(false);
    }
  };

  const handleCustomPromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customPrompt.trim()) {
      handleExplore(customPrompt);
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
            className="z-30 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-2 flex flex-col gap-2 w-80"
        >
          {/* Main explore button */}
          <button
            onClick={() => handleExplore(popoverContentText)}
            className="flex items-center gap-2 text-left p-2 rounded-md transition-colors duration-200 text-cyan-300 hover:bg-gray-700/50 w-full"
          >
            <SearchIcon className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold truncate">Explore: "{popoverContentText}"</span>
          </button>

          {/* Divider */}
          <hr className="border-gray-700" />
          
          {/* Recommended Topics Section */}
          <div className="px-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Related</h4>
            {isGeneratingTopics && (
              <div className="flex items-center gap-2 p-2 text-sm text-gray-400">
                <MiniSpinner className="w-4 h-4" />
                <span>Generating ideas...</span>
              </div>
            )}
            {!isGeneratingTopics && recommendedTopics.length > 0 && (
              <div className="flex flex-col gap-1">
                {recommendedTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleExplore(topic)}
                    className="flex items-center gap-2 text-left p-2 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 w-full text-sm"
                  >
                    <LightBulbIcon className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                    <span className="truncate">{topic}</span>
                  </button>
                ))}
              </div>
            )}
            {!isGeneratingTopics && recommendedTopics.length === 0 && (
                <p className="text-xs text-gray-500 px-2 py-1">No suggestions found.</p>
            )}
          </div>
          
          {/* Divider */}
          <hr className="border-gray-700" />

          {/* Custom Prompt Input */}
          <div className="relative px-1 pb-1">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={handleCustomPromptKeyDown}
              placeholder="Ask something else..."
              className="w-full bg-gray-900 border border-gray-600 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 hover:border-cyan-500/50 transition duration-200 py-1.5 px-3"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};