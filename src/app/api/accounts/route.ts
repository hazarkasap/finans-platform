import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { createAccountSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const accounts = await prisma.personalAccount.findMany({
    where: { userId: user!.id, archivedAt: null },
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ accounts });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { name, type, currency, initialBalance } = parsed.data;

  const account = await prisma.personalAccount.create({
    data: {
      userId: user!.id,
      name,
      type,
      currency,
      initialBalance,
    },
  });

  return jsonOk({ account }, 201);
}
