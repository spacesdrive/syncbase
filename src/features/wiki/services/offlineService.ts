import Dexie, { type Table } from 'dexie'
import type { WikiDraft } from '../types/wiki'

class WikiDb extends Dexie {
  drafts!: Table<WikiDraft, string>

  constructor() {
    super('teamflow-wiki')
    this.version(1).stores({ drafts: 'pageId, savedAt' })
  }
}

const wikiDb = new WikiDb()

export async function saveDraft(draft: WikiDraft): Promise<void> {
  await wikiDb.drafts.put(draft)
}

export async function getDraft(pageId: string): Promise<WikiDraft | undefined> {
  return wikiDb.drafts.get(pageId)
}

export async function deleteDraft(pageId: string): Promise<void> {
  await wikiDb.drafts.delete(pageId)
}

export async function getAllDrafts(): Promise<WikiDraft[]> {
  return wikiDb.drafts.toArray()
}

export async function clearOldDrafts(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const cutoff = Date.now() - maxAgeMs
  await wikiDb.drafts.where('savedAt').below(cutoff).delete()
}
