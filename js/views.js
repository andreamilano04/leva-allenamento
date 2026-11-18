/* LEVA 2.0 — Schermate. Ogni funzione v*() restituisce l'HTML di una vista. */
'use strict';

const initial = (n) => (n ? n.trim().charAt(0).toUpperCase() : 'L');

/* Durata totale prevista: esercizi, pause tra le serie e tra gli esercizi, riscaldamento e defaticamento. */
function totalMin(W) { return W.min + (S.settings.warm !== false ? routineMin('warm') : 0) + (S.settings.cool !== false ? routineMin('cool') : 0); }

/* ---------- Oggi ---------- */
function vHome() {
  const p = S.profile; const pr = program(p, S); const wp = weekPlan(p, S); const td = wp.find((d) => d.today);
  const nw = nextWid(p, S); const W = pr.workouts.find((w) => w.wid === nw) || pr.workouts[0];
  const dateStr = cap(new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
  let h = '<div class="hdr"><button class="avatar" data-a="tab" data-v="profile" aria-label="Profilo">' + esc(initial(p.name)) + '</button><div class="who"><b>Ciao' + (p.name ? ', ' + esc(p.name) : '') + '</b><span class="muted small">' + esc(dateStr) + '</span></div>' +
    '<button class="icon-btn" data-a="weightSheet" aria-label="Registra il peso">' + ICON.scale + '</button></div>';

  if (S.active) {
    const a = S.active; const doneSets = a.ex.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0); const all = a.ex.reduce((t, e) => t + e.sets.length, 0);
    h += '<section class="hero"><span class="big">' + esc(a.wid) + '</span><div class="eyebrow">Allenamento in corso</div><h2>' + esc(a.wname) + '</h2>' +
      '<div class="meta"><span>' + ICON.check + doneSets + '/' + all + ' serie</span><span>' + ICON.clock + mmss(elapsedSec() ) + '</span></div>' +
      '<button class="btn black" data-a="resume">' + ICON.play + 'Riprendi allenamento</button></section>';
  } else {
    const nextDay = wp.find((d) => !d.today && !d.past && d.plan);
    const nextTxt = nextDay ? WD[nextDay.i] + ' · ' + WORKOUTS[nextDay.plan].name : 'la prossima settimana';
    if (td.done.length) {
      h += '<section class="hero dark"><span class="big">✓</span><div class="eyebrow">Oggi</div><h2>Allenamento fatto</h2><p class="sub">' + esc(td.done[td.done.length - 1].wname) + ' completato. Recupera bene: prossimo ' + esc(nextTxt) + '.</p>' +
        '<div class="sp16"></div><button class="btn ghost" data-a="start" data-v="' + nw + '">Allenati di nuovo comunque</button></section>';
    } else if (td.train) {
      h += heroWorkout(W, 'Allenamento di oggi', false);
    } else {
      h += '<section class="hero dark"><span class="big">' + ICON.moon.replace('<svg', '<svg width="110" height="110"') + '</span><div class="eyebrow">Giorno di riposo</div><h2>Oggi recupera</h2><p class="sub">Il muscolo cresce mentre riposi. Prossimo allenamento: ' + esc(nextTxt) + '.</p>' +
        '<div class="sp16"></div><button class="btn ghost" data-a="start" data-v="' + nw + '">' + ICON.play + 'Allenati comunque · ' + esc(W.name) + '</button></section>';
    }
  }

  const doneW = sessionsThisWeek(S);
  h += '<section class="card"><div class="card-h"><h3>Questa settimana</h3><span class="tag ' + (doneW >= p.wdays.length ? 'ac' : '') + '">' + doneW + '/' + p.wdays.length + ' allenamenti</span></div>' + weekStrip(wp) + '<div class="row" style="margin-top:12px"><p class="muted tiny f">Tocca un giorno per segnare una partita ⚽</p><button class="link" data-a="tab" data-v="cal">Calendario</button></div></section>';

  h += remindersCard(p);
  const cw = curWeight();
  h += '<div class="grid3">' + tile('flame', 'settimane di fila', String(streakWeeks(p, S))) + tile('repeat', 'allenamenti', String(S.sessions.length), 'tab', 'progress') + tile('scale', 'peso (kg)', fmt1(cw), 'weightSheet') + '</div>';

  const last = S.sessions[S.sessions.length - 1];
  if (last) {
    h += '<div class="sec-h"><h3>Ultimo allenamento</h3><button class="link" data-a="tab" data-v="progress">Storico</button></div>';
    h += sessionItem(last, S.sessions.length - 1);
    const ups = []; for (let i = S.sessions.length - 1; i >= 0 && ups.length < 3; i--) (S.sessions[i].ups || []).forEach((u) => { if (ups.length < 3) ups.push({ u: u, d: S.sessions[i].d }); });
    if (ups.length) h += '<section class="card"><h3 style="margin-bottom:12px">Progressi recenti</h3>' + ups.map((x) => '<div class="lrow"><span class="letter">' + ICON.up + '</span><div class="f"><div class="t">' + esc(x.u) + '</div><div class="muted small">Nuovo livello · ' + fmtD(x.d) + '</div></div></div>').join('') + '</section>';
  }

  const sw = startWeight(); const pct = p.goal === sw ? 100 : clamp(((cw - sw) / (p.goal - sw)) * 100, 0, 100);
  const trend = weightTrend(S); const up = p.goal > sw;
  const tip = trend === 'flat' && up ? 'Da almeno tre settimane il peso è stabile. Se vuoi aumentare, prova ad aumentare un po’ le porzioni o ad aggiungere uno spuntino, e ricontrolla tra due settimane.'
    : trend === 'fast' && up ? 'Il peso sta salendo più di mezzo chilo a settimana: se vuoi limitare l’aumento di grasso, puoi rallentare un po’.'
    : 'Per aumentare la massa servono un leggero surplus calorico e abbastanza proteine: come riferimento generale si indicano spesso 1,6–2,2 g per kg al giorno. Per un piano su misura rivolgiti a un nutrizionista.';
  h += '<div class="sec-h"><h3>Obiettivo peso</h3><button class="link" data-a="weightSheet">+ Registra</button></div>';
  h += '<section class="card"><div class="row" style="margin-bottom:12px"><div class="f"><span class="big-n">' + fmt1(cw) + '<small>kg</small></span></div><div class="muted small" style="text-align:right">obiettivo<br><b style="color:var(--tx)">' + fmt1(p.goal) + ' kg</b></div></div>' +
    '<div class="bar"><i style="width:' + pct.toFixed(0) + '%"></i></div><div class="muted small" style="margin-top:8px">' + (Math.abs(cw - p.goal) < 0.05 ? 'Obiettivo raggiunto!' : (cw < p.goal ? 'Mancano ' : 'Sei sopra di ') + fmt1(Math.abs(p.goal - cw)) + ' kg') + '</div>' + bmiBox(cw, p.height, p.goal) + weightMini() + '</section>';
  if (S.settings.nutri !== false) h += '<section class="card row" style="align-items:flex-start"><span class="letter" style="background:var(--ord);color:var(--or)">' + ICON.food + '</span><div class="f"><h4 style="margin-bottom:4px">Alimentazione</h4><p class="muted small">' + esc(tip) + '</p><p class="muted tiny" style="margin-top:6px">Indicazione generale, non personalizzata.' + (trend ? '' : ' I suggerimenti sull’andamento compaiono dopo almeno 3 settimane e 6 pesate.') + '</p></div></section>';
  return h;
}

/* IMC (indice di massa corporea) = peso (kg) / altezza (m)². Fasce OMS per gli adulti. */
function bmiBox(kg, cm, goal) {
  const v = bmi(kg, cm); if (!v) return '';
  const c = bmiCat(v); const lo = 15, hi = 35; const pos = (x) => clamp((x - lo) / (hi - lo) * 100, 0, 100);
  const g = goal ? bmi(goal, cm) : null;
  return '<div class="bmi"><div class="row"><div class="f"><div class="eyebrow">IMC · indice di massa corporea</div><div style="margin-top:4px"><b style="font-size:22px">' + fmt1(v) + '</b> <span class="tag ' + c.cls + '">' + c.n + '</span></div></div><button class="icon-btn sm" data-a="bmiInfo" aria-label="Cos’è l’IMC">' + ICON.info + '</button></div>' +
    '<div class="bmi-bar"><span style="width:' + pos(18.5) + '%"></span><span style="width:' + (pos(25) - pos(18.5)) + '%"></span><span style="width:' + (pos(30) - pos(25)) + '%"></span><span style="flex:1"></span>' +
    (g ? '<em class="goal" style="left:' + pos(g) + '%" title="obiettivo"></em>' : '') + '<em style="left:' + pos(v) + '%"></em></div>' +
    '<div class="bmi-l"><span>18,5</span><span>25</span><span>30</span></div>' +
    (g ? '<p class="muted tiny" style="margin-top:6px">Con il peso obiettivo (' + fmt1(goal) + ' kg) il tuo IMC sarebbe ' + fmt1(g) + ' (' + bmiCat(g).n.toLowerCase() + ').</p>' : '') + '</div>';
}

/* Mini grafico del peso e promemoria della pesata (2 volte a settimana). */
function weightMini() {
  const w = S.weights; const last = w[w.length - 1];
  const days = last ? dayN(today()) - dayN(last.d) : null;
  const when = days == null ? 'mai' : days === 0 ? 'oggi' : days === 1 ? 'ieri' : days + ' giorni fa';
  let h = '<div class="sp16"></div>';
  if (w.length >= 2) {
    const pts = w.slice(-20);
    h += lineChart(pts.map((e) => ({ x: dayN(e.d), y: e.kg })), { goal: S.profile.goal, h: 130, l0: fmtD(pts[0].d), l1: fmtD(pts[pts.length - 1].d), label: 'Andamento del peso' });
  } else h += '<p class="muted small">Pesati 2 volte a settimana, al mattino a digiuno: dalla seconda pesata qui compare il grafico dell’andamento.</p>';
  h += '<div class="row" style="margin-top:10px"><div class="f muted small">Ultima pesata: ' + esc(when) + ' · ' + plural(w.length, 'misurazione', 'misurazioni') + '</div>' +
    (days == null || days >= 4 ? '<button class="btn primary xs" data-a="weightSheet">Pesati ora</button>' : '<span class="tag ac">' + ICON.check.replace('<svg', '<svg width="12" height="12"') + 'in regola</span>') + '</div>';
  return h;
}

function heroWorkout(W, label, isNext) {
  const mn = matchNear(S.profile, today()); const dl = deloadStatus(S.profile, S).active;
  const notes = []; if (mn) notes.push('⚽ Partita ' + mn + ': gambe alleggerite'); if (dl) notes.push('Settimana di scarico: una serie in meno');
  return '<section class="hero"><span class="big">' + esc(W.wid) + '</span><div class="eyebrow">' + esc(label) + '</div><h2>' + esc(W.name) + '</h2>' + (notes.length ? '<p class="sub" style="font-weight:600">' + esc(notes.join(' · ')) + '</p>' : '') +
    '<div class="meta"><span>' + ICON.clock + '~' + totalMin(W) + ' min</span><span>' + ICON.dumb + plural(W.slots.length, 'esercizio', 'esercizi') + '</span><span>' + ICON.repeat + W.sets + ' serie</span></div>' +
    '<button class="btn black" data-a="start" data-v="' + W.wid + '">' + ICON.play + 'Inizia allenamento</button>' +
    '<div class="sp10"></div><button class="link" style="color:rgba(11,12,5,.7);width:100%;position:relative" data-a="openWorkout" data-v="' + W.wid + '">Vedi gli esercizi</button></section>';
}

function weekStrip(wp) {
  return '<div class="week">' + wp.map((d) => {
    const cls = ['wd']; if (d.train) cls.push('train'); if (d.done.length) cls.push('done'); if (d.today) cls.push('today');
    const lab = d.done.length ? '✓' : (d.plan ? d.plan : '');
    const ball = isMatchDay(S.profile, d.k) ? '<em class="ball" title="Partita">⚽</em>' : '';
    return '<button class="' + cls.join(' ') + '" data-a="dayTap" data-v="' + d.k + '" aria-label="' + WD[d.i] + ' ' + d.d.getDate() + '">' + ball + '<span>' + WD[d.i] + '</span><b>' + d.d.getDate() + '</b><small>' + esc(lab) + '</small></button>';
  }).join('') + '</div>';
}

function sessionItem(s, idx) {
  return '<button class="item" data-a="openSession" data-v="' + idx + '"><span class="letter">' + esc(s.wid) + '</span><div class="f"><div class="t">' + esc(s.wname) + '</div><div class="s">' + fmtD(s.d) + ' · ' + s.dur + ' min · ' + s.vol + ' rip' + (s.kg ? ' · ' + Math.round(s.kg) + ' kg' : '') + '</div></div><span class="chev">' + ICON.chevR + '</span></button>';
}

/* ---------- Programma ---------- */
function vPlan() {
  const p = S.profile; const pr = program(p, S); const wp = weekPlan(p, S);
  let h = '<div class="page-t"><h1>Programma</h1><p class="muted small">' + esc(pr.name) + ' · ' + p.wdays.map((i) => WD[i]).join(', ') + ' · ~' + p.dur + ' min · ' + esc(GOALS[p.obj].n.toLowerCase()) + '</p></div>';
  h += '<section class="card"><div class="card-h"><h3>Settimana</h3><button class="link" data-a="tab" data-v="cal">Calendario</button></div>' + weekStrip(wp) + '</section>';
  h += '<div class="sec-h"><h3>Le tue schede</h3><span class="muted small">a rotazione</span></div>';
  const nw = nextWid(p, S);
  pr.workouts.forEach((w) => {
    h += '<button class="item" data-a="openWorkout" data-v="' + w.wid + '"><span class="letter ' + (w.wid === nw ? 'solid' : '') + '">' + esc(w.wid) + '</span><div class="f"><div class="t">' + esc(w.name) + (w.wid === nw ? ' <span class="tag ac" style="margin-left:4px">prossima</span>' : '') + '</div><div class="s">~' + totalMin(w) + ' min · ' + w.slots.length + ' esercizi · ' + w.sets + ' serie</div><div class="s">' + w.muscles.map((m) => MUSCLES[m]).join(' · ') + '</div></div><span class="chev">' + ICON.chevR + '</span></button>';
  });
  const ms = muscleSets(pr); const zone = p.obj === 'end' ? [8, 16] : p.obj === 'str' ? [6, 14] : [10, 20];
  const maxv = Math.max(24, Math.max.apply(null, MUSCLE_ORDER.map((k) => ms[k])));
  h += '<div class="sec-h"><h3>Serie a settimana per muscolo</h3></div><section class="card">' +
    MUSCLE_ORDER.filter((k) => k !== 'collo' || ms[k] > 0).map((k) => { const v = ms[k]; const w = clamp(v / maxv * 100, 0, 100); const lo = v < zone[0] && ['pol', 'core', 'fem', 'collo'].indexOf(k) < 0;
      return '<div class="mus"><span>' + MUSCLES[k] + '</span><span class="track"><span class="zone" style="left:' + (zone[0] / maxv * 100) + '%;width:' + ((zone[1] - zone[0]) / maxv * 100) + '%"></span><i class="' + (lo ? 'lo' : '') + '" style="width:' + w + '%"></i></span><b>' + fmtSets(v) + '</b></div>'; }).join('') +
    '<p class="muted tiny" style="margin-top:10px">Serie dirette = 1, serie in cui il muscolo aiuta = ½. La fascia chiara indica il volume tipico per ' + esc(GOALS[p.obj].n.toLowerCase()) + ' (' + zone[0] + '–' + zone[1] + ' serie). Polpacci, femorali e core lavorano anche negli esercizi multiarticolari.</p></section>';
  const p0 = p.equip; const missing = EQUIP_ORDER.filter((k) => !p0[k]).map((k) => EQUIP[k].n.toLowerCase());
  h += '<section class="card row" style="align-items:flex-start"><span class="letter gray">' + ICON.info + '</span><div class="f"><h4 style="margin-bottom:4px">Come si adatta</h4><p class="muted small">Le schede usano solo l’attrezzatura che hai' + (missing.length ? ' (niente ' + esc(missing.join(', ')) + ')' : '') + ' ed evitano gli esercizi esclusi. Puoi sostituire un esercizio o cambiare il numero di serie aprendo una scheda.</p><div class="sp10"></div><button class="btn ghost sm" data-a="tab" data-v="profile">Attrezzatura e preferenze</button></div></section>';
  return h;
}
const fmtSets = (v) => (v % 1 ? fmt1(v) : String(v));

function sheetWorkout(wid) {
  const p = S.profile; const w = resolveWorkout(wid, p, S);
  let h = '<div class="row" style="margin-bottom:6px"><span class="letter solid">' + esc(wid) + '</span><div class="f"><h3>' + esc(w.name) + '</h3><div class="muted small">~' + totalMin(w) + ' min in tutto · ' + w.sets + ' serie</div></div></div>';
  h += '<div class="sp10"></div>';
  w.slots.forEach((s, i) => {
    const e = EX[s.x]; const over = S.plan.over[s.slot] || {};
    h += '<div class="card tight" style="margin-bottom:8px"><div class="row"><span class="letter gray" style="width:34px;height:34px;border-radius:11px;font-size:14px">' + (i + 1) + '</span><div class="f" data-a="openEx" data-v="' + s.x + '" data-ctx="w:' + wid + '" style="cursor:pointer"><div class="b">' + esc(e.n) + '</div><div class="muted small">' + s.sets + ' × ' + rangeTxt(s.r, s.u, s.side) + ' · rec. ' + s.rest + ' s</div></div><button class="icon-btn sm" data-a="openEx" data-v="' + s.x + '" data-ctx="w:' + wid + '" aria-label="Dettagli">' + ICON.info + '</button></div>' +
      '<div class="row" style="margin-top:10px"><div class="row f" style="gap:6px"><button class="icon-btn sm" data-a="setsAdj" data-s="' + s.slot + '" data-v="-1" aria-label="Una serie in meno">' + ICON.minus + '</button><span class="small b" style="min-width:58px;text-align:center">' + plural(s.sets, 'serie', 'serie') + '</span><button class="icon-btn sm" data-a="setsAdj" data-s="' + s.slot + '" data-v="1" aria-label="Una serie in più">' + ICON.plus + '</button></div>' +
      '<button class="btn ghost xs" data-a="swapSheet" data-s="' + s.slot + '" data-w="' + wid + '">' + ICON.swap + 'Sostituisci</button>' +
      ((over.l || over.sets) ? '<button class="btn xs" style="color:var(--mu)" data-a="resetSlot" data-s="' + s.slot + '" data-w="' + wid + '">Ripristina</button>' : '') + '</div></div>';
  });
  h += '<div class="sp10"></div>' + (S.active ? '<button class="btn primary" data-a="resume">Riprendi l’allenamento in corso</button>' : '<button class="btn primary" data-a="start" data-v="' + wid + '">' + ICON.play + 'Inizia questa scheda</button>');
  return h;
}

/* Alternative per uno slot: scale previste dalla scheda + altre con lo stesso muscolo principale. */
function swapOptions(slot) {
  const p = S.profile; const base = EX[LADDERS[slot.l].lv[0].id].m;
  const list = [slot.l].concat(slot.alt || []);
  Object.keys(LADDERS).forEach((k) => { if (list.indexOf(k) < 0 && LADDERS[k].lv.every((l) => l.eq.indexOf('bar') < 0) && EX[LADDERS[k].lv[0].id].m === base) list.push(k); });
  return list.filter((k) => availIds(k, p).length);
}

/* ---------- Esercizi ---------- */
function vLibrary() {
  const p = S.profile; const pr = program(p, S); const inPlan = {};
  pr.workouts.forEach((w) => w.slots.forEach((s) => { (inPlan[s.x] = inPlan[s.x] || []).push(w.wid); }));
  let h = '<div class="page-t"><h1>Esercizi</h1><p class="muted small">' + Object.keys(EX).length + ' esercizi con istruzioni, errori comuni e varianti.</p></div>';
  h += '<div class="search">' + ICON.search + '<input id="libQ" type="search" placeholder="Cerca un esercizio" value="' + esc(lib.q) + '" aria-label="Cerca"></div>';
  h += '<div class="pills"><button class="pill ' + (!lib.m ? 'on' : '') + '" data-a="libMus" data-v="">Tutti</button>' + MUSCLE_ORDER.map((m) => '<button class="pill ' + (lib.m === m ? 'on' : '') + '" data-a="libMus" data-v="' + m + '">' + MUSCLES[m] + '</button>').join('') + '</div>';
  h += '<div class="pills" style="margin-top:-4px"><button class="pill ' + (lib.mine ? 'on' : '') + '" data-a="libMine">' + (lib.mine ? ICON.check.replace('<svg', '<svg width="15" height="15"') : '') + 'Solo la mia attrezzatura</button><button class="pill ' + (lib.plan ? 'on' : '') + '" data-a="libPlan">' + (lib.plan ? ICON.check.replace('<svg', '<svg width="15" height="15"') : '') + 'Nel mio programma</button></div>';
  h += '<div id="libList">' + libList(p, inPlan) + '</div>';
  return h;
}
function libIds() {
  const p = S.profile; const pr = program(p, S); const inPlan = {}; pr.workouts.forEach((w) => w.slots.forEach((q) => { inPlan[q.x] = 1; }));
  return libFilter(p, inPlan);
}
function libList(p, inPlan) {
  const ids = libFilter(p, inPlan);
  return libRender(ids, p, inPlan);
}
function libFilter(p, inPlan) {
  const q = lib.q.trim().toLowerCase();
  return Object.keys(EX).filter((id) => {
    const e = EX[id];
    if (lib.m && e.m !== lib.m && e.s.indexOf(lib.m) < 0) return false;
    if (lib.mine && !isAvail(id, p)) return false;
    if (lib.plan && !inPlan[id]) return false;
    if (q && (e.n + ' ' + LADDERS[e.l].name + ' ' + MUSCLES[e.m]).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function libRender(ids, p, inPlan) {
  if (!ids.length) return '<div class="empty">Nessun esercizio con questi filtri.</div>';
  return ids.map((id) => {
    const e = EX[id]; const ok = isAvail(id, p); const n = LADDERS[e.l].lv.length;
    return '<button class="item ' + (ok ? '' : 'off') + '" data-a="openEx" data-v="' + id + '" data-ctx="lib"><span class="letter ' + (inPlan[id] ? 'solid' : '') + '">' + (inPlan[id] ? esc(inPlan[id][0]) : ICON.muscle) + '</span><div class="f"><div class="t">' + esc(e.n) + '</div><div class="s">' + MUSCLES[e.m] + (n > 1 ? ' · liv. ' + (e.i + 1) + '/' + n : '') + (e.u === 's' ? ' · a tempo' : '') + (ok ? '' : ' · ' + esc(whyUnavail(id, p).join(', '))) + '</div></div>' + (n > 1 ? dots(e.i, n) : '') + '</button>';
  }).join('');
}

function sheetEx(id, ctx) {
  const p = S.profile; const e = EX[id]; const L = LADDERS[e.l]; const n = L.lv.length; const ok = isAvail(id, p);
  const prev = e.i > 0 ? L.lv[e.i - 1].id : null; const next = e.i < n - 1 ? L.lv[e.i + 1].id : null;
  const excluded = p.excl.indexOf(id) >= 0;
  let h = '';
  if (ctx) h += '<div class="exnav"><button class="icon-btn sm" data-a="exSwipe" data-v="-1" ' + (ctx.i > 0 ? '' : 'disabled') + ' aria-label="Esercizio precedente">' + ICON.chevL + '</button><div class="f center">' + (ctx.list.length <= 10 ? '<div class="exdots">' + ctx.list.map((x, i) => '<i class="' + (i === ctx.i ? 'on' : '') + '"></i>').join('') + '</div>' : '<div class="exprog"><i style="width:' + ((ctx.i + 1) / ctx.list.length * 100).toFixed(1) + '%"></i></div>') + '<span class="muted tiny">' + (ctx.i + 1) + ' di ' + ctx.list.length + ' · scorri col dito</span></div><button class="icon-btn sm" data-a="exSwipe" data-v="1" ' + (ctx.i < ctx.list.length - 1 ? '' : 'disabled') + ' aria-label="Esercizio successivo">' + ICON.chevR + '</button></div>';
  h += '<div class="eyebrow">' + esc(L.name) + (n > 1 ? ' · livello ' + (e.i + 1) + ' di ' + n : '') + '</div><h2 style="margin:6px 0 12px">' + esc(e.n) + '</h2>';
  h += '<div class="tags"><span class="tag ac">' + MUSCLES[e.m] + '</span>' + e.s.map((m) => '<span class="tag">' + MUSCLES[m] + '</span>').join('') + (e.u === 's' ? '<span class="tag">' + ICON.clock + 'a tempo</span>' : '') + (e.r ? '<span class="tag">' + rangeTxt(e.r, e.u) + '</span>' : '') + '</div>';
  const an = animBox(id); if (an) h += an + '<p class="anim-note">Animazione indicativa: segui anche i passaggi qui sotto.</p>';
  h += '<p class="desc">' + esc(e.d) + '</p>';
  if (e.pre) h += '<div class="safety" style="background:var(--acd);color:var(--tx2)">' + ICON.target.replace('<svg', '<svg style="color:var(--ac)"') + '<span><b style="color:var(--ac)">Prima di iniziare:</b> ' + esc(e.pre) + '</span></div>';
  h += '<div class="sp16"></div><h4 style="margin-bottom:10px">Esecuzione</h4><ol class="steps">' + e.how.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>';
  h += '<h4 style="margin:16px 0 10px">Errori comuni</h4><ul class="errs">' + e.err.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  h += '<h4 style="margin:16px 0 8px">Attrezzatura</h4><p class="muted small">' + (e.eq.length ? e.eq.map((q) => esc(EQUIP[q].n) + (p.equip[q] ? '' : ' (non ce l’hai)')).join(', ') : 'Nessuna: solo corpo libero.') + '</p>';
  const safe = safetyNote(e); if (safe) h += '<div class="safety">' + ICON.warn + '<span>' + esc(safe) + '</span></div>';
  if (!ok && !excluded) h += '<div class="safety">' + ICON.info + '<span>Non è nel tuo programma: ' + esc(whyUnavail(id, p).join(', ')) + '.</span></div>';
  // Varianti e alternative
  const vv = []; if (prev) vv.push(['Più facile', prev]); if (next) vv.push(['Più difficile', next]);
  if (vv.length) h += '<h4 style="margin:18px 0 10px">Varianti</h4>' + vv.map((x) => '<button class="item" data-a="openEx" data-v="' + x[1] + '"><span class="letter gray">' + (x[0] === 'Più facile' ? ICON.down : ICON.up) + '</span><div class="f"><div class="s">' + x[0] + '</div><div class="t">' + esc(EX[x[1]].n) + '</div></div><span class="chev">' + ICON.chevR + '</span></button>').join('');
  const alts = Object.keys(LADDERS).filter((k) => k !== e.l && EX[LADDERS[k].lv[0].id].m === e.m).map((k) => LADDERS[k].lv[0].id).slice(0, 4);
  if (alts.length) h += '<h4 style="margin:18px 0 10px">Alternative per ' + MUSCLES[e.m].toLowerCase() + '</h4>' + alts.map((a) => '<button class="item ' + (isAvail(a, p) ? '' : 'off') + '" data-a="openEx" data-v="' + a + '"><span class="letter gray">' + ICON.swap + '</span><div class="f"><div class="t">' + esc(EX[a].n) + '</div><div class="s">' + esc(LADDERS[EX[a].l].name) + '</div></div><span class="chev">' + ICON.chevR + '</span></button>').join('');
  const hist = exHistory(id, S);
  if (hist.length) {
    const best = bestSet(id, S); const last = hist[hist.length - 1];
    h += '<h4 style="margin:18px 0 10px">I tuoi risultati</h4><div class="grid2">' + tile('trophy', 'miglior serie', best + ' <small>' + unit(e.u) + '</small>') + tile('repeat', 'ultima volta · ' + fmtD(last.d), last.reps.map((r) => (r == null ? '–' : r)).join('·')) + '</div>';
  }
  h += '<div class="sp16"></div><button class="btn ' + (excluded ? 'primary' : 'ghost') + '" data-a="exclToggle" data-v="' + id + '">' + (excluded ? 'Rimetti nel programma' : 'Non posso farlo: escludilo') + '</button>';
  return h;
}
function safetyNote(e) {
  if (e.eq.indexOf('table') >= 0) return 'Usa solo un tavolo pesante e stabile. Prima di iniziare tira piano dal bordo: se si solleva o si sposta, scegli il rematore con zaino o con elastico.';
  if (e.l === 'dip') return 'Esercizio facoltativo e non incluso nelle schede: carica molto le spalle e richiede due sedie identiche, pesanti, senza ruote, appoggiate a un muro o a un mobile. Se qualcosa si muove o senti fastidio alla spalla, usa i piegamenti stretti.';
  if (e.eq.indexOf('chair') >= 0) return 'Sedia senza ruote, appoggiata al muro su un pavimento che non scivola. Non usare sedie pieghevoli o traballanti.';
  if (e.eq.indexOf('sofa') >= 0) return 'Il mobile deve essere pesante e non spostarsi: controllalo prima della prima serie.';
  if (e.eq.indexOf('band') >= 0 && /porta/.test(e.d + e.how.join(' '))) return 'Ancora l’elastico solo a una porta chiusa a chiave, dal lato in cui si chiude, e controlla che non sia consumato.';
  if (e.st.length) return 'Sollecita ' + e.st.map((z) => STRESS[z].toLowerCase()).join(' e ') + ': riscaldati bene e fermati se senti dolore (non fatica).';
  return '';
}

/* ---------- Progressi ---------- */
function vProgress() {
  const p = S.profile; const w = S.weights;
  const totMin = S.sessions.reduce((t, s) => t + (s.dur || 0), 0);
  let h = '<div class="page-t"><h1>Progressi</h1><p class="muted small">Solo dati che hai registrato tu.</p></div>';
  h += '<div class="grid3">' + tile('repeat', 'allenamenti', String(S.sessions.length)) + tile('clock', 'tempo totale', totMin >= 60 ? (Math.floor(totMin / 60) + '<small>h ' + (totMin % 60) + 'm</small>') : (totMin + '<small>min</small>')) + tile('flame', 'settimane di fila', String(streakWeeks(p, S))) + '</div>';

  const wk = weekBuckets(S, 8);
  const mode = pmode;
  const vals = wk.map((b) => (mode === 'reps' ? b.reps : mode === 'min' ? b.min : b.n));
  h += '<div class="sp10"></div><section class="card"><div class="card-h"><h3>Ultime 8 settimane</h3></div>' + seg('pMode', [['n', 'Allenamenti'], ['reps', 'Ripetizioni'], ['min', 'Minuti']], mode, 'pMode') + '<div class="sp16"></div>' +
    (S.sessions.length ? barChart(vals, wk.map((b) => b.d.getDate() + '/' + (b.d.getMonth() + 1)), { label: 'Andamento settimanale' }) : '<div class="empty">Dopo il primo allenamento qui vedrai l’andamento.</div>') +
    '<p class="muted tiny" style="margin-top:8px">Ogni barra è una settimana, indicata dal lunedì. ' + (mode === 'reps' ? 'Le ripetizioni sommano solo gli esercizi a ripetizioni (non quelli a tempo).' : '') + '</p></section>';

  // Costanza
  const done = {}; S.sessions.forEach((s) => { done[s.d] = 1; });
  const ws = weekStart(new Date()); ws.setDate(ws.getDate() - 7 * 7); const tk = today(); let cells = '';
  for (let i = 0; i < 56; i++) { const d = new Date(ws); d.setDate(ws.getDate() + i); const k = dkey(d); cells += '<i class="' + (done[k] ? 'on ' : '') + (k === tk ? 'today ' : '') + (k > tk ? 'fut' : '') + '" title="' + k + '"></i>'; }
  h += '<section class="card"><div class="card-h"><h3>Costanza</h3><span class="tag">obiettivo ' + p.wdays.length + '/sett.</span></div><div class="heat-l">' + WD1.map((x) => '<span>' + x + '</span>').join('') + '</div><div class="heat">' + cells + '</div></section>';

  // Peso
  h += '<section class="card"><div class="card-h"><div><div class="eyebrow">Peso corporeo</div><h3 style="margin-top:4px">' + fmt1(curWeight()) + ' kg</h3></div><button class="btn ghost sm" data-a="weightSheet">' + ICON.plus + 'Peso</button></div>' +
    lineChart(w.map((e) => ({ x: dayN(e.d), y: e.kg })), { goal: p.goal, l0: w.length ? fmtD(w[0].d) : '', l1: w.length ? fmtD(w[w.length - 1].d) : '', label: 'Andamento del peso' });
  if (w.length) h += '<div class="sp10"></div>' + w.slice(-4).reverse().map((e) => '<div class="lrow"><div class="f">' + fmtD(e.d) + '</div><b>' + fmt1(e.kg) + ' kg</b><button class="icon-btn sm" data-a="delWeightAsk" data-v="' + e.d + '" aria-label="Elimina misurazione">' + ICON.x + '</button></div>').join('');
  h += '</section>';

  h += measuresCard();

  // Esercizi del programma
  const pr = program(p, S); const seen = {};
  h += '<div class="sec-h"><h3>Esercizi</h3><span class="muted small">tocca per lo storico</span></div>';
  let any = false;
  pr.workouts.forEach((wo) => wo.slots.forEach((s) => {
    if (seen[s.x]) return; seen[s.x] = 1;
    const e = EX[s.x]; const hist = exHistory(s.x, S); const last = hist[hist.length - 1]; const n = LADDERS[e.l].lv.length;
    if (hist.length) any = true;
    h += '<button class="item" data-a="exHist" data-v="' + s.x + '"><span class="letter">' + esc(wo.wid) + '</span><div class="f"><div class="t">' + esc(e.n) + '</div><div class="s">' + (n > 1 ? 'liv. ' + (e.i + 1) + '/' + n + ' · ' : '') + (last ? 'ultima: ' + last.reps.map((r) => (r == null ? '–' : r)).join('·') + ' ' + unit(e.u) : 'non ancora fatto') + '</div></div>' + spark(hist.slice(-10).map((x) => x.reps.reduce((t, r) => t + (r || 0), 0))) + '</button>';
  }));
  if (!any) h += '<p class="muted small" style="margin:0 4px 10px">Dopo il primo allenamento vedrai livello, ultime ripetizioni e andamento di ogni esercizio.</p>';

  // Record
  const recs = records();
  if (recs.length) h += '<div class="sec-h"><h3>Record personali</h3></div><section class="card">' + recs.slice(0, 8).map((r) => '<div class="lrow"><span class="letter">' + ICON.trophy + '</span><div class="f"><div class="t">' + esc(EX[r.x].n) + '</div><div class="muted small">' + fmtD(r.d) + '</div></div><b>' + r.v + ' ' + unit(EX[r.x].u) + '</b></div>').join('') + '<p class="muted tiny" style="margin-top:10px">Miglior serie per ogni esercizio, solo per quelli fatti almeno 2 volte.</p></section>';

  // Storico
  h += '<div class="sec-h"><h3>Storico</h3><span class="muted small">' + plural(S.sessions.length, 'allenamento', 'allenamenti') + '</span></div>';
  h += S.sessions.length ? S.sessions.slice(-15).map((s, i, arr) => sessionItem(s, S.sessions.length - arr.length + i)).reverse().join('') : '<div class="empty">Nessun allenamento ancora.</div>';
  return h;
}

function records() {
  const best = {}; const cnt = {};
  S.sessions.forEach((s) => s.ex.forEach((e) => { cnt[e.x] = (cnt[e.x] || 0) + 1; e.reps.forEach((r) => { if (r != null && (!best[e.x] || r > best[e.x].v)) best[e.x] = { x: e.x, v: r, d: s.d }; }); }));
  return Object.keys(best).filter((x) => cnt[x] >= 2 && EX[x]).map((x) => best[x]).sort((a, b) => (a.d < b.d ? 1 : -1));
}

function sheetExHist(id) {
  const e = EX[id]; const hist = exHistory(id, S);
  let h = '<div class="eyebrow">Storico esercizio</div><h2 style="margin:6px 0 14px">' + esc(e.n) + '</h2>';
  if (!hist.length) return h + '<div class="empty">Non l’hai ancora fatto.</div><button class="btn ghost" data-a="openEx" data-v="' + id + '">Come si esegue</button>';
  const pts = hist.map((x, i) => ({ x: i, y: Math.max.apply(null, x.reps.map((r) => r || 0)) }));
  h += '<div class="card"><div class="muted small" style="margin-bottom:8px">Miglior serie per allenamento (' + unit(e.u) + ')</div>' + lineChart(pts, { int: true, minSpan: 4, l0: fmtD(hist[0].d), l1: fmtD(hist[hist.length - 1].d), empty: 'Servono almeno 2 allenamenti per il grafico.' }) + '</div>';
  h += '<div class="card">' + hist.slice(-8).reverse().map((x) => '<div class="lrow"><div class="f"><div class="t">' + x.reps.map((r) => (r == null ? '–' : r)).join(' · ') + ' <span class="muted small">' + unit(e.u) + '</span></div><div class="muted small">' + fmtD(x.d) + (x.load ? ' · zaino ' + fmt1(x.load) + ' kg' : '') + (x.rir && x.rir.some((r) => r != null) ? ' · RIR ' + x.rir.map((r) => (r == null ? '–' : r)).join('/') : '') + '</div></div></div>').join('') + '</div>';
  h += '<p class="muted tiny">Il confronto è solo con lo stesso esercizio: varianti diverse non sono equivalenti.</p><div class="sp10"></div><button class="btn ghost" data-a="openEx" data-v="' + id + '">Come si esegue</button>';
  return h;
}

function sheetSession(idx) {
  const s = S.sessions[idx]; if (!s) return '';
  let h = '<div class="row"><span class="letter solid">' + esc(s.wid) + '</span><div class="f"><h3>' + esc(s.wname) + '</h3><div class="muted small">' + esc(cap(fmtDL(s.d))) + '</div></div></div><div class="sp16"></div>';
  h += '<div class="grid3">' + tile('clock', 'minuti', String(s.dur)) + tile('repeat', 'ripetizioni', String(s.vol)) + tile('dumb', 'esercizi', String(s.ex.length)) + '</div><div class="sp10"></div>';
  if (s.check && (s.check.energy === 'low' || s.check.legs)) h += '<p class="adapt">Adattato: ' + [s.check.energy === 'low' ? 'energia bassa' : '', s.check.legs ? 'gambe stanche' : ''].filter(Boolean).join(', ') + '</p><div class="sp10"></div>';
  h += '<div class="card">' + s.ex.map((e) => { const x = EX[e.x]; return '<div class="lrow"><div class="f"><div class="t">' + esc(x ? x.n : e.x) + '</div><div class="muted small">' + e.reps.map((r) => (r == null ? '–' : r)).join(' · ') + ' ' + unit(e.u) + (e.load ? ' · zaino ' + fmt1(e.load) + ' kg' : '') + (e.rir && e.rir.some((r) => r != null) ? ' · RIR ' + e.rir.map((r) => (r == null ? '–' : r)).join('/') : '') + '</div></div></div>'; }).join('') + '</div>';
  if (s.ups && s.ups.length) h += '<p class="small" style="margin-bottom:12px"><span class="ac">Livelli saliti:</span> ' + esc(s.ups.join(', ')) + '</p>';
  h += '<button class="btn danger" data-a="delSessionAsk" data-v="' + idx + '">' + ICON.trash + 'Elimina questo allenamento</button>';
  return h;
}

/* ---------- Profilo ---------- */
function vProfile() {
  const p = S.profile; const d = p;
  let h = '<div class="page-t row"><div class="avatar lg">' + esc(initial(d.name)) + '</div><div class="f"><h1 style="font-size:26px">' + esc(d.name || 'Profilo') + '</h1><p class="muted small">' + esc(LEVELS[d.level]) + ' · ' + esc(GOALS[d.obj].n) + ' · ' + d.wdays.length + ' giorni</p></div></div>';
  h += '<div class="sec-h"><h3>Dati personali</h3></div><section class="card">' + field('fName', 'Nome', 'text', d.name, 'Come ti chiami?') +
    '<div class="grid2">' + field('fH', 'Altezza (cm)', 'number', d.height) + field('fG', 'Peso obiettivo (kg)', 'number', d.goal, '', '0.1') + '</div><p class="muted tiny">Il peso attuale si registra dal pulsante bilancia nella schermata Oggi.</p></section>';
  h += '<div class="sec-h"><h3>Allenamento</h3></div><section class="card">' +
    '<div class="field"><label>Obiettivo</label>' + seg('pObj', Object.keys(GOALS).map((k) => [k, GOALS[k].n.split(' ')[0] === 'Massa' ? 'Massa' : GOALS[k].n.split(' ')[0]]), d.obj, 'pPick') + '<p class="muted tiny" style="margin:8px 4px 0">' + esc(GOALS[d.obj].d) + '</p></div>' +
    '<div class="field"><label>Livello</label>' + seg('pLevel', Object.keys(LEVELS).map((k) => [k, LEVELS[k]]), d.level, 'pPick') + '</div>' +
    '<div class="field"><label>Durata per allenamento</label>' + seg('pDur', [[30, '30 min'], [45, '45 min'], [60, '60 min']], d.dur, 'pPick') + '</div>' +
    toggle('pNeck', !!d.neck, 'Allena anche il collo', 'Circa 6 minuti alla fine di ogni allenamento', 'pNeck') + '</section>' +
    '<button class="item" data-a="tab" data-v="cal"><span class="letter">' + ICON.cal + '</span><div class="f"><div class="t">Calendario: allenamenti e partite</div><div class="s">' + d.wdays.map((i) => WD[i]).join(', ') + ' · ' + plural(((d.matchDates || []).filter((x) => x >= today())).length, 'partita in programma', 'partite in programma') + '</div></div><span class="chev">' + ICON.chevR + '</span></button>';
  h += '<div class="sec-h"><h3>Attrezzatura</h3></div><section class="card">' + EQUIP_ORDER.map((k) => toggle('eq_' + k, d.equip[k], EQUIP[k].n, EQUIP[k].d, 'pEq')).join('') + '</section>';
  h += '<div class="sec-h"><h3>Zone da proteggere</h3></div><section class="card"><p class="muted small" style="margin-bottom:12px">Gli esercizi che le sollecitano molto vengono sostituiti.</p><div class="tags">' + Object.keys(STRESS).map((k) => '<button class="pill ' + (d.avoid.indexOf(k) >= 0 ? 'on' : '') + '" data-a="pAvoid" data-v="' + k + '">' + STRESS[k] + '</button>').join('') + '</div>' +
    (d.excl.length ? '<div class="sp16"></div><h4 style="margin-bottom:8px">Esercizi esclusi</h4>' + d.excl.filter((x) => EX[x]).map((x) => '<div class="lrow"><div class="f">' + esc(EX[x].n) + '</div><button class="btn ghost xs" data-a="pUnexcl" data-v="' + x + '">Rimetti</button></div>').join('') : '') + '</section>';
  h += '<div class="sec-h"><h3>Preferenze</h3></div><section class="card">' + toggle('setSound', S.settings.sound, 'Suono a fine recupero', 'Tre bip quando il timer finisce', 'setTog') + toggle('setVibrate', S.settings.vibrate, 'Vibrazione', 'Sui telefoni che la supportano', 'setTog') + toggle('setNutri', S.settings.nutri !== false, 'Consigli sull’alimentazione', 'Scheda informativa nella schermata Oggi', 'setTog') +
    toggle('setVoice', S.settings.voice !== false, 'Guida vocale', 'Conto alla rovescia e nome del prossimo esercizio', 'setTog') +
    toggle('setWarm', S.settings.warm !== false, 'Riscaldamento guidato', 'Circa ' + routineMin('warm') + ' minuti prima di ogni allenamento', 'setTog') +
    toggle('setCool', S.settings.cool !== false, 'Defaticamento guidato', 'Circa ' + routineMin('cool') + ' minuti di allungamento alla fine', 'setTog') + '</section>' +
    '<button class="item" data-a="calSheet"><span class="letter">' + ICON.cal + '</span><div class="f"><div class="t">Promemoria nel calendario</div><div class="s">Allenamenti, pesate, misure e backup</div></div><span class="chev">' + ICON.chevR + '</span></button>' +
    '<button class="item" data-a="safetyShow"><span class="letter">' + ICON.heart + '</span><div class="f"><div class="t">Avvertenze di sicurezza</div><div class="s">Quando fermarti, cosa controllare</div></div><span class="chev">' + ICON.chevR + '</span></button>';
  h += '<p class="muted tiny center" style="margin:4px 0 0">Le modifiche si salvano subito e aggiornano il programma.</p>';
  if (deferredInstall) h += '<div class="sp10"></div><button class="btn ghost" data-a="install">' + ICON.phone + 'Installa l’app sul telefono</button>';
  h += '<div class="sec-h"><h3>I tuoi dati</h3></div><section class="card"><p class="muted small" style="margin-bottom:14px">I dati restano solo su questo telefono. Fai un backup ogni tanto: il file si può reimportare anche su un altro telefono.</p>' +
    '<p class="muted tiny" style="margin:-6px 0 12px">Ultimo backup: ' + (S.meta.lastBackup ? esc(fmtD(S.meta.lastBackup)) : 'mai') + '</p><div class="grid2"><button class="btn ghost" data-a="export">' + ICON.dl + 'Salva backup</button><button class="btn ghost" data-a="import">' + ICON.ul + 'Importa</button></div>' +
    '<div class="sp10"></div><button class="btn danger" data-a="resetAsk">Cancella tutti i dati</button></section>';
  h += '<p class="muted tiny center" style="margin:10px 0 6px">Leva · versione ' + APP_VERSION + '</p>';
  return h;
}

/* ---------- Onboarding ---------- */
const OB_STEPS = 7;
function vOnboard() {
  const d = ob.d; const st = ob.step;
  if (st === 0) {
    return '<div class="ob-hero"><img class="logo" src="icon-192.png" alt=""><h1>Il tuo personal trainer, a casa</h1><p class="muted" style="margin:12px 0 26px">Un programma a corpo libero costruito su di te, che diventa più difficile quando tu diventi più forte.</p></div>' +
      [['cal', 'Programma su misura', 'In base a giorni, durata e attrezzatura'], ['up', 'Progressione automatica', 'Sali di livello quando sei pronto'], ['chart', 'Progressi reali', 'Solo dati che registri tu, sul tuo telefono']].map((f) => '<div class="ob-feat"><span class="letter">' + ICON[f[0]] + '</span><div><b>' + f[1] + '</b><div class="muted small">' + f[2] + '</div></div></div>').join('') +
      '<div class="foot"><div class="in"><button class="btn primary" data-a="obNext">Iniziamo</button></div></div>' +
      '<p class="center small" style="margin-top:22px"><button class="link" data-a="import">Hai un backup? Importalo</button></p>';
  }
  let h = '<div class="ob-top"><button class="icon-btn sm" data-a="obBack" aria-label="Indietro">' + ICON.chevL + '</button><div class="ob-dots">' + Array.from({ length: OB_STEPS - 1 }, (_, i) => '<i class="' + (i < st ? 'on' : '') + '"></i>').join('') + '</div></div>';
  if (st === 1) {
    h += '<h1>Parliamo di te</h1><p class="muted" style="margin:8px 0 22px">Servono per seguire il peso e calcolare i consigli.</p>' +
      field('fName', 'Nome', 'text', d.name, 'Come ti chiami?') + '<div class="grid2">' + field('fH', 'Altezza (cm)', 'number', d.height) + field('fW', 'Peso attuale (kg)', 'number', d.weight, '', '0.1') + '</div>' + field('fG', 'Peso obiettivo (kg)', 'number', d.goal, '', '0.1');
  } else if (st === 2) {
    h += '<h1>Qual è il tuo obiettivo?</h1><p class="muted" style="margin:8px 0 22px">Cambia ripetizioni, recuperi e varianti.</p>' +
      Object.keys(GOALS).map((k) => opt('obObj', k, d.obj === k, GOALS[k].n, GOALS[k].d)).join('') +
      '<div class="sp10"></div><h3 style="margin-bottom:12px">Il tuo livello</h3>' + Object.keys(LEVELS).map((k) => opt('obLevel', k, d.level === k, LEVELS[k], k === 'beg' ? 'Meno di 6 mesi di allenamento costante' : k === 'int' ? 'Fai piegamenti e squat con buona tecnica' : 'Più di 2 anni, varianti difficili')).join('');
  } else if (st === 3) {
    h += '<h1>Quando ti alleni?</h1><p class="muted" style="margin:8px 0 22px">Scegli da 2 a 4 giorni, meglio non consecutivi.</p>' + daysPicker('obDays', d.wdays) +
      '<p class="muted small center" style="margin:12px 0 26px">' + (d.wdays.length >= 2 ? esc(SPLITS[clamp(d.wdays.length, 2, 4)].name) + ' · ' + d.wdays.map((i) => WD[i]).join(', ') : 'Seleziona almeno 2 giorni') + '</p>' +
      '<h3 style="margin-bottom:12px">Quanto tempo hai?</h3>' + [[30, 'Circa 30 minuti', 'Solo gli esercizi fondamentali'], [45, 'Circa 45 minuti', 'Fondamentali e complementari'], [60, 'Circa 60 minuti', 'Più serie sui fondamentali']].map((o) => opt('obDur', o[0], d.dur === o[0], o[1], o[2])).join('') +
      '<div class="sp10"></div><h3 style="margin-bottom:6px">Giochi partite? <span class="muted small">(facoltativo)</span></h3><p class="muted small" style="margin-bottom:12px">Per esempio calcio: vicino alle partite le gambe lavorano un po’ meno.</p>' + daysPicker('obMatch', d.match || [], 'matchPick');
  } else if (st === 4) {
    h += '<h1>Cosa hai in casa?</h1><p class="muted" style="margin:8px 0 22px">Il programma userà solo queste cose. Puoi cambiarle quando vuoi.</p><section class="card">' + EQUIP_ORDER.map((k) => toggle('eq_' + k, d.equip[k], EQUIP[k].n, EQUIP[k].d, 'obEq')).join('') + '</section>';
  } else if (st === 5) {
    h += '<h1>Qualche fastidio?</h1><p class="muted" style="margin:8px 0 22px">Gli esercizi che sollecitano molto queste zone verranno sostituiti. Se hai dolore vero, chiedi prima a un medico.</p><div class="tags">' +
      Object.keys(STRESS).map((k) => '<button class="pill ' + (d.avoid.indexOf(k) >= 0 ? 'on' : '') + '" data-a="obAvoid" data-v="' + k + '">' + STRESS[k] + '</button>').join('') + '</div><p class="muted small" style="margin-top:16px">' + (d.avoid.length ? '' : 'Nessuna zona selezionata: va benissimo.') + '</p>';
  } else {
    const tmp = Object.assign(fresh(), { profile: d }); const pr = program(d, tmp);
    h += '<h1>Il tuo programma è pronto</h1><p class="muted" style="margin:8px 0 22px">' + esc(pr.name) + ' · ' + d.wdays.map((i) => WD[i]).join(', ') + ' · ~' + d.dur + ' min</p>' +
      pr.workouts.map((w) => '<div class="item"><span class="letter solid">' + esc(w.wid) + '</span><div class="f"><div class="t">' + esc(w.name) + '</div><div class="s">' + w.slots.length + ' esercizi · ' + w.sets + ' serie · ~' + (w.min + (ob.d && S.settings.warm !== false ? routineMin('warm') + routineMin('cool') : 0)) + ' min</div><div class="s">' + w.slots.slice(0, 3).map((s) => esc(EX[s.x].n)).join(', ') + '…</div></div></div>').join('');
    h += '<div class="sp16"></div><section class="card"><h4 style="margin-bottom:8px">Prima di iniziare</h4><p class="muted small">' + esc(SAFETY[0][2]) + ' ' + esc(SAFETY[1][2]) + ' ' + esc(SAFETY[2][2]) + '</p></section>' +
      '<button class="opt ' + (ob.safe ? 'on' : '') + '" data-a="obSafe"><div class="f"><b>Ho letto e ho capito</b><span class="muted small">Mi alleno sotto la mia responsabilità e mi fermo se sento dolore.</span></div><span class="ck">' + ICON.check + '</span></button>';
  }
  const last = st === OB_STEPS - 1;
  h += '<div class="foot"><div class="in"><button class="btn primary" data-a="' + (last ? 'obFinish' : 'obNext') + '">' + (last ? 'Inizia con Leva' : 'Continua') + '</button></div></div>';
  return h;
}
function opt(act, v, on, title, sub) { return '<button class="opt ' + (on ? 'on' : '') + '" data-a="' + act + '" data-v="' + v + '"><div class="f"><b>' + esc(title) + '</b><span class="muted small">' + esc(sub) + '</span></div><span class="ck">' + ICON.check + '</span></button>'; }

/* ---------- Sessione ---------- */
function vSession() {
  if (S.active.rt && S.active.phase !== 'main') return vRoutine();
  const a = S.active; const e = a.ex[a.idx]; const x = EX[e.x]; const L = LADDERS[x.l]; const u = x.u;
  const doneSets = a.ex.reduce((t, q) => t + q.sets.filter((s) => s.done).length, 0); const all = a.ex.reduce((t, q) => t + q.sets.length, 0);
  const tg = (s) => (s.t != null ? s.t : s.v);
  const cur = e.sets.findIndex((s) => !s.done); const n = e.sets.length; const lastEx = a.idx === a.ex.length - 1;
  const sideWord = /per gamba/.test(doTxt(1, 1, u, true, x.l)) ? 'gamba' : 'lato';
  const t0 = tg(e.sets[cur >= 0 ? cur : 0]); const tp = tempoOf(e.x);
  const restTxt = (sec) => (sec >= 60 && sec % 60 === 0 ? (sec / 60) + (sec === 60 ? ' minuto' : ' minuti') : sec >= 60 ? '1 min e ' + (sec - 60) + ' s' : sec + ' secondi');
  let h = '<div class="sess-top"><button class="icon-btn" data-a="sessMenu" aria-label="Menu allenamento">' + ICON.x + '</button><div><div class="eyebrow center">' + esc(a.wname) + '</div><div class="clock" id="elapsed">' + mmss(elapsedSec()) + '</div></div>' +
    '<button class="icon-btn" data-a="pause" aria-label="Pausa">' + ICON.pause + '</button></div>';
  h += '<div class="prog-top"><i style="width:' + (all ? doneSets / all * 100 : 0).toFixed(1) + '%"></i></div>';
  h += '<div class="row"><div class="f"><div class="eyebrow">' + (e.neck ? 'Collo · ' : '') + 'Esercizio ' + (a.idx + 1) + ' di ' + a.ex.length + '</div></div><button class="link" data-a="exList">Tutti gli esercizi</button></div>';
  h += '<h1 class="ex-name">' + esc(x.n) + '</h1>';

  // 1. L'omino che lo esegue
  h += animBox(e.x);

  // 2. Come eseguirlo
  h += '<section class="todo"><div class="eyebrow" style="color:var(--ac)">Come eseguirlo</div><div class="todo-rows" style="margin-top:10px">' +
    '<div><span>' + ICON.target + '</span><div><b>Intensità:</b> ' + esc(e.neck ? 'forza moderata, movimenti lenti; fermati se senti dolore o giramenti di testa.' : (GOAL_HOW[S.profile.obj] || GOAL_HOW.hyp).replace(/^[^:]+: /, '')) + '</div></div>' +
    (u === 's' ? '<div><span>' + ICON.clock + '</span><div><b>Posizione:</b> tienila ferma, respirando normalmente.</div></div>' : '<div><span>' + ICON.repeat + '</span><div><b>Ritmo:</b> ' + esc(tempoTxt(tp)) + '</div></div>') +
    (e.side ? '<div><span>' + ICON.swap + '</span><div><b>Per ' + sideWord + ':</b> prima tutte le ripetizioni con un' + (sideWord === 'gamba' ? 'a gamba' : ' lato') + ', poi con l’altr' + (sideWord === 'gamba' ? 'a' : 'o') + ' = 1 serie.</div></div>' : '') +
    '</div></section>';
  if (e.adapt) h += '<p class="adapt">' + esc(e.adapt) + '</p>';

  // 3. Quanto: serie, ripetizioni, riposo e serie corrente
  h += '<section class="now' + (cur < 0 ? ' done' : '') + '"><div class="now-plan">' + esc(doTxt(n, t0, u, e.side, x.l)) + '</div>' +
    '<div class="muted small">Riposo: ' + restTxt(e.rest) + ' tra le serie' + (lastEx ? '' : ' · ' + restTxt(restBetween(e.rest)) + ' prima del prossimo esercizio') + '</div>' +
    '<div class="now-h" style="margin-top:14px"><span class="eyebrow">' + (cur >= 0 ? 'Adesso: serie ' + (cur + 1) + ' di ' + n : 'Esercizio completato') + '</span><span class="sdots">' + e.sets.map((q, k) => '<i class="' + (q.done ? 'on' : k === cur ? 'cur' : '') + '"></i>').join('') + '</span></div>';
  if (cur >= 0) {
    const s = e.sets[cur];
    h += '<div class="now-goal">' + (u === 's' ? 'Tieni <b>' + tg(s) + '</b> secondi' : 'Fai <b>' + tg(s) + '</b> ripetizioni') + (e.side ? ' <span>per ' + sideWord + '</span>' : '') + '</div>' +
      (u === 's' ? '<button class="btn black-ac" data-a="holdStart" data-s="' + cur + '">' + ICON.play + 'Avvia il timer</button>' : (tp.neg ? '' : '<button class="btn black-ac" data-a="tempoStart" data-s="' + cur + '">' + ICON.play + 'Guidami il ritmo (con la voce)</button>')) +
      '<div class="now-adj"><span class="muted small">' + (u === 's' ? 'Secondi fatti' : 'Ne hai fatte di più o di meno? Correggi:') + '</span><div class="stepper" style="flex:none"><button data-a="step" data-s="' + cur + '" data-v="-1" aria-label="Meno">' + ICON.minus + '</button><span class="v">' + s.v + '</span><button data-a="step" data-s="' + cur + '" data-v="1" aria-label="Più">' + ICON.plus + '</button></div></div>';
  } else h += '<div class="now-goal" style="margin-bottom:0">' + ICON.check.replace('<svg', '<svg width="26" height="26" style="vertical-align:-5px;color:var(--ac)"') + ' ' + e.sets.map((q) => q.v).join(' · ') + (u === 's' ? ' s' : ' rip') + '</div>';
  h += '</section>';

  // 4. Tutto il resto
  h += '<div class="slist">' + e.sets.map((s, k) => '<div class="srow ' + (s.done ? 'ok' : k === cur ? 'cur' : '') + '"><span>Serie ' + (k + 1) + '</span><b>' + (s.done ? s.v + (u === 's' ? ' s' : ' rip') + (s.rir != null ? ' <small>· ' + (s.rir >= 4 ? '4+' : s.rir) + ' in serbo</small>' : '') : 'obiettivo ' + tg(s) + (u === 's' ? ' s' : '')) + '</b>' +
    (s.done ? '<button class="link small" data-a="setDone" data-s="' + k + '">Annulla</button>' : '<span></span>') + '</div>').join('') + '</div>';
  const hist = exHistory(e.x, S); const last = hist[hist.length - 1];
  if (last) h += '<p class="muted small" style="margin:10px 4px 0">' + ICON.target.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"') + ' L’ultima volta (' + fmtD(last.d) + '): ' + last.reps.map((r) => (r == null ? '–' : r)).join(' · ') + (u === 's' ? ' secondi' : ' ripetizioni') + '</p>';
  h += '<div class="sec-h"><h3>Altre informazioni</h3><button class="link" data-a="openEx" data-v="' + e.x + '" data-ctx="s">Istruzioni complete</button></div><p class="desc" style="margin-top:0">' + esc(x.d) + '</p>';
  if (e.note) h += '<p class="note">' + esc(e.note) + '</p>';
  h += '<ul class="todo-list" style="margin-top:10px"><li>' + (u === 's' ? 'Se non ce la fai, fermati prima e segna i secondi fatti.' : 'Se ce la fai puoi arrivare fino a ' + e.r[1] + '; se non arrivi a ' + t0 + ', segna quante ne hai fatte: va bene lo stesso.') + '</li><li>Il timer del recupero parte da solo dopo ogni serie.</li></ul>';
  if (x.eq.indexOf('backpack') >= 0) h += '<div class="load"><div class="f">Peso nello zaino <span class="muted tiny">(facoltativo)</span></div><div class="stepper" style="flex:none"><button data-a="loadStep" data-v="-0.5" aria-label="Meno peso">' + ICON.minus + '</button><span class="v" style="font-size:19px;min-width:64px">' + (e.load ? fmt1(e.load) : '–') + '<small>kg</small></span><button data-a="loadStep" data-v="0.5" aria-label="Più peso">' + ICON.plus + '</button></div></div>';
  const ids = L.lv.map((l) => l.id);
  if (ids.length > 1) {
    const prev = nextAvail(e.x, S.profile, -1), next = nextAvail(e.x, S.profile, 1);
    h += '<section class="card tight" style="margin-top:14px"><div class="small b" style="margin-bottom:8px">Troppo facile o troppo difficile?</div><div class="row">' +
      '<button class="btn ghost xs f" data-a="lvl" data-v="-1" ' + (prev ? '' : 'disabled') + '>' + ICON.down + 'Più facile</button><span class="tag">Livello ' + (x.i + 1) + ' di ' + ids.length + '</span>' +
      '<button class="btn ghost xs f" data-a="lvl" data-v="1" ' + (next ? '' : 'disabled') + '>' + ICON.up + 'Più difficile</button></div></section>';
  }
  // Barra fissa: l'azione principale è sempre visibile
  const back = a.idx > 0 ? '<button class="btn ghost" data-a="exNav" data-v="-1" aria-label="Esercizio precedente">' + ICON.chevL + '</button>' : '';
  let main;
  if (cur >= 0) { const s = e.sets[cur]; main = '<button class="btn primary" data-a="setDone" data-s="' + cur + '">' + ICON.check + 'Serie ' + (cur + 1) + ' fatta · ' + s.v + (u === 's' ? ' s' : ' rip') + '</button>'; }
  else if (lastEx) main = '<button class="btn primary" data-a="finishAsk">' + ICON.check + 'Termina allenamento</button>';
  else main = '<button class="btn primary" data-a="exNav" data-v="1">Prossimo esercizio' + ICON.chevR + '</button>';
  h += '<div class="foot"><div class="in">' + back + main + '</div></div>';
  return h;
}

/* ---------- Riepilogo ---------- */
function vSummary() {
  const sm = summary; const s = sm.s;
  const sets = s.ex.reduce((n, e) => n + e.reps.filter((r) => r != null).length, 0); const planned = sm.planned;
  let h = '<div class="done-hero"><div class="done-ic">' + ICON.check + '</div><div class="eyebrow">' + esc(s.wname) + '</div><h1 style="margin-top:6px">Allenamento completato!</h1><p class="muted" style="margin-top:8px">' + esc(sm.cmp || 'Ottimo lavoro: ogni serie conta.') + '</p></div><div class="sp16"></div>';
  h += '<div class="grid2">' + tile('clock', 'durata', s.dur + '<small>min</small>') + tile('repeat', 'serie completate', sets + '<small>/' + planned + '</small>') + tile('bolt', 'ripetizioni', String(s.vol)) + tile('dumb', 'esercizi', s.ex.length + '<small>/' + sm.nex + '</small>') + '</div>';
  if (s.kg) h += '<div class="sp10"></div><section class="card row"><span class="letter">' + ICON.scale + '</span><div class="f"><div class="b">' + Math.round(s.kg) + ' kg spostati con lo zaino</div><div class="muted small">Ripetizioni × peso dello zaino, solo dove l’hai indicato</div></div></section>';
  else h += '<div class="sp10"></div>';
  if (sm.recs.length) h += '<section class="card"><h3 style="margin-bottom:12px">Nuovi record</h3>' + sm.recs.map((r) => '<div class="up"><span class="letter solid">' + ICON.trophy + '</span><div class="f"><div class="b">' + esc(r.name) + '</div><div class="muted small">' + r.v + ' ' + unit(r.u) + ' in una serie (prima ' + r.old + ')</div></div></div>').join('') + '</section>';
  const items = sm.items.filter((o) => o.type);
  if (items.length) {
    h += '<section class="card"><h3 style="margin-bottom:12px">Progressione</h3>' + items.map((o, i) => {
      if (o.type === 'up') return '<div class="up"><span class="letter solid">' + ICON.up + '</span><div class="f"><div class="b">' + esc(o.toName) + '</div><div class="muted small">Prossima volta, al posto di ' + esc(o.name) + '.' + (EX[o.to].pre ? ' Prima di passare: ' + esc(EX[o.to].pre) : '') + '</div>' + (o.undone ? '<div class="small ac" style="margin-top:6px">Resti a questo livello.</div>' : '<button class="btn ghost xs" style="margin-top:8px" data-a="undoUp" data-v="' + i + '">Tecnica non perfetta? Resta qui</button>') + '</div></div>';
      if (o.type === 'down') return '<div class="up"><span class="letter" style="background:var(--ord);color:var(--or)">' + ICON.down + '</span><div class="f"><div class="b">' + esc(o.name) + '</div><div class="muted small">' + esc(o.msg) + '</div>' + (o.applied ? '<div class="small ac" style="margin-top:6px">Prossima volta: ' + esc(o.toName) + '.</div>' : '<button class="btn ghost xs" style="margin-top:8px" data-a="applyDown" data-v="' + i + '">Passa a ' + esc(o.toName) + '</button>') + '</div></div>';
      return '<div class="up"><span class="letter gray">' + (o.type === 'max' ? ICON.trophy : ICON.target) + '</span><div class="f"><div class="b">' + esc(o.name) + '</div><div class="muted small">' + esc(o.msg) + '</div></div></div>';
    }).join('') + '</section>';
  } else if (sm.deload) h += '<p class="muted small center" style="margin:6px 10px 18px">Settimana di scarico: i livelli restano uguali. Dalla prossima settimana si riparte con la progressione.</p>';
  else h += '<p class="muted small center" style="margin:6px 10px 18px">Quando completi tutte le serie al massimo del range con un po’ di margine, l’esercizio passa al livello successivo.</p>';
  h += '<div class="foot"><div class="in"><button class="btn primary" data-a="tab" data-v="home">Fatto</button></div></div>';
  return h;
}

/* ---------- Avvertenze di sicurezza ---------- */
const SAFETY = [
  ['info', 'Non è un parere medico', 'Leva dà indicazioni generali di allenamento. Non sostituisce medico, fisioterapista o nutrizionista.'],
  ['heart', 'Prima di iniziare', 'Se hai problemi di cuore o di pressione, infortuni recenti, dolori alle articolazioni o dubbi sulla tua salute, parlane prima con un medico.'],
  ['warn', 'Quando fermarti', 'Fatica e bruciore muscolare sono normali. Fermati subito se senti dolore acuto o alle articolazioni, dolore al petto, giramenti di testa o fiato corto insolito; se non passa, contatta un medico.'],
  ['target', 'Tecnica prima del carico', 'Sali di livello solo con una tecnica pulita. Usa mobili pesanti e stabili, elastici integri e ancorati a una porta chiusa a chiave.'],
  ['scale', 'Numeri indicativi', 'IMC, stime di durata e consigli sull’alimentazione sono riferimenti generali, non valutazioni personali.']
];
function safetyHtml(withButton) {
  return '<div class="letter solid" style="width:56px;height:56px;border-radius:18px;margin-bottom:16px">' + ICON.heart + '</div><h2>Allenati in sicurezza</h2><p class="muted" style="margin:8px 0 16px">Poche regole da tenere a mente.</p>' +
    SAFETY.map((x) => '<div class="lrow" style="align-items:flex-start"><span class="letter gray" style="width:38px;height:38px;border-radius:13px">' + ICON[x[0]] + '</span><div class="f"><div class="t">' + esc(x[1]) + '</div><div class="muted small">' + esc(x[2]) + '</div></div></div>').join('') +
    '<div class="sp16"></div>' + (withButton ? '<button class="btn primary" data-a="safetyOk">Ho capito</button>' : '<button class="btn ghost" data-a="navBack">Chiudi</button>');
}

/* ---------- Promemoria nella schermata Oggi ---------- */
function remindersCard(p) {
  const items = [];
  const dl = deloadStatus(p, S);
  if (dl.due) items.push('<div class="lrow" style="align-items:flex-start"><span class="letter">' + ICON.moon + '</span><div class="f"><div class="t">Settimana di scarico consigliata</div><div class="muted small">Ti alleni con costanza da ' + dl.weeks + ' settimane. Questa settimana: una serie in meno e nessuna salita di livello, per recuperare e ripartire più forte.</div><div class="row" style="margin-top:10px"><button class="btn primary xs" data-a="deloadYes">Va bene</button><button class="btn ghost xs" data-a="deloadLater">Più avanti</button></div></div></div>');
  if (dl.active) items.push('<div class="lrow"><span class="letter">' + ICON.moon + '</span><div class="f"><div class="t">Settimana di scarico in corso</div><div class="muted small">Una serie in meno per esercizio, livelli invariati.</div></div></div>');
  const lm = S.measures[S.measures.length - 1]; const dm = lm ? dayN(today()) - dayN(lm.d) : null;
  if (S.sessions.length >= 1 && (dm == null || dm >= 21)) items.push('<div class="lrow"><span class="letter">' + ICON.target + '</span><div class="f"><div class="t">' + (dm == null ? 'Prendi le misure del corpo' : 'Sono passate ' + Math.floor(dm / 7) + ' settimane dalle ultime misure') + '</div><div class="muted small">Braccio, petto, vita e coscia: mostrano se stai mettendo muscolo.</div></div><button class="btn ghost xs" data-a="measureSheet">Misura</button></div>');
  const lb = S.meta.lastBackup; const db = lb ? dayN(today()) - dayN(lb) : null;
  if (S.sessions.length >= 3 && (db == null || db >= 30)) items.push('<div class="lrow"><span class="letter">' + ICON.dl + '</span><div class="f"><div class="t">Salva un backup</div><div class="muted small">' + (db == null ? 'Non hai ancora salvato i tuoi dati' : 'Ultimo backup ' + db + ' giorni fa') + ': stanno solo su questo telefono.</div></div><button class="btn ghost xs" data-a="export">Salva</button></div>');
  if (!items.length) return '';
  return '<section class="card"><h3 style="margin-bottom:12px">Da fare</h3>' + items.join('') + '</section>';
}

/* ---------- Misure del corpo ---------- */
const MEASURES = [['arm', 'Braccio', 'A metà tra spalla e gomito, braccio rilassato lungo il fianco'], ['chest', 'Petto', 'All’altezza dei capezzoli, dopo aver espirato normalmente'], ['waist', 'Vita', 'All’altezza dell’ombelico, pancia rilassata'], ['thigh', 'Coscia', 'Nel punto più largo, in piedi a gambe leggermente divaricate']];
function measuresCard() {
  const m = S.measures; const k = mmode;
  let h = '<section class="card"><div class="card-h"><div><div class="eyebrow">Misure del corpo</div><h3 style="margin-top:4px">Circonferenze (cm)</h3></div><button class="btn ghost sm" data-a="measureSheet">' + ICON.plus + 'Misure</button></div>';
  if (!m.length) return h + '<p class="muted small">Ogni 3 settimane misura braccio, petto, vita e coscia con un metro da sarta. Se braccio, petto e coscia crescono mentre la vita resta stabile, stai mettendo muscolo.</p></section>';
  h += seg('mMode', MEASURES.map((x) => [x[0], x[1]]), k, 'mMode') + '<div class="sp16"></div>';
  const pts = m.filter((x) => x[k] != null);
  const first = pts[0], last = pts[pts.length - 1];
  if (last) h += '<div class="row" style="margin-bottom:10px"><div class="f"><span class="big-n">' + fmt1(last[k]) + '<small>cm</small></span></div>' + (pts.length > 1 ? '<span class="tag ' + (last[k] - first[k] >= 0 === (k !== 'waist') ? 'ac' : 'or') + '">' + (last[k] - first[k] >= 0 ? '+' : '') + fmt1(last[k] - first[k]) + ' cm dal ' + fmtD(first.d) + '</span>' : '') + '</div>';
  h += lineChart(pts.map((x) => ({ x: dayN(x.d), y: x[k] })), { h: 130, minSpan: 2, l0: first ? fmtD(first.d) : '', l1: last ? fmtD(last.d) : '', empty: 'Servono almeno 2 misurazioni per il grafico.', label: 'Andamento ' + k });
  return h + '</section>';
}
function sheetMeasures() {
  const last = S.measures[S.measures.length - 1] || {};
  return '<h3 style="margin-bottom:4px">Misure del corpo</h3><p class="muted small" style="margin-bottom:16px">Con un metro da sarta, al mattino, sempre nello stesso punto. Puoi lasciare vuote quelle che non prendi.</p>' +
    '<div class="grid2">' + MEASURES.map((x) => field('m_' + x[0], x[1] + ' (cm)', 'number', last[x[0]] != null ? String(last[x[0]]) : '', '', '0.1')).join('') + '</div>' +
    '<section class="card tight">' + MEASURES.map((x) => '<p class="small" style="margin-bottom:6px"><b>' + x[1] + ':</b> <span class="muted">' + esc(x[2]) + '</span></p>').join('') + '</section>' +
    '<button class="btn primary" data-a="saveMeasures">Salva misure</button>';
}

/* ---------- Riscaldamento / defaticamento guidati ---------- */
function vRoutine() {
  const a = S.active; const r = a.rt; const st = r.steps[r.i]; const m = routineMove(st.id);
  const warm = r.kind === 'warm'; const nx = r.steps[r.i + 1];
  let h = '<div class="sess-top"><button class="icon-btn" data-a="sessMenu" aria-label="Menu allenamento">' + ICON.x + '</button><div><div class="eyebrow center">' + (warm ? 'Riscaldamento' : 'Defaticamento') + '</div><div class="clock" id="elapsed">' + mmss(elapsedSec()) + '</div></div>' +
    '<button class="icon-btn" data-a="pause" aria-label="Pausa">' + ICON.pause + '</button></div>';
  h += '<div class="prog-top"><i style="width:' + (r.i / r.steps.length * 100).toFixed(1) + '%"></i></div>';
  h += '<div class="eyebrow">' + (r.i + 1) + ' di ' + r.steps.length + (warm ? ' · prima dell’allenamento' : ' · dopo l’allenamento') + '</div>';
  h += '<h1 class="ex-name">' + esc(m.n) + (st.side ? ' <span class="muted" style="font-size:18px">· lato ' + st.side + '</span>' : '') + '</h1>';
  h += animBox(m.a);
  h += '<p class="desc">' + esc(m.d) + '</p>';
  h += '<div class="rt-row"><button class="icon-btn" data-a="rtGo" data-v="-1" ' + (r.i > 0 ? '' : 'disabled') + ' aria-label="Precedente">' + ICON.chevL + '</button>' +
    '<div class="ring small" style="margin:0">' + '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#1F1F22" stroke-width="5.5"/><circle id="rtRing" cx="50" cy="50" r="45" fill="none" stroke="#C4F03A" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="282.74" stroke-dashoffset="0"/></svg>' +
    '<div class="t"><b id="rtT">' + Math.ceil(rtLeft()) + '</b><span>secondi</span></div></div>' +
    '<button class="icon-btn" data-a="rtGo" data-v="1" aria-label="Successivo">' + ICON.chevR + '</button></div>';
  h += '<div class="center" style="margin-top:12px"><button class="btn ghost sm" data-a="rtToggle" style="margin:0 auto">' + (r.end ? ICON.pause + 'Ferma' : ICON.play + 'Riprendi') + '</button></div>';
  h += '<p class="muted small center" style="margin-top:12px">Poi: ' + esc(nx ? routineMove(nx.id).n + (nx.side ? ' (lato ' + nx.side + ')' : '') : (warm ? 'inizia l’allenamento' : 'riepilogo')) + '</p>';
  h += '<div class="foot"><div class="in"><button class="btn ' + (warm ? 'ghost' : 'primary') + '" data-a="rtSkip">' + (warm ? 'Salta il riscaldamento' : 'Vai al riepilogo') + '</button></div></div>';
  return h;
}

/* ---------- Calendario: allenamenti e partite ---------- */
function vCal() {
  const p = S.profile; const tk = today(); const days = calPlan(p, S, 4);
  let h = '<div class="page-t"><h1>Calendario</h1><p class="muted small">Allenamenti e partite delle prossime 4 settimane. Tocca un giorno per segnare o togliere una partita.</p></div>';
  // Griglia 4 settimane
  h += '<section class="card"><div class="cal-h">' + WD1.map((x) => '<span>' + x + '</span>').join('') + '</div><div class="cal">' + days.map((d) => {
    const cls = ['cd']; if (d.today) cls.push('today'); if (d.past) cls.push('past'); if (d.done.length) cls.push('done'); if (d.plan) cls.push('plan'); if (d.match) cls.push('match');
    const mark = d.match ? '⚽' : d.done.length ? '✓' : d.plan ? d.plan : '';
    const first = d.d.getDate() === 1 || d === days[0];
    return '<button class="' + cls.join(' ') + '" data-a="dayTap" data-v="' + d.k + '" aria-label="' + esc(d.k) + '">' + (first ? '<em>' + esc(d.d.toLocaleDateString('it-IT', { month: 'short' })) + '</em>' : '') + '<b>' + d.d.getDate() + '</b><small>' + esc(mark) + '</small>' + (d.light ? '<i title="Gambe alleggerite"></i>' : '') + '</button>';
  }).join('') + '</div>' +
    '<div class="cal-leg"><span><b class="lg-plan">A</b> allenamento</span><span>⚽ partita</span><span><i></i> gambe alleggerite</span><span>✓ fatto</span></div></section>';
  // Giorni di allenamento
  h += '<div class="sec-h"><h3>Giorni di allenamento</h3><span class="muted small">' + esc(splitFor(p).name) + '</span></div><section class="card">' + daysPicker('cDays', p.wdays, 'calDay') +
    '<p class="muted tiny" style="margin-top:10px">Da 2 a 4 giorni a settimana, meglio non consecutivi. Valgono ogni settimana: non serve aggiornarli.</p></section>';
  // Partite
  const next = (p.matchDates || []).filter((d) => d >= tk); const past = (p.matchDates || []).filter((d) => d < tk).slice(-3);
  h += '<div class="sec-h"><h3>Partite</h3><span class="muted small">' + next.length + ' in programma</span></div><section class="card">' +
    '<label class="addbtn"><span class="letter">' + ICON.plus + '</span><span class="f"><b>Aggiungi una partita</b><span class="muted small">Scegli la data: si salva subito</span></span><input id="mDate" type="date" min="' + tk + '" aria-label="Data della partita"></label>' +
    (next.length ? next.map((d) => '<div class="lrow"><span style="font-size:18px">⚽</span><div class="f"><div class="t">' + esc(cap(parseD(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }))) + '</div></div><button class="btn ghost xs" data-a="matchMove" data-v="' + d + '">Rinvio</button><button class="icon-btn sm" data-a="matchDel" data-v="' + d + '" aria-label="Elimina partita">' + ICON.x + '</button></div>').join('') : '<p class="muted small" style="margin-top:12px">Nessuna partita in programma.</p>') +
    (past.length ? '<p class="muted tiny" style="margin-top:10px">Ultime giocate: ' + past.map((d) => fmtD(d)).join(', ') + '</p>' : '') +
    '<p class="muted tiny" style="margin-top:12px">Il giorno prima, quello della partita e il giorno dopo, gli esercizi per le gambe hanno una serie in meno.</p></section>';
  h += '<section class="card"><h4 style="margin-bottom:6px">Partite fisse ogni settimana</h4><p class="muted small" style="margin-bottom:12px">Solo se giochi sempre lo stesso giorno. Altrimenti usa le date qui sopra.</p>' + daysPicker('pMatch', p.match || [], 'matchPick') + '</section>';
  return h;
}

function sheetDayTap(k) {
  const p = S.profile; const on = (p.matchDates || []).indexOf(k) >= 0; const fixed = (p.match || []).indexOf(wdayOf(parseD(k))) >= 0;
  const day = cap(parseD(k).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
  const h = '<h3 style="margin-bottom:6px">' + esc(day) + '</h3>';
  if (fixed) return h + '<p class="muted small" style="margin-bottom:16px">È uno dei giorni con partita fissa ogni settimana. Puoi cambiarlo dal Profilo.</p><button class="btn ghost" data-a="navBack">Chiudi</button>';
  return h + '<p class="muted small" style="margin-bottom:16px">' + (on ? 'Hai una partita in questo giorno.' : 'Segna una partita: gli esercizi per le gambe verranno alleggeriti il giorno prima, lo stesso giorno e il giorno dopo.') + '</p>' +
    (on ? '<button class="btn ghost" data-a="matchMove" data-v="' + k + '">Rinviata: cambia data</button><div class="sp10"></div><button class="btn danger" data-a="matchDel" data-v="' + k + '">Togli la partita</button>'
      : '<button class="btn primary" data-a="matchToggle" data-v="' + k + '">⚽ Ho una partita</button>') +
    (route !== 'cal' ? '<div class="sp10"></div><button class="btn ghost" data-a="tab" data-v="cal">' + ICON.cal + 'Apri il calendario</button>' : '');
}
