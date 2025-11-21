/**
 * Storage Service Layer
 *
 * This abstraction layer provides a unified API for data operations.
 * Currently uses IndexedDB (Dexie), but designed to be easily swapped
 * with Supabase by implementing the same interface.
 *
 * To migrate to Supabase:
 * 1. Install @supabase/supabase-js
 * 2. Create SupabaseStorageService implementing IStorageService
 * 3. Replace `export const storage = new LocalStorageService()`
 *    with `export const storage = new SupabaseStorageService()`
 */

import { db } from './db';
import type {
  Task,
  Event,
  Note,
  // NoteAttachment, // Not currently used but may be used in future
  Transaction,
  UserSettings,
  ParsedTask,
  ParsedEvent,
  ParsedTransaction,
  ParsedNote,
} from '@/types';

// Storage interface that both IndexedDB and Supabase will implement
export interface IStorageService {
  tasks: {
    getAll: () => Promise<Task[]>;
    getById: (id: string) => Promise<Task | undefined>;
    create: (data: ParsedTask) => Promise<Task>;
    update: (id: string, data: Partial<Task>) => Promise<Task>;
    delete: (id: string) => Promise<void>;
  };
  events: {
    getAll: () => Promise<Event[]>;
    getById: (id: string) => Promise<Event | undefined>;
    getByDateRange: (start: Date, end: Date) => Promise<Event[]>;
    create: (data: ParsedEvent) => Promise<Event>;
    update: (id: string, data: Partial<Event>) => Promise<Event>;
    delete: (id: string) => Promise<void>;
  };
  notes: {
    getAll: () => Promise<Note[]>;
    getById: (id: string) => Promise<Note | undefined>;
    create: (data: ParsedNote) => Promise<Note>;
    update: (id: string, data: Partial<Note>) => Promise<Note>;
    delete: (id: string) => Promise<void>;
  };
  transactions: {
    getAll: () => Promise<Transaction[]>;
    getById: (id: string) => Promise<Transaction | undefined>;
    getByDateRange: (start: Date, end: Date) => Promise<Transaction[]>;
    create: (data: ParsedTransaction) => Promise<Transaction>;
    update: (id: string, data: Partial<Transaction>) => Promise<Transaction>;
    delete: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<UserSettings | undefined>;
    update: (data: Partial<UserSettings>) => Promise<UserSettings>;
  };
}

// IndexedDB implementation
class LocalStorageService implements IStorageService {
  private generateId = () => crypto.randomUUID();
  private readonly defaultUserId = 'local-user'; // For IndexedDB, before auth is implemented

  tasks = {
    getAll: async (): Promise<Task[]> => {
      return await db.tasks.orderBy('createdAt').reverse().toArray();
    },

    getById: async (id: string): Promise<Task | undefined> => {
      return await db.tasks.get(id);
    },

    create: async (data: ParsedTask): Promise<Task> => {
      const task: Task = {
        id: this.generateId(),
        userId: this.defaultUserId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority || 'medium',
        isCompleted: false,
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.recurrenceRule,
        photoUrl: data.photoUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.tasks.add(task);
      return task;
    },

    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      await db.tasks.update(id, { ...data, updatedAt: new Date() });
      const updated = await db.tasks.get(id);
      if (!updated) throw new Error('Task not found');
      return updated;
    },

    delete: async (id: string): Promise<void> => {
      await db.tasks.delete(id);
    },
  };

  events = {
    getAll: async (): Promise<Event[]> => {
      return await db.events.orderBy('startTime').toArray();
    },

    getById: async (id: string): Promise<Event | undefined> => {
      return await db.events.get(id);
    },

    getByDateRange: async (start: Date, end: Date): Promise<Event[]> => {
      return await db.events
        .where('startTime')
        .between(start, end, true, true)
        .toArray();
    },

    create: async (data: ParsedEvent): Promise<Event> => {
      const event: Event = {
        id: this.generateId(),
        userId: this.defaultUserId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.recurrenceRule,
        color: '#cba6f7', // Default mauve
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.events.add(event);
      return event;
    },

    update: async (id: string, data: Partial<Event>): Promise<Event> => {
      await db.events.update(id, { ...data, updatedAt: new Date() });
      const updated = await db.events.get(id);
      if (!updated) throw new Error('Event not found');
      return updated;
    },

    delete: async (id: string): Promise<void> => {
      await db.events.delete(id);
    },
  };

  notes = {
    getAll: async (): Promise<Note[]> => {
      return await db.notes.orderBy('updatedAt').reverse().toArray();
    },

    getById: async (id: string): Promise<Note | undefined> => {
      return await db.notes.get(id);
    },

    create: async (data: ParsedNote): Promise<Note> => {
      const mergeInfo = this.extractMergeInfo(data);
      if (mergeInfo) {
        const existingNotes = await db.notes.toArray();
        const existing = existingNotes.find(
          (n) => n.title?.trim().toLowerCase() === mergeInfo.bucketTitle.toLowerCase()
        );

        const escapedEntry = this.escapeHtml(mergeInfo.entry);
        const entryMarkup = `<div>• ${escapedEntry}</div>`;

        if (existing) {
          const baseContent =
            typeof existing.content === 'string'
              ? existing.content
              : JSON.stringify(existing.content);
          const newContent = baseContent?.trim()
            ? `${baseContent}${baseContent.trim().endsWith('<br />') ? '' : '<br />'}${entryMarkup}`
            : entryMarkup;

          await db.notes.update(existing.id, {
            content: newContent,
            updatedAt: new Date(),
          });
          const updated = await db.notes.get(existing.id);
          if (!updated) throw new Error('Note not found after merge');
          return updated;
        }

        // Create a starter list note when none exists yet
        data = {
          ...data,
          title: mergeInfo.bucketTitle,
          content: entryMarkup,
        };
      }

      const note: Note = {
        id: this.generateId(),
        userId: this.defaultUserId,
        title: data.title || data.content.substring(0, 50),
        content: data.content,
        tags: data.tags || [],
        isPinned: false,
        photoUrl: data.photoUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.notes.add(note);
      return note;
    },

    update: async (id: string, data: Partial<Note>): Promise<Note> => {
      await db.notes.update(id, { ...data, updatedAt: new Date() });
      const updated = await db.notes.get(id);
      if (!updated) throw new Error('Note not found');
      return updated;
    },

    delete: async (id: string): Promise<void> => {
      await db.notes.delete(id);
      // Also delete attachments
      await db.noteAttachments.where('noteId').equals(id).delete();
    },
  };

  transactions = {
    getAll: async (): Promise<Transaction[]> => {
      return await db.transactions.orderBy('date').reverse().toArray();
    },

    getById: async (id: string): Promise<Transaction | undefined> => {
      return await db.transactions.get(id);
    },

    getByDateRange: async (start: Date, end: Date): Promise<Transaction[]> => {
      return await db.transactions
        .where('date')
        .between(start, end, true, true)
        .reverse()
        .toArray();
    },

    create: async (data: ParsedTransaction): Promise<Transaction> => {
      const transaction: Transaction = {
        id: this.generateId(),
        userId: this.defaultUserId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date || new Date(),
        photoUrl: data.photoUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.transactions.add(transaction);
      return transaction;
    },

    update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
      await db.transactions.update(id, { ...data, updatedAt: new Date() });
      const updated = await db.transactions.get(id);
      if (!updated) throw new Error('Transaction not found');
      return updated;
    },

    delete: async (id: string): Promise<void> => {
      await db.transactions.delete(id);
    },
  };

  private escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  private extractMergeInfo(note: ParsedNote) {
    const source = (note.title || note.content || '').trim();
    const match = source.match(/^(.+?)(?::|-)\s*(.+)$/);
    if (!match) return null;
    const bucketTitle = match[1].trim();
    const entry = match[2].trim();
    if (!bucketTitle || !entry) return null;
    return { bucketTitle, entry };
  }

  settings = {
    get: async (): Promise<UserSettings | undefined> => {
      return await db.userSettings.get(this.defaultUserId);
    },

    update: async (data: Partial<UserSettings>): Promise<UserSettings> => {
      const existing = await db.userSettings.get(this.defaultUserId);

      if (existing) {
        await db.userSettings.update(this.defaultUserId, {
          ...data,
          updatedAt: new Date(),
        });
        const updated = await db.userSettings.get(this.defaultUserId);
        if (!updated) throw new Error('Settings not found');
        return updated;
      } else {
        const settings: UserSettings = {
          userId: this.defaultUserId,
          theme: 'dark',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        await db.userSettings.add(settings);
        return settings;
      }
    },
  };
}

import { SupabaseStorageService } from './supabase-storage';

// Export singleton instance
// Switched to Supabase for cloud storage
export const storage = new SupabaseStorageService();

// Keep LocalStorageService available for offline fallback if needed
export { LocalStorageService };
