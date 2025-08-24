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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    })

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("favorites")
        .select("id, nasheed_id")
      if (error) throw error
      return new Response(JSON.stringify({ data }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        status: 200,
      })
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as any))
      const action = (body?.action as string | undefined)?.toLowerCase() ?? "toggle"

      if (action === "list") {
        const { data, error } = await supabase
          .from("favorites")
          .select("id, nasheed_id")
        if (error) throw error
        return new Response(JSON.stringify({ data }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          status: 200,
        })
      }

      const nasheed_id = body?.nasheed_id as string | undefined
      if (!nasheed_id) {
        return new Response(JSON.stringify({ error: "nasheed_id required" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          status: 400,
        })
      }

      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "AUTH_REQUIRED" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          status: 401,
        })
      }

      const userId = userData.user.id

      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("nasheed_id", nasheed_id)
        .maybeSingle()

      if (existing) {
        const { error: delErr } = await supabase.from("favorites").delete().eq("id", existing.id)
        if (delErr) throw delErr
        return new Response(JSON.stringify({ favored: false }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          status: 200,
        })
      } else {
        const { error: insErr } = await supabase.from("favorites").insert({ user_id: userId, nasheed_id })
        if (insErr) throw insErr
        return new Response(JSON.stringify({ favored: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          status: 200,
        })
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      status: 405,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? String(err) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin") || "*") },
      status: 400,
    })
  }
})
