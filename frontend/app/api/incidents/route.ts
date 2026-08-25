import { NextResponse } from "next/server";
import { listIncidents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const incidents = await listIncidents();
    return NextResponse.json({
      success: true,
      incidents,
      latest: incidents[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
