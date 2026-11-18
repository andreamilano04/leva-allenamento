/* LEVA — Animazioni degli esercizi.
   Un "omino" con proporzioni umane disegnato in SVG. Ogni animazione ha due pose (a, b):
   la figura passa dall'una all'altra in loop. Le braccia e le gambe usano la cinematica
   inversa (si indica dove devono stare mani e piedi), così gli arti mantengono la lunghezza.
   Coordinate: viewBox 0..160 × -12..112, pavimento a y = 104, la figura guarda a destra. */
'use strict';

const BODY = { torso: 30, neck: 11, ua: 15, fa: 14, th: 19, sh: 19, foot: 6.5, head: 6.8 };
const FLOOR = 104;
const dirv = (a) => { const r = (a * Math.PI) / 180; return [Math.sin(r), Math.cos(r)]; };
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];

function ik2(root, tgt, L1, L2, hint) {
  const dx = tgt[0] - root[0], dy = tgt[1] - root[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const dc = Math.max(Math.abs(L1 - L2) + 0.01, Math.min(L1 + L2 - 0.01, d));
  const base = Math.atan2(dy, dx);
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc))));
  const j1 = [root[0] + L1 * Math.cos(base + a), root[1] + L1 * Math.sin(base + a)];
  const j2 = [root[0] + L1 * Math.cos(base - a), root[1] + L1 * Math.sin(base - a)];
  let j = j1;
  if (hint === 'f') j = j1[0] >= j2[0] ? j1 : j2;
  else if (hint === 'b') j = j1[0] <= j2[0] ? j1 : j2;
  else if (hint === 'u') j = j1[1] <= j2[1] ? j1 : j2;
  else j = j1[1] >= j2[1] ? j1 : j2;
  const ux = tgt[0] - j[0], uy = tgt[1] - j[1]; const ul = Math.hypot(ux, uy) || 1;
  return [j, [j[0] + (ux / ul) * L2, j[1] + (uy / ul) * L2]];
}

/* Calcola le articolazioni di una posa. */
function solve(p, front) {
  const hip = p.hip; const t = p.t; const sh = add(hip, dirv(t), BODY.torso);
  const head = add(sh, dirv(t + (p.h || 0)), BODY.neck);
  const J = { hip: hip, sh: sh, head: head };
  ['F', 'B'].forEach((s, i) => {
    const sgn = i === 0 ? 1 : -1;
    const sr = front ? [sh[0] + 7 * sgn, sh[1] + 2] : sh;
    const hr = front ? [hip[0] + 5 * sgn, hip[1]] : hip;
    J['shr' + s] = sr; J['hipr' + s] = hr;
    const hT = p['h' + s];
    if (hT) { const r = ik2(sr, hT, BODY.ua, BODY.fa, hT[2]); J['elbow' + s] = r[0]; J['hand' + s] = r[1]; }
    else { const a = p['a' + s] || [0, 0]; J['elbow' + s] = add(sr, dirv(a[0]), BODY.ua); J['hand' + s] = add(J['elbow' + s], dirv(a[1]), BODY.fa); }
    const fT = p['f' + s];
    if (fT) { const r = ik2(hr, fT, BODY.th, BODY.sh, fT[2]); J['knee' + s] = r[0]; J['ankle' + s] = r[1]; }
    else { const l = p['l' + s] || [0, 0]; J['knee' + s] = add(hr, dirv(l[0]), BODY.th); J['ankle' + s] = add(J['knee' + s], dirv(l[1]), BODY.sh); }
    J['toe' + s] = add(J['ankle' + s], dirv(p['t' + s] == null ? 90 : p['t' + s]), BODY.foot);
  });
  return J;
}

function lerpPose(a, b, k) {
  const o = {};
  Object.keys(a).forEach((key) => {
    const x = a[key], y = b[key] == null ? x : b[key];
    if (typeof x === 'number') o[key] = x + (y - x) * k;
    else if (Array.isArray(x)) o[key] = x.map((v, i) => (typeof v === 'number' ? v + (y[i] - v) * k : v));
    else o[key] = x;
  });
  return o;
}

/* ---------- Oggetti di scena ---------- */
const C_PROP = '#33333A', C_PROP2 = '#4A4A52', C_NEAR = '#EDEDF0', C_FAR = '#7A7A83', C_AC = '#C4F03A';
function line(a, b, w, c) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
function rect(x, y, w, h, r, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + (fill || C_PROP) + '"/>'; }
function propSvg(pr, J) {
  const pt = (q) => (Array.isArray(q) ? q : J[q]);
  switch (pr.k) {
    case 'chair': { const x = pr.x, y = pr.y, w = pr.w || 22; const back = pr.back === 'r' ? x + w - 3 : x;
      return rect(x, y, w, 4, 1.5) + rect(x + 1, y + 4, 3, FLOOR - y - 4, 1, C_PROP) + rect(x + w - 4, y + 4, 3, FLOOR - y - 4, 1, C_PROP) + (pr.noBack ? '' : rect(back, y - 24, 3, 24, 1.5, C_PROP)); }
    case 'table': return rect(pr.x, pr.y, pr.w, 4, 1.5, C_PROP2) + rect(pr.x + 2, pr.y + 4, 3, FLOOR - pr.y - 4, 1) + rect(pr.x + pr.w - 5, pr.y + 4, 3, FLOOR - pr.y - 4, 1);
    case 'sofa': return rect(pr.x, pr.y, pr.w, FLOOR - pr.y, 5, C_PROP) + rect(pr.back === 'r' ? pr.x + pr.w - 8 : pr.x, pr.y - 16, 8, 18, 4, C_PROP2);
    case 'step': return rect(pr.x, pr.y, pr.w, FLOOR - pr.y, 2, C_PROP2);
    case 'wall': return rect(pr.x, -12, 8, FLOOR + 12, 0, C_PROP);
    case 'bar': return line([pr.x0 || 60, pr.y], [pr.x1 || 124, pr.y], 3.5, '#9A9AA2') + line([pr.x1 || 124, pr.y], [pr.x1 || 124, -12], 3, C_PROP2);
    case 'cushion': return rect(pr.x, pr.y, pr.w || 18, 4, 2, C_PROP2);
    case 'towel': { const a = pt(pr.j); return rect(a[0] - 7, FLOOR - 3, 14, 3, 1, '#6B7F2A'); }
    case 'band': { const a = pt(pr.a), b = pt(pr.b); return '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" stroke="' + C_AC + '" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>'; }
    case 'door': return rect(pr.x, -12, 6, FLOOR + 12, 1, C_PROP) + '<circle cx="' + (pr.x - 1) + '" cy="' + pr.y + '" r="2.4" fill="' + C_AC + '"/>';
    case 'pack': {
      let c;
      if (pr.j === 'back') { const s = J.sh, h = J.hip; const m = [s[0] * 0.62 + h[0] * 0.38, s[1] * 0.62 + h[1] * 0.38]; const d = [s[0] - h[0], s[1] - h[1]]; const l = Math.hypot(d[0], d[1]) || 1; c = [m[0] + (d[1] / l) * 8 * (pr.side || 1), m[1] - (d[0] / l) * 8 * (pr.side || 1)]; }
      else if (pr.j === 'chest') { const s = J.sh, h = J.hip; c = [s[0] * 0.7 + h[0] * 0.3 + 9, s[1] * 0.7 + h[1] * 0.3 + 2]; }
      else { const a = J[pr.j]; c = [a[0], a[1] + 5]; }
      return '<rect x="' + (c[0] - 6.5).toFixed(1) + '" y="' + (c[1] - 7.5).toFixed(1) + '" width="13" height="15" rx="4" fill="#5E6B2A" stroke="#C4F03A" stroke-width="1.2"/>';
    }
  }
  return '';
}

/* ---------- Disegno della figura ---------- */
function figureSvg(J, front) {
  const W = { ua: 6.4, fa: 5.6, th: 8.6, sh: 7, foot: 4.6 };
  const limb = (s, c) => line(J['shr' + s], J['elbow' + s], W.ua, c) + line(J['elbow' + s], J['hand' + s], W.fa, c);
  const leg = (s, c) => line(J['hipr' + s], J['knee' + s], W.th, c) + line(J['knee' + s], J['ankle' + s], W.sh, c) + line(J['ankle' + s], J['toe' + s], W.foot, c);
  const tor = front ? line([J.sh[0], J.sh[1] + 3], J.hip, 15, C_NEAR) + line(J.shrF, J.shrB, 7, C_NEAR) + line(J.hiprF, J.hiprB, 9, C_NEAR) : line(J.sh, J.hip, 12.5, C_NEAR);
  const neck = line(J.sh, add(J.sh, [(J.head[0] - J.sh[0]) / BODY.neck, (J.head[1] - J.sh[1]) / BODY.neck], 4), 4.5, C_NEAR);
  const head = '<circle cx="' + J.head[0].toFixed(1) + '" cy="' + J.head[1].toFixed(1) + '" r="' + BODY.head + '" fill="' + C_NEAR + '"/>';
  if (front) return leg('B', C_NEAR) + leg('F', C_NEAR) + tor + neck + head + limb('B', C_NEAR) + limb('F', C_NEAR);
  return limb('B', C_FAR) + leg('B', C_FAR) + tor + neck + head + leg('F', C_NEAR) + limb('F', C_NEAR);
}

/* ---------- Animazioni ---------- */
const STAND = { hip: [80, 63], t: 180, fF: [84, 101, 'f'], fB: [79, 101, 'f'] };
const ANIMS = {
  squat: { a: Object.assign({}, STAND, { aF: [8, 12], aB: [4, 8] }), b: { hip: [65, 81], t: 142, fF: [84, 101, 'f'], fB: [79, 101, 'f'], aF: [96, 92], aB: [92, 88] } },
  squat_pack: { base: 'squat', props: [{ k: 'pack', j: 'chest' }], a: { hF: [92, 52, 'd'], hB: [90, 54, 'd'] }, b: { hF: [86, 66, 'd'], hB: [84, 68, 'd'] } },
  split: { a: { hip: [79, 67], t: 180, fF: [96, 101, 'f'], fB: [62, 101, 'f'], tB: 55, aF: [5, 5], aB: [-5, -5] }, b: { hip: [79, 84], t: 180, fF: [96, 101, 'f'], fB: [62, 101, 'f'], tB: 40 } },
  split_pack: { base: 'split', props: [{ k: 'pack', j: 'back' }] },
  bulgarian: { props: [{ k: 'chair', x: 32, y: 84, w: 24, back: 'l' }], a: { hip: [82, 67], t: 180, fF: [98, 101, 'f'], fB: [53, 81, 'd'], tB: -95, aF: [5, 5], aB: [-5, -5] }, b: { hip: [78, 84], t: 172, fF: [98, 101, 'f'], fB: [53, 81, 'd'], tB: -95 } },
  bulgarian_pack: { base: 'bulgarian', props: [{ k: 'chair', x: 32, y: 84, w: 24, back: 'l' }, { k: 'pack', j: 'back' }] },
  pistol: { a: { hip: [84, 64], t: 178, fF: [86, 101, 'f'], fB: [96, 95, 'f'], tB: 120, aF: [60, 80], aB: [55, 80] }, b: { hip: [70, 86], t: 145, fF: [86, 101, 'f'], fB: [107, 84, 'u'], tB: 150, aF: [95, 92], aB: [92, 90] } },
  pistol_box: { base: 'pistol', props: [{ k: 'chair', x: 46, y: 82, w: 24, back: 'l' }], b: { hip: [66, 79] } },
  pushup: { a: { hip: [62.7, 84], t: 110, h: -15, hF: [96, 101, 'b'], hB: [94, 101, 'b'], fF: [27, 97, 'u'], fB: [26, 97, 'u'], tF: 15, tB: 15 }, b: { hip: [64.7, 92.4], t: 97, h: -10 } },
  pushup_knee: { a: { hip: [66.5, 89.5], t: 120, h: -15, hF: [96, 101, 'b'], hB: [94, 101, 'b'], fF: [34, 91, 'd'], fB: [33, 91, 'd'], tF: -60, tB: -60 }, b: { hip: [68.5, 94.7], t: 103, h: -10 } },
  pushup_incline: { props: [{ k: 'chair', x: 92, y: 80, w: 24, back: 'r' }], a: { hip: [59.9, 73.6], t: 128, h: -15, hF: [100, 78, 'b'], hB: [98, 78, 'b'], fF: [30, 97, 'u'], fB: [29, 97, 'u'], tF: 15, tB: 15 }, b: { hip: [65, 82.2], t: 113, h: -10 } },
  pushup_decline: { props: [{ k: 'chair', x: 20, y: 80, w: 24, back: 'l' }], a: { hip: [69.9, 74.3], t: 94, h: -10, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [32, 76, 'u'], fB: [31, 76, 'u'], tF: 10, tB: 10 }, b: { hip: [69.4, 83.6], t: 80, h: -5 } },
  pushup_band: { base: 'pushup', props: [{ k: 'band', a: 'handF', b: 'sh' }] },
  pike: { a: { hip: [66, 63], t: 68.5, h: 0, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [52, 97, 'u'], fB: [51, 97, 'u'], tF: 20, tB: 20 }, b: { hip: [73, 68], t: 49 } },
  pike_elev: { props: [{ k: 'chair', x: 28, y: 80, w: 24, back: 'l' }], a: { hip: [74, 54], t: 51.5, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [44, 77, 'u'], fB: [43, 77, 'u'], tF: 20, tB: 20 }, b: { hip: [80, 60], t: 33 } },
  handstand: { hold: true, props: [{ k: 'wall', x: 110 }], a: { hip: [99, 42], t: -2, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [106, 5, 'f'], fB: [105, 6, 'f'], tF: 160, tB: 160 }, b: { hip: [99, 41], t: -1 } },
  hspu: { props: [{ k: 'wall', x: 110 }, { k: 'cushion', x: 90, y: 100, w: 18 }], a: { hip: [99, 42], t: -2, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [106, 5, 'f'], fB: [105, 6, 'f'], tF: 160, tB: 160 }, b: { hip: [98, 58], t: 0, fF: [105, 21, 'f'], fB: [104, 22, 'f'] } },
  invrow: { props: [{ k: 'table', x: 86, y: 58, w: 56 }], a: { hip: [67.6, 94.5], t: 98.3, h: 0, hF: [100, 60, 'b'], hB: [98, 60, 'b'], fF: [30, 99, 'u'], fB: [29, 99, 'u'], tF: 175, tB: 175 }, b: { hip: [64.5, 83.1], t: 114.7 } },
  invrow_knee: { props: [{ k: 'table', x: 86, y: 58, w: 56 }], a: { hip: [70, 96], t: 98, hF: [100, 60, 'b'], hB: [98, 60, 'b'], fF: [50, 100, 'u'], fB: [49, 100, 'u'], tF: 100, tB: 100 }, b: { hip: [68, 86], t: 115 } },
  bentrow: { props: [{ k: 'pack', j: 'handF' }], a: { hip: [70, 66], t: 125, h: 10, fF: [83, 101, 'f'], fB: [77, 101, 'f'], hF: [96, 77, 'b'], hB: [93, 77, 'b'] }, b: { hip: [70, 66], t: 125, h: 10, hF: [86, 62, 'u'], hB: [84, 63, 'u'] } },
  onearmrow: { props: [{ k: 'chair', x: 94, y: 80, w: 24, back: 'r' }, { k: 'pack', j: 'handB' }], a: { hip: [66, 66], t: 110, h: 10, fF: [80, 101, 'f'], fB: [60, 101, 'f'], hF: [100, 78, 'b'], hB: [92, 85, 'b'] }, b: { hB: [82, 66, 'u'] } },
  bridge: { a: { hip: [66, 98], t: -87.8, h: 0, fF: [86, 101, 'u'], fB: [85, 101, 'u'], aF: [88, 90], aB: [86, 90] }, b: { hip: [66, 84], t: -60 } },
  bridge_single: { a: { hip: [66, 98], t: -87.8, fF: [86, 101, 'u'], fB: [96, 86, 'u'], tB: 150, aF: [88, 90], aB: [86, 90] }, b: { hip: [66, 84], t: -60, fB: [101, 69, 'u'] } },
  hipthrust: { props: [{ k: 'sofa', x: 6, y: 80, w: 40, back: 'l' }], a: { hip: [64, 96], t: -126.9, h: -20, fF: [88, 101, 'u'], fB: [86, 82, 'u'], tB: 150, aF: [-150, -120], aB: [-145, -115] }, b: { hip: [70, 79], t: -91.9, h: 0, fB: [98, 62, 'u'], aF: [-120, -95], aB: [-115, -90] } },
  legcurl: { props: [{ k: 'towel', j: 'ankleF' }], a: { hip: [66, 88], t: -68.5, fF: [102, 100, 'u'], fB: [101, 100, 'u'], tF: 160, tB: 160, aF: [90, 90], aB: [88, 90] }, b: { hip: [64, 85], t: -61.7, fF: [82, 100, 'u'], fB: [81, 100, 'u'], tF: 120, tB: 120 } },
  nordic: { props: [{ k: 'sofa', x: 18, y: 86, w: 36, back: 'l' }, { k: 'cushion', x: 62, y: 100, w: 18 }], a: { hip: [70, 81], t: 180, h: 0, fF: [52, 100, 'd'], fB: [51, 100, 'd'], tF: -90, tB: -90, aF: [40, 170], aB: [35, 165] }, b: { hip: [84.6, 87.8], t: 130, h: 0, aF: [110, 100], aB: [105, 95] } },
  plank: { hold: true, a: { hip: [67.5, 90.9], t: 99.2, h: -10, hF: [112, 101, 'd'], hB: [110, 101, 'd'], fF: [30, 97, 'u'], fB: [29, 97, 'u'], tF: 15, tB: 15 }, b: { hip: [67.5, 91.5], t: 99 } },
  hollow: { hold: true, a: { hip: [80, 99], t: -101.5, h: -5, fF: [116, 90, 'u'], fB: [115, 91, 'u'], tF: 160, tB: 160, aF: [-100, -100], aB: [-98, -98] }, b: { hip: [80, 99], t: -103, fF: [116, 88, 'u'], fB: [115, 89, 'u'] } },
  lsit: { hold: true, props: [{ k: 'chair', x: 60, y: 74, w: 24, noBack: true }], a: { hip: [74, 74], t: 182, hF: [72, 73, 'b'], hB: [70, 73, 'b'], fF: [112, 76, 'u'], fB: [111, 76, 'u'], tF: 180, tB: 180 }, b: { hip: [74, 73], fF: [112, 74, 'u'], fB: [111, 74, 'u'] } },
  lsit_bent: { base: 'lsit', a: { fF: [92, 66, 'u'], fB: [91, 66, 'u'], tF: 100, tB: 100 }, b: { fF: [92, 65, 'u'], fB: [91, 65, 'u'] } },
  lsit_one: { base: 'lsit', a: { fB: [92, 66, 'u'], tB: 100 }, b: { fB: [92, 65, 'u'] } },
  pullup: { props: [{ k: 'bar', y: -4 }], a: { hip: [90, 55], t: 180, h: 0, hF: [94, -4, 'f'], hB: [86, -4, 'f'], fF: [82, 90, 'f'], fB: [81, 91, 'f'], tF: 40, tB: 40 }, b: { hip: [88, 38], t: 182, fF: [80, 73, 'f'], fB: [79, 74, 'f'] } },
  hangknee: { props: [{ k: 'bar', y: -4 }], a: { hip: [90, 55], t: 180, hF: [94, -4, 'f'], hB: [86, -4, 'f'], fF: [90, 93, 'f'], fB: [89, 93, 'f'], tF: 60, tB: 60 }, b: { hip: [88, 52], t: 176, fF: [108, 72, 'u'], fB: [107, 73, 'u'] } },
  hangleg: { base: 'hangknee', b: { hip: [86, 50], t: 172, fF: [123, 52, 'u'], fB: [122, 53, 'u'], tF: 170, tB: 170 } },
  t2b: { base: 'hangknee', b: { hip: [80, 44], t: 160, fF: [104, -2, 'u'], fB: [103, -1, 'u'], tF: 170, tB: 170 } },
  curl: { props: [{ k: 'band', a: 'toeF', b: 'handF' }], a: Object.assign({}, STAND, { hF: [83, 62, 'b'], hB: [79, 62, 'b'] }), b: Object.assign({}, STAND, { hF: [92, 37, 'd'], hB: [89, 38, 'd'] }) },
  curl_pack: { base: 'curl', props: [{ k: 'pack', j: 'handF' }] },
  triext: { props: [{ k: 'band', a: 'ankleB', b: 'handF' }], a: Object.assign({}, STAND, { fB: [68, 101, 'f'], hF: [82, 4, 'u'], hB: [80, 4, 'u'] }), b: Object.assign({}, STAND, { fB: [68, 101, 'f'], hF: [70, 30, 'u'], hB: [69, 31, 'u'] }) },
  latraise: { front: true, props: [{ k: 'band', a: 'ankleF', b: 'handF' }, { k: 'band', a: 'ankleB', b: 'handB' }], a: { hip: [80, 63], t: 180, fF: [87, 101, 'f'], fB: [73, 101, 'b'], tF: 70, tB: 110, hF: [92, 62, 'f'], hB: [68, 62, 'b'] }, b: { hF: [116, 37, 'd'], hB: [44, 37, 'd'] } },
  facepull: { props: [{ k: 'door', x: 140, y: 32 }, { k: 'band', a: [139, 32], b: 'handF' }], a: Object.assign({}, STAND, { hF: [108, 36, 'd'], hB: [107, 37, 'd'] }), b: Object.assign({}, STAND, { hF: [90, 25, 'u'], hB: [89, 26, 'u'] }) },
  bandrow: { props: [{ k: 'door', x: 140, y: 47 }, { k: 'band', a: [139, 47], b: 'handF' }], a: Object.assign({}, STAND, { t: 176, hF: [106, 46, 'd'], hB: [105, 47, 'd'] }), b: Object.assign({}, STAND, { t: 182, hF: [86, 51, 'b'], hB: [85, 52, 'b'] }) },
  pulldown: { props: [{ k: 'door', x: 140, y: -6 }, { k: 'band', a: [139, -6], b: 'handF' }], a: { hip: [78, 74], t: 178, fF: [60, 100, 'd'], fB: [59, 100, 'd'], tF: -90, tB: -90, hF: [96, 22, 'u'], hB: [95, 23, 'u'] }, b: { hip: [78, 74], t: 182, hF: [88, 40, 'd'], hB: [87, 41, 'd'] } },
  yraise: { a: { hip: [60, 97], t: 90, h: 8, fF: [22, 99, 'u'], fB: [21, 99, 'u'], tF: 0, tB: 0, hF: [118, 99, 'u'], hB: [117, 99, 'u'] }, b: { hip: [60, 97], t: 88, h: 0, hF: [116, 86, 'u'], hB: [115, 87, 'u'] } },
  pronew: { a: { hip: [60, 97], t: 90, h: 8, fF: [22, 99, 'u'], fB: [21, 99, 'u'], tF: 0, tB: 0, hF: [116, 90, 'u'], hB: [115, 91, 'u'] }, b: { hip: [60, 97], t: 88, h: 0, hF: [98, 88, 'b'], hB: [97, 89, 'b'] } },
  pullover: { props: [{ k: 'pack', j: 'handF' }], a: { hip: [70, 97], t: -90, h: 0, fF: [96, 101, 'u'], fB: [95, 101, 'u'], hF: [41, 68, 'f'], hB: [40, 68, 'f'] }, b: { hip: [70, 97], t: -90, hF: [12, 92, 'u'], hB: [11, 92, 'u'] } },
  calfstep: { props: [{ k: 'step', x: 82, y: 88, w: 40 }], a: { hip: [80, 52.4], t: 180, fF: [81, 90.4, 'f'], fB: [80, 90.4, 'f'], tF: 110, tB: 110, aF: [5, 5], aB: [0, 0] }, b: { hip: [84.6, 43.4], t: 180, fF: [85.6, 81.4, 'f'], fB: [84.6, 81.4, 'f'], tF: 20, tB: 20 } },
  calffloor: { a: { hip: [80, 63], t: 180, fF: [81, 101, 'f'], fB: [92, 92, 'f'], tF: 90, tB: 120, aF: [5, 5], aB: [0, 0] }, b: { hip: [83.5, 56.9], t: 180, fF: [84.5, 94.9, 'f'], fB: [95.5, 86, 'f'], tF: 30 } },
  dips: { props: [{ k: 'chair', x: 72, y: 72, w: 24, back: 'r' }], a: { hip: [84, 71], t: 180, h: 0, hF: [86, 70, 'b'], hB: [84, 70, 'b'], fF: [114, 100, 'u'], fB: [113, 100, 'u'], tF: 170, tB: 170 }, b: { hip: [82, 86], t: 176 } },
  /* Riscaldamento e defaticamento */
  jacks: { front: true, a: { hip: [80, 63], t: 180, fF: [85, 101, 'f'], fB: [75, 101, 'b'], tF: 80, tB: -80, hF: [89, 63, 'f'], hB: [71, 63, 'b'] }, b: { hip: [80, 61], fF: [98, 101, 'f'], fB: [62, 101, 'b'], hF: [95, 8, 'f'], hB: [65, 8, 'b'] } },
  armcircle: { front: true, a: { hip: [80, 63], t: 180, fF: [86, 101, 'f'], fB: [74, 101, 'b'], tF: 80, tB: -80, hF: [116, 37, 'd'], hB: [44, 37, 'd'] }, b: { hF: [110, 14, 'd'], hB: [50, 14, 'd'] } },
  catcow: { a: { hip: [62, 74], t: 92, h: -40, hF: [93, 101, 'b'], hB: [91, 101, 'b'], fF: [44, 100, 'd'], fB: [43, 100, 'd'], tF: -90, tB: -90 }, b: { hip: [62, 72], t: 84, h: 50 } },
  childpose: { hold: true, a: { hip: [52, 86], t: 76, h: 25, fF: [40, 100, 'f'], fB: [39, 100, 'f'], tF: -90, tB: -90, hF: [112, 99, 'u'], hB: [111, 99, 'u'] }, b: { hip: [52, 87], t: 77 } },
  hamstretch: { a: { hip: [50, 97], t: 150, h: 10, fF: [88, 99, 'u'], fB: [87, 99, 'u'], tF: 180, tB: 180, hF: [80, 88, 'u'], hB: [79, 89, 'u'] }, b: { t: 118, h: 20, hF: [90, 95, 'u'], hB: [89, 96, 'u'] } },
  quadstretch: { hold: true, props: [{ k: 'wall', x: 112 }], a: { hip: [80, 63], t: 180, fF: [82, 101, 'f'], fB: [72, 62, 'd'], tB: -20, hB: [72, 60, 'b'], hF: [110, 40, 'd'] }, b: { hip: [80, 62.5], fB: [72, 61, 'd'], hB: [72, 59, 'b'] } },
  chestwall: { hold: true, props: [{ k: 'wall', x: 38 }], a: { hip: [72, 63], t: 178, fF: [78, 101, 'f'], fB: [70, 101, 'f'], hF: [47, 33, 'd'], hB: [80, 62, 'b'] }, b: { hip: [74, 63], t: 176 } },
  hipflexor: { hold: true, props: [{ k: 'cushion', x: 44, y: 100, w: 16 }], a: { hip: [74, 85], t: 180, fF: [100, 101, 'f'], fB: [36, 100, 'd'], tF: 90, tB: -90, hF: [94, 82, 'd'], hB: [92, 82, 'd'] }, b: { hip: [78, 87], t: 178 } }
};

/* Esercizio → animazione */
const EX_ANIM = {
  ph_incline: 'pushup_incline', ph_classic: 'pushup', ph_decline: 'pushup_decline', ph_band: 'pushup_band', ph_archer: 'pushup', ph_pseudo: 'pushup',
  tb_knee: 'pushup_knee', tb_close: 'pushup', tb_diamond: 'pushup', tb_tempo: 'pushup',
  pv_pike: 'pike', pv_pike_elev: 'pike_elev', pv_wall_hold: 'handstand', pv_hspu_neg: 'hspu', pv_hspu: 'hspu',
  rt_knee: 'invrow_knee', rt_straight: 'invrow', rt_elev: 'invrow', rt_pause: 'invrow', rt_one: 'invrow',
  rb_two: 'bentrow', rb_one: 'onearmrow', rb_pause: 'onearmrow',
  sq_bw: 'squat', sq_split: 'split', sq_bulg: 'bulgarian', sq_bulg_bp: 'bulgarian_pack', sq_pistol_box: 'pistol_box', sq_pistol: 'pistol',
  st_bw: 'squat', st_bp: 'squat_pack', ln_bw: 'split', ln_bp: 'split_pack', ln_def: 'split_pack',
  hg_bridge: 'bridge', hg_ht1: 'hipthrust', hg_slide: 'legcurl', hg_nordic_neg: 'nordic', hg_nordic_assist: 'nordic', hg_nordic: 'nordic',
  gs_bridge1: 'bridge_single',
  co_plank: 'plank', co_hollow: 'hollow', co_lsit_bent: 'lsit_bent', co_lsit_one: 'lsit_one', co_lsit: 'lsit',
  pu_neg: 'pullup', pu_band: 'pullup', pu_full: 'pullup', pu_bp: 'pullup', pu_archer: 'pullup',
  ch_neg: 'pullup', ch_band: 'pullup', ch_full: 'pullup', ch_bp: 'pullup',
  hc_knee: 'hangknee', hc_leg: 'hangleg', hc_t2b: 't2b',
  cb_curl: 'curl', cbp_curl: 'curl_pack', rbd_row: 'bandrow', pd_band: 'pulldown', dp_chairs: 'dips', tb_ext: 'triext',
  ca_step: 'calfstep', cf_one: 'calffloor', lr_band: 'latraise', yr_prone: 'yraise', fp_band: 'facepull',
  po_floor: 'pullover', pp_w: 'pronew', pp_slide: 'pronew'
};

/* Risolve le animazioni che ereditano da un'altra (base). */
function animDef(key) {
  const d = ANIMS[key]; if (!d) return null;
  if (!d.base) return d;
  const b = animDef(d.base);
  const a = Object.assign({}, b.a, d.a || {});
  const bb = Object.assign({}, b.b, d.a || {}, d.b || {});
  return { a: a, b: bb, hold: d.hold != null ? d.hold : b.hold, front: d.front || b.front, props: d.props || b.props };
}

function frameInner(key, k) {
  const d = animDef(key); const a = d.a; const b = Object.assign({}, a, d.b);
  const pose = lerpPose(a, b, k); const J = solve(pose, d.front);
  const props = d.props || [];
  const back = props.filter((p) => ['pack', 'band', 'towel'].indexOf(p.k) < 0).map((p) => propSvg(p, J)).join('');
  const fore = props.filter((p) => ['pack', 'band', 'towel'].indexOf(p.k) >= 0).map((p) => propSvg(p, J)).join('');
  return '<line x1="-10" y1="' + (FLOOR + 0.8) + '" x2="170" y2="' + (FLOOR + 0.8) + '" stroke="#2A2A2F" stroke-width="1.6"/>' + back + figureSvg(J, d.front) + fore;
}

/* HTML del riquadro animato; l'animazione parte da sola (vedi tickAnims). */
function animBox(exId, cls) {
  const key = EX_ANIM[exId] || (ANIMS[exId] ? exId : null); if (!key || !ANIMS[key]) return '';
  return '<div class="anim ' + (cls || '') + '"><svg viewBox="0 -12 160 124" data-anim="' + key + '" role="img" aria-label="Animazione dell’esercizio">' + frameInner(key, 0) + '</svg></div>';
}

let animT0 = 0;
function tickAnims(ts) {
  const els = document.querySelectorAll('svg[data-anim]');
  if (els.length) {
    if (!animT0) animT0 = ts;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.forEach((el) => {
      const key = el.getAttribute('data-anim'); const d = animDef(key);
      const per = d.hold ? 3600 : 2800;
      const ph = ((ts - animT0) % per) / per;
      // a → b → a con pause brevi agli estremi
      let k;
      if (reduce) k = 0.5;
      else if (ph < 0.12) k = 0; else if (ph < 0.5) k = (1 - Math.cos(((ph - 0.12) / 0.38) * Math.PI)) / 2; else if (ph < 0.62) k = 1; else k = (1 + Math.cos(((ph - 0.62) / 0.38) * Math.PI)) / 2;
      el.innerHTML = frameInner(key, k);
    });
  }
  requestAnimationFrame(tickAnims);
}
if (typeof window !== 'undefined' && window.requestAnimationFrame) requestAnimationFrame(tickAnims);
