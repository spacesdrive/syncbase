import { useEffect, useState } from 'react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'cmdk'
import { Plus, Search, Clock } from 'lucide-react'
import { searchPages, getRecentPages } from '../services/searchService'
import type { WikiSearchResult } from '../types/wiki'

interface WikiCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPage: (id: string) => void
  onCreatePage: (title: string) => void
}

export function WikiCommandPalette({ open, onOpenChange, onSelectPage, onCreatePage }: WikiCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WikiSearchResult[]>([])
  const [recent, setRecent] = useState<WikiSearchResult[]>([])

  useEffect(() => {
    if (open) {
      setQuery('')
      setRecent(getRecentPages(6))
    }
  }, [open])

  useEffect(() => {
    if (query.trim()) {
      setResults(searchPages(query))
    } else {
      setResults([])
    }
  }, [query])

  function handleSelect(id: string) {
    onSelectPage(id)
    onOpenChange(false)
    setQuery('')
  }

  function handleCreate() {
    if (query.trim()) {
      onCreatePage(query.trim())
      onOpenChange(false)
      setQuery('')
    }
  }

  if (!open) return null

  const displayList = query.trim() ? results : recent
  const showCreate = query.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-background rounded-xl border border-border shadow-2xl overflow-hidden">
        <Command shouldFilter={false}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages or create new…"
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground border-none focus:ring-0 p-0 h-auto"
              autoFocus
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>

          <CommandList className="max-h-72 overflow-y-auto py-2">
            <CommandEmpty>
              <div className="text-center py-8 text-sm text-muted-foreground">
                {query ? 'No pages found' : 'Start typing to search…'}
              </div>
            </CommandEmpty>

            {!query && recent.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="w-3 h-3" /> Recent
                </div>
              }>
                {recent.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.id}
                    onSelect={() => handleSelect(page.id)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 cursor-pointer text-sm transition-colors hover:bg-muted data-[selected=true]:bg-muted"
                  >
                    <span className="text-base leading-none shrink-0">{page.icon}</span>
                    <span className="flex-1 truncate text-foreground">{page.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query && displayList.length > 0 && (
              <CommandGroup heading={
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pages
                </div>
              }>
                {displayList.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.id}
                    onSelect={() => handleSelect(page.id)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 cursor-pointer text-sm transition-colors hover:bg-muted data-[selected=true]:bg-muted"
                  >
                    <span className="text-base leading-none shrink-0">{page.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground font-medium">{page.title}</p>
                      {page.excerpt && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{page.excerpt}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showCreate && (
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={handleCreate}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 cursor-pointer text-sm transition-colors hover:bg-primary/10 data-[selected=true]:bg-primary/10 text-primary"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Create "<strong>{query}</strong>"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>

          <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1 font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1 font-mono">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1 font-mono">ESC</kbd> Close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
