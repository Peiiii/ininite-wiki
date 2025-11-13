import React, { useState, useCallback, useEffect } from 'react';
import { generateWikiArticle } from './services/geminiService';
import { WikiArticle } from './components/WikiArticle';
import { HistoryTrail } from './components/HistoryTrail';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CommandKModal } from './components/CommandKModal';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { PanelRightIcon, GraphIcon, LogoIcon, SearchIcon, BookOpenIcon } from './components/icons';

type ArticlesCache = {
  [key: string]: string;
};

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
          setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      // Use addEventListener for modern browser compatibility
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export default function App() {
  const [history, setHistory] = usePersistentState<string[]>('wiki-history', []);
  const [viewedTopics, setViewedTopics] = usePersistentState<string[]>('wiki-viewedTopics', []);
  const [articles, setArticles] = usePersistentState<ArticlesCache>('wiki-articles', {});
  const [pageLinks, setPageLinks] = usePersistentState<{ [key: string]: string[] }>('wiki-pageLinks', {});
  const [error, setError] = useState<string | null>(null);
  
  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const [isGraphView, setIsGraphView] = useState(false);
  const [isMobileExplorerOpen, setIsMobileExplorerOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isExplorerVisible = viewedTopics.length > 0;
  
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
  }, [articles, setArticles, setPageLinks, setHistory]);

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
    if (topic.toLowerCase() === currentTopic?.toLowerCase()) {
        setIsGraphView(false);
        setIsMobileExplorerOpen(false);
        return;
    }
    
    const existingTopicIndex = history.findIndex(t => t.toLowerCase() === topic.toLowerCase());
    if (existingTopicIndex > -1) {
        navigateToHistory(existingTopicIndex);
    } else {
        exploreTopic(topic);
    }
    setIsMobileExplorerOpen(false);
  };

  const goHome = () => {
    setHistory([]);
    setViewedTopics([]);
    setError(null);
    setArticles({});
    setPageLinks({});
    setIsGraphView(false);
    setIsMobileExplorerOpen(false);
  };
  
  const currentArticleContent = currentTopic ? articles[currentTopic.toLowerCase()] : undefined;
  const currentPageLinks = currentTopic ? pageLinks[currentTopic.toLowerCase()] || [] : [];

  return (
    <div className="h-screen bg-transparent font-sans text-gray-200 flex flex-col">
      <CommandKModal 
        isOpen={isCommanderOpen}
        onClose={() => setIsCommanderOpen(false)}
        onSearch={startNewExploration}
        history={viewedTopics}
        onJump={jumpToTopic}
      />

      <header className="flex-shrink-0 h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50 flex items-center justify-between px-4 sm:px-6 z-20">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button onClick={goHome} className="flex items-center space-x-2 text-white hover:text-cyan-400 transition-colors flex-shrink-0">
                <LogoIcon className="h-7 w-7" />
                <span className="font-bold text-lg hidden sm:inline">Infinite Wiki</span>
            </button>
            <div className="flex-1 min-w-0 hidden md:block">
                {history.length > 0 && <HistoryTrail history={history} onNavigate={navigateToHistory} />}
            </div>
        </div>

        <div className="flex items-center space-x-3">
            {isExplorerVisible && !isDesktop && (
              <button onClick={() => setIsMobileExplorerOpen(true)} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors">
                  <PanelRightIcon className="h-5 w-5"/>
              </button>
            )}
            <button onClick={() => setIsCommanderOpen(true)} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors">
                <SearchIcon className="h-5 w-5"/>
            </button>
            {isExplorerVisible && (
                <div className="flex items-center bg-gray-800/60 border border-gray-700 rounded-md p-0.5">
                    <button onClick={() => setIsGraphView(false)} className={`px-2 py-1 rounded-sm text-sm flex items-center space-x-1.5 transition-colors ${!isGraphView ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                        <BookOpenIcon className="h-4 w-4"/>
                        <span className="hidden md:inline">Article</span>
                    </button>
                    <button onClick={() => setIsGraphView(true)} className={`px-2 py-1 rounded-sm text-sm flex items-center space-x-1.5 transition-colors ${isGraphView ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                        <GraphIcon className="h-4 w-4"/>
                        <span className="hidden md:inline">Graph</span>
                    </button>
                </div>
            )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
            <div className="md:hidden mb-4">
                {history.length > 0 && !isGraphView && <HistoryTrail history={history} onNavigate={navigateToHistory} />}
            </div>
            <div className={`w-full h-full flex flex-col items-center ${!currentTopic ? 'justify-start pt-20' : 'justify-center'}`}>
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
                    pageLinks={pageLinks}
                    history={history}
                    onNodeClick={jumpToTopic}
                />
                )}

                {!currentTopic && !error && <WelcomeScreen onSearch={startNewExploration} />}
            </div>
        </main>

        {isExplorerVisible && isDesktop && (
            <aside className="w-72 flex-shrink-0 bg-gray-900/30 backdrop-blur-md border-l border-gray-700/50 overflow-y-auto">
               <ExplorerPanel 
                    pageLinks={currentPageLinks}
                    viewedTopics={viewedTopics}
                    currentTopic={currentTopic}
                    onExploreTopic={exploreTopic}
                    onJumpToTopic={jumpToTopic}
                />
            </aside>
        )}
        
        {isExplorerVisible && !isDesktop && isMobileExplorerOpen && (
            <div className="fixed inset-0 bg-black/60 z-30 animate-fade-in" onClick={() => setIsMobileExplorerOpen(false)}>
                <aside 
                    className="absolute top-0 right-0 h-full w-80 bg-[#111827] border-l border-gray-700/50 shadow-2xl animate-slide-in-right" 
                    onClick={e => e.stopPropagation()}
                >
                    <ExplorerPanel 
                        pageLinks={currentPageLinks}
                        viewedTopics={viewedTopics}
                        currentTopic={currentTopic}
                        onExploreTopic={exploreTopic}
                        onJumpToTopic={jumpToTopic}
                        onClose={() => setIsMobileExplorerOpen(false)}
                    />
                </aside>
            </div>
        )}
      </div>
    </div>
  );
}