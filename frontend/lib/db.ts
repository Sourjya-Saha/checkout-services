import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface IncidentRecord {
  id: string;
  status:
    | "reported"
    | "investigating"
    | "awaiting_fix_approval"
    | "awaiting_pr_approval"
    | "resolved"
    | "denied";
  error_message: string;
  stack_trace: string;
  endpoint: string;
  session_id?: string | null;
  turn_id?: string | null;
  thread_id?: string | null;
  pending_call_id?: string | null;
  pending_call_type?: "fix" | "pull_request" | null;
  root_cause?: string | null;
  pr_url?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

// Global in-memory cache shared across Next.js API routes
declare global {
  var __sentinelops_incidents: Map<string, IncidentRecord> | undefined;
}

if (!global.__sentinelops_incidents) {
  global.__sentinelops_incidents = new Map<string, IncidentRecord>();
}

const inMemoryStore = global.__sentinelops_incidents;

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) {
    return null;
  }
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function insertIncident(incident: IncidentRecord): Promise<IncidentRecord> {
  inMemoryStore.set(incident.id, incident);
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("incidents").upsert(incident);
    } catch (err) {
      console.warn("Supabase upsert warning:", err);
    }
  }
  return incident;
}

export async function updateIncident(
  id: string,
  patch: Partial<IncidentRecord>
): Promise<IncidentRecord | null> {
  const existing = inMemoryStore.get(id);
  if (!existing) {
    return null;
  }
  const updated: IncidentRecord = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  inMemoryStore.set(id, updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("incidents").upsert(updated);
    } catch (err) {
      console.warn("Supabase upsert warning:", err);
    }
  }
  return updated;
}

export async function getIncident(id: string): Promise<IncidentRecord | null> {
  if (inMemoryStore.has(id)) {
    return inMemoryStore.get(id)!;
  }
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.from("incidents").select("*").eq("id", id).single();
      if (data) {
        inMemoryStore.set(id, data);
        return data;
      }
    } catch {
      // Fall through
    }
  }
  return null;
}

export async function listIncidents(): Promise<IncidentRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        data.forEach((item) => inMemoryStore.set(item.id, item));
        return data;
      }
    } catch {
      // Fall through
    }
  }
  return Array.from(inMemoryStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
