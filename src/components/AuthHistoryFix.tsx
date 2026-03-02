"use client";

import { useEffect } from "react";

/**
 * Quando l'utente arriva dopo il login OAuth (URL con from_auth=1),
 * inserisce delle entry buffer nella history così che il pulsante indietro
 * del browser non porti alla pagina di selezione account Google.
 */
export function AuthHistoryFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("from_auth") !== "1") return;

    // Rimuovi il parametro dall'URL per pulizia
    params.delete("from_auth");
    const cleanSearch = params.toString();
    const cleanUrl =
      window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "") + window.location.hash;

    // Sostituisci subito l'URL corrente (con from_auth) con quello pulito
    window.history.replaceState({ authBuffer: true }, "", cleanUrl);
    // Inserisce 2 entry buffer: le prime 2 pressioni di "indietro" restano sulla stessa pagina,
    // così l'utente non raggiunge la selezione account Google
    for (let i = 0; i < 2; i++) {
      window.history.pushState({ authBuffer: true }, "", cleanUrl);
    }
  }, []);

  return null;
}
