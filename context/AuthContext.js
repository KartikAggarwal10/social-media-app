"use client";

// give user data to frontend

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

const AuthContext = createContext(null);

function AuthStateProvider({ children }) {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session and localStorage
  useEffect(() => {
    // 1. If NextAuth has an active session, use it
    if (session?.user) {
      const appUserId = session.user.userId ?? session.user.id;
      if (appUserId !== undefined && appUserId !== null) {
        const parsed = Number(appUserId);
        const resolvedId = Number.isInteger(parsed) ? parsed : appUserId;
        setUserId(resolvedId);
        setUser(session.user.name || session.user.email);
        try {
          localStorage.setItem("userId", String(resolvedId));
          if (session.user.name) {
            localStorage.setItem("user", JSON.stringify(session.user.name));
          }
        } catch (e) {
          console.error("LocalStorage write error:", e);
        }
        setLoading(false);
        return;
      }
    }

    // 2. Fallback to localStorage if no NextAuth session yet
    try {
      const storedUserId = localStorage.getItem("userId");
      const storedUser = localStorage.getItem("user");

      if (storedUserId !== null && storedUserId !== undefined && storedUserId !== "") {
        const parsedId = isNaN(Number(storedUserId)) ? storedUserId : Number(storedUserId);
        setUserId(parsedId);
      } else if (status !== "loading") {
        setUserId(null);
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (typeof parsed === "object" && parsed !== null) {
            setUser(parsed.user || parsed.userName || parsed.name || parsed.email || String(parsed));
          } else {
            setUser(String(parsed));
          }
        } catch {
          setUser(storedUser);
        }
      } else if (status !== "loading") {
        setUser(null);
      }
    } catch (err) {
      console.error("Error reading auth state:", err);
    } finally {
      if (status !== "loading") {
        setLoading(false);
      }
    }
  }, [session, status]);

  // Login helper for manual state setting
  const login = (userData) => {
    const id = userData.userId !== undefined ? userData.userId : (userData._id || userData.id);
    const userName = userData.user || userData.userName || userData.name;
    const numericId = !isNaN(Number(id)) ? Number(id) : id;
    setUserId(numericId);
    setUser(userName);

    try {
      localStorage.setItem("userId", String(numericId));
      localStorage.setItem("user", JSON.stringify(userName));
    } catch (e) {
      console.error("LocalStorage write error:", e);
    }
  };

  // Logout helper
  const logout = () => {
    setUserId(null);
    setUser(null);
    try {
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
    } catch (e) {
      console.error("LocalStorage remove error:", e);
    }
    signOut({ callbackUrl: "/login" });
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        user,
        loading,
        isAuthenticated: userId !== null && userId !== undefined,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
}

// Custom hook to use auth anywhere
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
