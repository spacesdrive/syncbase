import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWikiPages } from '../../features/wiki/hooks/useWikiPages'
import { useWikiStore } from '../../features/wiki/stores/wikiStore'
import { useRealtime } from '../../hooks/useRealtime'
import { useTeam } from '../../contexts/TeamContext'
import { WikiSidebar } from '../../features/wiki/components/WikiSidebar'
import { WikiCommandPalette } from '../../features/wiki/components/WikiCommandPalette'
import { WikiPageView } from '../../features/wiki/components/WikiPageView'
import { WikiHome } from '../../features/wiki/components/WikiHome'

export default function WikiPage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const navigate = useNavigate()
  const { team } = useTeam()
  const { pages, loading, loadPages, createPage, savePage, deletePage } = useWikiPages()
  const { commandOpen, setCommandOpen } = useWikiStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  const selectedPage = pageId ? pages.find((p) => p.id === pageId) : undefined

  // Realtime updates
  useRealtime('wiki_pages', team ? { filter: `team_id=eq.${team.id}` } : null, loadPages)

  // Global keyboard shortcut for command palette
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [setCommandOpen])

  // Auto-navigate to first page if no page is selected and pages are loaded
  useEffect(() => {
    if (!loading && pages.length > 0 && !pageId) {
      // Don't auto-navigate — show wiki home instead
    }
  }, [loading, pages, pageId])

  const handleCreatePage = useCallback(
    async (titleOrParentId?: string) => {
      // If called from tree node with a UUID, it's a parent ID; otherwise it's a title
      const isUuid = titleOrParentId && /^[0-9a-f-]{36}$/.test(titleOrParentId)
      if (isUuid) {
        await createPage('Untitled', titleOrParentId)
      } else {
        await createPage(titleOrParentId || 'Untitled')
      }
    },
    [createPage]
  )

  const handleCreateFromPalette = useCallback(
    async (title: string) => {
      await createPage(title)
    },
    [createPage]
  )

  return (
    <div className="flex h-full overflow-hidden -m-4 sm:-m-6">
      <WikiSidebar
        pages={pages}
        selectedPageId={selectedPage?.id}
        favorites={favorites}
        onSelectPage={(id) => { navigate(`/wiki/${id}`); setMobileSidebarOpen(false) }}
        onCreatePage={handleCreatePage}
        onDeletePage={deletePage}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedPage ? (
          <WikiPageView
            page={selectedPage}
            pages={pages}
            onSavePage={savePage}
            onDeletePage={deletePage}
            onSelectPage={(id) => navigate(`/wiki/${id}`)}
            onMobileSidebarOpen={() => setMobileSidebarOpen(true)}
          />
        ) : (
          <WikiHome
            loading={loading}
            pages={pages}
            onCreatePage={() => handleCreatePage()}
            onSelectPage={(id) => navigate(`/wiki/${id}`)}
            onMobileSidebarOpen={() => setMobileSidebarOpen(true)}
          />
        )}
      </div>

      <WikiCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectPage={(id) => navigate(`/wiki/${id}`)}
        onCreatePage={handleCreateFromPalette}
      />
    </div>
  )
}
