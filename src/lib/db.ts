import Dexie, { type EntityTable } from 'dexie';
import type { Task, Event, Note, NoteAttachment, Transaction, UserSettings, ResearchDossier } from '@/types';

// IndexedDB database using Dexie
class LifeOSDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  events!: EntityTable<Event, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  noteAttachments!: EntityTable<NoteAttachment, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  userSettings!: EntityTable<UserSettings, 'userId'>;
  researchDossiers!: EntityTable<ResearchDossier, 'id'>;

  constructor() {
    super('LifeOSDB');
    this.version(1).stores({
      tasks: 'id, userId, dueDate, isCompleted, createdAt',
      events: 'id, userId, startTime, googleEventId, createdAt',
      notes: 'id, userId, isPinned, updatedAt',
      noteAttachments: 'id, noteId, type',
      transactions: 'id, userId, type, date, category',
      userSettings: 'userId',
    });

    this.version(2).stores({
      tasks: 'id, userId, dueDate, isCompleted, createdAt',
      events: 'id, userId, startTime, googleEventId, createdAt',
      notes: 'id, userId, isPinned, updatedAt',
      noteAttachments: 'id, noteId, type',
      transactions: 'id, userId, type, date, category',
      userSettings: 'userId',
      researchDossiers: 'id, topic, updatedAt',
    });
  }
}

export const db = new LifeOSDatabase();
