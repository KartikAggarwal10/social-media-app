// lib/requireUser.js
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { cookies } from "next/headers";

export async function requireUser() {
  console.log("came in require user");
  
  // 1. Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user) {
    console.log("session found:", session.user);
    const rawId = session.user.id ?? session.user.userId;
    const numericId = rawId !== undefined && !isNaN(Number(rawId)) ? Number(rawId) : rawId;
    console.log("numericId is : " + numericId);
    return {
      ...session.user,
      id: numericId,
      userId: numericId,
    };
  }

  // 2. Fallback to custom userId cookie set during custom login/signup
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId")?.value;

  if (userIdCookie !== undefined && userIdCookie !== null && userIdCookie !== "") {
    const numericId = !isNaN(Number(userIdCookie)) ? Number(userIdCookie) : userIdCookie;
    console.log("numericId from cookie is : " + numericId);
    return {
      id: numericId,
      userId: numericId,
    };
  }

  console.log("unauthorized");
  throw new Error("Unauthorized");
}
