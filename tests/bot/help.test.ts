import { describe, it, expect } from "vitest";
import { handleHelp } from "../../bot/commands/help";

describe("handleHelp", () => {
  it("returns a non-empty string", () => {
    const result = handleHelp();
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("includes the bot title", () => {
    const result = handleHelp();
    expect(result).toContain("Qyburn IT Self-Service Bot");
  });

  it("lists all slash commands", () => {
    const result = handleHelp();
    expect(result).toContain("/qyburn-help");
    expect(result).toContain("/qyburn-license");
    expect(result).toContain("/qyburn-groups");
    expect(result).toContain("/qyburn-status");
  });

  it("describes natural language capabilities", () => {
    const result = handleHelp();
    expect(result).toContain("Natural Language");
    expect(result).toContain("Software license requests");
    expect(result).toContain("Azure AD group access");
    expect(result).toContain("VPN setup");
    expect(result).toContain("Password resets");
    expect(result).toContain("General IT questions");
    expect(result).toContain("New employee onboarding");
  });

  it("includes the powered-by footer", () => {
    const result = handleHelp();
    expect(result).toContain("Powered by SAGA Diagnostics IT");
  });

  it("returns consistent output on repeated calls", () => {
    const first = handleHelp();
    const second = handleHelp();
    expect(first).toBe(second);
  });
});
