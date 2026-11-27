import { test, expect } from "@playwright/test";

test("searching from the navbar finds dishes across halls and opens the hall menu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search dishes" }).fill("pancake");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/search\?q=pancake/);
  const results = page.locator(".dish-card");
  await expect(results.first()).toBeVisible();
  for (const result of await results.all()) {
    await expect(result.getByRole("heading")).toContainText(/pancake/i);
  }

  await page.getByRole("link", { name: "Bruin Plate" }).first().click();
  await expect(page.getByRole("heading", { name: "Bruin Plate", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Vegan Pancake", exact: true })).toBeVisible();
});

test("a search with no matches says so", async ({ page }) => {
  await page.goto("/search?q=definitely-not-a-dish");
  await expect(page.getByText("No dishes found")).toBeVisible();
});
