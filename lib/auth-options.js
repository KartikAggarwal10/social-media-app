import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";

// Auto-detect and sanitize NEXTAUTH_URL when running on Vercel
if (process.env.VERCEL) {
  process.env.AUTH_TRUST_HOST = "true";
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    const host =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL;
    if (host) {
      process.env.NEXTAUTH_URL = `https://${host}`;
    }
  }
}

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_Client_ID ||
        "",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_Client_secret ||
        "",
    }),

    CredentialsProvider({
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = await connectDB();

        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user?.password) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: String(user.userId),
          name: user.userName,
          email: user.email,
          userId: user.userId,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        try {
          const db = await connectDB();
          let dbUser = await db.collection("users").findOne({ email: user.email });
          if (!dbUser) {
            const userCount = await db.collection("users").countDocuments();
            const finalUserName = user.name || (user.email ? user.email.split("@")[0] : "User");
            const newUser = {
              userId: userCount,
              userName: finalUserName,
              email: user.email,
              password: "",
              bio: "",
              posts: [],
              dp: user.image || "/user.png",
              likes: [],
              comments: [],
              followed: [],
              followers: [],
              request_sent: [],
              request_came: [],
              bookmarks: [],
              chats: [],
            };
            await db.collection("users").insertOne(newUser);
            user.userId = userCount;
          } else {
            user.userId = dbUser.userId;
          }
        } catch (err) {
          console.error("Error in signIn callback:", err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        if (user.userId !== undefined && user.userId !== null) {
          token.userId = user.userId;
          token.id = user.userId;
        } else if (user.email) {
          const db = await connectDB();
          const dbUser = await db.collection("users").findOne({
            email: user.email,
          });

          if (dbUser) {
            token.userId = dbUser.userId;
            token.id = dbUser.userId;
          } else {
            token.id = user.id;
          }
        }
      }

      if (
        (token.userId === undefined || token.userId === null) &&
        token.email
      ) {
        const db = await connectDB();
        const dbUser = await db.collection("users").findOne({
          email: token.email,
        });

        if (dbUser) {
          token.userId = dbUser.userId;
          token.id = dbUser.userId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        const appUserId = token.userId ?? token.id;
        if (appUserId !== undefined && appUserId !== null) {
          session.user.userId = appUserId;
          session.user.id = appUserId;
        }
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};