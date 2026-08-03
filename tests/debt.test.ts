import { describe, expect, it } from "vitest";
import {
  computeGroupDebts,
  computeNetBalances,
  roundMoney,
  simplifyDebts,
  splitEqually,
} from "../src/lib/debt";

describe("roundMoney", () => {
  it("rounds to 2 decimals", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});

describe("splitEqually", () => {
  it("splits 100 TRY among 3 members", () => {
    const splits = splitEqually(100, ["a", "b", "c"]);
    const total = splits.reduce((s, x) => s + x.owedAmount, 0);
    expect(total).toBe(100);
    expect(splits).toHaveLength(3);
  });
});

describe("computeNetBalances", () => {
  it("balances to zero for two-person equal split", () => {
    const nets = computeNetBalances(
      ["demo_a", "demo_b"],
      [
        {
          paidByUserId: "demo_a",
          splits: [
            { userId: "demo_a", owedAmount: 50 },
            { userId: "demo_b", owedAmount: 50 },
          ],
        },
      ],
    );
    expect(nets.get("demo_a")).toBe(50);
    expect(nets.get("demo_b")).toBe(-50);
    const sum = [...nets.values()].reduce((a, b) => a + b, 0);
    expect(roundMoney(sum)).toBe(0);
  });

  it("applies settlement correctly", () => {
    const nets = computeNetBalances(
      ["demo_a", "demo_b"],
      [
        {
          paidByUserId: "demo_a",
          splits: [
            { userId: "demo_a", owedAmount: 50 },
            { userId: "demo_b", owedAmount: 50 },
          ],
        },
      ],
      [{ fromUserId: "demo_b", toUserId: "demo_a", amount: 50 }],
    );
    expect(nets.get("demo_a")).toBe(0);
    expect(nets.get("demo_b")).toBe(0);
  });
});

describe("simplifyDebts", () => {
  it("reduces cyclic debts to minimal transfers", () => {
    const nets = new Map<string, number>([
      ["a", 100],
      ["b", 0],
      ["c", -100],
    ]);
    const transfers = simplifyDebts(nets);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      fromUserId: "c",
      toUserId: "a",
      amount: 100,
    });
  });

  it("handles three users with at most 2 transfers", () => {
    const nets = new Map<string, number>([
      ["a", 30],
      ["b", 20],
      ["c", -50],
    ]);
    const transfers = simplifyDebts(nets);
    expect(transfers.length).toBeLessThanOrEqual(2);
    const paid = transfers.reduce((s, t) => s + t.amount, 0);
    expect(paid).toBe(50);
  });
});

describe("computeGroupDebts", () => {
  it("integrates net balances and suggestions", () => {
    const { netBalances, suggestedTransfers } = computeGroupDebts(
      ["demo_a", "demo_b", "demo_c"],
      [
        {
          paidByUserId: "demo_a",
          splits: [
            { userId: "demo_a", owedAmount: 90 },
            { userId: "demo_b", owedAmount: 90 },
            { userId: "demo_b", owedAmount: 90 },
          ],
        },
      ],
    );
    expect(netBalances.get("demo_a")).toBe(180);
    expect(netBalances.get("demo_b")).toBe(-90);
    expect(netBalances.get("demo_b")).toBe(-90);
    expect(suggestedTransfers.length).toBeLessThanOrEqual(2);
  });
});
