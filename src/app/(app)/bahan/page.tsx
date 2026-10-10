"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatIDR, formatDateTime, formatNumber, uid } from "@/lib/format";
import { pricePerBase } from "@/lib/calc";
import type { Ingredient } from "@/lib/types";
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
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

const UNITS = ["kg", "gram", "liter", "ml", "pcs"] as const;

const emptyForm = {
  id: "",
  name: "",
  purchaseUnit: "kg",
  purchasePrice: "",
  baseUnit: "gram",
  conversionFactor: "1000",
  stockBase: "",
  minStockBase: "",
};

export default function BahanPage() {
  const { data, saveIngredient, deleteIngredient } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(false);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (ing: Ingredient) => {
    setEditing(true);
    setForm({
      id: ing.id,
      name: ing.name,
      purchaseUnit: ing.purchaseUnit,
      purchasePrice: String(ing.purchasePrice),
      baseUnit: ing.baseUnit,
      conversionFactor: String(ing.conversionFactor),
      stockBase: String(ing.stockBase),
      minStockBase: String(ing.minStockBase),
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name) return;
    const item: Ingredient = {
      id: editing ? form.id : uid("ing"),
      name: form.name,
      purchaseUnit: form.purchaseUnit,
      purchasePrice: Number(form.purchasePrice),
      baseUnit: form.baseUnit as Ingredient["baseUnit"],
      conversionFactor: Number(form.conversionFactor) || 1,
      stockBase: Number(form.stockBase),
      minStockBase: Number(form.minStockBase),
      updatedAt: new Date().toISOString(),
    };
    saveIngredient(item, !editing);
    setOpen(false);
  };

  const historyIng = data.ingredients.find((i) => i.id === historyId);
  const history = data.priceHistory.filter((h) => h.ingredientId === historyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Bahan Baku"
        description="Satuan pembelian dengan konversi otomatis ke harga satuan terkecil"
        action={
          <Button icon="plus" onClick={openNew}>
            Tambah Bahan
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {data.ingredients.length === 0 ? (
            <EmptyState title="Belum ada bahan baku" icon="box" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Bahan</Th>
                  <Th>Satuan Beli</Th>
                  <Th className="text-right">Harga Beli</Th>
                  <Th className="text-right">Harga / {""}Base</Th>
                  <Th className="text-right">Stok</Th>
                  <Th className="text-right">Min. Stok</Th>
                  <Th>Riwayat Harga</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.ingredients.map((ing) => {
                  const ppb = pricePerBase(ing);
                  const low = ing.stockBase <= ing.minStockBase;
                  return (
                    <tr key={ing.id} className="hover:bg-stone-50">
                      <Td className="font-medium">{ing.name}</Td>
                      <Td>
                        <Badge tone="gray">{ing.purchaseUnit}</Badge>
                      </Td>
                      <Td className="text-right">
                        {formatIDR(ing.purchasePrice)}/{ing.purchaseUnit}
                      </Td>
                      <Td className="text-right font-semibold text-amber-700">
                        {formatIDR(ppb)}/{ing.baseUnit}
                      </Td>
                      <Td
                        className={`text-right font-medium ${
                          low ? "text-red-600" : "text-stone-700"
                        }`}
                      >
                        {formatNumber(ing.stockBase)} {ing.baseUnit}
                        {low && (
                          <Icon
                            name="alert"
                            size={14}
                            className="ml-1 inline text-red-500"
                          />
                        )}
                      </Td>
                      <Td className="text-right">
                        {formatNumber(ing.minStockBase)} {ing.baseUnit}
                      </Td>
                      <Td>
                        <button
                          onClick={() => setHistoryId(ing.id)}
                          className="text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          {formatNumber(
                            data.priceHistory.filter(
                              (h) => h.ingredientId === ing.id,
                            ).length,
                          )}{" "}
                          perubahan
                        </button>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(ing)}
                            className="rounded-md p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                            title="Edit"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus bahan ${ing.name}?`)) {
                                deleteIngredient(ing.id);
                              }
                            }}
                            className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
                          >
                            <Icon name="trash" size={16} />
                          </button>
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button icon="check" onClick={save} disabled={!form.name}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Bahan" className="col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Gula Aren Cair"
            />
          </Field>
          <Field label="Satuan Pembelian">
            <Select
              value={form.purchaseUnit}
              onChange={(e) => setForm({ ...form, purchaseUnit: e.target.value })}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Harga Pembelian / Satuan (Rp)">
            <Input
              type="number"
              value={form.purchasePrice}
              onChange={(e) =>
                setForm({ ...form, purchasePrice: e.target.value })
              }
              placeholder="0"
            />
          </Field>
          <Field label="Satuan Terkecil (Base)">
            <Select
              value={form.baseUnit}
              onChange={(e) =>
                setForm({ ...form, baseUnit: e.target.value })
              }
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Faktor Konversi"
            hint={`1 ${form.purchaseUnit} = berapa ${form.baseUnit}?`}
          >
            <Input
              type="number"
              value={form.conversionFactor}
              onChange={(e) =>
                setForm({ ...form, conversionFactor: e.target.value })
              }
              placeholder="1000"
            />
          </Field>
          <Field label="Stok Saat Ini (base)">
            <Input
              type="number"
              value={form.stockBase}
              onChange={(e) => setForm({ ...form, stockBase: e.target.value })}
              placeholder="0"
            />
          </Field>
          <Field label="Batas Min. Stok (base)">
            <Input
              type="number"
              value={form.minStockBase}
              onChange={(e) =>
                setForm({ ...form, minStockBase: e.target.value })
              }
              placeholder="0"
            />
          </Field>
          {Number(form.purchasePrice) > 0 && Number(form.conversionFactor) > 0 && (
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
              <span className="text-sm font-medium text-amber-700">
                Harga satuan terkecil otomatis
              </span>
              <span className="text-lg font-bold text-amber-800">
                {formatIDR(
                  Number(form.purchasePrice) / Number(form.conversionFactor),
                )}{" "}
                / {form.baseUnit}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!historyIng}
        onClose={() => setHistoryId(null)}
        title={`Riwayat Harga — ${historyIng?.name ?? ""}`}
        footer={
          <Button variant="outline" onClick={() => setHistoryId(null)}>
            Tutup
          </Button>
        }
      >
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-400">
            Belum ada perubahan harga tercatat.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Waktu</Th>
                <Th className="text-right">Harga Lama</Th>
                <Th className="text-right">Harga Baru</Th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <Td>{formatDateTime(h.changedAt)}</Td>
                  <Td className="text-right">{formatIDR(h.oldPrice)}</Td>
                  <Td className="text-right font-semibold">
                    {formatIDR(h.newPrice)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal>
    </div>
  );
}