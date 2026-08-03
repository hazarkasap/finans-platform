import { expect, test } from "@playwright/test";

test("a synthetic user can register and reach the protected dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Görünen ad").fill("Browser Demo User");
  await page.getByLabel("E-posta").fill("browser.demo@example.com");
  await page.getByLabel("Şifre (en az 8 karakter)").fill("browser-demo-password");
  await page.getByRole("button", { name: "Kayıt ol" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Özet" })).toBeVisible();
  await expect(page.getByText("browser.demo@example.com")).toBeVisible();
});
