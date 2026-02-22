"use client";

import { useFormStatus } from "react-dom";

type RemoveAvatarButtonProps = {
  removeAvatar: () => Promise<{ error?: string } | void>;
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
  return (
    <form
      action={async () => {
        await removeAvatar();
      }}
    >
      <SubmitButton />
    </form>
  );
}
