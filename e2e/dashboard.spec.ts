import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("loads and shows stats cards", async ({ page }) => {
    // Page heading should be visible
    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 })
    ).toBeVisible();

    // Welcome subtitle
    await expect(page.getByText("Welcome back")).toBeVisible();

    // Wait for the stats cards to load (4 stat cards using .qy-card)
    const statCards = page.locator(".qy-card");
    await expect(statCards.first()).toBeVisible();

    // Verify all four stat labels are present
    await expect(page.getByText("Active Licenses")).toBeVisible();
    await expect(page.getByText("Bot Requests (24h)")).toBeVisible();
    await expect(page.getByText("Restricted Groups")).toBeVisible();
    await expect(page.getByText("Knowledge Docs")).toBeVisible();
  });

  test("shows recent activity feed", async ({ page }) => {
    // The Recent Activity section heading
    await expect(
      page.getByRole("heading", { name: "Recent Activity" })
    ).toBeVisible();

    // Should display "total events" badge
    await expect(page.getByText("total events")).toBeVisible();

    // Activity entries should be visible (the feed items have actor names)
    // Wait for data to load by checking for the activity container
    const activitySection = page.locator(".lg\\:col-span-2.qy-card");
    await expect(activitySection).toBeVisible();
  });

  test("shows bot status panel", async ({ page }) => {
    // Bot Status heading
    await expect(
      page.getByRole("heading", { name: "Bot Status" })
    ).toBeVisible();

    // Status fields in bot status panel
    await expect(page.getByText("Online")).toBeVisible();
    await expect(page.getByText("14d 6h 32m")).toBeVisible();
    await expect(page.getByText("1.2s")).toBeVisible();
    await expect(page.getByText("94%")).toBeVisible();

    // Connected to Slack workspace
    await expect(
      page.getByText("Connected to Slack workspace")
    ).toBeVisible();
    await expect(page.getByText("SAGA Diagnostics")).toBeVisible();
  });

  test("refresh button works", async ({ page }) => {
    // Wait for initial data to load
    await expect(page.getByText("Active Licenses")).toBeVisible();

    // The refresh button shows a timestamp with the RefreshCw icon
    const refreshButton = page.locator("button").filter({
      has: page.locator("svg.lucide-refresh-cw"),
    });
    await expect(refreshButton).toBeVisible();

    // Click the refresh button
    await refreshButton.click();

    // After refresh, the stats should still be visible (data reloaded)
    await expect(page.getByText("Active Licenses")).toBeVisible();
    await expect(page.getByText("Bot Requests (24h)")).toBeVisible();
  });
});
