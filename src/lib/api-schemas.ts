import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalı");

const positiveAmount = z.coerce.number().positive("Tutar pozitif olmalı");

export const createGroupSchema = z.object({
  name: z.string().min(1, "Grup adı gerekli").max(120),
  defaultCurrency: z.string().length(3).default("TRY"),
  memberIds: z.array(z.string().min(1)).optional(),
});

const splitEntry = z.object({
  userId: z.string().min(1),
  owedAmount: z.coerce.number().min(0),
});

const percentEntry = z.object({
  userId: z.string().min(1),
  percent: z.coerce.number().positive(),
});

const shareEntry = z.object({
  userId: z.string().min(1),
  shares: z.coerce.number().positive(),
});

const paymentEntry = z.object({
  userId: z.string().min(1),
  paidAmount: positiveAmount,
});

export const createExpenseSchema = z
  .object({
    totalAmount: positiveAmount,
    paidByUserId: z.string().min(1).optional(),
    description: z.string().max(500).optional(),
    date: dateString,
    currency: z.string().length(3).default("TRY"),
    category: z
      .enum([
        "MARKET",
        "FOOD",
        "RENT",
        "UTILITIES",
        "TRANSPORT",
        "ENTERTAINMENT",
        "HEALTH",
        "TRAVEL",
        "OTHER",
      ])
      .default("OTHER"),
    splitType: z
      .enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"])
      .default("EQUAL"),
    participantIds: z.array(z.string().min(1)).optional(),
    splits: z.array(splitEntry).optional(),
    percentages: z.array(percentEntry).optional(),
    shares: z.array(shareEntry).optional(),
    payments: z.array(paymentEntry).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.payments?.length && !data.paidByUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ödeyen veya payments dizisi gerekli",
        path: ["paidByUserId"],
      });
    }
    if (data.splitType === "EXACT" && !data.splits?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EXACT bölüşüm için splits gerekli",
        path: ["splits"],
      });
    }
    if (data.splitType === "PERCENTAGE" && !data.percentages?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PERCENTAGE bölüşüm için percentages gerekli",
        path: ["percentages"],
      });
    }
    if (data.splitType === "SHARES" && !data.shares?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SHARES bölüşüm için shares gerekli",
        path: ["shares"],
      });
    }
  });

export const createSettlementSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: positiveAmount,
  date: dateString,
  currency: z.string().length(3).default("TRY"),
  note: z.string().max(500).optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["CASH", "BANK", "INVESTMENT"]),
  currency: z.string().length(3).default("TRY"),
  initialBalance: z.coerce.number().default(0),
});

export const createTransactionSchema = z.object({
  amount: positiveAmount,
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  date: dateString,
  description: z.string().max(500).optional(),
  counterpartyAccountId: z.string().optional(),
});

export const createBillSchema = z.object({
  title: z.string().min(1).max(200),
  amount: positiveAmount,
  dueDate: dateString,
  currency: z.string().length(3).default("TRY"),
  groupId: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(120),
});

export const addMemberSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
});

export const updateBillSchema = z
  .object({
    status: z.enum(["PENDING", "PAID", "OVERDUE"]),
    accountId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "PAID" && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ödeme için bir hesap seçin",
        path: ["accountId"],
      });
    }
  });
