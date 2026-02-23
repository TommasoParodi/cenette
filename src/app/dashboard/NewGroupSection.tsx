"use client";

import { useState } from "react";
import { FormCard } from "@/components/FormCard";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";

type Tab = "create" | "join";
type LoadingType = "create" | "join" | null;

const TABS: { value: Tab; label: string }[] = [
  { value: "create", label: "Crea gruppo" },
  { value: "join", label: "Entra con codice" },
];

export function NewGroupSection() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [loadingType, setLoadingType] = useState<LoadingType>(null);

  const handleCreatePending = (pending: boolean) => {
    setLoadingType((prev) => (pending ? "create" : (prev === "create" ? null : prev)));
  };

  const handleJoinPending = (pending: boolean) => {
    setLoadingType((prev) => (pending ? "join" : (prev === "join" ? null : prev)));
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex justify-center gap-2" role="tablist" aria-label="Nuovo gruppo o entra con codice">
        {TABS.map(({ value, label }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`group-form-panel-${value}`}
              id={`group-form-tab-${value}`}
              onClick={() => setActiveTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-accent-strong text-accent-foreground"
                  : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <FormCard
        id="group-form-panel-create"
        role="tabpanel"
        aria-labelledby="group-form-tab-create"
        hidden={activeTab !== "create"}
        disabled={loadingType !== null && loadingType !== "create"}
        isLoading={loadingType === "create"}
      >
        <CreateGroupForm redirectToGroup onPendingChange={handleCreatePending} />
      </FormCard>
      <FormCard
        id="group-form-panel-join"
        role="tabpanel"
        aria-labelledby="group-form-tab-join"
        hidden={activeTab !== "join"}
        disabled={loadingType !== null && loadingType !== "join"}
        isLoading={loadingType === "join"}
      >
        <JoinGroupForm redirectToGroup onPendingChange={handleJoinPending} />
      </FormCard>
    </div>
  );
}
