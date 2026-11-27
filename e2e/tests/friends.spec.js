import { test, expect } from "@playwright/test";
import { rateDish, signUp } from "./helpers.js";

test("following a friend shows their rankings in the friends feed", async ({ browser }) => {
  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  const friendName = await signUp(friendPage, "friend");
  await rateDish(friendPage, "Feast", "Kare Kare Beef", "It was fine");
  await friendContext.close();

  const context = await browser.newContext();
  const page = await context.newPage();
  await signUp(page, "follower");

  await page.getByRole("link", { name: "Friends Feed" }).click();
  await expect(page.getByText(/You aren't following anyone yet/)).toBeVisible();

  await page.getByRole("link", { name: "Find friends" }).click();
  await page.getByRole("searchbox", { name: "Find friends" }).fill(friendName);
  await page.getByRole("button", { name: "Search users" }).click();
  await page.getByRole("button", { name: `Follow ${friendName}` }).click();
  await expect(page.getByRole("button", { name: `Following ${friendName}` })).toBeVisible();

  await page.getByRole("link", { name: "Friends Feed" }).click();
  const feedItem = page.getByRole("list", { name: "Friends' newest rankings" }).getByRole("listitem").first();
  await expect(feedItem).toContainText(`${friendName} ranked Kare Kare Beef in It was fine.`);

  await feedItem.getByRole("link", { name: friendName }).click();
  await expect(page.getByRole("heading", { name: `${friendName}'s ratings` })).toBeVisible();
  await expect(page.getByText("Kare Kare Beef")).toBeVisible();

  await context.close();
});
