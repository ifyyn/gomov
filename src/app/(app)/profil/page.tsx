"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, formatNumber, monthLabel } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/nav";
import type { Payroll } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

function slipHTML(p: Payroll): string {
  const rows: [string, string, string][] = [
    ["Gaji Pokok", formatIDR(p.baseSalary), formatIDR(p.baseSalary)],
    [
      `Uang Makan (${formatNumber(p.daysWorked)} hari × ${formatIDR(p.mealAllowance / Math.max(p.daysWorked, 1))})`,
      "",
      formatIDR(p.mealAllowance),
    ],
    [
      "Bonus Target",
      p.targetBonus > 0
        ? `Pelanggaran target: ${p.bonus > 0 ? "tercapai" : "tidak tercapai"}`
        : "-",
      p.bonus > 0 ? `+${formatIDR(p.bonus)}` : "-",
    ],
    ["Potongan / Minus", "", p.deduction > 0 ? `-${formatIDR(p.deduction)}` : "-"],
  ];
  const rowHTML = rows
    .map(
      ([label, remark, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;color:#888;font-size:12px;">${remark}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;">${value}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>Slip Gaji ${p.employeeName}</title>
<style>
  body{font-family:Arial,sans-serif;color:#1c1917;padding:32px;}
  .wrap{max-width:520px;margin:0 auto;border:1px solid #d6d3d1;border-radius:12px;padding:28px;}
  .head{text-align:center;border-bottom:2px solid #f59e0b;padding-bottom:16px;margin-bottom:20px;}
  .head h1{margin:0;font-size:22px;}
  .head p{margin:4px 0 0;color:#78716c;font-size:13px;}
  h2{font-size:16px;margin:20px 0 8px;color:#57534e;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  .total td{border-top:2px solid #f59e0b;font-size:16px;font-weight:bold;padding:10px 12px;}
  .sign{margin-top:40px;text-align:right;}
  .sign .line{margin-top:60px;border-top:1px solid #1c1917;padding-top:6px;font-size:12px;}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <h1>GOMOV</h1>
    <p>Slip Gaji Karyawan — ${monthLabel(p.period)}</p>
  </div>
  <p><b>Nama:</b> ${p.employeeName}</p>
  <p><b>Periode:</b> ${monthLabel(p.period)}</p>
  <p><b>Hari Kerja:</b> ${formatNumber(p.daysWorked)} hari</p>
  <h2>Rincian Penerimaan</h2>
  <table>
    <thead>
      <tr style="background:#fafaf9;">
        <th style="text-align:left;padding:8px 12px;">Komponen</th>
        <th style="text-align:left;padding:8px 12px;">Catatan</th>
        <th style="text-align:right;padding:8px 12px;">Jumlah</th>
      </tr>
    </thead>
    <tbody>${rowHTML}
      <tr class="total">
        <td colspan="2" style="padding:10px 12px;">Total Diterima</td>
        <td style="padding:10px 12px;text-align:right;">${formatIDR(p.total)}</td>
      </tr>
    </tbody>
  </table>
  <div class="sign">
    <p style="margin:0;color:#78716c;font-size:12px;">Dicetak mandiri oleh karyawan melalui sistem GOMOV.</p>
    <div class="line">Mengetahui,<br/>Owner / Pemilik</div>
  </div>
</div>
</body>
</html>`;
}

export default function ProfilPage() {
  const { user } = useAuth();
  const { data } = useStore();

  const myEmployeeId = user?.employeeId;

  const myPayrolls = useMemo(
    () =>
      data.payrolls
        .filter((p) => p.employeeId === myEmployeeId)
        .sort((a, b) => b.period.localeCompare(a.period)),
    [data.payrolls, myEmployeeId],
  );

  const download = (p: Payroll) => {
    const blob = new Blob([slipHTML(p)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slip-gaji-${p.employeeName.replace(/\s+/g, "-").toLowerCase()}-${p.period}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profil & Slip Gaji" description="Lihat profil dan unduh slip gaji pribadi" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-xl font-bold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-stone-800">{user?.name}</p>
                <Badge tone={user?.role === "owner" ? "amber" : "gray"}>
                  {user ? ROLE_LABEL[user.role] : ""}
                </Badge>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-stone-600">
              <p>
                <b>Username:</b> <span className="font-mono">{user?.username}</span>
              </p>
              <p>
                <b>ID Pegawai:</b> <span className="font-mono">{myEmployeeId ?? "-"}</span>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Slip Gaji Saya"
            subtitle="Privasi ketat — hanya slip milik Anda yang tampil & dapat diunduh"
          />
          <CardBody className="p-0">
            {myPayrolls.length === 0 ? (
              <EmptyState
                title="Belum ada slip gaji"
                description="Slip gaji akan muncul setelah Owner membuat penggajian"
                icon="banknote"
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Periode</Th>
                    <Th className="text-right">Hari Kerja</Th>
                    <Th className="text-right">Gaji Pokok</Th>
                    <Th className="text-right">Tunjangan</Th>
                    <Th className="text-right">Bonus</Th>
                    <Th className="text-right">Potongan</Th>
                    <Th className="text-right">Total</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {myPayrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <Td className="font-medium">{monthLabel(p.period)}</Td>
                      <Td className="text-right">{formatNumber(p.daysWorked)}</Td>
                      <Td className="text-right">{formatIDR(p.baseSalary)}</Td>
                      <Td className="text-right">{formatIDR(p.mealAllowance)}</Td>
                      <Td className="text-right text-emerald-600">
                        +{formatIDR(p.bonus)}
                      </Td>
                      <Td className="text-right text-red-600">
                        -{formatIDR(p.deduction)}
                      </Td>
                      <Td className="text-right font-bold">{formatIDR(p.total)}</Td>
                      <Td>
                        <Button size="sm" variant="outline" icon="download" onClick={() => download(p)}>
                          Unduh
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Bantuan" />
        <CardBody className="space-y-2 text-sm text-stone-600">
          <p className="flex items-center gap-2">
            <Icon name="alert" size={16} className="text-amber-500" />
            Slip gaji bersifat rahasia; karyawan lain tidak dapat melihat slip Anda.
          </p>
          <p className="flex items-center gap-2">
            <Icon name="download" size={16} className="text-amber-500" />
            Klik tombol Unduh untuk menyimpan slip gaji (format HTML, siap dicetak).
          </p>
        </CardBody>
      </Card>
    </div>
  );
}