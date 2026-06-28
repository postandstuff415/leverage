/**
 * Server-side middleware for the Leverage platform.
 *
 * Provides auth middleware that checks for a valid (subscribed) session
 * before allowing tool execution.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getMockSession } from "~/lib/auth-mock";

export const authMiddleware = createMiddleware()
  .server(async ({ next, data }) => {
    const session = getMockSession();

    if (!session) {
      throw new Error(
        "Authentication required: Please sign in to use this tool.",
      );
    }

    if (!session.isSubscribed) {
      throw new Error(
        "Membership required: Subscribe for $29/month to unlock all tools. Visit the Pricing page to upgrade.",
      );
    }

    // Pass userId through context for downstream use (e.g., usage tracking)
    return next({ context: { userId: session.userId } });
  });