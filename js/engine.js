/* LEVA 2.0 — Motore: programma, scelta degli esercizi, durata, progressione. */
'use strict';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ---------- Disponibilità degli esercizi ---------- */
function isAvail(id, p) {
  const e = EX[id]; if (!e) return false;
  if (!e.eq.every((q) => p.equip[q])) return false;
  if (p.excl.indexOf(id) >= 0) return false;
  if (e.st.some((z) => p.avoid.indexOf(z) >= 0)) return false;
  return true;
}
function availIds(lad, p) { return LADDERS[lad].lv.map((l) => l.id).filter((id) => isAvail(id, p)); }
function whyUnavail(id, p) {
  const e = EX[id]; const out = [];
  e.eq.forEach((q) => { if (!p.equip[q]) out.push('serve: ' + EQUIP[q].n.toLowerCase()); });
  if (p.excl.indexOf(id) >= 0) out.push('escluso da te');
  e.st.forEach((z) => { if (p.avoid.indexOf(z) >= 0) out.push('sollecita: ' + STRESS[z].toLowerCase()); });
  return out;
}
/* Livello disponibile più vicino a idx (preferisce quelli più facili). */
function snap(lad, idx, p) {
  const ids = LADDERS[lad].lv.map((l) => l.id);
  for (let i = Math.min(idx, ids.length - 1); i >= 0; i--) if (isAvail(ids[i], p)) return ids[i];
  for (let i = idx + 1; i < ids.length; i++) if (isAvail(ids[i], p)) return ids[i];
  return null;
}
function nextAvail(id, p, dir) {
  const e = EX[id]; const ids = LADDERS[e.l].lv.map((l) => l.id);
  for (let i = e.i + dir; i >= 0 && i < ids.length; i += dir) if (isAvail(ids[i], p)) return ids[i];
  return null;
}

/* ---------- Risoluzione degli slot ---------- */
/* Sceglie la scala per uno slot. "used" contiene le scale già presenti nella stessa seduta:
   lo stesso movimento non viene ripetuto due volte (es. due rematori con zaino). */
function slotLadder(slot, p, over, used) {
  used = used || {};
  if (p.equip.bar && slot.bar && !used[slot.bar.l] && availIds(slot.bar.l, p).length) return { src: slot.bar, l: slot.bar.l };
  if (over && over.l && LADDERS[over.l] && availIds(over.l, p).length) return { src: slot, l: over.l };
  const cands = [slot.l].concat(slot.alt || []);
  for (let i = 0; i < cands.length; i++) if (LADDERS[cands[i]] && !used[cands[i]] && availIds(cands[i], p).length) return { src: slot, l: cands[i] };
  return null;
}
function progKey(src, l) { const base = src.pk || src.id; return l === src.l ? base : base + '@' + l; }

function currentId(key, lad, src, p, st) {
  const pr = st.prog[key];
  if (pr && EX[pr.id] && EX[pr.id].l === lad) return isAvail(pr.id, p) ? pr.id : snap(lad, EX[pr.id].i, p);
  // Partenza: livello indicato dalla scheda, adattato al livello e all'obiettivo.
  let idx = (src.start && EX[src.start] && EX[src.start].l === lad) ? EX[src.start].i : 0;
  if (p.level === 'beg') idx -= 1;
  if (p.level === 'adv') idx += 1;
  if (p.obj === 'str' && LADDERS[lad].lv.length > 2) idx += 1;
  // Se lo stesso movimento è già stato allenato altrove, parti da lì (un livello sotto).
  let known = -1;
  Object.keys(st.prog).forEach((k) => { const e = EX[st.prog[k].id]; if (e && e.l === lad) known = Math.max(known, e.i); });
  if (known >= 0) idx = Math.max(idx, known - 1);
  return snap(lad, clamp(idx, 0, LADDERS[lad].lv.length - 1), p);
}

function resolveSlot(slot, p, st, wid, used) {
  const over = st.plan.over[slot.id] || {};
  const pick = slotLadder(slot, p, over, used); if (!pick) return null;
  const src = pick.src; const lad = pick.l; const key = progKey(src, lad);
  const x = currentId(key, lad, src, p, st); if (!x) return null;
  const e = EX[x];
  let sets = src.sets;
  if (p.level === 'beg' && sets >= 4) sets = 3;
  if (p.level === 'adv' && slot.pri === 1 && sets < 4) sets = 4;
  const r = rangeFor(x, src.r, p);
  let rest = src.rest;
  if (p.obj === 'str' && slot.pri === 1) rest = Math.min(180, rest + 30);
  if (p.obj === 'end') rest = Math.max(30, rest - 30);
  if (p.obj === 'fit') rest = Math.max(45, rest - 15);
  if (over.sets) sets = clamp(over.sets, 1, 6);
  const pref = st.prefs[src.id]; if (pref && pref.rest) rest = clamp(pref.rest, 15, 300);
  return { slot: slot.id, id: src.id, key: key, l: lad, x: x, sets: sets, r: r, rSlot: src.r.slice(), rest: rest, side: !!slot.side, note: src === slot ? slot.note : '',
    pri: slot.pri || 2, u: e.u, wid: wid, swapped: lad !== slot.l && src === slot, baseSets: sets };
}

/* Range di ripetizioni (o secondi) di un esercizio: quello proprio dell'esercizio, se esiste, altrimenti quello della scheda. */
function rangeFor(x, slotR, p) {
  const e = EX[x]; const r = (e.r || slotR).slice();
  if (p.obj === 'end') r[1] += e.u === 's' ? 10 : 3;
  return r;
}

/* Stima realistica: tempo di lavoro + recuperi (dopo l'ultima serie non c'è recupero) + cambio esercizio. */
function estSlot(s) {
  const mid = (s.r[0] + s.r[1]) / 2;
  let work = s.u === 's' ? mid + 5 : mid * 3 + 5;
  if (s.side) work *= 2;
  return s.sets * work + (s.sets - 1) * s.rest + 45;
}
function estMin(slots) { return Math.round(slots.reduce((t, s) => t + estSlot(s), 0) / 60); }

/* Adatta il numero di esercizi e di serie alla durata scelta. */
function fitDuration(slots, dur, locked) {
  const target = dur * 60; const tot = () => slots.reduce((t, s) => t + estSlot(s), 0);
  const free = (s) => !locked[s.slot];
  const drop = (pri) => { for (let i = slots.length - 1; i >= 0 && tot() > target + 120; i--) if (slots[i].pri === pri && free(slots[i]) && slots.length > 3) slots.splice(i, 1); };
  drop(3);
  for (let i = slots.length - 1; i >= 0 && tot() > target + 120; i--) if (slots[i].sets >= 4 && free(slots[i])) slots[i].sets = 3;
  drop(2);
  if (tot() < target - 8 * 60) {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]; if (s.pri !== 1 || !free(s) || s.sets >= 5) continue;
      const add = estSlot(Object.assign({}, s, { sets: s.sets + 1 })) - estSlot(s);
      if (tot() + add <= target) s.sets += 1;
    }
  }
  return slots;
}

function splitFor(p) { return SPLITS[clamp(p.wdays.length, 2, 4)]; }

function resolveWorkout(wid, p, st) {
  const W = WORKOUTS[wid];
  const locked = {}; Object.keys(st.plan.over).forEach((k) => { if (st.plan.over[k].sets) locked[k] = 1; });
  const used = {};
  let slots = W.slots.map((s) => { const r = resolveSlot(s, p, st, wid, used); if (r) used[r.l] = 1; return r; }).filter(Boolean);
  slots = fitDuration(slots, p.dur, locked);
  slots.forEach((s) => { s.baseSets = s.sets; });
  const mus = {}; slots.forEach((s) => { mus[EX[s.x].m] = 1; });
  return { wid: wid, name: W.name, slots: slots, min: estMin(slots), sets: slots.reduce((t, s) => t + s.sets, 0),
    muscles: MUSCLE_ORDER.filter((m) => mus[m]) };
}

function program(p, st) { const sp = splitFor(p); return { name: sp.name, order: sp.order, workouts: sp.order.map((w) => resolveWorkout(w, p, st)) }; }

/* Serie settimanali per muscolo: principale = 1 serie, secondario = 0,5. */
function muscleSets(prog) {
  const m = {}; MUSCLE_ORDER.forEach((k) => { m[k] = 0; });
  prog.workouts.forEach((w) => w.slots.forEach((s) => { const e = EX[s.x]; m[e.m] += s.sets; e.s.forEach((k) => { m[k] += s.sets / 2; }); }));
  return m;
}

/* ---------- Calendario ---------- */
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => dkey(new Date());
const parseD = (k) => { const q = k.split('-').map(Number); return new Date(q[0], q[1] - 1, q[2]); };
const dayN = (k) => Math.round(parseD(k).getTime() / 864e5);
const wdayOf = (d) => (d.getDay() + 6) % 7; // 0 = lunedì
function weekStart(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - wdayOf(x)); return x; }
const WD = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const WD1 = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

function nextWid(p, st) {
  const order = splitFor(p).order;
  for (let i = st.sessions.length - 1; i >= 0; i--) {
    const k = order.indexOf(st.sessions[i].wid);
    if (k >= 0) return order[(k + 1) % order.length];
  }
  return order[0];
}

/* Settimana corrente: per ogni giorno allenamenti fatti e scheda prevista. */
function weekPlan(p, st) {
  const ws = weekStart(new Date()); const tk = today(); const order = splitFor(p).order;
  let nxt = order.indexOf(nextWid(p, st));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws); d.setDate(ws.getDate() + i); const k = dkey(d);
    const done = st.sessions.filter((s) => s.d === k);
    const train = p.wdays.indexOf(i) >= 0;
    let plan = null;
    if (train && !done.length && k >= tk) { plan = order[nxt]; nxt = (nxt + 1) % order.length; }
    days.push({ k: k, d: d, i: i, train: train, done: done, plan: plan, today: k === tk, past: k < tk });
  }
  return days;
}
function sessionsThisWeek(st) { const ws = dkey(weekStart(new Date())); return st.sessions.filter((s) => dkey(weekStart(parseD(s.d))) === ws).length; }
function streakWeeks(p, st) {
  const target = p.wdays.length; const counts = {};
  st.sessions.forEach((s) => { const k = dkey(weekStart(parseD(s.d))); counts[k] = (counts[k] || 0) + 1; });
  const w = weekStart(new Date()); let n = 0;
  if ((counts[dkey(w)] || 0) < target) w.setDate(w.getDate() - 7);
  while ((counts[dkey(w)] || 0) >= target) { n++; w.setDate(w.getDate() - 7); }
  return n;
}

/* ---------- Progressione ----------
   Si sale di livello solo se tutte le serie arrivano al massimo del range E:
   - con il RIR registrato: nella maggior parte delle serie restavano ≥ 1 ripetizioni;
   - senza RIR: succede per 2 allenamenti di fila (dati insufficienti → prudenza).
   Se per 2 allenamenti di fila tutte le serie restano sotto il minimo, si propone di scendere. */
function evaluate(e, p, st) {
  const done = e.sets.filter((s) => s.done); if (!done.length) return null;
  const pr = st.prog[e.key] || { id: e.x, hits: 0, low: 0 };
  const same = pr.id === e.x;
  const out = { key: e.key, x: e.x, name: EX[e.x].n, type: null };
  const allTop = e.sets.every((s) => s.done && s.v >= e.r[1]);
  const allLow = done.length === e.sets.length && done.every((s) => s.v < e.r[0]);
  const rirs = done.map((s) => s.rir).filter((r) => r != null);
  const np = { id: e.x, last: e.sets.map((s) => (s.done ? s.v : null)), hits: same ? (pr.hits || 0) : 0, low: same ? (pr.low || 0) : 0, load: e.load || pr.load || null };
  if (allTop) {
    np.low = 0;
    const easy = rirs.filter((r) => r >= 1).length; const fail = rirs.filter((r) => r === 0).length;
    let go = false;
    if (rirs.length >= Math.ceil(done.length / 2)) {
      if (easy > fail) go = true; else { out.type = 'hold'; out.msg = 'Range completato ma al limite: consolida la tecnica e riprova.'; np.hits = 0; }
    } else { np.hits += 1; if (np.hits >= 2) go = true; else { out.type = 'almost'; out.msg = 'Massimo del range raggiunto: se succede anche la prossima volta, sali di livello.'; } }
    if (go) {
      const nx = nextAvail(e.x, p, 1);
      if (nx) { out.type = 'up'; out.from = e.x; out.to = nx; out.toName = EX[nx].n; np.id = nx; np.last = null; np.hits = 0; }
      else { out.type = 'max'; out.msg = EX[e.x].eq.indexOf('backpack') >= 0 ? 'Ultimo livello: aggiungi 1–2 kg nello zaino.' : (EX[e.x].eq.indexOf('band') >= 0 ? 'Ultimo livello: usa un elastico più duro o accorcialo.' : 'Ultimo livello: rallenta la discesa (3–4 s) o aggiungi una pausa.'); np.hits = 0; }
    }
  } else {
    np.hits = 0;
    if (allLow) {
      np.low += 1;
      const pv = nextAvail(e.x, p, -1);
      if (np.low >= 2 && pv) { out.type = 'down'; out.to = pv; out.toName = EX[pv].n; out.msg = 'Due volte sotto il minimo: prova la variante più facile.'; }
    } else np.low = 0;
  }
  return { np: np, out: out };
}

/* ---------- Statistiche ---------- */
function bestSet(x, st, before) {
  let b = 0;
  st.sessions.forEach((s) => { if (before != null && s === before) return; s.ex.forEach((e) => { if (e.x === x) e.reps.forEach((r) => { if (r != null && r > b) b = r; }); }); });
  return b;
}
function exHistory(x, st) {
  const out = [];
  st.sessions.forEach((s) => s.ex.forEach((e) => { if (e.x === x) out.push({ d: s.d, reps: e.reps, rir: e.rir || [], load: e.load || null, u: e.u }); }));
  return out;
}
function weekBuckets(st, n) {
  const ws = weekStart(new Date()); const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const w = new Date(ws); w.setDate(ws.getDate() - 7 * i); const k = dkey(w);
    const ss = st.sessions.filter((s) => dkey(weekStart(parseD(s.d))) === k);
    out.push({ k: k, d: w, n: ss.length, reps: ss.reduce((t, s) => t + (s.vol || 0), 0), min: ss.reduce((t, s) => t + (s.dur || 0), 0) });
  }
  return out;
}
/* Andamento del peso: serve almeno 3 settimane di dati e 6 misurazioni,
   così poche pesate (o un giorno di ritenzione) non producono consigli. */
function weightTrend(st) {
  const w = st.weights; if (w.length < 6) return null;
  const last = dayN(w[w.length - 1].d); if (last - dayN(w[0].d) < 21) return null;
  const avg = (a, b) => { const xs = w.filter((e) => { const d = last - dayN(e.d); return d >= a && d < b; }).map((e) => e.kg); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; };
  const r = avg(0, 7), q = avg(14, 21); if (r == null || q == null) return null;
  const perWeek = (r - q) / 2; return perWeek < 0.1 ? 'flat' : perWeek > 0.5 ? 'fast' : 'ok';
}

/* IMC = kg / m². Fasce per adulti: < 18,5 sottopeso, 18,5–24,9 normopeso, 25–29,9 sovrappeso, ≥ 30 obesità. */
function bmi(kg, cm) { return kg > 0 && cm > 0 ? kg / Math.pow(cm / 100, 2) : null; }
function bmiCat(v) {
  if (v < 18.5) return { n: 'Sottopeso', cls: 'or' };
  if (v < 25) return { n: 'Normopeso', cls: 'ac' };
  if (v < 30) return { n: 'Sovrappeso', cls: 'or' };
  return { n: 'Obesità', cls: 'or' };
}

/* ---------- Riscaldamento e defaticamento ----------
   Gli esercizi "per lato" diventano due passi (destro e sinistro). */
function routineSteps(kind) {
  const out = [];
  (kind === 'warm' ? WARMUP : COOLDOWN).forEach((m) => {
    if (m.side) { out.push({ id: m.id, side: 'destro' }); out.push({ id: m.id, side: 'sinistro' }); } else out.push({ id: m.id });
  });
  return out;
}
function routineMove(id) { return WARMUP.concat(COOLDOWN).find((m) => m.id === id); }
function routineMin(kind) { return Math.round(routineSteps(kind).reduce((t, s) => t + routineMove(s.id).s, 0) / 60); }

/* ---------- Partite (calcio o altro sport) ----------
   Restituisce 'oggi', 'ieri', 'domani' o null per la data indicata. */
function isMatchDay(p, k) { return (p.matchDates || []).indexOf(k) >= 0 || (p.match || []).indexOf(wdayOf(parseD(k))) >= 0; }
function matchNear(p, k) {
  const ds = p.matchDates || [];
  if (ds.length) {
    const near = (d) => ds.indexOf(dkey(new Date(parseD(k).getFullYear(), parseD(k).getMonth(), parseD(k).getDate() + d))) >= 0;
    if (ds.indexOf(k) >= 0) return 'oggi'; if (near(-1)) return 'ieri'; if (near(1)) return 'domani';
  }
  const m = p.match || []; if (!m.length) return null;
  const w = wdayOf(parseD(k));
  if (m.indexOf(w) >= 0) return 'oggi';
  if (m.indexOf((w + 6) % 7) >= 0) return 'ieri';
  if (m.indexOf((w + 1) % 7) >= 0) return 'domani';
  return null;
}

/* ---------- Settimana di scarico ----------
   Dopo 6 settimane di fila "piene" (almeno target − 1 allenamenti) dall'ultimo scarico,
   propone una settimana con una serie in meno e senza salite di livello. */
function deloadStatus(p, st, now) {
  const ws = dkey(weekStart(now || new Date())); const m = st.meta || {};
  if (m.deloadWeek === ws) return { active: true, due: false, weeks: 0 };
  const target = Math.max(1, p.wdays.length - 1); const counts = {};
  st.sessions.forEach((s) => { const k = dkey(weekStart(parseD(s.d))); counts[k] = (counts[k] || 0) + 1; });
  const w = weekStart(now || new Date()); w.setDate(w.getDate() - 7); let n = 0;
  while ((counts[dkey(w)] || 0) >= target && dkey(w) !== m.lastDeload) { n++; w.setDate(w.getDate() - 7); }
  return { active: false, due: n >= 6 && m.deloadSnooze !== ws, weeks: n };
}

/* ---------- Promemoria nel calendario (.ics) ---------- */
const ICS_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
function buildIcs(p, o, now) {
  now = now || new Date();
  const z = (n) => String(n).padStart(2, '0');
  const stamp = now.getUTCFullYear() + z(now.getUTCMonth() + 1) + z(now.getUTCDate()) + 'T' + z(now.getUTCHours()) + z(now.getUTCMinutes()) + '00Z';
  const firstOn = (days, hhmm) => { // primo giorno (da oggi) tra quelli indicati, all'ora indicata
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 8; i++) { if (days.indexOf(wdayOf(d)) >= 0) break; d.setDate(d.getDate() + 1); }
    return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' + hhmm.replace(':', '') + '00';
  };
  const ev = (uid, title, start, dur, rrule, desc) => ['BEGIN:VEVENT', 'UID:' + uid + '@leva-allenamento', 'DTSTAMP:' + stamp, 'DTSTART:' + start, 'DURATION:PT' + dur + 'M', 'RRULE:' + rrule, 'SUMMARY:' + title, 'DESCRIPTION:' + desc,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'TRIGGER:-PT10M', 'END:VALARM', 'END:VEVENT'];
  let L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Leva//Allenamento//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  L = L.concat(ev('allenamento', 'Allenamento Leva', firstOn(p.wdays, o.time), p.dur + 10, 'FREQ=WEEKLY;BYDAY=' + p.wdays.map((i) => ICS_DAYS[i]).join(','), 'Apri Leva e inizia l\'allenamento di oggi.'));
  if (o.weigh) L = L.concat(ev('pesata', 'Pesata (Leva)', firstOn([0, 3], o.weighTime || '08:00'), 5, 'FREQ=WEEKLY;BYDAY=MO,TH', 'Al mattino, a digiuno, poi registra il peso in Leva.'));
  if (o.measures) L = L.concat(ev('misure', 'Misure del corpo (Leva)', firstOn([6], '09:00'), 10, 'FREQ=WEEKLY;INTERVAL=3;BYDAY=SU', 'Braccio, petto, vita e coscia: registrale in Leva.'));
  if (o.backup) L = L.concat(ev('backup', 'Backup dei dati di Leva', firstOn([6], '20:00'), 5, 'FREQ=MONTHLY;BYDAY=1SU', 'Profilo, Salva backup.'));
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}

/* Piano su più settimane: allenamenti previsti (a rotazione), fatti, partite e giorni alleggeriti. */
function calPlan(p, st, weeks) {
  const ws = weekStart(new Date()); const tk = today(); const order = splitFor(p).order;
  let nxt = order.indexOf(nextWid(p, st)); const out = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i); const k = dkey(d);
    const done = st.sessions.filter((s) => s.d === k); const train = p.wdays.indexOf(wdayOf(d)) >= 0;
    let plan = null; if (train && !done.length && k >= tk) { plan = order[nxt]; nxt = (nxt + 1) % order.length; }
    const match = isMatchDay(p, k);
    out.push({ k: k, d: d, i: wdayOf(d), train: train, done: done, plan: plan, today: k === tk, past: k < tk, match: match, light: !!(plan && !match && matchNear(p, k)) });
  }
  return out;
}

/* Obiettivo concreto per una serie (un numero, non un intervallo).
   Prima volta: un valore facile del range (circa 1/4 sopra il minimo; per gli esercizi a tempo il minimo).
   Volte successive: una ripetizione (o 5 secondi) in più della serie peggiore dell'ultima volta,
   uguale per tutte le serie, senza superare il massimo. */
function setTarget(r, u, last, k) {
  const step = u === 's' ? 5 : 1;
  // Stesso obiettivo per tutte le serie: la serie peggiore dell'ultima volta, più uno.
  const done = (last || []).filter((v) => v != null); const prev = done.length ? Math.min.apply(null, done) : null;
  if (prev != null) return Math.max(r[0], Math.min(r[1], prev + step));
  if (u === 's') return r[0];
  return r[0] + Math.round((r[1] - r[0]) * 0.25);
}
/* Frase semplice su cosa fare: "3 serie da 10 ripetizioni per lato". */
function doTxt(n, t, u, side, l) {
  const what = u === 's' ? t + ' secondi' : t + ' ripetizioni';
  const sideTxt = side ? (['squat', 'lunge', 'hinge', 'glute_single', 'calf', 'calf_floor', 'squat_tempo'].indexOf(l) >= 0 ? ' per gamba' : ' per lato') : '';
  return plural(n, 'serie', 'serie') + ' da ' + what + sideTxt;
}
