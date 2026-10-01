import { createClient } from "@supabase/supabase-js";

// Server-side only. Uses the service-role key, so it must never be imported by a client component
// and the key must never be exposed with a NEXT_PUBLIC_ prefix.
export const DEMO = !process.env.SUPABASE_SERVICE_ROLE_KEY;

let client;
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

// Unwrap a supabase-js result: throw on error, return data.
export function must({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function getSettings() {
  if (DEMO) return { default_markup_pct: 7, round_to: 5 };
  const rows = must(await db().from("settings").select("key,value"));
  const s = { default_markup_pct: 7, round_to: 5 };
  for (const r of rows) s[r.key] = isNaN(Number(r.value)) ? r.value : Number(r.value);
  return s;
}

export async function setSetting(key, value) {
  must(await db().from("settings").upsert({ key, value: String(value) }));
}

export async function getCategoryMarkups() {
  if (DEMO) return {};
  const map = {};
  for (const r of must(await db().from("category_markup").select("category,pct"))) map[r.category] = Number(r.pct);
  return map;
}

// Raw text settings (company details etc.) - not number-coerced like getSettings().
export async function getTextSettings(keys) {
  const out = Object.fromEntries(keys.map((k) => [k, ""]));
  if (DEMO) return out;
  for (const r of must(await db().from("settings").select("key,value").in("key", keys))) out[r.key] = r.value ?? "";
  return out;
}
