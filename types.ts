
export interface VocabularyWord {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  srsLevel: number;
  nextReviewDate: string; // ISO string
  createdAt: string; // ISO string
}

export interface StructureItem {
  id: string;
  structure: string;
  category: string;
  example: string;
  createdAt: string; // ISO string
  consecutiveCorrectAnswers: number;
}

export interface GrammarFeedback {
  isCorrect: boolean;
  feedback: string;
  correctedSentence: string;
}

export enum AppView {
  VOCABULARY = 'VOCABULARY',
  STRUCTURES = 'STRUCTURES',
}