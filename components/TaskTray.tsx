
import React, { useState } from 'react';
import { MiniSpinner, CheckCircleIcon, AlertCircleIcon, XCircleIcon, RefreshIcon, ChevronUpIcon, ChevronDownIcon, CompassIcon } from './icons';

export type Task = {
    status: 'loading' | 'ready' | 'error';
};

interface TaskTrayProps {
    tasks: { [key: string]: Task };
    onNavigate: (topic: string) => void;
    onRetry: (topic: string) => void;
    onDismiss: (topic: string) => void;
}

const TaskItem: React.FC<{ 
    topic: string; 
    task: Task; 
    onNavigate: (topic: string) => void;
    onRetry: (topic: string) => void;
    onDismiss: (topic: string) => void;
}> = ({ topic, task, onNavigate, onRetry, onDismiss }) => {

    const renderStatusIcon = () => {
        switch (task.status) {
            case 'loading':
                return <MiniSpinner className="flex-shrink-0" />;
            case 'ready':
                return <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />;
            case 'error':
                return <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />;
        }
    };

    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-md transition-colors duration-200 group">
            <div className="flex items-center space-x-3 truncate">
                {renderStatusIcon()}
                <span className="truncate text-gray-300">{topic}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {task.status === 'ready' && (
                    <button onClick={() => onNavigate(topic)} className="p-1 text-gray-400 hover:text-white" title="View Article">
                        <CompassIcon className="w-5 h-5" />
                    </button>
                )}
                {task.status === 'error' && (
                     <button onClick={() => onRetry(topic)} className="p-1 text-gray-400 hover:text-white" title="Retry">
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
                <button onClick={() => onDismiss(topic)} className="p-1 text-gray-400 hover:text-white" title="Dismiss">
                    <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


export const TaskTray: React.FC<TaskTrayProps> = ({ tasks, onNavigate, onRetry, onDismiss }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const taskCount = Object.keys(tasks).length;

    if (taskCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-20 w-80">
            <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl flex flex-col transition-all duration-300">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center justify-between w-full p-3 text-left bg-gray-900/50 rounded-t-lg hover:bg-gray-900/80"
                >
                    <h3 className="font-bold text-white">Exploration Queue ({taskCount})</h3>
                    {isCollapsed ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                </button>
                
                {!isCollapsed && (
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {Object.entries(tasks).map(([topic, task]) => (
                            <TaskItem 
                                key={topic}
                                topic={topic}
                                task={task}
                                onNavigate={onNavigate}
                                onRetry={onRetry}
                                onDismiss={onDismiss}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
