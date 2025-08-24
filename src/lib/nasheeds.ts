import { supabase } from './supabaseClient'
import type { Nasheed } from '@/types'

const audioExt = new Set(['mp3','m4a','aac','wav','ogg','flac','webm'])
const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'nasheed_play'

function filterByQ(rows: Nasheed[], q?: string) {
  if (!q || !q.trim()) return rows
  const term = q.trim().toLowerCase()
  return rows.filter(r => `${r.title} ${r.artist}`.toLowerCase().includes(term))
}

async function listFromFn(q?: string, page = 1, limit = 200): Promise<Nasheed[]> {
  try {
    const { data: fnData, error } = await supabase.functions.invoke('nasheeds', {
      body: { q, page, limit },
    })
    if (!error && fnData) {
      const rows = ((fnData as any).data ?? fnData) as Nasheed[]
      return filterByQ(rows ?? [], q)
    }
  } catch {}
  return []
}

async function listFromDb(q?: string, limit = 200): Promise<Nasheed[]> {
  let query = supabase
    .from('nasheeds')
    .select('*')
    .order('created_at', { ascending: false })

  if (q && q.trim()) {
    const term = q.trim()
    query = query.or(`title.ilike.%${term}%,artist.ilike.%${term}%`)
  }

  const { data, error } = await query.limit(limit)
  const rows = (error || !data) ? [] : (data as unknown as Nasheed[])
  return rows
}

type FileObj = { name: string; id?: string | null; updated_at?: string | null; created_at?: string | null; metadata?: any }

async function listFromBucket(q?: string, limit = 200): Promise<Nasheed[]> {
  try {
    const listRecursive = async (prefix: string): Promise<{ path: string; obj: FileObj }[]> => {
      const { data: entries } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: 1000, sortBy: { column: 'updated_at', order: 'desc' } })
      if (!entries) return []
      const out: { path: string; obj: FileObj }[] = []
      for (const e of entries as FileObj[]) {
        const fullPath = prefix ? `${prefix}/${e.name}` : e.name
        const ext = e.name.split('.').pop()?.toLowerCase()
        const isFile = !!ext && audioExt.has(ext)
        if (isFile) out.push({ path: fullPath, obj: e })
        else out.push(...(await listRecursive(fullPath)))
      }
      return out
    }

    const files = await listRecursive('')
    const items: Nasheed[] = files.map(({ path, obj }) => {
      const base = path.split('/').pop() as string
      const nameNoExt = base.replace(/\.[^.]+$/, '')
      let artist = 'AJNAD'
      let title = nameNoExt
      const dash = nameNoExt.split(' - ')
      if (dash.length >= 2) {
        artist = dash[0].trim() || artist
        title = dash.slice(1).join(' - ').trim() || title
      }
      return {
        id: (obj as any).id ?? path,
        title,
        artist,
        duration: null,
        file_url: path,
        cover_url: null,
        created_at: obj.updated_at || obj.created_at || undefined,
      }
    })
    return filterByQ(items, q).slice(0, limit)
  } catch {
    return []
  }
}

function firstNonEmpty<T>(promises: Promise<T[]>[]): Promise<T[]> {
  return new Promise((resolve) => {
    let pending = promises.length
    let lastEmpty: T[] = []
    for (const p of promises) {
      p.then(rows => {
        if (rows && rows.length) {
          resolve(rows)
        } else {
          lastEmpty = rows || []
        }
      }).catch(() => {
        // ignore
      }).finally(() => {
        pending -= 1
        if (pending === 0) resolve(lastEmpty)
      })
    }
  })
}

export async function listNasheeds(params?: { q?: string; page?: number; limit?: number }) {
  const { q, page = 1, limit = 200 } = params ?? {}
  // Fetch all in parallel and return the fastest non-empty
  return await firstNonEmpty([
    listFromFn(q, page, limit),
    listFromDb(q, limit),
    listFromBucket(q, limit),
  ])
}
