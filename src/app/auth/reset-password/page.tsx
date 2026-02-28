"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";

type Step = "email" | "sent" | "update" | "done";

function getPasswordRequirements(pwd: string) {
  return {
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    digits: /\d/.test(pwd),
    symbols: /[^a-zA-Z0-9]/.test(pwd),
  };
}

function isPasswordValid(pwd: string) {
  const r = getPasswordRequirements(pwd);
  return r.lowercase && r.uppercase && r.digits && r.symbols;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Se l’utente arriva dal link nella email, l’URL contiene type=recovery (prima che Supabase processi l’hash)
  const isRecoveryLink =
    typeof window !== "undefined" && window.location.hash.includes("type=recovery");

  useEffect(() => {
    if (isRecoveryLink) {
      setStep("update");
    }
  }, [isRecoveryLink]);

  async function handleRequestEmail(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setStep("sent");
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Si è verificato un errore.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setConfirmError(null);
    if (password !== confirmPassword) {
      setConfirmError("Le password non corrispondono.");
      return;
    }
    if (!isPasswordValid(password)) {
      setMessage({
        type: "error",
        text: "La password deve contenere minuscole, maiuscole, cifre e simboli.",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep("done");
      setTimeout(() => router.replace("/dashboard"), 2000);
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Si è verificato un errore.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  if (step === "sent") {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background font-sans px-4">
        <div className="w-full max-w-[min(24rem,90vw)] space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-brand">Controlla la tua email</h1>
          <p className="text-sm text-text-secondary">
            Se un account con <strong>{email}</strong> esiste, riceverai un link per reimpostare la
            password. Controlla anche la cartella spam.
          </p>
          <Button type="button" variant="primary" onClick={() => router.push("/")}>
            Torna all’accesso
          </Button>
        </div>
      </main>
    );
  }

  if (step === "done") {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background font-sans px-4">
        <div className="w-full max-w-[min(24rem,90vw)] space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card">
          <p className="text-center text-sm text-green-600">
            Password aggiornata. Reindirizzamento al pannello…
          </p>
        </div>
      </main>
    );
  }

  if (step === "update") {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background font-sans px-4">
        <div className="w-full max-w-[min(24rem,90vw)] space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card">
          <header className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-brand">Nuova password</h1>
            <p className="mt-1 text-sm text-text-tertiary">Scegli una password sicura</p>
          </header>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <InputField
              id="password"
              type="password"
              label="Nuova password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              showPasswordToggle
            />
            <ul className="mt-2 space-y-1 text-xs text-text-secondary" aria-live="polite">
              {[
                { key: "lowercase", label: "Lettere minuscole", ok: getPasswordRequirements(password).lowercase },
                { key: "uppercase", label: "Lettere maiuscole", ok: getPasswordRequirements(password).uppercase },
                { key: "digits", label: "Cifre", ok: getPasswordRequirements(password).digits },
                { key: "symbols", label: "Simboli", ok: getPasswordRequirements(password).symbols },
              ].map(({ key, label, ok }) => (
                <li key={key} className={ok ? "text-green-600" : ""}>
                  {ok ? "✓ " : "○ "}{label}
                </li>
              ))}
            </ul>
            <InputField
              id="confirmPassword"
              type="password"
              label="Conferma password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError(null);
              }}
              onBlur={() => {
                if (confirmPassword.trim() && password !== confirmPassword) {
                  setConfirmError("Le password non corrispondono.");
                } else {
                  setConfirmError(null);
                }
              }}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              error={!!confirmError}
            />
            {confirmError && <p className="mt-1 text-sm text-red-600">{confirmError}</p>}
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={
                loading || !password.trim() || !confirmPassword.trim() || password !== confirmPassword || !isPasswordValid(password)
              }
            >
              {loading ? "Attendere…" : "Imposta password"}
            </Button>
          </form>
          <p className="text-center text-sm text-text-secondary">
            <Link href="/" className="text-accent hover:underline focus:outline-none focus:underline">
              Torna all’accesso
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // step === "email"
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background font-sans px-4">
      <div className="w-full max-w-[min(24rem,90vw)] space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-brand">Recupera password</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Inserisci l’email dell’account per ricevere un link di reset
          </p>
        </header>
        <form onSubmit={handleRequestEmail} className="space-y-4">
          <InputField
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="esempio@email.it"
            required
            autoComplete="email"
          />
          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={loading || !email.trim()}>
            {loading ? "Attendere…" : "Invia link"}
          </Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          <Link href="/" className="text-accent hover:underline focus:outline-none focus:underline">
            Torna all’accesso
          </Link>
        </p>
      </div>
    </main>
  );
}
