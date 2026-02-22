"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type DisplayNameFormProps = {
  initialDisplayName: string | null;
  updateProfileDisplayName: (formData: FormData) => Promise<{ error?: string } | void>;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Salvataggio…" : "Salva nome"}
    </button>
  );
}

export function DisplayNameForm({
  initialDisplayName,
  updateProfileDisplayName,
}: DisplayNameFormProps) {
  const [value, setValue] = useState(initialDisplayName ?? "");
  const canSubmit = value.trim().length > 0;

  return (
    <form
      action={async (formData: FormData) => {
        await updateProfileDisplayName(formData);
      }}
      className="flex flex-col gap-3"
    >
      <input
        type="text"
        name="display_name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Il tuo nome"
        className="w-full rounded-xl border border-separator-line bg-surface-muted px-4 py-2.5 text-sm text-foreground placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        maxLength={100}
      />
      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
