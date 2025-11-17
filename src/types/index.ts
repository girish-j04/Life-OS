// Core data types
export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  photoUrl?: string | null;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  googleEventId?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  userId?: string;
  title: string;
  content: any; // Tiptap JSON content
  tags: string[];
  isPinned: boolean;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  type: 'image' | 'link';
  url: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description?: string;
  date: Date;
  notes?: string;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  monthlyBudget?: number;
  theme: 'dark' | 'light';
  defaultCalendarId?: string;
  notificationPreferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// AI parsing types
export type CaptureType = 'task' | 'event' | 'expense' | 'income' | 'note';

export interface ParsedCapture {
  type: CaptureType;
  data: ParsedTask | ParsedEvent | ParsedTransaction | ParsedNote;
  confidence?: number;
}

export interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  recurrenceRule?: string;
  photoUrl?: string | null;
}

export interface ParsedEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface ParsedTransaction {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description?: string;
  date?: Date;
  photoUrl?: string | null;
}

export interface ParsedNote {
  title?: string;
  content: string;
  tags?: string[];
  photoUrl?: string | null;
}

export interface DossierReference {
  title: string;
  url: string;
  note?: string;
}

export interface ResearchDossier {
  id: string;
  userId?: string;
  topic: string;
  focus: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  references: DossierReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DossierPayload {
  topic: string;
  focus: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  references: DossierReference[];
}

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Health',
  'Work',
  'Subscriptions',
  'Other',
] as const;

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
