"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type EventFilter = "tutti" | "home" | "out";

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: "tutti", label: "Tutti" },
  { value: "home", label: "A casa" },
  { value: "out", label: "Fuori" },
];

export function EventFilterTabs({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") as EventFilter) || "tutti";
  const base = pathname ?? `/group/${groupId}`;

  return (
    <div className="flex gap-2">
      {FILTERS.map(({ value, label }) => {
        const isActive = current === value;
        const href = value === "tutti" ? base : `${base}?filter=${value}`;
        return (
          <Link
            key={value}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-accent-strong text-accent-foreground"
                : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
