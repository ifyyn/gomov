"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { navForRole, ROLE_LABEL, type NavItem } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/Logo";

function SidebarContent({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            {group}
          </p>
          <div className="flex flex-col gap-1">
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-amber-600 text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const { ready: storeReady } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !storeReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="flex items-center gap-3 text-stone-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
          Memuat sistem...
        </div>
      </div>
    );
  }

  const items = navForRole(user.role);

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-3">
          <Logo />
          <div>
            <p className="font-bold leading-tight text-stone-800">GOMOV</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent items={items} />
        </div>
        <div className="border-t border-stone-200 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            <Icon name="logout" size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-stone-200 bg-white">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Logo />
                <span className="font-bold text-stone-800">GOMOV</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                aria-label="Tutup menu"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent items={items} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-stone-200 p-3">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                <Icon name="logout" size={18} />
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
            aria-label="Buka menu"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-stone-500">
              Sistem Penjualan Kopi Keliling
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-stone-800">
                {user.name}
              </p>
              <p className="text-xs text-stone-500">{ROLE_LABEL[user.role]}</p>
            </div>
            <Link
              href="/profil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white"
            >
              {user.name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
