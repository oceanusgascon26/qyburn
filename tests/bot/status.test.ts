import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handleStatusCommand } from "../../bot/commands/status";
import {
  groupAccessRequests,
  type GroupAccessRequest,
} from "../../src/lib/mock-data";

let originalRequests: GroupAccessRequest[];

beforeEach(() => {
  originalRequests = [...groupAccessRequests];
});

afterEach(() => {
  groupAccessRequests.length = 0;
  originalRequests.forEach((r) => groupAccessRequests.push(r));
});

describe("handleStatusCommand", () => {
  // ── User with pending requests ──────────────────────────────
  describe("when the user has requests", () => {
    it("returns the requests heading", async () => {
      // james.patel has a pending request (gar-001)
      const result = await handleStatusCommand("james.patel@saga.com");
      expect(result).toContain("Your Requests");
    });

    it("shows the pending status for james.patel", async () => {
      const result = await handleStatusCommand("james.patel@saga.com");
      expect(result).toContain("pending");
    });

    it("shows the group ID in the output", async () => {
      const result = await handleStatusCommand("james.patel@saga.com");
      expect(result).toContain("rg-001");
    });

    it("includes status emoji for pending", async () => {
      const result = await handleStatusCommand("james.patel@saga.com");
      expect(result).toContain(":hourglass_flowing_sand:");
    });

    it("shows approved request for anna.lindberg", async () => {
      const result = await handleStatusCommand("anna.lindberg@saga.com");
      expect(result).toContain("approved");
      expect(result).toContain(":white_check_mark:");
    });
  });

  // ── User with no requests ──────────────────────────────────
  describe("when the user has no requests", () => {
    it("returns the empty-state message", async () => {
      const result = await handleStatusCommand("nobody@saga.com");
      expect(result).toContain("no pending or recent requests");
    });

    it("suggests available commands", async () => {
      const result = await handleStatusCommand("nobody@saga.com");
      expect(result).toContain("/qyburn-license");
      expect(result).toContain("/qyburn-groups");
    });

    it("includes the sparkles emoji", async () => {
      const result = await handleStatusCommand("nobody@saga.com");
      expect(result).toContain(":sparkles:");
    });
  });
});
