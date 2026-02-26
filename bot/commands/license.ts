/**
 * /qyburn-license command
 * Handles software license requests.
 */

import { graphClient } from "../../src/lib/stubs/graph";
import { getLicenses } from "../../src/lib/mock-data";

export interface LicenseCommandResult {
  text: string;
  action?: "assigned" | "pending" | "unavailable" | "list";
  licenseName?: string;
}

export async function handleLicenseCommand(
  userEmail: string,
  softwareName?: string
): Promise<LicenseCommandResult> {
  const licenses = getLicenses();

  // If no software specified, list available licenses
  if (!softwareName || softwareName.trim() === "") {
    const licenseList = licenses
      .map((l) => {
        const available = l.totalSeats - l.usedSeats;
        const status = available > 0 ? `${available} seats available` : "FULL";
        const approval = l.autoApprove ? "auto-approve" : "requires approval";
        return `• *${l.name}* (${l.vendor}) — ${status}, ${approval}`;
      })
      .join("\n");

    return {
      text: `*Available Software Licenses:*\n\n${licenseList}\n\nUse \`/qyburn-license <software name>\` to request a specific license.`,
      action: "list",
    };
  }

  // Find matching license
  const query = softwareName.toLowerCase();
  const license = licenses.find(
    (l) =>
      l.name.toLowerCase().includes(query) ||
      l.vendor.toLowerCase().includes(query)
  );

  if (!license) {
    return {
      text: `I couldn't find a license matching "${softwareName}" in our catalog. Use \`/qyburn-license\` to see all available licenses.`,
      action: "unavailable",
    };
  }

  // Check seat availability
  if (license.usedSeats >= license.totalSeats) {
    return {
      text: `Sorry, *${license.name}* is currently at full capacity (${license.totalSeats}/${license.totalSeats} seats). I've notified IT admin about the shortage.`,
      action: "unavailable",
      licenseName: license.name,
    };
  }

  // Auto-approve check
  if (license.autoApprove) {
    // Simulate assignment via Graph
    const user = await graphClient.getUserByEmail(userEmail);
    if (user && license.sku) {
      await graphClient.assignLicense(user.id, license.sku);
    }

    return {
      text: `*${license.name}* has been auto-provisioned for you! :white_check_mark:\n\nDetails:\n• Vendor: ${license.vendor}\n• SKU: ${license.sku ?? "N/A"}\n\nThe license should be active within a few minutes.`,
      action: "assigned",
      licenseName: license.name,
    };
  }

  // Requires approval
  return {
    text: `Your request for *${license.name}* has been submitted for approval. :hourglass_flowing_sand:\n\nThis license requires manager approval. You'll be notified once it's reviewed.\n\nCost: $${license.costPerSeat?.toFixed(2) ?? "N/A"}/month per seat`,
    action: "pending",
    licenseName: license.name,
  };
}
