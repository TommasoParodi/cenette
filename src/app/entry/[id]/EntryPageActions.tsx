"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { deleteEntry as deleteEntryAction, deleteReview as deleteReviewAction } from "@/server-actions/entries";
import { navigateHistoryOrReplace } from "@/lib/history-navigation";

type EntryPageActionsContextValue = {
  deleteReview: (reviewId: string) => Promise<void>;
  deleteEntry: () => Promise<void>;
};

const EntryPageActionsContext = createContext<EntryPageActionsContextValue | null>(null);

export function useEntryPageActions() {
  return useContext(EntryPageActionsContext);
}

export function EntryPageActionsProvider({
  entryId,
  children,
}: {
  entryId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteReview = useCallback(
    async (reviewId: string) => {
      setIsDeleting(true);
      try {
        const result = await deleteReviewAction(reviewId, entryId);
        if (result?.data) {
          router.refresh();
          // Attendi che il refresh abbia tempo di completare prima di nascondere il loading
          await new Promise((r) => setTimeout(r, 1200));
        } else if (result?.error) {
          alert(result.error);
        }
      } finally {
        setIsDeleting(false);
      }
    },
    [entryId, router]
  );

  const deleteEntry = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEntryAction(entryId);
      if (result?.data && "groupId" in result.data) {
        navigateHistoryOrReplace(router, {
          fallbackHref: `/group/${result.data.groupId}`,
        });
      } else if (result?.error) {
        alert(result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [entryId, router]);

  return (
    <EntryPageActionsContext.Provider value={{ deleteReview, deleteEntry }}>
      {children}
      {isDeleting && <PageLoadingOverlay />}
    </EntryPageActionsContext.Provider>
  );
}
