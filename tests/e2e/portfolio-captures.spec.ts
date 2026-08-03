import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const output = "test-results/portfolio-screenshots";

test("capture synthetic portfolio views", async ({ page }) => {
  await mkdir(output, { recursive: true });
  await page.goto("/login");
  await page.getByLabel("E-posta").fill("demo.owner@example.com");
  await page.getByLabel("Şifre").fill("local-demo-password");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Özet", exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/finance-dashboard.png`, fullPage: true });

  await page.goto("/groups");
  await expect(page.getByRole("heading", { name: "Gruplar" })).toBeVisible();
  await expect(page.getByText("Synthetic Shared Household")).toBeVisible();
  await page.screenshot({ path: `${output}/finance-groups.png`, fullPage: true });

  await page.getByText("Synthetic Shared Household").click();
  await expect(page.getByText("Synthetic grocery example")).toBeVisible();
  await page.screenshot({ path: `${output}/finance-group-detail.png`, fullPage: true });
});
