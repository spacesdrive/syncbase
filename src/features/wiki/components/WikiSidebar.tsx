import { useState, useMemo } from 'react'
import { Plus, Search, ChevronRight, ChevronDown, FileText, Trash2, Star, X, BookOpen, PanelLeftClose } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { WikiPage, WikiPageTree } from '../types/wiki'

function buildTree(pages: WikiPage[]): WikiPageTree[] {
  const map = new Map<string, WikiPageTree>()
  const roots: WikiPageTree[] = []

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] })
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sort = (nodes: WikiPageTree[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title))
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

interface TreeNodeProps {
  node: WikiPageTree
  depth: number
  selectedId: string | undefined
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCreateChild: (parentId: string) => void
}

function TreeNode({ node, depth, selectedId, onSelect, onDelete, onCreateChild }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors text-sm',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          className={cn('shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors', hasChildren ? 'hover:bg-muted-foreground/20' : 'opacity-0 pointer-events-none')}
        >
          {hasChildren ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
        </button>

        <span className="text-base leading-none shrink-0 select-none">{node.icon || '📄'}</span>
        <span className="flex-1 truncate text-xs">{node.title}</span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateChild(node.id) }}
            title="Add sub-page"
            className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id) }}
            title="Delete page"
            className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface WikiSidebarProps {
  pages: WikiPage[]
  selectedPageId: string | undefined
  favorites: string[]
  onSelectPage: (id: string) => void
  onCreatePage: (parentId?: string) => void
  onDeletePage: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function WikiSidebar({
  pages,
  selectedPageId,
  favorites,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  mobileOpen,
  onMobileClose,
}: WikiSidebarProps) {
  const [search, setSearch] = useState('')

  const tree = useMemo(() => buildTree(pages), [pages])

  const filteredPages = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return pages.filter((p) => p.title.toLowerCase().includes(q))
  }, [search, pages])

  const favoritePages = useMemo(
    () => pages.filter((p) => favorites.includes(p.id)),
    [pages, favorites]
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground flex-1 min-w-0">Wiki</span>
          <button
            onClick={() => onCreatePage()}
            title="New page"
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMobileClose}
            title="Close sidebar"
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors sm:hidden"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <label className="flex items-center gap-1.5 h-7 w-full rounded-md border border-border bg-background px-2 focus-within:ring-1 focus-within:ring-ring">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 min-w-0 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5">
        {filteredPages ? (
          /* Search results */
          filteredPages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No pages found</p>
          ) : (
            filteredPages.map((page) => (
              <button
                key={page.id}
                onClick={() => { onSelectPage(page.id); setSearch('') }}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors',
                  selectedPageId === page.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-base leading-none shrink-0">{page.icon || '📄'}</span>
                <span className="truncate flex-1">{page.title}</span>
              </button>
            ))
          )
        ) : (
          <>
            {/* Favorites */}
            {favoritePages.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Favorites</p>
                {favoritePages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => onSelectPage(page.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors',
                      selectedPageId === page.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                    <span className="truncate flex-1">{page.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Page tree */}
            {tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <FileText className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground text-center">No pages yet.<br />Create your first page.</p>
                <button onClick={() => onCreatePage()} className="mt-1 text-xs text-primary hover:underline">
                  + New page
                </button>
              </div>
            ) : (
              tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedPageId}
                  onSelect={onSelectPage}
                  onDelete={onDeletePage}
                  onCreateChild={onCreatePage}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-56 shrink-0 flex-col border-r border-border bg-muted/20 h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="relative w-64 h-full bg-background border-r border-border flex flex-col shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
