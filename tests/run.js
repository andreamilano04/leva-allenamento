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

console.log('\nCodice');
test('Nessun nome globale duplicato tra i file (una funzione non deve sovrascriverne un’altra)', () => {
  const seen = {}; const dup = [];
  ['data.js', 'store.js', 'engine.js', 'ui.js', 'anim.js', 'views.js', 'app.js'].forEach((f) => {
    fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8').split('\n').forEach((ln) => {
      const m = ln.match(/^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/); if (!m) return;
      if (seen[m[1]] && seen[m[1]] !== f) dup.push(m[1] + ' (' + seen[m[1]] + ', ' + f + ')'); seen[m[1]] = f;
    });
  });
  eq(dup, [], 'duplicati');
});

console.log('\nDati');
test('ID degli esercizi unici', () => { const ids = []; Object.values(R('LADDERS')).forEach((L) => L.lv.forEach((l) => ids.push(l.id))); eq(ids.length, new Set(ids).size, 'ID duplicati'); });
test('ID degli slot unici', () => { const ids = []; Object.values(R('WORKOUTS')).forEach((w) => w.slots.forEach((s) => { ids.push(s.id); if (s.bar) ids.push(s.bar.id); })); eq(ids.length, new Set(ids).size); });
test('Scale, alternative e partenze delle schede esistono', () => {
  const L = R('LADDERS'), EX = R('EX');
  Object.values(R('WORKOUTS')).forEach((w) => w.slots.forEach((s) => {
    [s.l].concat(s.alt || [], s.bar ? [s.bar.l] : []).forEach((l) => ok(L[l], 'scala mancante: ' + l + ' in ' + s.id));
    if (s.start) [].concat(s.start).forEach((id, i) => ok(EX[id] && (i === 0 ? EX[id].l === s.l : [s.l].concat(s.alt || []).indexOf(EX[id].l) >= 0), 'start non valido in ' + s.id + ': ' + id));
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
test('Priorità parte alta: a 60 min almeno 10 serie a settimana per petto, schiena, spalle e braccia; gambe almeno a mantenimento', () => {
  const m = R('muscleSets')(prog(profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], 60, { focus: 'upper' })));
  ['pet', 'dor', 'spa', 'bic', 'tri'].forEach((k) => ok(m[k] >= 10, k + ' = ' + m[k]));
  ['qua', 'glu'].forEach((k) => ok(m[k] >= 4, k + ' = ' + m[k]));
});
test('Alimentazione: calorie e proteine plausibili', () => {
  const n = R('nutriPlan')(profile([], [0, 2, 4], 60, { height: 175, age: 22, sex: 'm', matchDates: ['2026-12-01'] }), 65.5);
  ok(n.kcal > 2600 && n.kcal < 3300, 'kcal ' + n.kcal); ok(n.pLo === 105 && n.pHi === 144, 'proteine ' + n.pLo + '-' + n.pHi); ok(n.carb > 250 && n.fat > 50, 'macro');
});
test('Volume: i grandi muscoli sempre coperti, il programma completo a 60 minuti', () => {
  const m45 = R('muscleSets')(prog(profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], 45, { focus: 'bal' })));
  ['pet', 'dor', 'qua', 'glu'].forEach((k) => ok(m45[k] >= 8, '45 min: ' + k + ' = ' + m45[k])); ok(m45.fem >= 5, '45 min: femorali = ' + m45.fem);
  const m60 = R('muscleSets')(prog(profile(['band', 'backpack', 'chair', 'sofa', 'step'], [0, 2, 4], 60, { focus: 'bal' })));
  ['fem', 'pol', 'core'].forEach((k) => ok(m60[k] >= 3, '60 min: ' + k + ' = ' + m60[k]));
});
test('Le zone da proteggere escludono gli esercizi che le sollecitano', () => {
  const EX = R('EX');
  prog(profile(['band', 'backpack', 'chair', 'sofa', 'step', 'bar'], [0, 2, 4], 60, { avoid: ['spalle', 'polsi', 'ginocchia'] })).workouts.forEach((w) => w.slots.forEach((s) => ok(EX[s.x].st.every((z) => ['spalle', 'polsi', 'ginocchia'].indexOf(z) < 0), s.x)));
});
test('Con la sbarra compaiono le trazioni', () => { const xs = []; prog(profile(['bar'], [0, 2, 4], 45)).workouts.forEach((w) => w.slots.forEach((s) => xs.push(s.l))); ok(xs.indexOf('pull') >= 0, 'nessuna trazione'); });

console.log('\nProfilo di riferimento: intermedio, 3 giorni, 45 min, ipertrofia, zaino + sedia + divano');
const REF = (focus) => profile(['backpack', 'chair', 'sofa'], [0, 2, 4], 45, { level: 'int', obj: 'hyp', focus: focus });
const GROUPS = ['pet', 'dor', 'spa', 'bic', 'tri', 'qua', 'fem', 'glu', 'pol', 'core'];
const direct = (pr, m) => pr.workouts.reduce((t, w) => t + w.slots.filter((s) => R('EX')[s.x].m === m).reduce((a, s) => a + s.sets, 0), 0);
['bal', 'upper'].forEach((focus) => {
  const pr = prog(REF(focus)); const m = R('muscleSets')(pr); const EX = R('EX');
  test(focus + ': nessun gruppo muscolare escluso (almeno 4 serie equivalenti a settimana)', () => GROUPS.forEach((k) => ok(m[k] >= 4, k + ' = ' + m[k])));
  test(focus + ': polpacci e core con lavoro diretto (almeno 4 serie in 2 sedute)', () => ['pol', 'core'].forEach((k) => {
    ok(direct(pr, k) >= 4, k + ' diretto = ' + direct(pr, k));
    ok(pr.workouts.filter((w) => w.slots.some((s) => EX[s.x].m === k)).length >= 2, k + ' in meno di 2 sedute');
  }));
  test(focus + ': petto e dorsali almeno 10 serie, nessuna seduta oltre 11 serie dirette per muscolo', () => {
    ok(m.pet >= 10 && m.dor >= 10, 'pet ' + m.pet + ', dor ' + m.dor);
    pr.workouts.forEach((w) => GROUPS.forEach((k) => { const n = w.slots.filter((s) => EX[s.x].m === k).reduce((a, s) => a + s.sets, 0); ok(n <= 11, w.wid + ' ' + k + ' = ' + n); }));
  });
  test(focus + ': durata 40–50 minuti per ogni scheda', () => pr.workouts.forEach((w) => ok(w.min >= 40 && w.min <= 50, w.wid + ' = ' + w.min + ' min')));
  test(focus + ': nessun esercizio ripetuto e almeno 2 serie per esercizio', () => pr.workouts.forEach((w) => {
    const ls = w.slots.map((s) => s.l); eq(ls.length, new Set(ls).size, 'scala ripetuta in ' + w.wid);
    const xs = w.slots.map((s) => s.x); eq(xs.length, new Set(xs).size, 'esercizio ripetuto in ' + w.wid);
    w.slots.forEach((s) => ok(s.sets >= 2, s.x + ' con ' + s.sets + ' serie'));
  }));
  test(focus + ': solo attrezzatura disponibile (niente elastico né sbarra)', () => pr.workouts.forEach((w) => w.slots.forEach((s) => ok(R('isAvail')(s.x, REF(focus)), s.x))));
});
test('Parte alta: più serie per la parte alta e meno per le gambe rispetto a equilibrata', () => {
  const b = R('muscleSets')(prog(REF('bal'))), u = R('muscleSets')(prog(REF('upper')));
  const up = (m) => m.pet + m.dor + m.spa + m.bic + m.tri, leg = (m) => m.qua + m.fem + m.glu;
  ok(up(u) > up(b), 'parte alta ' + up(u) + ' vs ' + up(b)); ok(leg(u) < leg(b), 'gambe ' + leg(u) + ' vs ' + leg(b));
});
test('Nuovo profilo: priorità equilibrata, età e sesso non impostati', () => { const p = R('defaultProfile()'); eq([p.focus, p.age, p.sex], ['bal', null, null]); });
test('Alimentazione: nessuna stima senza età e sesso inseriti', () => {
  ok(R('nutriPlan')(profile([], [0, 2, 4], 60), 65.5) === null, 'stima con dati inventati');
  ok(R('nutriPlan')(profile([], [0, 2, 4], 60, { age: 22, sex: 'm' }), 65.5).kcal > 0);
});
test('Salvataggio: la priorità scelta (parte alta) resta, valori strani tornano a equilibrata', () => {
  const base = { v: 2, profile: { height: 175, weight: 65.5, goal: 70, wdays: [0, 2, 4], equip: {} } };
  eq(R('upgrade')(JSON.parse(JSON.stringify(Object.assign({}, base, { profile: Object.assign({}, base.profile, { focus: 'upper', age: 22, sex: 'm' }) })))).profile.focus, 'upper');
  const s = R('upgrade')(JSON.parse(JSON.stringify(Object.assign({}, base, { profile: Object.assign({}, base.profile, { focus: 'boh', age: 300, sex: 'x' }) }))));
  eq([s.profile.focus, s.profile.age, s.profile.sex], ['bal', null, null]);
});

console.log('\nVarietà della tirata e recuperi');
const PULL_L = ['row', 'row_bp', 'row_band', 'pulldown_band', 'pull', 'chin', 'pullover_bp', 'prone_pull'];
const EQUIPS = [['backpack', 'chair', 'sofa'], ['backpack', 'chair'], ['band', 'backpack', 'chair', 'sofa', 'step'], ['bar', 'backpack', 'chair'], ['table', 'backpack', 'chair'], ['band', 'bar', 'backpack', 'chair', 'table']];
test('Tirata: nessuna variante identica in tutte e tre le sedute (6 combinazioni di attrezzatura, 2 priorità)', () => EQUIPS.forEach((eqs) => ['bal', 'upper'].forEach((focus) => {
  const pr = prog(profile(eqs, [0, 2, 4], 45, { level: 'int', focus: focus }));
  const per = pr.workouts.map((w) => w.slots.filter((s) => PULL_L.indexOf(s.l) >= 0).map((s) => s.x));
  per.forEach((xs, i) => ok(xs.length >= 1, eqs.join('+') + ': nessuna tirata in ' + pr.workouts[i].wid));
  per[0].forEach((x) => ok(!(per[1].indexOf(x) >= 0 && per[2].indexOf(x) >= 0), eqs.join('+') + ' ' + focus + ': ' + x + ' in A, B e C'));
})));
test('Profilo di riferimento: almeno 2 varianti di rematore nella settimana', () => {
  const xs = new Set(); prog(REF('bal')).workouts.forEach((w) => w.slots.forEach((s) => { if (s.l === 'row_bp') xs.add(s.x); }));
  ok(xs.size >= 2, [...xs].join(', '));
});
test('Il rematore di C resta a un braccio anche dopo i progressi di A', () => {
  const st = R('fresh()'); st.prog['A3@row_bp'] = { id: 'rb_one' };
  const p = REF('bal'); st.profile = p; const w = R('program')(p, st).workouts;
  eq(w.find((x) => x.wid === 'C').slots.find((s) => s.l === 'row_bp').x, 'rb_one');
});
test('Recuperi: valori effettivi uguali a quelli dichiarati (120/90/60/45 s)', () => {
  const pr = prog(profile(['band', 'bar', 'backpack', 'chair', 'sofa', 'step', 'table'], [0, 2, 4], 60, { level: 'int', obj: 'hyp', neck: true }));
  const COMP = R('COMPOUND'); let n = 0;
  pr.workouts.forEach((w) => w.slots.forEach((s) => {
    const want = /^neck_/.test(s.l) ? 45 : ['core', 'hang_core', 'calf', 'calf_floor', 'shrug_bp'].indexOf(s.l) >= 0 ? 60 : (COMP.indexOf(s.l) >= 0 && s.pri === 1) ? 120 : 90;
    eq(s.rest, want, s.x + ' in ' + w.wid); n++;
  }));
  ok(n > 15, 'troppo pochi esercizi controllati');
});
test('Recuperi: le schede non hanno valori propri che possano contraddire il motore', () => Object.values(R('WORKOUTS')).forEach((w) => w.slots.forEach((s) => { ok(s.rest === undefined, s.id); if (s.bar) ok(s.bar.rest === undefined, s.bar.id); })));
test('Recuperi: obiettivo forza +30 s sui principali, mai oltre 180 s', () => prog(profile(['backpack', 'chair', 'sofa'], [0, 2, 4], 60, { obj: 'str' })).workouts.forEach((w) => w.slots.forEach((s) => { ok(s.rest <= 180, s.x); if (s.pri === 1 && R('COMPOUND').indexOf(s.l) >= 0) eq(s.rest, 150, s.x); })));

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
  ok(Object.values(s.profile.equip).every((v) => v === false), 'la v1 non chiedeva l’attrezzatura: niente va dato per scontato');
  ok(s.meta.equipCheck && s.meta.news, 'l’app deve chiedere di confermare l’attrezzatura');
  const s2 = R('upgrade')(Object.assign(JSON.parse(JSON.stringify(v1)), { profile: Object.assign({}, v1.profile, { bar: true }) }));
  ok(s2.profile.equip.bar, 'la sbarra scelta nella v1 resta');
});
test('Backup corrotto: dati non validi scartati, app utilizzabile', () => {
  const s = R('upgrade')({ v: 2, profile: { height: 999, weight: 'x', goal: 70, wdays: [0, 2, 9], equip: { razzo: true }, avoid: ['boh'], excl: ['nope'] }, prog: { A1: { id: 'nope' } },
    sessions: [{ d: 'ieri', ex: [] }, { d: '2026-11-10', wid: 'A', ex: [{ x: 'ph_classic', reps: [10, 'a'] }, { x: 'fantasma', reps: [1] }] }], weights: [{ d: '2026-11-10', kg: 500 }] });
  eq(s.profile.height, 175); eq(s.profile.wdays, [0, 2]); eq(s.profile.avoid, []); ok(!s.profile.equip.razzo); eq(Object.keys(s.prog), []);
  eq(s.sessions.length, 1); eq(s.sessions[0].ex.length, 1); eq(s.sessions[0].ex[0].reps, [10, null]); eq(s.weights, []);
});
test('File non riconosciuto rifiutato', () => { eq(R('upgrade')({ ciao: 1 }), null); eq(R('upgrade')(null), null); });
test('Nuovo profilo: nessuna attrezzatura data per scontata', () => { const e = R('defaultEquip()'); ok(Object.values(e).every((v) => v === false)); });

console.log('\nObiettivi delle serie');
test('Prima volta: obiettivo facile dentro il range', () => { eq(R('setTarget')([8, 15], '', null, 0), 10); eq(R('setTarget')([6, 12], '', null, 0), 8); eq(R('setTarget')([30, 60], 's', null, 0), 30); });
test('Volte successive: stesso obiettivo per tutte le serie (peggiore + 1), massimo del range', () => { eq(R('setTarget')([8, 15], '', [12, 11, 10, 9], 0), 10); eq(R('setTarget')([8, 15], '', [12, 11, 10, 9], 3), 10); eq(R('setTarget')([8, 15], '', [15, 15], 0), 15); eq(R('setTarget')([8, 15], '', [5], 0), 8); eq(R('setTarget')([8, 15], '', [12, null], 2), 13); eq(R('setTarget')([30, 60], 's', [40], 0), 45); });
test('Frase semplice', () => { vm.runInContext("var plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);", ctx); eq(R('doTxt')(3, 10, '', true, 'squat'), '3 serie da 10 ripetizioni per gamba'); eq(R('doTxt')(3, 30, 's', false, 'core'), '3 serie da 30 secondi'); });

console.log('\nRitmo e collo');
test('Ogni esercizio ha un ritmo con fasi valide', () => { Object.keys(R('EX')).forEach((x) => { const ph = R('tempoPhases')(R('tempoOf')(x)); ok(ph.length >= 2 && ph.every((p) => p.s > 0 && typeof p.v === 'string' && p.v.length <= 8), 'ritmo non valido: ' + x); ok(R('tempoTxt')(R('tempoOf')(x)).length > 5); }); });
test('Testo del ritmo', () => { eq(R('tempoTxt')(R('tempoOf')('ph_classic')), 'Scendi in 2 s · spingi in 1 s'); eq(R('tempoTxt')(R('tempoOf')('rt_pause')), 'Tira in 1 s · tieni 2 s · torna in 3 s'); });
test('Blocco collo solo se attivato, in fondo alla scheda', () => {
  const p = profile(['backpack'], [0, 2, 4], 45); const no = prog(p).workouts[0].slots.map((s) => s.slot);
  ok(no.every((x) => x[0] !== 'N'), 'collo presente senza attivarlo');
  p.neck = true; const yes = prog(p).workouts[0].slots.map((s) => s.slot); eq(yes.slice(-4), ['N1', 'N2', 'N3', 'N4']);
  p.equip.backpack = false; ok(prog(p).workouts[0].slots.every((s) => s.slot !== 'N4'), 'scrollate senza zaino');
});

console.log('\nIMC');
test('IMC calcolato correttamente', () => { ok(Math.abs(R('bmi')(65.5, 175) - 21.39) < 0.01); });
test('Fasce IMC', () => { eq(R('bmiCat')(18.4).n, 'Sottopeso'); eq(R('bmiCat')(18.5).n, 'Normopeso'); eq(R('bmiCat')(24.99).n, 'Normopeso'); eq(R('bmiCat')(25).n, 'Sovrappeso'); eq(R('bmiCat')(30).n, 'Obesità'); });

console.log('\nRiscaldamento, partite, scarico, calendario');
test('Riscaldamento e defaticamento: esercizi con animazione e durata', () => {
  R('WARMUP.concat(COOLDOWN)').forEach((m) => { ok(R('ANIMS')[m.a], 'animazione mancante: ' + m.id); ok(m.s >= 15 && m.d, 'dati incompleti: ' + m.id); });
  const c = R('routineSteps')('cool'); ok(c.filter((x) => x.side).length % 2 === 0, 'lati non appaiati');
  const wm = R('routineMin')('warm'); ok(wm >= 3 && wm <= 7, 'riscaldamento di ' + wm + ' min');
});
test('Partite: oggi, ieri, domani', () => {
  const p = profile([], [0, 2, 4], 45, { match: [5] }); // sabato
  eq(R('matchNear')(p, '2026-11-21'), 'oggi'); eq(R('matchNear')(p, '2026-11-22'), 'ieri'); eq(R('matchNear')(p, '2026-11-20'), 'domani'); eq(R('matchNear')(p, '2026-11-18'), null);
  eq(R('matchNear')(profile([], [0, 2, 4], 45), '2026-11-21'), null);
});
test('Partite per data: rinvii e fine settimana variabili', () => {
  const p = profile([], [0, 2, 4], 45, { matchDates: ['2026-11-22', '2026-11-28'] });
  eq(R('matchNear')(p, '2026-11-21'), 'domani'); eq(R('matchNear')(p, '2026-11-22'), 'oggi'); eq(R('matchNear')(p, '2026-11-23'), 'ieri'); eq(R('matchNear')(p, '2026-11-25'), null); eq(R('matchNear')(p, '2026-11-29'), 'ieri');
  const s = R('upgrade')({ v: 2, profile: { height: 175, weight: 65, goal: 70, matchDates: ['2026-11-22', 'x', '2026-11-22'] } }); eq(s.profile.matchDates, ['2026-11-22']);
});
test('Calendario a 4 settimane: rotazione, partite e giorni alleggeriti', () => {
  const p = profile([], [0, 2, 4], 45, { matchDates: [R('dkey')(new Date(Date.now() + 2 * 864e5))] }); const st = R('fresh()'); st.profile = p;
  const c = R('calPlan')(p, st, 4); eq(c.length, 28);
  const plans = c.filter((d) => d.plan).map((d) => d.plan); ok(plans.length >= 9, 'pochi allenamenti previsti');
  for (let i = 1; i < plans.length; i++) ok(plans[i] !== plans[i - 1], 'rotazione non corretta');
  ok(c.some((d) => d.match), 'partita non segnata');
});
test('Scarico proposto dopo 6 settimane piene, non prima', () => {
  const p = profile([], [0, 2, 4], 45); const now = R('parseD')('2026-11-18');
  const mk = (weeks) => { const st = R('fresh()'); for (let w = 1; w <= weeks; w++) for (let k = 0; k < 3; k++) { const d = new Date(2026, 10, 16 - 7 * w + k * 2); st.sessions.push({ d: R('dkey')(d), ex: [] }); } return st; };
  ok(!R('deloadStatus')(p, mk(5), now).due, '5 settimane: troppo presto'); ok(R('deloadStatus')(p, mk(6), now).due, '6 settimane: dovrebbe proporlo');
  const st = mk(8); st.meta.deloadWeek = '2026-11-16'; ok(R('deloadStatus')(p, st, now).active, 'scarico attivo');
  const st2 = mk(8); st2.meta.deloadSnooze = '2026-11-16'; ok(!R('deloadStatus')(p, st2, now).due, 'rimandato');
});
test('File calendario valido con ricorrenze', () => {
  const ics = R('buildIcs')(profile([], [0, 2, 4], 45), { time: '18:30', weigh: true, measures: true, backup: true }, new Date(2026, 10, 18, 12));
  ok(ics.startsWith('BEGIN:VCALENDAR') && ics.trim().endsWith('END:VCALENDAR'));
  ok(ics.indexOf('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR') > 0, 'giorni allenamento'); ok(ics.indexOf('DTSTART:20261118T183000') > 0, 'primo allenamento mercoledì 18');
  eq((ics.match(/BEGIN:VEVENT/g) || []).length, 4); ok(ics.indexOf('\r\n') > 0, 'righe CRLF');
});
test('Misure del corpo validate nei backup', () => {
  const s = R('upgrade')({ v: 2, profile: { height: 175, weight: 65, goal: 70 }, measures: [{ d: '2026-11-01', arm: 31.24, waist: 999 }, { d: 'x', arm: 30 }, { d: '2026-11-02', chest: 'a' }] });
  eq(s.measures, [{ d: '2026-11-01', arm: 31.2 }]);
});

console.log('\n' + pass + ' superati, ' + fail + ' falliti\n');
process.exit(fail ? 1 : 0);
