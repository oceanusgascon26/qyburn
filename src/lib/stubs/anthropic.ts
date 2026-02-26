/**
 * Anthropic Claude API stub
 * Simulates AI responses for RAG without real credentials.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class AnthropicStub {
  private model = "claude-sonnet-4-20250514";

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content.toLowerCase() ?? "";

    console.log(`[ANTHROPIC STUB] Processing query: "${lastMessage?.content}"`);
    console.log(`[ANTHROPIC STUB] System prompt: ${systemPrompt?.slice(0, 100)}...`);

    // Simulate contextual responses
    if (userQuery.includes("vpn")) {
      return "To set up VPN access, please follow these steps:\n1. Open the SAGA VPN client\n2. Enter your corporate credentials\n3. Select the nearest gateway\n4. Click Connect\n\nIf you need VPN access granted, I can submit a request to add you to the SG-VPN-Users group.";
    }

    if (userQuery.includes("password") || userQuery.includes("reset")) {
      return "I can help with password resets. For security, I'll need to verify your identity first. Please confirm your employee email address, and I'll initiate the reset process through Azure AD.";
    }

    if (userQuery.includes("license") || userQuery.includes("software")) {
      return "I can help you request software licenses. Available licenses include:\n- Microsoft 365 E3\n- Adobe Creative Cloud\n- JetBrains All Products\n- Slack Pro\n\nWhich software would you like to request?";
    }

    if (userQuery.includes("onboard") || userQuery.includes("new employee")) {
      return "I'll help with onboarding! I can provision the standard software stack and group memberships for new employees. Please provide the new employee's name, email, department, and start date.";
    }

    return "I'm Qyburn, the SAGA Diagnostics IT assistant. I can help you with:\n- Software license requests\n- VPN and access setup\n- Password resets\n- Group membership requests\n- General IT questions\n\nHow can I help you today?";
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.log(`[ANTHROPIC STUB] Generating embedding for: "${text.slice(0, 50)}..."`);
    // Return a fake 1536-dimensional embedding
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

export const aiClient = new AnthropicStub();
