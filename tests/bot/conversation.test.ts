import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleConversation } from "../../bot/handlers/conversation";
import { auditLogs } from "../../src/lib/mock-data";

// Mock the graph client
vi.mock("../../src/lib/stubs/graph", () => ({
  graphClient: {
    getUserByEmail: vi.fn().mockResolvedValue({
      id: "user-002",
      displayName: "Erik Svensson",
      mail: "erik.svensson@saga.com",
      jobTitle: "Software Engineer",
      department: "Engineering",
    }),
  },
}));

// Mock the AI client — returns a predictable response
vi.mock("../../src/lib/stubs/anthropic", () => ({
  aiClient: {
    chat: vi.fn().mockResolvedValue(
      "I'm Qyburn, the SAGA Diagnostics IT assistant. How can I help you today?"
    ),
  },
}));

describe("handleConversation", () => {
  const testUser = "erik.svensson@saga.com";
  let initialAuditCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    initialAuditCount = auditLogs.length;
  });

  // ── Basic response ──────────────────────────────────────────
  describe("basic response", () => {
    it("returns a ConversationResult with a non-empty response", async () => {
      const result = await handleConversation(testUser, "hello");
      expect(result.response).toBeTruthy();
      expect(typeof result.response).toBe("string");
    });

    it("returns resolved=true", async () => {
      const result = await handleConversation(testUser, "hello");
      expect(result.resolved).toBe(true);
    });

    it("returns a string intent", async () => {
      const result = await handleConversation(testUser, "hello");
      expect(typeof result.intent).toBe("string");
    });
  });

  // ── Intent detection ────────────────────────────────────────
  describe("intent detection", () => {
    it("detects license intent from 'license' keyword", async () => {
      const result = await handleConversation(testUser, "I need a license for Figma");
      expect(result.intent).toBe("license");
    });

    it("detects license intent from 'software' keyword", async () => {
      const result = await handleConversation(testUser, "Can I get some software?");
      expect(result.intent).toBe("license");
    });

    it("detects password intent from 'password' keyword", async () => {
      const result = await handleConversation(testUser, "I forgot my password");
      expect(result.intent).toBe("password");
    });

    it("detects password intent from 'reset' keyword", async () => {
      const result = await handleConversation(testUser, "I need to reset my account");
      expect(result.intent).toBe("password");
    });

    it("detects group intent from 'group' keyword", async () => {
      const result = await handleConversation(testUser, "Add me to the engineering group");
      expect(result.intent).toBe("group");
    });

    it("detects group intent from 'access' keyword", async () => {
      const result = await handleConversation(testUser, "I need access to the lab systems");
      expect(result.intent).toBe("group");
    });

    it("detects network intent from 'vpn' keyword", async () => {
      const result = await handleConversation(testUser, "How do I connect to the vpn?");
      expect(result.intent).toBe("network");
    });

    it("detects network intent from 'network' keyword", async () => {
      const result = await handleConversation(testUser, "The network is down in building 3");
      expect(result.intent).toBe("network");
    });

    it("detects onboarding intent from 'onboard' keyword", async () => {
      const result = await handleConversation(testUser, "We need to onboard a new team member");
      expect(result.intent).toBe("onboarding");
    });

    it("detects onboarding intent from 'new hire' keyword", async () => {
      const result = await handleConversation(testUser, "We have a new hire starting Monday");
      expect(result.intent).toBe("onboarding");
    });

    it("defaults to 'general' for unrecognized messages", async () => {
      const result = await handleConversation(testUser, "hello there");
      expect(result.intent).toBe("general");
    });
  });

  // ── Audit logging ───────────────────────────────────────────
  describe("audit logging", () => {
    it("creates an audit log entry for each conversation", async () => {
      await handleConversation(testUser, "Tell me about VPN setup");
      expect(auditLogs.length).toBeGreaterThan(initialAuditCount);
    });

    it("records the correct actor", async () => {
      await handleConversation(testUser, "Tell me about VPN setup");
      const latest = auditLogs[0]; // createAuditLog uses unshift
      expect(latest.actor).toBe("qyburn-bot");
    });

    it("records the correct action", async () => {
      await handleConversation(testUser, "Tell me about VPN setup");
      const latest = auditLogs[0];
      expect(latest.action).toBe("kb.query");
    });

    it("records the detected intent as target", async () => {
      await handleConversation(testUser, "I need a license for something");
      const latest = auditLogs[0];
      expect(latest.target).toBe("license");
    });

    it("stores user email in the details JSON", async () => {
      await handleConversation(testUser, "test message");
      const latest = auditLogs[0];
      const details = JSON.parse(latest.details!);
      expect(details.user).toBe(testUser);
    });

    it("stores the query text in the details JSON", async () => {
      const msg = "How do I connect to VPN?";
      await handleConversation(testUser, msg);
      const latest = auditLogs[0];
      const details = JSON.parse(latest.details!);
      expect(details.query).toBe(msg);
    });

    it("records the channel when provided", async () => {
      await handleConversation(testUser, "hello", "#it-support");
      const latest = auditLogs[0];
      expect(latest.channel).toBe("#it-support");
    });

    it("records null channel when not provided", async () => {
      await handleConversation(testUser, "hello");
      const latest = auditLogs[0];
      expect(latest.channel).toBeNull();
    });
  });

  // ── AI client interaction ───────────────────────────────────
  describe("AI client interaction", () => {
    it("passes the user message to the AI client", async () => {
      const { aiClient } = await import("../../src/lib/stubs/anthropic");
      await handleConversation(testUser, "What software do we have?");
      expect(aiClient.chat).toHaveBeenCalledTimes(1);
      const callArgs = (aiClient.chat as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toEqual([{ role: "user", content: "What software do we have?" }]);
    });

    it("includes user context in the system prompt", async () => {
      const { aiClient } = await import("../../src/lib/stubs/anthropic");
      await handleConversation(testUser, "hello");
      const callArgs = (aiClient.chat as ReturnType<typeof vi.fn>).mock.calls[0];
      const systemPrompt: string = callArgs[1];
      expect(systemPrompt).toContain("Erik Svensson");
      expect(systemPrompt).toContain("erik.svensson@saga.com");
    });

    it("looks up the user via graphClient", async () => {
      const { graphClient } = await import("../../src/lib/stubs/graph");
      await handleConversation(testUser, "hello");
      expect(graphClient.getUserByEmail).toHaveBeenCalledWith(testUser);
    });
  });
});
