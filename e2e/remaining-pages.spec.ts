import { test, expect } from "@playwright/test";

test.describe("Onboarding Page", () => {
  test("loads with templates", async ({ page }) => {
    await page.goto("/dashboard/onboarding");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Onboarding Templates", level: 1 })
    ).toBeVisible();

    // Subtitle shows template count and total steps
    await expect(page.getByText(/template/)).toBeVisible();
    await expect(page.getByText(/total steps/)).toBeVisible();

    // Should have template cards (using .qy-card)
    const templateCards = page.locator(".qy-card");
    await expect(templateCards.first()).toBeVisible();

    // Each template card should have a name and department info
    // "View steps" or "Hide steps" button should be present
    await expect(page.getByText("View steps").first()).toBeVisible();

    // The New Template button should be visible
    await expect(
      page.locator(".qy-btn-primary").filter({ hasText: "New Template" })
    ).toBeVisible();

    // Test expanding a template to see steps
    await page.getByText("View steps").first().click();
    await expect(page.getByText("Step 1")).toBeVisible();

    // Collapse it
    await page.getByText("Hide steps").first().click();
  });
});

test.describe("Audit Log Page", () => {
  test("loads with filters", async ({ page }) => {
    await page.goto("/dashboard/audit");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Audit Log", level: 1 })
    ).toBeVisible();

    // Subtitle shows total events
    await expect(page.getByText(/total events/)).toBeVisible();

    // Search input should be visible
    const searchInput = page.getByPlaceholder("Search logs...");
    await expect(searchInput).toBeVisible();

    // Filter dropdowns should be present
    const actionFilter = page.locator("select").filter({
      has: page.locator('option[value="all"]'),
    });
    await expect(actionFilter.first()).toBeVisible();

    // The table should be visible with column headers
    const table = page.locator(".qy-table");
    await expect(table).toBeVisible();

    await expect(table.getByText("Action")).toBeVisible();
    await expect(table.getByText("Actor")).toBeVisible();
    await expect(table.getByText("Target")).toBeVisible();
    await expect(table.getByText("Channel")).toBeVisible();
    await expect(table.getByText("Time")).toBeVisible();

    // Should have audit log entries
    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);

    // Test the action filter dropdown
    const allActionsSelect = page.locator("select").first();
    await allActionsSelect.selectOption({ index: 1 });

    // Table should still be visible (filtered results)
    await expect(table).toBeVisible();

    // Reset filter
    await allActionsSelect.selectOption("all");

    // Test search
    await searchInput.fill("nonexistent-query-xyz");
    await expect(
      page.getByText("No matching entries")
    ).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(table).toBeVisible();
  });
});

test.describe("Knowledge Base Page", () => {
  test("loads with documents", async ({ page }) => {
    await page.goto("/dashboard/knowledge");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Knowledge Base", level: 1 })
    ).toBeVisible();

    // Subtitle shows document count and word count
    await expect(page.getByText(/documents/)).toBeVisible();
    await expect(page.getByText(/words indexed/)).toBeVisible();

    // Search input
    const searchInput = page.getByPlaceholder("Search documents...");
    await expect(searchInput).toBeVisible();

    // Category filter pills should be present (at least "All" button)
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();

    // Document cards should be visible
    const documentCards = page.locator(".qy-card");
    await expect(documentCards.first()).toBeVisible();

    // Each document card should have a "Preview content" button
    await expect(page.getByText("Preview content").first()).toBeVisible();

    // Add Document button
    await expect(
      page.locator(".qy-btn-primary").filter({ hasText: "Add Document" })
    ).toBeVisible();

    // Test expanding a document to see content
    await page.getByText("Preview content").first().click();
    await expect(page.getByText("Hide content").first()).toBeVisible();
  });
});

test.describe("Bot Activity Page", () => {
  test("loads with stats", async ({ page }) => {
    await page.goto("/dashboard/activity");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Bot Activity", level: 1 })
    ).toBeVisible();

    // Subtitle
    await expect(
      page.getByText("Monitor Qyburn")
    ).toBeVisible();

    // Bot Online indicator
    await expect(page.getByText("Bot Online")).toBeVisible();

    // Stats cards (Messages, Resolved, Avg Response, Resolution Rate)
    await expect(page.getByText("Messages (24h)")).toBeVisible();
    await expect(page.getByText("Resolved")).toBeVisible();
    await expect(page.getByText("Avg Response")).toBeVisible();
    await expect(page.getByText("Resolution Rate")).toBeVisible();

    // Activity Breakdown section
    await expect(
      page.getByRole("heading", { name: "Activity Breakdown" })
    ).toBeVisible();

    // Breakdown items
    await expect(page.getByText("License Requests")).toBeVisible();
    await expect(page.getByText("KB Queries")).toBeVisible();
    await expect(page.getByText("Group Access")).toBeVisible();

    // Recent Conversations section
    await expect(
      page.getByRole("heading", { name: "Recent Conversations" })
    ).toBeVisible();

    // Conversation entries should be visible
    await expect(page.getByText("anna.lindberg")).toBeVisible();
    await expect(page.getByText("erik.svensson")).toBeVisible();
  });
});

test.describe("Settings Page", () => {
  test("loads with forms", async ({ page }) => {
    await page.goto("/dashboard/settings");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Settings", level: 1 })
    ).toBeVisible();

    // Subtitle
    await expect(
      page.getByText("Configure Qyburn")
    ).toBeVisible();

    // Save Changes button
    await expect(
      page.locator(".qy-btn-primary").filter({ hasText: "Save Changes" })
    ).toBeVisible();

    // Section headings for each settings group
    await expect(
      page.getByRole("heading", { name: "Slack Connection" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Microsoft Azure AD" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Anthropic (Claude AI)" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "General" })
    ).toBeVisible();

    // Test Connection buttons
    const testButtons = page.locator(".qy-btn-secondary").filter({
      hasText: "Test Connection",
    });
    expect(await testButtons.count()).toBe(3);

    // Form inputs should be present
    await expect(page.getByLabel("Bot Token")).toBeVisible();
    await expect(page.getByLabel("Organization Name")).toBeVisible();
    await expect(page.getByLabel("IT Admin Channel")).toBeVisible();

    // Organization name should have a default value
    const orgInput = page.getByLabel("Organization Name");
    await expect(orgInput).toHaveValue("SAGA Diagnostics");

    // Admin channel should have default value
    const channelInput = page.getByLabel("IT Admin Channel");
    await expect(channelInput).toHaveValue("#it-admin");

    // Test save button interaction
    const saveButton = page.locator(".qy-btn-primary").filter({
      hasText: "Save Changes",
    });
    await saveButton.click();

    // Should briefly show "Saving..." then return to "Save Changes"
    await expect(page.getByText("Saving...")).toBeVisible();
    await expect(
      page.locator(".qy-btn-primary").filter({ hasText: "Save Changes" })
    ).toBeVisible({ timeout: 5000 });
  });
});
