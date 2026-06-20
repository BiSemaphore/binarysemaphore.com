import { test, expect } from "@playwright/test";

test("homepage loads with the brand heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Binary Semaphore");
});

test("primary nav links are present in the header", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  for (const href of ["/", "/services", "/projects", "/threads"]) {
    await expect(header.locator(`a[href="${href}"]`).first()).toBeVisible();
  }
});

test("key routes return 200", async ({ page }) => {
  for (const path of [
    "/about",
    "/services",
    "/projects",
    "/team",
    "/contact",
    "/threads",
  ]) {
    const res = await page.goto(path);
    expect(res?.status(), `${path} should be 200`).toBe(200);
  }
});

test("the contact email is reachable on the contact page", async ({ page }) => {
  await page.goto("/contact");
  await expect(
    page.locator('a[href^="mailto:"]').first(),
  ).toHaveAttribute("href", /@binarysemaphore\.com$/);
});
