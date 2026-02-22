"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background font-sans">
      <div className="flex max-w-xs flex-col items-center text-center">
        <h1
          className="text-2xl font-semibold tracking-tight text-brand"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Sei offline
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Controlla la connessione e riprova. Le pagine già visitate potrebbero
          essere disponibili senza rete.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Riprova
        </button>
      </div>
    </main>
  );
}
