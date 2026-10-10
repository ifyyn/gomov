"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatIDR, uid } from "@/lib/format";
import type { Employee, Role, User } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/nav";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
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

const emptyForm = {
  id: "",
  name: "",
  role: "kasir" as Role,
  username: "",
  baseSalary: "",
  mealAllowancePerDay: "",
  salesTarget: "",
  targetBonus: "",
  deduction: "",
  active: true,
  daysWorked: "",
};

export default function KaryawanPage() {
  const { data, saveEmployee, deleteEmployee } = useStore();
  const { users, setUsers } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const openNew = () => {
    setEditing(false);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(true);
    setForm({
      id: e.id,
      name: e.name,
      role: e.role,
      username: e.username,
      baseSalary: String(e.baseSalary),
      mealAllowancePerDay: String(e.mealAllowancePerDay),
      salesTarget: String(e.salesTarget),
      targetBonus: String(e.targetBonus),
      deduction: String(e.deduction),
      active: e.active,
      daysWorked: "",
    });
    setOpen(true);
  };

  const syncUser = (emp: Employee, wasEditing: boolean) => {
    const existingUser = users.find((u) => u.employeeId === emp.id);
    if (existingUser) {
      setUsers(
        users.map((u) =>
          u.employeeId === emp.id
            ? {
                ...u,
                username: emp.username,
                name: emp.name,
                role: emp.role,
              }
            : u,
        ),
      );
    } else if (!wasEditing) {
      const newUser: User = {
        id: uid("usr"),
        username: emp.username,
        password: "123456",
        name: emp.name,
        role: emp.role,
        employeeId: emp.id,
      };
      setUsers([...users, newUser]);
    }
  };

  const save = () => {
    if (!form.name || !form.username) return;
    const emp: Employee = {
      id: editing ? form.id : uid("emp"),
      name: form.name,
      role: form.role,
      username: form.username,
      baseSalary: Number(form.baseSalary),
      mealAllowancePerDay: Number(form.mealAllowancePerDay),
      salesTarget: Number(form.salesTarget),
      targetBonus: Number(form.targetBonus),
      deduction: Number(form.deduction),
      active: form.active,
    };
    syncUser(emp, editing);
    saveEmployee(emp, !editing);
    setOpen(false);
  };

  const remove = (emp: Employee) => {
    if (!confirm(`Hapus karyawan ${emp.name}?`)) return;
    deleteEmployee(emp.id);
    setUsers(users.filter((u) => u.employeeId !== emp.id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Karyawan"
        description="Kelola data karyawan & komponen gaji mereka"
        action={
          <Button icon="plus" onClick={openNew}>
            Tambah Karyawan
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Daftar Karyawan"
          subtitle="Akun login otomatis terhubung (password awal: 123456)"
        />
        <CardBody className="p-0">
          {data.employees.length === 0 ? (
            <EmptyState title="Belum ada karyawan" icon="users" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nama</Th>
                  <Th>Role</Th>
                  <Th>Username</Th>
                  <Th className="text-right">Gaji Pokok</Th>
                  <Th className="text-right">Uang Makan/hari</Th>
                  <Th className="text-right">Target Jualan</Th>
                  <Th className="text-right">Bonus Target</Th>
                  <Th className="text-right">Potongan</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.employees.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50">
                    <Td className="font-medium">{e.name}</Td>
                    <Td>
                      <Badge
                        tone={e.role === "owner" ? "amber" : "gray"}
                      >
                        {ROLE_LABEL[e.role]}
                      </Badge>
                    </Td>
                    <Td className="font-mono text-xs">{e.username}</Td>
                    <Td className="text-right">{formatIDR(e.baseSalary)}</Td>
                    <Td className="text-right">{formatIDR(e.mealAllowancePerDay)}</Td>
                    <Td className="text-right">{formatIDR(e.salesTarget)}</Td>
                    <Td className="text-right">{formatIDR(e.targetBonus)}</Td>
                    <Td className="text-right text-red-600">
                      -{formatIDR(e.deduction)}
                    </Td>
                    <Td>
                      <Badge tone={e.active ? "green" : "gray"}>
                        {e.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-md p-2 text-stone-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Edit"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        {e.role !== "owner" && (
                          <button
                            onClick={() => remove(e)}
                            className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </div>
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
        title={editing ? "Edit Karyawan" : "Tambah Karyawan"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button icon="check" onClick={save} disabled={!form.name || !form.username}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Lengkap" className="col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama karyawan"
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <Field label="Username (login)">
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
            />
          </Field>
          <Field label="Gaji Pokok (Rp)">
            <Input
              type="number"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
            />
          </Field>
          <Field label="Uang Makan / Hari (Rp)">
            <Input
              type="number"
              value={form.mealAllowancePerDay}
              onChange={(e) =>
                setForm({ ...form, mealAllowancePerDay: e.target.value })
              }
            />
          </Field>
          <Field label="Target Penjualan (Rp)">
            <Input
              type="number"
              value={form.salesTarget}
              onChange={(e) => setForm({ ...form, salesTarget: e.target.value })}
            />
          </Field>
          <Field label="Bonus Target (Rp)">
            <Input
              type="number"
              value={form.targetBonus}
              onChange={(e) => setForm({ ...form, targetBonus: e.target.value })}
            />
          </Field>
          <Field label="Potongan / Minus (Rp)">
            <Input
              type="number"
              value={form.deduction}
              onChange={(e) => setForm({ ...form, deduction: e.target.value })}
            />
          </Field>
          <Field label="Jumlah Hari Kerja Bulan Ini">
            <Input
              value={form.daysWorked ?? ""}
              type="number"
              onChange={(e) =>
                setForm({ ...form, daysWorked: e.target.value })
              }
              placeholder="Contoh: 24"
            />
          </Field>
          <div className="col-span-2">
            Total gaji bulan ini (estimasi):{" "}
            <b>
              {formatIDR(
                Number(form.baseSalary || 0) +
                  Number(form.mealAllowancePerDay || 0) *
                    Number(form.daysWorked || 0) +
                  (Number(form.salesTarget || 0) > 0
                    ? Number(form.targetBonus || 0)
                    : 0) -
                  Number(form.deduction || 0),
              )}
            </b>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-amber-600"
            />
            Karyawan aktif
          </label>
        </div>
      </Modal>
    </div>
  );
}