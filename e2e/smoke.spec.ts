import { test, expect } from "@playwright/test";

test("landing page renders the pitch and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Certificates of Authenticity/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Create a certificate/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
});

test("login page offers email, phone and wallet methods", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  // Email tab (default)
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByText(/agree to the/i)).toBeVisible();

  // Phone tab
  await page.getByRole("button", { name: "Phone", exact: true }).click();
  await expect(page.getByPlaceholder("+14155551234")).toBeVisible();

  // Wallet tab
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Continue with wallet/i }),
  ).toBeVisible();
});

test("protected routes redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unknown verification id returns 404", async ({ page }) => {
  const res = await page.goto("/verify/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("legal pages carry the draft notice", async ({ page }) => {
  await page.goto("/legal/terms");
  await expect(page.getByText(/Draft template/i)).toBeVisible();
  await page.goto("/legal/privacy");
  await expect(page.getByText(/Draft template/i)).toBeVisible();
});
