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
  SaleItem,
  User,
  Waste,
} from "./types";
import { depositStatus, pricePerBase, productHpp } from "./calc";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDaysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildSeed(): AppData {
  const ingredients: Ingredient[] = [
    {
      id: "ing_kopi",
      name: "Biji Kopi Espresso",
      purchaseUnit: "kg",
      purchasePrice: 180000,
      baseUnit: "gram",
      conversionFactor: 1000,
      stockBase: 7800,
      minStockBase: 1500,
      updatedAt: isoDaysAgo(14),
    },
    {
      id: "ing_susu",
      name: "Susu UHT Full Cream",
      purchaseUnit: "liter",
      purchasePrice: 21000,
      baseUnit: "ml",
      conversionFactor: 1000,
      stockBase: 18500,
      minStockBase: 4000,
      updatedAt: isoDaysAgo(5),
    },
    {
      id: "ing_gula",
      name: "Gula Aren Cair",
      purchaseUnit: "liter",
      purchasePrice: 32000,
      baseUnit: "ml",
      conversionFactor: 1000,
      stockBase: 6200,
      minStockBase: 2000,
      updatedAt: isoDaysAgo(9),
    },
    {
      id: "ing_sirup",
      name: "Sirup Caramel",
      purchaseUnit: "liter",
      purchasePrice: 45000,
      baseUnit: "ml",
      conversionFactor: 1000,
      stockBase: 4200,
      minStockBase: 1000,
      updatedAt: isoDaysAgo(20),
    },
    {
      id: "ing_matcha",
      name: "Matcha Powder",
      purchaseUnit: "kg",
      purchasePrice: 260000,
      baseUnit: "gram",
      conversionFactor: 1000,
      stockBase: 640,
      minStockBase: 700,
      updatedAt: isoDaysAgo(11),
    },
    {
      id: "ing_es",
      name: "Es Batu Kristal",
      purchaseUnit: "kg",
      purchasePrice: 12000,
      baseUnit: "gram",
      conversionFactor: 1000,
      stockBase: 9200,
      minStockBase: 2500,
      updatedAt: isoDaysAgo(2),
    },
    {
      id: "ing_air",
      name: "Air Mineral",
      purchaseUnit: "liter",
      purchasePrice: 5000,
      baseUnit: "ml",
      conversionFactor: 1000,
      stockBase: 38000,
      minStockBase: 8000,
      updatedAt: isoDaysAgo(3),
    },
    {
      id: "ing_cup",
      name: "Cup Plastik 22oz",
      purchaseUnit: "pcs",
      purchasePrice: 850,
      baseUnit: "pcs",
      conversionFactor: 1,
      stockBase: 420,
      minStockBase: 100,
      updatedAt: isoDaysAgo(7),
    },
    {
      id: "ing_sedotan",
      name: "Sedotan",
      purchaseUnit: "pcs",
      purchasePrice: 150,
      baseUnit: "pcs",
      conversionFactor: 1,
      stockBase: 560,
      minStockBase: 200,
      updatedAt: isoDaysAgo(7),
    },
    {
      id: "ing_tutup",
      name: "Tutup Cup",
      purchaseUnit: "pcs",
      purchasePrice: 250,
      baseUnit: "pcs",
      conversionFactor: 1,
      stockBase: 90,
      minStockBase: 100,
      updatedAt: isoDaysAgo(7),
    },
  ];

  const products: Product[] = [
    {
      id: "prd_aren",
      name: "Es Kopi Gula Aren",
      category: "Signature",
      price: 18000,
      active: true,
      recipe: [
        { ingredientId: "ing_kopi", qtyBase: 18 },
        { ingredientId: "ing_susu", qtyBase: 120 },
        { ingredientId: "ing_gula", qtyBase: 25 },
        { ingredientId: "ing_es", qtyBase: 110 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_sedotan", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_susu",
      name: "Es Kopi Susu",
      category: "Kopi Susu",
      price: 15000,
      active: true,
      recipe: [
        { ingredientId: "ing_kopi", qtyBase: 18 },
        { ingredientId: "ing_susu", qtyBase: 130 },
        { ingredientId: "ing_gula", qtyBase: 15 },
        { ingredientId: "ing_es", qtyBase: 110 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_sedotan", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_cappuccino",
      name: "Cappuccino",
      category: "Coffee",
      price: 20000,
      active: true,
      recipe: [
        { ingredientId: "ing_kopi", qtyBase: 18 },
        { ingredientId: "ing_susu", qtyBase: 150 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_sedotan", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_caramel",
      name: "Caramel Macchiato",
      category: "Coffee",
      price: 22000,
      active: true,
      recipe: [
        { ingredientId: "ing_kopi", qtyBase: 18 },
        { ingredientId: "ing_susu", qtyBase: 150 },
        { ingredientId: "ing_sirup", qtyBase: 25 },
        { ingredientId: "ing_es", qtyBase: 110 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_sedotan", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_matcha",
      name: "Matcha Latte",
      category: "Non Coffee",
      price: 22000,
      active: true,
      recipe: [
        { ingredientId: "ing_matcha", qtyBase: 16 },
        { ingredientId: "ing_susu", qtyBase: 150 },
        { ingredientId: "ing_gula", qtyBase: 15 },
        { ingredientId: "ing_es", qtyBase: 110 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_sedotan", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_tubruk",
      name: "Kopi Tubruk",
      category: "Coffee",
      price: 10000,
      active: true,
      recipe: [
        { ingredientId: "ing_kopi", qtyBase: 15 },
        { ingredientId: "ing_gula", qtyBase: 12 },
        { ingredientId: "ing_air", qtyBase: 160 },
        { ingredientId: "ing_cup", qtyBase: 1 },
      ],
    },
    {
      id: "prd_air",
      name: "Air Mineral Dingin",
      category: "Lainnya",
      price: 5000,
      active: true,
      recipe: [
        { ingredientId: "ing_air", qtyBase: 350 },
        { ingredientId: "ing_es", qtyBase: 60 },
        { ingredientId: "ing_cup", qtyBase: 1 },
        { ingredientId: "ing_tutup", qtyBase: 1 },
      ],
    },
  ];

  const employees: Employee[] = [
    {
      id: "emp_owner",
      name: "Budi Santoso",
      role: "owner",
      username: "owner",
      baseSalary: 0,
      mealAllowancePerDay: 0,
      salesTarget: 0,
      targetBonus: 0,
      deduction: 0,
      active: true,
    },
    {
      id: "emp_admin",
      name: "Rina Wati",
      role: "admin",
      username: "admin",
      baseSalary: 3000000,
      mealAllowancePerDay: 20000,
      salesTarget: 0,
      targetBonus: 0,
      deduction: 0,
      active: true,
    },
    {
      id: "emp_andi",
      name: "Andi Pratama",
      role: "kasir",
      username: "kasir",
      baseSalary: 2200000,
      mealAllowancePerDay: 15000,
      salesTarget: 60000000,
      targetBonus: 500000,
      deduction: 0,
      active: true,
    },
    {
      id: "emp_siti",
      name: "Siti Aminah",
      role: "kasir",
      username: "siti",
      baseSalary: 2200000,
      mealAllowancePerDay: 15000,
      salesTarget: 55000000,
      targetBonus: 500000,
      deduction: 100000,
      active: true,
    },
    {
      id: "emp_dedi",
      name: "Dedi Kurniawan",
      role: "kasir",
      username: "dedi",
      baseSalary: 2200000,
      mealAllowancePerDay: 15000,
      salesTarget: 55000000,
      targetBonus: 500000,
      deduction: 0,
      active: true,
    },
  ];

  const users: User[] = [
    {
      id: "usr_owner",
      username: "owner",
      password: "123456",
      name: "Budi Santoso",
      role: "owner",
      employeeId: "emp_owner",
    },
    {
      id: "usr_admin",
      username: "admin",
      password: "123456",
      name: "Rina Wati",
      role: "admin",
      employeeId: "emp_admin",
    },
    {
      id: "usr_andi",
      username: "kasir",
      password: "123456",
      name: "Andi Pratama",
      role: "kasir",
      employeeId: "emp_andi",
    },
    {
      id: "usr_siti",
      username: "siti",
      password: "123456",
      name: "Siti Aminah",
      role: "kasir",
      employeeId: "emp_siti",
    },
    {
      id: "usr_dedi",
      username: "dedi",
      password: "123456",
      name: "Dedi Kurniawan",
      role: "kasir",
      employeeId: "emp_dedi",
    },
  ];

  const cashiers = [
    { id: "emp_andi", name: "Andi Pratama" },
    { id: "emp_siti", name: "Siti Aminah" },
    { id: "emp_dedi", name: "Dedi Kurniawan" },
  ];

  const rand = mulberry32(20260410);
  const sales: Sale[] = [];

  for (let day = 12; day >= 0; day--) {
    const count = 6 + Math.floor(rand() * 12);
    for (let t = 0; t < count; t++) {
      const cashier = cashiers[Math.floor(rand() * cashiers.length)];
      const itemCount = 1 + Math.floor(rand() * 3);
      const items: SaleItem[] = [];
      for (let k = 0; k < itemCount; k++) {
        const p = products[Math.floor(rand() * products.length)];
        const qty = 1 + Math.floor(rand() * 3);
        const existing = items.find((i) => i.productId === p.id);
        const hpp = productHpp(p, ingredients);
        if (existing) {
          existing.qty += qty;
        } else {
          items.push({
            productId: p.id,
            productName: p.name,
            qty,
            price: p.price,
            hpp,
          });
        }
      }
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const totalHpp = items.reduce((s, i) => s + i.hpp * i.qty, 0);
      const hour = 7 + Math.floor(rand() * 13);
      const minute = Math.floor(rand() * 60);
      sales.push({
        id: `sale_${day}_${t}`,
        date: isoDaysAgo(day, hour, minute),
        cashierId: cashier.id,
        cashierName: cashier.name,
        items,
        total,
        totalHpp,
        paymentMethod: rand() > 0.42 ? "cash" : "qris",
        customerName: rand() > 0.85 ? "Pelanggan Umum" : undefined,
      });
    }
  }

  const deposits: Deposit[] = [];
  for (let day = 12; day >= 1; day--) {
    const dayStr = isoDaysAgo(day).slice(0, 10);
    for (const c of cashiers) {
      const daySales = sales.filter(
        (s) => s.date.slice(0, 10) === dayStr && s.cashierId === c.id,
      );
      if (daySales.length === 0) continue;
      const totalCash = daySales
        .filter((s) => s.paymentMethod === "cash")
        .reduce((s, x) => s + x.total, 0);
      const totalQris = daySales
        .filter((s) => s.paymentMethod === "qris")
        .reduce((s, x) => s + x.total, 0);
      const roll = rand();
      let diff = 0;
      if (roll > 0.82) diff = -Math.floor(rand() * 8) * 1000 - 2000;
      else if (roll > 0.7) diff = Math.floor(rand() * 6) * 1000;
      const actualCash = totalCash + diff;
      deposits.push({
        id: `dep_${day}_${c.id}`,
        date: isoDaysAgo(day, 21, 0),
        cashierId: c.id,
        cashierName: c.name,
        totalCash,
        totalQris,
        actualCash,
        difference: actualCash - totalCash,
        status: depositStatus(actualCash - totalCash),
        note:
          diff === 0
            ? ""
            : diff < 0
              ? "Kembalian lebih / uang belum disetor penuh"
              : "Ada uang lebih dari pembulatan",
      });
    }
  }

  const receivables: Receivable[] = [
    {
      id: "rcv_1",
      customerName: "Warung Bu Tini",
      phone: "081234567890",
      date: isoDaysAgo(20),
      product: "20x Es Kopi Gula Aren",
      total: 360000,
      payments: [
        { id: "pay_1", date: isoDaysAgo(10), amount: 200000, note: "Cicilan 1" },
      ],
      dueDate: isoDaysAgo(-10).slice(0, 10),
      note: "Langganan harian",
    },
    {
      id: "rcv_2",
      customerName: "Pak Hendra (Kantor)",
      phone: "081298765432",
      date: isoDaysAgo(8),
      product: "15x Cappuccino",
      total: 300000,
      payments: [],
      dueDate: isoDaysAgo(-7).slice(0, 10),
    },
    {
      id: "rcv_3",
      customerName: "Karang Taruna RT 05",
      phone: "085712345678",
      date: isoDaysAgo(30),
      product: "25x Es Kopi Susu",
      total: 375000,
      payments: [
        { id: "pay_2", date: isoDaysAgo(20), amount: 175000, note: "DP" },
        { id: "pay_3", date: isoDaysAgo(5), amount: 200000, note: "Lunas" },
      ],
      dueDate: isoDaysAgo(-2).slice(0, 10),
      note: "Sudah lunas",
    },
  ];

  const prevPeriod = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();

  const payrolls: Payroll[] = employees
    .filter((e) => e.role === "kasir")
    .map((e, idx) => {
      const daysWorked = 24 - idx;
      const mealAllowance = e.mealAllowancePerDay * daysWorked;
      const salesAchieved = e.salesTarget + (idx === 0 ? 2500000 : -1500000);
      const bonus = salesAchieved >= e.salesTarget ? e.targetBonus : 0;
      const total =
        e.baseSalary + mealAllowance + bonus - e.deduction;
      return {
        id: `pay_${prevPeriod}_${e.id}`,
        employeeId: e.id,
        employeeName: e.name,
        period: prevPeriod,
        daysWorked,
        baseSalary: e.baseSalary,
        mealAllowance,
        salesAchieved,
        targetBonus: e.targetBonus,
        bonus,
        deduction: e.deduction,
        total,
        createdAt: isoDaysAgo(5, 9, 0),
      };
    });

  const wastes: Waste[] = [
    {
      id: "wst_1",
      date: isoDaysAgo(3),
      itemType: "ingredient",
      itemId: "ing_susu",
      itemName: "Susu UHT Full Cream",
      qty: 500,
      unitLabel: "ml",
      cost: pricePerBase(ingredients[1]) * 500,
      reason: "Kemasan bocor saat pengiriman",
      reportedBy: "Rina Wati",
    },
    {
      id: "wst_2",
      date: isoDaysAgo(6),
      itemType: "product",
      itemId: "prd_aren",
      itemName: "Es Kopi Gula Aren",
      qty: 2,
      unitLabel: "cup",
      cost: productHpp(products[0], ingredients) * 2,
      reason: "Tumpah saat penyajian",
      reportedBy: "Andi Pratama",
    },
    {
      id: "wst_3",
      date: isoDaysAgo(9),
      itemType: "ingredient",
      itemId: "ing_es",
      itemName: "Es Batu Kristal",
      qty: 2000,
      unitLabel: "gram",
      cost: pricePerBase(ingredients[5]) * 2000,
      reason: "Mencair karena box pendingin mati",
      reportedBy: "Dedi Kurniawan",
    },
  ];

  const expenses: Expense[] = [
    {
      id: "exp_1",
      date: isoDaysAgo(1, 9, 0),
      category: "Sewa",
      description: "Sewa lapak bulanan",
      amount: 1200000,
    },
    {
      id: "exp_2",
      date: isoDaysAgo(2, 9, 0),
      category: "Listrik",
      description: "Token listrik",
      amount: 200000,
    },
    {
      id: "exp_3",
      date: isoDaysAgo(2, 9, 0),
      category: "Internet",
      description: "Paket data WiFi",
      amount: 150000,
    },
    {
      id: "exp_4",
      date: isoDaysAgo(4, 9, 0),
      category: "Transport",
      description: "Bensin operasional gerobak",
      amount: 90000,
    },
    {
      id: "exp_5",
      date: isoDaysAgo(6, 9, 0),
      category: "Lainnya",
      description: "Gas elpiji 3kg x2",
      amount: 40000,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log_1",
      timestamp: isoDaysAgo(0, 8, 15),
      userId: "usr_owner",
      userName: "Budi Santoso",
      role: "owner",
      action: "LOGIN",
      module: "Auth",
      detail: "Berhasil masuk ke sistem",
    },
    {
      id: "log_2",
      timestamp: isoDaysAgo(0, 8, 30),
      userId: "usr_admin",
      userName: "Rina Wati",
      role: "admin",
      action: "UPDATE",
      module: "Bahan Baku",
      detail: "Memperbarui harga Susu UHT Full Cream",
    },
    {
      id: "log_3",
      timestamp: isoDaysAgo(1, 21, 5),
      userId: "usr_andi",
      userName: "Andi Pratama",
      role: "kasir",
      action: "CREATE",
      module: "Setoran",
      detail: "Membuat setoran harian",
    },
  ];

  const priceHistory = [
    {
      id: "ph_1",
      ingredientId: "ing_susu",
      oldPrice: 19000,
      newPrice: 21000,
      changedAt: isoDaysAgo(5),
      userId: "usr_admin",
    },
    {
      id: "ph_2",
      ingredientId: "ing_kopi",
      oldPrice: 165000,
      newPrice: 180000,
      changedAt: isoDaysAgo(14),
      userId: "usr_admin",
    },
  ];

  return {
    users,
    ingredients,
    priceHistory,
    products,
    sales,
    deposits,
    receivables,
    employees,
    payrolls,
    wastes,
    expenses,
    auditLogs,
  };
}
