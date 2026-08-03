import { MembershipRole, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const demoPassword = "local-demo-password";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_SYNTHETIC_SEED !== "true") {
    throw new Error("Synthetic seeding requires non-production mode and ALLOW_SYNTHETIC_SEED=true.");
  }

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const [owner, member] = await Promise.all([
    prisma.user.upsert({
      where: { email: "demo.owner@example.com" },
      update: { displayName: "Demo Owner" },
      create: {
        email: "demo.owner@example.com",
        displayName: "Demo Owner",
        passwordHash,
        locale: "en",
      },
    }),
    prisma.user.upsert({
      where: { email: "demo.member@example.com" },
      update: { displayName: "Demo Member" },
      create: {
        email: "demo.member@example.com",
        displayName: "Demo Member",
        passwordHash,
        locale: "en",
      },
    }),
  ]);

  const group = await prisma.group.upsert({
    where: { id: "synthetic-demo-group" },
    update: {},
    create: {
      id: "synthetic-demo-group",
      name: "Synthetic Shared Household",
      createdById: owner.id,
      memberships: {
        create: [
          { userId: owner.id, role: MembershipRole.OWNER },
          { userId: member.id, role: MembershipRole.MEMBER },
        ],
      },
    },
  });

  const expense = await prisma.expense.findFirst({
    where: { groupId: group.id, description: "Synthetic grocery example" },
  });
  if (!expense) {
    await prisma.expense.create({
      data: {
        groupId: group.id,
        paidByUserId: owner.id,
        totalAmount: 120,
        date: new Date("2026-01-15T00:00:00Z"),
        description: "Synthetic grocery example",
        category: "MARKET",
        payments: { create: [{ userId: owner.id, paidAmount: 120 }] },
        splits: {
          create: [
            { userId: owner.id, owedAmount: 60 },
            { userId: member.id, owedAmount: 60 },
          ],
        },
      },
    });
  }

  const account = await prisma.personalAccount.upsert({
    where: { id: "synthetic-demo-account" },
    update: {},
    create: {
      id: "synthetic-demo-account",
      userId: owner.id,
      name: "Synthetic Cash Account",
      type: "CASH",
      initialBalance: 500,
    },
  });
  const transaction = await prisma.transaction.findFirst({
    where: { accountId: account.id, description: "Synthetic transport example" },
  });
  if (!transaction) {
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        amount: 35,
        type: "EXPENSE",
        date: new Date("2026-01-16T00:00:00Z"),
        description: "Synthetic transport example",
      },
    });
  }
  await prisma.bill.upsert({
    where: { id: "synthetic-demo-bill" },
    update: {},
    create: {
      id: "synthetic-demo-bill",
      userId: owner.id,
      title: "Synthetic utility reminder",
      amount: 75,
      dueDate: new Date("2026-02-01T00:00:00Z"),
    },
  });

  console.log("Synthetic demo data created for demo.owner@example.com.");
}

main().finally(() => prisma.$disconnect());
