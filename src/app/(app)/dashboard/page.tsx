"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, formatNumber, isSameDay, isSameMonth, todayISO, currentPeriod, monthLabel, localDateKey } from "@/lib/format";
import { statusLabel, unitLabel } from "@/lib/calc";
import { StatCard } from "@/components/StatCard";
import { Badge, Card, CardBody, CardHeader, EmptyState, Table, Td, Th } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function TrendArea({ data }: { data: { label: string; value: number }[] }) {
  const W = 700;
  const H = 220;
  const padX = 10;
  const padY = 18;
  const bottom = H - 22;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = (W - padX * 2) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: padX + i * step,
    y: bottom - (d.value / max) * (bottom - padY),
    label: d.label,
    value: d.value,
  }));
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${bottom} L${pts[0].x.toFixed(1)} ${bottom} Z`;
  const total7 = data.reduce((a, d) => a + d.value, 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-xs text-stone-400">Total 7 hari terakhir</p>
          <p className="text-lg font-bold text-stone-800">{formatIDR(total7)}</p>
        </div>
        <p className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Puncak {formatIDR(max)}
        </p>
      </div>

      <div className="relative h-52 w-full">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bca996" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#bca996" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={padX}
              x2={W - padX}
              y1={bottom - f * (bottom - padY)}
              y2={bottom - f * (bottom - padY)}
              stroke="#e7e5e4"
              strokeWidth="1"
            />
          ))}
          <path d={area} fill="url(#trendFill)" />
          <path
            d={line}
            fill="none"
            stroke="#7f6d5c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === pts.length - 1 ? 5 : 3.5}
              fill="#ffffff"
              stroke="#7f6d5c"
              strokeWidth="2"
            >
              <title>
                {p.label}: {formatIDR(p.value)}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-7">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-center text-[11px] ${
              i === data.length - 1
                ? "font-semibold text-amber-700"
                : "text-stone-400"
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PaymentDonut({ cash, qris }: { cash: number; qris: number }) {
  const total = cash + qris;
  const pct = total > 0 ? (cash / total) * 100 : 50;
  const r = 52;
  const c = 2 * Math.PI * r;
  const cashLen = (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#e3dad1"
            strokeWidth="14"
          />
          {total > 0 && (
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#7f6d5c"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${cashLen} ${c - cashLen}`}
              strokeDashoffset="0"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-stone-400">Hari Ini</span>
          <span className="text-xl font-bold text-stone-800">
            {formatIDR(total)}
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Cash</span>
            <span className="text-xs font-semibold text-emerald-700">
              {total > 0 ? `${Math.round(pct)}%` : "0%"}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-emerald-700">
            {formatIDR(cash)}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600">QRIS</span>
            <span className="text-xs font-semibold text-blue-700">
              {total > 0 ? `${100 - Math.round(pct)}%` : "0%"}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-blue-700">
            {formatIDR(qris)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data } = useStore();
  const { user } = useAuth();
  const role = user?.role ?? "owner";
  const today = todayISO();
  const period = currentPeriod();

  const stats = useMemo(() => {
    const todaySales = data.sales.filter((s) => isSameDay(s.date, today));
    const monthSales = data.sales.filter((s) => isSameMonth(s.date, period));

    const sum = (list: typeof todaySales, key: "total" | "totalHpp") =>
      list.reduce((acc, s) => acc + s[key], 0);
    const cups = (list: typeof todaySales) =>
      list.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.qty, 0), 0);

    const todayCash = todaySales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((a, s) => a + s.total, 0);
    const todayQris = todaySales
      .filter((s) => s.paymentMethod === "qris")
      .reduce((a, s) => a + s.total, 0);

    const monthCash = monthSales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((a, s) => a + s.total, 0);
    const monthQris = monthSales
      .filter((s) => s.paymentMethod === "qris")
      .reduce((a, s) => a + s.total, 0);

    const piutangAktif = data.receivables.filter((r) => {
      const paid = r.payments.reduce((a, p) => a + p.amount, 0);
      return r.total - paid > 0;
    });
    const totalPiutang = piutangAktif.reduce(
      (a, r) => a + (r.total - r.payments.reduce((b, p) => b + p.amount, 0)),
      0,
    );

    const todayDeposits = data.deposits.filter((d) => isSameDay(d.date, today));
    const problemDeposits = data.deposits.filter((d) => d.status !== "sesuai");

    const trend: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = localDateKey(d);
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
      trend.push({
        label: dayLabel,
        value: data.sales
          .filter((s) => isSameDay(s.date, dayStr))
          .reduce((a, s) => a + s.total, 0),
      });
    }

    const lowStock = data.ingredients.filter(
      (ing) => ing.stockBase <= ing.minStockBase,
    );

    return {
      todayTotal: sum(todaySales, "total"),
      todayHpp: sum(todaySales, "totalHpp"),
      todayCash,
      todayQris,
      todayCount: todaySales.length,
      todayCups: cups(todaySales),
      monthTotal: sum(monthSales, "total"),
      monthCash,
      monthQris,
      monthGross: sum(monthSales, "total") - sum(monthSales, "totalHpp"),
      monthHpp: sum(monthSales, "totalHpp"),
      piutangList: piutangAktif,
      totalPiutang,
      todayDeposits,
      problemDeposits,
      trend,
      lowStock,
    };
  }, [data, today, period]);

  const recentSales = data.sales.slice(0, 10);

  const yesterdayValue = stats.trend[stats.trend.length - 2]?.value ?? 0;
  const diff = stats.todayTotal - yesterdayValue;
  const delta =
    yesterdayValue > 0
      ? { pct: Math.round((diff / yesterdayValue) * 100), up: diff >= 0 }
      : diff > 0
        ? { pct: 1000, up: true }
        : stats.todayTotal > 0
          ? { pct: 1000, up: true }
          : { pct: 0, up: true };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-amber-700">
              {greeting()} 👋
            </p>
            <h1 className="mt-1 text-2xl font-bold text-stone-800 sm:text-3xl">
              {user?.name}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {formatDateShort(new Date())}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/penjualan"
                className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Buka POS
              </Link>
              <Link
                href="/setoran"
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                Setoran Harian
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Omset Bulan Ini
              </p>
              <p className="mt-1 break-words text-base font-bold leading-tight text-stone-800 sm:text-xl">
                {formatIDR(stats.monthTotal)}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">
                {formatIDR(stats.monthCash)} Cash · {formatIDR(stats.monthQris)} QRIS
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Laba Bulan Ini
              </p>
              <p className="mt-1 break-words text-base font-bold leading-tight text-stone-800 sm:text-xl">
                {formatIDR(stats.monthGross)}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">
                setelah HPP {formatIDR(stats.monthHpp)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Penjualan Hari Ini"
          value={formatIDR(stats.todayTotal)}
          hint={`Bulan ${monthLabel(period)}: ${formatIDR(stats.monthTotal)}`}
          icon="banknote"
          tone="amber"
          delta={delta}
        />
        <StatCard
          label="Transaksi / Cup"
          value={`${formatNumber(stats.todayCount)} / ${formatNumber(stats.todayCups)}`}
          hint="Jumlah transaksi & cup terjual"
          icon="cart"
          tone="blue"
        />
        <StatCard
          label="HPP & Estimasi Laba"
          value={formatIDR(stats.todayTotal - stats.todayHpp)}
          hint={`HPP hari ini: ${formatIDR(stats.todayHpp)}`}
          icon="chart"
          tone="green"
        />
        <StatCard
          label="Piutang Aktif"
          value={formatIDR(stats.totalPiutang)}
          hint={`${stats.piutangList.length} pelanggan belum lunas`}
          icon="receipt"
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pembayaran Hari Ini"
            subtitle="Porsi Cash vs QRIS"
          />
          <CardBody>
            <PaymentDonut cash={stats.todayCash} qris={stats.todayQris} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Status Setoran"
            subtitle="Selisih setoran kasir"
            action={
              <Link
                href="/setoran"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Kelola →
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {stats.problemDeposits.slice(0, 4).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {d.cashierName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-700">
                      {d.cashierName}
                    </p>
                    <p className="text-xs text-stone-400">
                      {new Date(d.date).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge tone={d.status === "kurang" ? "red" : "amber"}>
                    {statusLabel(d.status)}
                  </Badge>
                  <p className="mt-0.5 text-xs text-stone-500">
                    selisih {formatIDR(d.difference)}
                  </p>
                </div>
              </div>
            ))}
            {stats.problemDeposits.length === 0 && (
              <p className="py-4 text-center text-sm text-stone-400">
                Semua setoran sesuai ✓
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Tren Penjualan 7 Hari"
            subtitle="Total omset per hari"
          />
          <CardBody>
            <TrendArea data={stats.trend} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Stok Menipis"
            subtitle="Di bawah batas minimum"
            action={
              <Link
                href="/stok"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Lihat →
              </Link>
            }
          />
          <CardBody className="max-h-64 space-y-2 overflow-y-auto">
            {stats.lowStock.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon name="alert" size={16} className="shrink-0 text-red-500" />
                  <span className="truncate text-sm font-medium text-stone-700">
                    {ing.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-600 shadow-sm">
                  {formatNumber(ing.stockBase)} {unitLabel(ing)}
                </span>
              </div>
            ))}
            {stats.lowStock.length === 0 && (
              <p className="py-4 text-center text-sm text-stone-400">
                Stok aman ✓
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {(role === "owner" || role === "admin") && (
        <Card>
          <CardHeader
            title="Transaksi Terakhir"
            action={
              <Link
                href="/penjualan"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Buka POS →
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentSales.length === 0 ? (
              <EmptyState
                title="Belum ada transaksi"
                description="Transaksi POS akan muncul di sini"
                icon="cart"
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Waktu</Th>
                    <Th>Kasir</Th>
                    <Th className="hidden md:table-cell">Item</Th>
                    <Th>Metode</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((s) => (
                    <tr key={s.id} className="transition hover:bg-stone-50">
                      <Td>
                        {new Date(s.date).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>{s.cashierName}</Td>
                      <Td className="hidden md:table-cell">
                        {s.items.slice(0, 2).map((i) => i.productName).join(", ")}
                        {s.items.length > 2 && ` +${s.items.length - 2}`}
                      </Td>
                      <Td>
                        <Badge tone={s.paymentMethod === "cash" ? "green" : "blue"}>
                          {s.paymentMethod === "cash" ? "Cash" : "QRIS"}
                        </Badge>
                      </Td>
                      <Td className="text-right font-semibold text-stone-800">
                        {formatIDR(s.total)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}