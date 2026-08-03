/**
 * Grup borç hesaplama — saf fonksiyonlar (veritabanından bağımsız).
 *
 * Giderler otomatik mahsup eder: ödeyen(ler) net bakiyeye +ödeme, pay sahipleri −pay.
 * Settlement yalnızca gruptaki nakit transfer kaydı içindir.
 */

export type Money = number;

export type SplitTypeKind = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export interface ExpenseInput {
  /** @deprecated Tek ödeyen; payments yoksa kullanılır */
  paidByUserId?: string;
  payments?: { userId: string; paidAmount: Money }[];
  splits: { userId: string; owedAmount: Money }[];
}

export interface SettlementInput {
  fromUserId: string;
  toUserId: string;
  amount: Money;
}

export interface SuggestedTransfer {
  fromUserId: string;
  toUserId: string;
  amount: Money;
}

export class DebtValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DebtValidationError";
  }
}

const ROUND_FACTOR = 100;
const TOLERANCE = 0.01;

/** İki ondalık TRY yuvarlama */
export function roundMoney(value: Money): Money {
  return Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;
}

export function amountsMatch(a: Money, b: Money, tolerance = TOLERANCE): boolean {
  return Math.abs(roundMoney(a) - roundMoney(b)) <= tolerance;
}

function resolvePayments(expense: ExpenseInput): { userId: string; paidAmount: Money }[] {
  if (expense.payments?.length) {
    return expense.payments;
  }
  if (expense.paidByUserId) {
    const total = expense.splits.reduce((s, sp) => s + sp.owedAmount, 0);
    return [{ userId: expense.paidByUserId, paidAmount: total }];
  }
  return [];
}

/**
 * Her kullanıcı için net bakiye.
 * net > 0 → gruptan alacaklı; net < 0 → gruptan borçlu.
 */
export function computeNetBalances(
  memberIds: string[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[] = [],
): Map<string, Money> {
  const nets = new Map<string, Money>();
  for (const id of memberIds) {
    nets.set(id, 0);
  }

  for (const expense of expenses) {
    const payments = resolvePayments(expense);
    for (const payment of payments) {
      nets.set(
        payment.userId,
        roundMoney((nets.get(payment.userId) ?? 0) + payment.paidAmount),
      );
    }

    for (const split of expense.splits) {
      nets.set(
        split.userId,
        roundMoney((nets.get(split.userId) ?? 0) - split.owedAmount),
      );
    }
  }

  for (const s of settlements) {
    nets.set(
      s.fromUserId,
      roundMoney((nets.get(s.fromUserId) ?? 0) + s.amount),
    );
    nets.set(
      s.toUserId,
      roundMoney((nets.get(s.toUserId) ?? 0) - s.amount),
    );
  }

  return nets;
}

/**
 * Eşit bölüşüm: kuruş farkı son katılımcıya yazılır.
 */
export function splitEqually(
  totalAmount: Money,
  participantIds: string[],
): { userId: string; owedAmount: Money }[] {
  if (participantIds.length === 0) return [];
  const n = participantIds.length;
  const base = roundMoney(Math.floor((totalAmount * ROUND_FACTOR) / n) / ROUND_FACTOR);
  const splits = participantIds.map((userId) => ({ userId, owedAmount: base }));
  const assigned = roundMoney(base * n);
  const remainder = roundMoney(totalAmount - assigned);
  if (remainder !== 0) {
    const last = splits[splits.length - 1];
    last.owedAmount = roundMoney(last.owedAmount + remainder);
  }
  return splits;
}

export function splitByPercentage(
  totalAmount: Money,
  entries: { userId: string; percent: number }[],
): { userId: string; owedAmount: Money }[] {
  if (entries.length === 0) return [];
  const totalPercent = roundMoney(entries.reduce((s, e) => s + e.percent, 0));
  if (!amountsMatch(totalPercent, 100)) {
    throw new DebtValidationError("Yüzdelerin toplamı %100 olmalı");
  }

  const splits = entries.map((e) => ({
    userId: e.userId,
    owedAmount: roundMoney((totalAmount * e.percent) / 100),
  }));
  const assigned = roundMoney(splits.reduce((s, x) => s + x.owedAmount, 0));
  const remainder = roundMoney(totalAmount - assigned);
  if (remainder !== 0) {
    splits[splits.length - 1].owedAmount = roundMoney(
      splits[splits.length - 1].owedAmount + remainder,
    );
  }
  return splits;
}

export function splitByShares(
  totalAmount: Money,
  entries: { userId: string; shares: number }[],
): { userId: string; owedAmount: Money }[] {
  if (entries.length === 0) return [];
  const totalShares = entries.reduce((s, e) => s + e.shares, 0);
  if (totalShares <= 0) {
    throw new DebtValidationError("Hisse toplamı pozitif olmalı");
  }

  const splits = entries.map((e) => ({
    userId: e.userId,
    owedAmount: roundMoney((totalAmount * e.shares) / totalShares),
  }));
  const assigned = roundMoney(splits.reduce((s, x) => s + x.owedAmount, 0));
  const remainder = roundMoney(totalAmount - assigned);
  if (remainder !== 0) {
    splits[splits.length - 1].owedAmount = roundMoney(
      splits[splits.length - 1].owedAmount + remainder,
    );
  }
  return splits;
}

export interface BuildExpenseSplitsInput {
  splitType: SplitTypeKind;
  totalAmount: Money;
  participantIds: string[];
  splits?: { userId: string; owedAmount: Money }[];
  percentages?: { userId: string; percent: number }[];
  shares?: { userId: string; shares: number }[];
}

export function buildExpenseSplits(
  input: BuildExpenseSplitsInput,
): { userId: string; owedAmount: Money }[] {
  const { splitType, totalAmount, participantIds } = input;

  if (participantIds.length === 0) {
    throw new DebtValidationError("En az bir katılımcı seçilmeli");
  }

  let result: { userId: string; owedAmount: Money }[];

  switch (splitType) {
    case "EQUAL":
      result = splitEqually(totalAmount, participantIds);
      break;
    case "EXACT": {
      if (!input.splits?.length) {
        throw new DebtValidationError("EXACT bölüşüm için tutarlar gerekli");
      }
      for (const id of participantIds) {
        if (!input.splits.some((s) => s.userId === id)) {
          throw new DebtValidationError("Tüm katılımcılar için tutar girilmeli");
        }
      }
      const sum = roundMoney(input.splits.reduce((a, s) => a + s.owedAmount, 0));
      if (!amountsMatch(sum, totalAmount)) {
        throw new DebtValidationError("Payların toplamı gider tutarına eşit olmalı");
      }
      result = input.splits.filter((s) => participantIds.includes(s.userId));
      break;
    }
    case "PERCENTAGE": {
      if (!input.percentages?.length) {
        throw new DebtValidationError("PERCENTAGE bölüşüm için yüzdeler gerekli");
      }
      const filtered = input.percentages.filter((p) => participantIds.includes(p.userId));
      result = splitByPercentage(totalAmount, filtered);
      break;
    }
    case "SHARES": {
      if (!input.shares?.length) {
        throw new DebtValidationError("SHARES bölüşüm için hisseler gerekli");
      }
      const filtered = input.shares.filter((s) => participantIds.includes(s.userId));
      result = splitByShares(totalAmount, filtered);
      break;
    }
    default:
      throw new DebtValidationError("Geçersiz bölüşüm tipi");
  }

  return result;
}

export function normalizePayments(
  totalAmount: Money,
  payments: { userId: string; paidAmount: Money }[] | undefined,
  paidByUserId: string | undefined,
): { userId: string; paidAmount: Money }[] {
  if (payments?.length) {
    const sum = roundMoney(payments.reduce((a, p) => a + p.paidAmount, 0));
    if (!amountsMatch(sum, totalAmount)) {
      throw new DebtValidationError("Ödemelerin toplamı gider tutarına eşit olmalı");
    }
    return payments;
  }
  if (paidByUserId) {
    return [{ userId: paidByUserId, paidAmount: totalAmount }];
  }
  throw new DebtValidationError("En az bir ödeme veya ödeyen gerekli");
}

export function primaryPayerUserId(
  payments: { userId: string; paidAmount: Money }[],
): string {
  return payments.reduce((best, p) =>
    p.paidAmount > best.paidAmount ? p : best,
  ).userId;
}

export function expenseToDebtInput(expense: {
  paidByUserId: string;
  totalAmount: Money;
  payments?: { userId: string; paidAmount: Money }[];
  splits: { userId: string; owedAmount: Money }[];
}): ExpenseInput {
  return {
    payments:
      expense.payments?.length ?
        expense.payments
      : [{ userId: expense.paidByUserId, paidAmount: expense.totalAmount }],
    splits: expense.splits,
  };
}

/**
 * Greedy borç sadeleştirme (Splitwise "simplify debts").
 */
export function simplifyDebts(nets: Map<string, Money>): SuggestedTransfer[] {
  type Entry = { userId: string; amount: Money };
  const creditors: Entry[] = [];
  const debtors: Entry[] = [];

  for (const [userId, net] of nets) {
    const rounded = roundMoney(net);
    if (rounded > 0) creditors.push({ userId, amount: rounded });
    else if (rounded < 0) debtors.push({ userId, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SuggestedTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const pay = roundMoney(Math.min(creditors[i].amount, debtors[j].amount));
    if (pay > 0) {
      transfers.push({
        fromUserId: debtors[j].userId,
        toUserId: creditors[i].userId,
        amount: pay,
      });
    }
    creditors[i].amount = roundMoney(creditors[i].amount - pay);
    debtors[j].amount = roundMoney(debtors[j].amount - pay);
    if (creditors[i].amount <= 0) i++;
    if (debtors[j].amount <= 0) j++;
  }

  return transfers;
}

export function computeGroupDebts(
  memberIds: string[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[] = [],
): {
  netBalances: Map<string, Money>;
  suggestedTransfers: SuggestedTransfer[];
} {
  const netBalances = computeNetBalances(memberIds, expenses, settlements);
  const suggestedTransfers = simplifyDebts(netBalances);
  return { netBalances, suggestedTransfers };
}

/** Kişiden kişiye borç matrisi: balance.get(debtor).get(creditor) = debtor'un creditor'a borcu */
export type PairwiseBalances = Map<string, Map<string, Money>>;

function ensurePairwiseRow(
  balances: PairwiseBalances,
  userId: string,
): Map<string, Money> {
  let row = balances.get(userId);
  if (!row) {
    row = new Map();
    balances.set(userId, row);
  }
  return row;
}

function getPairwiseDebt(
  balances: PairwiseBalances,
  debtor: string,
  creditor: string,
): Money {
  return balances.get(debtor)?.get(creditor) ?? 0;
}

function setPairwiseDebt(
  balances: PairwiseBalances,
  debtor: string,
  creditor: string,
  amount: Money,
) {
  if (amount <= TOLERANCE) {
    balances.get(debtor)?.delete(creditor);
    return;
  }
  ensurePairwiseRow(balances, debtor).set(creditor, roundMoney(amount));
}

function addPairwiseDebt(
  balances: PairwiseBalances,
  debtor: string,
  creditor: string,
  amount: Money,
) {
  if (debtor === creditor || amount <= 0) return;
  setPairwiseDebt(
    balances,
    debtor,
    creditor,
    roundMoney(getPairwiseDebt(balances, debtor, creditor) + amount),
  );
}

/** Karşılıklı borçları tek yönde netleştirir */
export function netPairwiseBalances(balances: PairwiseBalances): void {
  const seen = new Set<string>();

  for (const [debtor, creditors] of balances) {
    for (const [creditor, amount] of creditors) {
      const key = [debtor, creditor].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);

      const reverse = getPairwiseDebt(balances, creditor, debtor);
      const net = roundMoney(amount - reverse);
      balances.get(debtor)?.delete(creditor);
      balances.get(creditor)?.delete(debtor);

      if (net > TOLERANCE) {
        setPairwiseDebt(balances, debtor, creditor, net);
      } else if (net < -TOLERANCE) {
        setPairwiseDebt(balances, creditor, debtor, -net);
      }
    }
  }
}

function adjustPairwiseDebt(
  balances: PairwiseBalances,
  debtor: string,
  creditor: string,
  delta: Money,
) {
  const current = getPairwiseDebt(balances, debtor, creditor);
  const reverse = getPairwiseDebt(balances, creditor, debtor);
  const net = roundMoney(current - reverse + delta);

  balances.get(debtor)?.delete(creditor);
  balances.get(creditor)?.delete(debtor);

  if (net > TOLERANCE) {
    setPairwiseDebt(balances, debtor, creditor, net);
  } else if (net < -TOLERANCE) {
    setPairwiseDebt(balances, creditor, debtor, -net);
  }
}

/**
 * Gider ve mahsuplardan kişiden kişiye borç matrisi.
 * Sonuç netleştirilmiş tek yönlü borçları içerir.
 */
export function computePairwiseBalances(
  memberIds: string[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[] = [],
): PairwiseBalances {
  const balances: PairwiseBalances = new Map();
  for (const id of memberIds) {
    ensurePairwiseRow(balances, id);
  }

  for (const expense of expenses) {
    const payments = resolvePayments(expense);
    const totalPaid = roundMoney(
      payments.reduce((sum, payment) => sum + payment.paidAmount, 0),
    );
    if (totalPaid <= 0) continue;

    for (const split of expense.splits) {
      if (split.owedAmount <= 0) continue;
      for (const payment of payments) {
        const share = roundMoney(
          (split.owedAmount * payment.paidAmount) / totalPaid,
        );
        if (share <= 0 || split.userId === payment.userId) continue;
        addPairwiseDebt(balances, split.userId, payment.userId, share);
      }
    }
  }

  netPairwiseBalances(balances);

  for (const settlement of settlements) {
    adjustPairwiseDebt(
      balances,
      settlement.fromUserId,
      settlement.toUserId,
      -settlement.amount,
    );
  }

  return balances;
}

/**
 * İki kişi arasındaki net borç.
 * Pozitif → `counterparty` kullanıcısının `userId`'ye borcu var.
 */
export function getNetBetweenUsers(
  balances: PairwiseBalances,
  userId: string,
  counterpartyId: string,
): Money {
  const theyOweMe = getPairwiseDebt(balances, counterpartyId, userId);
  const iOweThem = getPairwiseDebt(balances, userId, counterpartyId);
  return roundMoney(theyOweMe - iOweThem);
}

export function allNetsZero(
  nets: Map<string, Money>,
  tolerance = TOLERANCE,
): boolean {
  for (const net of nets.values()) {
    if (Math.abs(roundMoney(net)) > tolerance) return false;
  }
  return true;
}
