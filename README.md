# Leva – Allenamento a casa

Web app installabile (PWA) per l'allenamento a corpo libero a casa: programma personalizzato, allenamento guidato con timer, progressione automatica degli esercizi e statistiche. Funziona offline e tiene i dati solo sul telefono.

**App:** https://leva-allenamento.pages.dev

## Funzionalità

- **Onboarding** in 6 passaggi: dati personali, obiettivo (massa, forza, resistenza, forma), livello, giorni (da 2 a 4), durata (30/45/60 min), attrezzatura, zone da proteggere.
- **Programma automatico**: full body ×2, full body A/B/C oppure parte alta/parte bassa, a seconda dei giorni. Gli esercizi vengono scelti in base all'attrezzatura disponibile e adattati alla durata. Si può sostituire un esercizio o cambiare le serie.
- **Libreria** di 66 esercizi con ricerca, filtri per muscolo e per attrezzatura, istruzioni, errori comuni, note di sicurezza, varianti e alternative.
- **Allenamento guidato**: check-in iniziale (energia e gambe stanche), "da battere", timer di recupero ad anello, RIR facoltativo, cronometro per gli esercizi a tempo, peso dello zaino, pausa e ripresa, annullamento solo dopo conferma.
- **Progressione**: si sale di livello quando tutte le serie arrivano al massimo del range con margine (RIR ≥ 1); senza RIR servono 2 allenamenti di fila. Dopo 2 sessioni sotto il minimo viene proposta una variante più facile.
- **Progressi**: grafico settimanale, costanza, peso, storico per esercizio, record personali, storico degli allenamenti.
- **Dati**: backup JSON con esportazione e importazione validata (accetta anche i backup della v1).

## Struttura

```
index.html            struttura della pagina
css/app.css           stile
fonts/lexend.woff2    font, salvato in locale per l'uso offline
js/data.js            muscoli, attrezzatura, esercizi (LADDERS), schede (WORKOUTS), tabella di migrazione V1
js/store.js           stato, salvataggio, migrazione e validazione dei dati
js/engine.js          programma, scelta degli esercizi, durata, progressione, statistiche
js/ui.js              icone, grafici SVG, componenti
js/views.js           schermate
js/app.js             azioni, sessione, timer, avvio
sw.js                 service worker (cache dei file, mai dei dati)
```

Nessun framework e nessuna build: sono file statici pubblicati su Cloudflare Pages.

## Dati (`localStorage`, chiave `leva.v2`)

| Campo | Contenuto |
|---|---|
| `profile` | nome, altezza, peso, obiettivo, `level`, `obj`, `wdays` (0 = lunedì), `dur`, `equip`, `avoid`, `excl` |
| `prog` | per ogni slot di scheda: `{ id, last, hits, low, load }`, dove `id` è l'ID stabile dell'esercizio attuale |
| `sessions` | allenamenti: `{ d, wid, wname, dur, vol, kg, check, ex: [{ s, k, x, reps, rir, u, load }], ups }` |
| `weights` | `{ d, kg }` |
| `active` | allenamento in corso (si riprende anche dopo aver chiuso l'app) |
| `plan.over` | sostituzioni e serie modificate dall'utente |

Regole per le modifiche:

- Gli **ID degli esercizi** (`ph_classic`, `rt_straight`…) e degli **slot** (`A1`, `B3`…) non si cambiano e non si riutilizzano: lo storico li usa come riferimento. Per aggiungere un esercizio si crea un ID nuovo.
- La vecchia chiave `leva.v1` non viene mai modificata: alla prima apertura i dati vengono copiati e convertiti in `leva.v2`.
- A ogni rilascio si aggiorna `CACHE` in `sw.js`.

## Sviluppo locale

```
python3 -m http.server 8000
```

Poi apri http://localhost:8000 (il service worker è attivo anche su localhost).
