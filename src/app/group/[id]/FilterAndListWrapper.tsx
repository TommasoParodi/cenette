"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { EventFilterTabs } from "./EventFilterTabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type FilterAndListWrapperProps = {
  groupId: string;
  listContent: React.ReactNode;
};

export function FilterAndListWrapper({ groupId, listContent }: FilterAndListWrapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onFilterChange = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      <div className="mt-4 mb-6">
        <EventFilterTabs groupId={groupId} onFilterChange={onFilterChange} />
      </div>
      <div className="relative min-h-[120px]">
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
