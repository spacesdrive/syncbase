import { useEffect, useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { api } from '../../../lib/api'
import type { WikiBacklink } from '../types/wiki'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible'
import { ChevronRight } from 'lucide-react'

interface WikiBacklinksProps {
  pageId: string
  onSelectPage: (id: string) => void
}

export function WikiBacklinks({ pageId, onSelectPage }: WikiBacklinksProps) {
  const [backlinks, setBacklinks] = useState<WikiBacklink[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setBacklinks([])
    setOpen(false)
    setLoaded(false)
  }, [pageId])

  async function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && !loaded) {
      setLoading(true)
      try {
        const { backlinks: data } = await api.getWikiBacklinks(pageId)
        setBacklinks(data)
        setLoaded(true)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="border-t border-border mt-8">
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 w-full justify-start px-4 py-3 h-auto text-xs text-muted-foreground hover:text-foreground rounded-none"
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">Backlinks</span>
            {backlinks.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {backlinks.length}
              </Badge>
            )}
            <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading…
              </div>
            ) : backlinks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No pages link here yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {backlinks.map((bl) => (
                  <Button
                    key={bl.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectPage(bl.source_page_id)}
                    className="justify-start gap-2 h-8 text-xs px-2"
                  >
                    <span className="text-sm leading-none shrink-0">{bl.source?.icon || '📄'}</span>
                    <span className="truncate">{bl.source?.title || 'Untitled'}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
