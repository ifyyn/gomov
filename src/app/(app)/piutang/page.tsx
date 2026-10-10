"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, formatDate, todayISO, uid } from "@/lib/format";
import type { Receivable } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Textarea,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const emptyForm = {
  customerName: "",
  phone: "",
  date: "",
  product: "",
  total: "",
  downPayment: "",
  dueDate: "",
  note: "",
};

export default function PiutangPage() {
  const { data, saveReceivable, addReceivablePayment, deleteReceivable } =
    useStore();
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const withRemaining = useMemo(
    () =>
      data.receivables.map((r) => {
        const paid = r.payments.reduce((a, p) => a + p.amount, 0);
        return { ...r, paid, remaining: r.total - paid };
      }),
    [data.receivables],
  );

  const detail = withRemaining.find((r) => r.id === detailId) ?? null;

  const addNew = () => {
    const total = Number(form.total);
    const down = Number(form.downPayment || 0);
    const initial = down > 0 ? down : 0;
    const item: Receivable = {
      id: uid("rcv"),
      customerName: form.customerName,
      phone: form.phone,
      date: new Date(form.date || todayISO()).toISOString(),
      product: form.product,
      total,
      payments:
        initial > 0
          ? [
              {
                id: uid("pay"),
                date: new Date(form.date || todayISO()).toISOString(),
                amount: initial,
                note: "Pembayaran awal",
              },
            ]
          : [],
      dueDate: form.dueDate,
      note: form.note || undefined,
    };
    saveReceivable(item, true);
    setForm(emptyForm);
    setCreateOpen(false);
  };

  const submitPayment = () => {
    if (!detailId || !detail) return;
    const amount = Number(payAmount);
    if (amount <= 0) return;
    addReceivablePayment(detailId, amount, payNote || `Cicilan ${detail.payments.length + 1}`);
    setPayAmount("");
    setPayNote("");
  };

  const openCreate = () => {
    setForm({ ...emptyForm, date: todayISO() });
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Piutang Pelanggan"
        description="Transaksi kredit, pembayaran bertahap, dan riwayat pelunasan"
        action={
          <Button icon="plus" onClick={openCreate}>
            Catat Piutang
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {withRemaining.length === 0 ? (
            <EmptyState
              title="Belum ada piutang"
              description="Klik Catat Piutang untuk menambahkan"
              icon="receipt"
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Pelanggan</Th>
                  <Th>Kontak</Th>
                  <Th>Tanggal</Th>
                  <Th>Produk</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Dibayar</Th>
                  <Th className="text-right">Sisa</Th>
                  <Th>Jatuh Tempo</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {withRemaining.map((r) => {
                  const overdue = r.remaining > 0 && r.dueDate < todayISO();
                  return (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <Td className="font-medium">{r.customerName}</Td>
                      <Td>{r.phone || "-"}</Td>
                      <Td>{formatDate(r.date)}</Td>
                      <Td className="max-w-[180px] truncate">{r.product}</Td>
                      <Td className="text-right">{formatIDR(r.total)}</Td>
                      <Td className="text-right">{formatIDR(r.paid)}</Td>
                      <Td
                        className={`text-right font-semibold ${
                          r.remaining > 0 ? "text-stone-800" : "text-emerald-600"
                        }`}
                      >
                        {formatIDR(r.remaining)}
                      </Td>
                      <Td>{formatDate(r.dueDate)}</Td>
                      <Td>
                        {r.remaining === 0 ? (
                          <Badge tone="green">Lunas</Badge>
                        ) : overdue ? (
                          <Badge tone="red">Menunggak</Badge>
                        ) : (
                          <Badge tone="amber">Aktif</Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setDetailId(r.id);
                              setPayAmount("");
                              setPayNote("");
                            }}
                            className="rounded-md p-2 text-amber-600 hover:bg-amber-50"
                            title="Detail & bayar"
                          >
                            <Icon name="banknote" size={16} />
                          </button>
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => {
                                if (confirm("Hapus piutang ini?")) {
                                  deleteReceivable(r.id);
                                }
                              }}
                              className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                              title="Hapus"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Catat Piutang Baru"
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              icon="check"
              onClick={addNew}
              disabled={
                !form.customerName || !form.product || Number(form.total) <= 0
              }
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama Pelanggan">
            <Input
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              placeholder="Nama pelanggan / instansi"
            />
          </Field>
          <Field label="Nomor HP">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </Field>
          <Field label="Tanggal Transaksi">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Tanggal Jatuh Tempo">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
          <Field label="Produk / Keterangan" className="sm:col-span-2">
            <Input
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              placeholder="Contoh: 20x Es Kopi Gula Aren"
            />
          </Field>
          <Field label="Total Piutang (Rp)">
            <Input
              type="number"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
              placeholder="0"
            />
          </Field>
          <Field label="Pembayaran Awal (Rp)">
            <Input
              type="number"
              value={form.downPayment}
              onChange={(e) =>
                setForm({ ...form, downPayment: e.target.value })
              }
              placeholder="0"
            />
          </Field>
          <Field label="Catatan" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Opsional"
            />
          </Field>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title={detail ? `Piutang — ${detail.customerName}` : ""}
        footer={
          <Button variant="outline" onClick={() => setDetailId(null)}>
            Tutup
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Total</p>
                <p className="font-bold">{formatIDR(detail.total)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">Dibayar</p>
                <p className="font-bold text-emerald-700">
                  {formatIDR(detail.paid)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-600">Sisa</p>
                <p className="font-bold text-amber-700">
                  {formatIDR(detail.remaining)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-stone-700">
                Riwayat Pelunasan
              </h4>
              <Table>
                <thead>
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>Catatan</Th>
                    <Th className="text-right">Jumlah</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payments.length === 0 ? (
                    <tr>
                      <Td colSpan={3} className="text-center text-stone-400">
                        Belum ada pembayaran
                      </Td>
                    </tr>
                  ) : (
                    detail.payments.map((p) => (
                      <tr key={p.id}>
                        <Td>{formatDate(p.date)}</Td>
                        <Td>{p.note}</Td>
                        <Td className="text-right font-medium">
                          {formatIDR(p.amount)}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {detail.remaining > 0 && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-stone-700">
                  Bayar Cicilan
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Jumlah (Rp)">
                    <Input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Catatan">
                    <Input
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Cicilan ..."
                    />
                  </Field>
                </div>
                <Button
                  className="mt-3"
                  icon="check"
                  onClick={submitPayment}
                  disabled={Number(payAmount) <= 0}
                >
                  Catat Pembayaran
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}