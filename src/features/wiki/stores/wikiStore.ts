import { create } from 'zustand'
import type { WikiPage } from '../types/wiki'
import { indexPages, updatePageInIndex, removePageFromIndex } from '../services/searchService'

interface WikiState {
  pages: WikiPage[]
  loading: boolean
  commandOpen: boolean
  search: string

  setPages: (pages: WikiPage[]) => void
  setLoading: (loading: boolean) => void
  setCommandOpen: (open: boolean) => void
  setSearch: (search: string) => void

  upsertPage: (page: WikiPage) => void
  removePage: (id: string) => void
}

export const useWikiStore = create<WikiState>((set, get) => ({
  pages: [],
  loading: true,
  commandOpen: false,
  search: '',

  setPages: (pages) => {
    indexPages(pages)
    set({ pages })
  },

  setLoading: (loading) => set({ loading }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSearch: (search) => set({ search }),

  upsertPage: (page) => {
    updatePageInIndex(page)
    set((state) => {
      const exists = state.pages.some((p) => p.id === page.id)
      return {
        pages: exists
          ? state.pages.map((p) => (p.id === page.id ? { ...p, ...page } : p))
          : [page, ...state.pages],
      }
    })
  },

  removePage: (id) => {
    removePageFromIndex(id)
    set((state) => ({ pages: state.pages.filter((p) => p.id !== id) }))
  },
}))
