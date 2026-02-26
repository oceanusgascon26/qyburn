/**
 * Microsoft Graph API stub
 * Simulates Azure AD user/group operations without real credentials.
 */

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description?: string;
  members: string[];
}

const stubUsers: GraphUser[] = [
  {
    id: "user-001",
    displayName: "Anna Lindberg",
    mail: "anna.lindberg@saga.com",
    jobTitle: "Lab Technician",
    department: "Diagnostics",
  },
  {
    id: "user-002",
    displayName: "Erik Svensson",
    mail: "erik.svensson@saga.com",
    jobTitle: "Software Engineer",
    department: "Engineering",
  },
  {
    id: "user-003",
    displayName: "Maria Chen",
    mail: "maria.chen@saga.com",
    jobTitle: "Project Manager",
    department: "Operations",
  },
  {
    id: "user-004",
    displayName: "James Patel",
    mail: "james.patel@saga.com",
    jobTitle: "Data Scientist",
    department: "R&D",
  },
];

const stubGroups: GraphGroup[] = [
  {
    id: "group-001",
    displayName: "SG-Engineering-Admin",
    description: "Engineering team admin access",
    members: ["user-002"],
  },
  {
    id: "group-002",
    displayName: "SG-Lab-Users",
    description: "Lab instrument access",
    members: ["user-001"],
  },
  {
    id: "group-003",
    displayName: "SG-VPN-Users",
    description: "VPN access group",
    members: ["user-002", "user-003"],
  },
];

export class GraphStub {
  async getUser(userId: string): Promise<GraphUser | null> {
    return stubUsers.find((u) => u.id === userId) ?? null;
  }

  async getUserByEmail(email: string): Promise<GraphUser | null> {
    return stubUsers.find((u) => u.mail === email) ?? null;
  }

  async listUsers(): Promise<GraphUser[]> {
    return stubUsers;
  }

  async getGroup(groupId: string): Promise<GraphGroup | null> {
    return stubGroups.find((g) => g.id === groupId) ?? null;
  }

  async listGroups(): Promise<GraphGroup[]> {
    return stubGroups;
  }

  async addUserToGroup(userId: string, groupId: string): Promise<boolean> {
    const group = stubGroups.find((g) => g.id === groupId);
    if (!group) return false;
    if (!group.members.includes(userId)) {
      group.members.push(userId);
    }
    console.log(`[GRAPH STUB] Added user ${userId} to group ${groupId}`);
    return true;
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<boolean> {
    const group = stubGroups.find((g) => g.id === groupId);
    if (!group) return false;
    group.members = group.members.filter((m) => m !== userId);
    console.log(`[GRAPH STUB] Removed user ${userId} from group ${groupId}`);
    return true;
  }

  async assignLicense(userId: string, skuId: string): Promise<boolean> {
    console.log(`[GRAPH STUB] Assigned license ${skuId} to user ${userId}`);
    return true;
  }

  async revokeLicense(userId: string, skuId: string): Promise<boolean> {
    console.log(`[GRAPH STUB] Revoked license ${skuId} from user ${userId}`);
    return true;
  }
}

export const graphClient = new GraphStub();
