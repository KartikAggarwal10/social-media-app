"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Redirect after logging out
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl text-white text-center">
        <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-500/10 rounded-full text-red-400">
                <LogOut size={32} />
            </div>
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">Sign out</h2>
        <p className="text-sm text-white/60 mb-8">
          Are you sure you want to log out of your account?
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-3.5 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-400 font-semibold transition border border-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}