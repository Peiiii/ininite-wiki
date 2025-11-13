
import React, { useState, useCallback } from 'react';
import { generateWikiArticle } from './services/geminiService';
import { SearchBar } from './components/SearchBar';
import { WikiArticle } from './components/WikiArticle';
import { HistoryTrail } from './components/HistoryTrail';
import { LoadingSpinner } from './components/LoadingSpinner';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { TaskTray, Task } from './components/TaskTray';
import { LogoIcon } from './components/icons';

type ArticlesCache = {
  [key: string]: string;
};

export default function App() {
  const [history, setHistory] = useState<string[]>([]);
  const [articles, setArticles] = useState<ArticlesCache>({});
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});

  const currentTopic = history.length > 0 ? history[history.length - 1] : null;

  const fetchAndDisplayArticle = useCallback(async (topic: string) => {
    setError(null);
    if (articles[topic.toLowerCase()]) {
      setHistory((prev) => [...prev, topic]);
      return;
    }

    setIsInitialLoad(true);
    try {
      const content = await generateWikiArticle(topic);
      setArticles((prev) => ({ ...prev, [topic.toLowerCase()]: content }));
      setHistory((prev) => [...prev, topic]);
    } catch (err) {
      console.error(err);
      setError('Failed to generate article. The topic might be too ambiguous or the service is currently unavailable. Please try again.');
    } finally {
      setIsInitialLoad(false);
    }
  }, [articles]);
  
  const requestArticle = useCallback(async (topic: string) => {
    if (!topic || tasks[topic] || (articles[topic.toLowerCase()] && history.includes(topic))) {
      return;
    }

    // If already generated, just navigate
    if (articles[topic.toLowerCase()]) {
        navigateToTopicFromTask(topic);
        return;
    }

    setTasks(prev => ({ ...prev, [topic]: { status: 'loading' } }));
    
    try {
      const content = await generateWikiArticle(topic);
      setArticles(prev => ({ ...prev, [topic.toLowerCase()]: content }));
      setTasks(prev => ({ ...prev, [topic]: { status: 'ready' } }));
    } catch (err) {
      console.error(err);
      setTasks(prev => ({ ...prev, [topic]: { status: 'error' } }));
    }
  }, [tasks, articles, history]);

  const handleSearch = (topic: string) => {
    if (topic.trim() === '') return;
    setHistory([]);
    setArticles({});
    setTasks({});
    fetchAndDisplayArticle(topic);
  };

  const handleLinkClick = (topic: string) => {
    // Treat link clicks as background requests to avoid interrupting flow
    requestArticle(topic);
  };
  
  const navigateToHistory = (index: number) => {
    setHistory((prev) => prev.slice(0, index + 1));
  };
  
  const navigateToTopicFromTask = (topic: string) => {
    setHistory([topic]); // Start a new history trail
    dismissTask(topic);
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
    setError(null);
    setTasks({});
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200 flex flex-col">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={goHome}
            >
              <LogoIcon className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Infinite Wiki</h1>
            </div>
            <div className="flex-1 max-w-xl ml-8">
              {history.length > 0 && <SearchBar onSearch={requestArticle} />}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {history.length > 0 && (
          <HistoryTrail history={history} onNavigate={navigateToHistory} />
        )}
        
        <div className="flex-grow mt-4 flex items-center justify-center">
          {isInitialLoad && <LoadingSpinner />}
          {error && !isInitialLoad && <ErrorDisplay message={error} />}
          {!isInitialLoad && !error && currentTopic && articles[currentTopic.toLowerCase()] && (
            <WikiArticle
              topic={currentTopic}
              content={articles[currentTopic.toLowerCase()]}
              onLinkClick={handleLinkClick}
            />
          )}
          {!isInitialLoad && !error && !currentTopic && <WelcomeScreen onSearch={handleSearch} isLoading={isInitialLoad} />}
        </div>
      </main>

      <TaskTray 
        tasks={tasks}
        onNavigate={navigateToTopicFromTask}
        onRetry={requestArticle}
        onDismiss={dismissTask}
      />

      <footer className="py-4 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>Powered by AI. Explore knowledge endlessly.</p>
      </footer>
    </div>
  );
}
