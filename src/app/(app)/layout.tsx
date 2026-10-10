"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { canAccess, navForRole } from "@/lib/nav";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccess(user.role, pathname)) {
      const firstAllowed = navForRole(user.role)[0]?.href ?? "/login";
      if (firstAllowed !== pathname) router.replace(firstAllowed);
    }
  }, [ready, user, pathname, router]);

  if (!ready || !user || !canAccess(user.role, pathname)) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}