# Interactive Madness Table: piano di implementazione

Un lanciatore scenografico per qualsiasi tabella delle follie, con editor per il DM e schermo per i giocatori. Nasce da "Follie", la tabella custom di una vecchia campagna, e diventa un tool pubblicabile sotto ToolsmithDev.

Stato: approvato il 2026-10-03.

## Decisioni prese

| Tema | Decisione |
|---|---|
| Nome | Interactive Madness Table. Nessun riferimento a "Eldritch Hunt", che era il nome della vecchia campagna. |
| Testo delle tabelle | È una reimmaginazione personale dell'autore. Si usano le 40 follie attuali come valori di default, tradotte in inglese, con lo stile ritoccato e passate dalla skill humanizer. Se servirà, si cambieranno in futuro. |
| Streaming | Lo schermo giocatori è una seconda finestra dello stesso browser. Va su TV o secondo monitor; online il DM la condivide su Discord. |
| Stack | Vite, React, TypeScript e Zustand, come in The Temple of Time. Build statico, nessun server. |
| Repo | Nuova: `EOSgithub/interactive-madness-table`, privata durante lo sviluppo. La vecchia `Follie` resta come sorgente del testo. |

## Cosa deve fare

1. Lanciare su qualsiasi tabella delle follie, con una messa in scena che i giocatori ricordano.
2. Lasciare al DM la modifica di ogni voce.
3. Avere un interruttore per aggiungere o togliere il secondo tiro (le sottocategorie dopo il d100).
4. Essere tutto in inglese.
5. Avere uno schermo giocatori separato.
6. Avere una sezione Settings per accendere, spegnere e scegliere le animazioni.
7. Permettere di legare a un singolo risultato un'animazione o un contenuto proprio: audio, immagine in dissolvenza, video.
8. Portare il marchio ToolsmithDev e il link a Patreon.

## Architettura

### Modello dei dati

```
TableSet
  name
  categories[]              di default: short-term, long-term, indefinite
    id, label, blurb, icon
    duration                testo fisso, oppure dado e unità ("1d4 minutes")
    die                     di default 100
    subRoll                 interruttore: secondo tiro sì o no
    subDie                  di default 10
    entries[]
      id
      range [da, a]
      title, description
      text                  l'effetto, usato se subRoll è spento
      outcomes[]            usati se subRoll è acceso
        id
        range [da, a]
        kind                boon, neutral, bane
        text
        staging?            messa in scena propria di questo esito
      staging?              messa in scena propria di questa voce

Staging
  animation?                quale animazione usare al posto di quella scelta in Settings
  image?                    id di un file caricato; compare in dissolvenza
  video?                    id di un file caricato; parte a schermo intero
  audio?                    id di un file caricato; parte al verdetto
  volume, loop
```

L'interruttore del secondo tiro sta sulla categoria. Quando è spento, dopo il primo tiro si va direttamente al verdetto.

Controlli: gli intervalli di una tabella devono coprire tutto il dado senza buchi e senza sovrapposizioni. L'editor lo segnala mentre si scrive e impedisce di giocare su una tabella rotta.

### Salvataggio

- Tabelle e impostazioni: `localStorage`, a ogni modifica.
- File caricati dal DM (audio, immagini, video): IndexedDB, perché `localStorage` non regge file grandi. La finestra giocatori è sulla stessa origine e legge gli stessi file.
- Esporta e importa: un file JSON con tabelle e impostazioni. I file caricati non entrano nel JSON; un pacchetto unico con i media viene dopo la prima versione.
- "Ripristina i valori di default" per le tabelle e, separato, per le impostazioni.

### Schermate

- DM, scheda Play: scelta della categoria, tiro (dall'app o inserito a mano), verdetto, storico dei tiri della sessione, comandi per lo schermo giocatori.
- DM, scheda Edit: categorie e voci, modifica di ogni campo, aggiunta e rimozione, interruttore del secondo tiro, import ed export.
- DM, scheda Stage: per ogni voce o esito, la messa in scena propria. È il menu sul modello di "Prepara" di The Temple of Time: si carica un file, lo si prova, lo si assegna.
- DM, scheda Settings: vedi sotto.
- Giocatori (`/display.html`): solo la messa in scena, a schermo intero, senza comandi.

### Settings

- Animazioni: accese o spente. Spente, ogni passaggio è una dissolvenza.
- Stile dell'animazione del tiro, da scegliere tra più tipi. Nella prima versione: Ratchet (tamburo a scatti), Glitch (corruzione dei glifi) e Plain (conteggio semplice).
- Stile della comparsa del verdetto: Tear (strappo), Fade, Burn.
- Intensità: grana, vignettatura, scossa della camera, ognuna con il suo interruttore.
- Velocità: lenta, normale, rapida.
- Audio: volume generale e interruttore.
- Rispetta "riduci movimento" del sistema: acceso di default.
- Anteprima: ogni scelta si prova sul posto, senza fare un tiro vero.

Ordine di precedenza: la messa in scena di un esito vince su quella della voce, che vince sulle scelte di Settings.

### Sincronizzazione

`BroadcastChannel`, come in `src/state/sync.ts` di The Temple of Time: la finestra del DM possiede lo stato e manda allo schermo giocatori solo ciò che i giocatori devono vedere. Lo schermo saluta all'apertura e riceve lo stato corrente. Dei file caricati viaggia solo l'identificativo.

Regola presa dal Reveal di The Temple of Time: ogni animazione è una funzione del tempo trascorso dall'inizio, non una catena di transizioni. Uno schermo aperto in ritardo o ricaricato cade sul fotogramma giusto.

L'audio parte dalla finestra del DM, non dallo schermo giocatori: le casse sono collegate al computer che apre entrambe le finestre, e il DM ha già interagito con la sua pagina, quindi il browser non blocca la riproduzione. Lo schermo giocatori resta muto e mostra solo immagini e video (i video senza la loro traccia audio, che viene riprodotta dalla finestra del DM).

## Messa in scena

Direzione: un rito, non un'interfaccia. Lo schermo giocatori è buio, con grana e vignettatura, e la camera non sta mai del tutto ferma.

Tecniche già usate in The Temple of Time e da riprendere:

- Tamburo a scatti per i numeri, con arretramento, caduta, rimbalzo e assestamento.
- Corruzione dei glifi: il titolo compare come testo corrotto che si ricompone.
- Raffiche di glitch brevi e sempre più fitte, con pause in mezzo.
- Rumore deterministico: DM e giocatori vedono lo stesso identico effetto.
- Spinta lenta della camera e scossa sugli impatti.

Sequenza del tiro:

1. Scelta della categoria: le carte, quella scelta resta e le altre si spengono.
2. Il primo dado gira, rallenta, si inceppa e si ferma.
3. Il titolo della follia emerge dal rumore.
4. Se c'è il secondo tiro: il secondo dado, più rapido.
5. Verdetto: il colore dice l'esito prima del testo (oro per il dono, cremisi per la maledizione). Qui partono immagine, video e audio propri del risultato, se ci sono.

Il DM può sempre saltare l'animazione o inserire il risultato a mano.

L'identità visiva di Follie (nero, oro, cremisi) resta: è lo stile del tool, come Standee Maker ha il suo. Per interfaccia e animazioni si usa la skill `design-taste-frontend` al momento dell'implementazione.

## Contenuti di default

Le 40 follie di Follie, con i loro 120 esiti, in inglese. Il lavoro: tradurre, ritoccare lo stile per renderlo più personale, passare tutto dalla skill humanizer mantenendo il tono. I nomi delle regole (condizioni, tipi di danno, tiri salvezza) usano i termini inglesi di D&D.

Nel progetto il testo italiano di partenza sta in `source/follie.it.json`, già convertito nel modello nuovo, e non viene pubblicato con il sito.

## Marchio e rifiniture

- Piè di pagina "A ToolsmithDev tool" con link a Patreon, solo nella finestra del DM.
- Favicon e immagine di anteprima per i link condivisi.
- Font inclusi nel progetto (`@fontsource`), niente chiamate a Google Fonts.
- Scorciatoie da tastiera per il DM.
- Prova su telefono e tablet per la finestra del DM.
- README in inglese, licenza, crediti dei font.

## Pubblicazione

- Build statico su GitHub Pages, con una GitHub Action. Sul piano gratuito di GitHub, Pages richiede una repo pubblica: la repo diventa pubblica al momento dell'uscita.
- Anteprima per i membri del tier da 3 $: un sito statico non si può riservare a chi paga. Si dà ai Beta Tester il link una settimana prima, in un post riservato.

## Fasi

| Fase | Contenuto | Verifica |
|---|---|---|
| 1 | Progetto Vite, modello dei dati, conversione delle tabelle di Follie, controlli sugli intervalli | Test su intervalli e ricerca della voce |
| 2 | Percorso di gioco del DM in inglese, con secondo tiro attivabile e storico | Prova a mano nel browser |
| 3 | Editor completo, salvataggio, import ed export | Modifica, ricarica, esporta e reimporta |
| 4 | Schermo giocatori e sincronizzazione | Due finestre, apertura in ritardo, ricarica |
| 5 | Messa in scena: motore a tempo, stili del tiro e del verdetto | Prova a mano e con "riduci movimento" |
| 6 | Settings: interruttori, scelta degli stili, anteprime | Ogni combinazione provata sullo schermo giocatori |
| 7 | Stage: file caricati (IndexedDB), messa in scena per voce ed esito | Audio, immagine e video su un tiro vero |
| 8 | Contenuti di default in inglese | Lettura completa, humanizer |
| 9 | Uso da cellulare: finestra del DM, editor e schermo giocatori su schermi piccoli | Prova su telefono vero, in verticale e in orizzontale |
| 10 | Marchio, rifiniture, README | Sito aperto da un altro dispositivo |

Le fasi 1-4 danno un tool funzionante. La 5 lo rende riconoscibile, ed è la più lunga. La 6 e la 7 sono le richieste aggiunte il 2026-10-03.

## Uso da cellulare

Richiesto il 2026-10-03. Il tool deve funzionare bene anche su telefono, non solo adattarsi.

- Finestra del DM: bersagli da toccare di almeno 44 px, tiro raggiungibile con il pollice, storico in fondo o in un pannello a scomparsa, tastiera numerica per i tiri inseriti a mano.
- Editor: una colonna, voci ed esiti impilati, campi degli intervalli comodi da toccare, niente griglie a più colonne sotto i 600 px.
- Schermo giocatori: su un telefono in mano ai giocatori il testo deve stare nello schermo senza tagli, in verticale e in orizzontale. Niente "premi F": un tocco per lo schermo intero.
- Un solo schermo: su telefono non c'è un secondo monitor, quindi la finestra del DM ha la "Table mode", che mostra la vista dei giocatori sullo stesso schermo con una barra di comandi sotto. Va bene per un telefono o tablet appoggiato al tavolo, o duplicato su una TV. Il collegamento remoto tra dispositivi diversi resta fuori dalla prima versione.
- Prestazioni: grana e animazioni provate su un telefono di fascia media; se scattano, si alleggeriscono in automatico.

## Effetto del dado nella finestra del DM

Aggiunto il 2026-10-03, ripreso da Follie: al clic su Roll i numeri girano e tremano in cremisi, poi il risultato si illumina e resta un attimo prima di passare oltre. È un'opzione ("Dice effect in this window"), accesa di default e salvata. In Settings (fase 6) andrà insieme alle altre scelte.

## Pubblicazione di prova

Il sito è su GitHub Pages dal ramo `gh-pages`, aggiornato con `npm run deploy`. La repo è pubblica dal 2026-10-03.

## Fuori dalla prima versione

- Link remoto che i giocatori aprono dal proprio dispositivo.
- Pacchetto unico di esportazione con dentro anche audio, immagini e video.
- Più raccolte di tabelle affiancate, o tabelle che non riguardano la follia.
- Italiano come seconda lingua dell'interfaccia.

## UI/UX overhaul (branch `uix-overhaul`, 2026-10-03)

Written in English, like everything produced from now on.

Direction: a hunter's night, after Bloodborne. Cold near-black surfaces, moonlight for text, blood as the only accent, square corners, Cormorant Garamond for display and EB Garamond for text. This replaces the black, gold and crimson identity carried over from Follie. All colours, fonts and layers are in `src/styles/tokens.css`. The theme is dark only, on purpose.

What changed:

- The die is a moon. It reddens a little with every verdict of the session ("Insight", shown in the header) and turns to blood on a bane.
- Every verdict gets a banner ("Bane Inflicted", "Boon Granted", "Madness Manifest", or "Madness Takes Hold" when there is no second roll). The text waits until the banner leaves. Before, the verdict styles only ran when there was a second roll.
- `src/display/atmosphere.ts` paints ash, blood and light on a canvas, as a pure function of time and seed, like `show.ts`.
- The DM window has a monitor: the player view itself, live. It replaces the old dice effect. Settings and Stage use it for previews, so they no longer need the player screen open.
- The clock of the show only runs while frames are drawn (`advance` in `show.ts`). A hidden player screen used to miss the whole show, because the browser stops drawing it and the show was timed by the wall clock. Now it waits and resumes. The player screen reports its visibility and the DM window shows it.
- Replay and Skip restamp `stepAt` for every window.
- Several table sets: `src/shared/library.ts`, saved under `sets` and `activeId` (storage version 3, the single set of version 2 becomes the first). Import adds a set and no longer overwrites.
- The player view is sized in container units, so it looks the same in the monitor and on a TV.
- Interface motion uses Motion (`motion/react`) and follows the system's reduced motion setting. Icons are Phosphor.

This closes "Più raccolte di tabelle affiancate" from the list above.

### Second pass, same day

The first pass read as a home project: a page with a header and a legal footer, flat cold colours, square boxes with hairlines. The second pass keeps the show and rebuilds the rest.

- Structure: an app shell. A rail on the left for the four sections (a bar along the bottom on a phone), a top bar with the open set and the state of the player screen, and every section built from cards.
- The footer is gone. ToolsmithDev, Patreon and the licences (SRD 5.1, fonts, icons) are in the About dialog, opened from the rail.
- Palette: gaslight. Warm near-black with a trace of oxblood, bone for text, blood as the accent, candlelight for a boon. Gold for the boon and crimson for the bane is what this plan asked for from the start.
- Type: Bodoni Moda for headings (Didone was the printing style of the nineteenth century), Geist for controls, EB Garamond for text read aloud.
- Shape: soft. Cards 20px, controls 12px, chips and switches fully round. No coloured stripe down the side of a card: the kind of a verdict is a tint and a chip.
- Play: the monitor with the session under it on the left, the roll in a card that stays in view on the right.

### Third pass, same day

- The accent is gold, as in Follie. Blood is no longer an accent: it means a bane, a fault or a delete.
- The moon has a real face: `src/assets/moon.webp`, the near side of the Moon from NASA's Lunar Reconnaissance Orbiter (public domain, from Wikimedia Commons, `Moon_nearside_LRO.jpg`), multiplied over the disc at part strength.
- The three verdict styles are now told apart at a glance. Flash strikes the screen with light and slams the words down. Burn sears them in from left to right and leaves an ember glow. Fade brings them up slowly with nothing else. Picking a style in Settings plays it on the monitor at once.
- Gone: the ToolsmithDev mark in the rail (it is in About), the line of keys under the roll (the keys still work and are listed in the README), and the Insight counter with the reddening of the moon over the session.
- Blackout is a button that stays pressed.

## Themes (branch `themes`, 2026-10-06)

- Every table set has a theme: Cosmic, Gothic, Surreal, Occult or Societal (`src/shared/themes.ts`, `theme` on `TableSet`, Gothic when missing). It is picked in Edit, under the name of the set.
- A theme changes the DM window and the player screen. Colours, heading face and radii are in `src/styles/themes.css`, switched with `data-theme`; the colour tokens are now named for what they do (`--accent`, `--bane`, `--boon`). The emblem under the die and the air painted by `atmosphere.ts` change too, and so do the words of the verdict banner.
- The default set is now "Bloodborne Madness", with the Gothic theme. Four more default sets ship beside it, one for each other theme (`src/content/themed.en.json`). Each is one d100 table with no second roll.
- On a table with no second roll the effect is part of the entry. The player screen shows the description under the title and the effect after the banner, and Play no longer offers the "Second roll" switch for a table that has no outcomes.
- Storage version 4: a saved "Madness Tables" set is renamed, the four new defaults are added to the library, and the session log is dropped.
- Gone: the choice of verdict animation (the verdict always uses Flash), the list of this session's verdicts, and the Blackout button with its `B` key.
- The browser tab uses the tool's own icon, `public/favicon.svg`. The ToolsmithDev icon stays in About and in the link preview.

### Second pass, same day

- A sixth theme, Hellenic, with its own default set: ten madnesses from Greek epic and tragedy.
- The fifty entries of the five one-roll sets were rewritten with the humanizer skill. No default table names a DC any more, Bloodborne Madness included: a roll that needs a threshold is a plain die, and a saving throw is left to the GM. `build-defaults.py` and a test both refuse a DC.
- Cosmic has a real corona behind the die (`src/assets/eclipse.webp`, NASA/Carla Thomas, 2017). Surreal has Redon's eye balloon drifting up the left of the stage (`src/assets/eye-balloon.webp`). Both are public domain and stored with their black cut away, because the camera layer is its own stacking context and a blend mode would only blend inside it.
- The top bar runs the whole width of the window. Before, it stopped at the 1520px of the content.
- The buttons of the sets dialog sit in a two-column grid.

### Third pass, same day

- Surreal: Redon's eye balloon is the emblem itself, with the number in the dark of the eye. The pink shape is gone.
- Hellenic: the disc is a gorgon from an Attic cup (`src/assets/gorgon.webp`, public domain). No god is named in the table: each goes by a title, and a test checks it.

### Fourth pass, same day

- The Gothic default set is "Gothic Madness". "Bloodborne Madness" carried someone else's trademark, so it is gone from the tool. Storage version 5 renames a saved set that still has the old name.
