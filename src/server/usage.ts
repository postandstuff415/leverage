/**
 * Usage tracking for the Leverage platform.
 *
 * Logs every tool execution to the `usage_logs` table via team-db.
 * Each record tracks: id, user_id, tool_id, timestamp, status.
 */

export interface UsageLogEntry {
  id: string;
  user_id: string;
  tool_id: string;
  timestamp: string;
  status: "success" | "failed";
}

/**
 * Generate a simple UUID v4 (no external deps).
 */
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Log a tool execution to the usage_logs table.
 * Uses the `team-db` CLI for Turso sync.
 */
export async function logUsage(
  userId: string,
  toolId: string,
  status: "success" | "failed",
): Promise<void> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  // Build a SQL-safe INSERT statement
  const escapedUserId = userId.replace(/'/g, "''");
  const escapedToolId = toolId.replace(/'/g, "''");

  const sql = `INSERT INTO usage_logs (id, user_id, tool_id, timestamp, status) VALUES ('${id}', '${escapedUserId}', '${escapedToolId}', '${timestamp}', '${status}')`;

  try {
    // Use team-db CLI (must be in PATH)
    const { execSync } = await import("node:child_process");
    execSync(`team-db "${sql.replace(/"/g, '\\"')}"`, {
      timeout: 10_000,
      stdio: "ignore",
    });
  } catch (err) {
    // Log but don't throw — usage tracking should never block execution
    console.warn(
      `[Leverage] Failed to log usage for tool "${toolId}":`,
      err instanceof Error ? err.message : err,
    );
  }
}