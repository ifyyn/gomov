"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Button, Field, Input } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/Logo";

const FEATURES = [
  "POS dan rekap omzet real-time",
  "Stok bahan baku selalu terkontrol",
  "Setoran kasir & piutang pelanggan",
  "Penggajian, operasional & laporan",
];

export default function LoginPage() {
  const { user, users, ready, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const homeFor = (role: Role) =>
    navForRole(role)[0]?.href ?? "/dashboard";

  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role));
  }, [ready, user, router]);

  const goHome = (uname: string) => {
    const u = users.find(
      (x) => x.username.toLowerCase() === uname.trim().toLowerCase(),
    );
    if (u) router.replace(homeFor(u.role));
    else router.replace("/dashboard");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(username, password);
    if (res.ok) goHome(username);
    else setError(res.error ?? "Gagal masuk.");
  };

  return (
    <div className="flex min-h-screen bg-white">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#5f5145] via-[#7a6b58] to-[#a89480] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Logo className="h-9 w-9" />
          </div>
          <div>
            <p className="font-bold leading-tight">GOMOV</p>
            <p className="text-xs text-white/70">Sistem Rekap Kopi Keliling</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-snug sm:text-4xl">
            Kelola bisnis kopi keliling jadi lebih rapi.
          </h1>
          <p className="mt-3 text-white/75">
            Satu aplikasi untuk penjualan, stok, setoran, piutang, gaji, dan
            laporan usaha Anda.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Icon name="check" size={12} />
                </span>
                <span className="text-sm text-white/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © 2026 GOMOV · Kopi Keliling
        </p>
      </section>

      <section className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-28 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-amber-100 blur-3xl" />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center">
              <Logo className="h-24 w-24" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">GOMOV</h1>
            <p className="mt-1 text-sm text-stone-500">
              Sistem Rekap Kopi Keliling
            </p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-stone-800">
              Selamat datang kembali
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Masuk untuk mengelola usaha Anda.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-2xl border border-stone-200/70 bg-white/90 p-6 shadow-xl shadow-stone-900/5 backdrop-blur"
          >
            <Field label="Username">
              <div className="relative">
                <Icon
                  name="user"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Masukkan username"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </Field>
            <Field label="Password" className="mt-4">
              <div className="relative">
                <Icon
                  name="lock"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Masukkan password"
                  className="px-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 transition hover:text-stone-600"
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </Field>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <Icon name="alert" size={16} />
                {error}
              </div>
            )}

            <Button type="submit" className="mt-5 w-full" icon="logout">
              Masuk
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}