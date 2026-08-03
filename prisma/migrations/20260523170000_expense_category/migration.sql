-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MARKET', 'FOOD', 'RENT', 'UTILITIES', 'TRANSPORT', 'ENTERTAINMENT', 'HEALTH', 'TRAVEL', 'OTHER');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER';
