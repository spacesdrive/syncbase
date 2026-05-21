import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Star, Trash2, ChevronRight, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { api } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useTeam } from '../../../contexts/TeamContext'
import { WikiEditor } from './editor/WikiEditor'
import { WikiBacklinks } from './WikiBacklinks'
import { getDraft, saveDraft } from '../services/offlineService'
import type { WikiPage } from '../types/wiki'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const ICONS = ['📄', '📝', '📖', '🗒️', '💡', '🔥', '⭐', '🎯', '🚀', '✅', '📌', '🔗', '🗂️', '📊', '🖼️', '💬', '🔒', '⚙️']

interface WikiPageViewProps {
  page: WikiPage
  pages: WikiPage[]
  onSavePage: (pageId: string, title: string, contentJson: any[], plainText: string) => Promise<void>
  onDeletePage: (id: string) => void
  onSelectPage: (id: string) => void
  onMobileSidebarOpen: () => void
}

export function WikiPageView({ page, pages, onSavePage, onDeletePage, onSelectPage, onMobileSidebarOpen }: WikiPageViewProps) {
  const { user } = useAuth()
  const { team } = useTeam()
  const [title, setTitle] = useState(page.title)
  const [savingIndicator, setSavingIndicator] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [favorited, setFavorited] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftContent, setDraftContent] = useState<any[] | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const pendingContentRef = useRef<{ blocks: any[]; text: string } | null>(null)

  // Reset state when page changes
  useEffect(() => {
    setTitle(page.title)
    setSavingIndicator('idle')
    setShowIconPicker(false)
    pendingContentRef.current = null

    // Check for offline draft
    getDraft(page.id).then((draft) => {
      if (draft && draft.savedAt > new Date(page.updated_at || page.created_at).getTime()) {
        setHasDraft(true)
        setDraftContent(draft.content_json)
      } else {
        setHasDraft(false)
        setDraftContent(null)
      }
    })
  }, [page.id])

  const triggerSave = useCallback(
    (newTitle: string, blocks: any[], text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSavingIndicator('saving')
      saveTimerRef.current = setTimeout(async () => {
        await onSavePage(page.id, newTitle, blocks, text)
        setSavingIndicator('saved')
        setTimeout(() => setSavingIndicator('idle'), 2000)
      }, 800)
    },
    [page.id, onSavePage]
  )

  function handleTitleChange(value: string) {
    setTitle(value)
    if (pendingContentRef.current) {
      triggerSave(value, pendingContentRef.current.blocks, pendingContentRef.current.text)
    }
  }

  function handleContentChange(blocks: any[], plainText: string) {
    pendingContentRef.current = { blocks, text: plainText }
    triggerSave(title, blocks, plainText)
  }

  async function handleTitleBlur() {
    if (title !== page.title && pendingContentRef.current) {
      triggerSave(title, pendingContentRef.current.blocks, pendingContentRef.current.text)
    } else if (title !== page.title) {
      await onSavePage(page.id, title, page.content_json || [], page.content || '')
    }
  }

  async function handleIconChange(icon: string) {
    setShowIconPicker(false)
    try {
      await api.updateWikiPage(page.id, { icon })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function toggleFavorite() {
    try {
      const { favorited: result } = await api.toggleWikiFavorite(page.id)
      setFavorited(result)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function handleRestoreDraft() {
    setHasDraft(false)
  }

  function dismissDraft() {
    setHasDraft(false)
    setDraftContent(null)
    import('../services/offlineService').then(({ deleteDraft }) => deleteDraft(page.id))
  }

  // Breadcrumbs: find ancestor chain
  const breadcrumbs: WikiPage[] = []
  let current: WikiPage | undefined = pages.find((p) => p.id === page.parent_id)
  while (current) {
    breadcrumbs.unshift(current)
    current = pages.find((p) => p.id === current?.parent_id)
  }

  const contentToRender = hasDraft && draftContent ? draftContent : page.content_json

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileSidebarOpen}
          className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 flex-1 min-w-0 text-xs text-muted-foreground overflow-hidden">
          {breadcrumbs.map((crumb) => (
            <button
              key={crumb.id}
              onClick={() => onSelectPage(crumb.id)}
              className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0 max-w-[120px] truncate"
            >
              <span>{crumb.icon}</span>
              <span className="truncate">{crumb.title}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </button>
          ))}
          <span className="truncate font-medium text-foreground">{page.title}</span>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {savingIndicator === 'saving' && (
            <span className="text-[10px] text-muted-foreground">Saving…</span>
          )}
          {savingIndicator === 'saved' && (
            <span className="flex items-center gap-1 text-[10px] text-green-500">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}

          <button
            onClick={toggleFavorite}
            title={favorited ? 'Unfavorite' : 'Favorite'}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              favorited
                ? 'text-amber-400 hover:text-amber-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Star className={cn('w-4 h-4', favorited && 'fill-current')} />
          </button>

          <button
            onClick={() => onDeletePage(page.id)}
            title="Delete page"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Draft recovery banner */}
      {hasDraft && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-xs">
          <span className="text-amber-700 dark:text-amber-400 flex-1">
            You have unsaved draft changes from {draftContent ? 'a previous session' : 'offline editing'}.
          </span>
          <button onClick={handleRestoreDraft} className="font-medium text-amber-700 dark:text-amber-400 hover:underline">
            Restore
          </button>
          <button onClick={dismissDraft} className="text-amber-600 dark:text-amber-500 hover:underline">
            Discard
          </button>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 pt-12 sm:pt-16 pb-16">
          {/* Icon */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowIconPicker((v) => !v)}
              className="text-5xl hover:opacity-70 transition-opacity select-none leading-none"
              title="Change icon"
            >
              {page.icon || '📄'}
            </button>

            {showIconPicker && (
              <div className="absolute top-14 left-0 z-20 bg-background border border-border rounded-xl shadow-xl p-3 grid grid-cols-9 gap-1">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => handleIconChange(icon)}
                    className="w-8 h-8 text-xl flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            className="w-full text-3xl sm:text-4xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 mb-4 resize-none leading-tight"
          />

          {/* Meta */}
          <div className="flex items-center gap-3 mb-10 text-xs text-muted-foreground border-b border-border pb-6">
            {page.author && (
              <span>By <span className="text-foreground/70 font-medium">{page.author.name}</span></span>
            )}
            <span className="text-muted-foreground/60">·</span>
            <span>
              Updated {formatDistanceToNow(new Date(page.updated_at || page.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Editor */}
          <WikiEditor
            key={page.id}
            pageId={page.id}
            initialContent={contentToRender}
            onChange={handleContentChange}
            editable={true}
          />
        </div>

        {/* Backlinks */}
        <div className="max-w-3xl mx-auto px-6 sm:px-12 pb-16">
          <WikiBacklinks pageId={page.id} onSelectPage={onSelectPage} />
        </div>
      </div>
    </div>
  )
}
