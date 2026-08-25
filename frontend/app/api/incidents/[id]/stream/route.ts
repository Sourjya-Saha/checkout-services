import { NextRequest } from "next/server";
import { getIncident, updateIncident } from "@/lib/db";
import { TRUEFORGE_BASE_URL } from "@/lib/trueforge";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const incidentId = params.id;
  const incident = await getIncident(incidentId);

  if (!incident || !incident.session_id) {
    return new Response(
      `data: ${JSON.stringify({
        type: "error",
        message: "Incident or TrueForge session not found",
      })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  const sessionId = incident.session_id;

  // Create an SSE stream that proxies live TrueForge events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection event with current incident state
      sendEvent({
        type: "incident.state",
        incident,
      });

      let isClosed = false;
      let lastSeenEventId = "";
      const seenEventIds = new Set<string>();

      const pollInterval = setInterval(async () => {
        if (isClosed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const eventsRes = await fetch(
            `${TRUEFORGE_BASE_URL}/api/v1/sessions/${sessionId}/events?limit=50`,
            { cache: "no-store" }
          );

          if (!eventsRes.ok) return;

          const json = await eventsRes.json();
          const items = (json.data || []).reverse(); // Oldest to newest

          for (const item of items) {
            const event = item.event;
            const turnId = item.turn_id;
            const eventId = event.id || `${turnId}-${event.type}`;

            if (seenEventIds.has(eventId)) continue;
            seenEventIds.add(eventId);

            // 1. Check for Tool Approval Required Event
            if (event.type === "tool.approval_required") {
              const pendingCall = event.tool_calls?.[0];
              const pendingCallId = pendingCall?.id;
              const sourceEventId = pendingCall?.source_event_id;
              const threadId = event.thread_id || "main";

              // Inspect the source model message to determine if it's PR or Fix checkpoint
              let checkpointType: "fix" | "pull_request" = "fix";
              try {
                const turnEventsRes = await fetch(
                  `${TRUEFORGE_BASE_URL}/api/v1/sessions/${sessionId}/turns/${turnId}/events`,
                  { cache: "no-store" }
                );
                if (turnEventsRes.ok) {
                  const turnJson = await turnEventsRes.json();
                  const sourceMsg = (turnJson.data || []).find(
                    (e: any) => e.id === sourceEventId
                  );
                  const toolCalls = sourceMsg?.tool_calls || [];
                  const toolArgsStr =
                    toolCalls[0]?.function?.arguments || "";
                  const toolName = toolCalls[0]?.function?.name || "";

                  if (
                    toolArgsStr.includes("create_pull_request") ||
                    toolArgsStr.includes("push_files") ||
                    toolArgsStr.includes("create_branch") ||
                    toolName.includes("pull_request")
                  ) {
                    checkpointType = "pull_request";
                  } else {
                    checkpointType = "fix";
                  }
                }
              } catch (e) {
                console.warn("Could not inspect source message for approval:", e);
              }

              const newStatus =
                checkpointType === "pull_request"
                  ? "awaiting_pr_approval"
                  : "awaiting_fix_approval";

              await updateIncident(incidentId, {
                status: newStatus,
                pending_call_id: pendingCallId,
                pending_call_type: checkpointType,
                thread_id: threadId,
              });

              sendEvent({
                ...event,
                turn_id: turnId,
                checkpoint_type: checkpointType,
                pending_call_id: pendingCallId,
                thread_id: threadId,
              });
              continue;
            }

            // 2. Check for PR Link in Model Messages or Tool Responses
            if (event.type === "model.message" || event.type === "tool.response") {
              const text =
                typeof event.content === "string"
                  ? event.content
                  : JSON.stringify(event);
              const prMatch = text.match(
                /https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+/
              );
              if (prMatch && prMatch[0]) {
                await updateIncident(incidentId, {
                  pr_url: prMatch[0],
                });
              }
            }

            // 3. Check for Turn Done Event
            if (event.type === "turn.done") {
              const isTerminal =
                event.state?.status === "done" &&
                !items.some((i: any) => i.event.type === "tool.approval_required");

              if (isTerminal) {
                await updateIncident(incidentId, {
                  status: "resolved",
                  resolved_at: new Date().toISOString(),
                });
              }
            }

            // Re-emit event to frontend
            sendEvent({
              ...event,
              turn_id: turnId,
            });
          }
        } catch (err) {
          console.error("SSE stream polling error:", err);
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
