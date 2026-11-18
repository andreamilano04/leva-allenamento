/* LEVA 2.0 — Schermate. Ogni funzione v*() restituisce l'HTML di una vista. */
'use strict';

const initial = (n) => (n ? n.trim().charAt(0).toUpperCase() : 'L');

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
  h += '<section class="card"><div class="card-h"><h3>Questa settimana</h3><span class="tag ' + (doneW >= p.wdays.length ? 'ac' : '') + '">' + doneW + '/' + p.wdays.length + ' allenamenti</span></div>' + weekStrip(wp) + '</section>';

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
  const trend = weightTrend(S);
  const tip = trend === 'flat' ? 'Il peso è fermo da due settimane: aggiungi uno spuntino da circa 300 kcal al giorno (per esempio yogurt greco con frutta secca).'
    : trend === 'fast' ? 'Stai salendo più di 0,5 kg a settimana: riduci leggermente le porzioni per mettere muscolo e non grasso.'
    : 'Punta a ' + Math.round(cw * 1.6) + '–' + Math.round(cw * 2) + ' g di proteine al giorno e a un leggero surplus calorico. Pesati 2 volte a settimana, al mattino.';
  h += '<div class="sec-h"><h3>Obiettivo peso</h3><button class="link" data-a="weightSheet">+ Registra</button></div>';
  h += '<section class="card"><div class="row" style="margin-bottom:12px"><div class="f"><span class="big-n">' + fmt1(cw) + '<small>kg</small></span></div><div class="muted small" style="text-align:right">obiettivo<br><b style="color:var(--tx)">' + fmt1(p.goal) + ' kg</b></div></div>' +
    '<div class="bar"><i style="width:' + pct.toFixed(0) + '%"></i></div><div class="muted small" style="margin-top:8px">' + (Math.abs(cw - p.goal) < 0.05 ? 'Obiettivo raggiunto!' : (cw < p.goal ? 'Mancano ' : 'Sei sopra di ') + fmt1(Math.abs(p.goal - cw)) + ' kg') + '</div></section>';
  h += '<section class="card row" style="align-items:flex-start"><span class="letter" style="background:var(--ord);color:var(--or)">' + ICON.food + '</span><div class="f"><h4 style="margin-bottom:4px">Alimentazione</h4><p class="muted small">' + esc(tip) + '</p></div></section>';
  return h;
}

function heroWorkout(W, label, isNext) {
  return '<section class="hero"><span class="big">' + esc(W.wid) + '</span><div class="eyebrow">' + esc(label) + '</div><h2>' + esc(W.name) + '</h2>' +
    '<div class="meta"><span>' + ICON.clock + '~' + W.min + ' min</span><span>' + ICON.dumb + plural(W.slots.length, 'esercizio', 'esercizi') + '</span><span>' + ICON.repeat + W.sets + ' serie</span></div>' +
    '<button class="btn black" data-a="start" data-v="' + W.wid + '">' + ICON.play + 'Inizia allenamento</button>' +
    '<div class="sp10"></div><button class="link" style="color:rgba(11,12,5,.7);width:100%;position:relative" data-a="openWorkout" data-v="' + W.wid + '">Vedi gli esercizi</button></section>';
}

function weekStrip(wp) {
  return '<div class="week">' + wp.map((d) => {
    const cls = ['wd']; if (d.train) cls.push('train'); if (d.done.length) cls.push('done'); if (d.today) cls.push('today');
    const lab = d.done.length ? '✓' : (d.plan ? d.plan : '');
    return '<div class="' + cls.join(' ') + '"><span>' + WD[d.i] + '</span><b>' + d.d.getDate() + '</b><small>' + esc(lab) + '</small></div>';
  }).join('') + '</div>';
}

function sessionItem(s, idx) {
  return '<button class="item" data-a="openSession" data-v="' + idx + '"><span class="letter">' + esc(s.wid) + '</span><div class="f"><div class="t">' + esc(s.wname) + '</div><div class="s">' + fmtD(s.d) + ' · ' + s.dur + ' min · ' + s.vol + ' rip' + (s.kg ? ' · ' + Math.round(s.kg) + ' kg' : '') + '</div></div><span class="chev">' + ICON.chevR + '</span></button>';
}

/* ---------- Programma ---------- */
function vPlan() {
  const p = S.profile; const pr = program(p, S); const wp = weekPlan(p, S);
  let h = '<div class="page-t"><h1>Programma</h1><p class="muted small">' + esc(pr.name) + ' · ' + p.wdays.map((i) => WD[i]).join(', ') + ' · ~' + p.dur + ' min · ' + esc(GOALS[p.obj].n.toLowerCase()) + '</p></div>';
  h += '<section class="card"><div class="card-h"><h3>Settimana</h3><button class="link" data-a="tab" data-v="profile">Modifica giorni</button></div>' + weekStrip(wp) + '</section>';
  h += '<div class="sec-h"><h3>Le tue schede</h3><span class="muted small">a rotazione</span></div>';
  const nw = nextWid(p, S);
  pr.workouts.forEach((w) => {
    h += '<button class="item" data-a="openWorkout" data-v="' + w.wid + '"><span class="letter ' + (w.wid === nw ? 'solid' : '') + '">' + esc(w.wid) + '</span><div class="f"><div class="t">' + esc(w.name) + (w.wid === nw ? ' <span class="tag ac" style="margin-left:4px">prossima</span>' : '') + '</div><div class="s">~' + w.min + ' min · ' + w.slots.length + ' esercizi · ' + w.sets + ' serie</div><div class="s">' + w.muscles.map((m) => MUSCLES[m]).join(' · ') + '</div></div><span class="chev">' + ICON.chevR + '</span></button>';
  });
  const ms = muscleSets(pr); const zone = p.obj === 'end' ? [8, 16] : p.obj === 'str' ? [6, 14] : [10, 20];
  const maxv = Math.max(24, Math.max.apply(null, MUSCLE_ORDER.map((k) => ms[k])));
  h += '<div class="sec-h"><h3>Serie a settimana per muscolo</h3></div><section class="card">' +
    MUSCLE_ORDER.map((k) => { const v = ms[k]; const w = clamp(v / maxv * 100, 0, 100); const lo = v < zone[0] && ['pol', 'core', 'fem'].indexOf(k) < 0;
      return '<div class="mus"><span>' + MUSCLES[k] + '</span><span class="track"><span class="zone" style="left:' + (zone[0] / maxv * 100) + '%;width:' + ((zone[1] - zone[0]) / maxv * 100) + '%"></span><i class="' + (lo ? 'lo' : '') + '" style="width:' + w + '%"></i></span><b>' + fmtSets(v) + '</b></div>'; }).join('') +
    '<p class="muted tiny" style="margin-top:10px">Serie dirette = 1, serie in cui il muscolo aiuta = ½. La fascia chiara indica il volume tipico per ' + esc(GOALS[p.obj].n.toLowerCase()) + ' (' + zone[0] + '–' + zone[1] + ' serie). Polpacci, femorali e core lavorano anche negli esercizi multiarticolari.</p></section>';
  const p0 = p.equip; const missing = EQUIP_ORDER.filter((k) => !p0[k]).map((k) => EQUIP[k].n.toLowerCase());
  h += '<section class="card row" style="align-items:flex-start"><span class="letter gray">' + ICON.info + '</span><div class="f"><h4 style="margin-bottom:4px">Come si adatta</h4><p class="muted small">Le schede usano solo l’attrezzatura che hai' + (missing.length ? ' (niente ' + esc(missing.join(', ')) + ')' : '') + ' ed evitano gli esercizi esclusi. Puoi sostituire un esercizio o cambiare il numero di serie aprendo una scheda.</p><div class="sp10"></div><button class="btn ghost sm" data-a="tab" data-v="profile">Attrezzatura e preferenze</button></div></section>';
  return h;
}
const fmtSets = (v) => (v % 1 ? fmt1(v) : String(v));

function sheetWorkout(wid) {
  const p = S.profile; const w = resolveWorkout(wid, p, S);
  let h = '<div class="row" style="margin-bottom:6px"><span class="letter solid">' + esc(wid) + '</span><div class="f"><h3>' + esc(w.name) + '</h3><div class="muted small">~' + w.min + ' min · ' + w.sets + ' serie</div></div></div>';
  h += '<div class="sp10"></div>';
  w.slots.forEach((s, i) => {
    const e = EX[s.x]; const over = S.plan.over[s.slot] || {};
    h += '<div class="card tight" style="margin-bottom:8px"><div class="row"><span class="letter gray" style="width:34px;height:34px;border-radius:11px;font-size:14px">' + (i + 1) + '</span><div class="f"><div class="b">' + esc(e.n) + '</div><div class="muted small">' + s.sets + ' × ' + rangeTxt(s.r, s.u, s.side) + ' · rec. ' + s.rest + ' s</div></div><button class="icon-btn sm" data-a="openEx" data-v="' + s.x + '" aria-label="Dettagli">' + ICON.info + '</button></div>' +
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
function libList(p, inPlan) {
  const q = lib.q.trim().toLowerCase();
  const ids = Object.keys(EX).filter((id) => {
    const e = EX[id];
    if (lib.m && e.m !== lib.m && e.s.indexOf(lib.m) < 0) return false;
    if (lib.mine && !isAvail(id, p)) return false;
    if (lib.plan && !inPlan[id]) return false;
    if (q && (e.n + ' ' + LADDERS[e.l].name + ' ' + MUSCLES[e.m]).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  if (!ids.length) return '<div class="empty">Nessun esercizio con questi filtri.</div>';
  return ids.map((id) => {
    const e = EX[id]; const ok = isAvail(id, p); const n = LADDERS[e.l].lv.length;
    return '<button class="item ' + (ok ? '' : 'off') + '" data-a="openEx" data-v="' + id + '"><span class="letter ' + (inPlan[id] ? 'solid' : '') + '">' + (inPlan[id] ? esc(inPlan[id][0]) : ICON.muscle) + '</span><div class="f"><div class="t">' + esc(e.n) + '</div><div class="s">' + MUSCLES[e.m] + (n > 1 ? ' · liv. ' + (e.i + 1) + '/' + n : '') + (e.u === 's' ? ' · a tempo' : '') + (ok ? '' : ' · ' + esc(whyUnavail(id, p).join(', '))) + '</div></div>' + (n > 1 ? dots(e.i, n) : '') + '</button>';
  }).join('');
}

function sheetEx(id) {
  const p = S.profile; const e = EX[id]; const L = LADDERS[e.l]; const n = L.lv.length; const ok = isAvail(id, p);
  const prev = e.i > 0 ? L.lv[e.i - 1].id : null; const next = e.i < n - 1 ? L.lv[e.i + 1].id : null;
  const excluded = p.excl.indexOf(id) >= 0;
  let h = '<div class="eyebrow">' + esc(L.name) + (n > 1 ? ' · livello ' + (e.i + 1) + ' di ' + n : '') + '</div><h2 style="margin:6px 0 12px">' + esc(e.n) + '</h2>';
  h += '<div class="tags"><span class="tag ac">' + MUSCLES[e.m] + '</span>' + e.s.map((m) => '<span class="tag">' + MUSCLES[m] + '</span>').join('') + (e.u === 's' ? '<span class="tag">' + ICON.clock + 'a tempo</span>' : '') + (e.r ? '<span class="tag">' + rangeTxt(e.r, e.u) + '</span>' : '') + '</div>';
  h += '<p class="desc">' + esc(e.d) + '</p>';
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
  const p = S.profile; const d = pdraft;
  let h = '<div class="page-t row"><div class="avatar lg">' + esc(initial(d.name)) + '</div><div class="f"><h1 style="font-size:26px">' + esc(d.name || 'Profilo') + '</h1><p class="muted small">' + esc(LEVELS[d.level]) + ' · ' + esc(GOALS[d.obj].n) + ' · ' + d.wdays.length + ' giorni</p></div></div>';
  h += '<div class="sec-h"><h3>Dati personali</h3></div><section class="card">' + field('fName', 'Nome', 'text', d.name, 'Come ti chiami?') +
    '<div class="grid2">' + field('fH', 'Altezza (cm)', 'number', d.height) + field('fG', 'Peso obiettivo (kg)', 'number', d.goal, '', '0.1') + '</div><p class="muted tiny">Il peso attuale si registra dal pulsante bilancia nella schermata Oggi.</p></section>';
  h += '<div class="sec-h"><h3>Allenamento</h3></div><section class="card">' +
    '<div class="field"><label>Obiettivo</label>' + seg('pObj', Object.keys(GOALS).map((k) => [k, GOALS[k].n.split(' ')[0] === 'Massa' ? 'Massa' : GOALS[k].n.split(' ')[0]]), d.obj, 'pPick') + '<p class="muted tiny" style="margin:8px 4px 0">' + esc(GOALS[d.obj].d) + '</p></div>' +
    '<div class="field"><label>Livello</label>' + seg('pLevel', Object.keys(LEVELS).map((k) => [k, LEVELS[k]]), d.level, 'pPick') + '</div>' +
    '<div class="field"><label>Giorni di allenamento (da 2 a 4)</label>' + daysPicker('pDays', d.wdays) + '</div>' +
    '<div class="field" style="margin-bottom:0"><label>Durata per allenamento</label>' + seg('pDur', [[30, '30 min'], [45, '45 min'], [60, '60 min']], d.dur, 'pPick') + '</div></section>';
  h += '<div class="sec-h"><h3>Attrezzatura</h3></div><section class="card">' + EQUIP_ORDER.map((k) => toggle('eq_' + k, d.equip[k], EQUIP[k].n, EQUIP[k].d, 'pEq')).join('') + '</section>';
  h += '<div class="sec-h"><h3>Zone da proteggere</h3></div><section class="card"><p class="muted small" style="margin-bottom:12px">Gli esercizi che le sollecitano molto vengono sostituiti.</p><div class="tags">' + Object.keys(STRESS).map((k) => '<button class="pill ' + (d.avoid.indexOf(k) >= 0 ? 'on' : '') + '" data-a="pAvoid" data-v="' + k + '">' + STRESS[k] + '</button>').join('') + '</div>' +
    (d.excl.length ? '<div class="sp16"></div><h4 style="margin-bottom:8px">Esercizi esclusi</h4>' + d.excl.filter((x) => EX[x]).map((x) => '<div class="lrow"><div class="f">' + esc(EX[x].n) + '</div><button class="btn ghost xs" data-a="pUnexcl" data-v="' + x + '">Rimetti</button></div>').join('') : '') + '</section>';
  h += '<div class="sec-h"><h3>Preferenze</h3></div><section class="card">' + toggle('setSound', S.settings.sound, 'Suono a fine recupero', 'Tre bip quando il timer finisce', 'setTog') + toggle('setVibrate', S.settings.vibrate, 'Vibrazione', 'Sui telefoni che la supportano', 'setTog') + '</section>';
  const dirty = JSON.stringify(d) !== JSON.stringify(p);
  h += '<button class="btn primary" data-a="saveProfile" ' + (dirty ? '' : 'disabled') + '>' + (dirty ? 'Salva e aggiorna il programma' : 'Nessuna modifica da salvare') + '</button>';
  if (deferredInstall) h += '<div class="sp10"></div><button class="btn ghost" data-a="install">' + ICON.phone + 'Installa l’app sul telefono</button>';
  h += '<div class="sec-h"><h3>I tuoi dati</h3></div><section class="card"><p class="muted small" style="margin-bottom:14px">I dati restano solo su questo telefono. Fai un backup ogni tanto: il file si può reimportare anche su un altro telefono.</p>' +
    '<div class="grid2"><button class="btn ghost" data-a="export">' + ICON.dl + 'Esporta</button><button class="btn ghost" data-a="import">' + ICON.ul + 'Importa</button></div>' +
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
      '<h3 style="margin-bottom:12px">Quanto tempo hai?</h3>' + [[30, 'Circa 30 minuti', 'Solo gli esercizi fondamentali'], [45, 'Circa 45 minuti', 'Fondamentali e complementari'], [60, 'Circa 60 minuti', 'Più serie sui fondamentali']].map((o) => opt('obDur', o[0], d.dur === o[0], o[1], o[2])).join('');
  } else if (st === 4) {
    h += '<h1>Cosa hai in casa?</h1><p class="muted" style="margin:8px 0 22px">Il programma userà solo queste cose. Puoi cambiarle quando vuoi.</p><section class="card">' + EQUIP_ORDER.map((k) => toggle('eq_' + k, d.equip[k], EQUIP[k].n, EQUIP[k].d, 'obEq')).join('') + '</section>';
  } else if (st === 5) {
    h += '<h1>Qualche fastidio?</h1><p class="muted" style="margin:8px 0 22px">Gli esercizi che sollecitano molto queste zone verranno sostituiti. Se hai dolore vero, chiedi prima a un medico.</p><div class="tags">' +
      Object.keys(STRESS).map((k) => '<button class="pill ' + (d.avoid.indexOf(k) >= 0 ? 'on' : '') + '" data-a="obAvoid" data-v="' + k + '">' + STRESS[k] + '</button>').join('') + '</div><p class="muted small" style="margin-top:16px">' + (d.avoid.length ? '' : 'Nessuna zona selezionata: va benissimo.') + '</p>';
  } else {
    const tmp = Object.assign(fresh(), { profile: d }); const pr = program(d, tmp);
    h += '<h1>Il tuo programma è pronto</h1><p class="muted" style="margin:8px 0 22px">' + esc(pr.name) + ' · ' + d.wdays.map((i) => WD[i]).join(', ') + ' · ~' + d.dur + ' min</p>' +
      pr.workouts.map((w) => '<div class="item"><span class="letter solid">' + esc(w.wid) + '</span><div class="f"><div class="t">' + esc(w.name) + '</div><div class="s">' + w.slots.length + ' esercizi · ' + w.sets + ' serie · ~' + w.min + ' min</div><div class="s">' + w.slots.slice(0, 3).map((s) => esc(EX[s.x].n)).join(', ') + '…</div></div></div>').join('');
  }
  const last = st === OB_STEPS - 1;
  h += '<div class="foot"><div class="in"><button class="btn primary" data-a="' + (last ? 'obFinish' : 'obNext') + '">' + (last ? 'Inizia con Leva' : 'Continua') + '</button></div></div>';
  return h;
}
function opt(act, v, on, title, sub) { return '<button class="opt ' + (on ? 'on' : '') + '" data-a="' + act + '" data-v="' + v + '"><div class="f"><b>' + esc(title) + '</b><span class="muted small">' + esc(sub) + '</span></div><span class="ck">' + ICON.check + '</span></button>'; }

/* ---------- Sessione ---------- */
function vSession() {
  const a = S.active; const e = a.ex[a.idx]; const x = EX[e.x]; const L = LADDERS[x.l]; const u = x.u;
  const doneSets = a.ex.reduce((t, q) => t + q.sets.filter((s) => s.done).length, 0); const all = a.ex.reduce((t, q) => t + q.sets.length, 0);
  let h = '<div class="sess-top"><button class="icon-btn" data-a="sessMenu" aria-label="Menu allenamento">' + ICON.x + '</button><div><div class="eyebrow center">' + esc(a.wname) + '</div><div class="clock" id="elapsed">' + mmss(elapsedSec()) + '</div></div>' +
    '<button class="icon-btn" data-a="pause" aria-label="Pausa">' + ICON.pause + '</button></div>';
  h += '<div class="prog-top"><i style="width:' + (all ? doneSets / all * 100 : 0).toFixed(1) + '%"></i></div>';
  h += '<div class="row"><div class="f"><div class="eyebrow">Esercizio ' + (a.idx + 1) + ' di ' + a.ex.length + '</div></div><button class="link" data-a="exList">Tutti gli esercizi</button></div>';
  h += '<h1 class="ex-name">' + esc(x.n) + '</h1>';
  h += '<div class="tags"><span class="tag ac">' + MUSCLES[x.m] + '</span><span class="tag">' + e.sets.length + ' × ' + rangeTxt(e.r, u, e.side) + '</span><span class="tag">' + ICON.clock + 'rec. ' + e.rest + ' s</span></div>';
  const ids = L.lv.map((l) => l.id);
  if (ids.length > 1) {
    const prev = nextAvail(e.x, S.profile, -1), next = nextAvail(e.x, S.profile, 1);
    h += '<div class="lvl"><button data-a="lvl" data-v="-1" ' + (prev ? '' : 'disabled') + ' aria-label="Variante più facile">' + ICON.chevL + '</button><div class="lvl-steps">' + ids.map((id, i) => '<i class="' + (i <= x.i ? 'on' : (isAvail(id, S.profile) ? '' : 'na')) + '"></i>').join('') + '</div><span class="tag">Liv. ' + (x.i + 1) + '/' + ids.length + '</span><button data-a="lvl" data-v="1" ' + (next ? '' : 'disabled') + ' aria-label="Variante più difficile">' + ICON.chevR + '</button></div>';
  }
  const hist = exHistory(e.x, S); const last = hist[hist.length - 1];
  if (last) h += '<div class="beat"><span class="ic">' + ICON.target + '</span><div class="f"><div class="eyebrow" style="color:var(--ac)">Da battere · ' + fmtD(last.d) + '</div><b>' + last.reps.map((r) => (r == null ? '–' : r)).join(' · ') + ' ' + unit(u) + '</b>' + (last.load ? '<span class="muted small"> · zaino ' + fmt1(last.load) + ' kg</span>' : '') + '</div></div>';
  else h += '<div class="beat"><span class="ic">' + ICON.bolt + '</span><div class="f"><div class="eyebrow" style="color:var(--ac)">Prima volta</div><span class="small">Scegli un ritmo che ti permetta una tecnica pulita.</span></div></div>';
  if (e.adapt) h += '<p class="adapt">' + esc(e.adapt) + '</p>';
  h += '<p class="desc">' + esc(x.d) + ' <button class="link" data-a="openEx" data-v="' + e.x + '">Istruzioni</button></p>';
  if (e.note) h += '<p class="note">' + esc(e.note) + '</p>';
  if (x.eq.indexOf('backpack') >= 0) h += '<div class="load"><div class="f">Peso nello zaino <span class="muted tiny">(facoltativo)</span></div><div class="stepper" style="flex:none"><button data-a="loadStep" data-v="-0.5" aria-label="Meno peso">' + ICON.minus + '</button><span class="v" style="font-size:19px;min-width:64px">' + (e.load ? fmt1(e.load) : '–') + '<small>kg</small></span><button data-a="loadStep" data-v="0.5" aria-label="Più peso">' + ICON.plus + '</button></div></div>';
  h += e.sets.map((s, i) => '<div class="set ' + (s.done ? 'done' : '') + '"><span class="n">' + (i + 1) + '</span>' +
    (u === 's' && !s.done ? '<button class="play" data-a="holdStart" data-s="' + i + '" aria-label="Avvia cronometro">' + ICON.play + '</button>' : '') +
    '<div class="stepper"><button data-a="step" data-s="' + i + '" data-v="-1" aria-label="Meno">' + ICON.minus + '</button><span class="v">' + s.v + '<small>' + unit(u) + '</small></span><button data-a="step" data-s="' + i + '" data-v="1" aria-label="Più">' + ICON.plus + '</button></div>' +
    (s.done && s.rir != null ? '<span class="rir">RIR<br>' + (s.rir >= 4 ? '4+' : s.rir) + '</span>' : '') +
    '<button class="check" data-a="setDone" data-s="' + i + '" aria-label="' + (s.done ? 'Annulla serie' : 'Serie completata') + '">' + ICON.check + '</button></div>').join('');
  const lastEx = a.idx === a.ex.length - 1;
  h += '<div class="foot"><div class="in">' + (a.idx > 0 ? '<button class="btn ghost" data-a="exNav" data-v="-1" aria-label="Esercizio precedente">' + ICON.chevL + '</button>' : '') +
    (lastEx ? '<button class="btn primary" data-a="finishAsk">' + ICON.check + 'Termina allenamento</button>' : '<button class="btn primary" data-a="exNav" data-v="1">Prossimo esercizio' + ICON.chevR + '</button>') + '</div></div>';
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
      if (o.type === 'up') return '<div class="up"><span class="letter solid">' + ICON.up + '</span><div class="f"><div class="b">' + esc(o.toName) + '</div><div class="muted small">Prossima volta, al posto di ' + esc(o.name) + '.</div>' + (o.undone ? '<div class="small ac" style="margin-top:6px">Resti a questo livello.</div>' : '<button class="btn ghost xs" style="margin-top:8px" data-a="undoUp" data-v="' + i + '">Tecnica non perfetta? Resta qui</button>') + '</div></div>';
      if (o.type === 'down') return '<div class="up"><span class="letter" style="background:var(--ord);color:var(--or)">' + ICON.down + '</span><div class="f"><div class="b">' + esc(o.name) + '</div><div class="muted small">' + esc(o.msg) + '</div>' + (o.applied ? '<div class="small ac" style="margin-top:6px">Prossima volta: ' + esc(o.toName) + '.</div>' : '<button class="btn ghost xs" style="margin-top:8px" data-a="applyDown" data-v="' + i + '">Passa a ' + esc(o.toName) + '</button>') + '</div></div>';
      return '<div class="up"><span class="letter gray">' + (o.type === 'max' ? ICON.trophy : ICON.target) + '</span><div class="f"><div class="b">' + esc(o.name) + '</div><div class="muted small">' + esc(o.msg) + '</div></div></div>';
    }).join('') + '</section>';
  } else h += '<p class="muted small center" style="margin:6px 10px 18px">Quando completi tutte le serie al massimo del range con un po’ di margine, l’esercizio passa al livello successivo.</p>';
  h += '<div class="foot"><div class="in"><button class="btn primary" data-a="tab" data-v="home">Fatto</button></div></div>';
  return h;
}
