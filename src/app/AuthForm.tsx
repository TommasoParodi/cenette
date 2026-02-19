"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  function clearMessages() {
    setMessage(null);
    setConfirmError(null);
  }

  async function signInWithGoogle() {
    clearMessages();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (mode === "register") {
      if (password !== confirmPassword) {
        setConfirmError("Le password non coincidono.");
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
      // Supabase non restituisce errore se l'email esiste già; identities è vuoto in quel caso
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
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-center text-sm text-green-600 dark:text-green-400">
          Controlla la tua email per il link di conferma, poi accedi.
        </p>
        <button
          type="button"
          onClick={goToLogin}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-400"
        >
          Vai all&apos;accesso
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => { setMode("login"); clearMessages(); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Accedi
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); clearMessages(); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Registrati
        </button>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@esempio.it"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
          {mode === "register" && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
              {[
                { key: "lowercase", label: "Lettere minuscole", ok: getPasswordRequirements(password).lowercase },
                { key: "uppercase", label: "Lettere maiuscole", ok: getPasswordRequirements(password).uppercase },
                { key: "digits", label: "Cifre", ok: getPasswordRequirements(password).digits },
                { key: "symbols", label: "Simboli", ok: getPasswordRequirements(password).symbols },
              ].map(({ key, label, ok }) => (
                <li key={key} className={ok ? "text-green-600 dark:text-green-400" : ""}>
                  {ok ? "✓ " : "○ "}{label}
                </li>
              ))}
            </ul>
          )}
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Conferma password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError(null);
              }}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                confirmError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500"
                  : "border-zinc-300 focus:border-black focus:ring-black dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
              }`}
            />
            {confirmError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{confirmError}</p>
            )}
          </div>
        )}
        {message && (
          <p
            className={`text-sm ${
              message.type === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-400"
        >
          {loading ? "Attendere…" : mode === "login" ? "Accedi" : "Registrati"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide text-zinc-500">
          <span className="bg-white px-2 dark:bg-zinc-950">oppure</span>
        </div>
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-400"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Accedi con Google
      </button>
    </div>
  );
}
