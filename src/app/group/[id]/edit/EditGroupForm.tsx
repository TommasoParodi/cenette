"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { updateGroup, deleteGroup } from "@/server-actions/groups";

type FormState = string | { data: { groupId: string } } | null;

function PendingNotifier({ onPendingChange }: { onPendingChange?: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);
  return null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-70"
    >
      {pending ? "Attendere…" : "Salva"}
    </button>
  );
}

export function EditGroupForm({
  groupId,
  defaultName,
  isCreator,
  onPendingChange,
}: {
  groupId: string;
  defaultName: string;
  isCreator: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_: unknown, formData: FormData) => {
      const result = await updateGroup(groupId, formData);
      if (result?.error) return result.error;
      if (result?.data?.groupId) return { data: { groupId: result.data.groupId } };
      return null;
    },
    null as FormState
  );

  useEffect(() => {
    if (state && typeof state === "object" && "data" in state && state.data?.groupId) {
      router.refresh();
      router.push("/group/" + state.data.groupId);
    }
  }, [state, router]);

  const errorMessage = typeof state === "string" ? state : null;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    const formData = new FormData();
    formData.set("group_id", groupId);
    const result = await deleteGroup(formData);
    if (result?.data) {
      router.refresh();
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-2">
        <PendingNotifier onPendingChange={onPendingChange} />
        <h3 className="text-sm font-medium text-label">Nome gruppo</h3>
        <input
          type="text"
          name="name"
          defaultValue={defaultName}
          placeholder="Nome gruppo"
          required
          className="rounded-xl border border-separator-line bg-surface px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        <SubmitButton />
      </form>

      {isCreator && (
        <section className="border-t border-separator-line pt-6">
          <h3 className="text-sm font-medium text-label">Zona pericolo</h3>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="rounded-xl border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Elimina gruppo
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Elimina gruppo"
        message="Sei sicuro? Il gruppo e tutti i suoi dati saranno eliminati."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </div>
  );
}
