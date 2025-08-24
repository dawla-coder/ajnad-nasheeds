import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseBucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'nasheed_play'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey)
}

export async function getSignedOrPublicUrl(pathOrUrl: string) {
  if (!pathOrUrl) return null
  // If already an absolute URL, return it
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  // Else treat as storage path within configured bucket
  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .createSignedUrl(pathOrUrl, 60 * 60) // 1 hour
  if (!error && data?.signedUrl) return data.signedUrl
  // Fallback to public URL (works if bucket/object is public)
  const { data: pub } = supabase.storage.from(supabaseBucket).getPublicUrl(pathOrUrl)
  return pub?.publicUrl || null
}
