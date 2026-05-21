import { useEffect, useState } from 'react'
import { Link2, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../../../lib/api'
import type { WikiBacklink } from '../types/wiki'
import { cn } from '../../../lib/utils'

interface WikiBacklinksProps {
  pageId: string
  onSelectPage: (id: string) => void
}

export function WikiBacklinks({ pageId, onSelectPage }: WikiBacklinksProps) {
  const [backlinks, setBacklinks] = useState<WikiBacklink[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setBacklinks([])
    setOpen(false)
  }, [pageId])

  async function loadBacklinks() {
    if (loading) return
    setLoading(true)
    try {
      const { backlinks: data } = await api.getWikiBacklinks(pageId)
      setBacklinks(data)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    if (!open && backlinks.length === 0) {
      loadBacklinks()
    } else {
      setOpen((v) => !v)
    }
  }

  return (
    <div className="border-t border-border mt-8">
      <button
        onClick={toggle}
        className="flex items-center gap-2 w-full px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Link2 className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">Backlinks</span>
        {backlinks.length > 0 && (
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{backlinks.length}</span>
        )}
        <span className="ml-auto">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : backlinks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No pages link here yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {backlinks.map((bl) => (
                <button
                  key={bl.id}
                  onClick={() => onSelectPage(bl.source_page_id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left hover:bg-muted transition-colors"
                >
                  <span className="text-sm leading-none shrink-0">{bl.source?.icon || '📄'}</span>
                  <span className="text-foreground hover:text-primary truncate">{bl.source?.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
