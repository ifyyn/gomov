"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatIDR, formatNumber, uid } from "@/lib/format";
import { productHpp } from "@/lib/calc";
import type { Product } from "@/lib/types";
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

interface RecipeRow {
  ingredientId: string;
  qtyBase: number;
}

const emptyForm = {
  id: "",
  name: "",
  category: "Coffee",
  price: "",
  active: true,
};

export default function MenuPage() {
  const { data, saveProduct, deleteProduct } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [recipe, setRecipe] = useState<RecipeRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const hppByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data.products) {
      map.set(p.id, productHpp(p, data.ingredients));
    }
    return map;
  }, [data.products, data.ingredients]);

  const openNew = () => {
    setEditing(false);
    setForm(emptyForm);
    setRecipe([]);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(true);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      active: p.active,
    });
    setRecipe(p.recipe.map((r) => ({ ...r })));
    setOpen(true);
  };

  const liveHpp = recipe.reduce((sum, r) => {
    const ing = data.ingredients.find((i) => i.id === r.ingredientId);
    if (!ing) return sum;
    return sum + (ing.purchasePrice / ing.conversionFactor) * r.qtyBase;
  }, 0);

  const save = () => {
    if (!form.name) return;
    const product: Product = {
      id: editing ? form.id : uid("prd"),
      name: form.name,
      category: form.category,
      price: Number(form.price),
      active: form.active,
      recipe: recipe
        .filter((r) => r.ingredientId)
        .map((r) => ({ ingredientId: r.ingredientId, qtyBase: r.qtyBase })),
    };
    saveProduct(product, !editing);
    setOpen(false);
  };

  const setRow = (index: number, patch: Partial<RecipeRow>) => {
    setRecipe((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu & Resep"
        description="Kelola produk, komposisi bahan per cup, dan HPP otomatis"
        action={
          <Button icon="plus" onClick={openNew}>
            Tambah Menu
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {data.products.length === 0 ? (
            <EmptyState title="Belum ada menu" icon="coffee" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Menu</Th>
                  <Th className="hidden md:table-cell">Kategori</Th>
                  <Th className="text-right">Harga Jual</Th>
                  <Th className="text-right">HPP / Cup</Th>
                  <Th className="hidden md:table-cell text-right">Margin</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => {
                  const hpp = hppByProduct.get(p.id) ?? 0;
                  const margin = p.price - hpp;
                  const marginPct = p.price ? (margin / p.price) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <Td className="font-medium">{p.name}</Td>
                      <Td className="hidden md:table-cell">
                        <Badge tone="gray">{p.category}</Badge>
                      </Td>
                      <Td className="text-right font-semibold">
                        {formatIDR(p.price)}
                      </Td>
                      <Td className="text-right">{formatIDR(hpp)}</Td>
                      <Td
                        className={`hidden md:table-cell text-right font-medium ${
                          margin >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatIDR(margin)} ({marginPct.toFixed(0)}%)
                      </Td>
                      <Td>
                        <Badge tone={p.active ? "green" : "gray"}>
                          {p.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewProduct(p)}
                            className="rounded-md p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                            title="Lihat Resep"
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-md p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                            title="Edit"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus menu ${p.name}?`)) {
                                deleteProduct(p.id);
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
        title={editing ? "Edit Menu" : "Tambah Menu"}
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Menu" className="col-span-2">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Es Kopi Gula Aren"
              />
            </Field>
            <Field label="Kategori">
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
            </Field>
            <Field label="Harga Jual (Rp)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-stone-700">
                Komposisi Resep per Cup
              </h4>
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                onClick={() =>
                  setRecipe((prev) => [
                    ...prev,
                    { ingredientId: "", qtyBase: 0 },
                  ])
                }
              >
                Tambah Bahan
              </Button>
            </div>
            <div className="space-y-2">
              {recipe.map((row, index) => {
                const ing = data.ingredients.find(
                  (i) => i.id === row.ingredientId,
                );
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_120px_120px_36px] items-end gap-2"
                  >
                    <Field label={index === 0 ? "Bahan" : ""}>
                      <Select
                        value={row.ingredientId}
                        onChange={(e) =>
                          setRow(index, { ingredientId: e.target.value })
                        }
                      >
                        <option value="">Pilih bahan...</option>
                        {data.ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={index === 0 ? "Jumlah" : ""}>
                      <Input
                        type="number"
                        value={row.qtyBase || ""}
                        onChange={(e) =>
                          setRow(index, { qtyBase: Number(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </Field>
                    <div className="pb-2 text-xs text-stone-400">
                      {ing?.baseUnit ?? "unit"}
                    </div>
                    <button
                      onClick={() =>
                        setRecipe((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="mb-1.5 rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Hapus bahan"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                );
              })}
              {recipe.length === 0 && (
                <p className="rounded-lg border border-dashed border-stone-300 py-4 text-center text-sm text-stone-400">
                  Tambahkan bahan pembentuk menu ini
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
            <span className="text-sm font-medium text-amber-700">
              HPP per cup (dari harga bahan terbaru)
            </span>
            <span className="text-lg font-bold text-amber-800">
              {formatIDR(liveHpp)}
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-amber-600"
            />
            Menu aktif (tampil di POS)
          </label>
        </div>
      </Modal>

      <Modal
        open={viewProduct !== null}
        onClose={() => setViewProduct(null)}
        title={viewProduct?.name ?? ""}
        footer={
          <Button variant="outline" onClick={() => setViewProduct(null)}>
            Tutup
          </Button>
        }
      >
        {viewProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge tone="gray">{viewProduct.category}</Badge>
              <Badge tone={viewProduct.active ? "green" : "gray"}>
                {viewProduct.active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Harga Jual</p>
                <p className="mt-1 font-bold text-stone-800">
                  {formatIDR(viewProduct.price)}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">HPP / Cup</p>
                <p className="mt-1 font-bold text-stone-800">
                  {formatIDR(hppByProduct.get(viewProduct.id) ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Margin</p>
                <p className="mt-1 font-bold text-stone-800">
                  {formatIDR(viewProduct.price - (hppByProduct.get(viewProduct.id) ?? 0))}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-stone-700">
                Komposisi Resep
              </h4>
              {viewProduct.recipe.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-300 py-4 text-center text-sm text-stone-400">
                  Menu ini belum memiliki resep
                </p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Bahan</Th>
                      <Th className="text-right">Jumlah</Th>
                      <Th className="text-right">Biaya</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewProduct.recipe.map((r, index) => {
                      const ing = data.ingredients.find(
                        (i) => i.id === r.ingredientId,
                      );
                      const cost = ing
                        ? (ing.purchasePrice / ing.conversionFactor) * r.qtyBase
                        : 0;
                      return (
                        <tr key={index} className="hover:bg-stone-50">
                          <Td className="font-medium">
                            {ing?.name ?? "Bahan dihapus"}
                          </Td>
                          <Td className="text-right">
                            {ing
                              ? `${formatNumber(r.qtyBase)}${ing.baseUnit}`
                              : "-"}
                          </Td>
                          <Td className="text-right">
                            {ing ? formatIDR(cost) : "-"}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}