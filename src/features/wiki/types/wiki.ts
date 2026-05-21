export interface WikiPage {
  id: string
  team_id: string
  parent_id: string | null
  title: string
  slug: string | null
  icon: string
  cover_image: string | null
  content: string | null
  content_json: any[] | null
  author_id: string
  created_at: string
  updated_at: string | null
  archived: boolean
  sort_order: number
  author?: { id: string; name: string; avatar_url: string | null }
}

export interface WikiPageTree extends WikiPage {
  children: WikiPageTree[]
}

export interface WikiBacklink {
  id: string
  team_id: string
  source_page_id: string
  target_page_id: string
  created_at: string
  source?: { id: string; title: string; icon: string }
}

export interface WikiFavorite {
  id: string
  user_id: string
  page_id: string
  created_at: string
}

export interface WikiDraft {
  pageId: string
  title: string
  content_json: any[]
  savedAt: number
}

export interface WikiSearchResult {
  id: string
  title: string
  icon: string
  parent_id: string | null
  excerpt?: string
}
