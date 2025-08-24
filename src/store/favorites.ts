import { create } from 'zustand'
import { listFavoritesMap, toggleFavorite as toggleFavLib } from '@/lib/favorites'

type FavState = {
  map: Map<string, string>
  loaded: boolean
  load: () => Promise<void>
  toggle: (nasheedId: string) => Promise<boolean>
}

export const useFavoritesStore = create<FavState>((set, get) => ({
  map: new Map(),
  loaded: false,
  load: async () => {
    const m = await listFavoritesMap()
    set({ map: m, loaded: true })
  },
  toggle: async (nasheedId: string) => {
    const wasFav = get().map.has(nasheedId)
    try {
      const nowFav = await toggleFavLib(nasheedId)
      set((s) => {
        const copy = new Map(s.map)
        if (nowFav) copy.set(nasheedId, '1')
        else copy.delete(nasheedId)
        return { map: copy }
      })
      return nowFav
    } catch (e) {
      // If not auth, just bubble
      throw e
    }
  },
}))
