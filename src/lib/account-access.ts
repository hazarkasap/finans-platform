import { prisma } from "@/lib/db";

export function getOwnedAccount(userId: string, accountId: string) {
  return prisma.personalAccount.findFirst({
    where: { id: accountId, userId, archivedAt: null },
  });
}
