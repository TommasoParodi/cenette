"use client";

import { useState } from "react";
import { FormCard } from "@/components/FormCard";
import { EditGroupForm } from "./EditGroupForm";

export function EditGroupSection({
  groupId,
  defaultName,
  isCreator,
}: {
  groupId: string;
  defaultName: string;
  isCreator: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <FormCard isLoading={isLoading}>
      <EditGroupForm
        groupId={groupId}
        defaultName={defaultName}
        isCreator={isCreator}
        onPendingChange={setIsLoading}
      />
    </FormCard>
  );
}
