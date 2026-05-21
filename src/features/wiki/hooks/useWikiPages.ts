import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../lib/api'
import { useTeam } from '../../../contexts/TeamContext'
import { useWikiStore } from '../stores/wikiStore'
import { saveDraft, deleteDraft } from '../services/offlineService'
import toast from 'react-hot-toast'
import type { WikiPage } from '../types/wiki'

export function useWikiPages() {
  const { team } = useTeam()
  const navigate = useNavigate()
  const { pages, loading, setPages, setLoading, upsertPage, removePage } = useWikiStore()

  const loadPages = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const { pages: data } = await api.getWikiPages(team.id)
      setPages(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [team?.id, setPages, setLoading])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  async function createPage(title = 'Untitled', parentId?: string): Promise<WikiPage | null> {
    if (!team) return null
    try {
      const { page } = await api.createWikiPage(team.id, { title, parent_id: parentId ?? null })
      upsertPage(page)
      navigate(`/wiki/${page.id}`)
      return page
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }

  async function updatePage(pageId: string, updates: Partial<WikiPage>): Promise<void> {
    try {
      const { page } = await api.updateWikiPage(pageId, updates)
      upsertPage(page)
      await deleteDraft(pageId)
    } catch (err: any) {
      toast.error('Failed to save — draft kept locally')
    }
  }

  async function savePage(pageId: string, title: string, contentJson: any[], plainText: string): Promise<void> {
    if (!team) return
    const page = pages.find((p) => p.id === pageId)
    try {
      const { page: updated } = await api.updateWikiPage(pageId, {
        title,
        content: plainText,
        content_json: contentJson,
      })
      upsertPage(updated)
      await deleteDraft(pageId)

      // Persist history snapshot (fire-and-forget)
      api.saveWikiPageHistory(team.id, pageId, title, plainText, contentJson).catch(() => {})

      // Parse [[Page Title]] wiki links and update backlinks
      const linkedTitles = [...plainText.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1])
      if (linkedTitles.length > 0) {
        const linkedIds = pages
          .filter((p) => linkedTitles.includes(p.title))
          .map((p) => p.id)
          .filter((id) => id !== pageId)
        api.setWikiBacklinks(team.id, pageId, linkedIds).catch(() => {})
      }
    } catch {
      // Save as offline draft when server is unavailable
      await saveDraft({ pageId, title, content_json: contentJson, savedAt: Date.now() })
    }
  }

  async function deletePage(pageId: string): Promise<void> {
    if (!confirm('Delete this page? This cannot be undone.')) return
    removePage(pageId)
    try {
      await api.deleteWikiPage(pageId)
      await deleteDraft(pageId)
      toast.success('Page deleted')
      // Navigate to wiki home if deleted page was selected
      navigate('/wiki')
    } catch (err: any) {
      loadPages()
      toast.error(err.message)
    }
  }

  return { pages, loading, loadPages, createPage, updatePage, savePage, deletePage }
}
