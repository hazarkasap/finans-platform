import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { getOwnedAccount } from "@/lib/account-access";
import { createTransactionSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonNotFound, jsonOk } from "@/lib/api-response";
import { parseDateInput } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: accountId } = await context.params;
  const account = await getOwnedAccount(user!.id, accountId);
  if (!account) return jsonNotFound("Hesap bulunamadı");

  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: { date: "desc" },
  });

  return jsonOk({ account, transactions });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: accountId } = await context.params;
  const account = await getOwnedAccount(user!.id, accountId);
  if (!account) return jsonNotFound("Hesap bulunamadı");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { amount, type, date, description, counterpartyAccountId } =
    parsed.data;

  if (counterpartyAccountId) {
    const counterparty = await getOwnedAccount(user!.id, counterpartyAccountId);
    if (!counterparty) {
      return jsonError("Karşı hesap bulunamadı veya size ait değil", 400);
    }
  }

  let transactionDate: Date;
  try {
    transactionDate = parseDateInput(date);
  } catch {
    return jsonError("Geçersiz tarih", 400);
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      amount,
      type,
      date: transactionDate,
      description,
      counterpartyAccountId: counterpartyAccountId ?? null,
    },
  });

  return jsonOk({ transaction }, 201);
}
