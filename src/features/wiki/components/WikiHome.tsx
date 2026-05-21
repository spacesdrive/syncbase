import { useMemo } from 'react'
import { BookOpen, Plus, Clock, FileText, Menu } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { WikiPage } from '../types/wiki'

interface WikiHomeProps {
  loading: boolean
  pages: WikiPage[]
  onCreatePage: () => void
  onSelectPage: (id: string) => void
  onMobileSidebarOpen: () => void
}

export function WikiHome({ loading, pages, onCreatePage, onSelectPage, onMobileSidebarOpen }: WikiHomeProps) {
  const recent = useMemo(
    () =>
      [...pages]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        .slice(0, 12),
    [pages]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground">Loading wiki…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border sm:hidden">
        <button
          onClick={onMobileSidebarOpen}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold flex-1">Wiki</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          {/* Hero */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Wiki</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pages.length === 0
                  ? 'Your team\'s knowledge base. Start writing.'
                  : `${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · shared knowledge`}
              </p>
            </div>
          </div>

          {pages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground mb-1">No pages yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first wiki page to start building your team's knowledge base.
                </p>
              </div>
              <button onClick={onCreatePage} className="btn-primary mt-2">
                <Plus className="w-4 h-4" />
                Create first page
              </button>
            </div>
          ) : (
            <>
              {/* Quick actions */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={onCreatePage}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm text-muted-foreground hover:text-primary transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New page
                </button>
              </div>

              {/* Recent pages */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recently Updated</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {recent.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => onSelectPage(page.id)}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                    >
                      <span className="text-2xl leading-none shrink-0 mt-0.5 select-none">{page.icon || '📄'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {page.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(page.updated_at || page.created_at), { addSuffix: true })}
                        </p>
                        {page.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {page.content.slice(0, 120)}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
