import React, { useState } from 'react';
import { QuizQuestion } from '../services/geminiService';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface QuizProps {
    questions: QuizQuestion[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (questionIndex: number, option: string) => {
        if (submitted) return;
        setSelectedAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = option;
            return newAnswers;
        });
    };

    const handleSubmit = () => {
        setSubmitted(true);
    };

    const handleRetry = () => {
        setSelectedAnswers(Array(questions.length).fill(null));
        setSubmitted(false);
    };
    
    const score = selectedAnswers.reduce((total, answer, index) => {
        return answer === questions[index].answer ? total + 1 : total;
    }, 0);

    return (
        <div className="space-y-6">
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-800/50 p-4 rounded-md border border-gray-700">
                    <p className="font-medium text-gray-200 mb-3">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                            const isSelected = selectedAnswers[qIndex] === option;
                            const isCorrect = q.answer === option;
                            
                            let optionClass = "w-full text-left p-2.5 rounded-md transition-colors text-gray-300 border border-gray-600 ";
                            if (submitted) {
                                if (isCorrect) {
                                    optionClass += "bg-green-500/20 border-green-500/50 text-white";
                                } else if (isSelected && !isCorrect) {
                                    optionClass += "bg-red-500/20 border-red-500/50 text-white";
                                }
                            } else {
                                if (isSelected) {
                                    optionClass += "bg-cyan-500/20 border-cyan-500";
                                } else {
                                    optionClass += "hover:bg-gray-700/50";
                                }
                            }

                            return (
                                <button key={oIndex} onClick={() => handleSelect(qIndex, option)} className={optionClass} disabled={submitted}>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            {submitted && isSelected && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-400"/>}
                                            {submitted && isSelected && !isCorrect && <XCircleIcon className="w-5 h-5 text-red-400"/>}
                                            {submitted && !isSelected && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-400"/>}
                                        </div>
                                        <span>{option}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div className="flex items-center justify-between pt-4">
                {submitted ? (
                    <>
                        <p className="text-lg font-semibold text-white">Your Score: {score} / {questions.length}</p>
                        <button onClick={handleRetry} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Try Again
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        disabled={selectedAnswers.some(a => a === null)}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors w-full"
                    >
                        Check Answers
                    </button>
                )}
            </div>
        </div>
    );
};
