// lib/requireUser.js
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "./auth-options";
import { cookies } from "next/headers";

export async function requireUser() {
  // 1. Try NextAuth session first
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const rawId = session.user.userId ?? session.user.id;
      if (rawId !== undefined && rawId !== null) {
        const numericId = !isNaN(Number(rawId)) ? Number(rawId) : rawId;
        return {
          ...session.user,
          id: numericId,
          userId: numericId,
        };
      }
    }
  } catch (err) {
    console.error("getServerSession error in requireUser:", err);
  }

  // 2. Fallback: decode session token directly from cookies
  // This solves HTTPS / Vercel cookie mismatch issues where getServerSession returns null
  try {
    const cookieStore = await cookies();
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

    const secureToken = cookieStore.get("__Secure-next-auth.session-token")?.value;
    const standardToken = cookieStore.get("next-auth.session-token")?.value;
    const rawToken = secureToken || standardToken;

    if (rawToken && secret) {
      const decoded = await decode({ token: rawToken, secret });
      if (decoded) {
        const rawId = decoded.userId ?? decoded.id;
        if (rawId !== undefined && rawId !== null) {
          const numericId = !isNaN(Number(rawId)) ? Number(rawId) : rawId;
          return {
            ...decoded,
            id: numericId,
            userId: numericId,
          };
        }
      }
    }
  } catch (err) {
    console.error("Direct cookie decoding error in requireUser:", err);
  }

  console.log("requireUser unauthorized");
  throw new Error("Unauthorized");
}
