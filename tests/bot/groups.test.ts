import { describe, it, expect, beforeEach } from "vitest";
import { handleGroupsCommand } from "../../bot/commands/groups";
import {
  groupAccessRequests,
  type GroupAccessRequest,
} from "../../src/lib/mock-data";

// Keep a snapshot of the original requests so we can restore after each test
let originalRequests: GroupAccessRequest[];

beforeEach(() => {
  // Capture original state
  originalRequests = [...groupAccessRequests];
});

// Restore after every test by mutating the shared array back
afterEach(() => {
  groupAccessRequests.length = 0;
  originalRequests.forEach((r) => groupAccessRequests.push(r));
});

describe("handleGroupsCommand", () => {
  const testUser = "erik.svensson@saga.com";

  // ── List all groups (no args) ───────────────────────────────
  describe("when no group name is provided", () => {
    it("returns action 'list'", async () => {
      const result = await handleGroupsCommand(testUser);
      expect(result.action).toBe("list");
    });

    it("includes the restricted groups heading", async () => {
      const result = await handleGroupsCommand(testUser);
      expect(result.text).toContain("Restricted Groups");
    });

    it("lists all known restricted groups", async () => {
      const result = await handleGroupsCommand(testUser);
      expect(result.text).toContain("SG-Engineering-Admin");
      expect(result.text).toContain("SG-Lab-Instruments-Admin");
      expect(result.text).toContain("SG-Finance-Sensitive");
    });

    it("shows approver emails", async () => {
      const result = await handleGroupsCommand(testUser);
      expect(result.text).toContain("vp.engineering@saga.com");
      expect(result.text).toContain("lab.director@saga.com");
      expect(result.text).toContain("cfo@saga.com");
    });

    it("shows pending request count when applicable", async () => {
      // There is 1 pending request for rg-001 (SG-Engineering-Admin) in mock data
      const result = await handleGroupsCommand(testUser);
      expect(result.text).toContain("1 pending");
    });

    it("shows the usage hint", async () => {
      const result = await handleGroupsCommand(testUser);
      expect(result.text).toContain("/qyburn-groups <group name>");
    });

    it("treats empty string arg same as no arg", async () => {
      const result = await handleGroupsCommand(testUser, "   ");
      expect(result.action).toBe("list");
    });
  });

  // ── Find specific group ─────────────────────────────────────
  describe("when searching for a specific group", () => {
    it("finds SG-Engineering-Admin by partial name", async () => {
      const result = await handleGroupsCommand(testUser, "Engineering");
      expect(result.text).toContain("SG-Engineering-Admin");
    });

    it("is case-insensitive", async () => {
      const result = await handleGroupsCommand(testUser, "finance");
      expect(result.text).toContain("SG-Finance-Sensitive");
    });
  });

  // ── Group not found ─────────────────────────────────────────
  describe("when the group is not found", () => {
    it("returns informative not-found message", async () => {
      const result = await handleGroupsCommand(testUser, "NonExistentGroup");
      expect(result.text).toContain("No restricted group matching");
      expect(result.text).toContain("NonExistentGroup");
    });

    it("suggests listing all groups", async () => {
      const result = await handleGroupsCommand(testUser, "FakeGroup");
      expect(result.text).toContain("/qyburn-groups");
    });

    it("does not set an action", async () => {
      const result = await handleGroupsCommand(testUser, "FakeGroup");
      expect(result.action).toBeUndefined();
    });
  });

  // ── Create access request ───────────────────────────────────
  describe("when creating a new access request", () => {
    it("returns 'requested' action for a group with no pending request", async () => {
      // testUser (erik.svensson) has no pending request for Finance
      const result = await handleGroupsCommand(testUser, "Finance");
      expect(result.action).toBe("requested");
    });

    it("includes the group name in the response", async () => {
      const result = await handleGroupsCommand(testUser, "Finance");
      expect(result.text).toContain("SG-Finance-Sensitive");
    });

    it("includes the approver email", async () => {
      const result = await handleGroupsCommand(testUser, "Finance");
      expect(result.text).toContain("cfo@saga.com");
    });

    it("includes the azure group ID", async () => {
      const result = await handleGroupsCommand(testUser, "Finance");
      expect(result.text).toContain("group-finance");
    });

    it("mentions justification when required", async () => {
      // SG-Finance-Sensitive has requiresJustification: true
      const result = await handleGroupsCommand(testUser, "Finance");
      expect(result.text).toContain("Justification required");
    });
  });

  // ── Duplicate pending request ───────────────────────────────
  describe("when the user already has a pending request", () => {
    it("returns 'already_pending' action", async () => {
      // james.patel@saga.com has a pending request for rg-001 (Engineering-Admin)
      const result = await handleGroupsCommand(
        "james.patel@saga.com",
        "Engineering"
      );
      expect(result.action).toBe("already_pending");
    });

    it("tells the user they already have a pending request", async () => {
      const result = await handleGroupsCommand(
        "james.patel@saga.com",
        "Engineering"
      );
      expect(result.text).toContain("already have a pending request");
    });

    it("shows the approver info", async () => {
      const result = await handleGroupsCommand(
        "james.patel@saga.com",
        "Engineering"
      );
      expect(result.text).toContain("vp.engineering@saga.com");
    });
  });
});
