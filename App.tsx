import React, { useState, useCallback, useEffect } from 'react';
import { generateWikiArticle } from './services/geminiService';
import { WikiArticle } from './components/WikiArticle';
import { HistoryTrail } from './components/HistoryTrail';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CommandKModal } from './components/CommandKModal';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { PanelLeftIcon, PanelRightIcon, HomeIcon, GraphIcon } from './components/icons';

type ArticlesCache = {
  [key: string]: string;
};

export default function App() {
  const [history, setHistory] = useState<string[]>([]);
  const [viewedTopics, setViewedTopics] = useState<string[]>([]);
  const [articles, setArticles] = useState<ArticlesCache>({});
  const [pageLinks, setPageLinks] = useState<{ [key: string]: string[] }>({});
  const [error, setError] = useState<string | null>(null);
  
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [hasExplorerBeenPopulated, setHasExplorerBeenPopulated] = useState(false);
  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const [isGraphView, setIsGraphView] = useState(false);

  const isExplorerVisible = viewedTopics.length > 0;

  // Auto-open explorer on first population
  useEffect(() => {
    if (isExplorerVisible && !hasExplorerBeenPopulated) {
      setIsExplorerOpen(true);
      setHasExplorerBeenPopulated(true);
    }
  }, [isExplorerVisible, hasExplorerBeenPopulated]);
  
  // Keyboard listener for Command-K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommanderOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTopic = history.length > 0 ? history[history.length - 1] : null;

  const addTopicToViewed = (topic: string) => {
    setViewedTopics(prev => {
      const lowerCaseTopic = topic.toLowerCase();
      if (!prev.some(t => t.toLowerCase() === lowerCaseTopic)) {
        return [...prev, topic];
      }
      return prev;
    });
  };

  const extractLinks = (content: string): string[] => {
    const matches = content.match(/\[\[(.*?)\]\]/g) || [];
    const uniqueLinks = new Set(matches.map(m => m.slice(2, -2)));
    return Array.from(uniqueLinks);
  };
  
  const fetchArticleForView = useCallback(async (topic: string) => {
    addTopicToViewed(topic);
    if (articles[topic.toLowerCase()]) return;

    try {
      const content = await generateWikiArticle(topic);
      setArticles(prev => ({ ...prev, [topic.toLowerCase()]: content }));
      const links = extractLinks(content);
      setPageLinks(prev => ({ ...prev, [topic.toLowerCase()]: links }));
    } catch (err) {
      console.error(err);
      setError(`Failed to generate article for "${topic}". Please try another topic.`);
      setHistory(prev => prev.filter(t => t.toLowerCase() !== topic.toLowerCase()));
    }
  }, [articles]);

  const startNewExploration = (topic: string) => {
    if (topic.trim() === '') return;
    setError(null);
    setHistory([topic]);
    setIsGraphView(false); // Always switch to article view for a new topic
  };
  
  useEffect(() => {
    if (currentTopic) {
        fetchArticleForView(currentTopic);
    }
  }, [currentTopic, fetchArticleForView]);

  const exploreTopic = (topic: string) => {
    setHistory(prev => [...prev, topic]);
    setIsGraphView(false); // Switch to article view when exploring
  };
  
  const navigateToHistory = (index: number) => {
    setHistory(prev => prev.slice(0, index + 1));
    setIsGraphView(false);
  };
  
  const jumpToTopic = (topic: string) => {
    if (topic.toLowerCase() === currentTopic?.toLowerCase()) return;
    startNewExploration(topic);
  };

  const goHome = () => {
    setHistory([]);
    setViewedTopics([]);
    setError(null);
    setArticles({});
    setPageLinks({});
    setHasExplorerBeenPopulated(false);
    setIsExplorerOpen(false);
    setIsGraphView(false);
  };
  
  const currentArticleContent = currentTopic ? articles[currentTopic.toLowerCase()] : undefined;
  const currentPageLinks = currentTopic ? pageLinks[currentTopic.toLowerCase()] || [] : [];

  return (
    <div className="h-screen bg-transparent font-sans text-gray-200 flex flex-col relative">
      <CommandKModal 
        isOpen={isCommanderOpen}
        onClose={() => setIsCommanderOpen(false)}
        onSearch={startNewExploration}
        history={viewedTopics}
        onJump={jumpToTopic}
      />

      {/* Floating Action Buttons */}
      <div className="absolute top-4 left-4 z-30">
        <button onClick={goHome} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 backdrop-blur-md transition-colors">
          <HomeIcon className="h-6 w-6"/>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        {isExplorerVisible && (
          <button onClick={() => setIsGraphView(!isGraphView)} className={`p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 backdrop-blur-md transition-colors ${isGraphView ? 'text-cyan-400' : ''}`}>
            <GraphIcon className="h-6 w-6"/>
          </button>
        )}
        {isExplorerVisible && (
           <button onClick={() => setIsExplorerOpen(!isExplorerOpen)} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 backdrop-blur-md transition-colors">
            {isExplorerOpen ? <PanelRightIcon className="h-6 w-6"/> : <PanelLeftIcon className="h-6 w-6"/>}
           </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden pt-16">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
          {history.length > 0 && !isGraphView && (
            <HistoryTrail history={history} onNavigate={navigateToHistory} />
          )}
          
          <div className={`${history.length > 0 ? 'mt-8' : ''}`}>
            {error && <ErrorDisplay message={error} />}
            
            {!error && currentTopic && !isGraphView && (
              <div className="mx-auto w-full">
                <WikiArticle
                  topic={currentTopic}
                  content={currentArticleContent}
                  onLinkClick={exploreTopic}
                />
              </div>
            )}

            {isGraphView && (
              <KnowledgeGraph
                viewedTopics={viewedTopics}
                history={history}
                onNodeClick={jumpToTopic}
              />
            )}

            {!currentTopic && !error && <WelcomeScreen onSearch={startNewExploration} />}
          </div>
        </main>

        {isExplorerVisible && (
            <aside className={`
            flex-shrink-0 transition-all duration-300 ease-in-out bg-[#111827]/60 backdrop-blur-md border-l border-gray-700/50
            ${isExplorerOpen ? 'w-80' : 'w-0'}
            `}>
            <ExplorerPanel 
                pageLinks={currentPageLinks}
                viewedTopics={viewedTopics}
                currentTopic={currentTopic}
                onExploreTopic={exploreTopic}
                onJumpToTopic={jumpToTopic}
            />
            </aside>
        )}
      </div>
    </div>
  );
}