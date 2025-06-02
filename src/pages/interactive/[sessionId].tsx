import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSessionStore, { Question, UserAnswer } from '../../store/useSessionStore';
import { IoIosOptions } from 'react-icons/io';
import { IoColorFillOutline } from 'react-icons/io5';
import { SiTruenas } from 'react-icons/si';
import { TiDocumentText } from 'react-icons/ti';
import { MdOutlineFeedback } from 'react-icons/md';
import { FiHome, FiSave, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Markdown from 'react-markdown';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function InteractiveSession() {
    const router = useRouter();
    const { sessionId } = router.query;
    
    const {
        getSessionById,
        saveAnswer,
        markSessionCompleted,
        saveAnalysis,
        currentSession,
        setCurrentSession,
        sessions,
        isHydrated,
        refreshSession
    } = useSessionStore();

    const [session, setSession] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionNotFound, setSessionNotFound] = useState(false);

    // Simplified session loading effect
    useEffect(() => {
        const id = sessionId || router.query.uuid;
        
        if (!id || typeof id !== 'string') {
            setIsLoading(false);
            return;
        }

        if (!isHydrated) {
            return;
        }

        console.log('Loading session:', id);
        const foundSession = getSessionById(id);
        
        if (foundSession) {
            setSession(foundSession);
            setCurrentSession(id);
            setIsLoading(false);
            setSessionNotFound(false);
            
            // If session is already completed, show results
            if (foundSession.analysis && foundSession.isCompleted) {
                setShowResults(true);
            }
        } else {
            // Fallback: Try to load from localStorage directly
            try {
                const storedData = localStorage.getItem('eduquest-sessions');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    const storedSessions = parsedData?.state?.sessions || [];
                    const foundStoredSession = storedSessions.find((s: any) => s.id === id);
                    
                    if (foundStoredSession) {
                        setSession(foundStoredSession);
                        setCurrentSession(id);
                        setIsLoading(false);
                        setSessionNotFound(false);
                        
                        if (foundStoredSession.analysis && foundStoredSession.isCompleted) {
                            setShowResults(true);
                        }
                        return;
                    }
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
            
            setIsLoading(false);
            setSessionNotFound(true);
        }
    }, [sessionId, router.query.uuid, isHydrated, getSessionById, setCurrentSession]);

    // Re-sync session when store updates
    useEffect(() => {
        if (session?.id && isHydrated) {
            const updatedSession = getSessionById(session.id);
            if (updatedSession) {
                setSession(updatedSession);
            }
        }
    }, [sessions, session?.id, getSessionById, isHydrated]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#13151A] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-2 border-white border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg mb-2">Loading session...</p>
                    <p className="text-sm text-gray-400 mb-4">Please wait while we load your quiz data</p>
                </div>
            </div>
        );
    }

    // Session not found state
    if (sessionNotFound || !session) {
        return (
            <div className="min-h-screen bg-[#13151A] text-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <FiAlertCircle size={64} className="text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
                    <p className="text-gray-400 mb-6">
                        The quiz session you're looking for doesn't exist or may have been deleted.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link 
                            href="/" 
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FiHome size={20} />
                            Create New Quiz
                        </Link>
                        <button
                            onClick={() => {
                                setIsLoading(true);
                                setSessionNotFound(false);
                                
                                const id = sessionId || router.query.uuid;
                                if (id && typeof id === 'string') {
                                    const refreshedSession = refreshSession(id as string);
                                    if (refreshedSession) {
                                        setSession(refreshedSession);
                                        setIsLoading(false);
                                        toast.success('Session loaded successfully!');
                                        return;
                                    }
                                    
                                    setIsLoading(false);
                                    setSessionNotFound(true);
                                    toast.error('Session still not found');
                                }
                            }}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FiRefreshCw size={20} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const mcqQuestions = session.questions.filter((q: Question) => q.type === 'mcq');
    const fillQuestions = session.questions.filter((q: Question) => q.type === 'fill');
    const trueFalseQuestions = session.questions.filter((q: Question) => q.type === 'true_false');
    const shortQuestions = session.questions.filter((q: Question) => q.type === 'short');
    const longQuestions = session.questions.filter((q: Question) => q.type === 'long');

    const handleAnswerChange = (questionId: string, answer: string | boolean) => {
        console.log('Saving answer for question:', questionId, 'Answer:', answer);
        
        // Save to store
        saveAnswer(questionId, answer);
        
        // Immediately update local session state to ensure UI reactivity
        setSession((prevSession: any) => {
            if (!prevSession) return prevSession;
            
            const updatedAnswers = [...prevSession.userAnswers];
            const existingAnswerIndex = updatedAnswers.findIndex(
                (userAnswer: UserAnswer) => userAnswer.questionId === questionId
            );
            
            if (existingAnswerIndex >= 0) {
                updatedAnswers[existingAnswerIndex] = { questionId, answer };
            } else {
                updatedAnswers.push({ questionId, answer });
            }
            
            return {
                ...prevSession,
                userAnswers: updatedAnswers
            };
        });
    };

    const getUserAnswer = (questionId: string) => {
        const answer = session.userAnswers.find((answer: UserAnswer) => answer.questionId === questionId)?.answer;
        console.log('Getting answer for question:', questionId, 'Answer:', answer);
        return answer;
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        
        try {
            // Prepare data for analysis
            const shortAnswers = shortQuestions.map((q: Question) => ({
                question: q.question,
                answer: getUserAnswer(q.id) || ''
            }));
            
            const longAnswers = longQuestions.map((q: Question) => ({
                question: q.question,
                answer: getUserAnswer(q.id) || ''
            }));

            console.log('Sending for analysis:', { shortAnswers, longAnswers });

            const response = await axios.post('/api/analyze-answers', {
                shortQuestions: shortAnswers,
                longQuestions: longAnswers
            });

            const feedback = response.data.feedback;
            const scoreMatch = feedback.match(/(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;

            const analysis = {
                score,
                totalQuestions: session.questions.length,
                percentage: Math.round((score / session.questions.length) * 100),
                feedback,
                accuracyScore: score,
                timestamp: new Date()
            };

            console.log('Saving analysis:', analysis);
            saveAnalysis(session.id, analysis);
            markSessionCompleted(session.id);
            
            // Update local session state with the new analysis
            setSession((prevSession: any) => ({
                ...prevSession,
                analysis,
                isCompleted: true
            }));

            setShowResults(true);
            toast.success('Analysis completed!');

        } catch (error) {
            console.error('Error during analysis:', error);
            toast.error('Failed to analyze answers. Please try again.');
        }
        
        setIsAnalyzing(false);
    };

    const isQuestionAnswered = (questionId: string) => {
        const answered = session.userAnswers.some((answer: UserAnswer) => answer.questionId === questionId);
        console.log('Question', questionId, 'answered:', answered);
        return answered;
    };

    const getProgressPercentage = () => {
        const percentage = Math.round((session.userAnswers.length / session.questions.length) * 100);
        console.log('Progress:', session.userAnswers.length, '/', session.questions.length, '=', percentage + '%');
        return percentage;
    };

    const allQuestionsAnswered = session.userAnswers.length === session.questions.length;

    return (
        <div className="min-h-screen bg-[#13151A] text-white">
            {/* Header */}
            <div className="bg-[#1F2329] border-b border-gray-700 p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{session.name}</h1>
                        <p className="text-gray-400">{session.topic} • {session.questions.length} questions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-gray-400">Progress: </span>
                            <span className="text-blue-400">{session.userAnswers.length}/{session.questions.length}</span>
                            <span className="text-gray-400"> ({getProgressPercentage()}%)</span>
                        </div>
                        <Link href="/" className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                            <FiHome size={16} />
                            Home
                        </Link>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mx-[5%] w-full bg-gray-700 rounded-full h-2 mt-4">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto p-6">
                {showResults && session.analysis ? (
                    /* Results Section */
                    <div className="bg-[#1F2329] rounded-lg p-6">
                        <div className="text-center mb-6">
                            <FiCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                            <p className="text-gray-400">Your score: {session.analysis.percentage}%</p>
                        </div>
                        
                        <div className="bg-[#13151A] rounded-lg p-4 mb-6">
                            <h3 className="text-xl font-semibold mb-3">AI Feedback</h3>
                            <Markdown className="text-gray-300">{session.analysis.feedback}</Markdown>
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                            <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
                                Create New Quiz
                            </Link>
                            <button
                                onClick={() => setShowResults(false)}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg"
                            >
                                Review Answers
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Questions Section */
                    <div className="space-y-8">
                        {/* MCQ Section */}
                        {mcqQuestions.length > 0 && (
                            <div className="bg-[#1F2329] rounded-lg p-6">
                                <div className="flex items-center gap-3 text-2xl mb-6">
                                    <IoIosOptions />
                                    <h3 className="font-bold">Multiple Choice Questions</h3>
                                </div>
                                {mcqQuestions.map((mcq: Question, index: number) => (
                                    <div key={mcq.id} className="mb-6 p-4 bg-[#13151A] rounded-lg">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-blue-400 font-bold">{index + 1}.</span>
                                            <p className="font-bold text-[#9ca0d2] flex-1">{mcq.question}</p>
                                            {isQuestionAnswered(mcq.id) && (
                                                <FiCheckCircle className="text-green-500" size={20} />
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                                            {mcq.options?.map((option, optionIndex) => (
                                                <label key={optionIndex} className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                                    <input
                                                        type="radio"
                                                        name={`mcq-${mcq.id}`}
                                                        value={option}
                                                        checked={getUserAnswer(mcq.id) === option}
                                                        onChange={(e) => handleAnswerChange(mcq.id, e.target.value)}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-gray-200">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Fill in the Blanks Section */}
                        {fillQuestions.length > 0 && (
                            <div className="bg-[#1F2329] rounded-lg p-6">
                                <div className="flex items-center gap-3 text-2xl mb-6">
                                    <IoColorFillOutline />
                                    <h3 className="font-bold">Fill in the Blanks</h3>
                                </div>
                                {fillQuestions.map((fill: Question, index: number) => (
                                    <div key={fill.id} className="mb-6 p-4 bg-[#13151A] rounded-lg">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-blue-400 font-bold">{index + 1}.</span>
                                            <div className="flex-1">
                                                <p className="text-[#9ca0d2] mb-3">{fill.question}</p>
                                                <input
                                                    type="text"
                                                    value={getUserAnswer(fill.id) || ''}
                                                    onChange={(e) => handleAnswerChange(fill.id, e.target.value)}
                                                    placeholder="Enter your answer..."
                                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                            {isQuestionAnswered(fill.id) && (
                                                <FiCheckCircle className="text-green-500" size={20} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* True/False Section */}
                        {trueFalseQuestions.length > 0 && (
                            <div className="bg-[#1F2329] rounded-lg p-6">
                                <div className="flex items-center gap-3 text-2xl mb-6">
                                    <SiTruenas />
                                    <h3 className="font-bold">True/False Questions</h3>
                                </div>
                                {trueFalseQuestions.map((tf: Question, index: number) => (
                                    <div key={tf.id} className="mb-6 p-4 bg-[#13151A] rounded-lg">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-blue-400 font-bold">{index + 1}.</span>
                                            <p className="font-bold text-[#9ca0d2] flex-1">{tf.question}</p>
                                            {isQuestionAnswered(tf.id) && (
                                                <FiCheckCircle className="text-green-500" size={20} />
                                            )}
                                        </div>
                                        <div className="flex gap-4 ml-6">
                                            <label className="flex items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`tf-${tf.id}`}
                                                    checked={getUserAnswer(tf.id) === true}
                                                    onChange={() => handleAnswerChange(tf.id, true)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-green-400">True</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`tf-${tf.id}`}
                                                    checked={getUserAnswer(tf.id) === false}
                                                    onChange={() => handleAnswerChange(tf.id, false)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-red-400">False</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Short Answer Section */}
                        {shortQuestions.length > 0 && (
                            <div className="bg-[#1F2329] rounded-lg p-6">
                                <div className="flex items-center gap-3 text-2xl mb-6">
                                    <TiDocumentText />
                                    <h3 className="font-bold">Short Answer Questions</h3>
                                </div>
                                {shortQuestions.map((short: Question, index: number) => (
                                    <div key={short.id} className="mb-6 p-4 bg-[#13151A] rounded-lg">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-blue-400 font-bold">{index + 1}.</span>
                                            <div className="flex-1">
                                                <p className="text-[#9ca0d2] mb-3">{short.question}</p>
                                                <textarea
                                                    value={getUserAnswer(short.id) || ''}
                                                    onChange={(e) => handleAnswerChange(short.id, e.target.value)}
                                                    placeholder="Enter your short answer..."
                                                    rows={3}
                                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none transition-colors"
                                                />
                                            </div>
                                            {isQuestionAnswered(short.id) && (
                                                <FiCheckCircle className="text-green-500" size={20} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Long Answer Section */}
                        {longQuestions.length > 0 && (
                            <div className="bg-[#1F2329] rounded-lg p-6">
                                <div className="flex items-center gap-3 text-2xl mb-6">
                                    <MdOutlineFeedback />
                                    <h3 className="font-bold">Long Answer Questions</h3>
                                </div>
                                {longQuestions.map((long: Question, index: number) => (
                                    <div key={long.id} className="mb-6 p-4 bg-[#13151A] rounded-lg">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-blue-400 font-bold">{index + 1}.</span>
                                            <div className="flex-1">
                                                <p className="text-[#9ca0d2] mb-3">{long.question}</p>
                                                <textarea
                                                    value={getUserAnswer(long.id) || ''}
                                                    onChange={(e) => handleAnswerChange(long.id, e.target.value)}
                                                    placeholder="Enter your detailed answer..."
                                                    rows={6}
                                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none transition-colors"
                                                />
                                            </div>
                                            {isQuestionAnswered(long.id) && (
                                                <FiCheckCircle className="text-green-500" size={20} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="text-center">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || session.userAnswers.length === 0}
                                className={`px-8 py-4 font-semibold rounded-lg transition-colors flex items-center gap-3 mx-auto ${
                                    allQuestionsAnswered
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : session.userAnswers.length > 0
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                        : 'bg-gray-600 cursor-not-allowed text-gray-400'
                                } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Analyzing Answers...
                                    </>
                                ) : (
                                    <>
                                        <FiSave size={20} />
                                        {allQuestionsAnswered 
                                            ? `Submit Complete Quiz (${session.userAnswers.length}/${session.questions.length})`
                                            : `Submit Partial Quiz (${session.userAnswers.length}/${session.questions.length} answered)`
                                        }
                                    </>
                                )}
                            </button>
                            {!allQuestionsAnswered && session.userAnswers.length > 0 && (
                                <p className="text-sm text-yellow-400 mt-2">
                                    You can submit now, but consider answering all questions for a complete analysis.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 