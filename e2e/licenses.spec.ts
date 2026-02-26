import { test, expect } from "@playwright/test";

test.describe("Licenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/licenses");
  });

  test("loads and shows license table", async ({ page }) => {
    // Page heading
    await expect(
      page.getByRole("heading", { name: "License Catalog", level: 1 })
    ).toBeVisible();

    // Subtitle shows license count and cost
    await expect(page.getByText(/licenses/)).toBeVisible();
    await expect(page.getByText(/\/mo estimated cost/)).toBeVisible();

    // The table should be visible with expected column headers
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    await expect(table.getByText("License", { exact: false })).toBeVisible();
    await expect(table.getByText("Vendor")).toBeVisible();
    await expect(table.getByText("SKU")).toBeVisible();
    await expect(table.getByText("Seat Usage")).toBeVisible();
    await expect(table.getByText("Cost/Seat")).toBeVisible();
    await expect(table.getByText("Auto-Approve")).toBeVisible();
    await expect(table.getByText("Actions")).toBeVisible();

    // Should have at least one row in the table body
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("search filters licenses", async ({ page }) => {
    // Wait for table to load
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    // Count initial rows
    const initialCount = await table.locator("tbody tr").count();
    expect(initialCount).toBeGreaterThan(0);

    // Type a search term into the search input
    const searchInput = page.getByPlaceholder("Search licenses...");
    await expect(searchInput).toBeVisible();

    // Search for something that likely won't match anything
    await searchInput.fill("zzzznonexistent");

    // Table should disappear and show "No matches found"
    await expect(page.getByText("No matches found")).toBeVisible();

    // Clear search
    await searchInput.fill("");

    // Table should reappear
    await expect(table).toBeVisible();
  });

  test("add license modal opens and submits", async ({ page }) => {
    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "License Catalog", level: 1 })
    ).toBeVisible();

    // Click the Add License button
    const addButton = page.locator(".qy-btn-primary").filter({
      hasText: "Add License",
    });
    await addButton.click();

    // Modal should open with the title "Add License"
    await expect(
      page.getByRole("heading", { name: "Add License" })
    ).toBeVisible();
    await expect(
      page.getByText("Add a new software license to the catalog.")
    ).toBeVisible();

    // Fill in the form
    await page.getByPlaceholder("e.g. Microsoft 365 E3").fill("Test License");
    await page.getByPlaceholder("e.g. Microsoft").fill("Test Vendor");
    await page.getByPlaceholder("M365-E3").fill("TST-001");

    // Set total seats
    const totalSeatsInput = page.locator('input[type="number"]').first();
    await totalSeatsInput.fill("50");

    // Submit the form
    const submitButton = page.locator(".qy-btn-primary").filter({
      hasText: "Add License",
    });
    await submitButton.click();

    // Modal should close and the new license should appear in the table
    await expect(page.getByText("Test License")).toBeVisible();
    await expect(page.getByText("Test Vendor")).toBeVisible();
  });

  test("edit license updates values", async ({ page }) => {
    // Wait for table to load
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    // Click the Edit button on the first row (pencil icon)
    const editButton = table
      .locator("tbody tr")
      .first()
      .locator('button[title="Edit"]');
    await editButton.click();

    // Edit modal should open
    await expect(
      page.getByRole("heading", { name: "Edit License" })
    ).toBeVisible();

    // Modify the name field
    const nameInput = page.getByPlaceholder("e.g. Microsoft 365 E3");
    await nameInput.fill("");
    await nameInput.fill("Updated License Name");

    // Click Save Changes
    const saveButton = page.locator(".qy-btn-primary").filter({
      hasText: "Save Changes",
    });
    await saveButton.click();

    // The updated name should appear in the table
    await expect(page.getByText("Updated License Name")).toBeVisible();
  });

  test("delete license with confirmation", async ({ page }) => {
    // Wait for table to load
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    // Get the name of the first license for later verification
    const firstRow = table.locator("tbody tr").first();
    const licenseName = await firstRow
      .locator("td")
      .first()
      .locator("p.font-medium")
      .textContent();

    // Click the Delete button on the first row (trash icon)
    const deleteButton = firstRow.locator('button[title="Delete"]');
    await deleteButton.click();

    // Confirm dialog should appear
    await expect(
      page.getByRole("heading", { name: "Delete License" })
    ).toBeVisible();
    await expect(page.getByText("Are you sure you want to delete")).toBeVisible();

    // Click the Delete confirmation button
    const confirmButton = page.locator(".qy-btn-danger").filter({
      hasText: "Delete",
    });
    await confirmButton.click();

    // The license name should no longer appear in the table (or may have been removed)
    // Wait a moment for the table to re-render
    await page.waitForTimeout(500);

    // The deleted license should not be in the table anymore
    if (licenseName) {
      const remainingRows = table.locator("tbody tr").filter({
        has: page.locator(`text="${licenseName}"`),
      });
      expect(await remainingRows.count()).toBe(0);
    }
  });
});
