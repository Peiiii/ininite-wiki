import React, { useState, useCallback, useEffect } from 'react';
import { generateWikiArticle } from './services/geminiService';
import { SearchBar } from './components/SearchBar';
import { WikiArticle } from './components/WikiArticle';
import { HistoryTrail } from './components/HistoryTrail';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ExplorerPanel } from './components/ExplorerPanel';
import { LogoIcon, PanelLeftIcon, PanelRightIcon } from './components/icons';

type ArticlesCache = {
  [key: string]: string;
};

export type Task = {
    status: 'loading' | 'ready' | 'error';
};

export default function App() {
  const [history, setHistory] = useState<string[]>([]);
  const [viewedTopics, setViewedTopics] = useState<string[]>([]);
  const [articles, setArticles] = useState<ArticlesCache>({});
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [hasExplorerBeenPopulated, setHasExplorerBeenPopulated] = useState(false);

  const isExplorerVisible = Object.keys(tasks).length > 0 || viewedTopics.length > 0;

  useEffect(() => {
    if (isExplorerVisible && !hasExplorerBeenPopulated) {
      setIsExplorerOpen(true);
      setHasExplorerBeenPopulated(true);
    }
  }, [isExplorerVisible, hasExplorerBeenPopulated]);


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

  const fetchArticleForView = useCallback(async (topic: string) => {
    addTopicToViewed(topic);
    if (articles[topic.toLowerCase()]) return;

    try {
      const content = await generateWikiArticle(topic);
      setArticles(prev => ({ ...prev, [topic.toLowerCase()]: content }));
    } catch (err) {
      console.error(err);
      setError(`Failed to generate article for "${topic}". Please try another topic.`);
      setHistory(prev => prev.filter(t => t.toLowerCase() !== topic.toLowerCase()));
    }
  }, [articles]);

  const requestArticleInBackground = useCallback(async (topic: string) => {
    if (!topic || tasks[topic] || articles[topic.toLowerCase()]) return;

    setTasks(prev => ({ ...prev, [topic]: { status: 'loading' } }));
    
    try {
      const content = await generateWikiArticle(topic);
      setArticles(prev => ({ ...prev, [topic.toLowerCase()]: content }));
      setTasks(prev => ({ ...prev, [topic]: { status: 'ready' } }));
    } catch (err) {
      console.error(err);
      setTasks(prev => ({ ...prev, [topic]: { status: 'error' } }));
    }
  }, [tasks, articles]);

  const handleSearch = (topic: string) => {
    if (topic.trim() === '') return;
    setError(null);
    setTasks({});
    setViewedTopics([]);
    setHistory([topic]);
  };
  
  useEffect(() => {
    if (currentTopic) {
        fetchArticleForView(currentTopic);
    }
  }, [currentTopic, fetchArticleForView]);

  const handleLinkClick = (topic: string) => {
    requestArticleInBackground(topic);
  };
  
  const navigateToHistory = (index: number) => {
    setHistory(prev => prev.slice(0, index + 1));
  };
  
  const navigateToTopicFromQueue = (topic: string) => {
    addTopicToViewed(topic);
    setHistory(prev => [...prev, topic]);
    dismissTask(topic);
  };
  
  const jumpToTopic = (topic: string) => {
    setHistory([topic]);
  };
  
  const dismissTask = (topic: string) => {
    setTasks(prev => {
        const newTasks = { ...prev };
        delete newTasks[topic];
        return newTasks;
    });
  };

  const goHome = () => {
    setHistory([]);
    setViewedTopics([]);
    setError(null);
    setTasks({});
    setArticles({});
    setHasExplorerBeenPopulated(false);
    setIsExplorerOpen(false);
  };
  
  const currentArticleContent = currentTopic ? articles[currentTopic.toLowerCase()] : undefined;

  return (
    <div className="h-screen bg-transparent font-sans text-gray-200 flex flex-col">
      <header className="sticky top-0 z-20 bg-[#111827]/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
               <div className="flex items-center space-x-3 cursor-pointer" onClick={goHome}>
                  <LogoIcon className="h-8 w-8 text-cyan-400" />
                  <h1 className="text-2xl font-bold tracking-tight text-white hidden sm:block">Infinite Wiki</h1>
               </div>
            </div>
            <div className="flex-1 max-w-xl mx-8">
              {history.length > 0 && <SearchBar onSearch={requestArticleInBackground} />}
            </div>
            <div className="flex items-center w-16 justify-end">
              {isExplorerVisible && (
                 <button onClick={() => setIsExplorerOpen(!isExplorerOpen)} className="p-2 rounded-md hover:bg-gray-700 transition-colors">
                  {isExplorerOpen ? <PanelRightIcon className="h-6 w-6"/> : <PanelLeftIcon className="h-6 w-6"/>}
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
          {history.length > 0 && (
            <HistoryTrail history={history} onNavigate={navigateToHistory} />
          )}
          
          <div className="mt-8">
            {error && <ErrorDisplay message={error} />}
            
            {!error && currentTopic && (
              <div className="mx-auto w-full">
                <WikiArticle
                  topic={currentTopic}
                  content={currentArticleContent}
                  onLinkClick={handleLinkClick}
                />
              </div>
            )}

            {!currentTopic && !error && <WelcomeScreen onSearch={handleSearch} />}
          </div>
        </main>

        {isExplorerVisible && (
            <aside className={`
            flex-shrink-0 transition-all duration-300 ease-in-out bg-[#111827]/60 backdrop-blur-md border-l border-gray-700/50
            ${isExplorerOpen ? 'w-80' : 'w-0'}
            `}>
            <ExplorerPanel 
                tasks={tasks}
                viewedTopics={viewedTopics}
                currentTopic={currentTopic}
                onNavigateFromQueue={navigateToTopicFromQueue}
                onJumpToTopic={jumpToTopic}
                onRetry={requestArticleInBackground}
                onDismiss={dismissTask}
            />
            </aside>
        )}
      </div>
    </div>
  );
}