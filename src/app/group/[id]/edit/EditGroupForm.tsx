"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { updateGroup, deleteGroup } from "@/server-actions/groups";

type FormState = string | { data: { groupId: string } } | null;

function PendingNotifier({
  onPendingChange,
  redirecting,
}: { onPendingChange?: (pending: boolean) => void; redirecting: boolean }) {
  const { pending } = useFormStatus();
  const showLoading = pending || redirecting;
  useEffect(() => {
    onPendingChange?.(showLoading);
  }, [showLoading, onPendingChange]);
  return null;
}

function SubmitButton({
  disabledWhenEmpty,
  redirecting,
}: { disabledWhenEmpty?: boolean; redirecting: boolean }) {
  const { pending } = useFormStatus();
  const showLoading = pending || redirecting;
  const disabled = showLoading || disabledWhenEmpty;
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
    >
      {showLoading ? "Attendere…" : "Salva"}
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

  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    if (state && typeof state === "object" && "data" in state && state.data?.groupId) {
      setRedirecting(true);
      router.refresh();
      router.replace("/group/" + state.data.groupId);
    }
  }, [state, router]);

  const errorMessage = typeof state === "string" ? state : null;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const isNameEmpty = !name.trim();

  const handleDeleteConfirm = async () => {
    const formData = new FormData();
    formData.set("group_id", groupId);
    const result = await deleteGroup(formData);
    if (result?.data) {
      router.refresh();
      router.replace("/dashboard");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-2">
        <PendingNotifier onPendingChange={onPendingChange} redirecting={redirecting} />
        <h3 className="text-sm font-medium text-label">
          Nome gruppo <span className="text-red-600" aria-hidden>*</span>
        </h3>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome gruppo"
          required
          className="rounded-xl border border-separator-line bg-surface px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        <SubmitButton disabledWhenEmpty={isNameEmpty} redirecting={redirecting} />
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
