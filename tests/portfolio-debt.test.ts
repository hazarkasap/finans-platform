import { describe, expect, it } from "vitest";

import {
  computePairwiseBalances,
  getNetBetweenUsers,
} from "@/lib/debt";

describe("computePairwiseBalances", () => {
  it("creates debt from non-payer to payer on equal split", () => {
    const balances = computePairwiseBalances(
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

    expect(getNetBetweenUsers(balances, "demo_a", "demo_b")).toBe(50);
    expect(getNetBetweenUsers(balances, "demo_b", "demo_a")).toBe(-50);
  });

  it("clears debt after settlement", () => {
    const balances = computePairwiseBalances(
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

    expect(getNetBetweenUsers(balances, "demo_a", "demo_b")).toBe(0);
  });

  it("handles multi-payer expenses", () => {
    const balances = computePairwiseBalances(
      ["demo_a", "demo_b"],
      [
        {
          payments: [
            { userId: "demo_a", paidAmount: 60 },
            { userId: "demo_b", paidAmount: 40 },
          ],
          splits: [
            { userId: "demo_a", owedAmount: 50 },
            { userId: "demo_b", owedAmount: 50 },
          ],
        },
      ],
    );

    expect(getNetBetweenUsers(balances, "demo_a", "demo_b")).toBe(10);
  });
});
