import { test, expect } from "@playwright/test";
import { rateDish, signUp } from "./helpers.js";

test("a new user rates and ranks dishes, then sees the scores on their profile", async ({ page }) => {
  await signUp(page, "rater");

  await rateDish(page, "De Neve", "Belgian Waffles", "Liked it");

  // The second liked dish is compared against the first to find its spot
  await page.goto("/");
  await page.getByRole("link", { name: /De Neve/ }).click();
  await page.getByRole("link", { name: "Huevos Rancheros", exact: true }).click();
  await page.getByRole("button", { name: "Liked it" }).click();
  await expect(page.getByRole("heading", { name: "Which was better?" })).toBeVisible();
  await page.getByRole("button", { name: "Huevos Rancheros" }).click();
  await expect(page.getByText("Rating saved!")).toBeVisible();

  await page.getByRole("link", { name: /^rater/ }).click();
  const likedDishes = page.getByRole("list", { name: "Liked it ranked dishes" });
  const rankedItems = likedDishes.getByRole("listitem");
  await expect(rankedItems).toHaveCount(2);
  await expect(rankedItems.nth(0)).toContainText("Huevos Rancheros");
  await expect(rankedItems.nth(0)).toContainText("10.0 / 10");
  await expect(rankedItems.nth(1)).toContainText("Belgian Waffles");

  // Rankings come from the server, so they are still there after a reload
  await page.reload();
  await expect(rankedItems).toHaveCount(2);
});

test("logged-out visitors are sent to log in when they try to rate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Epicuria/ }).click();
  await page.getByRole("link", { name: "4 Cheese Baked Lasagna", exact: true }).click();
  await page.getByRole("button", { name: "Liked it" }).click();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
