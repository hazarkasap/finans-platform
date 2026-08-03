import { describe, expect, it } from "vitest";

import {
  aggregateByCategory,
  aggregateByMonth,
} from "@/lib/expense-aggregates";

describe("expense aggregates", () => {
  const sample = [
    {
      category: "FOOD",
      date: "2025-01-15",
      totalAmount: 100,
    },
    {
      category: "FOOD",
      date: "2025-02-10",
      totalAmount: 50,
    },
    {
      category: "MARKET",
      date: "2025-02-20",
      totalAmount: 200,
    },
  ];

  it("aggregates by category", () => {
    const result = aggregateByCategory(sample);
    const food = result.find((r) => r.category === "FOOD");
    const market = result.find((r) => r.category === "MARKET");
    expect(food?.total).toBe(150);
    expect(food?.count).toBe(2);
    expect(market?.total).toBe(200);
  });

  it("aggregates by month", () => {
    const result = aggregateByMonth(sample);
    expect(result).toHaveLength(2);
    expect(result[0].total).toBe(100);
    expect(result[1].total).toBe(250);
  });
});
