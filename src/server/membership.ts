/**
 * Membership check server function.
 * Lets the client verify subscription status before showing tool canvas.
 */
import { createServerFn } from "@tanstack/react-start";
import { getMockSession } from "~/lib/auth-mock";

export interface MembershipStatus {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  userDisplayName: string | null;
}

export const checkMembership = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = getMockSession();

    if (!session) {
      return {
        isLoggedIn: false,
        isSubscribed: false,
        userDisplayName: null,
      } satisfies MembershipStatus;
    }

    return {
      isLoggedIn: true,
      isSubscribed: session.isSubscribed,
      userDisplayName: session.displayName,
    } satisfies MembershipStatus;
  },
);