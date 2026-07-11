// ============================================================================
// Auth.js base config — EDGE-SAFE. Contains no database/Mongoose imports so it
// can be used by middleware (edge runtime) to decode the JWT session. The
// Credentials provider (which needs the DB) is added separately in auth.js.
// ============================================================================

/** @type {import("next-auth").NextAuthConfig} */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7-day sessions
  pages: { signIn: "/login" },
  providers: [], // real providers are attached in auth.js (Node runtime)
  callbacks: {
    // Persist identity + role on the token at sign-in; reused on every request.
    // On a client-triggered `update` (e.g. profile rename) refresh the display
    // name so the navbar greeting reflects the edit without a re-login. Edge-safe:
    // the new value comes from the client payload, not the DB.
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.sellerStatus = user.sellerStatus ?? null;
        token.name = user.name;
      }
      if (trigger === "update" && session && typeof session.name === "string" && session.name.trim()) {
        token.name = session.name.trim();
      }
      return token;
    },
    // Expose the safe bits to the client/session.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.sellerStatus = token.sellerStatus ?? null;
      }
      return session;
    },
  },
};
