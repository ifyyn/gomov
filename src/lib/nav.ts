import type { Role } from "./types";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    roles: ["owner", "admin"],
    group: "Utama",
  },
  {
    href: "/penjualan",
    label: "Penjualan (POS)",
    icon: "cart",
    roles: ["owner", "admin", "kasir"],
    group: "Operasional Harian",
  },
  {
    href: "/setoran",
    label: "Setoran Harian",
    icon: "wallet",
    roles: ["owner", "admin", "kasir"],
    group: "Operasional Harian",
  },
  {
    href: "/piutang",
    label: "Piutang Pelanggan",
    icon: "receipt",
    roles: ["owner", "admin", "kasir"],
    group: "Operasional Harian",
  },
  {
    href: "/menu",
    label: "Menu & Resep",
    icon: "coffee",
    roles: ["owner", "admin"],
    group: "Produk & Bahan",
  },
  {
    href: "/bahan",
    label: "Master Bahan Baku",
    icon: "box",
    roles: ["owner", "admin"],
    group: "Produk & Bahan",
  },
  {
    href: "/stok",
    label: "Stok & Inventaris",
    icon: "layers",
    roles: ["owner", "admin"],
    group: "Produk & Bahan",
  },
  {
    href: "/waste",
    label: "Waste / Barang Terbuang",
    icon: "trash",
    roles: ["owner", "admin"],
    group: "Produk & Bahan",
  },
  {
    href: "/karyawan",
    label: "Karyawan",
    icon: "users",
    roles: ["owner"],
    group: "SDM & Keuangan",
  },
  {
    href: "/gaji",
    label: "Penggajian",
    icon: "banknote",
    roles: ["owner"],
    group: "SDM & Keuangan",
  },
  {
    href: "/operasional",
    label: "Biaya Operasional",
    icon: "plug",
    roles: ["owner", "admin"],
    group: "SDM & Keuangan",
  },
  {
    href: "/laporan",
    label: "Laporan",
    icon: "chart",
    roles: ["owner", "admin"],
    group: "Laporan & Audit",
  },
  {
    href: "/audit",
    label: "Audit Log",
    icon: "shield",
    roles: ["owner"],
    group: "Laporan & Audit",
  },
  {
    href: "/profil",
    label: "Profil & Slip Gaji",
    icon: "user",
    roles: ["owner", "admin", "kasir"],
    group: "Akun",
  },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function canAccess(role: Role, href: string): boolean {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) return false;
  return item.roles.includes(role);
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner / Pemilik",
  admin: "Admin",
  kasir: "Barista / Kasir",
};
