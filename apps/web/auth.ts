import NextAuth from "next-auth";
import MicrosoftEntraID from "@auth/core/providers/microsoft-entra-id";

const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: clientId,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      
      // --- FIX: Use the 'common' tenant for multi-tenant login flows ---
      // This allows users from any organization to sign in correctly.
      tenantId: "common", 
      
      authorization: {
        params: {
          scope: `openid profile email offline_access api://${clientId}/access_as_user`,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
