import { test, expect } from "@playwright/test";

test.describe("Groups Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/groups");
  });

  test("loads with table", async ({ page }) => {
    // Page heading
    await expect(
      page.getByRole("heading", { name: "Restricted Groups", level: 1 })
    ).toBeVisible();

    // Subtitle shows group count and pending requests
    await expect(page.getByText(/groups/)).toBeVisible();
    await expect(page.getByText(/pending/)).toBeVisible();

    // The table should be visible with column headers
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    await expect(table.getByText("Group")).toBeVisible();
    await expect(table.getByText("Azure Group ID")).toBeVisible();
    await expect(table.getByText("Approver")).toBeVisible();
    await expect(table.getByText("Justification")).toBeVisible();
    await expect(table.getByText("Requests")).toBeVisible();
    await expect(table.getByText("Actions")).toBeVisible();

    // Should have at least one row
    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("pending requests banner shows", async ({ page }) => {
    // The pending requests banner should be visible
    await expect(
      page.getByRole("heading", { name: /Pending Access Requests/ })
    ).toBeVisible();

    // Each pending request should show the requester email and "wants to join"
    await expect(page.getByText("wants to join").first()).toBeVisible();

    // Should have Approve and Deny buttons
    await expect(
      page.locator(".qy-btn-accent").filter({ hasText: "Approve" }).first()
    ).toBeVisible();
    await expect(
      page.locator(".qy-btn-danger").filter({ hasText: "Deny" }).first()
    ).toBeVisible();
  });

  test("approve request action", async ({ page }) => {
    // Wait for pending requests to load
    await expect(
      page.getByRole("heading", { name: /Pending Access Requests/ })
    ).toBeVisible();

    // Count pending requests before action
    const pendingItems = page.locator(".qy-btn-accent").filter({
      hasText: "Approve",
    });
    const initialCount = await pendingItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click the first Approve button
    await pendingItems.first().click();

    // After approval, wait for re-render
    await page.waitForTimeout(500);

    // The count of approve buttons should decrease by one
    const newCount = await page
      .locator(".qy-btn-accent")
      .filter({ hasText: "Approve" })
      .count();
    expect(newCount).toBe(initialCount - 1);
  });

  test("deny request action", async ({ page }) => {
    // Wait for pending requests to load
    await expect(
      page.getByRole("heading", { name: /Pending Access Requests/ })
    ).toBeVisible();

    // Count pending requests before action
    const denyButtons = page.locator(".qy-btn-danger").filter({
      hasText: "Deny",
    });
    const initialCount = await denyButtons.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click the first Deny button
    await denyButtons.first().click();

    // After denial, wait for re-render
    await page.waitForTimeout(500);

    // The count of deny buttons should decrease by one
    const newCount = await page
      .locator(".qy-btn-danger")
      .filter({ hasText: "Deny" })
      .count();
    expect(newCount).toBe(initialCount - 1);
  });

  test("add group modal", async ({ page }) => {
    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Restricted Groups", level: 1 })
    ).toBeVisible();

    // Click Add Group button
    const addButton = page.locator(".qy-btn-primary").filter({
      hasText: "Add Group",
    });
    await addButton.click();

    // Modal should open
    await expect(
      page.getByRole("heading", { name: "Add Restricted Group" })
    ).toBeVisible();
    await expect(
      page.getByText("Groups defined here will require approval for membership.")
    ).toBeVisible();

    // Fill in the form
    await page
      .getByPlaceholder("e.g. SG-Engineering-Admin")
      .fill("SG-Test-Group");
    await page
      .getByPlaceholder("group-xxx-xxx")
      .fill("group-test-123");
    await page.getByPlaceholder("approver@saga.com").fill("test@saga.com");

    // Submit
    const submitButton = page.locator(".qy-btn-primary").filter({
      hasText: "Add Group",
    });
    await submitButton.click();

    // Modal should close and new group should appear in the table
    await expect(page.getByText("SG-Test-Group")).toBeVisible();
  });
});
