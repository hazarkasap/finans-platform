export function formatMoney(amount: number, currency = "TRY"): string {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === "TRY") return `${formatted} ₺`;
  return `${formatted} ${currency}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function userLabel(
  user: { displayName?: string | null; email: string },
): string {
  return user.displayName?.trim() || user.email;
}
