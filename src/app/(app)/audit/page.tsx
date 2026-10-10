"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/nav";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Input,
} from "@/components/ui";

const ACTION_TONE: Record<string, "green" | "blue" | "red" | "gray" | "amber"> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN: "amber",
};

export default function AuditPage() {
  const { data } = useStore();
  const [module, setModule] = useState("Semua");
  const [search, setSearch] = useState("");

  const modules = useMemo(
    () => Array.from(new Set(data.auditLogs.map((l) => l.module))),
    [data.auditLogs],
  );

  const filtered = data.auditLogs.filter((l) => {
    if (module !== "Semua" && l.module !== module) return false;
    if (
      search &&
      !`${l.userName} ${l.action} ${l.module} ${l.detail}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Lacak seluruh aktivitas pengguna pada sistem"
      />

      <Card>
        <CardHeader
          title={`Log Aktivitas (${filtered.length})`}
          action={
            <div className="flex gap-2">
              <Input
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40"
              />
              <Select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-40"
              >
                <option>Semua</option>
                {modules.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada log" icon="shield" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Pengguna</Th>
                  <Th>Role</Th>
                  <Th>Aksi</Th>
                  <Th>Modul</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50">
                    <Td>{formatDateTime(l.timestamp)}</Td>
                    <Td className="font-medium">{l.userName}</Td>
                    <Td>
                      <Badge tone="gray">{ROLE_LABEL[l.role]}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={ACTION_TONE[l.action] ?? "gray"}>
                        {l.action}
                      </Badge>
                    </Td>
                    <Td>{l.module}</Td>
                    <Td className="text-stone-500">{l.detail}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}