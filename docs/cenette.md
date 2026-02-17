# Cenette — Product Specification

## Obiettivo
Cenette è una web app sociale per gruppi di amici che vogliono tenere traccia delle cene insieme o dei locali visitati.

L’app permette di:
- registrare eventi (cene a casa o uscite)
- caricare foto dell’evento
- lasciare recensioni personali
- valutare esperienze
- ricordare cosa si è fatto nel tempo
- ricevere suggerimenti AI basati sullo storico

Non è una piattaforma pubblica di recensioni: è privata e basata su gruppi.

---

## Concetti principali

### Gruppo
Un gruppo rappresenta una cerchia di persone che condividono esperienze.

Esempi:
- gruppo di amici per le cene
- gruppo per recensire bar del paese

Ogni gruppo ha una modalità di voto:

- SIMPLE → voto unico (cene tra amici)
- DETAILED → voto a categorie (locali)

---

### Entry (evento)
Un evento è una singola esperienza registrata.

Tipi:
- HOME → cena a casa
- OUT → locale/bar/ristorante

Contiene:
- titolo
- data
- descrizione
- creatore (chi lo ha inserito)
- foto dell’evento (max 3)
- partecipanti cuochi (solo HOME)

Solo il creatore può modificare descrizione e foto.

---

### Review
Ogni membro può lasciare UNA recensione per evento.

Contiene:
- voto complessivo
- commento
- eventuale foto personale

Se gruppo DETAILED include:
- costo
- servizio
- cibo
- location

---

### Cooks (solo HOME)
Il creatore dell’evento può indicare chi ha cucinato.
Uno o più membri del gruppo.

Serve per statistiche e memoria storica.

---

## Flusso utente

### Accesso
Utente entra con Google.

### Dashboard
Vede i suoi gruppi.
Può:
- crearne uno
- entrare con codice invito

### Dentro un gruppo
Vede la lista eventi:
- filtri casa/fuori
- ordinamento
- rating medio

Può creare nuovo evento.

### Evento
Visualizza:
- info
- foto
- voti
- recensioni

Se non ha recensito → può aggiungere review.

### Review
Utente inserisce voto e commento.
Può modificarlo in seguito.

---

## AI (fase successiva)
Il gruppo potrà chiedere:

"Cosa facciamo stasera?"

L’AI risponderà usando:
- storico eventi
- voti
- preferenze implicite del gruppo

Non è una chat generale ma un suggeritore contestuale.

---

## Regole importanti
- solo membri vedono dati del gruppo
- solo creatore modifica evento
- solo autore modifica la propria review
- massimo 3 foto evento
- massimo 1 foto per review

---

## Obiettivo esperienza
L’app deve sembrare:
- privata
- leggera
- divertente
- veloce da usare durante una cena

Non deve sembrare un gestionale o TripAdvisor.
