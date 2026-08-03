"use client";

import {
  ArrowLeftRight,
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { userLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Özet", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portföy", icon: ArrowLeftRight },
  { href: "/groups", label: "Gruplar", icon: Users },
  { href: "/accounts", label: "Hesaplar", icon: Wallet },
  { href: "/bills", label: "Faturalar", icon: Receipt },
];

function navLinkClass(active: boolean, compact = false) {
  return cn(
    "font-medium transition-colors",
    compact ?
      "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[0.65rem] sm:text-xs"
    : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
    active ?
      "bg-[var(--nav-active)] text-[var(--nav-active-foreground)] shadow-sm"
    : "text-[var(--muted-foreground)] hover:bg-[var(--nav-hover)] hover:text-[var(--foreground)]",
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={navLinkClass(active, compact)}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "shrink-0",
          compact ? "h-5 w-5" : "h-5 w-5",
          active ? "opacity-100" : "opacity-80",
        )}
        aria-hidden
      />
      <span className={compact ? "truncate" : undefined}>{label}</span>
    </Link>
  );
}

export function AppShellClient({
  user,
  children,
}: {
  user: { email: string; displayName?: string | null };
  children: React.ReactNode;
}) {
  const currentPath = usePathname();

  function isActive(href: string) {
    return (
      currentPath === href ||
      (href !== "/dashboard" && currentPath.startsWith(href))
    );
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden border-r border-[var(--border)] bg-[var(--card)] md:flex md:w-56 md:flex-col">
        <div className="flex h-16 items-center px-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-[var(--foreground)]"
          >
            Finans
          </Link>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Ana menü">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </nav>
        <Separator />
        <div className="space-y-3 p-4">
          <ThemeToggle className="w-full justify-center" />
          <div>
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {userLabel(user)}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobil üst çubuk */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 md:hidden">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-[var(--foreground)]"
          >
            Finans
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex max-w-[9rem] flex-col items-end gap-1">
              <span className="truncate text-xs font-medium text-[var(--foreground)]">
                {userLabel(user)}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-4 pb-24 md:overflow-visible md:p-8 md:pb-8">
          {children}
        </main>

        {/* Mobil alt navigasyon */}
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          aria-label="Ana menü"
        >
          <div className="grid grid-cols-5 gap-1 px-2 pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                compact
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
