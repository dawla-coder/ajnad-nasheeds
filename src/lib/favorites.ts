import { supabase } from './supabaseClient'

export type FavoriteRow = {
  id: string
  user_id: string
  nasheed_id: string
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function listFavoritesMap() {
  const user = await getCurrentUser()
  if (!user) return new Map<string, string>()
  // Try Edge Function first
  try {
    const { data: sessionRes } = await supabase.auth.getSession()
    const token = sessionRes.session?.access_token
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('favorites', {
      body: { action: 'list' },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!fnErr && fnData) {
      const rows = ((fnData as any).data ?? fnData) as Array<{ id: string; nasheed_id: string }>
      const map = new Map<string, string>()
      for (const row of rows ?? []) map.set(row.nasheed_id, row.id)
      return map
    }
  } catch {}

  // Fallback to direct query
  const { data, error } = await supabase
    .from('favorites')
    .select('id, nasheed_id')
    .eq('user_id', user.id)
  if (error || !data) return new Map<string, string>()
  const map = new Map<string, string>()
  for (const row of data) map.set(row.nasheed_id, row.id)
  return map
}

export async function toggleFavorite(nasheedId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('AUTH_REQUIRED')
  // Try Edge Function first
  try {
    const { data: sessionRes } = await supabase.auth.getSession()
    const token = sessionRes.session?.access_token
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('favorites', {
      body: { action: 'toggle', nasheed_id: nasheedId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!fnErr && fnData) {
      return Boolean((fnData as any).favored)
    }
  } catch {}

  // Fallback to direct table operations
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('nasheed_id', nasheedId)
    .maybeSingle()
  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, nasheed_id: nasheedId })
    return true
  }
}
