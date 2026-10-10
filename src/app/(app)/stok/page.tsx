"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatIDR, formatNumber } from "@/lib/format";
import { formatBaseQty, pricePerBase } from "@/lib/calc";
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
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export default function StokPage() {
  const { data, adjustStock } = useStore();
  const [open, setOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState("");
  const [delta, setDelta] = useState("");
  const [kind, setKind] = useState<"in" | "out">("in");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const lowStock = data.ingredients.filter(
    (ing) => ing.stockBase <= ing.minStockBase,
  );

  const sorted = useMemo(
    () =>
      [...data.ingredients].sort(
        (a, b) => a.stockBase / a.minStockBase - b.stockBase / b.minStockBase,
      ),
    [data.ingredients],
  );

  const selectedIng = data.ingredients.find((i) => i.id === ingredientId);

  const submit = () => {
    if (!ingredientId || !reason) return;
    const value = Number(delta);
    if (!value) return;
    adjustStock(
      ingredientId,
      kind === "in" ? Math.abs(value) : -Math.abs(value),
      reason,
    );
    setOpen(false);
    setReason("");
    setDelta("");
    setIngredientId("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const stockValue = (ing: (typeof data.ingredients)[number]) =>
    pricePerBase(ing) * ing.stockBase;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok & Inventaris"
        description="Pemantauan stok bahan dengan notifikasi stok menipis"
        action={
          <Button icon="plus" onClick={() => setOpen(true)}>
            Penyesuaian / Restock
          </Button>
        }
      />
      {saved && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <Icon name="check" size={16} /> Stok berhasil disesuaikan.
        </p>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-700">
            <Icon name="alert" size={18} /> Stok Menipis — perlu restock
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((ing) => (
              <span
                key={ing.id}
                className="rounded-full bg-white px-3 py-1 text-sm text-red-600"
              >
                {ing.name}: sisa {formatNumber(ing.stockBase)} {ing.baseUnit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((ing) => {
          const pct = Math.min(
            100,
            Math.round((ing.stockBase / Math.max(ing.minStockBase, 1)) * 100),
          );
          const low = pct <= 100;
          return (
            <Card key={ing.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-800">{ing.name}</p>
                    <p className="text-xs text-stone-400">
                      Nilai stok {formatIDR(stockValue(ing))}
                    </p>
                  </div>
                  <Badge tone={low ? "red" : "green"}>
                    {low ? "Menipis" : "Aman"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-stone-800">
                    {formatBaseQty(ing.stockBase, ing)}
                  </p>
                  <p className="text-xs text-stone-400">
                    min {formatBaseQty(ing.minStockBase, ing)}
                  </p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${
                      low ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          );
        })}
        {data.ingredients.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState title="Belum ada bahan baku" icon="box" />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Penyesuaian / Restock Stok"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              icon="check"
              onClick={submit}
              disabled={!ingredientId || !Number(delta) || !reason}
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Bahan Baku">
            <Select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
            >
              <option value="">Pilih bahan...</option>
              {data.ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (stok {formatBaseQty(ing.stockBase, ing)})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis">
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-stone-300 p-1">
                <button
                  type="button"
                  onClick={() => setKind("in")}
                  className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                    kind === "in"
                      ? "bg-emerald-600 text-white"
                      : "text-stone-600"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setKind("out")}
                  className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                    kind === "out" ? "bg-red-600 text-white" : "text-stone-600"
                  }`}
                >
                  Keluar
                </button>
              </div>
            </Field>
            <Field label={`Jumlah ${selectedIng?.baseUnit ?? ""}`}>
              <Input
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>

          <Field
            label="Alasan"
            hint={
              kind === "in"
                ? "Contoh: pembelian dari supplier"
                : "Contoh: koreksi stok / sisa opname"
            }
          >
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Alasan penyesuaian"
            />
          </Field>

          {selectedIng && (
            <div className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Harga satuan{" "}
              <b>{formatIDR(pricePerBase(selectedIng))}</b>/{selectedIng.baseUnit}{" "}
              → nilai perubahan:{" "}
              <b>
                {formatIDR(pricePerBase(selectedIng) * Math.abs(Number(delta) || 0))}
              </b>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}