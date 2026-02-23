"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type EventFilter = "tutti" | "home" | "out";

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: "tutti", label: "Tutti" },
  { value: "home", label: "A casa" },
  { value: "out", label: "Fuori" },
];

type EventFilterTabsProps = {
  groupId: string;
  /** Se fornita, al click si usa la navigazione in transition (per mostrare loading sulla lista). */
  onFilterChange?: (href: string) => void;
};

export function EventFilterTabs({ groupId, onFilterChange }: EventFilterTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") as EventFilter) || "tutti";
  const base = pathname ?? `/group/${groupId}`;

  const buildHref = (filterValue: EventFilter) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (filterValue === "tutti") {
      params.delete("filter");
    } else {
      params.set("filter", filterValue);
    }
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  };

  return (
    <div className="flex gap-2">
      {FILTERS.map(({ value, label }) => {
        const isActive = current === value;
        const href = buildHref(value);
        const className = `rounded-full px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-accent-strong text-accent-foreground"
            : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
        }`;
        if (onFilterChange) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(href)}
              className={className}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        }
        return (
          <Link key={value} href={href} className={className}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
