/* LEVA 2.0 — Stato, salvataggio e migrazione.
   Chiave attuale: leva.v2. La vecchia chiave leva.v1 NON viene mai modificata
   né cancellata: alla prima apertura i dati vengono copiati e convertiti. */
'use strict';

const KEY = 'leva.v2';
const KEY_V1 = 'leva.v1';
const APP_VERSION = '2.9';

function fresh() {
  return { v: 2, profile: null, prog: {}, sessions: [], weights: [], measures: [], active: null,
    plan: { over: {} }, prefs: {}, settings: { sound: true, vibrate: true, voice: true, warm: true, cool: true }, meta: {} };
}

/* Nessuna attrezzatura data per scontata: la sceglie l'utente nell'onboarding. */
function defaultEquip() { return { band: false, backpack: false, chair: false, table: false, sofa: false, step: false, bar: false }; }

function defaultProfile() {
  return { name: '', height: 175, weight: 65.5, goal: 70, level: 'int', obj: 'hyp', wdays: [0, 2, 4], dur: 45,
    equip: defaultEquip(), avoid: [], excl: [], match: [], matchDates: [] };
}

/* Converte un salvataggio v1 nel formato v2, senza perdere niente. */
function migrateV1(d) {
  const s = fresh();
  const p1 = d.profile || {};
  const days = p1.days === 4 ? 4 : 3;
  s.profile = Object.assign(defaultProfile(), {
    name: p1.name || '', height: num(p1.height, 175), weight: num(p1.weight, 65.5), goal: num(p1.goal, 70),
    wdays: days === 4 ? [0, 1, 3, 4] : [0, 2, 4],
    // La v1 usava elastico, zaino, sedia, tavolo e divano.
    equip: Object.assign(defaultEquip(), { band: true, backpack: true, chair: true, table: true, sofa: true, step: true, bar: !!p1.bar })
  });
  const lv = (slotId, idx) => {
    const lad = V1.slotLadder[slotId]; const ids = lad && V1.levels[lad];
    if (!ids) return null; return ids[Math.max(0, Math.min(ids.length - 1, idx | 0))];
  };
  // Progressione
  Object.keys(d.prog || {}).forEach((k) => {
    const p = d.prog[k]; if (!p) return;
    const slotId = k === 'pull' ? 'A3b' : k;
    const id = lv(slotId, p.lvl); if (!id) return;
    s.prog[k] = { id: id, last: Array.isArray(p.last) ? p.last.slice() : null, hits: 0, low: 0 };
  });
  // Allenamenti
  (d.sessions || []).forEach((x) => {
    if (!x || !x.d) return;
    s.sessions.push({ d: x.d, wid: x.wid, wname: V1.wname[x.wid] || ('Scheda ' + x.wid), dur: num(x.dur, 0), vol: num(x.vol, 0), kg: null, v1: true,
      ex: (x.ex || []).map((e) => {
        const id = lv(e.id, e.lvl);
        const k = (e.id === 'A3b' || e.id === 'C3b') ? 'pull' : e.id;
        return { s: e.id, k: k, x: id, reps: (e.reps || []).slice(), rir: [], u: id && EX[id] ? EX[id].u : '' };
      }).filter((e) => e.x) });
  });
  s.weights = (d.weights || []).filter((w) => w && w.d && isFinite(w.kg)).map((w) => ({ d: w.d, kg: +w.kg }));
  s.meta = { migratedFrom: 1, migratedAt: new Date().toISOString(), news: true };
  return s;
}

function clampN(x, a, b) { return Math.max(a, Math.min(b, x)); }
function num(x, def) { const n = parseFloat(x); return isFinite(n) ? n : def; }

/* Controlla e ripara un salvataggio v2 (dati mancanti o corrotti). */
function sanitize(d) {
  const s = Object.assign(fresh(), d);
  s.v = 2;
  if (s.profile) {
    s.profile = Object.assign(defaultProfile(), s.profile);
    s.profile.equip = Object.assign(defaultEquip(), s.profile.equip || {});
    if (!Array.isArray(s.profile.wdays) || s.profile.wdays.length < 2) s.profile.wdays = [0, 2, 4];
    s.profile.wdays = s.profile.wdays.filter((x) => x >= 0 && x <= 6).slice(0, 4).sort();
    if (!Array.isArray(s.profile.avoid)) s.profile.avoid = [];
    if (!Array.isArray(s.profile.excl)) s.profile.excl = [];
    if (!LEVELS[s.profile.level]) s.profile.level = 'int';
    if (!GOALS[s.profile.obj]) s.profile.obj = 'hyp';
    if ([30, 45, 60].indexOf(s.profile.dur) < 0) s.profile.dur = 45;
  }
  if (s.profile) {
    const p = s.profile; const inR = (x, a, b, d) => (isFinite(x) && x >= a && x <= b ? +x : d);
    p.name = String(p.name || '').slice(0, 30);
    p.height = inR(p.height, 120, 230, 175); p.weight = inR(p.weight, 30, 200, 70); p.goal = inR(p.goal, 30, 200, p.weight);
    p.avoid = p.avoid.filter((z) => STRESS[z]); p.excl = p.excl.filter((x) => EX[x]);
    p.neck = !!p.neck;
    p.match = (Array.isArray(p.match) ? p.match : []).filter((x) => Number.isInteger(x) && x >= 0 && x <= 6);
    p.matchDates = Array.from(new Set((Array.isArray(p.matchDates) ? p.matchDates : []).filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort().slice(-200);
    Object.keys(p.equip).forEach((k) => { if (!EQUIP[k]) delete p.equip[k]; else p.equip[k] = !!p.equip[k]; });
  }
  if (!s.prog || typeof s.prog !== 'object' || Array.isArray(s.prog)) s.prog = {};
  Object.keys(s.prog).forEach((k) => { if (!s.prog[k] || !EX[s.prog[k].id]) delete s.prog[k]; });
  const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const okReps = (a) => Array.isArray(a) ? a.slice(0, 12).map((r) => (r == null || !isFinite(r) ? null : clampN(+r, 0, 999))) : [];
  s.sessions = (Array.isArray(s.sessions) ? s.sessions : []).slice(-5000).filter((x) => x && isDay(x.d) && Array.isArray(x.ex)).map((x) => Object.assign({}, x, {
    wname: String(x.wname || ('Scheda ' + x.wid)).slice(0, 60), dur: clampN(+x.dur || 0, 0, 600), vol: clampN(+x.vol || 0, 0, 99999), kg: x.kg && isFinite(x.kg) ? +x.kg : null,
    ex: x.ex.filter((e) => e && EX[e.x]).map((e) => Object.assign({}, e, { reps: okReps(e.reps), rir: okReps(e.rir), u: EX[e.x].u })),
    ups: Array.isArray(x.ups) ? x.ups.map(String) : [] }));
  s.sessions.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  s.weights = Array.isArray(s.weights) ? s.weights.filter((w) => w && isDay(w.d) && isFinite(w.kg) && w.kg >= 30 && w.kg <= 200).map((w) => ({ d: w.d, kg: +w.kg })) : [];
  s.weights.sort((a, b) => (a.d < b.d ? -1 : 1));
  if (!s.plan || typeof s.plan !== 'object') s.plan = { over: {} };
  if (!s.plan.over) s.plan.over = {};
  if (!s.prefs || typeof s.prefs !== 'object') s.prefs = {};
  s.settings = Object.assign({ sound: true, vibrate: true, voice: true, warm: true, cool: true }, s.settings || {});
  const MK = ['arm', 'chest', 'waist', 'thigh'];
  s.measures = (Array.isArray(s.measures) ? s.measures : []).filter((m) => m && isDay(m.d)).map((m) => { const o = { d: m.d }; MK.forEach((k) => { const v = +m[k]; if (isFinite(v) && v >= 15 && v <= 200) o[k] = Math.round(v * 10) / 10; }); return o; }).filter((m) => Object.keys(m).length > 1);
  s.measures.sort((a, b) => (a.d < b.d ? -1 : 1));
  if (!s.meta) s.meta = {};
  if (s.active && (!Array.isArray(s.active.ex) || !s.active.ex.length || !s.active.ex.every((e) => e && EX[e.x] && Array.isArray(e.sets)))) s.active = null;
  return s;
}

/* Riconosce un file (localStorage o backup) e lo porta al formato v2. */
function upgrade(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.v === 2) return sanitize(d);
  if (d.v === 1) return sanitize(migrateV1(d));
  return null;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      let s = null;
      try { s = upgrade(JSON.parse(raw)); } catch (e) { s = null; }
      if (s) return s;
      // Dati illeggibili: ne conservo una copia prima di ripartire.
      try { localStorage.setItem(KEY + '.corrotto', raw); } catch (e) {}
    }
  } catch (e) {}
  try {
    const raw1 = localStorage.getItem(KEY_V1);
    if (raw1) { const s = upgrade(JSON.parse(raw1)); if (s && s.profile) { saveState(s); return s; } }
  } catch (e) {}
  return fresh();
}

let saveFailed = false;
function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); saveFailed = false; return true; }
  catch (e) { saveFailed = true; return false; }
}
