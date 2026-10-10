"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import {
  formatIDR,
  formatDateTime,
  isSameDay,
  todayISO,
  uid,
} from "@/lib/format";
import { productHpp, saleHpp, saleTotal } from "@/lib/calc";
import type { PaymentMethod, Sale, SaleItem } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

interface CartEntry {
  productId: string;
  qty: number;
}

const PAYMENTS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "qris", label: "QRIS", icon: "wallet" },
];

export default function PenjualanPage() {
  const { data, addSale, deleteSale } = useStore();
  const { user } = useAuth();
  const today = todayISO();

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Sale | null>(null);
  const [category, setCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(data.products.map((p) => p.category))),
    [data],
  );

  const shownProducts = data.products.filter(
    (p) =>
      p.active &&
      (category === "Semua" || p.category === category) &&
      (!search ||
        p.name.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const cartDetail = useMemo(() => {
    return cart
      .map((c) => {
        const product = data.products.find((p) => p.id === c.productId);
        if (!product) return null;
        return {
          product,
          qty: c.qty,
          hpp: productHpp(product, data.ingredients),
          subtotal: product.price * c.qty,
        };
      })
      .filter(Boolean) as {
      product: (typeof data.products)[number];
      qty: number;
      hpp: number;
      subtotal: number;
    }[];
  }, [cart, data]);

  const total = cartDetail.reduce((s, c) => s + c.subtotal, 0);
  const totalHpp = cartDetail.reduce((s, c) => s + c.hpp * c.qty, 0);

  const addToCart = (productId: string) => {
    setError("");
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing)
        return prev.map((c) =>
          c.productId === productId ? { ...c, qty: c.qty + 1 } : c,
        );
      return [...prev, { productId, qty: 1 }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.productId === productId ? { ...c, qty: c.qty + delta } : c,
        )
        .filter((c) => c.qty > 0),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const canFulfill = () => {
    const need = new Map<string, number>();
    for (const c of cartDetail) {
      for (const r of c.product.recipe) {
        need.set(
          r.ingredientId,
          (need.get(r.ingredientId) ?? 0) + r.qtyBase * c.qty,
        );
      }
    }
    for (const [ingId, qty] of need.entries()) {
      const ing = data.ingredients.find((i) => i.id === ingId);
      if (ing && ing.stockBase < qty) {
        return `Stok ${ing.name} tidak mencukupi (butuh ${qty} ${ing.baseUnit}, tersisa ${ing.stockBase}).`;
      }
    }
    return "";
  };

  const charge = () => {
    setError("");
    if (cart.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }
    const stockError = canFulfill();
    if (stockError) {
      setError(stockError);
      return;
    }
    const items: SaleItem[] = cartDetail.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      qty: c.qty,
      price: c.product.price,
      hpp: c.hpp,
    }));
    const sale: Sale = {
      id: uid("sale"),
      date: new Date().toISOString(),
      cashierId: user?.employeeId ?? user?.id ?? "system",
      cashierName: user?.name ?? "Kasir",
      items,
      total: saleTotal(items),
      totalHpp: saleHpp(items),
      paymentMethod: payment,
      customerName: customer || undefined,
      note: note || undefined,
    };
    addSale(sale);
    setCart([]);
    setCustomer("");
    setNote("");
    setSuccess(sale);
  };

  const todaySales = data.sales.filter((s) => isSameDay(s.date, today));
  const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
  const todayCups = todaySales.reduce(
    (s, x) => s + x.items.reduce((a, i) => a + i.qty, 0),
    0,
  );
  const canDelete = user?.role === "owner" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penjualan (POS)"
        description="Catat transaksi per cup — stok berkurang otomatis berdasarkan resep"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Transaksi Hari Ini
          </p>
          <p className="mt-0.5 text-lg font-bold text-stone-800">
            {todaySales.length} transaksi
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Omset Hari Ini
          </p>
          <p className="mt-0.5 truncate text-lg font-bold text-stone-800">
            {formatIDR(todayTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Cup Terjual
          </p>
          <p className="mt-0.5 text-lg font-bold text-stone-800">
            {todayCups} cup
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex flex-col gap-3">
            <div className="relative">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["Semua", ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    category === c
                      ? "bg-amber-600 text-white"
                      : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {shownProducts.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  title="Tidak ada produk aktif"
                  description="Atur menu di halaman Menu & Resep"
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shownProducts.map((p) => {
                const hpp = productHpp(p, data.ingredients);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p.id)}
                    className="group rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl">
                      ☕
                    </span>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-stone-800">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-stone-400">{p.category}</p>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-amber-700">
                        {formatIDR(p.price)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        HPP {formatIDR(hpp)}
                      </span>
                    </div>
                    <span className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-amber-50 py-1.5 text-xs font-semibold text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white">
                      <Icon name="plus" size={13} /> Tambah
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="flex flex-col lg:sticky lg:top-20">
            <CardHeader
              title="Keranjang"
              action={
                cartDetail.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    Kosongkan
                  </button>
                )
              }
            />
            <CardBody className="flex-1 space-y-3">
              {cartDetail.length === 0 && (
                <EmptyState
                  title="Keranjang kosong"
                  description="Klik produk untuk menambahkan"
                  icon="cart"
                />
              )}

              {cartDetail.map((c) => (
                <div
                  key={c.product.id}
                  className="rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {c.product.name}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatIDR(c.product.price)} / cup
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(c.product.id)}
                      className="rounded-md p-1 text-stone-300 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Hapus item"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1">
                      <button
                        onClick={() => changeQty(c.product.id, -1)}
                        className="rounded-full p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                        aria-label="Kurangi"
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-stone-800">
                        {c.qty}
                      </span>
                      <button
                        onClick={() => changeQty(c.product.id, 1)}
                        className="rounded-full p-1 text-stone-500 transition hover:bg-amber-100 hover:text-amber-700"
                        aria-label="Tambah"
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-stone-800">
                      {formatIDR(c.subtotal)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-700">
                    Total Tagihan
                  </span>
                  <span className="text-xl font-extrabold text-amber-800">
                    {formatIDR(total)}
                  </span>
                </div>
                <p className="mt-0.5 text-right text-xs text-amber-600/80">
                  Estimasi HPP {formatIDR(totalHpp)} · Laba {formatIDR(total - totalHpp)}
                </p>
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-stone-700">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENTS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPayment(m.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        payment === m.value
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <Icon name={m.icon} size={16} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Nama Customer (opsional)">
                <Input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Misal: Bu Ani"
                />
              </Field>
              <Field label="Catatan (opsional)">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan tambahan"
                />
              </Field>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <Icon name="alert" size={16} />
                  {error}
                </div>
              )}

              <Button className="w-full py-3 text-base" onClick={charge}>
                <Icon name="check" size={18} />
                Bayar — {formatIDR(total)}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Transaksi Hari Ini (${todaySales.length})`}
          subtitle={`Total ${formatIDR(todayTotal)}`}
        />
        <CardBody className="p-0">
          {todaySales.length === 0 ? (
            <EmptyState title="Belum ada transaksi hari ini" icon="cart" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th className="hidden sm:table-cell">Kasir</Th>
                  <Th className="hidden md:table-cell">Item</Th>
                  <Th>Metode</Th>
                  <Th className="hidden md:table-cell">Customer</Th>
                  <Th className="text-right">Total</Th>
                  {canDelete && <Th />}
                </tr>
              </thead>
              <tbody>
                {todaySales.map((s) => (
                  <tr key={s.id} className="transition hover:bg-stone-50">
                    <Td>{formatDateTime(s.date)}</Td>
                    <Td className="hidden sm:table-cell">{s.cashierName}</Td>
                    <Td className="hidden md:table-cell">
                      {s.items.map((i) => `${i.productName} ×${i.qty}`).join(", ")}
                    </Td>
                    <Td>
                      <Badge tone={s.paymentMethod === "cash" ? "green" : "blue"}>
                        {s.paymentMethod.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {s.customerName ?? "-"}
                    </Td>
                    <Td className="text-right font-semibold">
                      {formatIDR(s.total)}
                    </Td>
                    {canDelete && (
                      <Td>
                        <button
                          onClick={() => {
                            if (confirm("Batalkan transaksi ini? Stok akan dikembalikan.")) {
                              deleteSale(s.id);
                            }
                          }}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Batalkan"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!success}
        onClose={() => setSuccess(null)}
        title="Transaksi Berhasil"
        footer={
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSuccess(null)}
          >
            Transaksi Baru
          </Button>
        }
      >
        {success && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Icon name="check" size={28} className="text-emerald-700" />
            </div>

            <div className="space-y-2 rounded-xl border border-stone-100 bg-stone-50/60 p-4">
              {success.items.map((i) => (
                <div
                  key={i.productId}
                  className="flex justify-between text-sm text-stone-700"
                >
                  <span>
                    {i.productName} × {i.qty}
                  </span>
                  <span className="font-medium">
                    {formatIDR(i.price * i.qty)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                <span className="font-semibold text-stone-800">Total</span>
                <span className="text-lg font-bold text-amber-700">
                  {formatIDR(success.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge tone={success.paymentMethod === "cash" ? "green" : "blue"}>
                {success.paymentMethod.toUpperCase()}
              </Badge>
              <span className="text-xs text-stone-400">{formatDateTime(success.date)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}