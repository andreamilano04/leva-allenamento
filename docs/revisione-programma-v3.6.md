# Leva v3.6 · Report delle schede

Profilo verificato: livello intermedio, 3 giorni (lun, mer, ven), 45 minuti, obiettivo massa muscolare, attrezzatura zaino + sedia + divano (niente elastico né sbarra). Le tabelle sono generate direttamente dal motore (`program()` in `js/engine.js`), non scritte a mano.

## Cosa cambia nella v3.6

- **Varietà della tirata.** La scheda C ora parte dal rematore a un braccio con zaino e sedia, mentre A e B usano quello a due braccia. I progressi restano separati per scheda, quindi C resta sul rematore a un braccio anche quando A sale di livello. La frequenza (3 volte a settimana) e il volume non cambiano.
- **Tirata verticale.** Senza sbarra né elastico non c'è una tirata verticale sicura in casa. L'app non la inventa: nella schermata Programma ora c'è un avviso che rematori e pullover non equivalgono a trazioni o lat machine.
- **Recuperi, un solo riferimento.** 120 s per i multiarticolari principali di ogni scheda, 90 s per gli altri esercizi, 60 s per core, polpacci e scrollate, 45 s per il collo. La meta-analisi di Singer et al. (2024) indica un piccolo vantaggio oltre i 60 s e nessuna differenza apprezzabile oltre i 90 s: i 120 s servono alla qualità delle serie più pesanti (Schoenfeld et al., 2016). Ho tolto da `data.js` 76 valori `rest` che il motore non usava e che contraddicevano il codice, e ho allineato commenti e README.
- **Test.** 6 test nuovi, 63 in tutto, tutti superati.

## Limiti noti

- **Durata.** I 45 minuti scelti valgono solo per gli esercizi. Con riscaldamento (4 min) e defaticamento (4 min) l'allenamento dura circa 51–55 minuti.
- **Femorali a 5 serie a settimana** con 45 minuti. A 60 minuti salgono a 7,5.

## Priorità: Equilibrata (predefinita)

### Scheda A · Spinta e quadricipiti · ~46 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 17 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Piegamenti classici | 3 × 8–15 rip | 120 s | Pettorali | Tricipiti, Spalle | corpo libero |
| 2 | Squat bulgaro | 3 × 8–12 rip per lato | 120 s | Quadricipiti | Glutei | sedia stabile |
| 3 | Rematore con zaino a busto flesso | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso |
| 4 | Pike push-up | 2 × 6–12 rip | 90 s | Spalle | Tricipiti | corpo libero |
| 5 | Hip thrust su una gamba | 2 × 10–15 rip per lato | 90 s | Glutei | Femorali | divano o mobile pesante |
| 6 | Curl con zaino | 2 × 12–15 rip | 90 s | Bicipiti | — | zaino con peso |
| 7 | Plank | 2 × 30–60 s | 60 s | Core | — | corpo libero |

Attrezzatura della scheda: sedia stabile, zaino con peso, divano o mobile pesante.

### Scheda B · Tirata e catena posteriore · ~43 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 15 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Rematore con zaino a busto flesso | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso |
| 2 | Piegamenti a piedi rialzati | 3 × 8–15 rip | 120 s | Pettorali | Tricipiti, Spalle | sedia stabile |
| 3 | Affondi indietro con zaino | 3 × 8–12 rip per lato | 120 s | Quadricipiti | Glutei | zaino con peso |
| 4 | Nordic curl negativo | 2 × 4–8 rip | 90 s | Femorali | Glutei | divano o mobile pesante |
| 5 | Pullover con zaino a terra | 2 × 12–15 rip | 90 s | Dorsali | Pettorali, Tricipiti | zaino con peso |
| 6 | Polpacci a terra, una gamba | 2 × 12–20 rip per lato | 60 s | Polpacci | — | corpo libero |

Attrezzatura della scheda: zaino con peso, sedia stabile, divano o mobile pesante.

### Scheda C · Mista e braccia · ~47 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 17 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Piegamenti ad arciere | 3 × 6–12 rip per lato | 120 s | Pettorali | Tricipiti, Spalle | corpo libero |
| 2 | Squat con zaino, discesa in 3 s | 3 × 10–15 rip | 120 s | Quadricipiti | Glutei | zaino con peso |
| 3 | Rematore a un braccio con zaino | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso, sedia stabile |
| 4 | Leg curl scivolato | 2 × 8–12 rip | 90 s | Femorali | Glutei | corpo libero |
| 5 | Alzate a Y da prono | 2 × 12–20 rip | 90 s | Spalle | Dorsali | corpo libero |
| 6 | Hollow body hold | 2 × 20–40 s | 60 s | Core | — | corpo libero |
| 7 | Polpacci a terra, una gamba | 2 × 12–20 rip per lato | 60 s | Polpacci | — | corpo libero |

Attrezzatura della scheda: zaino con peso, sedia stabile.

### Serie settimanali (secondari = mezza serie)

| Muscolo | Serie |
|---|---|
| Pettorali | 10 |
| Dorsali | 12 |
| Spalle | 8,5 |
| Bicipiti | 6,5 |
| Tricipiti | 6,5 |
| Quadricipiti | 9 |
| Femorali | 5 |
| Glutei | 8,5 |
| Polpacci | 4 |
| Core | 4 |

## Priorità: Parte alta

### Scheda A · Spinta e quadricipiti · ~46 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 18 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Piegamenti classici | 3 × 8–15 rip | 120 s | Pettorali | Tricipiti, Spalle | corpo libero |
| 2 | Squat bulgaro | 2 × 8–12 rip per lato | 90 s | Quadricipiti | Glutei | sedia stabile |
| 3 | Rematore con zaino a busto flesso | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso |
| 4 | Pike push-up | 3 × 6–12 rip | 90 s | Spalle | Tricipiti | corpo libero |
| 5 | Hip thrust su una gamba | 2 × 10–15 rip per lato | 90 s | Glutei | Femorali | divano o mobile pesante |
| 6 | Curl con zaino | 3 × 12–15 rip | 90 s | Bicipiti | — | zaino con peso |
| 7 | Plank | 2 × 30–60 s | 60 s | Core | — | corpo libero |

Attrezzatura della scheda: sedia stabile, zaino con peso, divano o mobile pesante.

### Scheda B · Tirata e catena posteriore · ~43 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 16 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Rematore con zaino a busto flesso | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso |
| 2 | Piegamenti a piedi rialzati | 3 × 8–15 rip | 120 s | Pettorali | Tricipiti, Spalle | sedia stabile |
| 3 | Affondi indietro con zaino | 2 × 8–12 rip per lato | 90 s | Quadricipiti | Glutei | zaino con peso |
| 4 | Nordic curl negativo | 2 × 4–8 rip | 90 s | Femorali | Glutei | divano o mobile pesante |
| 5 | Pullover con zaino a terra | 2 × 12–15 rip | 90 s | Dorsali | Pettorali, Tricipiti | zaino con peso |
| 6 | Piegamenti stretti | 2 × 8–15 rip | 90 s | Tricipiti | Pettorali | corpo libero |
| 7 | Polpacci a terra, una gamba | 2 × 12–20 rip per lato | 60 s | Polpacci | — | corpo libero |

Attrezzatura della scheda: zaino con peso, sedia stabile, divano o mobile pesante.

### Scheda C · Mista e braccia · ~47 min di esercizi (+ 4 riscaldamento e 4 defaticamento) · 18 serie

| # | Esercizio | Serie × ripetizioni | Recupero | Muscolo principale | Secondari | Attrezzatura |
|---|---|---|---|---|---|---|
| 1 | Piegamenti ad arciere | 3 × 6–12 rip per lato | 120 s | Pettorali | Tricipiti, Spalle | corpo libero |
| 2 | Squat con zaino, discesa in 3 s | 2 × 10–15 rip | 90 s | Quadricipiti | Glutei | zaino con peso |
| 3 | Rematore a un braccio con zaino | 3 × 10–15 rip | 120 s | Dorsali | Bicipiti | zaino con peso, sedia stabile |
| 4 | Leg curl scivolato | 2 × 8–12 rip | 90 s | Femorali | Glutei | corpo libero |
| 5 | Alzate a Y da prono | 2 × 12–20 rip | 90 s | Spalle | Dorsali | corpo libero |
| 6 | Dip tra due sedie | 2 × 8–15 rip | 90 s | Tricipiti | Pettorali, Spalle | sedia stabile |
| 7 | Hollow body hold | 2 × 20–40 s | 60 s | Core | — | corpo libero |
| 8 | Polpacci a terra, una gamba | 2 × 12–20 rip per lato | 60 s | Polpacci | — | corpo libero |

Attrezzatura della scheda: zaino con peso, sedia stabile.

### Serie settimanali (secondari = mezza serie)

| Muscolo | Serie |
|---|---|
| Pettorali | 12 |
| Dorsali | 12 |
| Spalle | 10,5 |
| Bicipiti | 7,5 |
| Tricipiti | 11 |
| Quadricipiti | 6 |
| Femorali | 5 |
| Glutei | 7 |
| Polpacci | 4 |
| Core | 4 |

## Fonti

- Singer A. et al. (2024). *Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy.* Front. Sports Act. Living 6:1429789. doi:10.3389/fspor.2024.1429789
- Schoenfeld B.J. et al. (2016). *Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men.* J Strength Cond Res 30(7):1805–1812.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). *Dose-response relationship between weekly resistance training volume and increases in muscle mass.* J Sports Sci 35(11):1073–1082.
