"use client";

import { useState } from "react";
import { FormCard } from "@/components/FormCard";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";

type LoadingType = "create" | "join" | null;

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
      <FormCard
        disabled={loadingType !== null && loadingType !== "create"}
        isLoading={loadingType === "create"}
      >
        <CreateGroupForm redirectToGroup onPendingChange={handleCreatePending} />
      </FormCard>
      <FormCard
        disabled={loadingType !== null && loadingType !== "join"}
        isLoading={loadingType === "join"}
      >
        <JoinGroupForm redirectToGroup onPendingChange={handleJoinPending} />
      </FormCard>
    </div>
  );
}
