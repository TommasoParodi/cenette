"use client";

import { useRouter } from "next/navigation";

type RouterLike = ReturnType<typeof useRouter>;

type Options = {
  fallbackHref: string;
  steps?: number;
  timeoutMs?: number;
};

function getCurrentLocation() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function navigateHistoryOrReplace(
  router: RouterLike,
  { fallbackHref, steps = 1, timeoutMs = 160 }: Options
) {
  if (typeof window === "undefined") {
    router.replace(fallbackHref);
    return;
  }

  const currentLocation = getCurrentLocation();
  let settled = false;

  const cleanup = () => {
    window.removeEventListener("popstate", onHistoryChange);
    window.removeEventListener("pagehide", onHistoryChange);
  };

  const onHistoryChange = () => {
    settled = true;
    cleanup();
  };

  window.addEventListener("popstate", onHistoryChange, { once: true });
  window.addEventListener("pagehide", onHistoryChange, { once: true });

  if (steps <= 1) {
    window.history.back();
  } else {
    window.history.go(-steps);
  }

  window.setTimeout(() => {
    cleanup();

    if (settled) {
      return;
    }

    if (getCurrentLocation() === currentLocation) {
      router.replace(fallbackHref);
    }
  }, timeoutMs);
}
