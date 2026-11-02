"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionProvider, signOut } from "next-auth/react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log("came in auth context");
  // 1. On page load / refresh, restore session from localStorage / cookies
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("userId");
      const storedUser = localStorage.getItem("user");
      
      if (storedUserId) {
        // Parse it so "0" becomes 0 (Number) instead of a string,
        // which prevents MongoDB query failures that expect a Number.
        console.log("console.in auth_context : " + storedUserId + " -> " + storedUser)
        const parsedId = isNaN(Number(storedUserId)) ? storedUserId : Number(storedUserId);
        setUserId(parsedId);
      }
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Ensure we always store a plain string, not an object
          if (typeof parsed === "object" && parsed !== null) {
            setUser(parsed.user || parsed.userName || parsed.name || parsed.email || String(parsed));
          } else {
            setUser(String(parsed));
          }
        } catch {
          setUser(storedUser);
        }
      }
    } catch (err) {
      console.error("Error reading auth state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Login / Set current user
  const login = (userData) => {
    const id = userData.userId !== undefined ? userData.userId : (userData._id || userData.id);
    const userName = userData.user || userData.userName || userData.name;
    setUserId(id);
    setUser(userName);

    // Save to localStorage
    localStorage.setItem("userId", String(id));
    localStorage.setItem("user", JSON.stringify(userName));

    // Also set cookie for Server Components & API routes (expires in 30 days)
    document.cookie = `userId=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  };

  // 3. Logout / Clear user
  const logout = () => {
  setUserId(null);
  setUser(null);
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  document.cookie =  "userId=; path=/; max-age=0; SameSite=Lax";
  signOut({ callbackUrl: "/login" }); // Add this to clear NextAuth session
};


  return (
    <SessionProvider>
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