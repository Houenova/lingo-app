
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { VocabularyWord, GrammarFeedback } from '../types';
import { checkGrammar } from '../services/geminiService';

// --- Helper Functions & Constants ---
const SRS_LEVELS: { [key: number]: { label: string; color: string; minutes: number } } = {
  0: { label: "New", color: "bg-gray-400", minutes: 0 },
  1: { label: "Just Learned", color: "bg-cyan-500", minutes: 5 },
  2: { label: "Familiar", color: "bg-teal-500", minutes: 15 },
  3: { label: "Strengthening", color: "bg-blue-500", minutes: 30 },
  4: { label: "Confident", color: "bg-green-500", minutes: 60 },      // 1 hour
  5: { label: "Strong", color: "bg-lime-500", minutes: 180 },     // 3 hours
  6: { label: "Very Strong", color: "bg-yellow-500", minutes: 360 },  // 6 hours
  7: { label: "Established", color: "bg-amber-500", minutes: 720 },  // 12 hours
  8: { label: "Mastered", color: "bg-orange-500", minutes: 1440 }, // 24 hours
  9: { label: "Expert", color: "bg-purple-500", minutes: 1440 }, // Still 24 hours, but different status
};

const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

const formatReviewDate = (dateString: string): string => {
    const reviewDate = new Date(dateString);
    const now = new Date();
    const diffMs = reviewDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
        return "Due now";
    }

    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) {
        return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
        return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    return `on ${reviewDate.toLocaleDateString()}`;
};


// --- SVG Icons ---
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 0 0-2.09 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>;
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>;
const CheckIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const XIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);


// --- Main Component ---
export default function VocabularyPage() {
  const [words, setWords] = useLocalStorage<VocabularyWord[]>('vocabulary', []);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceWord, setPracticeWord] = useState<VocabularyWord | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  
  const wordsToReview = useMemo(() => {
    const now = new Date();
    return words.filter(word => new Date(word.nextReviewDate) <= now);
  }, [words]);

  const handleAdd = () => {
    setEditingWord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (word: VocabularyWord) => {
    setEditingWord(word);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this word?')) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const handleSave = (wordData: Omit<VocabularyWord, 'id' | 'srsLevel' | 'nextReviewDate' | 'createdAt'>) => {
    if (editingWord) {
      setWords(words.map(w => w.id === editingWord.id ? { ...w, ...wordData } : w));
    } else {
      const newWord: VocabularyWord = {
        ...wordData,
        id: crypto.randomUUID(),
        srsLevel: 0,
        nextReviewDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setWords([newWord, ...words]);
    }
    setIsFormOpen(false);
  };
  
  const openPractice = (word: VocabularyWord) => {
    setPracticeWord(word);
    setIsPracticeOpen(true);
  };

  const sortedWords = useMemo(() => [...words].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [words]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Vocabulary</h2>
          <p className="text-slate-500 dark:text-slate-400">Total words: {words.length}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsLearning(true)}
            disabled={wordsToReview.length === 0}
            className="w-1/2 sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <BookOpenIcon className="h-5 w-5" />
            Learn ({wordsToReview.length})
          </button>
          <button
            onClick={handleAdd}
            className="w-1/2 sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Word
          </button>
        </div>
      </div>
      
      {/* Word List */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {sortedWords.length > 0 ? sortedWords.map(word => (
            <li key={word.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{word.word}</p>
                    <span className="text-xs font-mono italic text-slate-500 dark:text-slate-400">{word.partOfSpeech}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{word.definition}</p>
                   <div className="flex items-center gap-2 mt-2">
                      <div className={`w-3 h-3 rounded-full ${SRS_LEVELS[word.srsLevel]?.color || 'bg-gray-400'}`} title={`Level ${word.srsLevel}: ${SRS_LEVELS[word.srsLevel]?.label}`}></div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Next review: {formatReviewDate(word.nextReviewDate)}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                   <button onClick={() => openPractice(word)} className="p-2 text-slate-500 hover:text-sky-500 hover:bg-sky-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Practice with AI"><SparklesIcon className="h-5 w-5" /></button>
                   <button onClick={() => handleEdit(word)} className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Edit"><PencilIcon className="h-5 w-5" /></button>
                   <button onClick={() => handleDelete(word.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Delete"><TrashIcon className="h-5 w-5" /></button>
                </div>
              </div>
            </li>
          )) : (
            <li className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>No vocabulary words yet. Click "Add Word" to get started!</p>
            </li>
          )}
        </ul>
      </div>

      {isFormOpen && <VocabularyForm currentWord={editingWord} onSave={handleSave} onClose={() => setIsFormOpen(false)} />}
      {isPracticeOpen && practiceWord && <SentencePracticeModal word={practiceWord} onClose={() => setIsPracticeOpen(false)} />}
      {isLearning && <LearningSessionModal words={words} setWords={setWords} reviewQueue={wordsToReview} onClose={() => setIsLearning(false)} />}
    </div>
  );
}


// --- Sub-components defined inside the main component file ---

interface VocabularyFormProps {
  currentWord: VocabularyWord | null;
  onSave: (wordData: Omit<VocabularyWord, 'id' | 'srsLevel' | 'nextReviewDate' | 'createdAt'>) => void;
  onClose: () => void;
}

const VocabularyForm: React.FC<VocabularyFormProps> = ({ currentWord, onSave, onClose }) => {
  const [word, setWord] = useState(currentWord?.word || '');
  const [partOfSpeech, setPartOfSpeech] = useState(currentWord?.partOfSpeech || '');
  const [definition, setDefinition] = useState(currentWord?.definition || '');

  const formRef = useRef<HTMLFormElement>(null);
  const partOfSpeechInputRef = useRef<HTMLInputElement>(null);
  const definitionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word && partOfSpeech && definition) {
      onSave({ word, partOfSpeech, definition });
    }
  };

  const handleWordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      partOfSpeechInputRef.current?.focus();
    }
  };

  const handlePartOfSpeechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      definitionTextareaRef.current?.focus();
    }
  };

  const handleDefinitionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit(); // This triggers the form's onSubmit event
    }
  };


  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">{currentWord ? 'Edit Word' : 'Add New Word'}</h3>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Word</label>
            <input 
                type="text" 
                id="word" 
                value={word} 
                onChange={e => setWord(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required
                autoFocus
                onKeyDown={handleWordKeyDown}
             />
          </div>
          <div>
            <label htmlFor="partOfSpeech" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Part of Speech</label>
            <input 
                type="text" 
                id="partOfSpeech" 
                ref={partOfSpeechInputRef}
                value={partOfSpeech} 
                onChange={e => setPartOfSpeech(e.target.value)} 
                placeholder="e.g., noun, verb, adjective" 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required 
                onKeyDown={handlePartOfSpeechKeyDown}
             />
          </div>
          <div>
            <label htmlFor="definition" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Definition</label>
            <textarea 
                id="definition" 
                ref={definitionTextareaRef}
                value={definition} 
                onChange={e => setDefinition(e.target.value)} 
                rows={3} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required
                onKeyDown={handleDefinitionKeyDown}
             ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SentencePracticeModalProps {
  word: VocabularyWord;
  onClose: () => void;
}

const SentencePracticeModal: React.FC<SentencePracticeModalProps> = ({ word, onClose }) => {
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState<GrammarFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    if (!sentence) return;
    setIsLoading(true);
    setFeedback(null);
    const result = await checkGrammar(sentence, word.word);
    setFeedback(result);
    setIsLoading(false);
  };

  return (
     <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
           <h3 className="text-lg font-bold mb-1">AI Sentence Practice</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Write a sentence using the word: <strong className="text-sky-500 dark:text-sky-400">{word.word}</strong></p>
           
           <textarea
             value={sentence}
             onChange={e => setSentence(e.target.value)}
             placeholder="e.g., The artist's work was a masterpiece of creativity."
             className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
             rows={3}
           />
           <button
             onClick={handleCheck}
             disabled={isLoading || !sentence}
             className="mt-4 w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-wait transition-colors"
           >
             {isLoading ? 'Analyzing...' : <><SparklesIcon className="h-5 w-5" /> Check Grammar</>}
           </button>

           {feedback && (
             <div className={`mt-4 p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-100 dark:bg-green-500/20' : 'bg-orange-100 dark:bg-orange-500/20'}`}>
                <p className={`font-semibold ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'}`}>{feedback.feedback}</p>
                {!feedback.isCorrect && (
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Suggestion:</span> {feedback.correctedSentence}
                  </p>
                )}
             </div>
           )}

           <button onClick={onClose} className="mt-4 w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 focus:outline-none">Close</button>
        </div>
     </div>
  );
};


interface LearningSessionModalProps {
  words: VocabularyWord[];
  setWords: React.Dispatch<React.SetStateAction<VocabularyWord[]>>;
  reviewQueue: VocabularyWord[];
  onClose: () => void;
}

const LearningSessionModal: React.FC<LearningSessionModalProps> = ({ words, setWords, reviewQueue, onClose }) => {
  const [sessionQueue, setSessionQueue] = useState([...reviewQueue].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  
  const currentWord = sessionQueue[currentIndex];

  const moveToNextWord = useCallback(() => {
    setFeedback('idle');
    setUserAnswer('');
    if(currentIndex < sessionQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
    } else {
        alert("Great job! You've completed your review session.");
        onClose();
    }
  }, [currentIndex, sessionQueue.length, onClose]);
  
  const handleCheckAnswer = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || feedback !== 'idle') return;
    
    const isCorrect = userAnswer.trim().toLowerCase() === currentWord.word.toLowerCase();
    
    const newSrsLevel = isCorrect 
      ? Math.min(currentWord.srsLevel + 1, 9) 
      : Math.max(0, currentWord.srsLevel - 1);
      
    const minutesToAdd = SRS_LEVELS[newSrsLevel].minutes;
    const newNextReviewDate = addMinutes(new Date(), minutesToAdd).toISOString();
    
    const updatedWord = { ...currentWord, srsLevel: newSrsLevel, nextReviewDate: newNextReviewDate };
    
    setWords(prevWords => prevWords.map(w => w.id === currentWord.id ? updatedWord : w));
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      moveToNextWord();
    }, isCorrect ? 1500 : 3000); // Give more time to see the correct answer if wrong
  }, [currentWord, userAnswer, feedback, setWords, moveToNextWord]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Mimic button's disabled state before calling handleCheckAnswer
      if (feedback === 'idle' && userAnswer.trim()) {
        handleCheckAnswer();
      }
    }
  };


  if (!currentWord) {
    return (
       <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
          <p className="font-bold text-lg">No words to review right now!</p>
          <p className="text-slate-500 mt-2">Come back later or add new words.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2 bg-sky-500 text-white font-semibold rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  const feedbackColors = {
    idle: 'border-slate-300 dark:border-slate-600 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500',
    correct: 'border-green-500 ring-2 ring-green-500 bg-green-50 dark:bg-green-500/10',
    incorrect: 'border-red-500 ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col p-4">
      <div className="w-full max-w-2xl mx-auto flex justify-between items-center text-white py-4">
        <h2 className="text-xl font-bold">Vocabulary Quiz</h2>
        <div className="text-lg font-mono">{currentIndex + 1} / {sessionQueue.length}</div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors"><XIcon className="h-6 w-6" /></button>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">What is the word for this definition?</p>
            <blockquote className="border-l-4 border-slate-200 dark:border-slate-700 pl-4 py-2 mb-6 min-h-[6rem]">
                <p className="text-lg text-slate-700 dark:text-slate-200">{currentWord.definition}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">({currentWord.partOfSpeech})</p>
            </blockquote>

            <form onSubmit={handleCheckAnswer}>
                <div className={`relative rounded-lg border-2 transition-colors ${feedbackColors[feedback]}`}>
                    <input 
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type the word here..."
                        autoFocus
                        disabled={feedback !== 'idle'}
                        className="w-full p-4 bg-transparent text-lg text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none disabled:text-slate-400 dark:disabled:text-slate-500"
                        aria-label="Your answer"
                    />
                    {feedback === 'correct' && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"><CheckIcon className="h-7 w-7"/></div>}
                    {feedback === 'incorrect' && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"><XIcon className="h-7 w-7"/></div>}
                </div>

                <div className="h-8 mt-2 text-center">
                  {feedback === 'incorrect' && (
                      <p className="text-red-600 dark:text-red-400">
                          Correct answer: <strong className="font-bold">{currentWord.word}</strong>
                      </p>
                  )}
                  {feedback === 'correct' && (
                      <p className="text-green-600 dark:text-green-400">
                          Correct!
                      </p>
                  )}
                </div>
                 
                <button 
                  type="submit" 
                  disabled={feedback !== 'idle' || !userAnswer}
                  className="mt-4 w-full px-6 py-4 bg-sky-500 text-white font-semibold rounded-lg shadow-lg hover:bg-sky-600 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Check Answer
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
