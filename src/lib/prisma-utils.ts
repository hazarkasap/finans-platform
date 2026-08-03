import type { Decimal } from "@prisma/client/runtime/library";

export function decimalToNumber(value: Decimal | number | string): number {
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function parseDateInput(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }
  return date;
}
