/**
 * Slack Bolt API stub
 * Simulates Slack interactions without real credentials.
 */

export interface SlackMessage {
  channel: string;
  user: string;
  text: string;
  ts: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email: string;
}

const stubSlackUsers: SlackUser[] = [
  { id: "U001", name: "anna.lindberg", real_name: "Anna Lindberg", email: "anna.lindberg@saga.com" },
  { id: "U002", name: "erik.svensson", real_name: "Erik Svensson", email: "erik.svensson@saga.com" },
  { id: "U003", name: "maria.chen", real_name: "Maria Chen", email: "maria.chen@saga.com" },
  { id: "U004", name: "james.patel", real_name: "James Patel", email: "james.patel@saga.com" },
];

export class SlackStub {
  private messageLog: SlackMessage[] = [];

  async postMessage(channel: string, text: string): Promise<void> {
    const msg: SlackMessage = {
      channel,
      user: "qyburn-bot",
      text,
      ts: Date.now().toString(),
    };
    this.messageLog.push(msg);
    console.log(`[SLACK STUB] Posted to ${channel}: ${text.slice(0, 100)}...`);
  }

  async postEphemeral(channel: string, user: string, text: string): Promise<void> {
    console.log(`[SLACK STUB] Ephemeral to ${user} in ${channel}: ${text.slice(0, 100)}...`);
  }

  async getUserInfo(userId: string): Promise<SlackUser | null> {
    return stubSlackUsers.find((u) => u.id === userId) ?? null;
  }

  async lookupByEmail(email: string): Promise<SlackUser | null> {
    return stubSlackUsers.find((u) => u.email === email) ?? null;
  }

  getMessageLog(): SlackMessage[] {
    return [...this.messageLog];
  }
}

export const slackClient = new SlackStub();
