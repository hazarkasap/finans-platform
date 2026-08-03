import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api-response";
import { getPersonalPortfolio } from "@/lib/portfolio";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const portfolio = await getPersonalPortfolio(user!.id);
  return jsonOk(portfolio);
}
