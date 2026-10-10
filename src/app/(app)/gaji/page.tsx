"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  currentPeriod,
  formatIDR,
  formatNumber,
  isSameMonth,
  localDateKey,
  monthLabel,
} from "@/lib/format";
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

export default function GajiPage() {
  const { data, savePayroll, deletePayroll } = useStore();
  const [period, setPeriod] = useState(currentPeriod());
  const [message, setMessage] = useState("");

  const eligible = data.employees.filter(
    (e) => e.role === "kasir" || e.role === "admin",
  );

  const existing = useMemo(
    () => data.payrolls.filter((p) => p.period === period),
    [data.payrolls, period],
  );

  const salesInPeriod = useMemo(
    () => data.sales.filter((s) => isSameMonth(s.date, period)),
    [data.sales, period],
  );

  const summary = useMemo(() => {
    const totalBudget = existing.reduce((a, p) => a + p.total, 0);
    const paidCount = existing.length;
    const target = eligible.length;
    return { totalBudget, paidCount, target };
  }, [existing, eligible.length]);

  const generate = () => {
    const newPayrolls: Payroll[] = eligible.map((emp) => {
      const empSales = salesInPeriod.filter((s) => s.cashierId === emp.id);
      const distinctDays = new Set(
        empSales.map((s) => localDateKey(s.date)),
      ).size;
      const daysWorked =
        emp.role === "admin" ? 22 : Math.min(distinctDays || 0, 26);
      const mealAllowance = emp.mealAllowancePerDay * daysWorked;
      const salesAchieved = empSales.reduce((a, s) => a + s.total, 0);
      const bonus =
        emp.salesTarget > 0 && salesAchieved >= emp.salesTarget
          ? emp.targetBonus
          : 0;
      return {
        id: `pay_${period}_${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        period,
        daysWorked,
        baseSalary: emp.baseSalary,
        mealAllowance,
        salesAchieved,
        targetBonus: emp.targetBonus,
        bonus,
        deduction: emp.deduction,
        total: emp.baseSalary + mealAllowance + bonus - emp.deduction,
        createdAt: new Date().toISOString(),
      };
    });
    newPayrolls.forEach((p) => savePayroll(p));
    setMessage(`Slip gaji ${newPayrolls.length} karyawan untuk ${monthLabel(period)} berhasil dibuat.`);
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penggajian"
        description="Kelola slip gaji per periode berdasarkan komponen & realisasi penjualan"
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => {
                if (e.target.value) setPeriod(e.target.value);
              }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            <Button
              icon="refresh"
              variant="secondary"
              onClick={generate}
              disabled={eligible.length === 0}
            >
              Generate Slip Gaji
            </Button>
          </div>
        }
      />

      {message && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <Icon name="check" size={16} /> {message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Periode
            </p>
            <p className="mt-1 text-lg font-bold">{monthLabel(period)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Slip Dibuat
            </p>
            <p className="mt-1 text-lg font-bold">
              {summary.paidCount} / {summary.target} karyawan
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase text-stone-500">
              Total Budget Gaji
            </p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {formatIDR(summary.totalBudget)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Slip Gaji"
          subtitle="Data bersifat rahasia — karyawan hanya melihat slip miliknya sendiri"
        />
        <CardBody className="p-0">
          {existing.length === 0 ? (
            <EmptyState
              title="Belum ada slip gaji untuk periode ini"
              description="Klik Generate Slip Gaji untuk membuat"
              icon="banknote"
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Karyawan</Th>
                  <Th className="text-right">Hari Kerja</Th>
                  <Th className="text-right">Gaji Pokok</Th>
                  <Th className="text-right">Uang Makan</Th>
                  <Th className="text-right">Penjualan</Th>
                  <Th className="text-right">Target</Th>
                  <Th className="text-right">Bonus</Th>
                  <Th className="text-right">Potongan</Th>
                  <Th className="text-right">Total</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {[...existing]
                  .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
                  .map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <Td className="font-medium">{p.employeeName}</Td>
                        <Td className="text-right">{formatNumber(p.daysWorked)} hari</Td>
                        <Td className="text-right">{formatIDR(p.baseSalary)}</Td>
                        <Td className="text-right">{formatIDR(p.mealAllowance)}</Td>
                        <Td className="text-right">{formatIDR(p.salesAchieved)}</Td>
                        <Td className="text-right">
                          {formatIDR(p.targetBonus)}
                          {p.bonus > 0 && (
                            <div>
                              <Badge tone="green">Target tercapai</Badge>
                            </div>
                          )}
                        </Td>
                        <Td className="text-right text-emerald-600">
                          +{formatIDR(p.bonus)}
                        </Td>
                        <Td className="text-right text-red-600">
                          -{formatIDR(p.deduction)}
                        </Td>
                        <Td className="text-right font-bold text-stone-800">
                          {formatIDR(p.total)}
                        </Td>
                        <Td>
                          <button
                            onClick={() => deletePayroll(p.id)}
                            className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}