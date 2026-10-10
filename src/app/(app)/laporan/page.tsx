"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  currentPeriod,
  formatIDR,
  formatNumber,
  isSameMonth,
  localDateKey,
  monthLabel,
  todayISO,
} from "@/lib/format";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { statusLabel } from "@/lib/calc";

type Tab = "penjualan" | "laba" | "kas" | "piutang";
const TABS: { key: Tab; label: string }[] = [
  { key: "penjualan", label: "Penjualan" },
  { key: "laba", label: "Laba-Rugi" },
  { key: "kas", label: "Arus Kas" },
  { key: "piutang", label: "Piutang" },
];

export default function LaporanPage() {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>("penjualan");
  const [period, setPeriod] = useState(currentPeriod());

  const monthSales = useMemo(
    () => data.sales.filter((s) => isSameMonth(s.date, period)),
    [data.sales, period],
  );
  const monthExpenses = useMemo(
    () => data.expenses.filter((e) => isSameMonth(e.date, period)),
    [data.expenses, period],
  );
  const monthWastes = useMemo(
    () => data.wastes.filter((w) => isSameMonth(w.date, period)),
    [data.wastes, period],
  );
  const monthPayrolls = useMemo(
    () => data.payrolls.filter((p) => p.period === period),
    [data.payrolls, period],
  );

  const revenue = monthSales.reduce((a, s) => a + s.total, 0);
  const hpp = monthSales.reduce((a, s) => a + s.totalHpp, 0);
  const gross = revenue - hpp;
  const expenseTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const wasteTotal = monthWastes.reduce((a, w) => a + w.cost, 0);
  const payrollTotal = monthPayrolls.reduce((a, p) => a + p.total, 0);
  const net = gross - expenseTotal - wasteTotal - payrollTotal;

  const cashTotal = monthSales
    .filter((s) => s.paymentMethod === "cash")
    .reduce((a, s) => a + s.total, 0);
  const qrisTotal = monthSales
    .filter((s) => s.paymentMethod === "qris")
    .reduce((a, s) => a + s.total, 0);

  const productBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; qty: number; revenue: number; hpp: number }
    >();
    for (const s of monthSales) {
      for (const i of s.items) {
        const cur = map.get(i.productId) ?? {
          name: i.productName,
          qty: 0,
          revenue: 0,
          hpp: 0,
        };
        cur.qty += i.qty;
        cur.revenue += i.price * i.qty;
        cur.hpp += i.hpp * i.qty;
        map.set(i.productId, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [monthSales]);

  const dailySales = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of monthSales) {
      const day = localDateKey(s.date);
      map.set(day, (map.get(day) ?? 0) + s.total);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [monthSales]);

  const receivableList = data.receivables.map((r) => {
    const paid = r.payments.reduce((a, p) => a + p.amount, 0);
    return { ...r, paid, remaining: r.total - paid };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Laporan penjualan, laba-rugi, arus kas, dan piutang"
        action={
          <input
            type="month"
            value={period}
            onChange={(e) => {
              if (e.target.value) setPeriod(e.target.value);
            }}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-amber-600 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "penjualan" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title={`Penjualan ${monthLabel(period)}`}
              subtitle={`${monthSales.length} transaksi, ${formatNumber(
                productBreakdown.reduce((a, p) => a + p.qty, 0),
              )} cup terjual`}
            />
            <CardBody className="p-0">
              {productBreakdown.length === 0 ? (
                <EmptyState title="Tidak ada data penjualan" icon="chart" />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Produk</Th>
                      <Th className="text-right">Qty</Th>
                      <Th className="text-right">HPP</Th>
                      <Th className="text-right">Omset</Th>
                      <Th className="text-right">Laba</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {productBreakdown.map((p, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        <Td className="font-medium">{p.name}</Td>
                        <Td className="text-right">{formatNumber(p.qty)}</Td>
                        <Td className="text-right">{formatIDR(p.hpp)}</Td>
                        <Td className="text-right font-semibold">
                          {formatIDR(p.revenue)}
                        </Td>
                        <Td className="text-right text-emerald-600">
                          {formatIDR(p.revenue - p.hpp)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Penjualan per Hari" />
            <CardBody className="max-h-[420px] overflow-y-auto p-0">
              {dailySales.length === 0 ? (
                <EmptyState title="Tidak ada data" icon="chart" />
              ) : (
                dailySales.map(([day, total]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between border-b border-stone-100 px-5 py-2.5 text-sm"
                  >
                    <span className="text-stone-600">
                      {new Date(day + "T00:00:00").toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-semibold">{formatIDR(total)}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "laba" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title={`Laba-Rugi ${monthLabel(period)}`} />
            <CardBody>
              <div className="space-y-3 text-sm">
                <Row label="Total Penjualan (Omset)" value={formatIDR(revenue)} />
                <Row label="Total HPP" value={`-${formatIDR(hpp)}`} negative />
                <Row
                  label="Estimasi Laba Kotor"
                  value={formatIDR(gross)}
                  strong
                  positive={gross >= 0}
                />
                <div className="my-2 border-t border-stone-200" />
                <Row
                  label="Biaya Operasional"
                  value={`-${formatIDR(expenseTotal)}`}
                  negative
                />
                <Row
                  label="Waste / Kerugian"
                  value={`-${formatIDR(wasteTotal)}`}
                  negative
                />
                <Row
                  label="Total Gaji Karyawan"
                  value={`-${formatIDR(payrollTotal)}`}
                  negative
                />
                <div className="my-2 border-t border-stone-200" />
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                  <span className="font-semibold text-amber-800">
                    Laba Bersih
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      net >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatIDR(net)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Rincian Pemotong Laba" />
            <CardBody className="space-y-4">
              <MiniList
                title={`Biaya Operasional (${monthExpenses.length})`}
                items={monthExpenses.map((e) => ({
                  label: `${e.category} — ${e.description}`,
                  value: e.amount,
                }))}
              />
              <MiniList
                title={`Waste (${monthWastes.length})`}
                items={monthWastes.map((w) => ({
                  label: `${w.itemName} (${formatNumber(w.qty)} ${w.unitLabel})`,
                  value: w.cost,
                }))}
              />
              <MiniList
                title={`Gaji Karyawan (${monthPayrolls.length})`}
                items={monthPayrolls.map((p) => ({
                  label: p.employeeName,
                  value: p.total,
                }))}
              />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "kas" && (
        <Card>
          <CardHeader
            title={`Arus Kas ${monthLabel(period)}`}
            subtitle="Perbandingan penerimaan Cash vs QRIS"
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-5">
                <p className="text-xs font-medium uppercase text-emerald-600">
                  Total Cash
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {formatIDR(cashTotal)}
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  {revenue ? ((cashTotal / revenue) * 100).toFixed(0) : 0}% dari omset
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-xs font-medium uppercase text-blue-600">
                  Total QRIS
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {formatIDR(qrisTotal)}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {revenue ? ((qrisTotal / revenue) * 100).toFixed(0) : 0}% dari omset
                </p>
              </div>
              <div className="rounded-xl bg-stone-100 p-5">
                <p className="text-xs font-medium uppercase text-stone-500">
                  Total Penerimaan
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-800">
                  {formatIDR(revenue)}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {monthSales.length} transaksi
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-stone-700">
                Distribusi per Kasir
              </h4>
              <Table>
                <thead>
                  <tr>
                    <Th>Kasir</Th>
                    <Th className="text-right">Transaksi</Th>
                    <Th className="text-right">Cash</Th>
                    <Th className="text-right">QRIS</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const byCashier = new Map<
                      string,
                      { name: string; count: number; cash: number; qris: number; total: number }
                    >();
                    for (const s of monthSales) {
                      const cur = byCashier.get(s.cashierId) ?? {
                        name: s.cashierName,
                        count: 0,
                        cash: 0,
                        qris: 0,
                        total: 0,
                      };
                      cur.count += 1;
                      cur.total += s.total;
                      if (s.paymentMethod === "cash") cur.cash += s.total;
                      else cur.qris += s.total;
                      byCashier.set(s.cashierId, cur);
                    }
                    return Array.from(byCashier.values()).map((c, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        <Td className="font-medium">{c.name}</Td>
                        <Td className="text-right">{formatNumber(c.count)}</Td>
                        <Td className="text-right">{formatIDR(c.cash)}</Td>
                        <Td className="text-right">{formatIDR(c.qris)}</Td>
                        <Td className="text-right font-semibold">
                          {formatIDR(c.total)}
                        </Td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "piutang" && (
        <Card>
          <CardHeader
            title="Rekap Piutang"
            subtitle="Semua piutang pelanggan beserta statusnya"
          />
          <CardBody className="p-0">
            {receivableList.length === 0 ? (
              <EmptyState title="Tidak ada piutang" icon="receipt" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Pelanggan</Th>
                    <Th>Hari Ini</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Dibayar</Th>
                    <Th className="text-right">Sisa</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {receivableList.map((r) => {
                    const overdue = r.remaining > 0 && r.dueDate < todayISO();
                    return (
                      <tr key={r.id} className="hover:bg-stone-50">
                        <Td className="font-medium">{r.customerName}</Td>
                        <Td>
                          {formatNumber(
                            monthSales.filter((s) => s.customerName === r.customerName)
                              .length,
                          )}
                        </Td>
                        <Td className="text-right">{formatIDR(r.total)}</Td>
                        <Td className="text-right">{formatIDR(r.paid)}</Td>
                        <Td className="text-right font-semibold">
                          {formatIDR(r.remaining)}
                        </Td>
                        <Td>
                          {r.remaining === 0 ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">
                              Lunas
                            </span>
                          ) : overdue ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700">
                              Menunggak
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
                              Aktif
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "penjualan" && (
        <Card>
          <CardHeader title="Ringkasan Setoran" subtitle="Status selisih setoran per periode" />
          <CardBody className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Kasir</Th>
                  <Th className="text-right">Cash</Th>
                  <Th className="text-right">QRIS</Th>
                  <Th className="text-right">Selisih</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.deposits
                  .filter((d) => isSameMonth(d.date, period))
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <Td>{localDateKey(d.date)}</Td>
                      <Td>{d.cashierName}</Td>
                      <Td className="text-right">{formatIDR(d.totalCash)}</Td>
                      <Td className="text-right">{formatIDR(d.totalQris)}</Td>
                      <Td
                        className={`text-right font-medium ${
                          d.difference < 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {formatIDR(d.difference)}
                      </Td>
                      <Td>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs ${
                            d.status === "sesuai"
                              ? "bg-emerald-100 text-emerald-700"
                              : d.status === "selisih_kecil"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {statusLabel(d.status)}
                        </span>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  positive,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-600">{label}</span>
      <span
        className={`${
          strong ? "text-base font-bold" : "font-medium"
        } ${negative ? "text-red-600" : positive ? "text-emerald-600" : "text-stone-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

function MiniList({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-stone-700">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-stone-400">Tidak ada</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
            >
              <span className="truncate pr-3 text-stone-600">{it.label}</span>
              <span className="shrink-0 font-medium text-red-600">
                -{formatIDR(it.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}