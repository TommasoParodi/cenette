"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";

export type EventSort = "date_asc" | "date_desc" | "vote_asc" | "vote_desc";

const SORTS: { value: EventSort; label: string }[] = [
  { value: "vote_desc", label: "Voto decrescente" },
  { value: "vote_asc", label: "Voto crescente" },
  { value: "date_desc", label: "Data decrescente" },
  { value: "date_asc", label: "Data crescente" },
];

type EventSortTabsProps = {
  groupId: string;
  currentSort: EventSort;
  onSortChange?: (href: string) => void;
};

function buildSortHref(pathname: string, sort: EventSort, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams);
  if (sort === "date_desc") {
    params.delete("sort");
  } else {
    params.set("sort", sort);
  }
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function EventSortTabs({ groupId, currentSort, onSortChange }: EventSortTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const base = pathname ?? `/group/${groupId}`;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <div className="inline-flex rounded-full bg-tabs-track p-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium text-tabs-track-inactive transition hover:text-foreground sm:px-4"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Ordina per"
          title="Ordina"
        >
          <span className="hidden sm:inline">Ordina</span>
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <svg
            className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] rounded-xl border border-separator-line bg-surface py-1 shadow-lg"
          role="menu"
        >
          {SORTS.map(({ value, label }) => {
            const isActive = currentSort === value;
            const href = buildSortHref(base, value, searchParams);
            return (
              <div key={value} role="none">
                {onSortChange ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSortChange(href);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-accent/15 font-medium text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-auto text-foreground" aria-hidden>
                        ✓
                      </span>
                    )}
                  </button>
                ) : (
                  <a
                    href={href}
                    role="menuitem"
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-accent/15 font-medium text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                    {isActive && (
                      <span className="ml-auto text-foreground" aria-hidden>
                        ✓
                      </span>
                    )}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
