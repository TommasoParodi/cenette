"use client";

import { useState, useCallback } from "react";

export function CopyableInviteCode({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback per ambienti senza clipboard API
      setCopied(false);
    }
  }, [inviteCode]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-avatar-member-bg px-3 py-1.5 text-sm font-medium text-brand transition-opacity hover:opacity-90 active:opacity-80"
      title={copied ? "Copiato!" : "Clicca per copiare il codice invito"}
      aria-label={copied ? "Codice copiato" : "Copia codice invito"}
    >
      {copied ? (
        <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      <span>{copied ? "Copiato!" : inviteCode}</span>
    </button>
  );
}
