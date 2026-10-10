"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, formatDateTime, uid } from "@/lib/format";
import { pricePerBase, productHpp } from "@/lib/calc";
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
  Textarea,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

export default function WastePage() {
  const { data, addWaste, deleteWaste } = useStore();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<"ingredient" | "product">(
    "ingredient",
  );
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const ingredientOptions = data.ingredients.filter(
    (i) => i.stockBase > 0,
  );
  const productOptions = data.products;

  const selectedIngredient = data.ingredients.find((i) => i.id === itemId);
  const selectedProduct = data.products.find((p) => p.id === itemId);

  const cost =
    itemType === "ingredient" && selectedIngredient
      ? pricePerBase(selectedIngredient) * Number(qty || 0)
      : itemType === "product" && selectedProduct
        ? productHpp(selectedProduct, data.ingredients) * Number(qty || 0)
        : 0;

  const label =
    itemType === "ingredient"
      ? `${selectedIngredient?.baseUnit ?? ""}`
      : "cup";

  const submit = () => {
    if (!itemId || !Number(qty) || !reason) return;
    const name =
      itemType === "ingredient"
        ? (selectedIngredient?.name ?? "")
        : (selectedProduct?.name ?? "");
    addWaste({
      id: uid("wst"),
      date: new Date().toISOString(),
      itemType,
      itemId,
      itemName: name,
      qty: Number(qty),
      unitLabel: label,
      cost,
      reason,
      reportedBy: user?.name ?? "Sistem",
    });
    setOpen(false);
    setItemId("");
    setQty("");
    setReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste / Barang Terbuang"
        description="Catat bahan atau produk yang rusak, tumpah, atau expired — nilainya masuk laporan kerugian"
        action={
          <Button icon="plus" onClick={() => setOpen(true)}>
            Catat Waste
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {data.wastes.length === 0 ? (
            <EmptyState title="Belum ada catatan waste" icon="trash" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Item</Th>
                  <Th>Jenis</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th className="text-right">Nilai Kerugian</Th>
                  <Th>Alasan</Th>
                  <Th>Oleh</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.wastes.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50">
                    <Td>{formatDateTime(w.date)}</Td>
                    <Td className="font-medium">{w.itemName}</Td>
                    <Td>
                      <Badge
                        tone={w.itemType === "ingredient" ? "amber" : "gray"}
                      >
                        {w.itemType === "ingredient" ? "Bahan" : "Menu jadi"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {w.qty.toLocaleString("id-ID")} {w.unitLabel}
                    </Td>
                    <Td className="text-right font-semibold text-red-600">
                      -{formatIDR(w.cost)}
                    </Td>
                    <Td>{w.reason}</Td>
                    <Td>{w.reportedBy}</Td>
                    <Td>
                      <button
                        onClick={() => deleteWaste(w.id)}
                        className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        title="Hapus"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Catat Waste"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              icon="check"
              onClick={submit}
              disabled={!itemId || !Number(qty) || !reason}
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis Item">
              <Select
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value as typeof itemType);
                  setItemId("");
                }}
              >
                <option value="ingredient">Bahan Baku</option>
                <option value="product">Menu (Produk Jadi)</option>
              </Select>
            </Field>
            <Field label="Item">
              <Select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                <option value="">Pilih...</option>
                {itemType === "ingredient"
                  ? ingredientOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} (sisa {i.stockBase} {i.baseUnit})
                      </option>
                    ))
                  : productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
              </Select>
            </Field>
          </div>
          <Field label={`Jumlah (${label})`}>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Alasan">
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rusak, tumpah, expired, dll."
            />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-red-700">
              Nilai kerugian
            </span>
            <span className="text-lg font-bold text-red-700">
              -{formatIDR(cost)}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}