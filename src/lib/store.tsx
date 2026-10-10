"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  AuditLog,
  Deposit,
  Employee,
  Expense,
  Ingredient,
  Payroll,
  Product,
  Receivable,
  Sale,
  Waste,
} from "./types";
import { buildSeed } from "./mockData";
import { uid } from "./format";
import { useAuth } from "./auth";

const DATA_KEY = "gomov_data_v1";

const EMPTY_DATA: AppData = {
  users: [],
  ingredients: [],
  priceHistory: [],
  products: [],
  sales: [],
  deposits: [],
  receivables: [],
  employees: [],
  payrolls: [],
  wastes: [],
  expenses: [],
  auditLogs: [],
};

interface StoreContextValue {
  data: AppData;
  ready: boolean;
  reset: () => void;
  log: (action: string, module: string, detail: string) => void;
  saveIngredient: (item: Ingredient, isNew: boolean) => void;
  deleteIngredient: (id: string) => void;
  adjustStock: (
    ingredientId: string,
    deltaBase: number,
    reason: string,
  ) => void;
  saveProduct: (item: Product, isNew: boolean) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  saveDeposit: (deposit: Deposit) => void;
  deleteDeposit: (id: string) => void;
  saveReceivable: (item: Receivable, isNew: boolean) => void;
  addReceivablePayment: (id: string, amount: number, note: string) => void;
  deleteReceivable: (id: string) => void;
  saveEmployee: (item: Employee, isNew: boolean) => void;
  deleteEmployee: (id: string) => void;
  savePayroll: (item: Payroll) => void;
  deletePayroll: (id: string) => void;
  addWaste: (item: Waste) => void;
  deleteWaste: (id: string) => void;
  saveExpense: (item: Expense, isNew: boolean) => void;
  deleteExpense: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadData(): AppData {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    /* ignore */
  }
  const seeded = buildSeed();
  window.localStorage.setItem(DATA_KEY, JSON.stringify(seeded));
  return seeded;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data, ready]);

  const mutate = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  const makeLog = useCallback(
    (action: string, module: string, detail: string): AuditLog => {
      return {
        id: uid("log"),
        timestamp: new Date().toISOString(),
        userId: user?.id ?? "system",
        userName: user?.name ?? "Sistem",
        role: user?.role ?? "owner",
        action,
        module,
        detail,
      };
    },
    [user],
  );

  const log = useCallback(
    (action: string, module: string, detail: string) => {
      mutate((prev) => ({
        ...prev,
        auditLogs: [makeLog(action, module, detail), ...prev.auditLogs],
      }));
    },
    [makeLog, mutate],
  );

  const reset = useCallback(() => {
    const seeded = buildSeed();
    setData(seeded);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(seeded));
    }
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const applyStock = (
      prev: AppData,
      changes: { ingredientId: string; deltaBase: number }[],
    ): AppData => {
      const ingredients = prev.ingredients.map((ing) => {
        const change = changes
          .filter((c) => c.ingredientId === ing.id)
          .reduce((s, c) => s + c.deltaBase, 0);
        if (change === 0) return ing;
        return {
          ...ing,
          stockBase: Math.max(0, ing.stockBase + change),
          updatedAt: new Date().toISOString(),
        };
      });
      return { ...prev, ingredients };
    };

    return {
      data,
      ready,
      reset,
      log,

      saveIngredient: (item, isNew) =>
        mutate((prev) => {
          const ingredients = isNew
            ? [...prev.ingredients, item]
            : prev.ingredients.map((i) =>
                i.id === item.id ? { ...item } : i,
              );
          let priceHistory = prev.priceHistory;
          if (!isNew) {
            const old = prev.ingredients.find((i) => i.id === item.id);
            if (old && old.purchasePrice !== item.purchasePrice) {
              priceHistory = [
                {
                  id: uid("ph"),
                  ingredientId: item.id,
                  oldPrice: old.purchasePrice,
                  newPrice: item.purchasePrice,
                  changedAt: new Date().toISOString(),
                  userId: user?.id ?? "system",
                },
                ...prev.priceHistory,
              ];
            }
          }
          return {
            ...prev,
            ingredients,
            priceHistory,
            auditLogs: [
              makeLog(
                isNew ? "CREATE" : "UPDATE",
                "Bahan Baku",
                `${isNew ? "Menambah" : "Memperbarui"} bahan ${item.name}`,
              ),
              ...prev.auditLogs,
            ],
          };
        }),

      deleteIngredient: (id) =>
        mutate((prev) => {
          const ing = prev.ingredients.find((i) => i.id === id);
          return {
            ...prev,
            ingredients: prev.ingredients.filter((i) => i.id !== id),
            auditLogs: [
              makeLog("DELETE", "Bahan Baku", `Menghapus bahan ${ing?.name ?? id}`),
              ...prev.auditLogs,
            ],
          };
        }),

      adjustStock: (ingredientId, deltaBase, reason) =>
        mutate((prev) => {
          const ing = prev.ingredients.find((i) => i.id === ingredientId);
          const next = applyStock(prev, [{ ingredientId, deltaBase }]);
          return {
            ...next,
            auditLogs: [
              makeLog(
                "UPDATE",
                "Stok",
                `Penyesuaian stok ${ing?.name ?? ingredientId} (${reason})`,
              ),
              ...next.auditLogs,
            ],
          };
        }),

      saveProduct: (item, isNew) =>
        mutate((prev) => ({
          ...prev,
          products: isNew
            ? [...prev.products, item]
            : prev.products.map((p) => (p.id === item.id ? { ...item } : p)),
          auditLogs: [
            makeLog(
              isNew ? "CREATE" : "UPDATE",
              "Menu",
              `${isNew ? "Menambah" : "Memperbarui"} menu ${item.name}`,
            ),
            ...prev.auditLogs,
          ],
        })),

      deleteProduct: (id) =>
        mutate((prev) => {
          const p = prev.products.find((x) => x.id === id);
          return {
            ...prev,
            products: prev.products.filter((x) => x.id !== id),
            auditLogs: [
              makeLog("DELETE", "Menu", `Menghapus menu ${p?.name ?? id}`),
              ...prev.auditLogs,
            ],
          };
        }),

      addSale: (sale) =>
        mutate((prev) => {
          const changes = sale.items.flatMap((it) => {
            const product = prev.products.find((p) => p.id === it.productId);
            if (!product) return [];
            return product.recipe.map((r) => ({
              ingredientId: r.ingredientId,
              deltaBase: -r.qtyBase * it.qty,
            }));
          });
          const next = applyStock(prev, changes);
          return {
            ...next,
            sales: [sale, ...next.sales],
            auditLogs: [
              makeLog(
                "CREATE",
                "Penjualan",
                `Transaksi ${sale.paymentMethod.toUpperCase()} total Rp${sale.total.toLocaleString("id-ID")}`,
              ),
              ...next.auditLogs,
            ],
          };
        }),

      deleteSale: (id) =>
        mutate((prev) => {
          const sale = prev.sales.find((s) => s.id === id);
          if (!sale) return prev;
          const changes = sale.items.flatMap((it) => {
            const product = prev.products.find((p) => p.id === it.productId);
            if (!product) return [];
            return product.recipe.map((r) => ({
              ingredientId: r.ingredientId,
              deltaBase: r.qtyBase * it.qty,
            }));
          });
          const next = applyStock(prev, changes);
          return {
            ...next,
            sales: next.sales.filter((s) => s.id !== id),
            auditLogs: [
              makeLog("DELETE", "Penjualan", `Membatalkan transaksi ${id}`),
              ...next.auditLogs,
            ],
          };
        }),

      saveDeposit: (deposit) =>
        mutate((prev) => {
          const exists = prev.deposits.some((d) => d.id === deposit.id);
          return {
            ...prev,
            deposits: exists
              ? prev.deposits.map((d) => (d.id === deposit.id ? deposit : d))
              : [deposit, ...prev.deposits],
            auditLogs: [
              makeLog(
                "CREATE",
                "Setoran",
                `Setoran ${deposit.cashierName} (${deposit.status})`,
              ),
              ...prev.auditLogs,
            ],
          };
        }),

      deleteDeposit: (id) =>
        mutate((prev) => ({
          ...prev,
          deposits: prev.deposits.filter((d) => d.id !== id),
          auditLogs: [
            makeLog("DELETE", "Setoran", `Menghapus setoran ${id}`),
            ...prev.auditLogs,
          ],
        })),

      saveReceivable: (item, isNew) =>
        mutate((prev) => ({
          ...prev,
          receivables: isNew
            ? [item, ...prev.receivables]
            : prev.receivables.map((r) => (r.id === item.id ? { ...item } : r)),
          auditLogs: [
            makeLog(
              isNew ? "CREATE" : "UPDATE",
              "Piutang",
              `${isNew ? "Mencatat" : "Memperbarui"} piutang ${item.customerName}`,
            ),
            ...prev.auditLogs,
          ],
        })),

      addReceivablePayment: (id, amount, note) =>
        mutate((prev) => ({
          ...prev,
          receivables: prev.receivables.map((r) =>
            r.id === id
              ? {
                  ...r,
                  payments: [
                    ...r.payments,
                    {
                      id: uid("pay"),
                      date: new Date().toISOString(),
                      amount,
                      note,
                    },
                  ],
                }
              : r,
          ),
          auditLogs: [
            makeLog("UPDATE", "Piutang", `Pelunasan piutang Rp${amount.toLocaleString("id-ID")}`),
            ...prev.auditLogs,
          ],
        })),

      deleteReceivable: (id) =>
        mutate((prev) => {
          const r = prev.receivables.find((x) => x.id === id);
          return {
            ...prev,
            receivables: prev.receivables.filter((x) => x.id !== id),
            auditLogs: [
              makeLog("DELETE", "Piutang", `Menghapus piutang ${r?.customerName ?? id}`),
              ...prev.auditLogs,
            ],
          };
        }),

      saveEmployee: (item, isNew) =>
        mutate((prev) => ({
          ...prev,
          employees: isNew
            ? [...prev.employees, item]
            : prev.employees.map((e) => (e.id === item.id ? { ...item } : e)),
          auditLogs: [
            makeLog(
              isNew ? "CREATE" : "UPDATE",
              "Karyawan",
              `${isNew ? "Menambah" : "Memperbarui"} karyawan ${item.name}`,
            ),
            ...prev.auditLogs,
          ],
        })),

      deleteEmployee: (id) =>
        mutate((prev) => {
          const e = prev.employees.find((x) => x.id === id);
          return {
            ...prev,
            employees: prev.employees.filter((x) => x.id !== id),
            auditLogs: [
              makeLog("DELETE", "Karyawan", `Menghapus karyawan ${e?.name ?? id}`),
              ...prev.auditLogs,
            ],
          };
        }),

      savePayroll: (item) =>
        mutate((prev) => {
          const exists = prev.payrolls.some((p) => p.id === item.id);
          return {
            ...prev,
            payrolls: exists
              ? prev.payrolls.map((p) => (p.id === item.id ? item : p))
              : [item, ...prev.payrolls],
            auditLogs: [
              makeLog("CREATE", "Penggajian", `Slip gaji ${item.employeeName} periode ${item.period}`),
              ...prev.auditLogs,
            ],
          };
        }),

      deletePayroll: (id) =>
        mutate((prev) => ({
          ...prev,
          payrolls: prev.payrolls.filter((p) => p.id !== id),
          auditLogs: [
            makeLog("DELETE", "Penggajian", `Menghapus slip gaji ${id}`),
            ...prev.auditLogs,
          ],
        })),

      addWaste: (item) =>
        mutate((prev) => {
          let next = prev;
          if (item.itemType === "ingredient") {
            next = applyStock(prev, [
              { ingredientId: item.itemId, deltaBase: -item.qty },
            ]);
          }
          return {
            ...next,
            wastes: [item, ...next.wastes],
            auditLogs: [
              makeLog("CREATE", "Waste", `Mencatat waste ${item.itemName}`),
              ...next.auditLogs,
            ],
          };
        }),

      deleteWaste: (id) =>
        mutate((prev) => ({
          ...prev,
          wastes: prev.wastes.filter((w) => w.id !== id),
          auditLogs: [
            makeLog("DELETE", "Waste", `Menghapus catatan waste ${id}`),
            ...prev.auditLogs,
          ],
        })),

      saveExpense: (item, isNew) =>
        mutate((prev) => ({
          ...prev,
          expenses: isNew
            ? [item, ...prev.expenses]
            : prev.expenses.map((e) => (e.id === item.id ? { ...item } : e)),
          auditLogs: [
            makeLog(
              isNew ? "CREATE" : "UPDATE",
              "Operasional",
              `${isNew ? "Mencatat" : "Memperbarui"} biaya ${item.category}`,
            ),
            ...prev.auditLogs,
          ],
        })),

      deleteExpense: (id) =>
        mutate((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
          auditLogs: [
            makeLog("DELETE", "Operasional", `Menghapus biaya ${id}`),
            ...prev.auditLogs,
          ],
        })),
    };
  }, [data, ready, reset, log, mutate, makeLog, user]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}
