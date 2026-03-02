"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";

type RemoveAvatarButtonProps = {
  removeAvatar: () => Promise<{ ok?: true; error?: string } | void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-text-secondary underline hover:text-foreground disabled:opacity-50"
    >
      {pending ? "Rimozione…" : "Rimuovi avatar"}
    </button>
  );
}

export function RemoveAvatarButton({ removeAvatar }: RemoveAvatarButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async () => {
        setError(null);
        const result = await removeAvatar();
        if (result?.error) {
          setError(result.error);
          return;
        }
        if (result?.ok) {
          router.refresh();
          router.push("/profile");
        }
      }}
    >
      <SubmitButton />
      {error && (
        <p className="mt-2 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
