import { useState, useCallback, useEffect, useRef } from 'react'
import { Menu, Star, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { api } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { WikiEditor } from './editor/WikiEditor'
import { WikiBacklinks } from './WikiBacklinks'
import { getDraft } from '../services/offlineService'
import type { WikiPage } from '../types/wiki'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog'

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
  const [title, setTitle] = useState(page.title)
  const [savingIndicator, setSavingIndicator] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [favorited, setFavorited] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftContent, setDraftContent] = useState<any[] | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const pendingContentRef = useRef<{ blocks: any[]; text: string } | null>(null)

  useEffect(() => {
    setTitle(page.title)
    setSavingIndicator('idle')
    setShowIconPicker(false)
    pendingContentRef.current = null
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

  // Breadcrumbs
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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileSidebarOpen}
          className="sm:hidden h-8 w-8"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Breadcrumb */}
        <Breadcrumb className="flex-1 min-w-0 overflow-hidden">
          <BreadcrumbList className="flex-nowrap overflow-hidden text-xs">
            {breadcrumbs.map((crumb) => (
              <BreadcrumbItem key={crumb.id} className="shrink-0">
                <BreadcrumbLink
                  asChild
                  className="flex items-center gap-1 max-w-[100px] truncate cursor-pointer"
                >
                  <button onClick={() => onSelectPage(crumb.id)}>
                    <span>{crumb.icon}</span>
                    <span className="truncate">{crumb.title}</span>
                  </button>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs truncate max-w-[180px]">{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {savingIndicator === 'saving' && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">Saving…</span>
          )}
          {savingIndicator === 'saved' && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-500">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            title={favorited ? 'Unfavorite' : 'Favorite'}
            className={cn('h-8 w-8', favorited ? 'text-amber-400 hover:text-amber-500' : '')}
          >
            <Star className={cn('w-4 h-4', favorited && 'fill-current')} />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Delete page" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete page?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>"{page.title}"</strong> and all its sub-pages will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDeletePage(page.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Draft recovery banner */}
      {hasDraft && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-xs shrink-0">
          <Badge variant="warning" className="shrink-0">Draft</Badge>
          <span className="text-amber-700 dark:text-amber-400 flex-1">Unsaved changes from a previous session.</span>
          <button onClick={() => setHasDraft(false)} className="font-medium text-amber-700 dark:text-amber-400 hover:underline">
            Restore
          </button>
          <button
            onClick={() => {
              setHasDraft(false)
              setDraftContent(null)
              import('../services/offlineService').then(({ deleteDraft }) => deleteDraft(page.id))
            }}
            className="text-amber-600 dark:text-amber-500 hover:underline"
          >
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
          <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-border">
            {page.author && (
              <Badge variant="secondary" className="text-xs font-normal">
                By {page.author.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              Updated {formatDistanceToNow(new Date(page.updated_at || page.created_at), { addSuffix: true })}
            </Badge>
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
