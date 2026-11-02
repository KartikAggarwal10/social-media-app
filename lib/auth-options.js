import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async jwt({ token, user }) {
  if (user) {
    if (user.userId !== undefined && user.userId !== null) {
      // Your application's MongoDB userId
      token.userId = user.userId;
      token.id = user.userId;
    } else if (user.email) {
      const db = await connectDB();

      const dbUser = await db.collection("users").findOne({
        email: user.email,
      });

      if (dbUser) {
        // Preserve the type stored in MongoDB
        token.userId = dbUser.userId;
        token.id = dbUser.userId;
      } else {
        // Provider ID fallback
        token.id = user.id;
      }
    }
  }

  if (
    (token.userId === undefined || token.id === undefined) &&
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
        if (appUserId === undefined || appUserId === null) {
          throw new Error("No application userId found in NextAuth token");
        }
        session.user.userId = appUserId;
        session.user.id = appUserId;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};