import { NextRequest, NextResponse } from "next/server";
import { getIncident, updateIncident } from "@/lib/db";
import { getTrueForgeClient } from "@/lib/trueforge";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    const body = await req.json();
    const { decision = "approve", reason = "" } = body;

    const incident = await getIncident(incidentId);
    if (!incident || !incident.session_id) {
      return NextResponse.json(
        { success: false, error: "Incident or session not found" },
        { status: 404 }
      );
    }

    const sessionId = incident.session_id;
    const threadId = incident.thread_id || "main";
    const pendingCallId = incident.pending_call_id;
    const checkpointType = incident.pending_call_type || "fix";

    const client = getTrueForgeClient();

    const approvalMessage =
      decision === "approve"
        ? checkpointType === "pull_request"
          ? "Approved. Please proceed with opening the pull request on GitHub."
          : "Approved. Please proceed with drafting and testing the fix in the sandbox."
        : `Denied. Do not proceed. Reason: ${reason || "Action rejected by Incident Commander"}`;

    let turnSent = false;

    // 1. If tool approval ID is present, try tool approval first
    if (pendingCallId) {
      try {
        await client.sessions.createTurn(sessionId, {
          input: [
            {
              type: "user.tool_approval",
              threadId: threadId,
              toolCallId: pendingCallId,
              approval:
                decision === "approve"
                  ? { status: "allow" }
                  : { status: "deny", reason: reason || "Rejected by Incident Commander" },
            },
          ],
        });
        turnSent = true;
      } catch (toolErr) {
        console.warn("Tool approval failed, falling back to conversational message turn:", toolErr);
      }
    }

    // 2. Fall back to conversational user message if tool approval failed or was not needed
    if (!turnSent) {
      await client.sessions.createTurn(sessionId, {
        input: [
          {
            type: "user.message",
            content: approvalMessage,
          },
        ],
      });
    }

    const newStatus = decision === "approve" ? "investigating" : "denied";

    await updateIncident(incidentId, {
      status: newStatus,
      pending_call_id: null,
      pending_call_type: null,
    });

    return NextResponse.json({
      success: true,
      incident_id: incidentId,
      decision,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("Error processing incident approval:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process approval",
      },
      { status: 500 }
    );
  }
}
