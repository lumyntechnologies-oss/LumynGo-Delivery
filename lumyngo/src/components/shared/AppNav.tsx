"use client";

import { UserButton } from "@clerk/nextjs";
import { Zap, Package, Map, TrendingUp, LayoutDashboard, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppNavProps {
  role: "CUSTOMER" | "RIDER" | "ADMIN";
}

const navLinks = {
  CUSTOMER: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: Package },
  ],
  RIDER: [
    { href: "/rider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/rider/orders", label: "Orders", icon: Package },
    { href: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
};

export default function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const links = navLinks[role];

  return (
    <nav className="border-b border-slate-800 bg-slate-950 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">LumynGo</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role === "ADMIN" && (
            <span className="bg-purple-600/20 text-purple-400 border border-purple-600/30 px-2 py-0.5 rounded text-xs font-medium">
              Admin
            </span>
          )}
          {role === "RIDER" && (
            <span className="bg-green-600/20 text-green-400 border border-green-600/30 px-2 py-0.5 rounded text-xs font-medium">
              Rider
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
