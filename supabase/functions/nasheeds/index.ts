// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*"
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders(origin) } })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Forward the caller's Authorization so RLS applies as the user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    })

    const { q, page = 1, limit = 50 } = await req.json().catch(() => ({} as any))
    const from = Math.max(0, (Number(page) - 1) * Number(limit))
    const to = Math.max(from, from + Number(limit) - 1)

    let query = supabase
      .from("nasheeds")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (q && String(q).trim().length > 0) {
      const term = String(q).trim()
      // Search title OR artist
      query = query.or(`title.ilike.%${term}%,artist.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? String(err) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || "*") },
      status: 400,
    })
  }
})
