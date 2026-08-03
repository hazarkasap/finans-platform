import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { createBillSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonForbidden, jsonOk } from "@/lib/api-response";
import { getMembership } from "@/lib/group-access";
import { parseDateInput } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const groupId = request.nextUrl.searchParams.get("groupId") ?? undefined;

  if (groupId) {
    const membership = await getMembership(user!.id, groupId);
    if (!membership) {
      return jsonForbidden("Bu grubun faturalarını görüntüleyemezsiniz");
    }
  }

  const bills = await prisma.bill.findMany({
    where: {
      userId: user!.id,
      ...(groupId ? { groupId } : {}),
    },
    include: {
      group: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return jsonOk({ bills });
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

  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { title, amount, dueDate, currency, groupId, status } = parsed.data;

  if (groupId) {
    const membership = await getMembership(user!.id, groupId);
    if (!membership) {
      return jsonForbidden("Faturayı ilişkilendirdiğiniz gruba üye değilsiniz");
    }
  }

  let due: Date;
  try {
    due = parseDateInput(dueDate);
  } catch {
    return jsonError("Geçersiz vade tarihi", 400);
  }

  const bill = await prisma.bill.create({
    data: {
      userId: user!.id,
      title,
      amount,
      currency,
      dueDate: due,
      groupId: groupId ?? null,
      status: status ?? "PENDING",
    },
    include: {
      group: { select: { id: true, name: true } },
    },
  });

  return jsonOk({ bill }, 201);
}
