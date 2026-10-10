import type { DepositStatus, Ingredient, Product, SaleItem } from "./types";

export function pricePerBase(ing: Ingredient): number {
  if (!ing.conversionFactor) return 0;
  return ing.purchasePrice / ing.conversionFactor;
}

export function ingredientById(
  ingredients: Ingredient[],
  id: string,
): Ingredient | undefined {
  return ingredients.find((i) => i.id === id);
}

export function productHpp(product: Product, ingredients: Ingredient[]): number {
  return product.recipe.reduce((sum, item) => {
    const ing = ingredientById(ingredients, item.ingredientId);
    if (!ing) return sum;
    return sum + pricePerBase(ing) * item.qtyBase;
  }, 0);
}

export function ingredientCost(
  ingredients: Ingredient[],
  id: string,
  qtyBase: number,
): number {
  const ing = ingredientById(ingredients, id);
  if (!ing) return 0;
  return pricePerBase(ing) * qtyBase;
}

export function depositStatus(difference: number): DepositStatus {
  const abs = Math.abs(difference);
  if (abs === 0) return "sesuai";
  if (abs <= 10000) return "selisih_kecil";
  return "kurang";
}

export function statusLabel(status: DepositStatus): string {
  switch (status) {
    case "sesuai":
      return "Sesuai";
    case "selisih_kecil":
      return "Selisih Kecil";
    default:
      return "Ada Kekurangan";
  }
}

export function receivablePaid(paid: { amount: number }[]): number {
  return paid.reduce((s, p) => s + p.amount, 0);
}

export function unitLabel(ing: Ingredient): string {
  return ing.baseUnit;
}

export function formatBaseQty(qty: number, ing: Ingredient): string {
  if (ing.baseUnit === "gram" && qty >= 1000) {
    return `${(qty / 1000).toLocaleString("id-ID")} kg`;
  }
  if (ing.baseUnit === "ml" && qty >= 1000) {
    return `${(qty / 1000).toLocaleString("id-ID")} liter`;
  }
  return `${qty.toLocaleString("id-ID")} ${ing.baseUnit}`;
}

export function saleTotal(items: SaleItem[]): number {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

export function saleHpp(items: SaleItem[]): number {
  return items.reduce((s, i) => s + i.hpp * i.qty, 0);
}
