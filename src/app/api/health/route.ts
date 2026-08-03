import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "finance-showcase",
    scope: "local-educational-source",
  });
}
