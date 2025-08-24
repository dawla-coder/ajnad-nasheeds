"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Headphones, Repeat, ExternalLink } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { getSignedOrPublicUrl } from '@/lib/supabaseClient'
import { Nasheed } from '@/types'
import { create } from 'zustand'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import logoPng from '../1755995665.png'
import { fmtDuration } from '@/lib/utils'
import { listNasheeds } from '@/lib/nasheeds'

const AudioPlayer = dynamic(() => import('react-h5-audio-player'), { ssr: false }) as any

type PlayerState = {
  queue: Nasheed[]
  index: number
  setQueue: (items: Nasheed[], startIndex: number) => void
  next: () => void
  prev: () => void
  setIndex: (i: number) => void
}

const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  setQueue: (items, startIndex) => set({ queue: items, index: startIndex }),
  setIndex: (i) => set({ index: i }),
  next: () => {
    const { queue, index } = get()
    if (!queue.length) return
    const last = index >= queue.length - 1
    if (last) return
    set({ index: index + 1 })
  },
  prev: () => {
    const { index } = get()
    set({ index: Math.max(0, index - 1) })
  },
}))

export default function Home() {
  const [nasheeds, setNasheeds] = useState<Nasheed[]>([])
  const [search, setSearch] = useState('')
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [songLoading, setSongLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('favorites_v1')
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr.map(String) : []
    } catch { return [] }
  })
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [repeatOne, setRepeatOne] = useState(false)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const endedHandlerRef = useRef<((e: Event) => void) | null>(null)
  const pauseHandlerRef = useRef<((e: Event) => void) | null>(null)
  const timeUpdateHandlerRef = useRef<((e: Event) => void) | null>(null)
  const boundAudioRef = useRef<HTMLAudioElement | null>(null)
  const restartingRef = useRef(false)
  const repeatWatchIdRef = useRef<number | null>(null)
  const srcReqIdRef = useRef(0)
  const { queue, index, setQueue, setIndex, next, prev } = usePlayer()

  const filtered = useMemo(() => {
    let rows = nasheeds
    const q = search.trim()
    if (q) {
      rows = rows.filter(n => `${n.title} ${n.artist}`.toLowerCase().includes(q.toLowerCase()))
    }
    if (favoritesOnly) {
      rows = rows.filter(n => favorites.includes(String(n.id)))
    }
    return rows
  }, [nasheeds, search, favoritesOnly, favorites])

  useEffect(() => {
    const load = async () => {
      setListLoading(true)
      const rows = await listNasheeds({ limit: 500 })
      setNasheeds(rows)
      setListLoading(false)
    }
    load()
  }, [])
  
  // ensure SSR hydration picks up favorites from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('favorites_v1')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) setFavorites(arr.map(String))
    } catch {}
  }, [])

  useEffect(() => {
    const reqId = ++srcReqIdRef.current
    const setSrc = async () => {
      const current = queue[index]
      if (!current) { setCurrentUrl(null); return }
      setSongLoading(true)
      const url = await getSignedOrPublicUrl(current.file_url)
      if (srcReqIdRef.current !== reqId) return // stale response ignored
      setCurrentUrl(url)
    }
    setSrc()
  }, [queue, index])

  // turn off repeat when user switches to another track
  useEffect(() => { setRepeatOne(false) }, [index])

  // robust repeat-one: bind ended handler reliably and avoid duplicate listeners
  const bindAudioHandlers = useCallback(() => {
    const el = (playerRef.current?.audio?.current as HTMLAudioElement | undefined)
      ?? (playerContainerRef.current?.querySelector('audio') as HTMLAudioElement | null)
      ?? undefined
    if (!el) return

    // detach from previous element if changed
    if (boundAudioRef.current && boundAudioRef.current !== el) {
      if (endedHandlerRef.current) boundAudioRef.current.removeEventListener('ended', endedHandlerRef.current)
      if (pauseHandlerRef.current) boundAudioRef.current.removeEventListener('pause', pauseHandlerRef.current)
      if (timeUpdateHandlerRef.current) boundAudioRef.current.removeEventListener('timeupdate', timeUpdateHandlerRef.current)
    }

    // create fresh handler capturing latest state
    const handler = () => {
      if (repeatOne) {
        try {
          el.currentTime = 0
          setTimeout(() => {
            const p = el.play()
            if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => {})
          }, 0)
        } catch {}
      } else {
        const last = index >= queue.length - 1
        if (!last) next()
      }
    }
    const handlePause = () => {
      if (!repeatOne) return
      const nearEnd = el.duration && !isNaN(el.duration) && el.currentTime >= (el.duration - 0.05)
      if (el.ended || nearEnd) {
        try {
          el.currentTime = 0
          setTimeout(() => {
            const p = el.play()
            if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => {})
          }, 0)
        } catch {}
      }
    }
    const handleTimeUpdate = () => {
      if (!repeatOne) return
      const d = el.duration
      if (!d || isNaN(d)) return
      const remaining = d - el.currentTime
      if (remaining <= 0.05 && !restartingRef.current) {
        restartingRef.current = true
        try {
          el.currentTime = 0
          const p = el.play()
          if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => {})
        } catch {}
        setTimeout(() => { restartingRef.current = false }, 200)
      }
    }

    // update loop flag and listener
    try { el.loop = repeatOne } catch {}
    if (endedHandlerRef.current) el.removeEventListener('ended', endedHandlerRef.current)
    if (pauseHandlerRef.current) el.removeEventListener('pause', pauseHandlerRef.current)
    if (timeUpdateHandlerRef.current) el.removeEventListener('timeupdate', timeUpdateHandlerRef.current)
    el.addEventListener('ended', handler)
    el.addEventListener('pause', handlePause)
    el.addEventListener('timeupdate', handleTimeUpdate)
    endedHandlerRef.current = handler
    pauseHandlerRef.current = handlePause
    timeUpdateHandlerRef.current = handleTimeUpdate
    boundAudioRef.current = el
  }, [repeatOne, index, queue.length, next])

  useEffect(() => { bindAudioHandlers() }, [bindAudioHandlers, repeatOne, currentUrl])

  // watchdog: if ended state sticks due to browser/library, restart while repeat is on
  useEffect(() => {
    if (!repeatOne) {
      if (repeatWatchIdRef.current) { clearInterval(repeatWatchIdRef.current); repeatWatchIdRef.current = null }
      return
    }
    repeatWatchIdRef.current = window.setInterval(() => {
      const el = boundAudioRef.current
      if (!el) return
      if (el.ended) {
        try {
          el.currentTime = 0
          const p = el.play()
          if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => {})
        } catch {}
      }
    }, 250)
    return () => {
      if (repeatWatchIdRef.current) { clearInterval(repeatWatchIdRef.current); repeatWatchIdRef.current = null }
    }
  }, [repeatOne])

  // if user turns repeat on when track is at the end, restart immediately
  useEffect(() => {
    if (!repeatOne) return
    const el = (playerRef.current?.audio?.current as HTMLAudioElement | undefined)
      ?? (playerContainerRef.current?.querySelector('audio') as HTMLAudioElement | null)
      ?? undefined
    if (!el) return
    try { el.loop = true } catch {}
    const nearEnd = el.duration && !isNaN(el.duration) && el.currentTime >= (el.duration - 0.05)
    if (el.ended || nearEnd) {
      try {
        el.currentTime = 0
        const p = el.play()
        if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => {})
      } catch {}
    }
  }, [repeatOne])

  // persist favorites on change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('favorites_v1', JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light')
      localStorage.removeItem('theme')
    }
  }, [])

  

  const onPlayNasheed = (n: Nasheed, i: number) => {
    setQueue(filtered, i)
  }

  const handleDownload = async (n: Nasheed) => {
    try {
      const url = await getSignedOrPublicUrl(n.file_url)
      if (!url) return
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${n.title}.mp3`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      // fallback: try direct URL download without opening new tab
      try {
        const url2 = await getSignedOrPublicUrl(n.file_url)
        if (!url2) return
        const a = document.createElement('a')
        a.href = url2
        a.download = `${n.title}.mp3`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } catch {}
    }
  }

  const toggleFavorite = (id: unknown) => {
    const key = String(id)
    setFavorites(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-8">
      <div className="lg:col-span-2 mb-2 relative flex items-center justify-center">
        <div className="text-2xl lg:text-3xl font-bold tracking-wide">AJNAD</div>
        <a
          href="https://thurse1-my.sharepoint.com/:f:/g/personal/291254_office365works_net/EiIGqIjr8AdHt2uDgVCr8NwBmWBr-qVEzxpctTnHmnK7Rw"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 top-1 inline-flex items-center gap-1.5 rounded-md border border-gold-500/40 bg-gold-500/20 hover:bg-gold-500/30 text-gold-500 px-2 py-1 text-xs lg:px-3 lg:py-1.5 lg:text-sm"
          title="Open Archive in new tab"
          aria-label="Open Archive in new tab"
        >
          Archive
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Left: Player */}
      <section className="aj-card rounded-2xl p-4 lg:p-6 shadow-soft flex flex-col items-center justify-between min-h-[480px] lg:min-h-[560px]">
        <div className="w-full flex items-center justify-between text-base opacity-90 mb-2">
          <span className="opacity-70">{fmtDuration(queue[index]?.duration ?? 0)}</span>
          <span className="mx-auto text-lg font-semibold truncate max-w-[70%] text-center">{queue[index]?.title || '—'}</span>
          <span className="w-6" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative size-52 sm:size-60 lg:size-80 rounded-xl overflow-hidden shadow-soft">
            <Image src={logoPng} alt="AJNAD" fill sizes="(max-width: 1024px) 16rem, 20rem" className="object-cover" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-semibold">{queue[index]?.artist || '—'}</h2>
        </div>
        <div ref={playerContainerRef} className={`w-full relative aj-player ${songLoading ? 'loading' : ''}`}>
          <AudioPlayer
            key={queue[index]?.id ?? currentUrl ?? index}
            ref={playerRef}
            autoPlayAfterSrcChange
            src={currentUrl ?? undefined}
            preload="auto"
            progressUpdateInterval={250}
            loop={false}
            onClickNext={next}
            onClickPrevious={prev}
            onLoadStart={()=>{ setSongLoading(true) }}
            onLoadedMetadata={()=>{ bindAudioHandlers(); setSongLoading(false) }}
            onCanPlay={()=>{ bindAudioHandlers(); setSongLoading(false) }}
            onCanPlayThrough={()=>{ bindAudioHandlers(); setSongLoading(false) }}
            onError={()=>setSongLoading(false)}
            showJumpControls={false}
            showSkipControls
            customAdditionalControls={[
              <button
                key="repeat"
                title={repeatOne?'Repeat: On':'Repeat: Off'}
                onClick={(e:any)=>{ e.stopPropagation(); setRepeatOne(v=> !v) }}
                className={`aj-icon-btn ${repeatOne?'is-active':''}`}
                aria-label="Repeat"
                aria-pressed={repeatOne}
              >
                <Repeat size={18} />
              </button>
            ]}
            customVolumeControls={[]}
          />
        </div>
      </section>

      {/* Right: List */}
      <section className="aj-card rounded-2xl p-4 lg:p-6 shadow-soft min-h-[480px] lg:min-h-[560px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-semibold">Playlist</h3>
          <button
            onClick={()=>setFavoritesOnly(v=>!v)}
            className={`text-sm px-3 py-1.5 rounded-md border ${favoritesOnly ? 'bg-gold-500/20 border-gold-500/40' : 'bg-black/10 border-transparent hover:bg-black/20'}`}
            title="Show only favorites"
          >
            {favoritesOnly ? 'Favorites: On' : 'Favorites: Off'}
          </button>
        </div>
        <div className="mb-3">
          <Input placeholder="Search Nasheeds" value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <ScrollArea className="h-[420px] lg:h-[560px]">
          <ul className="divide-y divide-navy-700/40">
            {listLoading ? (
              Array.from({ length: 10 }).map((_,i)=> (
                <li key={i} className="py-3">
                  <div className="h-6 w-2/3 rounded bg-gold-500/20 animate-pulse mb-1" />
                  <div className="h-4 w-1/3 rounded bg-gold-500/10 animate-pulse" />
                </li>
              ))
            ) : (
              filtered.map((n, i) => {
                const active = queue[index]?.id === n.id
                const fav = favorites.includes(String(n.id))
                return (
                  <li
                    key={n.id}
                    className={`flex items-center gap-3 py-3 px-3 rounded-md border border-transparent hover:bg-white/5 hover:border-white/10 ${active ? 'bg-white/10 border-gold-500/30' : ''}`}
                    onClick={()=>onPlayNasheed(n, i)}
                    title="Play"
                  >
                    <span className="text-gold-500"><Headphones /></span>
                    <div className="flex-1">
                      <div className="text-base lg:text-lg font-semibold">{n.title}</div>
                      <div className="text-sm opacity-80">{n.artist}</div>
                    </div>
                    <div className="w-20 lg:w-28 flex items-center justify-end gap-2 shrink-0">
                      <button
                        onClick={async (e) => { e.stopPropagation(); await handleDownload(n); }}
                        className="aj-icon-btn"
                        title="Download"
                      >
                        <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(n.id); }}
                        className={`aj-icon-btn ${fav ? 'is-active' : ''}`}
                        title={fav ? 'Unfavorite' : 'Favorite'}
                        aria-pressed={fav}
                      >
                        <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V13.5C3 13.6818 3.09864 13.8492 3.25762 13.9373C3.41659 14.0254 3.61087 14.0203 3.765 13.924L7.5 11.5896L11.235 13.924C11.3891 14.0203 11.5834 14.0254 11.7424 13.9373C11.9014 13.8492 12 13.6818 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                      </button>
                    </div>
                    {active && (
                      <span className="text-gold-500 text-sm">Playing</span>
                    )}
                  </li>
                )
              })
            )}
            {!listLoading && filtered.length === 0 && (
              <li className="py-10 text-center opacity-70">No nasheeds — Ensure files exist in bucket "nasheed_play" (they can be inside folders), then refresh.</li>
            )}
          </ul>
        </ScrollArea>
      </section>
    </main>
  )
}
