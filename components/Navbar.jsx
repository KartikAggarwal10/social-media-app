"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
export default function Navbar() {
  const pathname = usePathname();
  const {userId} = useAuth()
  const navLinks = [
    { name: "Home (Posts)", href: "/posts" },
    { name: "Network", href: "/network" },
    { name: "Discover", href: "/discover" },
    { name: "My Profile", href: `/profile/${userId}` }, // Using 1 as a placeholder for current user
  ];

  return (
    <nav className="bg-[#071126] text-white border-b border-white/10 p-4">
      <div className="max-w-4xl mx-auto flex gap-6">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`font-semibold transition-colors ${
                isActive ? "text-violet-400" : "text-gray-400 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
