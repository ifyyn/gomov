"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  currentPeriod,
  formatIDR,
  formatDate,
  isSameMonth,
  localDateKey,
  todayISO,
  uid,
} from "@/lib/format";
import type { Expense } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Textarea,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const CATEGORIES = [
  "Sewa",
  "Listrik",
  "Internet",
  "Transport",
  "Bahan Habis",
  "Perbaikan",
  "Lainnya",
];

const emptyForm = {
  id: "",
  category: "Sewa",
  description: "",
  amount: "",
  date: "",
};

export default function OperasionalPage() {
  const { data, saveExpense, deleteExpense } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const period = currentPeriod();

  const monthExpenses = useMemo(
    () => data.expenses.filter((e) => isSameMonth(e.date, period)),
    [data.expenses, period],
  );
  const monthTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const totalAll = data.expenses.reduce((a, e) => a + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries());
  }, [monthExpenses]);

  const openNew = () => {
    setEditing(false);
    setForm({ ...emptyForm, date: todayISO() });
    setOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(true);
    setForm({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      date: localDateKey(e.date),
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.description || Number(form.amount) <= 0) return;
    saveExpense(
      {
        id: editing ? form.id : uid("exp"),
        date: new Date(form.date).toISOString(),
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
      },
      !editing,
    );
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya Operasional"
        description="Pengeluaran rutin yang otomatis mengurangi laba bersih"
        action={
          <Button icon="plus" onClick={openNew}>
            Catat Biaya
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Total Bulan Ini
            </p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {formatIDR(monthTotal)}
            </p>
            <p className="text-xs text-stone-400">{monthExpenses.length} transaksi</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Total Keseluruhan
            </p>
            <p className="mt-1 text-lg font-bold">{formatIDR(totalAll)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Kategori Terbesar
            </p>
            <p className="mt-1 text-lg font-bold">
              {byCategory.length
                ? byCategory.sort((a, b) => b[1] - a[1])[0][0]
                : "-"}
            </p>
            <p className="text-xs text-stone-400">
              {byCategory.length
                ? formatIDR(byCategory.sort((a, b) => b[1] - a[1])[0][1])
                : ""}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daftar Biaya" />
          <CardBody className="p-0">
            {data.expenses.length === 0 ? (
              <EmptyState title="Belum ada biaya tercatat" icon="plug" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>Kategori</Th>
                    <Th>Deskripsi</Th>
                    <Th className="text-right">Jumlah</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {[...data.expenses]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((e) => (
                      <tr key={e.id} className="hover:bg-stone-50">
                        <Td>{formatDate(e.date)}</Td>
                        <Td>
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                            {e.category}
                          </span>
                        </Td>
                        <Td>{e.description}</Td>
                        <Td className="text-right font-semibold">
                          -{formatIDR(e.amount)}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(e)}
                              className="rounded-md p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                              title="Edit"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              onClick={() => deleteExpense(e.id)}
                              className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                              title="Hapus"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rincian per Kategori" subtitle="Periode berjalan" />
          <CardBody className="space-y-3">
            {byCategory.map(([cat, total]) => (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-stone-600">{cat}</span>
                  <span className="font-medium">{formatIDR(total)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${monthTotal ? (total / monthTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {byCategory.length === 0 && (
              <p className="py-4 text-center text-sm text-stone-400">
                Belum ada biaya bulan ini
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Biaya" : "Catat Biaya Operasional"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              icon="check"
              onClick={save}
              disabled={!form.description || Number(form.amount) <= 0}
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tanggal">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Kategori">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Deskripsi" className="col-span-2">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Contoh: Sewa lapak bulanan"
            />
          </Field>
          <Field label="Jumlah (Rp)" className="col-span-2">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}