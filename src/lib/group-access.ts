import { prisma } from "@/lib/db";
import { jsonForbidden, jsonNotFound } from "@/lib/api-response";

export async function getMembership(userId: string, groupId: string) {
  return prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

export async function requireGroupMember(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return { group: null, membership: null, error: jsonNotFound("Grup bulunamadı") };
  }

  const membership = await getMembership(userId, groupId);
  if (!membership) {
    return {
      group,
      membership: null,
      error: jsonForbidden("Bu grubun üyesi değilsiniz"),
    };
  }

  return { group, membership, error: null };
}

export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const memberships = await prisma.membership.findMany({
    where: { groupId },
    select: { userId: true },
  });
  return memberships.map((m) => m.userId);
}
