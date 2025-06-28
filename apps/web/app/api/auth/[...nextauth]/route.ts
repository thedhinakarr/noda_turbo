import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    AzureADProvider({
      clientId: process.env.AUTH_AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID!,
    }),
    // ...add more providers here if needed
  ],
  // We can add custom pages and callbacks here later if needed
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
