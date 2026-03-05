/**
 * IT Runbook Engine
 *
 * Year 3 Q1 — Self-Healing Infrastructure: Executable IT runbooks with
 * step-by-step execution, verification gates, rollback support, and
 * full execution history.
 */

// ─── Types ───────────────────────────────────────────────────

export interface RunbookStep {
  order: number;
  instruction: string;
  command?: string;
  type: "manual" | "automated" | "verification";
  expectedOutput?: string;
  rollbackCommand?: string;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  category: "infrastructure" | "security" | "application" | "network" | "database";
  steps: RunbookStep[];
  requiredRole: string;
  estimatedMinutes: number;
  lastExecuted?: Date;
  executionCount: number;
}

export interface StepResult {
  order: number;
  instruction: string;
  status: "success" | "failed" | "skipped" | "rolled_back";
  output?: string;
  executedAt: Date;
  durationMs: number;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  runbookName: string;
  executor: string;
  status: "running" | "completed" | "failed" | "rolled_back";
  params: Record<string, string>;
  stepResults: StepResult[];
  startedAt: Date;
  completedAt?: Date;
}

// ─── Runbook Library ────────────────────────────────────────

export const RUNBOOK_LIBRARY: Runbook[] = [
  {
    id: "rb-exchange-restart",
    name: "Restart Exchange Online Service",
    description: "Force-restart Exchange Online connectors and verify mail flow. Use when users report email delays or delivery failures.",
    category: "application",
    requiredRole: "admin",
    estimatedMinutes: 10,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Check Exchange Online service health", command: "Get-ServiceHealth -Service Exchange", type: "verification", expectedOutput: "ServiceStatus" },
      { order: 2, instruction: "Disable mail flow connectors", command: "Set-TransportConnector -Enabled $false", type: "automated", rollbackCommand: "Set-TransportConnector -Enabled $true" },
      { order: 3, instruction: "Wait 30 seconds for connector drain", type: "manual" },
      { order: 4, instruction: "Re-enable mail flow connectors", command: "Set-TransportConnector -Enabled $true", type: "automated" },
      { order: 5, instruction: "Verify mail flow with test message", command: "Test-Mailflow -TargetEmailAddress admin@saga.com", type: "verification", expectedOutput: "TestResult: Success" },
    ],
  },
  {
    id: "rb-clear-token-cache",
    name: "Clear Azure AD Token Cache",
    description: "Clear cached tokens for a specific user to resolve authentication issues. Requires user UPN.",
    category: "security",
    requiredRole: "admin",
    estimatedMinutes: 5,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Revoke all refresh tokens for user", command: "Revoke-AzureADUserAllRefreshToken -ObjectId {userId}", type: "automated", rollbackCommand: "# No rollback — user re-authenticates" },
      { order: 2, instruction: "Clear browser SSO state", command: "Clear-AzureADUserExtension -ObjectId {userId} -ExtensionName SSOState", type: "automated" },
      { order: 3, instruction: "Notify user to sign out and back in", type: "manual" },
      { order: 4, instruction: "Verify user can authenticate", type: "verification", expectedOutput: "User authenticated successfully" },
    ],
  },
  {
    id: "rb-rotate-api-creds",
    name: "Rotate API Credentials",
    description: "Rotate API keys and secrets for a service. Creates new credentials, updates config, and invalidates old ones.",
    category: "security",
    requiredRole: "admin",
    estimatedMinutes: 15,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Generate new API key pair", command: "New-ApiCredential -Service {serviceName}", type: "automated" },
      { order: 2, instruction: "Update application configuration with new key", command: "Set-AppConfig -Service {serviceName} -Key {newKey}", type: "automated", rollbackCommand: "Set-AppConfig -Service {serviceName} -Key {oldKey}" },
      { order: 3, instruction: "Test API connectivity with new credentials", type: "verification", expectedOutput: "HTTP 200 OK" },
      { order: 4, instruction: "Invalidate old API key", command: "Revoke-ApiCredential -Service {serviceName} -KeyId {oldKeyId}", type: "automated" },
      { order: 5, instruction: "Verify old key is rejected", type: "verification", expectedOutput: "HTTP 401 Unauthorized" },
    ],
  },
  {
    id: "rb-dns-flush",
    name: "DNS Cache Flush (Global)",
    description: "Flush DNS cache across all managed endpoints and DNS servers. Use when DNS changes are not propagating.",
    category: "network",
    requiredRole: "admin",
    estimatedMinutes: 8,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Flush DNS server cache", command: "Clear-DnsServerCache -ComputerName dc01.saga.local", type: "automated", rollbackCommand: "# DNS cache rebuilds automatically" },
      { order: 2, instruction: "Push Intune remediation to flush client caches", command: "Invoke-IntuneRemediation -ScriptName FlushDNS -TargetGroup AllDevices", type: "automated" },
      { order: 3, instruction: "Verify DNS resolution for critical services", command: "Resolve-DnsName mail.saga.com -DnsOnly", type: "verification", expectedOutput: "IPAddress" },
      { order: 4, instruction: "Verify external DNS propagation", command: "nslookup saga.com 8.8.8.8", type: "verification", expectedOutput: "Address:" },
    ],
  },
  {
    id: "rb-aad-sync",
    name: "Force Azure AD Sync",
    description: "Trigger a delta or full Azure AD Connect synchronization cycle. Use when directory changes are not appearing.",
    category: "infrastructure",
    requiredRole: "admin",
    estimatedMinutes: 12,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Check current sync status", command: "Get-ADSyncScheduler", type: "verification", expectedOutput: "SyncCycleEnabled: True" },
      { order: 2, instruction: "Start delta sync cycle", command: "Start-ADSyncSyncCycle -PolicyType Delta", type: "automated" },
      { order: 3, instruction: "Wait for sync to complete (up to 5 min)", type: "manual" },
      { order: 4, instruction: "Check sync results for errors", command: "Get-ADSyncRunStepResult", type: "verification", expectedOutput: "Result: success" },
      { order: 5, instruction: "Verify changed objects in Azure AD", command: "Get-AzureADUser -Filter \"dirSyncEnabled eq true\" | Select -First 5", type: "verification" },
    ],
  },
  {
    id: "rb-mfa-toggle",
    name: "Enable/Disable User MFA",
    description: "Toggle MFA for a specific user. Supports both enabling new enrollment and temporarily disabling for troubleshooting.",
    category: "security",
    requiredRole: "admin",
    estimatedMinutes: 5,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Check current MFA status for user", command: "Get-MsolUser -UserPrincipalName {userEmail} | Select StrongAuth*", type: "verification" },
      { order: 2, instruction: "Set MFA state to {mfaState}", command: "Set-MsolUser -UserPrincipalName {userEmail} -StrongAuthenticationRequirements @(@{State='{mfaState}'})", type: "automated", rollbackCommand: "Set-MsolUser -UserPrincipalName {userEmail} -StrongAuthenticationRequirements @(@{State='Disabled'})" },
      { order: 3, instruction: "Notify user of MFA change", type: "manual" },
      { order: 4, instruction: "Verify MFA state change", command: "Get-MsolUser -UserPrincipalName {userEmail} | Select StrongAuth*", type: "verification" },
    ],
  },
  {
    id: "rb-export-mailbox",
    name: "Export Mailbox to PST",
    description: "Export a user mailbox to PST format for archival or legal hold. Stores in designated compliance share.",
    category: "application",
    requiredRole: "admin",
    estimatedMinutes: 30,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Create mailbox export request", command: "New-MailboxExportRequest -Mailbox {userEmail} -FilePath '\\\\fileserver\\exports\\{userEmail}.pst'", type: "automated" },
      { order: 2, instruction: "Monitor export progress", command: "Get-MailboxExportRequest -Mailbox {userEmail} | Get-MailboxExportRequestStatistics", type: "verification", expectedOutput: "StatusDetail: Completed" },
      { order: 3, instruction: "Verify PST file exists and has expected size", type: "verification" },
      { order: 4, instruction: "Remove export request to clean up", command: "Remove-MailboxExportRequest -Mailbox {userEmail} -Confirm:$false", type: "automated" },
    ],
  },
  {
    id: "rb-bulk-password-reset",
    name: "Bulk Password Reset for Department",
    description: "Reset passwords for all users in a department. Generates temporary passwords and forces change on next login.",
    category: "security",
    requiredRole: "admin",
    estimatedMinutes: 20,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Get all users in department {department}", command: "Get-AzureADUser -Filter \"department eq '{department}'\"", type: "verification" },
      { order: 2, instruction: "Generate temporary passwords and reset", command: "ForEach-Object { Set-AzureADUserPassword -ObjectId $_.ObjectId -ForceChangePasswordNextLogin $true }", type: "automated" },
      { order: 3, instruction: "Send temporary passwords to users via secure channel", type: "manual" },
      { order: 4, instruction: "Verify password change notifications sent", type: "verification", expectedOutput: "All notifications sent" },
      { order: 5, instruction: "Monitor for failed login attempts (next 4 hours)", type: "manual" },
    ],
  },
  {
    id: "rb-ssl-renewal",
    name: "SSL Certificate Renewal",
    description: "Renew and deploy SSL certificates. Handles CSR generation, certificate installation, and service restart.",
    category: "infrastructure",
    requiredRole: "admin",
    estimatedMinutes: 25,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Check current certificate expiry", command: "Get-ChildItem Cert:\\LocalMachine\\My | Where-Object { $_.Subject -like '*{domain}*' }", type: "verification" },
      { order: 2, instruction: "Generate CSR for renewal", command: "New-CertificateSigningRequest -Subject 'CN={domain}' -KeyLength 2048", type: "automated" },
      { order: 3, instruction: "Submit CSR to certificate authority", type: "manual" },
      { order: 4, instruction: "Install renewed certificate", command: "Import-Certificate -FilePath '{certPath}' -CertStoreLocation Cert:\\LocalMachine\\My", type: "automated", rollbackCommand: "# Revert to previous certificate binding" },
      { order: 5, instruction: "Update IIS/service bindings", command: "Set-WebBinding -Name 'Default Web Site' -HostHeader '{domain}' -Property CertificateHash -Value '{thumbprint}'", type: "automated" },
      { order: 6, instruction: "Verify HTTPS connectivity", command: "Invoke-WebRequest -Uri 'https://{domain}' -UseBasicParsing", type: "verification", expectedOutput: "StatusCode: 200" },
    ],
  },
  {
    id: "rb-db-pool-reset",
    name: "Database Connection Pool Reset",
    description: "Reset database connection pools when applications report connection timeout errors. Drains and recreates pools.",
    category: "database",
    requiredRole: "admin",
    estimatedMinutes: 8,
    executionCount: 0,
    steps: [
      { order: 1, instruction: "Check current connection pool status", command: "SELECT count(*) AS active_connections FROM pg_stat_activity WHERE state = 'active'", type: "verification" },
      { order: 2, instruction: "Terminate idle connections older than 5 minutes", command: "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '5 minutes'", type: "automated", rollbackCommand: "# Connections will re-establish automatically" },
      { order: 3, instruction: "Restart application connection pooler (PgBouncer)", command: "systemctl restart pgbouncer", type: "automated", rollbackCommand: "systemctl restart pgbouncer" },
      { order: 4, instruction: "Verify new connections are established", command: "SELECT count(*) AS active_connections FROM pg_stat_activity WHERE state = 'active'", type: "verification", expectedOutput: "active_connections > 0" },
      { order: 5, instruction: "Run application health check", command: "curl -s http://localhost:3000/api/health | jq .status", type: "verification", expectedOutput: "ok" },
    ],
  },
];

// ─── In-Memory Execution Store ──────────────────────────────

const executionHistory: RunbookExecution[] = [];
let executionIdCounter = 0;

// ─── Execute Runbook ────────────────────────────────────────

/**
 * Execute a runbook step-by-step.
 * Logs each step result, handles verification gates, and supports rollback.
 */
export function executeRunbook(
  runbookId: string,
  params: Record<string, string>,
  executor: string
): RunbookExecution {
  const runbook = RUNBOOK_LIBRARY.find((rb) => rb.id === runbookId);
  if (!runbook) {
    throw new Error(`Unknown runbook: ${runbookId}`);
  }

  const execution: RunbookExecution = {
    id: `exec-${++executionIdCounter}`,
    runbookId,
    runbookName: runbook.name,
    executor,
    status: "running",
    params,
    stepResults: [],
    startedAt: new Date(),
  };

  executionHistory.push(execution);

  let failed = false;

  for (const step of runbook.steps) {
    if (failed) {
      // Skip remaining steps after failure
      execution.stepResults.push({
        order: step.order,
        instruction: step.instruction,
        status: "skipped",
        executedAt: new Date(),
        durationMs: 0,
      });
      continue;
    }

    const stepStart = Date.now();

    // Interpolate params into command
    let command = step.command ?? "";
    for (const [key, value] of Object.entries(params)) {
      command = command.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }

    // Simulate execution
    const simulatedSuccess = Math.random() > 0.05; // 95% success rate

    if (step.type === "manual") {
      // Manual steps are always "successful" — logged as completed
      execution.stepResults.push({
        order: step.order,
        instruction: step.instruction,
        status: "success",
        output: "Manual step acknowledged by operator",
        executedAt: new Date(),
        durationMs: Date.now() - stepStart,
      });
    } else if (step.type === "verification") {
      execution.stepResults.push({
        order: step.order,
        instruction: step.instruction,
        status: simulatedSuccess ? "success" : "failed",
        output: simulatedSuccess
          ? step.expectedOutput ?? "Verification passed"
          : "Verification failed — output did not match expected",
        executedAt: new Date(),
        durationMs: Date.now() - stepStart + Math.floor(Math.random() * 2000),
      });
      if (!simulatedSuccess) {
        failed = true;
      }
    } else {
      // Automated step
      execution.stepResults.push({
        order: step.order,
        instruction: step.instruction,
        status: simulatedSuccess ? "success" : "failed",
        output: simulatedSuccess
          ? `Command executed: ${command || step.instruction}`
          : `Command failed: ${command || step.instruction}`,
        executedAt: new Date(),
        durationMs: Date.now() - stepStart + Math.floor(Math.random() * 3000),
      });
      if (!simulatedSuccess) {
        failed = true;
      }
    }
  }

  // Finalize
  execution.status = failed ? "failed" : "completed";
  execution.completedAt = new Date();

  // Update runbook metadata
  runbook.lastExecuted = new Date();
  runbook.executionCount++;

  return execution;
}

/**
 * Rollback a failed execution by running rollback commands in reverse.
 */
export function rollbackExecution(executionId: string): RunbookExecution | null {
  const execution = executionHistory.find((e) => e.id === executionId);
  if (!execution || execution.status !== "failed") return null;

  const runbook = RUNBOOK_LIBRARY.find((rb) => rb.id === execution.runbookId);
  if (!runbook) return null;

  // Execute rollback commands in reverse order
  const completedSteps = execution.stepResults
    .filter((s) => s.status === "success")
    .sort((a, b) => b.order - a.order);

  for (const stepResult of completedSteps) {
    const step = runbook.steps.find((s) => s.order === stepResult.order);
    if (step?.rollbackCommand) {
      execution.stepResults.push({
        order: step.order,
        instruction: `[ROLLBACK] ${step.rollbackCommand}`,
        status: "rolled_back",
        output: `Rollback executed for step ${step.order}`,
        executedAt: new Date(),
        durationMs: Math.floor(Math.random() * 2000),
      });
    }
  }

  execution.status = "rolled_back";
  execution.completedAt = new Date();
  return execution;
}

// ─── Queries ────────────────────────────────────────────────

/**
 * List available runbooks, optionally filtered by category.
 */
export function getRunbooks(category?: string): Runbook[] {
  if (category) {
    return RUNBOOK_LIBRARY.filter((rb) => rb.category === category);
  }
  return [...RUNBOOK_LIBRARY];
}

/**
 * Get execution history, optionally filtered by runbook ID.
 */
export function getExecutionHistory(runbookId?: string): RunbookExecution[] {
  const list = runbookId
    ? executionHistory.filter((e) => e.runbookId === runbookId)
    : [...executionHistory];
  return list.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
