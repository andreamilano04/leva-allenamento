/* LEVA 2.0 — Stato dell'interfaccia, azioni, sessione di allenamento, timer, avvio. */
'use strict';

let S = load();
let route = 'home';
let summary = null;
let ob = null;                 // stato dell'onboarding (non salvato finché non finisce)
let pdraft = null;             // non più usata: il profilo si salva subito
let lastRoute = null;
let lib = { q: '', m: '', mine: true, plan: false };
let pmode = 'n';
let mmode = 'arm';
let deferredInstall = null;
let pendingImport = null;
const clone = (o) => JSON.parse(JSON.stringify(o));

function save() { if (!saveState(S)) toast('Attenzione: salvataggio non riuscito (memoria piena?)'); }
function P() { return S.profile; }
function curWeight() { const w = S.weights; return w.length ? w[w.length - 1].kg : (S.profile ? S.profile.weight : 0); }
function startWeight() { return S.profile ? S.profile.weight : (S.weights.length ? S.weights[0].kg : 0); }
function elapsedSec() {
  const a = S.active; if (!a) return 0;
  const now = a.pausedAt || Date.now();
  return Math.max(0, (now - a.start - (a.pausedMs || 0)) / 1000);
}

/* ---------- Render ---------- */
const TABS = [['home', 'Oggi', 'home'], ['plan', 'Programma', 'cal'], ['library', 'Esercizi', 'dumb'], ['progress', 'Progressi', 'chart'], ['profile', 'Profilo', 'user']];
function render() {
  const full = !S.profile || route === 'session' || route === 'summary';
  document.body.classList.toggle('full', full);
  let html;
  if (!S.profile) { if (!ob) ob = { step: 0, d: defaultProfile() }; html = vOnboard(); }
  else if (route === 'session' && S.active) html = vSession();
  else if (route === 'summary' && summary) html = vSummary();
  else {
    if (route === 'session' || route === 'summary') route = 'home';
    html = ({ home: vHome, plan: vPlan, library: vLibrary, progress: vProgress, profile: vProfile, cal: vCal })[route]();
  }
  const same = lastRoute === route && !!S.profile; lastRoute = route; const y = window.scrollY;
  const app = $('#app'); app.innerHTML = '<div class="view' + (same ? '' : ' enter') + '">' + html + '</div>';
  if (same) window.scrollTo(0, y);
  $('#tabbar .in').innerHTML = TABS.map((t) => '<button data-a="tab" data-v="' + t[0] + '" class="' + (route === t[0] || (route === 'cal' && t[0] === 'plan') ? 'on' : '') + '" aria-label="' + t[1] + '"' + (route === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[2]] + t[1] + '</button>').join('');
  syncHistory();
}
function go(r) { if (r !== route) navPush(); if (r !== 'profile') pdraft = null; route = r; render(); window.scrollTo(0, 0); }

/* ---------- Audio, vibrazione, schermo acceso ---------- */
let actx = null;
function ensureAudio() { try { if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); } if (actx && actx.state === 'suspended') actx.resume(); } catch (e) {} }
function beep(n) {
  if (!actx || !S.settings.sound) return;
  try {
    for (let i = 0; i < (n || 3); i++) {
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * 0.22;
      o.frequency.value = i === (n || 3) - 1 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + 0.2);
    }
  } catch (e) {}
}
/* Guida vocale (sintesi del telefono, in italiano). */
function say(text) {
  try {
    if (S.settings.voice === false || !window.speechSynthesis) return false;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'it-IT'; u.rate = 1.05;
    const v = speechSynthesis.getVoices().find((x) => /^it/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u); return true;
  } catch (e) { return false; }
}
function buzz(p) { try { if (S.settings.vibrate && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
let wake = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    else if (!on && wake) { await wake.release(); wake = null; }
  } catch (e) {}
}

/* ---------- Overlay: recupero, cronometro, pausa ---------- */
let ov = null; let ovIv = null;
const RING = 2 * Math.PI * 45;
function ringSvg(id) { return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#1F1F22" stroke-width="5.5"/><circle id="' + id + '" cx="50" cy="50" r="45" fill="none" stroke="#C4F03A" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="' + RING.toFixed(2) + '" stroke-dashoffset="0"/></svg>'; }
function rirBox(ei, si) {
  const s = S.active.ex[ei].sets[si];
  return '<div class="rirbox"><div class="q">Quante ripetizioni avevi ancora in serbo?</div><div class="rirs">' + [0, 1, 2, 3, 4].map((v) => '<button data-a="rir" data-v="' + v + '" class="' + (s.rir === v ? 'on' : '') + '">' + (v === 4 ? '4+' : v) + '</button>').join('') + '</div><div class="h">Facoltativo · 0 = non riuscivo a farne un’altra. Serve a decidere quando salire di livello.</div></div>';
}
function openOv(o) {
  ov = o; clearInterval(ovIv);
  const b = $('#ovBody'); let h = '';
  if (o.mode === 'rest') {
    h = '<div class="eyebrow">Recupero</div><div class="ring' + (o.nextX ? ' small' : '') + '">' + ringSvg('ovRing') + '<div class="t"><b id="ovT">' + mmss(o.total) + '</b><span>riposa</span></div></div>' +
      '<div class="eyebrow">' + esc(o.nextLbl) + '</div><div class="nexttx">' + esc(o.next) + '</div>' + (o.nextX ? '<div style="width:100%">' + animBox(o.nextX, 'sm') + '</div>' : '') + rirBox(o.ei, o.si) +
      '<div class="row" style="width:100%"><button class="btn ghost f" data-a="restAdd" data-v="-15">−15 s</button><button class="btn ghost f" data-a="restAdd" data-v="15">+15 s</button></div>' +
      '<div class="sp10"></div><button class="btn primary" data-a="restSkip">Salta recupero</button><div class="muted tiny center" id="ovPref" style="margin-top:10px;min-height:16px"></div>';
  } else if (o.mode === 'last') {
    h = '<div class="done-ic" style="width:76px;height:76px;margin:0 auto 18px">' + ICON.check + '</div><h2 class="center">Ultima serie fatta!</h2>' + rirBox(o.ei, o.si) + '<button class="btn primary" data-a="finishFromOv">Termina allenamento</button><div class="sp10"></div><button class="btn ghost" data-a="ovClose">Rivedi le serie</button>';
  } else if (o.mode === 'hold') {
    h = '<div class="eyebrow">Tieni la posizione</div><div class="ring">' + ringSvg('ovRing') + '<div class="t"><b id="ovT">0</b><span>obiettivo ' + o.target + ' s</span></div></div><div class="nexttx">' + esc(EX[S.active.ex[o.ei].x].n) + '</div><div class="sp24"></div><button class="btn primary" data-a="holdStop">' + ICON.stop + 'Stop e registra</button><div class="sp10"></div><button class="btn ghost" data-a="ovClose">Annulla</button>';
  } else if (o.mode === 'pause') {
    h = '<div class="letter" style="width:76px;height:76px;border-radius:50%;margin-bottom:18px">' + ICON.pause + '</div><h2>In pausa</h2><p class="muted center" style="margin:8px 0 26px">Il tempo dell’allenamento è fermo. I dati sono salvati: puoi anche chiudere l’app.</p><div class="clock" id="ovT" style="font-size:40px;margin-bottom:26px">0:00</div><button class="btn primary" data-a="unpause">' + ICON.play + 'Riprendi</button>';
  }
  b.innerHTML = h; $('#ov').classList.add('show'); syncHistory();
  if (o.mode !== 'last') { ovIv = setInterval(tickOv, 250); tickOv(); }
}
function closeOv() { clearInterval(ovIv); ov = null; $('#ov').classList.remove('show'); if (S.active && S.active.timer) { S.active.timer = null; save(); } syncHistory(); }
function tickOv() {
  if (!ov) return; const t = $('#ovT'); const ring = $('#ovRing');
  if (ov.mode === 'rest') {
    if (S.active && S.active.pausedAt) return;
    const left = Math.max(0, Math.ceil((ov.end - Date.now()) / 1000));
    if (t) t.textContent = mmss(left);
    if (ring) ring.setAttribute('stroke-dashoffset', (RING * (1 - left / ov.total)).toFixed(1));
    if (left > 0 && left <= 3 && ov.said !== left) { ov.said = left; say(['', 'uno', 'due', 'tre'][left]); }
    if (left <= 0) { buzz([200, 100, 200]); if (!say('Via!')) beep(3); closeOv(); toast('Recupero finito: prossima serie!'); render(); }
  } else if (ov.mode === 'hold') {
    const el = Math.floor((Date.now() - ov.start) / 1000);
    if (t) t.textContent = el;
    if (ring) ring.setAttribute('stroke-dashoffset', (RING * (1 - Math.min(1, el / ov.target))).toFixed(1));
    if (el >= ov.target && !ov.beeped) { ov.beeped = true; buzz([200]); if (!say('Tempo!')) beep(2); }
  } else if (ov.mode === 'pause') {
    if (t && S.active && S.active.pausedAt) t.textContent = mmss((Date.now() - S.active.pausedAt) / 1000);
  }
}
function startRest(ei, si) {
  const a = S.active; const e = a.ex[ei];
  const exDone = e.sets.every((x) => x.done); const lastEx = ei === a.ex.length - 1;
  if (exDone && (lastEx || a.ex.every((q) => q.sets.every((x) => x.done)))) { openOv({ mode: 'last', ei: ei, si: si }); return; }
  let nextLbl, next, nextX = null;
  if (!exDone) { const ni = e.sets.findIndex((x) => !x.done); const tg = e.sets[ni].t != null ? e.sets[ni].t : e.sets[ni].v; nextLbl = 'Prossima: serie ' + (ni + 1) + ' di ' + e.sets.length; next = (e.u === 's' ? 'Tieni ' + tg + ' secondi' : 'Fai ' + tg + ' ripetizioni') + (e.side ? ' per lato' : ''); }
  else { const nIdx = a.ex.findIndex((q, i) => i > ei && q.sets.some((x) => !x.done)); const n = a.ex[nIdx >= 0 ? nIdx : Math.min(ei + 1, a.ex.length - 1)]; nextLbl = 'Prossimo esercizio'; next = EX[n.x].n; nextX = n.x; }
  const total = e.rest; const end = Date.now() + total * 1000;
  a.timer = { end: end, total: total, ei: ei, si: si, nextLbl: nextLbl, next: next, nextX: nextX }; save();
  openOv({ mode: 'rest', end: end, total: total, ei: ei, si: si, nextLbl: nextLbl, next: next, nextX: nextX });
  if (nextX) say('Recupero. Prossimo esercizio: ' + next);
}

/* Aggiunge o toglie una partita in una data; aggiorna anche la bozza del profilo. */
function setMatch(k, on) {
  const p = S.profile; const a = p.matchDates || (p.matchDates = []); const i = a.indexOf(k);
  if (on && i < 0) a.push(k); if (!on && i >= 0) a.splice(i, 1); a.sort();
  save();
}

/* ---------- Riscaldamento / defaticamento ---------- */
function rtBegin(kind) {
  const a = S.active; a.phase = kind; a.rt = { kind: kind, steps: routineSteps(kind), i: 0, end: null, left: 0, total: 0 };
  rtStep(0, true);
}
function rtStep(i, first) {
  const r = S.active.rt; const st = r.steps[i]; const m = routineMove(st.id);
  r.i = i; r.total = m.s; r.end = Date.now() + m.s * 1000; r.left = m.s; r.said = null; save(); render(); window.scrollTo(0, 0);
  say((first ? (r.kind === 'warm' ? 'Riscaldamento. ' : 'Defaticamento. ') : '') + m.n + (st.side ? ', lato ' + st.side : ''));
}
function rtLeft() { const r = S.active && S.active.rt; if (!r) return 0; return r.end ? Math.max(0, (r.end - Date.now()) / 1000) : r.left; }
function rtDone() {
  const a = S.active; if (!a || !a.rt) return;
  if (a.rt.kind === 'warm') { a.phase = 'main'; a.rt = null; save(); render(); window.scrollTo(0, 0); say('Iniziamo! Primo esercizio: ' + EX[a.ex[a.idx].x].n); }
  else { a.rt = null; a.phase = 'main'; finishSession(); }
}
function rtTick() {
  const a = S.active; if (!a || !a.rt || route !== 'session' || a.pausedAt || ov) return;
  const r = a.rt; if (!r.end) return;
  const left = rtLeft(); const t = document.getElementById('rtT'); const ring = document.getElementById('rtRing');
  if (t) t.textContent = Math.ceil(left); if (ring) ring.setAttribute('stroke-dashoffset', (282.74 * (1 - left / r.total)).toFixed(1));
  const c = Math.ceil(left); if (c > 0 && c <= 3 && r.said !== c) { r.said = c; if (!say(['', 'uno', 'due', 'tre'][c])) beep(1); }
  if (left <= 0) { buzz([150]); if (r.i + 1 >= r.steps.length) rtDone(); else rtStep(r.i + 1); }
}
setInterval(rtTick, 250);
/* Fine della parte principale: defaticamento (se attivo) e poi riepilogo. */
function endMain() {
  closeOv();
  const a = S.active; if (!a) return;
  if (a.phase === 'cool') { rtDone(); return; }
  const any = a.ex.some((e) => e.sets.some((q) => q.done));
  if (any && S.settings.cool !== false) rtBegin('cool'); else finishSession();
}

/* ---------- Sessione ---------- */
const LEGS = ['qua', 'fem', 'glu', 'pol'];
function startSession(wid, check) {
  const p = P(); const W = resolveWorkout(wid, p, S);
  if (!W.slots.length) { toast('Nessun esercizio disponibile con la tua attrezzatura'); return; }
  const deload = deloadStatus(p, S).active;
  const ex = W.slots.map((s) => {
    let n = s.sets; const notes = [];
    if (check.energy === 'low' && n >= 3) { n -= 1; notes.push('energia bassa'); }
    if (check.legs && LEGS.indexOf(EX[s.x].m) >= 0 && n >= 3) { n -= 1; notes.push(check.match ? 'partita ' + check.match : 'gambe stanche'); }
    if (deload && n >= 3) { n -= 1; notes.push('settimana di scarico'); }
    const pr = S.prog[s.key]; const last = pr && pr.id === s.x && pr.last ? pr.last : null;
    return { slot: s.slot, id: s.id, key: s.key, l: s.l, x: s.x, r: s.r, rSlot: s.rSlot, rest: s.rest, side: s.side, note: s.note, u: s.u,
      load: pr && pr.load ? pr.load : null, adapt: notes.length ? 'Adattato oggi: ' + plural(s.sets - n, 'serie', 'serie') + ' in meno (' + notes.join(', ') + ')' : '',
      sets: Array.from({ length: n }, (_, k) => { const tg = setTarget(s.r, s.u, last, k); return { v: tg, t: tg, done: false, rir: null }; }) };
  });
  S.active = { wid: wid, wname: W.name, start: Date.now(), pausedMs: 0, pausedAt: null, idx: 0, check: check, ex: ex, timer: null, deload: deload, phase: 'main', rt: null };
  save(); keepAwake(true); closeSheet(); go('session');
  if (S.settings.warm !== false) rtBegin('warm'); else say('Primo esercizio: ' + EX[ex[0].x].n);
}
function curEx() { return S.active.ex[S.active.idx]; }

function finishSession() {
  const a = S.active; if (!a) return;
  closeOv();
  const items = []; const recs = []; let vol = 0, kg = 0, any = false;
  a.ex.forEach((e) => {
    const done = e.sets.filter((s) => s.done); if (!done.length) return; any = true;
    if (e.u !== 's') done.forEach((s) => { vol += s.v; if (e.load) kg += s.v * e.load * (e.side ? 2 : 1); });
    const best = Math.max.apply(null, done.map((s) => s.v)); const old = bestSet(e.x, S);
    if (old > 0 && best > old) recs.push({ name: EX[e.x].n, v: best, old: old, u: e.u });
    if (a.deload) { S.prog[e.key] = Object.assign({ hits: 0, low: 0 }, S.prog[e.key] || {}, { id: e.x, last: e.sets.map((q) => (q.done ? q.v : null)) }); return; }
    const ev = evaluate(e, P(), S);
    if (ev) { S.prog[e.key] = ev.np; ev.out.key = e.key; ev.out.reps = ev.np.last || e.sets.map((s) => (s.done ? s.v : null)); items.push(ev.out); }
  });
  keepAwake(false);
  if (!any) { S.active = null; save(); toast('Nessuna serie completata: allenamento non salvato'); go('home'); return; }
  const sess = { id: Date.now(), d: today(), wid: a.wid, wname: a.wname, dur: Math.max(1, Math.round(elapsedSec() / 60)), vol: vol, kg: kg ? Math.round(kg) : null, check: a.check,
    ex: a.ex.filter((e) => e.sets.some((s) => s.done)).map((e) => ({ s: e.slot, k: e.key, x: e.x, reps: e.sets.map((s) => (s.done ? s.v : null)), rir: e.sets.map((s) => (s.done ? s.rir : null)), u: e.u, load: e.load || null, side: e.side })),
    ups: items.filter((o) => o.type === 'up').map((o) => o.toName) };
  // Confronto con l'ultima volta della stessa scheda, solo sugli esercizi in comune.
  let cmp = '';
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const q = S.sessions[i]; if (q.wid !== a.wid) continue;
    let now = 0, then = 0, common = 0;
    sess.ex.forEach((e) => { if (e.u === 's') return; const o = q.ex.find((z) => z.x === e.x); if (!o) return; common++; now += e.reps.reduce((t, r) => t + (r || 0), 0); then += o.reps.reduce((t, r) => t + (r || 0), 0); });
    if (common) { const d = now - then; cmp = 'Sugli esercizi in comune con il ' + fmtD(q.d) + ': ' + (d > 0 ? '+' + d + ' ripetizioni' : d < 0 ? d + ' ripetizioni' : 'stesse ripetizioni') + '.'; }
    break;
  }
  if (a.deload) sess.deload = true;
  S.sessions.push(sess); S.active = null; save(); say('Allenamento completato. Ottimo lavoro!');
  summary = { deload: !!a.deload, s: sess, items: items, recs: recs, cmp: cmp, planned: a.ex.reduce((t, e) => t + e.sets.length, 0), nex: a.ex.length };
  go('summary');
}

/* ---------- Bozza profilo ---------- */
function syncInputs(d) {
  const v = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
  if (v('fName') != null) d.name = v('fName').trim().slice(0, 30);
  const n = (id) => parseFloat(String(v(id) || '').replace(',', '.'));
  if (v('fH') != null) d.height = n('fH');
  if (v('fW') != null) d.weight = n('fW');
  if (v('fG') != null) d.goal = n('fG');
}
function validBody(d, withWeight) {
  if (!(d.height >= 120 && d.height <= 230)) return 'Inserisci un’altezza valida (120–230 cm)';
  if (withWeight && !(d.weight >= 30 && d.weight <= 200)) return 'Inserisci un peso valido (30–200 kg)';
  if (!(d.goal >= 30 && d.goal <= 200)) return 'Inserisci un peso obiettivo valido (30–200 kg)';
  return '';
}
function toggleDay(arr, i) {
  const k = arr.indexOf(i);
  if (k >= 0) arr.splice(k, 1); else { if (arr.length >= 4) { toast('Massimo 4 giorni a settimana'); return; } arr.push(i); }
  arr.sort();
}
/* Il profilo si salva a ogni modifica; la pagina si aggiorna senza animazione. */
let commitT = null;
function commitProfile(programChanged) {
  save(); render();
  if (programChanged) { clearTimeout(commitT); commitT = setTimeout(() => toast('Programma aggiornato'), 250); }
}

/* ---------- Backup ---------- */
function applyImport(d) {
  stopAll(); S = d; S.meta = Object.assign({}, S.meta, { news: false }); save(); pendingImport = null; ob = null; pdraft = null; summary = null; closeSheet();
  toast('Backup importato: ' + plural(S.sessions.length, 'allenamento', 'allenamenti')); go('home');
}
function stopAll() { closeOv(); keepAwake(false); }

/* ---------- Azioni ---------- */
const A = {
  tab: (t) => { summary = null; closeSheet(); go(t.dataset.v); },
  closeSheet: () => closeSheet(),

  /* Avvio */
  start: (t) => {
    if (S.active) { closeSheet(); return go('session'); }
    const wid = t.dataset.v; const mn = matchNear(P(), today());
    sheet('<h3>Come stai oggi?</h3><p class="muted small" style="margin:6px 0 18px">Leva adatta l’allenamento alla giornata. Puoi saltare questo passaggio.</p>' +
      '<div class="field"><label>Energia</label>' + seg('ckEnergy', [['low', 'Bassa'], ['ok', 'Normale'], ['high', 'Alta']], 'ok', 'segPick') + '</div>' +
      (mn ? '<p class="small" style="margin:0 4px 10px;color:var(--ac)">⚽ Partita ' + mn + ': ho già selezionato “gambe stanche”.</p>' : '') +
      '<section class="card" style="padding:4px 16px">' + toggle('ckLegs', !!mn, 'Gambe stanche', 'Per esempio dopo una partita di calcio: una serie in meno sugli esercizi per le gambe', 'tog') + '</section>' +
      '<button class="btn primary" data-a="go" data-v="' + wid + '">' + ICON.play + 'Inizia · ' + esc(WORKOUTS[wid].name) + '</button>');
  },
  segPick: (t) => { t.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === t)); },
  tog: (t) => { const el = document.getElementById(t.dataset.v); if (el) { el.classList.toggle('on'); t.setAttribute('aria-pressed', el.classList.contains('on')); } },
  go: (t) => {
    ensureAudio();
    const e = document.querySelector('#ckEnergy .on'); const legs = document.getElementById('ckLegs');
    const lg = !!(legs && legs.classList.contains('on')); const mn = matchNear(P(), today());
    startSession(t.dataset.v, { energy: e ? e.dataset.v : 'ok', legs: lg, match: lg && mn ? mn : null });
  },
  resume: () => { closeSheet(); keepAwake(true); go('session'); restoreTimer(); },

  /* Sessione */
  step: (t) => { const e = curEx(); const s = e.sets[+t.dataset.s]; s.v = clamp(s.v + (e.u === 's' ? 5 : 1) * +t.dataset.v, 0, 999); save(); render(); },
  setDone: (t) => {
    ensureAudio(); const a = S.active; const i = +t.dataset.s; const s = curEx().sets[i];
    s.done = !s.done; if (!s.done) s.rir = null; save(); render();
    if (s.done) startRest(a.idx, i);
  },
  rir: (t) => {
    if (!ov || !S.active) return; const s = S.active.ex[ov.ei].sets[ov.si]; const v = +t.dataset.v;
    s.rir = s.rir === v ? null : v; save();
    document.querySelectorAll('.rirs button').forEach((b) => b.classList.toggle('on', +b.dataset.v === s.rir));
  },
  restAdd: (t) => {
    if (!ov || ov.mode !== 'rest') return; const d = +t.dataset.v;
    ov.end += d * 1000; ov.total = Math.max(15, ov.total + d); if (ov.end <= Date.now()) ov.end = Date.now();
    const e = S.active.ex[ov.ei]; e.rest = clamp(e.rest + d, 15, 300);
    S.prefs[e.id] = { rest: e.rest }; S.active.timer = Object.assign(S.active.timer || {}, { end: ov.end, total: ov.total }); save();
    const pf = $('#ovPref'); if (pf) pf.textContent = 'Recupero di questo esercizio salvato a ' + mmss(e.rest) + ' per le prossime volte';
    tickOv();
  },
  restSkip: () => { closeOv(); render(); },
  ovClose: () => { closeOv(); render(); },
  finishFromOv: () => { closeOv(); endMain(); },
  holdStart: (t) => { ensureAudio(); const e = curEx(); const i = +t.dataset.s; openOv({ mode: 'hold', start: Date.now(), target: Math.max(5, e.sets[i].v), ei: S.active.idx, si: i }); },
  holdStop: () => {
    if (!ov || ov.mode !== 'hold') return; const o = ov; const el = Math.round((Date.now() - o.start) / 1000);
    closeOv(); if (el < 2) { render(); return; }
    const s = S.active.ex[o.ei].sets[o.si]; s.v = el; s.done = true; save(); render(); startRest(o.ei, o.si);
  },
  lvl: (t) => {
    const e = curEx(); const nx = nextAvail(e.x, P(), +t.dataset.v); if (!nx) return;
    e.x = nx; e.u = EX[nx].u; e.r = rangeFor(nx, e.rSlot, P()); e.sets.forEach((s, k) => { if (!s.done) { s.t = setTarget(e.r, e.u, null, k); s.v = s.t; } });
    S.prog[e.key] = { id: nx, last: null, hits: 0, low: 0, load: e.load || null }; save(); render();
    toast('Variante: ' + EX[nx].n);
  },
  loadStep: (t) => { const e = curEx(); e.load = clamp(Math.round(((e.load || 0) + +t.dataset.v) * 2) / 2, 0, 60) || null; save(); render(); },
  exNav: (t) => { const a = S.active; a.idx = clamp(a.idx + +t.dataset.v, 0, a.ex.length - 1); save(); render(); window.scrollTo(0, 0); },
  exList: () => showSheet('exList', null),
  exJump: (t) => { S.active.idx = +t.dataset.v; save(); closeSheet(); render(); window.scrollTo(0, 0); },
  pause: () => { const a = S.active; if (!a || a.pausedAt) return; a.pausedAt = Date.now(); save(); keepAwake(false); openOv({ mode: 'pause' }); },
  unpause: () => {
    const a = S.active; if (!a || !a.pausedAt) { closeOv(); return; }
    const d = Date.now() - a.pausedAt; a.pausedMs = (a.pausedMs || 0) + d; a.pausedAt = null;
    if (a.timer) a.timer.end += d;
    if (a.rt && a.rt.end) a.rt.end += d;
    save(); closeOv(); keepAwake(true); render(); restoreTimer();
  },
  sessMenu: () => sheet('<h3 style="margin-bottom:6px">Allenamento in corso</h3><p class="muted small" style="margin-bottom:18px">Le serie fatte sono già salvate: puoi uscire e riprendere più tardi dalla schermata Oggi.</p>' +
    '<button class="btn primary" data-a="finishAsk">' + ICON.check + 'Termina e salva</button><div class="sp10"></div>' +
    '<button class="btn ghost" data-a="pauseFromMenu">' + ICON.pause + 'Metti in pausa</button><div class="sp10"></div>' +
    '<button class="btn ghost" data-a="leave">Esci, riprendo dopo</button><div class="sp10"></div>' +
    '<button class="btn danger" data-a="discardAsk">Annulla allenamento</button>'),
  pauseFromMenu: () => { closeSheet(); A.pause(); },
  leave: () => { closeSheet(); closeOv(); keepAwake(false); go('home'); },
  discardAsk: () => sheet('<h3 style="margin-bottom:6px">Annullare l’allenamento?</h3><p class="muted small" style="margin-bottom:18px">Le serie di oggi non verranno salvate e la progressione non cambierà. Non si può annullare.</p><button class="btn danger" data-a="discard">Sì, annulla l’allenamento</button><div class="sp10"></div><button class="btn ghost" data-a="closeSheet">No, continua</button>'),
  discard: () => { closeSheet(); stopAll(); S.active = null; save(); toast('Allenamento annullato'); go('home'); },
  finishAsk: () => {
    const a = S.active; const d = a.ex.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0); const all = a.ex.reduce((t, e) => t + e.sets.length, 0);
    if (d === all) { closeSheet(); endMain(); return; }
    sheet('<h3 style="margin-bottom:6px">Terminare adesso?</h3><p class="muted small" style="margin-bottom:18px">Hai completato ' + d + ' serie su ' + all + '. Verranno salvate solo quelle fatte' + (d ? '' : ': nessuna, quindi l’allenamento non sarà registrato') + '.</p><button class="btn primary" data-a="finish">Termina e salva</button><div class="sp10"></div><button class="btn ghost" data-a="closeSheet">Continua l’allenamento</button>');
  },
  finish: () => { closeSheet(); endMain(); },
  undoUp: (t) => {
    const o = summary.items.filter((x) => x.type)[+t.dataset.v]; if (!o || o.undone) return;
    S.prog[o.key] = Object.assign({}, S.prog[o.key], { id: o.from, last: o.reps || null, hits: 0 });
    const s = S.sessions[S.sessions.length - 1]; if (s && s.ups) { const k = s.ups.indexOf(o.toName); if (k >= 0) s.ups.splice(k, 1); }
    o.undone = true; save(); render();
  },
  applyDown: (t) => {
    const o = summary.items.filter((x) => x.type)[+t.dataset.v]; if (!o || o.applied) return;
    S.prog[o.key] = { id: o.to, last: null, hits: 0, low: 0 }; o.applied = true; save(); render();
  },

  /* Programma */
  openWorkout: (t) => showSheet('workout', t.dataset.v),
  setsAdj: (t) => {
    const id = t.dataset.s; const slot = findSlot(id); const cur = resolveWorkout(slot.wid, P(), S).slots.find((s) => s.slot === id);
    const n = clamp((cur ? cur.sets : slot.s.sets) + +t.dataset.v, 1, 6);
    S.plan.over[id] = Object.assign({}, S.plan.over[id], { sets: n }); save(); showSheet('workout', slot.wid, { replace: true }); refreshBehind();
  },
  swapSheet: (t) => showSheet('swap', { s: t.dataset.s, w: t.dataset.w }),
  swapPick: (t) => {
    const id = t.dataset.s; const l = t.dataset.v; const slot = findSlot(id);
    const o = Object.assign({}, S.plan.over[id]); if (l === slot.s.l) delete o.l; else o.l = l;
    if (o.l || o.sets) S.plan.over[id] = o; else delete S.plan.over[id];
    save(); navPop(); showSheet('workout', t.dataset.w, { replace: true }); refreshBehind(); toast('Esercizio sostituito');
  },
  resetSlot: (t) => { delete S.plan.over[t.dataset.s]; save(); showSheet('workout', t.dataset.w, { replace: true }); refreshBehind(); },

  /* Esercizi */
  openEx: (t) => showSheet('ex', { id: t.dataset.v, ctx: t.dataset.ctx || '' }),
  exSwipe: (t) => swipeEx(+t.dataset.v),
  navBack: () => handleBack(),
  exHist: (t) => showSheet('exHist', t.dataset.v),
  exclToggle: (t) => {
    const id = t.dataset.v; const p = P(); const k = p.excl.indexOf(id);
    if (k >= 0) p.excl.splice(k, 1); else p.excl.push(id);
    save(); showSheet('ex', curSheet && curSheet.k === 'ex' ? curSheet.a : { id: id }, { replace: true }); refreshBehind(); toast(k >= 0 ? 'Esercizio rimesso nel programma' : 'Esercizio escluso: il programma usa un’alternativa');
  },
  libMus: (t) => { lib.m = t.dataset.v; render(); },
  libMine: () => { lib.mine = !lib.mine; render(); },
  libPlan: () => { lib.plan = !lib.plan; render(); },

  /* Progressi */
  pMode: (t) => { pmode = t.dataset.v; render(); },
  openSession: (t) => showSheet('session', +t.dataset.v),
  delSessionAsk: (t) => sheet('<h3 style="margin-bottom:6px">Eliminare questo allenamento?</h3><p class="muted small" style="margin-bottom:18px">Sparisce dallo storico e dalle statistiche. I livelli raggiunti restano come sono.</p><button class="btn danger" data-a="delSession" data-v="' + t.dataset.v + '">Sì, elimina</button><div class="sp10"></div><button class="btn ghost" data-a="openSession" data-v="' + t.dataset.v + '">No, torna indietro</button>'),
  delSession: (t) => { S.sessions.splice(+t.dataset.v, 1); save(); closeSheet(); toast('Allenamento eliminato'); render(); },
  weightSheet: () => {
    sheet('<h3 style="margin-bottom:4px">Registra il peso</h3><p class="muted small" style="margin-bottom:16px">Al mattino, a digiuno, 2 volte a settimana.</p>' + field('fWeight', 'Peso di oggi (kg)', 'number', String(curWeight()), '', '0.1') + '<button class="btn primary" data-a="saveWeight">Salva</button>');
    setTimeout(() => { const i = $('#fWeight'); if (i) { i.focus(); i.select(); } }, 200);
  },
  saveWeight: () => {
    const kg = parseFloat(String(($('#fWeight') || {}).value || '').replace(',', '.'));
    if (!(kg >= 30 && kg <= 200)) return toast('Inserisci un peso valido (30–200 kg)');
    const d = today(); S.weights = S.weights.filter((e) => e.d !== d); S.weights.push({ d: d, kg: Math.round(kg * 10) / 10 });
    S.weights.sort((a, b) => (a.d < b.d ? -1 : 1)); save(); closeSheet(); toast('Peso salvato'); render();
  },
  delWeightAsk: (t) => {
    if (S.weights.length <= 1) return toast('Serve almeno una misurazione');
    sheet('<h3 style="margin-bottom:6px">Eliminare la misurazione del ' + esc(fmtD(t.dataset.v)) + '?</h3><div class="sp16"></div><button class="btn danger" data-a="delWeight" data-v="' + t.dataset.v + '">Elimina</button><div class="sp10"></div><button class="btn ghost" data-a="closeSheet">Annulla</button>');
  },
  delWeight: (t) => { S.weights = S.weights.filter((e) => e.d !== t.dataset.v); save(); closeSheet(); render(); },

  /* Profilo */
  pPick: (t) => { const k = { pObj: 'obj', pLevel: 'level', pDur: 'dur' }[t.parentNode.id]; S.profile[k] = k === 'dur' ? +t.dataset.v : t.dataset.v; commitProfile(true); },
  dayPick: (t) => { toggleDay(ob.d.wdays, +t.dataset.v); render(); },
  calDay: (t) => {
    const w = S.profile.wdays; const i = +t.dataset.v;
    if (w.indexOf(i) >= 0 && w.length <= 2) { clearTimeout(commitT); return toast('Servono almeno 2 giorni di allenamento'); }
    if (S.active) return toast('Termina prima l’allenamento in corso');
    toggleDay(w, i); commitProfile(true);
  },

  pEq: (t) => { const k = t.dataset.v.slice(3); S.profile.equip[k] = !S.profile.equip[k]; commitProfile(true); },
  pAvoid: (t) => { const a = S.profile.avoid; const k = a.indexOf(t.dataset.v); if (k >= 0) a.splice(k, 1); else a.push(t.dataset.v); commitProfile(true); },
  pUnexcl: (t) => { S.profile.excl = S.profile.excl.filter((x) => x !== t.dataset.v); commitProfile(true); },
  setTog: (t) => { const k = { setSound: 'sound', setVibrate: 'vibrate', setNutri: 'nutri', setVoice: 'voice', setWarm: 'warm', setCool: 'cool' }[t.dataset.v]; S.settings[k] = S.settings[k] === false; save(); if (k === 'sound' && S.settings.sound) { ensureAudio(); beep(1); } render(); },

  install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; render(); },
  export: async () => {
    try {
      const data = Object.assign({}, S, { exportedAt: new Date().toISOString(), app: 'leva', appVersion: APP_VERSION });
      const name = 'leva-backup-' + today() + '.json'; const json = JSON.stringify(data, null, 2);
      let shared = false;
      try {
        const f = new File([json], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [f], title: 'Backup di Leva' }); shared = true; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      if (!shared) {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' })); const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      S.meta.lastBackup = today(); save(); toast('Backup salvato'); render();
    } catch (e) { toast('Salvataggio del backup non riuscito'); }
  },
  import: () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 5e6) return toast('File troppo grande per essere un backup di Leva');
      const r = new FileReader();
      r.onload = () => {
        let d = null; try { d = upgrade(JSON.parse(r.result)); } catch (e) { d = null; }
        if (!d || !d.profile) return toast('File di backup non valido');
        if (!S.profile) return applyImport(d);
        pendingImport = d;
        sheet('<h3 style="margin-bottom:6px">Sostituire i dati attuali?</h3><p class="muted small" style="margin-bottom:18px">Il backup contiene ' + plural(d.sessions.length, 'allenamento', 'allenamenti') + ' e ' + plural(d.weights.length, 'misurazione', 'misurazioni') + ' del peso. I dati di questo telefono (' + plural(S.sessions.length, 'allenamento', 'allenamenti') + ') verranno sostituiti.</p><button class="btn primary" data-a="importOk">Sì, importa il backup</button><div class="sp10"></div><button class="btn ghost" data-a="closeSheet">Annulla</button>');
      };
      r.onerror = () => toast('Impossibile leggere il file');
      r.readAsText(f);
    };
    inp.click();
  },
  importOk: () => { if (pendingImport) applyImport(pendingImport); },
  resetAsk: () => sheet('<h3 style="margin-bottom:6px">Cancellare tutti i dati?</h3><p class="muted small" style="margin-bottom:18px">Profilo, allenamenti, livelli e pesi verranno eliminati da questo telefono. Non si può annullare: se vuoi, esporta prima un backup.</p><button class="btn ghost" data-a="export">' + ICON.dl + 'Esporta backup</button><div class="sp10"></div><button class="btn danger" data-a="reset">Sì, cancella tutto</button><div class="sp10"></div><button class="btn ghost" data-a="closeSheet">Annulla</button>'),
  reset: () => { stopAll(); S = fresh(); save(); closeSheet(); ob = null; pdraft = null; summary = null; route = 'home'; render(); },
  bmiInfo: () => sheet('<h3 style="margin-bottom:8px">Cos’è l’IMC</h3><p class="muted small" style="margin-bottom:12px">L’indice di massa corporea è il peso in chilogrammi diviso per il quadrato dell’altezza in metri. Per esempio: 65,5 kg e 1,75 m danno 65,5 ÷ (1,75 × 1,75) = 21,4.</p>' +
    '<section class="card">' + [['Sotto 18,5', 'Sottopeso'], ['18,5 – 24,9', 'Normopeso'], ['25 – 29,9', 'Sovrappeso'], ['30 e oltre', 'Obesità']].map((r) => '<div class="lrow"><div class="f">' + r[1] + '</div><b>' + r[0] + '</b></div>').join('') + '</section>' +
    '<p class="muted small">È solo un indicatore di massima: non distingue muscoli e grasso. Chi è molto muscoloso può avere un IMC alto pur essendo magro, quindi va letto insieme a come ti senti, alla forza e alla circonferenza vita. Le fasce valgono per gli adulti.</p>'),
  safetyOk: () => { S.meta.safety = true; save(); closeSheet(); },
  safetyShow: () => sheet(safetyHtml(false)),
  obSafe: () => { ob.safe = !ob.safe; render(); },
  /* Riscaldamento / defaticamento */
  rtGo: (t) => { const r = S.active.rt; const n = r.i + +t.dataset.v; if (n < 0) return; if (n >= r.steps.length) rtDone(); else rtStep(n); },
  rtToggle: () => { const r = S.active.rt; if (r.end) { r.left = Math.max(0, (r.end - Date.now()) / 1000); r.end = null; } else { r.end = Date.now() + (r.left || 1) * 1000; } save(); render(); },
  rtSkip: () => rtDone(),
  /* Misure */
  measureSheet: () => sheet(sheetMeasures()),
  saveMeasures: () => {
    const o = { d: today() }; let n = 0, bad = false;
    MEASURES.forEach((x) => { const el = $('#m_' + x[0]); const v = parseFloat(String(el && el.value || '').replace(',', '.')); if (el && el.value.trim()) { if (v >= 15 && v <= 200) { o[x[0]] = Math.round(v * 10) / 10; n++; } else bad = true; } });
    if (bad) return toast('Controlla i valori: tra 15 e 200 cm');
    if (!n) return toast('Inserisci almeno una misura');
    S.measures = S.measures.filter((m) => m.d !== o.d); S.measures.push(o); S.measures.sort((a, b) => (a.d < b.d ? -1 : 1));
    save(); closeSheet(); toast('Misure salvate'); render();
  },
  mMode: (t) => { mmode = t.dataset.v; render(); },
  /* Scarico */
  deloadYes: () => { const w = dkey(weekStart(new Date())); S.meta.deloadWeek = w; S.meta.lastDeload = w; save(); toast('Settimana di scarico attiva'); render(); },
  deloadLater: () => { S.meta.deloadSnooze = dkey(weekStart(new Date())); save(); render(); },
  /* Partite */
  matchPick: (t) => {
    const onb = t.parentNode.id === 'obMatch'; const d = onb ? ob.d : S.profile;
    d.match = d.match || []; const i = +t.dataset.v; const k = d.match.indexOf(i);
    if (k >= 0) d.match.splice(k, 1); else d.match.push(i); d.match.sort();
    if (onb) render(); else commitProfile(false);
  },

  /* Calendario */
  calSheet: () => sheet('<h3 style="margin-bottom:4px">Promemoria nel calendario</h3><p class="muted small" style="margin-bottom:16px">Crea un file da aprire con il calendario del telefono: gli eventi si ripetono da soli, con un avviso 10 minuti prima.</p>' +
    '<div class="field"><label for="calTime">Ora degli allenamenti (' + P().wdays.map((i) => WD[i]).join(', ') + ')</label><input id="calTime" type="time" value="18:30"></div>' +
    '<section class="card" style="padding:4px 16px">' + toggle('calWeigh', true, 'Pesate', 'Lunedì e giovedì alle 8:00', 'tog') + toggle('calMeas', true, 'Misure del corpo', 'Ogni 3 settimane, la domenica', 'tog') + toggle('calBackup', true, 'Backup dei dati', 'La prima domenica del mese', 'tog') + '</section>' +
    '<button class="btn primary" data-a="calMake">' + ICON.cal + 'Crea promemoria</button><p class="muted tiny center" style="margin-top:10px">Se cambi i giorni di allenamento, crea di nuovo il file ed elimina i vecchi eventi.</p>'),
  calMake: async () => {
    const on = (id) => { const el = document.getElementById(id); return !!(el && el.classList.contains('on')); };
    const time = (($('#calTime') || {}).value || '18:30');
    const ics = buildIcs(P(), { time: time, weigh: on('calWeigh'), measures: on('calMeas'), backup: on('calBackup') });
    const name = 'leva-promemoria.ics';
    try {
      const f = new File([ics], name, { type: 'text/calendar' });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [f], title: 'Promemoria Leva' }); closeSheet(); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    closeSheet(); toast('File creato: aprilo con il calendario');
  },
  /* Partite per data */
  dayTap: (t) => sheet(sheetDayTap(t.dataset.v)),
  matchToggle: (t) => { setMatch(t.dataset.v, true); closeSheet(); toast('Partita segnata'); render(); },
  matchAdd: () => { const v = ($('#mDate') || {}).value; if (!v) return toast('Scegli una data'); setMatch(v, true); toast('Partita aggiunta'); render(); },
  matchDel: (t) => { setMatch(t.dataset.v, false); closeSheet(); toast('Partita tolta'); render(); },
  matchMove: (t) => sheet('<h3 style="margin-bottom:6px">Partita rinviata</h3><p class="muted small" style="margin-bottom:14px">Nuova data per la partita del ' + esc(fmtD(t.dataset.v)) + ':</p><input id="mMove" type="date" min="' + today() + '" style="width:100%;height:54px;background:var(--s2);border:1px solid var(--line);border-radius:18px;padding:0 16px;margin-bottom:12px"><button class="btn primary" data-a="matchMoveOk" data-v="' + t.dataset.v + '">Sposta la partita</button><div class="sp10"></div><button class="btn ghost" data-a="matchMoveNone" data-v="' + t.dataset.v + '">Data ancora da definire</button>'),
  matchMoveOk: (t) => { const v = ($('#mMove') || {}).value; if (!v) return toast('Scegli la nuova data'); setMatch(t.dataset.v, false); setMatch(v, true); closeSheet(); toast('Partita spostata al ' + fmtD(v)); render(); },
  matchMoveNone: (t) => { setMatch(t.dataset.v, false); closeSheet(); toast('Partita tolta: aggiungila quando c’è la nuova data'); render(); },
  newsOk: () => { S.meta.news = false; save(); closeSheet(); if (!S.meta.safety) openSheet(safetyHtml(true)); },
  newsProfile: () => { S.meta.news = false; save(); closeSheet(); go('profile'); },

  /* Onboarding */
  obNext: () => {
    const d = ob.d;
    if (ob.step === 1) { syncInputs(d); const err = validBody(d, true); if (err) return toast(err); }
    if (ob.step === 3 && d.wdays.length < 2) return toast('Scegli almeno 2 giorni');
    ob.step = Math.min(OB_STEPS - 1, ob.step + 1); render(); window.scrollTo(0, 0);
  },
  obBack: () => { if (ob.step === 1) syncInputs(ob.d); ob.step = Math.max(0, ob.step - 1); render(); },
  obObj: (t) => { ob.d.obj = t.dataset.v; render(); },
  obLevel: (t) => { ob.d.level = t.dataset.v; render(); },
  obDur: (t) => { ob.d.dur = +t.dataset.v; render(); },
  obEq: (t) => { const k = t.dataset.v.slice(3); ob.d.equip[k] = !ob.d.equip[k]; render(); },
  obAvoid: (t) => { const a = ob.d.avoid; const k = a.indexOf(t.dataset.v); if (k >= 0) a.splice(k, 1); else a.push(t.dataset.v); render(); },
  obFinish: () => {
    if (!ob.safe) return toast('Conferma di aver letto le avvertenze di sicurezza');
    const d = ob.d; d.weight = Math.round(d.weight * 10) / 10; d.goal = Math.round(d.goal * 10) / 10;
    S.profile = clone(d); S.weights = [{ d: today(), kg: d.weight }]; S.meta.safety = true; ob = null; save(); go('home');
    toast('Benvenuto in Leva' + (d.name ? ', ' + d.name : '') + '!');
  }
};

function findSlot(id) {
  for (const w in WORKOUTS) { const s = WORKOUTS[w].slots.find((x) => x.id === id); if (s) return { wid: w, s: s }; }
  return null;
}
/* Aggiorna la vista sotto a un pannello aperto senza chiuderlo. */
function refreshBehind() { const html = $('#sheetBody').innerHTML; const open = $('#sheet').classList.contains('show'); render(); if (open) { $('#sheetBody').innerHTML = html; } }

function restoreTimer() {
  const a = S.active; if (!a) return;
  if (a.pausedAt) { openOv({ mode: 'pause' }); return; }
  const t = a.timer; if (!t || !a.ex[t.ei]) return;
  if (t.end > Date.now()) openOv({ mode: 'rest', end: t.end, total: t.total, ei: t.ei, si: t.si, nextLbl: t.nextLbl, next: t.next, nextX: t.nextX });
  else { a.timer = null; save(); }
}

/* ---------- Navigazione e tasto indietro ----------
   NAV è la cronologia interna: prima di ogni cambio di schermata o di pannello si salva
   com'era lo schermo. Il tasto indietro del telefono ripristina lo stato precedente
   (per esempio la scheda di allenamento da cui avevi aperto un esercizio).
   Una sola voce "di guardia" nella cronologia del browser intercetta il tasto. */
const NAV = [];
let curSheet = null;
const SHEETS = {
  workout: (a) => sheetWorkout(a),
  ex: (a) => sheetEx(a.id, exCtx(a)),
  exHist: (a) => sheetExHist(a),
  session: (a) => sheetSession(a),
  exList: () => {
    const a = S.active; if (!a) return '';
    return '<h3 style="margin-bottom:14px">Esercizi di oggi</h3>' + a.ex.map((e, i) => { const d = e.sets.filter((q) => q.done).length; return '<button class="item" data-a="exJump" data-v="' + i + '"><span class="letter ' + (d === e.sets.length ? 'solid' : i === a.idx ? '' : 'gray') + '">' + (d === e.sets.length ? ICON.check : i + 1) + '</span><div class="f"><div class="t">' + esc(EX[e.x].n) + '</div><div class="s">' + d + '/' + e.sets.length + ' serie</div></div></button>'; }).join('');
  },
  swap: (a) => {
    const slot = findSlot(a.s); const cur = resolveWorkout(slot.wid, P(), S).slots.find((q) => q.slot === slot.s.id);
    return '<h3 style="margin-bottom:6px">Sostituisci esercizio</h3><p class="muted small" style="margin-bottom:16px">Il livello di ogni alternativa viene tenuto separato, così lo storico resta corretto.</p>' +
      swapOptions(slot.s).map((k) => { const lvl = availIds(k, P()); const on = cur && cur.l === k; return '<button class="item" data-a="swapPick" data-s="' + slot.s.id + '" data-w="' + slot.wid + '" data-v="' + k + '"><span class="letter ' + (on ? 'solid' : 'gray') + '">' + (on ? ICON.check : ICON.swap) + '</span><div class="f"><div class="t">' + esc(LADDERS[k].name) + '</div><div class="s">' + esc(EX[lvl[0]].n) + (lvl.length > 1 ? ' e altri ' + (lvl.length - 1) + ' livelli' : '') + '</div></div></button>'; }).join('') +
      '<div class="sp10"></div><button class="btn ghost" data-a="navBack">Indietro</button>';
  }
};
/* Lista di esercizi in cui scorrere, in base a dove è stato aperto l'esercizio. */
function exCtx(a) {
  let list = null;
  if (a.ctx && a.ctx.indexOf('w:') === 0 && S.profile) list = resolveWorkout(a.ctx.slice(2), P(), S).slots.map((q) => q.x);
  else if (a.ctx === 's' && S.active) list = S.active.ex.map((e) => e.x);
  else if (a.ctx === 'lib') list = libIds();
  if (!list || list.indexOf(a.id) < 0 || list.length < 2) return null;
  return { list: list, i: list.indexOf(a.id) };
}
function navSnap() {
  const open = $('#sheet').classList.contains('show');
  return { r: route, sh: open && curSheet && curSheet.k !== 'raw' ? JSON.parse(JSON.stringify(curSheet)) : null, ix: route === 'session' && S.active ? S.active.idx : null };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function navPush() { const c = navSnap(); const top = NAV[NAV.length - 1]; if (!top || !same(top, c)) NAV.push(c); if (NAV.length > 60) NAV.shift(); }
function navPop() { NAV.pop(); }
function showSheet(k, a, opt) {
  if (!(opt && opt.replace)) { const next = { k: k, a: a }; if (!same(curSheet, next) || !$('#sheet').classList.contains('show')) navPush(); }
  curSheet = { k: k, a: a }; openSheet(SHEETS[k](a));
}
function sheet(html) { navPush(); curSheet = { k: 'raw' }; openSheet(html); }
function restore(st) {
  if (st.r === 'session' && !S.active) return false;
  if (st.r === 'summary' && !summary) return false;
  if (route === 'session' && st.r !== 'session') { closeOv(); keepAwake(false); }
  if (st.r === 'session' && st.ix != null && S.active) S.active.idx = Math.min(st.ix, S.active.ex.length - 1);
  route = st.r; curSheet = null; $('#sheet').classList.remove('show');
  render(); window.scrollTo(0, 0);
  if (st.sh && SHEETS[st.sh.k]) { const html = SHEETS[st.sh.k](st.sh.a); if (html) { curSheet = st.sh; openSheet(html); } }
  if (route === 'session') { keepAwake(true); restoreTimer(); }
  return true;
}

let navGuard = false, navIgnore = false;
function isDeep() {
  if ($('#sheet').classList.contains('show') || ov) return true;
  if (!S.profile) return !!(ob && ob.step > 0);
  return route !== 'home' || NAV.length > 0;
}
function syncHistory() {
  const deep = isDeep();
  if (deep && !navGuard) { try { history.pushState({ leva: 1 }, ''); navGuard = true; } catch (e) {} }
  else if (!deep && navGuard && !navIgnore) { navIgnore = true; history.back(); }
}
function handleBack() {
  if (ov) { if (ov.mode === 'pause') { closeOv(); keepAwake(false); } else { closeOv(); render(); return; } }
  if (!S.profile) { if (ob && ob.step > 0) A.obBack(); return; }
  if (S.meta && S.meta.news) { S.meta.news = false; save(); }
  const cur = navSnap();
  while (NAV.length) { const st = NAV.pop(); if (same(st, cur)) continue; if (restore(st)) return; }
  if ($('#sheet').classList.contains('show')) { closeSheet(); return; }
  if (route !== 'home') { summary = null; restore({ r: 'home', sh: null, ix: null }); }
}
window.addEventListener('popstate', () => {
  if (navIgnore) { navIgnore = false; navGuard = false; syncHistory(); return; }
  navGuard = false; handleBack(); syncHistory();
});

/* ---------- Scorrimento laterale (carosello) ----------
   La schermata segue il dito; se lo spostamento supera circa 1/4 dello schermo
   (o il gesto è veloce) scorre via e il nuovo esercizio entra dal lato opposto.
   Ai bordi della lista c'è resistenza e la schermata torna al suo posto. */
const SW_MS = 220;
function swipeTarget() {
  if ($('#sheet').classList.contains('show')) {
    if (!curSheet || curSheet.k !== 'ex') return null;
    const c = exCtx(curSheet.a); if (!c) return null;
    return { el: $('#sheetBody'), can: (d) => c.i + d >= 0 && c.i + d < c.list.length, go: (d) => showSheet('ex', { id: c.list[c.i + d], ctx: curSheet.a.ctx }, { replace: true }), sheet: true };
  }
  if (route === 'session' && S.active && !ov && S.active.phase !== 'warm' && S.active.phase !== 'cool') {
    const a = S.active;
    return { el: document.querySelector('#app .view'), can: (d) => a.idx + d >= 0 && a.idx + d < a.ex.length, go: (d) => { a.idx += d; save(); render(); window.scrollTo(0, 0); } };
  }
  return null;
}
/* Cambio animato, usato sia dal gesto sia dalle frecce. */
function slideTo(tg, d, fromX) {
  const W = window.innerWidth; let el = tg.el;
  el.style.transition = 'transform ' + SW_MS + 'ms cubic-bezier(.2,.9,.3,1), opacity ' + SW_MS + 'ms';
  el.style.transform = 'translateX(' + (-d * W) + 'px)'; el.style.opacity = '0';
  setTimeout(() => {
    tg.go(d);
    if (tg.sheet) $('#sheet .pane').scrollTop = 0;
    const ne = tg.sheet ? $('#sheetBody') : document.querySelector('#app .view');
    ne.style.transition = 'none'; ne.style.transform = 'translateX(' + (d * W * 0.6) + 'px)'; ne.style.opacity = '0';
    void ne.offsetWidth;
    ne.style.transition = 'transform ' + SW_MS + 'ms cubic-bezier(.2,.9,.3,1), opacity ' + SW_MS + 'ms';
    ne.style.transform = 'translateX(0)'; ne.style.opacity = '1';
    setTimeout(() => { ne.style.transition = ''; ne.style.transform = ''; ne.style.opacity = ''; }, SW_MS + 20);
  }, fromX == null ? SW_MS * 0.6 : SW_MS * 0.8);
}
function swipeEx(dir) { const tg = swipeTarget(); if (tg && tg.can(dir)) slideTo(tg, dir); }

let drag = null;
document.addEventListener('touchstart', (ev) => {
  if (ev.touches.length !== 1) { drag = null; return; }
  const t = ev.touches[0]; const el = ev.target;
  if (el.closest && el.closest('.stepper, .pills, input, .seg, .rirs, .lvl, .bmi-bar')) { drag = null; return; }
  const tg = swipeTarget(); if (!tg || !tg.el) { drag = null; return; }
  drag = { x: t.clientX, y: t.clientY, t0: Date.now(), axis: null, dx: 0, tg: tg };
}, { passive: true });
document.addEventListener('touchmove', (ev) => {
  if (!drag) return; const t = ev.touches[0];
  const dx = t.clientX - drag.x, dy = t.clientY - drag.y;
  if (!drag.axis) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; drag.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'; }
  if (drag.axis !== 'x') return;
  ev.preventDefault();
  const d = dx < 0 ? 1 : -1; const edge = !drag.tg.can(d);
  drag.dx = edge ? dx * 0.25 : dx;
  const el = drag.tg.el; el.style.transition = 'none';
  el.style.transform = 'translateX(' + drag.dx + 'px)'; el.style.opacity = String(1 - Math.min(0.5, Math.abs(drag.dx) / window.innerWidth));
}, { passive: false });
document.addEventListener('touchend', () => {
  if (!drag || drag.axis !== 'x') { drag = null; return; }
  const g = drag; drag = null; const el = g.tg.el;
  const v = Math.abs(g.dx) / Math.max(1, Date.now() - g.t0); const d = g.dx < 0 ? 1 : -1;
  if ((Math.abs(g.dx) > window.innerWidth * 0.25 || (v > 0.45 && Math.abs(g.dx) > 30)) && g.tg.can(d)) { slideTo(g.tg, d, g.dx); return; }
  el.style.transition = 'transform ' + SW_MS + 'ms cubic-bezier(.2,.9,.3,1), opacity ' + SW_MS + 'ms';
  el.style.transform = 'translateX(0)'; el.style.opacity = '1';
  setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; }, SW_MS + 20);
}, { passive: true });
document.addEventListener('touchcancel', () => { if (drag && drag.tg.el) { drag.tg.el.style.transform = ''; drag.tg.el.style.opacity = ''; } drag = null; }, { passive: true });

/* ---------- Eventi ---------- */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-a]'); if (!t || t.disabled) return;
  const fn = A[t.dataset.a]; if (fn) { ev.preventDefault(); fn(t, ev); }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'libQ') { lib.q = t.value; const p = P(); const pr = program(p, S); const inPlan = {}; pr.workouts.forEach((w) => w.slots.forEach((s) => { (inPlan[s.x] = inPlan[s.x] || []).push(w.wid); })); $('#libList').innerHTML = libList(p, inPlan); return; }
});
document.addEventListener('change', (ev) => {
  const t = ev.target; if (!S.profile) return;
  if (route === 'profile' && /^f(Name|H|G)$/.test(t.id)) {
    const d = clone(S.profile); syncInputs(d); const err = validBody(d, false);
    if (err) { toast(err); render(); return; }
    S.profile.name = d.name; S.profile.height = d.height; S.profile.goal = Math.round(d.goal * 10) / 10; save(); toast('Salvato');
    const av = document.querySelector('.page-t .avatar'); if (av) av.textContent = initial(d.name);
  }
  if (t.id === 'mDate' && t.value) { setMatch(t.value, true); toast('Partita aggiunta: ' + fmtD(t.value)); render(); }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target && ev.target.id === 'fWeight') A.saveWeight();
  if (ev.key === 'Escape') { if ($('#sheet').classList.contains('show')) closeSheet(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { if (S.active && route === 'session' && !S.active.pausedAt) keepAwake(true); tickOv(); }
});
setInterval(() => { const el = document.getElementById('elapsed'); if (el && S.active) el.textContent = mmss(elapsedSec()); }, 1000);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (route === 'profile') render(); });

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && window.top === window) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ---------- Avvio ---------- */
render();
if (S.active) { route = 'session'; render(); restoreTimer(); keepAwake(!S.active.pausedAt); }
if (S.profile && S.meta && !S.meta.news && !S.meta.safety) openSheet(safetyHtml(true));
if (S.profile && S.meta && S.meta.news) {
  const p = S.profile;
  openSheet('<div class="letter solid" style="width:56px;height:56px;border-radius:18px;margin-bottom:16px">' + ICON.bolt + '</div><h2>Benvenuto in Leva 2.0</h2><p class="muted" style="margin:8px 0 16px">Abbiamo trasferito tutti i tuoi dati: ' + plural(S.sessions.length, 'allenamento', 'allenamenti') + ', ' + plural(S.weights.length, 'misurazione', 'misurazioni') + ' del peso e i livelli raggiunti.</p>' +
    '<section class="card"><h4 style="margin-bottom:8px">Controlla due cose</h4><p class="small muted">Giorni: <b style="color:var(--tx)">' + p.wdays.map((i) => WD[i]).join(', ') + '</b> (prima non si sceglievano).<br>Attrezzatura: <b style="color:var(--tx)">' + EQUIP_ORDER.filter((k) => p.equip[k]).map((k) => EQUIP[k].n.toLowerCase()).join(', ') + '</b>.</p></section>' +
    '<button class="btn primary" data-a="newsProfile">Controlla il profilo</button><div class="sp10"></div><button class="btn ghost" data-a="newsOk">Va bene così</button>');
}
