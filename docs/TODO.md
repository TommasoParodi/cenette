# TODO

## Bug da sistemare
<!-- Cancellare i punti man mano che vengono risolti -->

- [x] **Modifica evento** – Se si modifica un evento si cancellano le prenotazioni; va sistemato *(risolto: aggiornamento partecipanti per diff in `updateEntry`)*
- [x] **Utente uscito dal gruppo** – Se un utente esce dal gruppo rimane mostrato come "utente (?)" nelle recensioni e negli eventi; va definita la gestione (es. anonimizzare, mostrare "ex membro", ecc.)

---

## Funzionalità da implementare

- [ ] **Chatbot** – Integrare un chatbot con AI usando LangChain e OpenRouter
- [ ] **Navigazione e Back button** – Sistemare la navigazione e il pulsante indietro
- [x] **Icona** – Cambiare l’icona dell’app
- [x] **Avatar utenti** – Sostituire le icone con le iniziali con gli avatar degli utenti e metterli in cache
- [ ] **Cache immagini** – Mettere in cache le immagini (almeno quella dell’avatar)
- [ ] **Ordinamento eventi in gruppo** – Aggiungere ordinamento per data e/o voto degli eventi in un gruppo
