
import React, { useMemo } from 'react';

interface WikiArticleProps {
  topic: string;
  content: string;
  onLinkClick: (topic: string) => void;
}

export const WikiArticle: React.FC<WikiArticleProps> = ({ topic, content, onLinkClick }) => {
  const parsedContent = useMemo(() => {
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    
    return paragraphs.map((paragraph, pIndex) => {
      const parts = paragraph.split(/(\[\[.*?\]\])/g);
      
      return (
        <p key={pIndex} className="mb-4 text-lg leading-relaxed text-gray-300">
          {parts.map((part, index) => {
            const match = part.match(/\[\[(.*?)\]\]/);
            if (match) {
              const linkedTopic = match[1];
              return (
                <button
                  key={`${pIndex}-${index}`}
                  onClick={() => onLinkClick(linkedTopic)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium border-b border-cyan-700/40 hover:border-cyan-600/70 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm mx-1"
                >
                  {linkedTopic}
                </button>
              );
            }
            return part;
          })}
        </p>
      );
    });
  }, [content, onLinkClick]);

  return (
    <div className="bg-gray-800/50 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-4xl animate-fade-in border border-gray-700/50">
      <h2 className="text-4xl font-bold mb-6 text-cyan-400 border-b-2 border-gray-700 pb-3">{topic}</h2>
      <article className="prose prose-invert max-w-none">
        {parsedContent}
      </article>
    </div>
  );
};
