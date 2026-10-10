"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, formatDate, isSameDay, localDateKey, todayISO, uid } from "@/lib/format";
import { depositStatus, statusLabel } from "@/lib/calc";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export default function SetoranPage() {
  const { data, saveDeposit, deleteDeposit } = useStore();
  const { user } = useAuth();
  const role = user?.role ?? "kasir";

  const [date, setDate] = useState(todayISO());
  const [cashierId, setCashierId] = useState(user?.employeeId ?? user?.id ?? "");
  const [actualCash, setActualCash] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const cashiers = data.employees.filter((e) => e.role === "kasir");

  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const myEmployeeId = user?.employeeId ?? user?.id;

  const salesForSelection = useMemo(
    () =>
      data.sales.filter(
        (s) => isSameDay(s.date, date) && s.cashierId === cashierId,
      ),
    [data.sales, date, cashierId],
  );

  const totalCash = salesForSelection
    .filter((s) => s.paymentMethod === "cash")
    .reduce((a, s) => a + s.total, 0);
  const totalQris = salesForSelection
    .filter((s) => s.paymentMethod === "qris")
    .reduce((a, s) => a + s.total, 0);
  const setoranSistem = totalCash + totalQris;

  const existing = data.deposits.find(
    (d) => isSameDay(d.date, date) && d.cashierId === cashierId,
  );

  const effectiveActual =
    actualCash === "" ? (existing ? existing.actualCash : 0) : Number(actualCash);
  const difference = effectiveActual - totalCash;
  const status = depositStatus(difference);

  const save = () => {
    if (!cashierId) return;
    const cashierName =
      data.employees.find((e) => e.id === cashierId)?.name ??
      user?.name ??
      "Kasir";
    saveDeposit({
      id: existing?.id ?? uid("dep"),
      date: new Date(date + "T21:00:00").toISOString(),
      cashierId,
      cashierName,
      totalCash,
      totalQris,
      actualCash: effectiveActual,
      difference,
      status,
      note,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setoran Harian"
        description="Hitung selisih antara uang aktual kasir dengan total sistem"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Form Setoran" subtitle="Rekap per kasir per hari" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label="Kasir">
                {isOwnerOrAdmin ? (
                  <select
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                    value={cashierId}
                    onChange={(e) => setCashierId(e.target.value)}
                  >
                    <option value="">Pilih kasir</option>
                    {cashiers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input value={user?.name ?? ""} disabled />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-600">
                  Cash Sistem
                </p>
                <p className="mt-1 font-bold text-emerald-700">
                  {formatIDR(totalCash)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-600">QRIS</p>
                <p className="mt-1 font-bold text-blue-700">
                  {formatIDR(totalQris)}
                </p>
              </div>
              <div className="rounded-xl bg-stone-100 p-3">
                <p className="text-xs font-medium text-stone-500">
                  Setoran Sistem
                </p>
                <p className="mt-1 font-bold text-stone-700">
                  {formatIDR(setoranSistem)}
                </p>
              </div>
            </div>

            <Field
              label="Uang Cash Aktual (yang diterima kasir)"
              hint="Uang fisik hasil penjualan cash"
            >
              <Input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0"
              />
            </Field>

            <Field label="Catatan / Alasan Selisih (opsional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: kembalian lebih Rp5.000"
              />
            </Field>

            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-stone-500">
                  Selisih
                </p>
                <p className="text-lg font-bold text-stone-800">
                  {formatIDR(difference)}
                </p>
              </div>
              <Badge
                tone={
                  status === "sesuai"
                    ? "green"
                    : status === "selisih_kecil"
                      ? "amber"
                      : "red"
                }
              >
                {statusLabel(status)}
              </Badge>
            </div>

            <Button className="w-full" icon="check" onClick={save}>
              Simpan Setoran
            </Button>
            {saved && (
              <p className="flex items-center gap-2 text-sm text-emerald-600">
                <Icon name="check" size={16} /> Setoran berhasil disimpan.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Transaksi Terkait"
            subtitle={`${salesForSelection.length} transaksi cash ${formatIDR(totalCash)} + qris ${formatIDR(totalQris)}`}
          />
          <CardBody className="max-h-[560px] space-y-2 overflow-y-auto p-0">
            {salesForSelection.length === 0 ? (
              <EmptyState title="Tidak ada transaksi" icon="receipt" />
            ) : (
              salesForSelection.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-stone-100 px-5 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-stone-700">
                      {new Date(s.date).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-stone-400">
                      {s.items.map((i) => i.productName).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={s.paymentMethod === "cash" ? "green" : "blue"}>
                      {s.paymentMethod.toUpperCase()}
                    </Badge>
                    <p className="mt-0.5 font-semibold">
                      {formatIDR(s.total)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Riwayat Setoran"
          subtitle={
            isOwnerOrAdmin
              ? "Seluruh kasir"
              : user
                ? `Milik ${user.name}`
                : ""
          }
        />
        <CardBody className="p-0">
          {data.deposits.length === 0 ? (
            <EmptyState title="Belum ada setoran" icon="wallet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Kasir</Th>
                  <Th className="text-right">Cash</Th>
                  <Th className="text-right">QRIS</Th>
                  <Th className="text-right">Aktual</Th>
                  <Th className="text-right">Selisih</Th>
                  <Th>Status</Th>
                  {isOwnerOrAdmin && <Th />}
                </tr>
              </thead>
              <tbody>
                {data.deposits
                  .filter(
                    (d) =>
                      isOwnerOrAdmin ||
                      d.cashierId === myEmployeeId ||
                      d.cashierId === user?.id,
                  )
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 30)
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <Td>{formatDate(d.date)}</Td>
                      <Td>{d.cashierName}</Td>
                      <Td className="text-right">{formatIDR(d.totalCash)}</Td>
                      <Td className="text-right">{formatIDR(d.totalQris)}</Td>
                      <Td className="text-right">{formatIDR(d.actualCash)}</Td>
                      <Td
                        className={`text-right font-semibold ${
                          d.difference < 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {formatIDR(d.difference)}
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            d.status === "sesuai"
                              ? "green"
                              : d.status === "selisih_kecil"
                                ? "amber"
                                : "red"
                          }
                        >
                          {statusLabel(d.status)}
                        </Badge>
                      </Td>
                      {isOwnerOrAdmin && (
                        <Td>
                          <button
                            onClick={() => {
                              const openIt = () => {
                                setDate(localDateKey(d.date));
                                setCashierId(d.cashierId);
                                setActualCash(d.actualCash.toString());
                                setNote(d.note);
                              };
                              if (window.confirm("Ubah setoran ini? Data form akan terisi.")) {
                                openIt();
                              }
                            }}
                            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-amber-600"
                            aria-label="Ubah"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => deleteDeposit(d.id)}
                            className="ml-1 rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Hapus"
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
    </div>
  );
}