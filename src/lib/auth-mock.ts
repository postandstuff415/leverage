/**
 * Mock authentication system for the Leverage platform.
 *
 * Toggleable via VITE_ENABLE_MOCK_AUTH env variable.
 * When enabled, returns a dummy user session.
 * When disabled, returns null (no session).
 */

export interface MockSession {
  userId: string;
  userName: string;
  displayName: string;
  isSubscribed: boolean;
  email: string;
}

/**
 * Returns the current mock session based on environment variables.
 *
 * - VITE_ENABLE_MOCK_AUTH=true enables the mock auth system
 * - VITE_MOCK_SUBSCRIBED=false makes the user unsubscribed (shows gate)
 * - Default: both enabled, user is subscribed
 */
export function getMockSession(): MockSession | null {
  const enabled =
    typeof process !== "undefined"
      ? process.env.VITE_ENABLE_MOCK_AUTH !== "false"
      : true;

  if (!enabled) return null;

  const isSubscribed =
    typeof process !== "undefined"
      ? process.env.VITE_MOCK_SUBSCRIBED !== "false"
      : true;

  return {
    userId: "mock-user-1",
    userName: "jane_entrepreneur",
    displayName: "Jane Doe",
    isSubscribed,
    email: "jane@example.com",
  };
}
