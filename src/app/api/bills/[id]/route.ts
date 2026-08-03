import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { updateBillSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonNotFound, jsonOk } from "@/lib/api-response";
import { todayIsoDate } from "@/lib/format";
import { parseDateInput } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: billId } = await context.params;

  const existing = await prisma.bill.findFirst({
    where: { id: billId, userId: user!.id },
  });
  if (!existing) return jsonNotFound("Fatura bulunamadı");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = updateBillSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { status, accountId } = parsed.data;

  if (status === "PAID" && existing.status === "PAID" && existing.linkedTransactionId) {
    return jsonError("Bu fatura zaten ödenmiş", 400);
  }

  if (status === "PAID") {
    const account = await prisma.personalAccount.findFirst({
      where: { id: accountId, userId: user!.id, archivedAt: null },
    });
    if (!account) {
      return jsonError("Hesap bulunamadı veya size ait değil", 400);
    }

    let paymentDate: Date;
    try {
      paymentDate = parseDateInput(todayIsoDate());
    } catch {
      return jsonError("Geçersiz ödeme tarihi", 400);
    }

    const bill = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount: existing.amount,
          type: "EXPENSE",
          date: paymentDate,
          description: `Fatura: ${existing.title}`,
        },
      });

      return tx.bill.update({
        where: { id: billId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          linkedTransactionId: transaction.id,
        },
        include: {
          group: { select: { id: true, name: true } },
          linkedTransaction: {
            include: {
              account: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    return jsonOk({ bill });
  }

  const bill = await prisma.bill.update({
    where: { id: billId },
    data: {
      status,
      paidAt: null,
      linkedTransactionId: null,
    },
    include: {
      group: { select: { id: true, name: true } },
      linkedTransaction: {
        include: {
          account: { select: { id: true, name: true } },
        },
      },
    },
  });

  return jsonOk({ bill });
}
