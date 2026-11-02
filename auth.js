import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_Client_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_Client_secret || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "social_media_app_secret_key",
  pages: {
    signIn: "/login",
  },
};