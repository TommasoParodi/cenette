"use client";

import { useRouter } from "next/navigation";
import { navigateHistoryOrReplace } from "@/lib/history-navigation";

const BackIcon = () => (
  <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
  </svg>
);

type Props = {
  backHref: string;
};

export function TopbarBackButton({ backHref }: Props) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateHistoryOrReplace(router, { fallbackHref: backHref });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex shrink-0 items-center justify-center text-foreground/70 hover:text-foreground"
      aria-label="Indietro"
    >
      <BackIcon />
    </button>
  );
}
