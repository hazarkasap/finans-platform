import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { prisma } from "@/lib/db";
import { getOwnedAccount } from "@/lib/account-access";
import { requireGroupMember } from "@/lib/group-access";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("resource isolation", () => {
  const ownerEmail = "isolation.owner@example.com";
  const outsiderEmail = "isolation.outsider@example.com";
  let ownerId = "";
  let outsiderId = "";
  let accountId = "";
  let groupId = "";

  beforeAll(async () => {
    const owner = await prisma.user.create({ data: { email: ownerEmail } });
    const outsider = await prisma.user.create({ data: { email: outsiderEmail } });
    ownerId = owner.id;
    outsiderId = outsider.id;
    const account = await prisma.personalAccount.create({
      data: { userId: owner.id, name: "Synthetic isolated account", type: "CASH" },
    });
    accountId = account.id;
    const group = await prisma.group.create({
      data: {
        name: "Synthetic isolated group",
        createdById: owner.id,
        memberships: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    groupId = group.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, outsiderEmail] } } });
    await prisma.$disconnect();
  });

  test("personal accounts are accessible only to their owner", async () => {
    expect(await getOwnedAccount(ownerId, accountId)).not.toBeNull();
    expect(await getOwnedAccount(outsiderId, accountId)).toBeNull();
  });

  test("group membership is required", async () => {
    expect((await requireGroupMember(ownerId, groupId)).error).toBeNull();
    const outsider = await requireGroupMember(outsiderId, groupId);
    expect(outsider.membership).toBeNull();
    expect(outsider.error?.status).toBe(403);
  });
});
