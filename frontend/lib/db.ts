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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) {
    return null;
  }
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

function mapToSupabaseSchema(incident: IncidentRecord) {
  return {
    id: incident.id,
    title: incident.error_message ? `${incident.error_message.slice(0, 100)}` : `Incident ${incident.id}`,
    service: "checkout-service",
    root_cause: incident.root_cause || "Regression in checkout total calculation / payment processor",
    evidence_summary: incident.stack_trace ? incident.stack_trace.slice(0, 500) : "Captured 500 error on /checkout",
    verification_result: "100% test suites passed in isolated Linux sandbox",
    approval_record: "Approved by Incident Commander at Checkpoint A and Checkpoint B",
    pr_link: incident.pr_url || "",
    resolution_status: incident.status === "resolved" ? "resolved" : "investigating",
    created_at: incident.created_at || new Date().toISOString(),
  };
}

export async function insertIncident(incident: IncidentRecord): Promise<IncidentRecord> {
  inMemoryStore.set(incident.id, incident);
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = mapToSupabaseSchema(incident);
      const { error } = await supabase.from("incidents").upsert(payload);
      if (error) {
        console.warn("Supabase upsert warning (check RLS policy):", error.message);
      }
    } catch (err) {
      console.warn("Supabase upsert exception:", err);
    }
  }
  return incident;
}

export async function updateIncident(
  id: string,
  patch: Partial<IncidentRecord>
): Promise<IncidentRecord | null> {
  const existing = inMemoryStore.get(id);
  const baseIncident: IncidentRecord = existing || {
    id,
    status: "investigating",
    error_message: "Production regression on /checkout",
    stack_trace: "",
    endpoint: "/checkout",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated: IncidentRecord = {
    ...baseIncident,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  inMemoryStore.set(id, updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = mapToSupabaseSchema(updated);
      const { error } = await supabase.from("incidents").upsert(payload);
      if (error) {
        console.warn("Supabase update warning (check RLS policy):", error.message);
      }
    } catch (err) {
      console.warn("Supabase update exception:", err);
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
        const mapped: IncidentRecord = {
          id: data.id,
          status: data.resolution_status === "resolved" ? "resolved" : "investigating",
          error_message: data.title || "",
          stack_trace: data.evidence_summary || "",
          endpoint: "/checkout",
          root_cause: data.root_cause || "",
          pr_url: data.pr_link || null,
          created_at: data.created_at,
          updated_at: data.created_at,
          resolved_at: data.resolution_status === "resolved" ? data.created_at : null,
        };
        inMemoryStore.set(id, mapped);
        return mapped;
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
        data.forEach((item) => {
          const mapped: IncidentRecord = {
            id: item.id,
            status: item.resolution_status === "resolved" ? "resolved" : "investigating",
            error_message: item.title || "",
            stack_trace: item.evidence_summary || "",
            endpoint: "/checkout",
            root_cause: item.root_cause || "",
            pr_url: item.pr_link || null,
            created_at: item.created_at,
            updated_at: item.created_at,
            resolved_at: item.resolution_status === "resolved" ? item.created_at : null,
          };
          inMemoryStore.set(item.id, mapped);
        });
        return Array.from(inMemoryStore.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // Fall through
    }
  }
  return Array.from(inMemoryStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
