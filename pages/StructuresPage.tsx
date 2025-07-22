
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { StructureItem } from '../types';

const MASTERY_THRESHOLD = 2;

// --- SVG Icons ---
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 0 0-2.09 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg>);
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const LightningBoltIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const PencilWriteIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const CheckBadgeIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        {title && <title>{title}</title>}
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
const GripVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
  </svg>
);


export default function StructuresPage() {
  const [structures, setStructures] = useLocalStorage<StructureItem[]>('structures', []);
  const [editingStructure, setEditingStructure] = useState<StructureItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isPracticeAgainMode, setIsPracticeAgainMode] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);


  const handleAdd = () => {
    setEditingStructure(null);
    setIsFormOpen(true);
  };

  const handleEdit = (structure: StructureItem) => {
    setEditingStructure(structure);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this structure?')) {
      const newStructures = structures.filter(s => s.id !== id);
      setStructures(newStructures);
      
      const remainingInCategory = newStructures.filter(s => s.category === selectedCategory);
      if (selectedCategory && remainingInCategory.length === 0) {
        setSelectedCategory(null);
      }
    }
  };

  const handleSave = (structureData: Omit<StructureItem, 'id' | 'createdAt' | 'consecutiveCorrectAnswers'>) => {
    if (editingStructure) {
      setStructures(structures.map(s => s.id === editingStructure.id ? { ...s, ...structureData } : s));
    } else {
      const newStructure: StructureItem = {
        ...structureData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        consecutiveCorrectAnswers: 0,
      };
      setStructures([newStructure, ...structures]);
      if (selectedCategory === null) {
         setSelectedCategory(structureData.category);
      }
    }
    setIsFormOpen(false);
  };
  
  const groupedStructures = useMemo(() => {
    const groups: Record<string, StructureItem[]> = {};
    // Order is preserved from the main `structures` array to allow for manual sorting.
    for (const item of structures) {
      const category = item.category.trim() || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
    return groups;
  }, [structures]);

  const sortedCategories = useMemo(() => Object.keys(groupedStructures).sort((a, b) => a.localeCompare(b)), [groupedStructures]);
  
  const handleRenameCategory = (oldName: string, newName: string) => {
      const trimmedNewName = newName.trim();
      if (!trimmedNewName || trimmedNewName === oldName || sortedCategories.includes(trimmedNewName)) {
        // Error handling is done in the modal, this is a safeguard
        return;
      }

      setStructures(prev =>
        prev.map(item =>
          item.category === oldName ? { ...item, category: trimmedNewName } : item
        )
      );

      if (selectedCategory === oldName) {
        setSelectedCategory(trimmedNewName);
      }
      
      setRenamingCategory(null);
    };

  const selectedCategoryStructures = selectedCategory ? groupedStructures[selectedCategory] || [] : [];
  
  const structuresForQuiz = useMemo(() => {
      return selectedCategoryStructures.filter(s => s.example.trim() !== '' && s.consecutiveCorrectAnswers < MASTERY_THRESHOLD);
  }, [selectedCategoryStructures]);

  const isCategoryMastered = useMemo(() => {
    if (!selectedCategory || selectedCategoryStructures.length === 0) {
        return false;
    }
    return structuresForQuiz.length === 0;
  }, [selectedCategory, selectedCategoryStructures.length, structuresForQuiz.length]);

  const handleStartQuiz = () => {
    setIsPracticeAgainMode(isCategoryMastered);
    setIsQuizActive(true);
  };

  const handleQuizComplete = () => {
      if (isPracticeAgainMode && selectedCategory) {
          alert("Practice session complete! The category's progress will be reset so you can learn it again.");
          setStructures(prev =>
              prev.map(s =>
                  s.category === selectedCategory
                      ? { ...s, consecutiveCorrectAnswers: 0 }
                      : s
              )
          );
      }
      setIsQuizActive(false);
      setIsPracticeAgainMode(false);
  };

  const handleExitQuiz = () => {
      setIsQuizActive(false);
      setIsPracticeAgainMode(false);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItemId(id);
      e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      e.currentTarget.classList.add('dark:bg-slate-700', 'bg-slate-100');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
      e.currentTarget.classList.remove('dark:bg-slate-700', 'bg-slate-100');
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropTargetId: string) => {
      e.preventDefault();
      e.currentTarget.classList.remove('dark:bg-slate-700', 'bg-slate-100');
      if (!draggedItemId || draggedItemId === dropTargetId) {
          return;
      }

      const newStructures = [...structures];
      const draggedIndex = newStructures.findIndex(s => s.id === draggedItemId);
      const dropTargetIndex = newStructures.findIndex(s => s.id === dropTargetId);
      
      if (draggedIndex === -1 || dropTargetIndex === -1) return;

      const [draggedItem] = newStructures.splice(draggedIndex, 1);
      newStructures.splice(dropTargetIndex, 0, draggedItem);

      setStructures(newStructures);
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
      e.currentTarget.classList.remove('opacity-50');
      setDraggedItemId(null);
       document.querySelectorAll('.dark\\:bg-slate-700.bg-slate-100').forEach(el => {
          el.classList.remove('dark:bg-slate-700', 'bg-slate-100');
      });
  };

  
  if (isQuizActive && selectedCategory) {
    const quizItems = isPracticeAgainMode ? selectedCategoryStructures : structuresForQuiz;
    return (
      <StructureQuizView
        categoryName={selectedCategory}
        structures={quizItems}
        onExit={handleExitQuiz}
        onComplete={handleQuizComplete}
        setStructures={setStructures}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedCategory(null)} className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Back to categories">
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{selectedCategory}</h2>
              <p className="text-slate-500 dark:text-slate-400">{selectedCategoryStructures.length} {selectedCategoryStructures.length === 1 ? 'structure' : 'structures'}</p>
            </div>
          </div>
        ) : (
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Structure Sets</h2>
              <p className="text-slate-500 dark:text-slate-400">{structures.length} structures in {sortedCategories.length} sets</p>
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
                onClick={handleAdd}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                Add
            </button>
            {selectedCategory && (
                <button
                    onClick={handleStartQuiz}
                    disabled={!isCategoryMastered && structuresForQuiz.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <LightningBoltIcon className="h-5 w-5" />
                    {isCategoryMastered
                        ? 'Practice Again'
                        : (structuresForQuiz.length > 0 ? `Quiz (${structuresForQuiz.length})` : 'Mastered!')}
                </button>
            )}
        </div>
      </div>

      {selectedCategory === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {sortedCategories.length > 0 ? sortedCategories.map(category => {
                const categoryItems = groupedStructures[category];
                const masteredCount = categoryItems.filter(item => item.consecutiveCorrectAnswers >= MASTERY_THRESHOLD).length;
                const progress = categoryItems.length > 0 ? (masteredCount / categoryItems.length) * 100 : 0;

                return (
                    <div 
                        key={category} 
                        onClick={() => setSelectedCategory(category)} 
                        className="group relative flex flex-col bg-gradient-to-br from-[#2A374A] to-[#1E293B] p-5 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setRenamingCategory(category);
                            }}
                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            title={`Rename "${category}"`}
                            aria-label={`Rename category ${category}`}
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <div className="flex-grow">
                            <h3 className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors pr-8">{category}</h3>
                            <div className="mt-2 w-full bg-slate-600 rounded-full h-1.5">
                                <div className="bg-yellow-400 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-400 mt-4 pt-4 border-t border-slate-700">
                            <span>{categoryItems.length} thuật ngữ</span>
                            <div className="flex items-center gap-1.5">
                               <UserCircleIcon className="h-5 w-5 text-slate-500" />
                               <span className="font-semibold text-slate-300">LingoLeap</span>
                            </div>
                        </div>
                    </div>
                )
            }) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400">No structure sets yet. Click "Add Structure" to create one.</p>
                </div>
            )}
        </div>
      ) : (
        <ul className="space-y-3 pt-4">
            {selectedCategoryStructures.length > 0 ? selectedCategoryStructures.map(item => (
            <li 
              key={item.id} 
              className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow group list-none flex items-center gap-3"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
            >
                <div className="cursor-move text-slate-400 dark:text-slate-500" title="Drag to reorder">
                    <GripVerticalIcon className="h-5 w-5" />
                </div>
                <div className="flex-grow flex justify-between items-start gap-4">
                  <div className="flex-1 flex items-center gap-3">
                      {item.consecutiveCorrectAnswers >= MASTERY_THRESHOLD && (
                          <CheckBadgeIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" title="Mastered!"/>
                      )}
                      <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{item.structure}</p>
                          <blockquote className="mt-1 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                          <p className="text-slate-600 dark:text-slate-300 italic text-sm">"{item.example}"</p>
                          </blockquote>
                      </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-500 hover:text-green-500 hover:bg-green-100 dark:hover:bg-slate-700 rounded-full" title="Edit"><PencilIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
            </li>
            )) : (
                <li className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm list-none">
                    <p className="text-slate-500 dark:text-slate-400">No structures in this set yet.</p>
                </li>
            )}
        </ul>
      )}

      {isFormOpen && <StructureForm currentStructure={editingStructure} onSave={handleSave} onClose={() => setIsFormOpen(false)} initialCategory={selectedCategory} />}
      {renamingCategory && (
        <RenameCategoryModal
          oldName={renamingCategory}
          allCategories={sortedCategories}
          onSave={handleRenameCategory}
          onClose={() => setRenamingCategory(null)}
        />
      )}
    </div>
  );
}

interface StructureFormProps {
  currentStructure: StructureItem | null;
  onSave: (structureData: Omit<StructureItem, 'id' | 'createdAt' | 'consecutiveCorrectAnswers'>) => void;
  onClose: () => void;
  initialCategory?: string | null;
}

const StructureForm: React.FC<StructureFormProps> = ({ currentStructure, onSave, onClose, initialCategory }) => {
  const [structure, setStructure] = useState(currentStructure?.structure || '');
  const [category, setCategory] = useState(currentStructure?.category || initialCategory || '');
  const [example, setExample] = useState(currentStructure?.example || '');
  
  const formRef = useRef<HTMLFormElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const exampleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (structure && category && example) {
      onSave({ structure, category, example });
    }
  };
  
  const handleStructureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      categoryInputRef.current?.focus();
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      exampleTextareaRef.current?.focus();
    }
  };

  const handleExampleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">{currentStructure ? 'Edit Structure' : 'Add New Structure'}</h3>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="structure" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Structure / Phrase</label>
            <input 
                type="text" 
                id="structure" 
                value={structure} 
                onChange={e => setStructure(e.target.value)} 
                placeholder="e.g., as a matter of fact" 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required 
                autoFocus
                onKeyDown={handleStructureKeyDown}
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category (Set Name)</label>
            <input 
                type="text" 
                id="category" 
                ref={categoryInputRef}
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="e.g., Agree-Disagree Essays" 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required 
                onKeyDown={handleCategoryKeyDown}
            />
          </div>
          <div>
            <label htmlFor="example" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Example Sentence</label>
            <textarea 
                id="example" 
                ref={exampleTextareaRef}
                value={example} 
                onChange={e => setExample(e.target.value)} 
                rows={3} 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                required
                onKeyDown={handleExampleKeyDown}
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

interface RenameCategoryModalProps {
    oldName: string;
    allCategories: string[];
    onSave: (oldName: string, newName: string) => void;
    onClose: () => void;
}

const RenameCategoryModal: React.FC<RenameCategoryModalProps> = ({ oldName, allCategories, onSave, onClose }) => {
    const [newName, setNewName] = useState(oldName);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedNewName = newName.trim();
        if (!trimmedNewName) {
            setError('Category name cannot be empty.');
            return;
        }
        if (trimmedNewName !== oldName && allCategories.includes(trimmedNewName)) {
            setError('This category name already exists.');
            return;
        }
        onSave(oldName, trimmedNewName);
    };

    const isInvalid = !newName.trim() || newName.trim() === oldName;

    return (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Rename Category</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="newName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Category Name</label>
                        <input
                            type="text"
                            id="newName"
                            value={newName}
                            onChange={e => {
                                setNewName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                            required
                            autoFocus
                        />
                        {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-slate-500">Cancel</button>
                        <button type="submit" disabled={isInvalid} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50 disabled:cursor-not-allowed">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const DiffViewer: React.FC<{ userInput: string; correctAnswer: string }> = ({ userInput, correctAnswer }) => {
    const userWords = userInput.trim().split(/\s+/).filter(Boolean);
    const correctWords = correctAnswer.trim().split(/\s+/).filter(Boolean);

    const dp = Array(userWords.length + 1).fill(null).map(() => Array(correctWords.length + 1).fill(0));

    for (let i = 1; i <= userWords.length; i++) {
        for (let j = 1; j <= correctWords.length; j++) {
            if (userWords[i - 1].toLowerCase() === correctWords[j - 1].toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff: { value: string; type: 'common' | 'removed' | 'added' }[] = [];
    let i = userWords.length;
    let j = correctWords.length;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && userWords[i - 1].toLowerCase() === correctWords[j - 1].toLowerCase()) {
            diff.unshift({ value: userWords[i - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ value: correctWords[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ value: userWords[i - 1], type: 'removed' });
            i--;
        } else {
            break;
        }
    }

    return (
        <p className="font-mono text-base leading-relaxed break-words">
            {diff.map((part, index) => {
                if (part.type === 'common') {
                    return <span key={index}>{part.value} </span>;
                }
                if (part.type === 'removed') { // Word user added incorrectly
                    return <strong key={index} className="font-bold text-red-400 bg-red-900/50 rounded px-1 line-through decoration-red-400">{part.value}</strong>;
                }
                if (part.type === 'added') { // Word user missed
                    return <strong key={index} className="font-bold text-green-400 bg-green-900/50 rounded px-1 underline decoration-green-400">{part.value}</strong>;
                }
                return ' ';
            })}
        </p>
    );
};


const StructureQuizView: React.FC<{
  categoryName: string;
  structures: StructureItem[];
  onExit: () => void;
  onComplete: () => void;
  setStructures: React.Dispatch<React.SetStateAction<StructureItem[]>>;
}> = ({ categoryName, structures, onExit, onComplete, setStructures }) => {
    const [quizQueue] = useState(() => [...structures].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect' | 'skipped'>('idle');
    const [lastIncorrectAnswer, setLastIncorrectAnswer] = useState('');
    const [isFirstAttempt, setIsFirstAttempt] = useState(true);

    const currentQuestion = quizQueue[currentIndex];
    
    const moveToNext = useCallback(() => {
        if (currentIndex + 1 < quizQueue.length) {
            setFeedback('idle');
            setUserInput('');
            setLastIncorrectAnswer('');
            setIsFirstAttempt(true);
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of quiz session
            setTimeout(onComplete, 1000);
        }
    }, [currentIndex, quizQueue.length, onComplete]);
    
    const handleCheck = useCallback((e?: React.FormEvent, skip = false) => {
        if (e) e.preventDefault();
        if (feedback !== 'idle' || !currentQuestion) return;

        const updateMastery = (isCorrect: boolean) => {
             setStructures(prevStructures => prevStructures.map(s => {
                if (s.id === currentQuestion.id) {
                    const newCount = isCorrect ? s.consecutiveCorrectAnswers + 1 : 0;
                    return { ...s, consecutiveCorrectAnswers: newCount };
                }
                return s;
            }));
        };

        if (skip) {
            setFeedback('skipped');
            if(isFirstAttempt) {
                setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
            }
            updateMastery(false); // Skipping resets mastery
            setTimeout(moveToNext, 3000);
            return;
        }

        const isCorrect = userInput.trim().toLowerCase() === currentQuestion.example.trim().toLowerCase();

        if (isCorrect) {
            setFeedback('correct');
            if (isFirstAttempt) {
                setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
                updateMastery(true); // Increment mastery on first-try correct
            }
            // If it's a correct answer after a mistake, we don't update mastery.
            // We just let them pass.
            setLastIncorrectAnswer('');
            setTimeout(moveToNext, 1500);
        } else {
            setFeedback('incorrect');
            if (isFirstAttempt) {
                setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
            }
            updateMastery(false); // Any mistake resets mastery
            setLastIncorrectAnswer(userInput);
            setUserInput('');
            setIsFirstAttempt(false);
        }
    }, [feedback, userInput, currentQuestion, moveToNext, setStructures, isFirstAttempt]);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter, but allow Shift+Enter for new lines
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          // Mimic button's disabled state before calling handleCheck
          if (feedback === 'idle' && userInput.trim()) {
            handleCheck();
          }
        }
    };

    if (!currentQuestion) {
        return (
             <div className="fixed inset-0 bg-[#0B1120] z-40 flex items-center justify-center text-white">
                <div className="text-center p-8 bg-[#1E293B] rounded-lg">
                    <p className="text-xl font-bold">Great job! All items in this set are mastered.</p>
                    <button onClick={onExit} className="mt-6 px-6 py-2 bg-sky-500 rounded-lg font-semibold">Go Back</button>
                </div>
            </div>
        )
    }

    const remaining = quizQueue.length - (stats.correct + stats.incorrect);
    const statBars = [
        { label: 'CÒN LẠI', count: remaining, color: 'bg-blue-500' },
        { label: 'SAI', count: stats.incorrect, color: 'bg-rose-500' },
        { label: 'ĐÚNG', count: stats.correct, color: 'bg-emerald-500' },
    ];
    
    return (
        <div className="fixed inset-0 bg-[#0B1120] z-40 flex font-sans">
            {/* Sidebar */}
            <div className="w-full max-w-xs bg-[#111827] text-slate-300 p-6 flex flex-col">
                <button onClick={onExit} className="flex items-center gap-2 text-lg font-bold hover:text-white transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                    Trở về
                </button>
                
                <div className="my-10 flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                    <PencilWriteIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
                    <div>
                        <span className="font-semibold text-lg text-white">Viết</span>
                        <p className="text-sm text-slate-400">Điền câu ví dụ</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {statBars.map(bar => (
                        <div key={bar.label}>
                            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1 tracking-wider">
                                <span>{bar.label}</span>
                                <span>{bar.count}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div
                                    className={`${bar.color} h-1.5 rounded-full transition-all duration-500`}
                                    style={{ width: `${quizQueue.length > 0 ? (bar.count / quizQueue.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-auto text-center text-xs text-slate-500">
                    <p>{categoryName}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#1E293B] text-white p-8 lg:p-16 flex flex-col">
                <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-lg font-semibold text-slate-400">Câu {currentIndex + 1}</span>
                        <button onClick={() => handleCheck(undefined, true)} className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors">Không biết</button>
                    </div>

                    <div className="flex-grow flex flex-col justify-center">
                        <p className="text-slate-300 text-lg mb-4">Hoàn thành câu ví dụ cho cấu trúc:</p>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-12 text-center">{currentQuestion.structure}</h2>

                        <form onSubmit={handleCheck}>
                             <div className="relative">
                                <textarea
                                    value={userInput}
                                    onChange={e => {
                                        setUserInput(e.target.value);
                                        if (feedback !== 'idle') {
                                            setFeedback('idle');
                                            setLastIncorrectAnswer('');
                                            // Don't reset isFirstAttempt here
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder=" "
                                    rows={2}
                                    disabled={feedback === 'correct' || feedback === 'skipped'}
                                    className="block w-full px-1 pt-2.5 pb-2 bg-transparent border-0 border-b-2 border-yellow-400 appearance-none text-white text-lg focus:outline-none focus:ring-0 focus:border-yellow-300 peer disabled:opacity-50"
                                    autoFocus
                                />
                                <label className="absolute text-lg text-slate-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                                    NHẬP ĐÁP ÁN
                                </label>
                            </div>
                            
                            <div className="min-h-[6rem] mt-4 text-sm">
                                {feedback === 'incorrect' && lastIncorrectAnswer && (
                                    <div className="p-3 bg-slate-800/50 rounded-lg animate-fade-in">
                                        <p className="font-semibold text-red-400">Không chính xác. Đây là phần so sánh:</p>
                                        <div className="mt-2 space-y-2">
                                            <DiffViewer userInput={lastIncorrectAnswer} correctAnswer={currentQuestion.example} />
                                        </div>
                                         <p className="mt-3 text-xs text-slate-400">Hãy thử lại!</p>
                                    </div>
                                )}
                                {feedback === 'skipped' && (
                                    <div className="text-red-400 text-center animate-fade-in">
                                        <p>Đáp án đúng:</p>
                                        <p className="font-bold text-base">{currentQuestion.example}</p>
                                    </div>
                                )}
                                {feedback === 'correct' && <p className="font-bold text-green-400 text-center text-lg animate-fade-in">Chính xác!</p>}
                            </div>

                            <div className="text-right">
                                <button
                                    type="submit"
                                    disabled={feedback !== 'idle' || !userInput.trim()}
                                    className="mt-4 px-10 py-3 bg-indigo-500 rounded-lg font-semibold hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    Trả lời
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}