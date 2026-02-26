import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleLicenseCommand } from "../../bot/commands/license";

// Mock the graph client used by the license handler
vi.mock("../../src/lib/stubs/graph", () => {
  return {
    graphClient: {
      getUserByEmail: vi.fn().mockResolvedValue({
        id: "user-002",
        displayName: "Erik Svensson",
        mail: "erik.svensson@saga.com",
        jobTitle: "Software Engineer",
        department: "Engineering",
      }),
      assignLicense: vi.fn().mockResolvedValue(true),
    },
  };
});

// We let the real mock-data module run so getLicenses() returns
// the actual in-memory catalog. We only mock the graph stub above.

describe("handleLicenseCommand", () => {
  const testUser = "erik.svensson@saga.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── List all licenses (no args) ─────────────────────────────
  describe("when no software name is provided", () => {
    it("returns an action of 'list'", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.action).toBe("list");
    });

    it("includes the 'Available Software Licenses' heading", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.text).toContain("Available Software Licenses");
    });

    it("lists known licenses from the catalog", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.text).toContain("Microsoft 365 E3");
      expect(result.text).toContain("Adobe Creative Cloud");
      expect(result.text).toContain("JetBrains All Products");
      expect(result.text).toContain("Slack Pro");
      expect(result.text).toContain("Figma Organization");
    });

    it("shows seat availability info", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.text).toContain("seats available");
    });

    it("shows approval type info", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.text).toContain("auto-approve");
      expect(result.text).toContain("requires approval");
    });

    it("shows usage hint", async () => {
      const result = await handleLicenseCommand(testUser);
      expect(result.text).toContain("/qyburn-license <software name>");
    });

    it("treats empty-string arg same as no arg", async () => {
      const result = await handleLicenseCommand(testUser, "   ");
      expect(result.action).toBe("list");
    });
  });

  // ── Find a specific license ─────────────────────────────────
  describe("when searching for a specific license", () => {
    it("finds Microsoft 365 by partial name", async () => {
      const result = await handleLicenseCommand(testUser, "Microsoft 365");
      expect(result.licenseName).toBe("Microsoft 365 E3");
    });

    it("finds a license by vendor name", async () => {
      const result = await handleLicenseCommand(testUser, "adobe");
      expect(result.licenseName).toBe("Adobe Creative Cloud");
    });

    it("is case-insensitive", async () => {
      const result = await handleLicenseCommand(testUser, "JETBRAINS");
      expect(result.licenseName).toBe("JetBrains All Products");
    });
  });

  // ── Not found ───────────────────────────────────────────────
  describe("when the license is not found", () => {
    it("returns unavailable action", async () => {
      const result = await handleLicenseCommand(testUser, "NonExistentSoftware");
      expect(result.action).toBe("unavailable");
    });

    it("includes the original query in the message", async () => {
      const result = await handleLicenseCommand(testUser, "NonExistentSoftware");
      expect(result.text).toContain("NonExistentSoftware");
    });

    it("suggests listing available licenses", async () => {
      const result = await handleLicenseCommand(testUser, "FooBar");
      expect(result.text).toContain("/qyburn-license");
    });
  });

  // ── Auto-approve flow ───────────────────────────────────────
  describe("when the license has autoApprove=true", () => {
    it("returns assigned action for Microsoft 365", async () => {
      const result = await handleLicenseCommand(testUser, "Microsoft 365");
      expect(result.action).toBe("assigned");
    });

    it("confirms auto-provisioning in the text", async () => {
      const result = await handleLicenseCommand(testUser, "Microsoft 365");
      expect(result.text).toContain("auto-provisioned");
    });

    it("includes the SKU in the response", async () => {
      const result = await handleLicenseCommand(testUser, "Microsoft 365");
      expect(result.text).toContain("M365-E3");
    });

    it("includes the vendor in the response", async () => {
      const result = await handleLicenseCommand(testUser, "Microsoft 365");
      expect(result.text).toContain("Microsoft");
    });

    it("calls graphClient.assignLicense", async () => {
      const { graphClient } = await import("../../src/lib/stubs/graph");
      await handleLicenseCommand(testUser, "Microsoft 365");
      expect(graphClient.assignLicense).toHaveBeenCalledWith("user-002", "M365-E3");
    });
  });

  // ── Requires approval flow ──────────────────────────────────
  describe("when the license requires approval", () => {
    it("returns pending action for Adobe Creative Cloud", async () => {
      const result = await handleLicenseCommand(testUser, "Adobe");
      expect(result.action).toBe("pending");
      expect(result.licenseName).toBe("Adobe Creative Cloud");
    });

    it("mentions manager approval", async () => {
      const result = await handleLicenseCommand(testUser, "Adobe");
      expect(result.text).toContain("approval");
    });

    it("includes cost information", async () => {
      const result = await handleLicenseCommand(testUser, "Adobe");
      expect(result.text).toContain("82.99");
    });
  });

  // ── Full capacity (unavailable) ─────────────────────────────
  describe("when the license has no available seats", () => {
    it("returns unavailable when all seats are used", async () => {
      // We need to temporarily modify the mock data to simulate full capacity.
      // Import the raw array so we can mutate it for this test.
      const mockData = await import("../../src/lib/mock-data");
      const slackLicense = mockData.licenses.find((l) => l.name === "Slack Pro")!;
      const originalUsed = slackLicense.usedSeats;

      // Fill all seats
      slackLicense.usedSeats = slackLicense.totalSeats;

      try {
        const result = await handleLicenseCommand(testUser, "Slack Pro");
        expect(result.action).toBe("unavailable");
        expect(result.text).toContain("full capacity");
        expect(result.licenseName).toBe("Slack Pro");
      } finally {
        // Restore original state
        slackLicense.usedSeats = originalUsed;
      }
    });
  });
});
