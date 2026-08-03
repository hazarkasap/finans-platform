import { describe, expect, it } from "vitest";
import {
  allNetsZero,
  buildExpenseSplits,
  computeGroupDebts,
  computeNetBalances,
  splitByPercentage,
  splitByShares,
  splitEqually,
} from "../src/lib/debt";

describe("splitByPercentage", () => {
  it("splits 200 by 60/40", () => {
    const splits = splitByPercentage(200, [
      { userId: "a", percent: 60 },
      { userId: "b", percent: 40 },
    ]);
    const total = splits.reduce((s, x) => s + x.owedAmount, 0);
    expect(total).toBe(200);
    expect(splits.find((s) => s.userId === "a")?.owedAmount).toBe(120);
    expect(splits.find((s) => s.userId === "b")?.owedAmount).toBe(80);
  });
});

describe("splitByShares", () => {
  it("splits 200 by 2:1:1 shares", () => {
    const splits = splitByShares(200, [
      { userId: "a", shares: 2 },
      { userId: "b", shares: 1 },
      { userId: "c", shares: 1 },
    ]);
    const total = splits.reduce((s, x) => s + x.owedAmount, 0);
    expect(total).toBe(200);
    expect(splits.find((s) => s.userId === "a")?.owedAmount).toBe(100);
  });
});

describe("buildExpenseSplits", () => {
  it("EXACT 150+50", () => {
    const splits = buildExpenseSplits({
      splitType: "EXACT",
      totalAmount: 200,
      participantIds: ["a", "b"],
      splits: [
        { userId: "a", owedAmount: 150 },
        { userId: "b", owedAmount: 50 },
      ],
    });
    expect(splits.reduce((s, x) => s + x.owedAmount, 0)).toBe(200);
  });

  it("allows zero share for non-participant via EXACT", () => {
    const splits = buildExpenseSplits({
      splitType: "EXACT",
      totalAmount: 100,
      participantIds: ["a"],
      splits: [{ userId: "a", owedAmount: 100 }],
    });
    expect(splits).toHaveLength(1);
    expect(splits[0].owedAmount).toBe(100);
  });
});

describe("multi-payer computeNetBalances", () => {
  it("applies multiple payments", () => {
    const nets = computeNetBalances(
      ["a", "b"],
      [
        {
          payments: [
            { userId: "a", paidAmount: 120 },
            { userId: "b", paidAmount: 80 },
          ],
          splits: [
            { userId: "a", owedAmount: 150 },
            { userId: "b", owedAmount: 50 },
          ],
        },
      ],
    );
    expect(nets.get("a")).toBe(-30);
    expect(nets.get("b")).toBe(30);
  });
});

describe("B/A expense netting (regression)", () => {
  const members = ["b", "a"];

  const expense1 = {
    payments: [{ userId: "a", paidAmount: 200 }],
    splits: splitEqually(200, members),
  };

  const expense2 = {
    payments: [{ userId: "b", paidAmount: 200 }],
    splits: splitEqually(200, members),
  };

  it("nets to zero after offsetting expenses", () => {
    const { netBalances, suggestedTransfers } = computeGroupDebts(members, [
      expense1,
      expense2,
    ]);
    expect(netBalances.get("b")).toBe(0);
    expect(netBalances.get("a")).toBe(0);
    expect(allNetsZero(netBalances)).toBe(true);
    expect(suggestedTransfers).toHaveLength(0);
  });

  it("shows debt after first expense only", () => {
    const nets = computeNetBalances(members, [expense1]);
    expect(nets.get("b")).toBe(-100);
    expect(nets.get("a")).toBe(100);
  });
});

describe("participant subset", () => {
  it("equal split only among selected members", () => {
    const splits = splitEqually(100, ["a", "b"]);
    expect(splits).toHaveLength(2);
    expect(splits.every((s) => s.owedAmount === 50)).toBe(true);
  });
});
