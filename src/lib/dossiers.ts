import { db } from './db';
import type { DossierPayload, ResearchDossier } from '@/types';

const generateId = () => crypto.randomUUID();
const localUserId = 'local-user';

export const dossierStore = {
  async getAll(): Promise<ResearchDossier[]> {
    return await db.researchDossiers.orderBy('updatedAt').reverse().toArray();
  },

  async getById(id: string): Promise<ResearchDossier | undefined> {
    return await db.researchDossiers.get(id);
  },

  async create(payload: DossierPayload): Promise<ResearchDossier> {
    const dossier: ResearchDossier = {
      id: generateId(),
      userId: localUserId,
      topic: payload.topic,
      focus: payload.focus,
      summary: payload.summary,
      keyInsights: payload.keyInsights,
      actionItems: payload.actionItems,
      references: payload.references,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.researchDossiers.add(dossier);
    return dossier;
  },

  async update(id: string, data: Partial<ResearchDossier>): Promise<ResearchDossier> {
    await db.researchDossiers.update(id, { ...data, updatedAt: new Date() });
    const updated = await db.researchDossiers.get(id);
    if (!updated) {
      throw new Error('Dossier not found');
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.researchDossiers.delete(id);
  },
};
