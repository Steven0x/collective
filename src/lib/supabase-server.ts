import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-backed client for Server Components, Route Handlers and Server Actions.
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => { try { all.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only in RSC */ } },
    },
  });
}

export type Profile = { user_id: string; email: string; display_name: string; role: "collector" | "artist" | "curator"; artist_id: string | null };

export async function currentUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profile: null };
  const { data: profile } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  return { sb, user, profile: profile as Profile | null };
}
