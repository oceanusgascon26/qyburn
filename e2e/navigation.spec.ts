import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("all sidebar links navigate correctly", async ({ page }) => {
    await page.goto("/dashboard");

    const navItems = [
      { name: "Dashboard", path: "/dashboard" },
      { name: "License Catalog", path: "/dashboard/licenses" },
      { name: "Restricted Groups", path: "/dashboard/groups" },
      { name: "Onboarding", path: "/dashboard/onboarding" },
      { name: "Audit Log", path: "/dashboard/audit" },
      { name: "Knowledge Base", path: "/dashboard/knowledge" },
      { name: "Bot Activity", path: "/dashboard/activity" },
      { name: "Settings", path: "/dashboard/settings" },
    ];

    for (const item of navItems) {
      // Click the sidebar link (desktop sidebar is visible at lg breakpoint)
      const sidebarLink = page
        .locator("aside")
        .locator("nav")
        .getByRole("link", { name: item.name });
      await sidebarLink.click();

      // Wait for navigation to complete
      await page.waitForURL(`**${item.path}`);
      expect(page.url()).toContain(item.path);
    }
  });

  test("breadcrumbs update on navigation", async ({ page }) => {
    // Go to Dashboard - breadcrumb should show "Dashboard"
    await page.goto("/dashboard");
    const breadcrumbNav = page.locator("header nav");
    await expect(breadcrumbNav.getByText("Dashboard")).toBeVisible();

    // Navigate to Licenses
    await page.goto("/dashboard/licenses");
    await expect(breadcrumbNav.getByText("License Catalog")).toBeVisible();

    // Navigate to Groups
    await page.goto("/dashboard/groups");
    await expect(breadcrumbNav.getByText("Restricted Groups")).toBeVisible();

    // Navigate to Audit Log
    await page.goto("/dashboard/audit");
    await expect(breadcrumbNav.getByText("Audit Log")).toBeVisible();

    // Navigate to Knowledge Base
    await page.goto("/dashboard/knowledge");
    await expect(breadcrumbNav.getByText("Knowledge Base")).toBeVisible();

    // Navigate to Bot Activity
    await page.goto("/dashboard/activity");
    await expect(breadcrumbNav.getByText("Bot Activity")).toBeVisible();

    // Navigate to Settings
    await page.goto("/dashboard/settings");
    await expect(breadcrumbNav.getByText("Settings")).toBeVisible();
  });

  test("home redirects to dashboard", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /dashboard
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // Dashboard heading should be visible
    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 })
    ).toBeVisible();
  });

  test("page titles are correct", async ({ page }) => {
    const pages = [
      { path: "/dashboard", heading: "Dashboard" },
      { path: "/dashboard/licenses", heading: "License Catalog" },
      { path: "/dashboard/groups", heading: "Restricted Groups" },
      { path: "/dashboard/onboarding", heading: "Onboarding Templates" },
      { path: "/dashboard/audit", heading: "Audit Log" },
      { path: "/dashboard/knowledge", heading: "Knowledge Base" },
      { path: "/dashboard/activity", heading: "Bot Activity" },
      { path: "/dashboard/settings", heading: "Settings" },
    ];

    for (const pg of pages) {
      await page.goto(pg.path);
      await expect(
        page.getByRole("heading", { name: pg.heading, level: 1 })
      ).toBeVisible();
    }
  });
});
