import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AUTH_AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AUTH_AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
      // This is crucial to get the access token
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    // We are adding the access token to the JWT here.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    // We are adding the access token to the session object here.
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});