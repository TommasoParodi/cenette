"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";

type DisplayNameFormProps = {
  initialDisplayName: string | null;
  updateProfileDisplayName: (formData: FormData) => Promise<{ ok?: true; error?: string } | void>;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
    >
      {pending ? "Salvataggio…" : "Salva nome"}
    </button>
  );
}

export function DisplayNameForm({
  initialDisplayName,
  updateProfileDisplayName,
}: DisplayNameFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialDisplayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const canSubmit = value.trim().length > 0;

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        const result = await updateProfileDisplayName(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.ok) {
          router.refresh();
          router.push("/profile");
        }
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
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
