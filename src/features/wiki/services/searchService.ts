import type { WikiPage, WikiSearchResult } from '../types/wiki'

let pages: WikiPage[] = []

export function indexPages(data: WikiPage[]): void {
  pages = data
}

export function updatePageInIndex(page: WikiPage): void {
  const idx = pages.findIndex((p) => p.id === page.id)
  if (idx >= 0) pages[idx] = page
  else pages.push(page)
}

export function removePageFromIndex(pageId: string): void {
  pages = pages.filter((p) => p.id !== pageId)
}

export function searchPages(query: string): WikiSearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return pages
    .filter(
      (p) =>
        !p.archived &&
        (p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q))
    )
    .slice(0, 20)
    .map((p) => {
      let excerpt: string | undefined
      if (p.content && p.content.toLowerCase().includes(q)) {
        const idx = p.content.toLowerCase().indexOf(q)
        const start = Math.max(0, idx - 40)
        excerpt = (start > 0 ? '…' : '') + p.content.slice(start, idx + 80).trim() + '…'
      }
      return { id: p.id, title: p.title, icon: p.icon || '📄', parent_id: p.parent_id, excerpt }
    })
}

export function getRecentPages(limit = 8): WikiSearchResult[] {
  return [...pages]
    .filter((p) => !p.archived)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, limit)
    .map((p) => ({ id: p.id, title: p.title, icon: p.icon || '📄', parent_id: p.parent_id }))
}
