"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, FileText, MessageSquare, Settings, Compass } from "lucide-react";

const links = [
  { href: "/dashboard",   label: "Dashboard",  icon: BarChart3 },
  { href: "/documents",   label: "Documents",  icon: FileText },
  { href: "/consultant",  label: "Consultant", icon: MessageSquare },
  { href: "/settings",    label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 flex flex-col h-full border-r"
      style={{ background: "var(--color-navy)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-parchment)" }}
          >
            <Compass size={16} style={{ color: "var(--color-navy)" }} />
          </div>
          <div>
            <p className="text-white text-sm font-serif leading-tight">The Navigator</p>
            <p className="text-white/40 text-[10px]">by Nomad Consulting</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "rgba(245,230,200,0.12)" : "transparent",
                color: active ? "var(--color-parchment)" : "rgba(255,255,255,0.55)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
            },
          }}
        />
        <span className="text-white/50 text-xs">Account</span>
      </div>
    </aside>
  );
}
