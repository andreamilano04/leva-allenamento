/* LEVA — Test automatici delle funzioni di calcolo.
   Uso: node tests/run.js   (nessuna dipendenza da installare)
   Controlla dati, generatore del programma, progressione, migrazione v1 → v2,
   validazione dei backup, IMC e copertura delle animazioni. */
'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ctx = { console, Math, JSON, Date, localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); } } };
vm.createContext(ctx);
['data.js', 'store.js', 'engine.js', 'anim.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
const R = (code) => vm.runInContext(code, ctx);

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'condizione falsa'); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'diverso') + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); }

const EQ = ['band', 'backpack', 'chair', 'table', 'sofa', 'step', 'bar'];
const combos = [];
for (let m = 0; m < 1 << EQ.length; m += 3) combos.push(EQ.filter((_, i) => m & (1 << i)));
function profile(eq, days, dur, extra) {
  return R('(function(eq,days,dur,extra){const p=defaultProfile();eq.forEach(k=>p.equip[k]=true);p.wdays=days;p.dur=dur;Object.assign(p,extra||{});return p;})')(eq, days, dur, extra);
}
function prog(p, st) { st = st || R('fresh()'); st.profile = p; return R('program')(p, st); }

console.log('\nDati');
test('ID degli esercizi unici', () => { const ids = []; Object.values(R('LADDERS')).forEach((L) => L.lv.forEach((l) => ids.push(l.id))); eq(ids.length, new Set(ids).size, 'ID duplicati'); });
test('ID degli slot unici', () => { const ids = []; Object.values(R('WORKOUTS')).forEach((w) => w.slots.forEach((s) => { ids.push(s.id); if (s.bar) ids.push(s.bar.id); })); eq(ids.length, new Set(ids).size); });
test('Scale, alternative e partenze delle schede esistono', () => {
  const L = R('LADDERS'), EX = R('EX');
  Object.values(R('WORKOUTS')).forEach((w) => w.slots.forEach((s) => {
    [s.l].concat(s.alt || [], s.bar ? [s.bar.l] : []).forEach((l) => ok(L[l], 'scala mancante: ' + l + ' in ' + s.id));
    if (s.start) ok(EX[s.start] && EX[s.start].l === s.l, 'start non valido in ' + s.id);
    if (s.bar && s.bar.start) ok(EX[s.bar.start] && EX[s.bar.start].l === s.bar.l, 'start sbarra non valido in ' + s.id);
  }));
});
test('Ogni esercizio ha descrizione, esecuzione ed errori comuni', () => { Object.values(R('EX')).forEach((e) => { ok(e.d && e.how.length >= 2 && e.err.length >= 1, 'incompleto: ' + e.id); }); });
test('Ogni esercizio ha un’animazione', () => { const A = R('EX_ANIM'), AN = R('ANIMS'); Object.keys(R('EX')).forEach((id) => ok(A[id] && AN[A[id]], 'animazione mancante: ' + id)); });
test('Le animazioni si calcolano senza valori non validi', () => { Object.keys(R('ANIMS')).forEach((k) => [0, 0.5, 1].forEach((t) => { const svg = R('frameInner')(k, t); ok(svg.indexOf('NaN') < 0, 'NaN in ' + k); })); });
test('Tabella di migrazione v1 punta a esercizi esistenti', () => { const V1 = R('V1'), EX = R('EX'); Object.values(V1.levels).forEach((a) => a.forEach((id) => ok(EX[id], 'mancante ' + id))); });

console.log('\nGeneratore del programma');
test('Nessun movimento ripetuto nella stessa seduta (tutte le combinazioni di attrezzatura)', () => {
  combos.forEach((eqs) => [[0, 3], [0, 2, 4], [0, 1, 3, 4]].forEach((d) => prog(profile(eqs, d, 45)).workouts.forEach((w) => {
    const ls = w.slots.map((s) => s.l); eq(ls.length, new Set(ls).size, 'duplicato in ' + w.wid + ' con ' + eqs.join('+'));
  })));
});
test('Gli esercizi scelti usano solo l’attrezzatura disponibile', () => {
  const EX = R('EX');
  combos.forEach((eqs) => prog(profile(eqs, [0, 2, 4], 45)).workouts.forEach((w) => w.slots.forEach((s) => EX[s.x].eq.forEach((q) => ok(eqs.indexOf(q) >= 0, s.x + ' richiede ' + q)))));
});
test('Ogni scheda ha almeno 4 esercizi, anche a solo corpo libero', () => {
  [[], ['band'], ['backpack']].forEach((eqs) => prog(profile(eqs, [0, 2, 4], 30)).workouts.forEach((w) => ok(w.slots.length >= 4, w.wid + ' ha ' + w.slots.length + ' esercizi')));
});
test('La durata stimata rispetta quella scelta (±5 min)', () => {
  [30, 45, 60].forEach((dur) => prog(profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], dur)).workouts.forEach((w) => ok(w.min <= dur + 5, w.wid + ': ' + w.min + ' min con durata ' + dur)));
});
test('Il volume settimanale non lascia muscoli importanti scoperti', () => {
  const m = R('muscleSets')(prog(profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], 45)));
  ['pet', 'dor', 'qua', 'glu'].forEach((k) => ok(m[k] >= 8, k + ' = ' + m[k]));
  ['fem', 'pol', 'core'].forEach((k) => ok(m[k] >= 4, k + ' = ' + m[k]));
});
test('Le zone da proteggere escludono gli esercizi che le sollecitano', () => {
  const EX = R('EX');
  prog(profile(['band', 'backpack', 'chair', 'sofa', 'step', 'bar'], [0, 2, 4], 60, { avoid: ['spalle', 'polsi', 'ginocchia'] })).workouts.forEach((w) => w.slots.forEach((s) => ok(EX[s.x].st.every((z) => ['spalle', 'polsi', 'ginocchia'].indexOf(z) < 0), s.x)));
});
test('Con la sbarra compaiono le trazioni', () => { const xs = []; prog(profile(['bar'], [0, 2, 4], 45)).workouts.forEach((w) => w.slots.forEach((s) => xs.push(s.l))); ok(xs.indexOf('pull') >= 0, 'nessuna trazione'); });

console.log('\nProgressione');
function sess(x, r, reps, rir) { return { key: 'T', x: x, r: r, u: '', sets: reps.map((v, i) => ({ v: v, done: v != null, rir: rir ? rir[i] : null })) }; }
const P0 = profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], 45);
test('Sale di livello: massimo del range con margine (RIR ≥ 1)', () => { const st = R('fresh()'); const r = R('evaluate')(sess('ph_classic', [8, 15], [15, 15, 15], [2, 1, 1]), P0, st); eq(r.out.type, 'up'); eq(r.np.id, 'ph_decline'); });
test('Non sale se al limite (RIR 0 nella maggior parte delle serie)', () => { const st = R('fresh()'); const r = R('evaluate')(sess('ph_classic', [8, 15], [15, 15, 15], [0, 0, 1]), P0, st); eq(r.out.type, 'hold'); eq(r.np.id, 'ph_classic'); });
test('Senza RIR servono 2 allenamenti di fila al massimo', () => {
  const st = R('fresh()'); const e = sess('ph_classic', [8, 15], [15, 15, 15]);
  const r1 = R('evaluate')(e, P0, st); eq(r1.out.type, 'almost'); st.prog.T = r1.np;
  const r2 = R('evaluate')(e, P0, st); eq(r2.out.type, 'up');
});
test('Due volte sotto il minimo propone la variante più facile', () => {
  const st = R('fresh()'); const e = sess('ph_decline', [8, 15], [5, 4, 4]);
  const r1 = R('evaluate')(e, P0, st); ok(r1.out.type !== 'down'); st.prog.T = r1.np;
  const r2 = R('evaluate')(e, P0, st); eq(r2.out.type, 'down'); eq(r2.out.to, 'ph_classic');
});
test('Serie incompleta: niente salita', () => { const st = R('fresh()'); const r = R('evaluate')(sess('ph_classic', [8, 15], [15, 15, null], [2, 2, null]), P0, st); ok(r.out.type !== 'up'); });

console.log('\nDati salvati');
const v1 = { v: 1, profile: { name: 'Andrea', height: 175, weight: 65.5, goal: 70, days: 3, bar: false }, prog: { A1: { lvl: 1, last: [12, 11, 10, 10] }, pull: { lvl: 0 } },
  sessions: [{ d: '2026-11-16', wid: 'A', dur: 48, vol: 150, ex: [{ id: 'A1', lvl: 1, reps: [12, 11, 10, 10] }, { id: 'A3b', lvl: 0, reps: [5, 4, 4, 4] }] }], weights: [{ d: '2026-11-16', kg: 65.6 }] };
test('Migrazione v1 → v2 conserva livelli, allenamenti e pesi', () => {
  const s = R('upgrade')(JSON.parse(JSON.stringify(v1)));
  eq(s.v, 2); eq(s.prog.A1.id, 'ph_decline'); eq(s.prog.pull.id, 'pu_neg');
  eq(s.sessions.length, 1); eq(s.sessions[0].ex[0].x, 'ph_decline'); eq(s.sessions[0].ex[1].k, 'pull'); eq(s.weights[0].kg, 65.6);
  ok(s.profile.equip.band && s.profile.equip.table, 'attrezzatura v1 non mantenuta');
});
test('Backup corrotto: dati non validi scartati, app utilizzabile', () => {
  const s = R('upgrade')({ v: 2, profile: { height: 999, weight: 'x', goal: 70, wdays: [0, 2, 9], equip: { razzo: true }, avoid: ['boh'], excl: ['nope'] }, prog: { A1: { id: 'nope' } },
    sessions: [{ d: 'ieri', ex: [] }, { d: '2026-11-10', wid: 'A', ex: [{ x: 'ph_classic', reps: [10, 'a'] }, { x: 'fantasma', reps: [1] }] }], weights: [{ d: '2026-11-10', kg: 500 }] });
  eq(s.profile.height, 175); eq(s.profile.wdays, [0, 2]); eq(s.profile.avoid, []); ok(!s.profile.equip.razzo); eq(Object.keys(s.prog), []);
  eq(s.sessions.length, 1); eq(s.sessions[0].ex.length, 1); eq(s.sessions[0].ex[0].reps, [10, null]); eq(s.weights, []);
});
test('File non riconosciuto rifiutato', () => { eq(R('upgrade')({ ciao: 1 }), null); eq(R('upgrade')(null), null); });
test('Nuovo profilo: nessuna attrezzatura data per scontata', () => { const e = R('defaultEquip()'); ok(Object.values(e).every((v) => v === false)); });

console.log('\nIMC');
test('IMC calcolato correttamente', () => { ok(Math.abs(R('bmi')(65.5, 175) - 21.39) < 0.01); });
test('Fasce IMC', () => { eq(R('bmiCat')(18.4).n, 'Sottopeso'); eq(R('bmiCat')(18.5).n, 'Normopeso'); eq(R('bmiCat')(24.99).n, 'Normopeso'); eq(R('bmiCat')(25).n, 'Sovrappeso'); eq(R('bmiCat')(30).n, 'Obesità'); });

console.log('\n' + pass + ' superati, ' + fail + ' falliti\n');
process.exit(fail ? 1 : 0);
