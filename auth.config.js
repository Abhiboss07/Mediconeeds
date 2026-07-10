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
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.sellerStatus = user.sellerStatus ?? null;
        token.name = user.name;
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
