import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

// This is your main Auth.js configuration object.
export const {
  handlers: { GET, POST }, // These will be used in your API route
  auth,                     // This is the function your middleware will use
  signIn,                   // For your login button
  signOut,                  // For your logout button
} = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AUTH_AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AUTH_AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AUTH_AZURE_AD_TENANT_ID,
    }),
  ],
});
