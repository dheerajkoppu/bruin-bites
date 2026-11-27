import { expect } from "@playwright/test";

let accountCount = 0;

export async function signUp(page, name) {
  accountCount += 1;
  const username = `${name}${Date.now().toString(36)}${accountCount}`;

  await page.goto("/signup");
  await page.getByLabel("Email").fill(`${username}@ucla.edu`);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("bruin-bites-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();

  return username;
}

export async function rateDish(page, hallName, dishName, groupButton) {
  await page.goto("/");
  await page.getByRole("link", { name: new RegExp(hallName) }).click();
  await page.getByRole("link", { name: dishName, exact: true }).first().click();
  await expect(page.getByRole("heading", { name: dishName, level: 1 })).toBeVisible();
  await page.getByRole("button", { name: groupButton }).click();
  await expect(page.getByText("Rating saved!")).toBeVisible();
}
