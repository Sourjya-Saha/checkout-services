import { TrueForge } from "@truefoundry/trueforge-sdk";

export const TRUEFORGE_BASE_URL =
  process.env.TRUEFORGE_URL || process.env.NEXT_PUBLIC_TRUEFORGE_URL || "http://localhost:8790";

export const SENTINELOPS_AGENT_ID = "01m0xm9dhsn96bffa5kqhjy5f4";
export const SENTINELOPS_AGENT_NAME = "sentinelops";

let _client: TrueForge | null = null;

export function getTrueForgeClient(): TrueForge {
  if (!_client) {
    _client = new TrueForge({
      baseUrl: TRUEFORGE_BASE_URL,
    });
  }
  return _client;
}

export const SENTINELOPS_AGENT_SPEC = {
  model: {
    name: "openai/gpt-5-4-mini",
    params: {
      reasoning_effort: "low",
    },
  },
  instructions:
    "You are SentinelOps, the autonomous incident commander for the checkout-services application. Always load and follow the incident-runbook skill when investigating a reported incident, and the rollback-playbook skill when evaluating rollback vs forward-fix. Never take a write action without the required approval checkpoint.",
  mcp_servers: [
    {
      name: "github",
      enable_tools: [],
      disable_tools: [],
      preload_tools: [],
      require_approval_for_tools: [],
      preload: true,
    },
    {
      name: "supabase",
      enable_tools: [],
      disable_tools: [],
      preload_tools: [],
      require_approval_for_tools: [],
      preload: true,
    },
  ],
  skills: [
    {
      name: "incident-runbook",
    },
    {
      name: "rollback-playbook",
    },
  ],
  config: {
    iteration_limit: 100,
    sandbox: {
      enabled: true,
      file_downloads: true,
    },
    dynamic_sub_agents: {
      enabled: true,
    },
    context_management: {
      compaction: { enabled: true },
      large_tool_response: { enabled: true },
    },
    generative_ui: {
      enabled: true,
    },
    ask_user_questions: {
      enabled: true,
    },
  },
};
