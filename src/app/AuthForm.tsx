"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";

type Mode = "login" | "register";

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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  function clearMessages() {
    setMessage(null);
    setConfirmError(null);
  }

  async function signInWithGoogle() {
    clearMessages();
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (mode === "register") {
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
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        setMessage({
          type: "error",
          text: "Questa email è già registrata. Usa Accedi per entrare o recupera la password se non la ricordi.",
        });
        setLoading(false);
        return;
      }
      setRegistrationSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Si è verificato un errore.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setPassword("");
    setConfirmPassword("");
    clearMessages();
  }

  function goToLogin() {
    setRegistrationSuccess(false);
    setMode("login");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    clearMessages();
  }

  if (registrationSuccess) {
    return (
      <div className="w-full max-w-[min(24rem,90vw)] space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card">
        <p className="text-center text-sm text-green-600">
          Controlla la tua email per il link di conferma, poi accedi.
        </p>
        <Button type="button" variant="primary" onClick={goToLogin}>
          Vai all&apos;accesso
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[min(24rem,90vw)] flex-col">
      <div
        className={`relative mt-12 space-y-6 rounded-2xl border border-card-border bg-surface p-8 shadow-card transition-opacity ${
          googleLoading ? "pointer-events-none select-none opacity-60" : ""
        }`}
        aria-busy={googleLoading}
      >
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand">Cenette</h1>
          <p className="mt-1 text-sm text-text-tertiary">Ricorda le cene più belle</p>
        </header>

        <Button
          type="button"
          variant="secondary"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          leftIcon={<GoogleIcon />}
        >
          {googleLoading ? "Attendere…" : "Accedi con Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-separator-line" />
          </div>
          <div className="relative flex justify-center text-sm font-medium uppercase tracking-wide text-separator-text">
            <span className="bg-surface px-3">OPPURE</span>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
          <InputField
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (mode === "register" && confirmPassword && e.target.value === confirmPassword)
                setConfirmError(null);
            }}
            placeholder="••••••••"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            showPasswordToggle
            labelAction={
              mode === "login" ? (
                <a
                  href="/auth/reset-password"
                  className="text-sm font-medium text-accent hover:underline focus:outline-none focus:underline"
                >
                  Dimenticata?
                </a>
              ) : undefined
            }
          />
          {mode === "register" && (
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
          )}
          {mode === "register" && (
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
          )}
          {confirmError && (
            <p className="mt-1 text-sm text-red-600">{confirmError}</p>
          )}
          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={
              loading ||
              googleLoading ||
              !email.trim() ||
              !password.trim() ||
              (mode === "register" && !confirmPassword.trim()) ||
              (mode === "register" && password !== confirmPassword)
            }
          >
            {loading ? "Attendere…" : mode === "login" ? "Accedi" : "Registrati"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {mode === "login" ? (
          <>
            Non hai un account?{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-accent hover:underline focus:outline-none focus:underline"
            >
              Registrati
            </button>
          </>
        ) : (
          <>
            Hai già un account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                clearMessages();
              }}
              className="font-semibold text-accent hover:underline focus:outline-none focus:underline"
            >
              Accedi
            </button>
          </>
        )}
      </p>
      <p className="mt-3 text-center text-xs text-text-tertiary">
        <Link
          href="/termini"
          className="text-accent hover:underline focus:outline-none focus:underline"
        >
          Termini e Condizioni
        </Link>
      </p>
    </div>
  );
}
