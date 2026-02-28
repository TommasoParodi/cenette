"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type EventSort } from "./EventSortTabs";
import { EventFilterTabs } from "./EventFilterTabs";
import { EventSortTabs } from "./EventSortTabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type FilterAndListWrapperProps = {
  groupId: string;
  currentSort: EventSort;
  listContent: React.ReactNode;
};

export function FilterAndListWrapper({ groupId, currentSort, listContent }: FilterAndListWrapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onFilterChange = (href: string) => {
    startTransition(() => {
      router.replace(href);
    });
  };

  const onSortChange = (href: string) => {
    startTransition(() => {
      router.replace(href);
    });
  };

  return (
    <>
      <div className="mt-0 mb-4 flex flex-wrap items-center justify-between gap-3">
        <EventFilterTabs groupId={groupId} onFilterChange={onFilterChange} />
        <EventSortTabs groupId={groupId} currentSort={currentSort} onSortChange={onSortChange} />
      </div>
      <div className="relative mb-6 min-h-[120px]">
        {isPending && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/80"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner />
          </div>
        )}
        {listContent}
      </div>
    </>
  );
}
