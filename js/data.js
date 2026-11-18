/* LEVA 2.0 — Dati: muscoli, attrezzatura, esercizi, schede.
   Ogni esercizio (livello) ha un ID stabile: lo storico e la progressione
   fanno riferimento all'ID, quindi nomi e descrizioni si possono cambiare
   senza perdere dati. Non riutilizzare mai un ID per un esercizio diverso. */
'use strict';

const MUSCLES = {
  pet: 'Pettorali', dor: 'Dorsali', spa: 'Spalle', bic: 'Bicipiti', tri: 'Tricipiti',
  qua: 'Quadricipiti', fem: 'Femorali', glu: 'Glutei', pol: 'Polpacci', core: 'Core'
};
const MUSCLE_ORDER = ['pet', 'dor', 'spa', 'bic', 'tri', 'qua', 'fem', 'glu', 'pol', 'core'];

const EQUIP = {
  band: { n: 'Elastico', d: 'Elastico di resistenza (anche ancorato a una porta chiusa a chiave)' },
  backpack: { n: 'Zaino con peso', d: 'Zaino robusto caricato con libri o bottiglie (5–15 kg)' },
  chair: { n: 'Sedia stabile', d: 'Sedia senza ruote, appoggiata al muro, che non scivola' },
  table: { n: 'Tavolo robusto', d: 'Tavolo pesante che non si ribalta: provalo prima tirando piano' },
  sofa: { n: 'Divano o mobile pesante', d: 'Per bloccare i piedi o appoggiare la schiena' },
  step: { n: 'Gradino', d: 'Un gradino delle scale o un rialzo stabile' },
  bar: { n: 'Sbarra per trazioni', d: 'Sbarra fissata a muro o porta, montata secondo le istruzioni' }
};
const EQUIP_ORDER = ['band', 'backpack', 'chair', 'table', 'sofa', 'step', 'bar'];

const STRESS = { spalle: 'Spalle', polsi: 'Polsi', ginocchia: 'Ginocchia', schiena: 'Schiena bassa' };

const LEVELS = { beg: 'Principiante', int: 'Intermedio', adv: 'Avanzato' };
const GOALS = {
  hyp: { n: 'Massa muscolare', d: 'Ipertrofia: 8–15 ripetizioni, recuperi medi' },
  str: { n: 'Forza', d: 'Varianti più dure, meno ripetizioni, recuperi lunghi' },
  end: { n: 'Resistenza', d: 'Più ripetizioni, recuperi brevi' },
  fit: { n: 'Forma generale', d: 'Un po’ di tutto, sessioni scorrevoli' }
};

/* Scale di progressione. m = muscolo principale, s = secondari, u = 's' se a tempo.
   Ogni livello: id, n (nome), d (descrizione), how (esecuzione), err (errori comuni),
   eq (attrezzatura), r (range consigliato, se diverso dalla scheda), st (zone sollecitate). */
const LADDERS = {
  push_h: { name: 'Piegamenti', m: 'pet', s: ['tri', 'spa'], lv: [
    { id: 'ph_incline', n: 'Piegamenti inclinati', eq: ['chair'], d: 'Mani sul bordo di una sedia appoggiata al muro: meno carico rispetto ai piegamenti a terra.',
      how: ['Sedia contro il muro, mani sul bordo alla larghezza delle spalle.', 'Corpo dritto dai talloni alla testa.', 'Scendi finché il petto sfiora il bordo, poi spingi.'], err: ['Sedere alto o bacino che cade.', 'Gomiti aperti a 90° dal busto.'] },
    { id: 'ph_classic', n: 'Piegamenti classici', eq: [], d: 'Mani poco più larghe delle spalle, corpo dritto come una tavola. Scendi finché il petto è a un pugno da terra.',
      how: ['Mani sotto le spalle, dita aperte.', 'Addome e glutei contratti.', 'Scendi in 2 secondi, gomiti a circa 45° dal busto, e spingi.'], err: ['Testa che anticipa il petto.', 'Movimento a metà: scendi fino in fondo.'] },
    { id: 'ph_decline', n: 'Piegamenti a piedi rialzati', eq: ['chair'], d: 'Piedi su una sedia, mani a terra. Più sono alti i piedi, più lavorano spalle e petto alto.',
      how: ['Punte dei piedi sulla sedia, mani a terra.', 'Corpo in linea, senza inarcare la schiena.', 'Porta il petto verso terra e spingi.'], err: ['Bacino che cede verso il basso.', 'Sedia instabile: appoggiala al muro.'] },
    { id: 'ph_band', n: 'Piegamenti con elastico', eq: ['band'], d: 'Elastico dietro la schiena, estremità bloccate sotto le mani. In alternativa uno zaino carico sulla schiena.',
      how: ['Passa l’elastico dietro le scapole.', 'Blocca le estremità sotto i palmi.', 'Esegui piegamenti completi: la resistenza aumenta in alto.'], err: ['Elastico che scivola sul collo.', 'Accorciare il movimento in alto.'] },
    { id: 'ph_archer', n: 'Piegamenti ad arciere', eq: [], st: ['spalle'], d: 'Mani molto larghe: scendi verso un lato tenendo l’altro braccio quasi teso. Alterna i lati.',
      how: ['Mani molto più larghe delle spalle.', 'Scendi verso una mano, l’altro braccio resta quasi teso.', 'Risali e alterna il lato.'], err: ['Ruotare il busto.', 'Piegare entrambe le braccia allo stesso modo.'] },
    { id: 'ph_pseudo', pre: 'Almeno 3 serie da 12 piegamenti ad arciere per lato e polsi senza fastidi.', n: 'Pseudo-planche', eq: [], st: ['polsi', 'spalle'], d: 'Mani all’altezza della vita con le dita verso i piedi, spalle spostate in avanti oltre le mani.',
      how: ['Mani all’altezza dell’ombelico, dita ruotate verso i piedi.', 'Sposta le spalle davanti alle mani.', 'Scendi mantenendo l’inclinazione in avanti.'], err: ['Perdere l’inclinazione in avanti.', 'Forzare con polsi non riscaldati.'] } ] },

  push_v: { name: 'Spinta verticale', m: 'spa', s: ['tri'], lv: [
    { id: 'pv_pike', n: 'Pike push-up', eq: [], d: 'Bacino in alto, corpo a V rovesciata. Piega le braccia portando la testa davanti alle mani.',
      how: ['Mani a terra, bacino alto, gambe il più tese possibile.', 'Piega i gomiti e porta la testa a terra davanti alle mani.', 'Spingi tornando alla V.'], err: ['Gomiti che si aprono troppo.', 'Abbassare il bacino durante la discesa.'] },
    { id: 'pv_pike_elev', n: 'Pike a piedi rialzati', eq: ['chair'], d: 'Come il pike, ma con i piedi su una sedia: il busto è più verticale e il carico sulle spalle aumenta.',
      how: ['Piedi sulla sedia, mani a terra vicino alla sedia.', 'Busto il più verticale possibile.', 'Scendi con la testa davanti alle mani e spingi.'], err: ['Mani troppo lontane dalla sedia.', 'Sedia che scivola.'] },
    { id: 'pv_wall_hold', pre: 'Almeno 3 serie da 10 pike a piedi rialzati e spalle senza fastidi. Impara prima a scendere dalla verticale ruotando di lato.', n: 'Verticale al muro', eq: [], u: 's', r: [20, 45], st: ['spalle', 'polsi'], d: 'Pancia verso il muro, braccia tese, corpo dritto. Tieni la posizione.',
      how: ['Piedi contro il muro, cammina con le mani verso il muro.', 'Braccia tese, spalle spinte verso le orecchie.', 'Tieni, poi scendi camminando con le mani.'], err: ['Schiena molto inarcata.', 'Salire senza sapere come scendere: prova prima con poca inclinazione.'] },
    { id: 'pv_hspu_neg', pre: 'Tenere 45 secondi di verticale al muro, con il corpo dritto.', n: 'Piegamenti in verticale, negativi', eq: [], r: [3, 6], st: ['spalle', 'polsi'], d: 'In verticale al muro scendi in 4–5 secondi fino a sfiorare il pavimento con la testa, poi rientra.',
      how: ['Cuscino sotto la testa.', 'Scendi in 4–5 secondi.', 'Esci dalla posizione e risali in verticale.'], err: ['Cadere di colpo sulla testa.', 'Gomiti completamente aperti.'] },
    { id: 'pv_hspu', pre: 'Almeno 3 serie da 5 negativi controllati in 5 secondi.', n: 'Piegamenti in verticale', eq: [], r: [3, 8], st: ['spalle', 'polsi'], d: 'In verticale al muro: scendi controllato e spingi fino a braccia tese.',
      how: ['Cuscino sotto la testa.', 'Scendi controllato fino a sfiorarlo.', 'Spingi fino a braccia tese.'], err: ['Rimbalzare con la testa.', 'Perdere l’allineamento del corpo.'] } ] },

  row: { name: 'Rematore inverso', m: 'dor', s: ['bic', 'spa'], lv: [
    { id: 'rt_knee', n: 'Rematore al tavolo, ginocchia piegate', eq: ['table'], d: 'Sdraiato sotto un tavolo pesante e stabile, mani sul bordo. Tira il petto al bordo stringendo le scapole.',
      how: ['Verifica che il tavolo non si sollevi tirando piano.', 'Sdraiati sotto, mani sul bordo, ginocchia piegate.', 'Tira il petto al bordo e scendi in 2 secondi.'], err: ['Usare un tavolo leggero o pieghevole.', 'Tirare con le braccia senza stringere le scapole.'] },
    { id: 'rt_straight', n: 'Rematore al tavolo, gambe tese', eq: ['table'], d: 'Come prima ma con le gambe tese: corpo dritto dai talloni alle spalle.',
      how: ['Gambe tese, talloni a terra.', 'Corpo rigido come in un plank.', 'Petto al bordo, pausa breve, discesa lenta.'], err: ['Bacino che cede.', 'Collo proteso in avanti.'] },
    { id: 'rt_elev', n: 'Rematore al tavolo, piedi rialzati', eq: ['table', 'chair'], d: 'Piedi su una sedia, corpo orizzontale. Tira fino a toccare il bordo con il petto.',
      how: ['Talloni sulla sedia.', 'Corpo orizzontale e rigido.', 'Tira il petto al bordo.'], err: ['Sedia troppo lontana.', 'Movimento parziale.'] },
    { id: 'rt_pause', n: 'Rematore al tavolo, pausa 2 s', eq: ['table'], d: 'Gambe tese o piedi rialzati: in alto tieni 2 secondi con le scapole strette.',
      how: ['Come il rematore a gambe tese.', 'In alto tieni 2 secondi.', 'Scendi in 3 secondi.'], err: ['Accorciare la pausa.', 'Scendere di colpo.'] },
    { id: 'rt_one', n: 'Rematore a un braccio, assistito', eq: ['table'], d: 'Tira con un braccio, l’altro aiuta il minimo indispensabile sul bordo.',
      how: ['Una mano sul bordo, l’altra appoggiata leggera.', 'Tira col braccio principale.', 'Alterna il lato a ogni serie.'], err: ['Ruotare il busto.', 'Usare troppo il braccio di aiuto.'] } ] },

  row_bp: { name: 'Rematore con zaino', m: 'dor', s: ['bic'], lv: [
    { id: 'rb_two', n: 'Rematore con zaino a busto flesso', eq: ['backpack'], st: ['schiena'], r: [10, 15], d: 'Zaino tenuto per le spallacce, busto inclinato in avanti con la schiena dritta. Tira lo zaino all’ombelico.',
      how: ['Ginocchia morbide, busto a circa 45°, schiena neutra.', 'Tira lo zaino verso l’ombelico stringendo le scapole.', 'Scendi in 2 secondi.'], err: ['Schiena arrotondata.', 'Slanciare con il busto.'] },
    { id: 'rb_one', n: 'Rematore a un braccio con zaino', eq: ['backpack', 'chair'], r: [10, 15], d: 'Una mano e un ginocchio sulla sedia, l’altra mano tira lo zaino verso il fianco.',
      how: ['Mano e ginocchio sulla sedia, schiena parallela al pavimento.', 'Tira il gomito verso il fianco.', 'Discesa controllata, alterna i lati.'], err: ['Ruotare il busto per tirare.', 'Sedia che si muove: appoggiala al muro.'] },
    { id: 'rb_pause', n: 'Rematore a un braccio, pausa 2 s', eq: ['backpack', 'chair'], r: [8, 12], d: 'Come il rematore a un braccio, con 2 secondi di tenuta in alto e discesa in 3 secondi.',
      how: ['Posizione come il rematore a un braccio.', 'In alto tieni 2 secondi.', 'Scendi in 3 secondi.'], err: ['Saltare la pausa.', 'Alzare la spalla verso l’orecchio.'] } ] },

  squat: { name: 'Squat', m: 'qua', s: ['glu'], lv: [
    { id: 'sq_bw', n: 'Squat a corpo libero', eq: [], d: 'Piedi alla larghezza delle spalle, scendi sotto il parallelo con il busto alto.',
      how: ['Piedi alla larghezza delle spalle, punte leggermente aperte.', 'Scendi spingendo indietro il bacino, ginocchia in linea con le punte.', 'Risali spingendo con tutto il piede.'], err: ['Talloni che si sollevano.', 'Ginocchia che cadono verso l’interno.'] },
    { id: 'sq_split', n: 'Squat divaricato', eq: [], d: 'Un piede avanti e uno indietro: scendi con il ginocchio posteriore verso terra.',
      how: ['Passo lungo, busto dritto.', 'Scendi in verticale finché il ginocchio dietro sfiora terra.', 'Spingi col piede davanti.'], err: ['Passo troppo corto.', 'Ginocchio davanti che crolla verso l’interno.'] },
    { id: 'sq_bulg', n: 'Squat bulgaro', eq: ['chair'], d: 'Piede posteriore su una sedia. Scendi portando il ginocchio dietro verso terra, spingi col tallone davanti.',
      how: ['Collo del piede dietro sulla sedia.', 'Scendi in verticale, busto leggermente inclinato.', 'Spingi col tallone del piede davanti.'], err: ['Piede davanti troppo vicino alla sedia.', 'Perdere l’equilibrio: tieniti a un muro all’inizio.'] },
    { id: 'sq_bulg_bp', n: 'Squat bulgaro con zaino', eq: ['chair', 'backpack'], d: 'Come il bulgaro, con uno zaino carico (5–15 kg) in spalla.',
      how: ['Zaino ben stretto in spalla.', 'Esegui il bulgaro con la stessa tecnica.', 'Aumenta il peso dello zaino a piccoli passi.'], err: ['Zaino che dondola.', 'Rimbalzare in basso.'] },
    { id: 'sq_pistol_box', n: 'Pistol squat su sedia', eq: ['chair'], st: ['ginocchia'], d: 'Su una gamba, l’altra tesa in avanti. Siediti lentamente sulla sedia e rialzati senza slancio.',
      how: ['Davanti alla sedia, su una gamba.', 'Siediti in 3 secondi.', 'Rialzati senza slancio.'], err: ['Cadere sulla sedia.', 'Ginocchio che va verso l’interno.'] },
    { id: 'sq_pistol', pre: 'Almeno 3 serie da 8 pistol squat su sedia per gamba, senza slancio.', n: 'Pistol squat', eq: [], st: ['ginocchia'], d: 'Squat completo su una gamba sola, senza appoggi. Discesa controllata.',
      how: ['Braccia avanti per bilanciare.', 'Scendi fino in fondo su una gamba.', 'Risali senza slancio.'], err: ['Tallone che si solleva.', 'Schiena che collassa in basso.'] } ] },

  squat_tempo: { name: 'Squat lento', m: 'qua', s: ['glu'], lv: [
    { id: 'st_bw', n: 'Squat con discesa in 3 s', eq: [], d: 'Squat a corpo libero con discesa lenta di 3 secondi e risalita decisa.',
      how: ['Posizione dello squat classico.', 'Scendi contando 3 secondi.', 'Risali deciso.'], err: ['Accelerare a metà discesa.', 'Fermarsi sopra il parallelo.'] },
    { id: 'st_bp', n: 'Squat con zaino, discesa in 3 s', eq: ['backpack'], d: 'Zaino carico davanti al petto o in spalla. Scendi in 3 secondi sotto il parallelo, risali deciso.',
      how: ['Abbraccia lo zaino davanti al petto.', 'Scendi in 3 secondi sotto il parallelo.', 'Risali deciso.'], err: ['Busto che crolla in avanti.', 'Talloni che si alzano.'] } ] },

  lunge: { name: 'Affondi', m: 'qua', s: ['glu'], lv: [
    { id: 'ln_bw', n: 'Affondi indietro', eq: [], d: 'Fai un passo indietro e porta il ginocchio posteriore verso terra, busto dritto.',
      how: ['In piedi, piedi uniti.', 'Passo indietro, scendi in verticale.', 'Torna spingendo col piede davanti.'], err: ['Ginocchio che sbatte a terra.', 'Busto che si piega in avanti.'] },
    { id: 'ln_bp', n: 'Affondi indietro con zaino', eq: ['backpack'], d: 'Zaino carico in spalla. Fai un passo indietro e porta il ginocchio posteriore verso terra, busto dritto.',
      how: ['Zaino ben stretto in spalla.', 'Passo indietro, scendi controllato.', 'Alterna o completa un lato alla volta.'], err: ['Passo troppo corto.', 'Perdere l’equilibrio laterale.'] },
    { id: 'ln_def', n: 'Affondi in deficit con zaino', eq: ['backpack', 'step'], d: 'Piede davanti su un gradino: l’escursione aumenta e i glutei lavorano di più.',
      how: ['Piede davanti sul gradino.', 'Passo indietro e scendi più in basso del solito.', 'Risali spingendo col piede sul gradino.'], err: ['Gradino instabile.', 'Rimbalzare in basso.'] } ] },

  hinge: { name: 'Femorali e glutei', m: 'fem', s: ['glu'], lv: [
    { id: 'hg_bridge', n: 'Ponte glutei', eq: [], m: 'glu', s: ['fem'], d: 'Supino, piedi a terra. Spingi il bacino in alto e stringi i glutei per 1 secondo.',
      how: ['Supino, piedi vicini ai glutei.', 'Spingi coi talloni e solleva il bacino.', 'Stringi i glutei 1 secondo in alto.'], err: ['Inarcare la zona lombare.', 'Spingere con le punte.'] },
    { id: 'hg_ht1', n: 'Hip thrust su una gamba', eq: ['sofa'], m: 'glu', s: ['fem'], d: 'Schiena appoggiata al bordo del divano, un piede a terra. Spingi col tallone fino ad allineare busto e coscia.',
      how: ['Scapole sul bordo del divano.', 'Un piede a terra, l’altra gamba sollevata.', 'Spingi col tallone fino all’allineamento.'], err: ['Bacino che ruota.', 'Collo in iperestensione.'] },
    { id: 'hg_slide', n: 'Leg curl scivolato', eq: [], d: 'Supino, talloni su un asciugamano sul pavimento liscio. Alza il bacino e porta i talloni verso i glutei.',
      how: ['Talloni su un asciugamano, pavimento liscio.', 'Solleva il bacino.', 'Avvicina i talloni e allontanali lentamente.'], err: ['Bacino che scende.', 'Usare un tappeto che non scivola.'] },
    { id: 'hg_nordic_neg', n: 'Nordic curl negativo', eq: ['sofa'], r: [4, 8], st: ['ginocchia'], d: 'In ginocchio su un cuscino, caviglie bloccate sotto il divano. Scendi in avanti il più lentamente possibile, frena con le mani.',
      how: ['Cuscino sotto le ginocchia, caviglie bloccate.', 'Corpo dritto dalle ginocchia alla testa.', 'Scendi lentissimo e frena con le mani.'], err: ['Piegarsi ai fianchi.', 'Mobile che si sposta: deve essere pesante.'] },
    { id: 'hg_nordic_assist', n: 'Nordic curl con spinta delle mani', eq: ['sofa'], r: [4, 8], st: ['ginocchia'], d: 'Scendi lento e risali spingendo con le mani il minimo indispensabile.',
      how: ['Come il negativo.', 'In basso dai una piccola spinta con le mani.', 'Risali usando i femorali.'], err: ['Spinta troppo forte.', 'Fianchi piegati.'] },
    { id: 'hg_nordic', pre: 'Almeno 3 serie da 6 nordic con spinta minima delle mani.', n: 'Nordic curl completo', eq: ['sofa'], r: [3, 6], st: ['ginocchia'], d: 'Scendi e risali usando solo i femorali.',
      how: ['Caviglie ben bloccate.', 'Scendi controllato.', 'Risali senza aiuto delle mani.'], err: ['Piegarsi ai fianchi per barare.', 'Allenarlo con i femorali già stanchi.'] } ] },

  glute_single: { name: 'Glutei', m: 'glu', s: ['fem'], lv: [
    { id: 'gs_bridge1', n: 'Ponte glutei su una gamba', eq: [], d: 'Supino, un piede a terra e l’altra gamba tesa. Spingi col tallone e stringi i glutei in alto per 1 secondo.',
      how: ['Supino, un piede a terra.', 'Spingi col tallone e solleva il bacino.', 'Tieni 1 secondo e scendi lento.'], err: ['Bacino che ruota da un lato.', 'Spingere con la schiena.'] } ] },

  core: { name: 'Core', m: 'core', s: [], u: 's', lv: [
    { id: 'co_plank', n: 'Plank', eq: [], r: [30, 60], d: 'Avambracci a terra, corpo dritto, glutei e addome contratti. Non far cadere il bacino.',
      how: ['Gomiti sotto le spalle.', 'Glutei e addome contratti.', 'Respira, non trattenere il fiato.'], err: ['Bacino che cade o troppo alto.', 'Testa che cade.'] },
    { id: 'co_hollow', n: 'Hollow body hold', eq: [], r: [20, 40], d: 'Supino, zona lombare incollata al pavimento, braccia e gambe tese sollevate da terra.',
      how: ['Supino, lombare a contatto col pavimento.', 'Solleva spalle e gambe tese.', 'Se la schiena si stacca, piega le ginocchia.'], err: ['Lombare che si inarca.', 'Gambe troppo basse.'] },
    { id: 'co_lsit_bent', n: 'L-sit tra due sedie, gambe piegate', eq: ['chair'], r: [10, 30], st: ['polsi'], d: 'Mani su due sedie, braccia tese, spingi giù le spalle e solleva le ginocchia al petto.',
      how: ['Due sedie stabili, una per lato.', 'Braccia tese, spalle basse.', 'Solleva le ginocchia al petto e tieni.'], err: ['Spalle alle orecchie.', 'Sedie che si muovono.'] },
    { id: 'co_lsit_one', n: 'L-sit, una gamba tesa', eq: ['chair'], r: [10, 25], st: ['polsi'], d: 'Come prima, con una gamba tesa in avanti. Alterna a ogni serie.',
      how: ['Posizione come l’L-sit a gambe piegate.', 'Distendi una gamba in avanti.', 'Alterna gamba a ogni serie.'], err: ['Gamba tesa che scende.', 'Gomiti piegati.'] },
    { id: 'co_lsit', pre: 'Tenere 20 secondi di L-sit con una gamba tesa, per lato.', n: 'L-sit completo', eq: ['chair'], r: [10, 30], st: ['polsi'], d: 'Gambe tese parallele al pavimento, braccia tese.',
      how: ['Braccia tese, spalle spinte in basso.', 'Gambe tese e unite.', 'Tieni senza dondolare.'], err: ['Gambe che cadono.', 'Schiena tonda.'] } ] },

  pull: { name: 'Trazioni', m: 'dor', s: ['bic'], lv: [
    { id: 'pu_neg', n: 'Trazioni negative', eq: ['bar'], r: [4, 6], d: 'Sali con un salto fino al mento sopra la sbarra, poi scendi in 5 secondi fino a braccia tese.',
      how: ['Sedia sotto la sbarra per salire.', 'Mento sopra la sbarra.', 'Scendi in 5 secondi fino a braccia tese.'], err: ['Lasciarsi cadere a metà.', 'Saltare giù di colpo.'] },
    { id: 'pu_band', n: 'Trazioni assistite con elastico', eq: ['bar', 'band'], r: [6, 10], d: 'Elastico agganciato alla sbarra, sotto il piede o il ginocchio. Movimento completo.',
      how: ['Aggancia l’elastico alla sbarra.', 'Piede o ginocchio nell’elastico.', 'Da braccia tese al mento sopra la sbarra.'], err: ['Elastico che scivola dal piede.', 'Mezze ripetizioni.'] },
    { id: 'pu_full', n: 'Trazioni complete', eq: ['bar'], r: [4, 8], d: 'Presa prona poco più larga delle spalle, da braccia tese al mento sopra la sbarra.',
      how: ['Presa prona, poco più larga delle spalle.', 'Parti da braccia tese.', 'Tira fino al mento sopra la sbarra.'], err: ['Dondolare.', 'Non distendere le braccia.'] },
    { id: 'pu_bp', n: 'Trazioni con zaino', eq: ['bar', 'backpack'], r: [4, 8], d: 'Come le complete, con uno zaino carico in spalla.',
      how: ['Zaino ben stretto.', 'Tecnica come le trazioni complete.', 'Aumenta il peso gradualmente.'], err: ['Zaino che dondola.', 'Perdere il movimento completo.'] },
    { id: 'pu_archer', n: 'Trazioni ad arciere', eq: ['bar'], r: [3, 6], d: 'Presa larga: tira verso una mano tenendo l’altro braccio quasi teso.',
      how: ['Presa molto larga.', 'Tira verso una mano.', 'Alterna il lato.'], err: ['Piegare entrambe le braccia.', 'Ruotare il corpo.'] } ] },

  chin: { name: 'Chin-up', m: 'dor', s: ['bic'], lv: [
    { id: 'ch_neg', n: 'Chin-up negativi', eq: ['bar'], r: [4, 6], d: 'Presa supina, sali con un salto e scendi in 5 secondi.',
      how: ['Presa supina alla larghezza delle spalle.', 'Sali con un salto.', 'Scendi in 5 secondi.'], err: ['Scendere troppo veloce.', 'Saltare giù di colpo.'] },
    { id: 'ch_band', n: 'Chin-up assistiti con elastico', eq: ['bar', 'band'], r: [6, 10], d: 'Presa supina alla larghezza delle spalle, con l’elastico sotto il piede.',
      how: ['Elastico agganciato alla sbarra.', 'Presa supina.', 'Movimento completo.'], err: ['Mezze ripetizioni.', 'Elastico che scivola.'] },
    { id: 'ch_full', n: 'Chin-up completi', eq: ['bar'], r: [4, 8], d: 'Presa supina, petto verso la sbarra, gomiti verso i fianchi.',
      how: ['Presa supina.', 'Petto verso la sbarra.', 'Gomiti verso i fianchi.'], err: ['Dondolare.', 'Braccia non distese in basso.'] },
    { id: 'ch_bp', n: 'Chin-up con zaino', eq: ['bar', 'backpack'], r: [4, 8], d: 'Come i completi, con uno zaino carico.',
      how: ['Zaino ben stretto.', 'Tecnica come i chin-up completi.', 'Aumenta il peso gradualmente.'], err: ['Zaino che dondola.', 'Movimento parziale.'] } ] },

  hang_core: { name: 'Core alla sbarra', m: 'core', s: [], lv: [
    { id: 'hc_knee', n: 'Alzate delle ginocchia alla sbarra', eq: ['bar'], r: [8, 15], d: 'Appeso, porta le ginocchia al petto senza dondolare e scendi lento.',
      how: ['Appeso a braccia tese.', 'Porta le ginocchia al petto.', 'Scendi lento senza dondolare.'], err: ['Slanciarsi.', 'Movimento troppo veloce.'] },
    { id: 'hc_leg', n: 'Alzate delle gambe tese', eq: ['bar'], r: [6, 12], d: 'Appeso, solleva le gambe tese fino a 90 gradi.',
      how: ['Appeso a braccia tese.', 'Solleva le gambe tese a 90°.', 'Scendi lento.'], err: ['Dondolare.', 'Piegare le ginocchia.'] },
    { id: 'hc_t2b', n: 'Toes to bar', eq: ['bar'], r: [5, 10], d: 'Porta le punte dei piedi a toccare la sbarra, controllando la discesa.',
      how: ['Appeso, spalle attive.', 'Porta le punte alla sbarra.', 'Controlla la discesa.'], err: ['Usare lo slancio.', 'Perdere la presa.'] } ] },

  curl_band: { name: 'Curl con elastico', m: 'bic', s: [], lv: [
    { id: 'cb_curl', n: 'Curl bicipiti con elastico', eq: ['band'], d: 'Elastico sotto i piedi, gomiti fermi ai fianchi. Sali in 1 secondo, scendi in 3.',
      how: ['Elastico sotto i piedi.', 'Gomiti fermi ai fianchi.', 'Sali in 1 secondo, scendi in 3.'], err: ['Gomiti che vanno avanti.', 'Slanciare con la schiena.'] } ] },
  curl_bp: { name: 'Curl con zaino', m: 'bic', s: [], lv: [
    { id: 'cbp_curl', n: 'Curl con zaino', eq: ['backpack'], d: 'Tieni lo zaino per la maniglia o con entrambe le mani sotto. Gomiti fermi, discesa in 3 secondi.',
      how: ['Zaino tenuto davanti, braccia tese.', 'Piega i gomiti senza spostarli.', 'Scendi in 3 secondi.'], err: ['Oscillare col busto.', 'Gomiti che si alzano.'] } ] },
  row_band: { name: 'Rematore con elastico', m: 'dor', s: ['bic', 'spa'], lv: [
    { id: 'rbd_row', n: 'Rematore con elastico', eq: ['band'], d: 'Elastico ancorato alla maniglia di una porta chiusa a chiave, o sotto i piedi. Tira i gomiti indietro stringendo le scapole.',
      how: ['Ancora l’elastico a una porta chiusa a chiave.', 'Busto dritto, braccia tese avanti.', 'Tira i gomiti indietro e stringi le scapole.'], err: ['Porta non chiusa a chiave.', 'Spalle che salgono.'] } ] },
  pulldown_band: { name: 'Lat pulldown con elastico', m: 'dor', s: ['bic'], lv: [
    { id: 'pd_band', n: 'Lat pulldown con elastico', eq: ['band'], d: 'Elastico ancorato in alto alla porta. In ginocchio, tira verso il petto portando i gomiti ai fianchi.',
      how: ['Ancora l’elastico in alto sulla porta chiusa.', 'In ginocchio, braccia tese in alto.', 'Porta i gomiti ai fianchi.'], err: ['Inarcare molto la schiena.', 'Tirare dietro la nuca.'] } ] },
  pullover_bp: { name: 'Pullover con zaino', m: 'dor', s: ['pet', 'tri'], lv: [
    { id: 'po_floor', n: 'Pullover con zaino a terra', eq: ['backpack'], d: 'Supino a terra, zaino tenuto a braccia quasi tese sopra il petto. Portalo dietro la testa fino a sfiorare il pavimento e riportalo sopra il petto tirando con i dorsali.',
      how: ['Supino, ginocchia piegate, lombare appoggiata.', 'Zaino sopra il petto, gomiti leggermente piegati.', 'Porta lo zaino dietro la testa in 3 secondi e riportalo su.'], err: ['Piegare molto i gomiti (diventa un esercizio per i tricipiti).', 'Inarcare la schiena quando lo zaino è dietro la testa.'] } ] },
  prone_pull: { name: 'Tirate a terra da prono', m: 'dor', s: ['spa'], lv: [
    { id: 'pp_w', n: 'Tirate a W da prono', eq: [], d: 'A pancia in giù, braccia tese avanti sollevate da terra. Tira i gomiti verso i fianchi come in una trazione, stringendo le scapole, e torna avanti.',
      how: ['Prono, fronte su un asciugamano, braccia avanti sollevate.', 'Tira i gomiti verso i fianchi disegnando una W.', 'Tieni 1 secondo e distendi di nuovo, senza appoggiare.'], err: ['Sollevare il busto invece delle braccia.', 'Movimento veloce senza contrazione.'] },
    { id: 'pp_slide', n: 'Pulldown scivolato a terra', eq: [], d: 'Prono su un pavimento liscio, mani su due panni. Tira il corpo in avanti trascinandolo con le braccia, come una trazione orizzontale a terra.',
      how: ['Prono, mani avanti su due panni, pavimento liscio.', 'Premi le mani a terra e tira il corpo in avanti.', 'Torna indietro spingendo piano e ripeti.'], err: ['Usare le gambe per spingersi.', 'Pavimento non abbastanza liscio.'] } ] },
  dip: { name: 'Dip', m: 'tri', s: ['pet', 'spa'], lv: [
    { id: 'dp_chairs', n: 'Dip tra due sedie', eq: ['chair'], st: ['spalle'], pre: 'Almeno 15 piegamenti stretti puliti e nessun fastidio alle spalle. Facoltativo: non è nelle schede predefinite.', d: 'Due sedie stabili ai lati, braccia tese. Scendi finché le spalle arrivano all’altezza dei gomiti, poi spingi.',
      how: ['Due sedie stabili, appoggiate al muro o a un mobile.', 'Braccia tese, busto leggermente in avanti.', 'Scendi fino a spalle all’altezza dei gomiti e spingi.'], err: ['Scendere troppo con spalle doloranti.', 'Sedie che scivolano.'] } ] },
  tri_bw: { name: 'Piegamenti stretti', m: 'tri', s: ['pet'], lv: [
    { id: 'tb_knee', n: 'Piegamenti stretti sulle ginocchia', eq: [], d: 'Mani alla larghezza delle spalle, gomiti stretti al busto, appoggio sulle ginocchia.',
      how: ['Ginocchia a terra, corpo dritto dalle ginocchia alla testa.', 'Mani sotto le spalle, gomiti stretti al busto.', 'Scendi fino a sfiorare terra col petto e spingi.'], err: ['Gomiti che si aprono.', 'Bacino che resta indietro.'] },
    { id: 'tb_close', n: 'Piegamenti stretti', eq: [], d: 'Piegamenti con le mani alla larghezza delle spalle e i gomiti che sfiorano i fianchi: più lavoro per i tricipiti.',
      how: ['Mani sotto le spalle.', 'Gomiti stretti, rivolti all’indietro.', 'Discesa in 2 secondi, spinta decisa.'], err: ['Gomiti che si allargano.', 'Movimento parziale.'] },
    { id: 'tb_diamond', n: 'Piegamenti a diamante', eq: [], d: 'Mani vicine sotto il petto, pollici e indici a formare un rombo. Gomiti stretti al busto.',
      how: ['Mani vicine sotto lo sterno.', 'Gomiti stretti al busto.', 'Scendi fino a sfiorare le mani col petto.'], err: ['Gomiti che si aprono.', 'Polsi doloranti: allarga un po’ le mani.'] },
    { id: 'tb_tempo', n: 'Piegamenti a diamante, discesa in 3 s', eq: [], d: 'Come i diamante, scendendo in 3 secondi e con 1 secondo di pausa in basso.',
      how: ['Mani a rombo sotto lo sterno.', 'Scendi contando 3 secondi.', 'Pausa di 1 secondo e spingi.'], err: ['Accorciare la discesa.', 'Appoggiarsi a terra nella pausa.'] } ] },
  triceps: { name: 'Estensioni con elastico', m: 'tri', s: [], lv: [
    { id: 'tb_ext', n: 'Estensioni tricipiti con elastico', eq: ['band'], d: 'Elastico sotto il piede, mani dietro la testa. Distendi le braccia sopra la testa tenendo fermi i gomiti.',
      how: ['Elastico sotto il piede posteriore.', 'Mani dietro la testa, gomiti in alto.', 'Distendi le braccia senza muovere i gomiti.'], err: ['Gomiti che si aprono.', 'Inarcare la schiena.'] } ] },
  calf: { name: 'Polpacci al gradino', m: 'pol', s: [], lv: [
    { id: 'ca_step', n: 'Polpacci su un gradino, una gamba', eq: ['step'], d: 'Avampiede sul bordo, scendi col tallone sotto il gradino, sali sulle punte e tieni 1 secondo.',
      how: ['Avampiede sul bordo del gradino, mano al muro.', 'Scendi col tallone sotto il gradino.', 'Sali sulle punte e tieni 1 secondo.'], err: ['Rimbalzare in basso.', 'Movimento troppo rapido.'] } ] },
  calf_floor: { name: 'Polpacci a terra', m: 'pol', s: [], lv: [
    { id: 'cf_one', n: 'Polpacci a terra, una gamba', eq: [], d: 'In piedi su una gamba, mano al muro. Sali sulle punte, tieni 1 secondo e scendi lento.',
      how: ['Su una gamba, mano al muro.', 'Sali sulle punte.', 'Tieni 1 secondo e scendi in 2.'], err: ['Piegare il ginocchio per aiutarsi.', 'Movimento troppo rapido.'] } ] },
  lat_raise: { name: 'Alzate laterali con elastico', m: 'spa', s: [], lv: [
    { id: 'lr_band', n: 'Alzate laterali con elastico', eq: ['band'], d: 'Elastico sotto i piedi, braccia leggermente piegate. Sali fino all’altezza delle spalle e scendi lento.',
      how: ['Elastico sotto i piedi.', 'Braccia leggermente piegate.', 'Sali fino alle spalle e scendi in 3 secondi.'], err: ['Alzare le spalle verso le orecchie.', 'Slanciare col busto.'] } ] },
  y_raise: { name: 'Alzate a Y da prono', m: 'spa', s: ['dor'], lv: [
    { id: 'yr_prone', n: 'Alzate a Y da prono', eq: [], d: 'A pancia in giù, braccia tese a Y sopra la testa, pollici in alto. Solleva le braccia da terra e tieni 1 secondo.',
      how: ['Prono, braccia a Y, pollici verso l’alto.', 'Solleva le braccia stringendo le scapole.', 'Tieni 1 secondo e scendi.'], err: ['Sollevare il busto invece delle braccia.', 'Movimento troppo veloce.'] } ] },
  face_pull: { name: 'Face pull con elastico', m: 'spa', s: ['dor'], lv: [
    { id: 'fp_band', n: 'Face pull con elastico', eq: ['band'], d: 'Elastico ancorato all’altezza del viso. Tira verso la fronte aprendo i gomiti e ruotando le mani indietro.',
      how: ['Elastico all’altezza del viso, porta chiusa a chiave.', 'Tira verso la fronte con gomiti alti.', 'Ruota le mani indietro in fondo al movimento.'], err: ['Gomiti bassi.', 'Inarcare la schiena.'] } ] }
};

/* Indici: ID esercizio → scala e livello. */
const EX = {};
Object.keys(LADDERS).forEach((k) => LADDERS[k].lv.forEach((lv, i) => {
  EX[lv.id] = { id: lv.id, l: k, i: i, n: lv.n, d: lv.d, how: lv.how || [], err: lv.err || [], eq: lv.eq || [], r: lv.r || null,
    u: lv.u || LADDERS[k].u || '', pre: lv.pre || '', st: lv.st || [], m: lv.m || LADDERS[k].m, s: lv.s || LADDERS[k].s || [] };
}));

/* Schede. Ogni slot: id stabile, l = scala principale, alt = scale alternative se manca l’attrezzatura,
   bar = variante con sbarra, start = esercizio di partenza, pri = priorità (1 = fondamentale). */
const WORKOUTS = {
  A: { name: 'Spinta e quadricipiti', slots: [
    { id: 'A1', l: 'push_h', start: 'ph_classic', sets: 4, r: [8, 15], rest: 90, pri: 1 },
    { id: 'A2', l: 'squat', alt: ['lunge'], start: 'sq_bulg', sets: 4, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'A3', l: 'row', alt: ['row_bp', 'row_band', 'prone_pull'], start: 'rt_straight', sets: 4, r: [6, 12], rest: 90, pri: 1, bar: { id: 'A3b', pk: 'pull', l: 'pull', start: 'pu_neg', sets: 4, r: [4, 8], rest: 120 } },
    { id: 'A4', l: 'push_v', start: 'pv_pike', sets: 3, r: [6, 12], rest: 90, pri: 2 },
    { id: 'A5', l: 'hinge', start: 'hg_ht1', sets: 4, r: [10, 15], rest: 60, side: true, pri: 2 },
    { id: 'A6', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [12, 15], rest: 60, pri: 2 },
    { id: 'A7', l: 'core', start: 'co_plank', sets: 3, r: [30, 60], rest: 60, pri: 3, bar: { id: 'A7b', l: 'hang_core', start: 'hc_knee', sets: 3, r: [8, 15], rest: 60 } } ] },
  B: { name: 'Tirata e catena posteriore', slots: [
    { id: 'B1', l: 'row_band', alt: ['row_bp', 'row', 'prone_pull'], sets: 4, r: [10, 15], rest: 90, pri: 1 },
    { id: 'B2', l: 'push_h', start: 'ph_decline', sets: 4, r: [8, 15], rest: 90, pri: 1 },
    { id: 'B3', l: 'lunge', start: 'ln_bp', sets: 3, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'B4', l: 'hinge', start: 'hg_nordic_neg', sets: 4, r: [4, 8], rest: 90, pri: 2 },
    { id: 'B5', l: 'pulldown_band', alt: ['pullover_bp', 'prone_pull'], sets: 3, r: [12, 15], rest: 60, pri: 2, bar: { id: 'B5b', l: 'chin', start: 'ch_neg', sets: 3, r: [4, 8], rest: 120 } },
    { id: 'B6', l: 'tri_bw', start: 'tb_close', sets: 3, r: [8, 15], rest: 60, pri: 2 },
    { id: 'B7', l: 'calf', alt: ['calf_floor'], sets: 3, r: [12, 20], rest: 60, side: true, pri: 3 } ] },
  C: { name: 'Mista e braccia', slots: [
    { id: 'C1', l: 'push_h', start: 'ph_archer', sets: 4, r: [6, 12], rest: 90, side: true, pri: 1, note: 'Troppo difficile? Scendi di un livello o fai i piegamenti a diamante.' },
    { id: 'C2', l: 'squat_tempo', start: 'st_bp', sets: 3, r: [10, 15], rest: 90, pri: 1 },
    { id: 'C3', l: 'row', alt: ['row_bp', 'row_band', 'prone_pull'], start: 'rt_straight', sets: 4, r: [6, 12], rest: 90, pri: 1, note: 'Presa stretta, mani alla larghezza delle spalle.', bar: { id: 'C3b', pk: 'pull', l: 'pull', start: 'pu_neg', sets: 4, r: [4, 8], rest: 120 } },
    { id: 'C4', l: 'hinge', start: 'hg_slide', sets: 4, r: [8, 12], rest: 60, pri: 2 },
    { id: 'C5', l: 'lat_raise', alt: ['y_raise'], sets: 3, r: [12, 20], rest: 60, pri: 2 },
    { id: 'C6', l: 'triceps', alt: ['tri_bw'], sets: 3, r: [12, 15], rest: 60, pri: 3 },
    { id: 'C7', l: 'core', start: 'co_hollow', sets: 3, r: [20, 40], rest: 60, pri: 2 },
    { id: 'C8', l: 'calf', alt: ['calf_floor'], sets: 3, r: [12, 20], rest: 45, side: true, pri: 2 } ] },

  /* 2 giorni: due full body più dense */
  F1: { name: 'Full body 1', slots: [
    { id: 'F1a', l: 'push_h', start: 'ph_classic', sets: 4, r: [8, 15], rest: 90, pri: 1 },
    { id: 'F1b', l: 'squat', alt: ['lunge'], start: 'sq_bulg', sets: 4, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'F1c', l: 'row', alt: ['row_bp', 'row_band', 'prone_pull'], start: 'rt_straight', sets: 4, r: [6, 12], rest: 90, pri: 1, bar: { id: 'F1cb', pk: 'pull', l: 'pull', start: 'pu_neg', sets: 4, r: [4, 8], rest: 120 } },
    { id: 'F1d', l: 'push_v', start: 'pv_pike', sets: 3, r: [6, 12], rest: 90, pri: 2 },
    { id: 'F1e', l: 'hinge', start: 'hg_ht1', sets: 3, r: [10, 15], rest: 60, side: true, pri: 2 },
    { id: 'F1f', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [12, 15], rest: 60, pri: 3 },
    { id: 'F1g', l: 'core', start: 'co_plank', sets: 3, r: [30, 60], rest: 60, pri: 3 } ] },
  F2: { name: 'Full body 2', slots: [
    { id: 'F2a', l: 'row_band', alt: ['row_bp', 'row', 'prone_pull'], sets: 4, r: [10, 15], rest: 90, pri: 1, bar: { id: 'F2ab', l: 'chin', start: 'ch_neg', sets: 4, r: [4, 8], rest: 120 } },
    { id: 'F2b', l: 'push_h', start: 'ph_decline', sets: 4, r: [8, 15], rest: 90, pri: 1 },
    { id: 'F2c', l: 'lunge', start: 'ln_bp', sets: 3, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'F2d', l: 'hinge', start: 'hg_nordic_neg', sets: 3, r: [4, 8], rest: 90, pri: 2 },
    { id: 'F2e', l: 'tri_bw', start: 'tb_close', sets: 3, r: [8, 15], rest: 60, pri: 2 },
    { id: 'F2f', l: 'lat_raise', alt: ['y_raise'], sets: 3, r: [12, 20], rest: 60, pri: 3 },
    { id: 'F2g', l: 'calf', alt: ['calf_floor'], sets: 3, r: [12, 20], rest: 60, side: true, pri: 3 } ] },

  /* 4 giorni: parte alta / parte bassa */
  U1: { name: 'Parte alta 1', slots: [
    { id: 'U1a', l: 'push_h', start: 'ph_decline', sets: 4, r: [8, 15], rest: 90, pri: 1 },
    { id: 'U1b', l: 'row', alt: ['row_bp', 'row_band', 'prone_pull'], start: 'rt_straight', sets: 4, r: [6, 12], rest: 90, pri: 1, bar: { id: 'U1bb', pk: 'pull', l: 'pull', start: 'pu_neg', sets: 4, r: [4, 8], rest: 120 } },
    { id: 'U1c', l: 'push_v', start: 'pv_pike', sets: 3, r: [6, 12], rest: 90, pri: 1 },
    { id: 'U1d', l: 'pulldown_band', alt: ['pullover_bp', 'prone_pull'], sets: 3, r: [12, 15], rest: 60, pri: 2, bar: { id: 'U1db', l: 'chin', start: 'ch_neg', sets: 3, r: [4, 8], rest: 120 } },
    { id: 'U1e', l: 'tri_bw', start: 'tb_close', sets: 3, r: [8, 15], rest: 60, pri: 2 },
    { id: 'U1f', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [12, 15], rest: 60, pri: 3 } ] },
  L1: { name: 'Parte bassa 1', slots: [
    { id: 'L1a', l: 'squat', alt: ['lunge'], start: 'sq_bulg', sets: 4, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'L1b', l: 'hinge', start: 'hg_nordic_neg', sets: 3, r: [4, 8], rest: 90, pri: 1 },
    { id: 'L1c', l: 'glute_single', sets: 3, r: [12, 15], rest: 60, side: true, pri: 2 },
    { id: 'L1d', l: 'calf', alt: ['calf_floor'], sets: 4, r: [12, 20], rest: 60, side: true, pri: 2 },
    { id: 'L1e', l: 'core', start: 'co_plank', sets: 3, r: [30, 60], rest: 60, pri: 3 } ] },
  U2: { name: 'Parte alta 2', slots: [
    { id: 'U2a', l: 'push_h', start: 'ph_archer', sets: 4, r: [6, 12], rest: 90, side: true, pri: 1 },
    { id: 'U2b', l: 'row_band', alt: ['row_bp', 'row', 'prone_pull'], sets: 4, r: [10, 15], rest: 90, pri: 1 },
    { id: 'U2c', l: 'lat_raise', alt: ['y_raise'], sets: 3, r: [12, 20], rest: 60, pri: 2 },
    { id: 'U2d', l: 'face_pull', alt: ['y_raise'], sets: 3, r: [12, 20], rest: 60, pri: 2 },
    { id: 'U2e', l: 'triceps', alt: ['tri_bw'], sets: 3, r: [12, 15], rest: 60, pri: 3 },
    { id: 'U2f', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [12, 15], rest: 60, pri: 3 } ] },
  L2: { name: 'Parte bassa 2', slots: [
    { id: 'L2a', l: 'squat_tempo', start: 'st_bp', sets: 4, r: [10, 15], rest: 90, pri: 1 },
    { id: 'L2b', l: 'lunge', start: 'ln_bp', sets: 3, r: [8, 12], rest: 90, side: true, pri: 1 },
    { id: 'L2c', l: 'hinge', start: 'hg_ht1', sets: 3, r: [10, 15], rest: 60, side: true, pri: 2 },
    { id: 'L2d', l: 'calf', alt: ['calf_floor'], sets: 3, r: [12, 20], rest: 60, side: true, pri: 2 },
    { id: 'L2e', l: 'core', start: 'co_hollow', sets: 3, r: [20, 40], rest: 60, pri: 3, bar: { id: 'L2eb', l: 'hang_core', start: 'hc_knee', sets: 3, r: [8, 15], rest: 60 } } ] }
};

/* Quale insieme di schede usare in base ai giorni a settimana. */
/* Priorità alla parte alta: gambe a mantenimento (le allena già il calcio), più serie per
   petto, schiena, spalle e braccia, distribuite su tutti gli allenamenti della settimana
   (oltre ~11 serie per muscolo nella stessa seduta il guadagno in più è minimo: meglio spalmarle). */
const LEG_LADDERS = ['squat', 'squat_tempo', 'lunge', 'hinge', 'calf', 'calf_floor'];
const FOCUS_ADD = {
  B: [{ id: 'B8u', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [10, 15], rest: 60, pri: 2 }],
  C: [{ id: 'C9u', l: 'dip', alt: ['tri_bw', 'triceps'], sets: 3, r: [8, 15], rest: 90, pri: 2 }],
  F2: [{ id: 'F2u', l: 'curl_band', alt: ['curl_bp'], sets: 3, r: [10, 15], rest: 60, pri: 2 }],
  L1: [{ id: 'L1u', l: 'push_h', start: 'ph_classic', sets: 3, r: [8, 15], rest: 90, pri: 2 }],
  L2: [{ id: 'L2u', l: 'row_band', alt: ['row_bp', 'row', 'prone_pull'], sets: 3, r: [10, 15], rest: 90, pri: 2 }]
};
const SPLITS = {
  2: { name: 'Full body ×2', order: ['F1', 'F2'] },
  3: { name: 'Full body A/B/C', order: ['A', 'B', 'C'] },
  4: { name: 'Parte alta / parte bassa', order: ['U1', 'L1', 'U2', 'L2'] }
};

/* Migrazione da leva.v1: lo slot v1 indicava la scala, il livello era un indice. */
const V1 = {
  slotLadder: { A1: 'push_h', A2: 'squat', A3: 'row', A3b: 'pull', A4: 'push_v', A5: 'hinge', A6: 'curl_band', A7: 'core', A7b: 'hang_core',
    B1: 'row_band', B2: 'push_h', B3: 'lunge', B4: 'hinge', B5: 'pulldown_band', B5b: 'chin', B6: 'dip', B7: 'calf',
    C1: 'push_h', C2: 'squat_tempo', C3: 'row', C3b: 'pull', C4: 'glute_single', C5: 'lat_raise', C6: 'triceps', C7: 'core' },
  levels: {
    push_h: ['ph_classic', 'ph_decline', 'ph_band', 'ph_archer', 'ph_pseudo'],
    push_v: ['pv_pike', 'pv_pike_elev', 'pv_wall_hold', 'pv_hspu_neg', 'pv_hspu'],
    row: ['rt_knee', 'rt_straight', 'rt_elev', 'rt_pause', 'rt_one'],
    squat: ['sq_bw', 'sq_bulg', 'sq_bulg_bp', 'sq_pistol_box', 'sq_pistol'],
    hinge: ['hg_bridge', 'hg_ht1', 'hg_nordic_neg', 'hg_nordic_assist', 'hg_nordic'],
    core: ['co_plank', 'co_hollow', 'co_lsit_bent', 'co_lsit_one', 'co_lsit'],
    pull: ['pu_neg', 'pu_band', 'pu_full', 'pu_bp', 'pu_archer'],
    chin: ['ch_neg', 'ch_band', 'ch_full', 'ch_bp'],
    hang_core: ['hc_knee', 'hc_leg', 'hc_t2b'],
    curl_band: ['cb_curl'], row_band: ['rbd_row'], pulldown_band: ['pd_band'], dip: ['dp_chairs'], calf: ['ca_step'],
    lunge: ['ln_bp'], squat_tempo: ['st_bp'], glute_single: ['gs_bridge1'], lat_raise: ['lr_band'], triceps: ['tb_ext']
  },
  wname: { A: 'Spinta e quadricipiti', B: 'Tirata e catena posteriore', C: 'Mista e braccia' }
};

/* Riscaldamento e defaticamento guidati. s = secondi (per lato se side), a = animazione. */
const WARMUP = [
  { id: 'wu_jacks', n: 'Saltelli a gambe divaricate', s: 40, a: 'jacks', d: 'Salta aprendo gambe e braccia, poi richiudi. Ritmo leggero, atterra sugli avampiedi.' },
  { id: 'wu_arms', n: 'Circonduzioni delle braccia', s: 30, a: 'armcircle', d: 'Braccia tese di lato: fai cerchi ampi e lenti, prima in avanti poi indietro.' },
  { id: 'wu_catcow', n: 'Gatto e mucca', s: 40, a: 'catcow', d: 'In quadrupedia: inarca la schiena guardando in alto, poi arrotondala guardando l’ombelico. Muovi anche i polsi.' },
  { id: 'wu_squat', n: 'Squat lenti', s: 40, a: 'squat', d: 'Squat a corpo libero lenti e controllati, scendendo un po’ di più a ogni ripetizione.' },
  { id: 'wu_lunge', n: 'Affondi alternati', s: 40, a: 'split', d: 'Passo indietro e ginocchio verso terra, alternando le gambe. Busto dritto.' },
  { id: 'wu_push', n: 'Piegamenti facili', s: 30, a: 'pushup_knee', d: '8–10 piegamenti sulle ginocchia per preparare spalle e polsi.' }
];
const COOLDOWN = [
  { id: 'cd_chest', n: 'Allungamento del petto', s: 30, side: true, a: 'chestwall', d: 'Mano appoggiata al muro all’altezza della spalla, ruota piano il busto dal lato opposto.' },
  { id: 'cd_quad', n: 'Allungamento dei quadricipiti', s: 30, side: true, a: 'quadstretch', d: 'In piedi, afferra la caviglia e porta il tallone verso il gluteo. Ginocchia vicine, tieniti a un muro.' },
  { id: 'cd_hip', n: 'Affondo basso per l’anca', s: 30, side: true, a: 'hipflexor', d: 'Ginocchio dietro a terra su un cuscino: spingi piano il bacino in avanti, busto dritto.' },
  { id: 'cd_ham', n: 'Allungamento dei femorali', s: 40, a: 'hamstretch', d: 'Seduto a gambe tese, schiena lunga: piegati in avanti dalle anche verso i piedi.' },
  { id: 'cd_child', n: 'Posizione del bambino', s: 40, a: 'childpose', d: 'Seduto sui talloni, porta il busto in avanti e le braccia lunghe a terra. Respira lentamente.' }
];

/* Ritmo di ogni ripetizione, in secondi. w = parole: push (scendi/spingi), pull (tira/torna), lift (sali/scendi).
   e = fase lenta (ritorno/discesa), c = fase di sforzo, b = pausa in basso/esteso, t = pausa in alto/contratto. */
const TEMPO_DEF = { push: { w: 'push', e: 2, c: 1, b: 0, t: 0 }, pull: { w: 'pull', e: 2, c: 1, b: 0, t: 1 }, lift: { w: 'lift', e: 2, c: 1, b: 0, t: 1 } };
const TEMPO = {
  push_h: 'push', push_v: 'push', tri_bw: 'push', dip: 'push', squat: 'push', lunge: 'push',
  row: 'pull', row_bp: 'pull', row_band: 'pull', pulldown_band: 'pull', pull: 'pull', chin: 'pull', face_pull: 'pull', prone_pull: 'pull', pullover_bp: 'pull',
  hinge: 'lift', glute_single: 'lift', curl_band: 'lift', curl_bp: 'lift', triceps: 'lift', calf: 'lift', calf_floor: 'lift', lat_raise: 'lift', y_raise: 'lift', hang_core: 'lift',
  squat_tempo: { w: 'push', e: 3, c: 1, b: 0, t: 0 },
  // eccezioni per singolo esercizio
  st_bw: { w: 'push', e: 3, c: 1, b: 0, t: 0 }, st_bp: { w: 'push', e: 3, c: 1, b: 0, t: 0 }, tb_tempo: { w: 'push', e: 3, c: 1, b: 1, t: 0 },
  rt_pause: { w: 'pull', e: 3, c: 1, b: 0, t: 2 }, rb_pause: { w: 'pull', e: 3, c: 1, b: 0, t: 2 },
  hg_nordic_neg: { w: 'lift', e: 5, c: 2, b: 0, t: 0, neg: true }, pu_neg: { w: 'pull', e: 5, c: 2, b: 0, t: 0, neg: true }, ch_neg: { w: 'pull', e: 5, c: 2, b: 0, t: 0, neg: true },
  pv_hspu_neg: { w: 'push', e: 5, c: 2, b: 0, t: 0, neg: true }, sq_pistol_box: { w: 'push', e: 3, c: 1, b: 0, t: 0 },
  cb_curl: { w: 'lift', e: 3, c: 1, b: 0, t: 0 }, cbp_curl: { w: 'lift', e: 3, c: 1, b: 0, t: 0 }, lr_band: { w: 'lift', e: 3, c: 1, b: 0, t: 0 },
  po_floor: { w: 'pull', e: 3, c: 2, b: 0, t: 0 }, ca_step: { w: 'lift', e: 2, c: 1, b: 1, t: 1 }, cf_one: { w: 'lift', e: 2, c: 1, b: 0, t: 1 },
  neck_flex: { w: 'lift', e: 2, c: 2, b: 0, t: 1 }, neck_ext: { w: 'lift', e: 2, c: 2, b: 0, t: 1 }, shrug_bp: { w: 'lift', e: 2, c: 1, b: 0, t: 2 }
};

/* Blocco collo (facoltativo, a fine allenamento). Sempre lento e senza strappi. */
MUSCLES.collo = 'Collo';
MUSCLE_ORDER.push('collo');
Object.assign(LADDERS, {
  neck_flex: { name: 'Collo: flessione', m: 'collo', s: [], lv: [
    { id: 'nf_lift', n: 'Sollevamento della testa da supino', eq: [], r: [10, 20], pre: 'Parti con poche ripetizioni lente: il collo si affatica in fretta. Fermati se senti dolore o giramenti di testa.', d: 'Sdraiato a pancia in su, ginocchia piegate. Porta il mento verso il petto e solleva la testa di pochi centimetri, poi riappoggiala lentamente.',
      how: ['Supino, ginocchia piegate, braccia lungo i fianchi.', 'Mento leggermente verso il petto.', 'Solleva la testa di 3–5 cm in 2 secondi, tieni 1 secondo, scendi in 2.'], err: ['Sollevare anche le spalle.', 'Movimenti veloci o a scatti.'] },
    { id: 'nf_iso', n: 'Isometria in avanti con la mano', eq: [], u: 's', r: [15, 30], d: 'Mano sulla fronte: spingi la testa in avanti contro la mano, senza che la testa si muova. Forza moderata.',
      how: ['Seduto o in piedi, schiena dritta.', 'Palmo sulla fronte.', 'Spingi la testa contro la mano al 50–70% della forza, respira normalmente.'], err: ['Spingere al massimo dal primo giorno.', 'Trattenere il respiro.'] } ] },
  neck_ext: { name: 'Collo: estensione', m: 'collo', s: [], lv: [
    { id: 'ne_prone', n: 'Estensione del collo da prono', eq: [], r: [10, 20], d: 'A pancia in giù, fronte appoggiata. Solleva la testa guardando il pavimento, fino a portarla in linea con la schiena, poi riappoggiala.',
      how: ['Prono, fronte su un asciugamano.', 'Solleva la testa in 2 secondi, sguardo verso il pavimento.', 'Tieni 1 secondo e riappoggia in 2.'], err: ['Guardare in alto piegando troppo il collo.', 'Sollevare il petto.'] },
    { id: 'ne_iso', n: 'Isometria indietro con la mano', eq: [], u: 's', r: [15, 30], d: 'Mani dietro la testa: spingi la testa indietro contro le mani, senza muoverla. Forza moderata.',
      how: ['Seduto o in piedi, mento leggermente rientrato.', 'Mani intrecciate dietro la testa.', 'Spingi indietro al 50–70% della forza, respira.'], err: ['Inarcare la schiena.', 'Spingere con troppa forza.'] } ] },
  neck_side: { name: 'Collo: laterale', m: 'collo', s: [], lv: [
    { id: 'ns_iso', n: 'Isometria laterale con la mano', eq: [], u: 's', r: [15, 30], d: 'Mano sulla tempia: spingi la testa di lato contro la mano, senza muoverla. Poi dall’altro lato.',
      how: ['Seduto o in piedi, spalle rilassate.', 'Palmo sulla tempia destra.', 'Spingi la testa verso la mano al 50–70% della forza; poi cambia lato.'], err: ['Alzare la spalla.', 'Ruotare la testa.'] } ] },
  shrug_bp: { name: 'Scrollate di spalle', m: 'collo', s: ['dor'], lv: [
    { id: 'sh_bp', n: 'Scrollate di spalle con zaino', eq: ['backpack'], r: [12, 20], d: 'In piedi, zaino in mano a braccia tese. Porta le spalle verso le orecchie, tieni 2 secondi e scendi lentamente. Allena il trapezio, che sostiene il collo.',
      how: ['In piedi, zaino tenuto davanti con le braccia tese.', 'Solleva le spalle verso le orecchie senza piegare i gomiti.', 'Tieni 2 secondi in alto e scendi in 2.'], err: ['Ruotare le spalle.', 'Piegare le braccia.'] } ] }
});
['neck_flex', 'neck_ext', 'neck_side', 'shrug_bp'].forEach((k) => LADDERS[k].lv.forEach((lv, i) => {
  EX[lv.id] = { id: lv.id, l: k, i: i, n: lv.n, d: lv.d, how: lv.how || [], err: lv.err || [], eq: lv.eq || [], r: lv.r || null, u: lv.u || LADDERS[k].u || '', pre: lv.pre || '', st: lv.st || [], m: lv.m || LADDERS[k].m, s: lv.s || LADDERS[k].s || [] };
}));
const NECK_SLOTS = [
  { id: 'N1', l: 'neck_flex', start: 'nf_lift', sets: 2, r: [10, 20], rest: 45, pri: 2 },
  { id: 'N2', l: 'neck_ext', start: 'ne_prone', sets: 2, r: [10, 20], rest: 45, pri: 2 },
  { id: 'N3', l: 'neck_side', sets: 2, r: [15, 30], rest: 30, side: true, pri: 2 },
  { id: 'N4', l: 'shrug_bp', sets: 2, r: [12, 20], rest: 45, pri: 2 }
];
