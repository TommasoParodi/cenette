"use client";

import { useState } from "react";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";

type LoadingType = "create" | "join" | null;

function CardWrapper({
  disabled,
  isLoading,
  children,
}: {
  disabled: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-surface p-4 shadow-sm transition-opacity ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {children}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/80"
          aria-hidden
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

export function NewGroupSection() {
  const [loadingType, setLoadingType] = useState<LoadingType>(null);

  const handleCreatePending = (pending: boolean) => {
    setLoadingType((prev) => (pending ? "create" : (prev === "create" ? null : prev)));
  };

  const handleJoinPending = (pending: boolean) => {
    setLoadingType((prev) => (pending ? "join" : (prev === "join" ? null : prev)));
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <CardWrapper
        disabled={loadingType !== null && loadingType !== "create"}
        isLoading={loadingType === "create"}
      >
        <CreateGroupForm redirectToGroup onPendingChange={handleCreatePending} />
      </CardWrapper>
      <CardWrapper
        disabled={loadingType !== null && loadingType !== "join"}
        isLoading={loadingType === "join"}
      >
        <JoinGroupForm redirectToGroup onPendingChange={handleJoinPending} />
      </CardWrapper>
    </div>
  );
}
