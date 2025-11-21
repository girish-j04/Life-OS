/**
 * Supabase Storage Service
 *
 * Implements the same IStorageService interface as LocalStorageService,
 * but stores data in Supabase instead of IndexedDB.
 */

import { supabase } from './supabase';
import type {
  Task,
  Event,
  Note,
  Transaction,
  UserSettings,
  ParsedTask,
  ParsedEvent,
  ParsedTransaction,
  ParsedNote,
} from '@/types';
import type { IStorageService } from './storage';
import { deleteCapturePhoto } from './file-storage';

export class SupabaseStorageService implements IStorageService {
  private generateId = () => crypto.randomUUID();

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  tasks = {
    getAll: async (): Promise<Task[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapTaskFromDB);
    },

    getById: async (id: string): Promise<Task | undefined> => {
      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }
      return this.mapTaskFromDB(data);
    },

    create: async (taskData: ParsedTask): Promise<Task> => {
      const userId = await this.getUserId();
      const task = {
        id: this.generateId(),
        user_id: userId,
        title: taskData.title,
        description: taskData.description || null,
        due_date: taskData.dueDate?.toISOString() || null,
        priority: taskData.priority || 'medium',
        is_completed: false,
        is_recurring: taskData.isRecurring || false,
        recurrence_rule: taskData.recurrenceRule || null,
        completed_at: null,
        photo_url: taskData.photoUrl || null,
      };

      const { data, error } = await supabase.from('tasks').insert(task).select().single();

      if (error) throw error;
      return this.mapTaskFromDB(data);
    },

    update: async (id: string, updates: Partial<Task>): Promise<Task> => {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString();
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
      if (updates.recurrenceRule !== undefined) dbUpdates.recurrence_rule = updates.recurrenceRule;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt?.toISOString();
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;

      const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();

      if (error) throw error;
      return this.mapTaskFromDB(data);
    },

    delete: async (id: string): Promise<void> => {
      const existing = await this.getTaskPhoto(id);
      if (existing) {
        await this.safeDeletePhoto(existing.photo_url);
      }

      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
  };

  events = {
    getAll: async (): Promise<Event[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapEventFromDB);
    },

    getById: async (id: string): Promise<Event | undefined> => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
      }
      return this.mapEventFromDB(data);
    },

    getByDateRange: async (start: Date, end: Date): Promise<Event[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapEventFromDB);
    },

    create: async (eventData: ParsedEvent): Promise<Event> => {
      const userId = await this.getUserId();
      const event = {
        id: this.generateId(),
        user_id: userId,
        title: eventData.title,
        description: eventData.description || null,
        start_time: eventData.startTime.toISOString(),
        end_time: eventData.endTime.toISOString(),
        location: eventData.location || null,
        is_recurring: eventData.isRecurring || false,
        recurrence_rule: eventData.recurrenceRule || null,
        google_event_id: null,
        color: '#cba6f7',
      };

      const { data, error } = await supabase.from('events').insert(event).select().single();

      if (error) throw error;
      return this.mapEventFromDB(data);
    },

    update: async (id: string, updates: Partial<Event>): Promise<Event> => {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime.toISOString();
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime.toISOString();
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
      if (updates.recurrenceRule !== undefined) dbUpdates.recurrence_rule = updates.recurrenceRule;
      if (updates.googleEventId !== undefined) dbUpdates.google_event_id = updates.googleEventId;
      if (updates.color !== undefined) dbUpdates.color = updates.color;

      const { data, error } = await supabase.from('events').update(dbUpdates).eq('id', id).select().single();

      if (error) throw error;
      return this.mapEventFromDB(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
  };

  notes = {
    getAll: async (): Promise<Note[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapNoteFromDB);
    },

    getById: async (id: string): Promise<Note | undefined> => {
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
      }
      return this.mapNoteFromDB(data);
    },

    create: async (noteData: ParsedNote): Promise<Note> => {
      const userId = await this.getUserId();
      const mergeInfo = this.extractMergeInfo(noteData);
      if (mergeInfo) {
        const { data: existingNotes, error: existingError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .ilike('title', mergeInfo.bucketTitle)
          .limit(1);
        if (existingError) throw existingError;
        const existingNote = existingNotes?.[0];

        const escapedEntry = this.escapeHtml(mergeInfo.entry);
        const entryMarkup = `<div>• ${escapedEntry}</div>`;

        if (existingNote) {
          const baseContent =
            typeof existingNote.content === 'string'
              ? existingNote.content
              : JSON.stringify(existingNote.content);
          const newContent = baseContent?.trim()
            ? `${baseContent}${baseContent.trim().endsWith('<br />') ? '' : '<br />'}${entryMarkup}`
            : entryMarkup;

          const { data: updated, error: updateError } = await supabase
            .from('notes')
            .update({ content: newContent })
            .eq('id', existingNote.id)
            .select()
            .single();
          if (updateError) throw updateError;
          return this.mapNoteFromDB(updated);
        }

        noteData = {
          ...noteData,
          title: mergeInfo.bucketTitle,
          content: entryMarkup,
        };
      }

      const note = {
        id: this.generateId(),
        user_id: userId,
        title: noteData.title || noteData.content.substring(0, 50),
        content: noteData.content,
        tags: noteData.tags || [],
        is_pinned: false,
        photo_url: noteData.photoUrl || null,
      };

      const { data, error } = await supabase.from('notes').insert(note).select().single();

      if (error) throw error;
      return this.mapNoteFromDB(data);
    },

    update: async (id: string, updates: Partial<Note>): Promise<Note> => {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;

      const { data, error } = await supabase.from('notes').update(dbUpdates).eq('id', id).select().single();

      if (error) throw error;
      return this.mapNoteFromDB(data);
    },

    delete: async (id: string): Promise<void> => {
      const existing = await this.getNotePhoto(id);
      if (existing) {
        await this.safeDeletePhoto(existing.photo_url);
      }

      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
  };

  transactions = {
    getAll: async (): Promise<Transaction[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapTransactionFromDB);
    },

    getById: async (id: string): Promise<Transaction | undefined> => {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
      }
      return this.mapTransactionFromDB(data);
    },

    getByDateRange: async (start: Date, end: Date): Promise<Transaction[]> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapTransactionFromDB);
    },

    create: async (transactionData: ParsedTransaction): Promise<Transaction> => {
      const userId = await this.getUserId();

      // Use current time if no date provided, or if the parsed date has no time component
      let transactionDate = new Date();
      if (transactionData.date) {
        const parsedDate = new Date(transactionData.date);
        // Check if the date has a time component (not midnight UTC)
        // If it's exactly midnight UTC, it's likely just a date without time
        const hasTime = parsedDate.getUTCHours() !== 0 ||
                       parsedDate.getUTCMinutes() !== 0 ||
                       parsedDate.getUTCSeconds() !== 0;

        if (hasTime) {
          transactionDate = parsedDate;
        } else {
          // Use the current time but with the specified date
          const now = new Date();
          transactionDate = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          );
        }
      }

      const transaction = {
        id: this.generateId(),
        user_id: userId,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        description: transactionData.description || null,
        date: transactionDate.toISOString(),
        notes: null,
        photo_url: transactionData.photoUrl || null,
      };

      const { data, error } = await supabase.from('transactions').insert(transaction).select().single();

      if (error) throw error;
      return this.mapTransactionFromDB(data);
    },

    update: async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
      const dbUpdates: any = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString();
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;

      const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).select().single();

      if (error) throw error;
      return this.mapTransactionFromDB(data);
    },

    delete: async (id: string): Promise<void> => {
      const existing = await this.getTransactionPhoto(id);
      if (existing) {
        await this.safeDeletePhoto(existing.photo_url);
      }

      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
  };

  settings = {
    get: async (): Promise<UserSettings | undefined> => {
      const userId = await this.getUserId();
      const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();

      if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
      }
      return this.mapSettingsFromDB(data);
    },

    update: async (updates: Partial<UserSettings>): Promise<UserSettings> => {
      const userId = await this.getUserId();
      const dbUpdates: any = {};
      if (updates.monthlyBudget !== undefined) dbUpdates.monthly_budget = updates.monthlyBudget;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.defaultCalendarId !== undefined) dbUpdates.default_calendar_id = updates.defaultCalendarId;
      if (updates.notificationPreferences !== undefined) dbUpdates.notification_preferences = updates.notificationPreferences;

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...dbUpdates })
        .select()
        .single();

      if (error) throw error;
      return this.mapSettingsFromDB(data);
    },
  };

  // Mapping functions to convert snake_case DB columns to camelCase
  private mapTaskFromDB(data: any): Task {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      priority: data.priority,
      isCompleted: data.is_completed,
      isRecurring: data.is_recurring,
      recurrenceRule: data.recurrence_rule,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      updatedAt: new Date(data.updated_at),
      photoUrl: data.photo_url,
    };
  }

  private mapEventFromDB(data: any): Event {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      location: data.location,
      isRecurring: data.is_recurring,
      recurrenceRule: data.recurrence_rule,
      googleEventId: data.google_event_id,
      color: data.color,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapNoteFromDB(data: any): Note {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      isPinned: data.is_pinned,
      photoUrl: data.photo_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapTransactionFromDB(data: any): Transaction {
    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      photoUrl: data.photo_url,
    };
  }

  private mapSettingsFromDB(data: any): UserSettings {
    return {
      userId: data.user_id,
      monthlyBudget: data.monthly_budget,
      theme: data.theme,
      defaultCalendarId: data.default_calendar_id,
      notificationPreferences: data.notification_preferences,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private async safeDeletePhoto(publicUrl?: string | null) {
    if (!publicUrl) return;
    try {
      await deleteCapturePhoto(publicUrl);
    } catch (error) {
      console.error('Failed to delete capture photo', error);
    }
  }

  private async getTaskPhoto(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('photo_url')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  private async getNotePhoto(id: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('photo_url')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  private async getTransactionPhoto(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('photo_url')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  private escapeHtml(text: string) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private extractMergeInfo(note: ParsedNote) {
    const source = (note.title || note.content || '').trim();
    const match = source.match(/^(.+?)(?::|-)\s*(.+)$/);
    if (!match) return null;
    const bucketTitle = match[1].trim();
    const entry = match[2].trim();
    if (!bucketTitle || !entry) return null;
    return { bucketTitle, entry };
  }
}
