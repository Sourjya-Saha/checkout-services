import { NextRequest, NextResponse } from "next/server";
import { getTrueForgeClient, SENTINELOPS_AGENT_SPEC } from "@/lib/trueforge";
import { insertIncident, updateIncident, IncidentRecord } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      error_message = "500 Internal Server Error",
      stack_trace = "Unhandled Exception in payment_processor.py",
      endpoint = "/checkout",
      timestamp = new Date().toISOString(),
    } = body;

    const incidentId = `INC-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialRecord: IncidentRecord = {
      id: incidentId,
      status: "reported",
      error_message,
      stack_trace,
      endpoint,
      session_id: null,
      turn_id: null,
      thread_id: null,
      pending_call_id: null,
      pending_call_type: null,
      root_cause: null,
      pr_url: null,
      created_at: timestamp,
      updated_at: new Date().toISOString(),
      resolved_at: null,
    };

    await insertIncident(initialRecord);

    // Construct prompt template filled in with real incident data
    const promptContent = `A user reported that guest checkouts are failing with a 500 error on ${endpoint}. The stack trace shows: ${stack_trace}\nError message: ${error_message}\nInvestigate this incident using the incident-runbook, and ask for my approval before proposing or taking any fix.`;

    const client = getTrueForgeClient();

    // 1. Create a new session using the saved SentinelOps agent from Agents Library
    let sessionRes: any;
    try {
      sessionRes = await client.sessions.create({
        agent: {
          id: SENTINELOPS_AGENT_ID,
        } as any,
      });
    } catch {
      sessionRes = await client.sessions.create({
        agent: {
          name: SENTINELOPS_AGENT_NAME,
          spec: SENTINELOPS_AGENT_SPEC as any,
        } as any,
      });
    }

    const sessionId = (sessionRes as any).id || (sessionRes as any).data?.id;

    // 2. Start turn asynchronously without blocking
    const turnRes = await client.sessions.createTurn(sessionId, {
      input: [
        {
          type: "user.message",
          content: promptContent,
        },
      ],
    });

    const turnId = (turnRes as any).id || (turnRes as any).data?.id;

    // 3. Update incident record to "investigating"
    await updateIncident(incidentId, {
      session_id: sessionId,
      turn_id: turnId,
      status: "investigating",
    });

    return NextResponse.json({
      success: true,
      id: incidentId,
      session_id: sessionId,
      turn_id: turnId,
      status: "investigating",
    });
  } catch (error: any) {
    console.error("Error creating incident report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create incident report",
      },
      { status: 500 }
    );
  }
}
