import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const TONES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700 ring-amber-500/10",
  green: "bg-emerald-100 text-emerald-700 ring-emerald-500/10",
  blue: "bg-blue-100 text-blue-700 ring-blue-500/10",
  red: "bg-red-100 text-red-700 ring-red-500/10",
  purple: "bg-amber-100 text-amber-700 ring-amber-500/10",
  gray: "bg-stone-100 text-stone-600 ring-stone-500/10",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "amber",
  delta,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: string;
  tone?: keyof typeof TONES;
  delta?: { pct: number; up: boolean };
}) {
  return (
    <div className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}
        >
          <Icon name={icon} size={20} />
        </span>
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              delta.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {delta.up ? "▲" : "▼"} {delta.pct > 999 ? "Baru" : `${delta.pct}%`}
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-bold leading-tight text-stone-800 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}