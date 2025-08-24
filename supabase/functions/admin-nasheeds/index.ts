// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*"
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders(origin) } })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const storageBucket = Deno.env.get("AUDIO_BUCKET") || "nasheed_play"
  const allowedEmails = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const adminDb = createClient(supabaseUrl, serviceRoleKey, { db: { schema: 'app_config' } })

  try {
    // Require authenticated user (we don't expose service key to client, this is just a sanity check)
    const authHeader = req.headers.get("Authorization") || ""
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } })
    }

    // Verify user and limit to allowed emails (if ADMIN_EMAILS set)
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await authClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } })
    }
    // Merge env ADMIN_EMAILS with DB-based admins (app_config.admins)
    let mergedAllowed = allowedEmails
    try {
      const { data: rows } = await adminDb
        .from("admins")
        .select("email")
      const dbAllowed = (rows ?? []).map((r: any) => String(r.email || "").trim().toLowerCase()).filter(Boolean)
      if (dbAllowed.length) {
        const set = new Set<string>([...allowedEmails, ...dbAllowed])
        mergedAllowed = Array.from(set)
      }
    } catch { /* table may not exist yet; ignore */ }

    if (mergedAllowed.length > 0) {
      const email = (userData.user.email || "").toLowerCase()
      if (!mergedAllowed.includes(email)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } })
      }
    }

    if (req.method === "POST") {
      const form = await req.formData()
      const title = String(form.get("title") || "").trim()
      const artist = String(form.get("artist") || "").trim()
      const durationRaw = String(form.get("duration") || "").trim()
      const duration = durationRaw ? Number.parseInt(durationRaw, 10) : null
      const audio = form.get("audio") as File | null
      const cover = form.get("cover") as File | null

      if (!title || !artist || !audio) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } })
      }

      const now = Date.now()
      const audioExt = (audio.name?.split(".").pop() || "mp3").toLowerCase()
      const audioPath = `audio/${now}-${crypto.randomUUID()}.${audioExt}`
      const { error: upErr } = await supabase.storage.from(storageBucket).upload(audioPath, audio, {
        contentType: audio.type || "audio/mpeg",
        upsert: false,
      })
      if (upErr) throw upErr

      let coverPath: string | null = null
      if (cover) {
        const coverExt = (cover.name?.split(".").pop() || "jpg").toLowerCase()
        coverPath = `covers/${now}-${crypto.randomUUID()}.${coverExt}`
        const { error: covErr } = await supabase.storage.from(storageBucket).upload(coverPath, cover, {
          contentType: cover.type || "image/jpeg",
          upsert: false,
        })
        if (covErr) throw covErr
      }

      const { data, error } = await supabase
        .from("nasheeds")
        .insert({ title, artist, duration, file_url: audioPath, cover_url: coverPath })
        .select("*")
        .single()
      if (error) throw error

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      })
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => ({} as any))
      const id = String(body.id || "")
      const fileUrl = String(body.file_url || "")
      const coverUrl = body.cover_url ? String(body.cover_url) : null
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } })

      // Delete DB row first
      const { error: delErr } = await supabase.from("nasheeds").delete().eq("id", id)
      if (delErr) throw delErr

      // Best-effort remove files
      if (fileUrl) await supabase.storage.from(storageBucket).remove([fileUrl])
      if (coverUrl) await supabase.storage.from(storageBucket).remove([coverUrl])

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      })
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? String(err) }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    })
  }
})
