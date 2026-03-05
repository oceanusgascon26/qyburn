/**
 * Slack Block Kit notification templates for the Qyburn bot.
 * Each template returns a Slack-compatible blocks array.
 */

// ─── Types ──────────────────────────────────────────────────

interface SlackTextObject {
  type: string;
  text: string;
  emoji?: boolean;
}

interface SlackBlock {
  type: string;
  text?: SlackTextObject | string;
  elements?: SlackBlockElement[];
  fields?: { type: string; text: string }[];
  accessory?: SlackBlock;
  action_id?: string;
  value?: string;
  style?: string;
  block_id?: string;
}

interface SlackBlockElement {
  type: string;
  text?: SlackTextObject | string;
  action_id?: string;
  value?: string;
  style?: string;
}

interface RequestInfo {
  id: string;
  type: string;
  target: string;
  requester: string;
  requesterEmail?: string;
  department?: string;
  justification?: string;
  status?: string;
  createdAt?: string;
  cost?: number;
}

// ─── Helpers ────────────────────────────────────────────────

function headerBlock(text: string): SlackBlock {
  return {
    type: 'header',
    text: { type: 'plain_text', text, emoji: true },
  };
}

function sectionBlock(text: string): SlackBlock {
  return {
    type: 'section',
    text: { type: 'mrkdwn', text },
  };
}

function fieldsBlock(fields: [string, string][]): SlackBlock {
  return {
    type: 'section',
    fields: fields.map(([label, value]) => ({
      type: 'mrkdwn',
      text: `*${label}:*\n${value}`,
    })),
  };
}

function contextBlock(text: string): SlackBlock {
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text }],
  };
}

function dividerBlock(): SlackBlock {
  return { type: 'divider' };
}

function actionsBlock(buttons: SlackBlock[], blockId?: string): SlackBlock {
  return {
    type: 'actions',
    block_id: blockId,
    elements: buttons,
  };
}

function buttonBlock(
  text: string,
  actionId: string,
  value: string,
  style?: 'primary' | 'danger'
): SlackBlock {
  const btn: SlackBlock = {
    type: 'button',
    text: { type: 'plain_text', text, emoji: true },
    action_id: actionId,
    value,
  };
  if (style) btn.style = style;
  return btn;
}

function statusEmoji(status?: string): string {
  const map: Record<string, string> = {
    DRAFT: ':pencil2:',
    SUBMITTED: ':inbox_tray:',
    IN_REVIEW: ':eyes:',
    APPROVED: ':white_check_mark:',
    DENIED: ':x:',
    ASSIGNED: ':bust_in_silhouette:',
    ACTIVE: ':large_green_circle:',
    REVOKED: ':no_entry:',
    EXPIRED: ':hourglass:',
    pending: ':hourglass_flowing_sand:',
    approved: ':white_check_mark:',
    denied: ':x:',
  };
  return map[status ?? ''] ?? ':grey_question:';
}

// ─── Templates ──────────────────────────────────────────────

/** Notification: license request has been submitted. */
export function licenseRequestSubmitted(request: RequestInfo): SlackBlock[] {
  return [
    headerBlock('License Request Submitted'),
    sectionBlock(
      `Your request for *${request.target}* has been submitted and is awaiting review.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Type', 'License Request'],
      ['Requester', request.requester],
      ['Status', `${statusEmoji('SUBMITTED')} Submitted`],
    ]),
    dividerBlock(),
    contextBlock(
      `Submitted at ${request.createdAt ?? new Date().toISOString()} | Qyburn IT Bot`
    ),
  ];
}

/** Notification: license request approved. */
export function licenseRequestApproved(request: RequestInfo): SlackBlock[] {
  return [
    headerBlock('License Request Approved'),
    sectionBlock(
      `Your request for *${request.target}* has been approved! :tada:`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['License', request.target],
      ['Requester', request.requester],
      ['Status', `${statusEmoji('APPROVED')} Approved`],
    ]),
    dividerBlock(),
    contextBlock('Your license will be provisioned shortly. | Qyburn IT Bot'),
  ];
}

/** Notification: license request denied. */
export function licenseRequestDenied(
  request: RequestInfo,
  reason: string
): SlackBlock[] {
  return [
    headerBlock('License Request Denied'),
    sectionBlock(
      `Your request for *${request.target}* was denied.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['License', request.target],
      ['Requester', request.requester],
      ['Status', `${statusEmoji('DENIED')} Denied`],
    ]),
    sectionBlock(`*Reason:*\n${reason}`),
    dividerBlock(),
    contextBlock(
      'If you believe this is an error, please contact your manager. | Qyburn IT Bot'
    ),
  ];
}

/** Notification: group access granted. */
export function groupAccessGranted(request: RequestInfo): SlackBlock[] {
  return [
    headerBlock('Group Access Granted'),
    sectionBlock(
      `You have been added to *${request.target}*. :key:`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Group', request.target],
      ['Requester', request.requester],
      ['Status', `${statusEmoji('APPROVED')} Granted`],
    ]),
    dividerBlock(),
    contextBlock(
      'Your group membership is now active. It may take a few minutes to propagate. | Qyburn IT Bot'
    ),
  ];
}

/** Notification: group access denied. */
export function groupAccessDenied(
  request: RequestInfo,
  reason: string
): SlackBlock[] {
  return [
    headerBlock('Group Access Denied'),
    sectionBlock(
      `Your request to join *${request.target}* was denied.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Group', request.target],
      ['Requester', request.requester],
      ['Status', `${statusEmoji('DENIED')} Denied`],
    ]),
    sectionBlock(`*Reason:*\n${reason}`),
    dividerBlock(),
    contextBlock(
      'Contact the group owner or your manager for further assistance. | Qyburn IT Bot'
    ),
  ];
}

/** Notification sent to approver with Approve/Deny action buttons. */
export function approvalNeeded(request: RequestInfo): SlackBlock[] {
  return [
    headerBlock('Approval Required'),
    sectionBlock(
      `*${request.requester}* is requesting access to *${request.target}*.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Type', request.type],
      ['Department', request.department ?? 'N/A'],
      ['Cost', request.cost ? `$${request.cost.toFixed(2)}/seat` : 'N/A'],
    ]),
    ...(request.justification
      ? [sectionBlock(`*Justification:*\n${request.justification}`)]
      : []),
    dividerBlock(),
    actionsBlock(
      [
        buttonBlock('Approve', `approve_${request.id}`, request.id, 'primary'),
        buttonBlock('Deny', `deny_${request.id}`, request.id, 'danger'),
      ],
      `approval_actions_${request.id}`
    ),
    contextBlock('Please review and take action. | Qyburn IT Bot'),
  ];
}

/** Warning: request is approaching SLA deadline. */
export function slaBreachWarning(request: RequestInfo): SlackBlock[] {
  return [
    headerBlock('SLA Warning'),
    sectionBlock(
      `:warning: Request *${request.id}* is approaching its SLA deadline.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Type', request.type],
      ['Requester', request.requester],
      ['Status', `${statusEmoji(request.status)} ${request.status ?? 'Open'}`],
    ]),
    dividerBlock(),
    contextBlock(
      'Please take action to resolve this request before the SLA is breached. | Qyburn IT Bot'
    ),
  ];
}

/** Escalation notice: request has been escalated to a higher authority. */
export function escalationNotice(
  request: RequestInfo,
  escalatedTo: string
): SlackBlock[] {
  return [
    headerBlock('Request Escalated'),
    sectionBlock(
      `:rotating_light: Request *${request.id}* has been escalated to *${escalatedTo}*.`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Type', request.type],
      ['Requester', request.requester],
      ['Escalated To', escalatedTo],
    ]),
    dividerBlock(),
    contextBlock(
      'This request has exceeded its SLA and requires immediate attention. | Qyburn IT Bot'
    ),
  ];
}

// ─── Generic Request Card ───────────────────────────────────

/** Format a generic request summary card with status badge. */
export function formatRequestCard(request: RequestInfo): SlackBlock[] {
  const emoji = statusEmoji(request.status);

  return [
    sectionBlock(
      `${emoji} *${request.type}* — ${request.target}`
    ),
    fieldsBlock([
      ['Request ID', request.id],
      ['Requester', request.requester],
      ['Department', request.department ?? 'N/A'],
      ['Status', `${emoji} ${request.status ?? 'Unknown'}`],
    ]),
    ...(request.justification
      ? [contextBlock(`_"${request.justification}"_`)]
      : []),
    dividerBlock(),
  ];
}
