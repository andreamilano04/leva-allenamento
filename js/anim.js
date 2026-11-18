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
/* Segmento affusolato (capsula): da a (larghezza wa) a b (larghezza wb). */
function capsule(a, b, wa, wb, c) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; const nx = -dy / l, ny = dx / l;
  const p = (q, w, s) => (q[0] + nx * w / 2 * s).toFixed(1) + ' ' + (q[1] + ny * w / 2 * s).toFixed(1);
  return '<path d="M' + p(a, wa, 1) + ' L' + p(b, wb, 1) + ' L' + p(b, wb, -1) + ' L' + p(a, wa, -1) + 'Z" fill="' + c + '"/>' +
    '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="' + (wa / 2).toFixed(1) + '" fill="' + c + '"/><circle cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="' + (wb / 2).toFixed(1) + '" fill="' + c + '"/>';
}
/* Muscolo allenato → parti da evidenziare in verde. */
const HL_PARTS = { pet: ['chest'], dor: ['back'], core: ['torso'], spa: ['delt'], bic: ['bic'], tri: ['tri'], qua: ['quad'], fem: ['ham'], glu: ['glute'], pol: ['calf'], collo: ['neck'] };
/* Colori: pelle, maglietta, pantaloncini, scarpe, capelli. Il lato lontano è più scuro. */
const PAL = {
  n: { skin: '#E2B48C', skin2: '#C99872', shirt: '#4A5363', shorts: '#20242C', shoe: '#F1F2F4', sole: '#9CA0A8', hair: '#2B231E', eye: '#1B1B1F' },
  f: { skin: '#A97E5E', skin2: '#946B4E', shirt: '#343B47', shorts: '#16191F', shoe: '#B8BBC2', sole: '#73767D', hair: '#211B17', eye: '#1B1B1F' }
};
const HLC = { n: '#C4F03A', f: '#8DAD2B' };
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unit2 = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]]; const l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; };
const ell = (c, rx, ry, ang, fill, op) => '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + ang.toFixed(0) + ' ' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ')" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '/>';
const OUT = '#0D0E11'; // contorno: separa braccia e gambe dal busto
/* Riflesso di luce dall'alto lungo un segmento: dà volume. */
function shine(a, b, wa, wb, col, op) {
  const u = unit2(a, b); let n = [-u[1], u[0]]; if (n[1] > 0) n = [-n[0], -n[1]];
  const a2 = add(lerp2(a, b, 0.12), n, wa * 0.24), b2 = add(lerp2(a, b, 0.86), n, wb * 0.24);
  return '<g opacity="' + (op || 0.32) + '">' + capsule(a2, b2, wa * 0.3, wb * 0.26, col) + '</g>';
}
/* Mano: palmo arrotondato con pollice, orientata come l'avambraccio. */
function hand(el, ha, col) {
  const u = unit2(el, ha); const n = [-u[1], u[0]];
  const tip = add(ha, u, 2.6), th = add(add(ha, n, 2.2), u, 0.6);
  return capsule(ha, tip, 6.4, 4.6, col) + capsule(add(ha, n, 1.2), th, 2.4, 2, col);
}
/* Curva chiusa morbida (Catmull-Rom) che passa per i punti dati. */
function smooth(pts) {
  const n = pts.length; const f = (v) => v.toFixed(1); let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ' C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
  }
  return d + 'Z';
}
const angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;

function figureSvg(J, front, hl) {
  const parts = HL_PARTS[hl] || [];
  const on = (p) => parts.indexOf(p) >= 0;
  /* Gamba: pantaloncini sulla coscia, ginocchio, polpaccio in rilievo, scarpa. */
  const leg = (s, side) => {
    const c = PAL[side], H = HLC[side];
    const hp = J['hipr' + s], kn = J['knee' + s], an = J['ankle' + s], to = J['toe' + s];
    const toeDir = unit2(an, to);
    let o = side === 'n' ? capsule(lerp2(hp, kn, 0.5), kn, 11.8, 10, OUT) + capsule(kn, an, 9.6, 6.6, OUT) + capsule(an, to, 8.2, 6.4, OUT) : '';
    o += capsule(hp, kn, 11.5, 8.2, c.skin);
    // muscoli della coscia (davanti quadricipiti, dietro femorali), visibili sotto i pantaloncini
    const th = unit2(hp, kn); const nrm = [-th[1], th[0]]; const fr = (nrm[0] * toeDir[0] + nrm[1] * toeDir[1]) > 0 ? 1 : -1; // lato "davanti" della gamba
    const qC = add(lerp2(hp, kn, 0.62), nrm, 2.2 * fr), hC = add(lerp2(hp, kn, 0.6), nrm, -2.2 * fr);
    o += capsule(hp, lerp2(hp, kn, 0.48), 12.2, 10.6, c.shorts); // pantaloncini
    if (on('quad')) o += ell(qC, 7, 3.4, angOf(hp, kn), H, 0.92); if (on('ham')) o += ell(hC, 7, 3.4, angOf(hp, kn), H, 0.92);
    o += capsule(kn, an, 7.8, 4.8, c.skin) + shine(kn, an, 7.8, 4.8, '#FFE3C8', side === 'n' ? 0.3 : 0.12);
    const cC = add(lerp2(kn, an, 0.3), toeDir, -2); // polpaccio, dietro la tibia
    o += ell(cC, 5.6, 3.3, angOf(kn, an), on('calf') ? H : c.skin2, on('calf') ? 0 : 0.9);
    o += capsule(an, to, 6.4, 4.6, c.shoe) + capsule(add(an, toeDir, 0.5), to, 2.2, 2, c.sole) + capsule(lerp2(an, to, 0.15), lerp2(an, to, 0.75), 1.1, 1.1, side === 'n' ? '#C4F03A' : '#6E8A22');
    return o;
  };
  /* Braccio: manica corta, bicipite/tricipite in rilievo, avambraccio, mano. */
  const arm = (s, side) => {
    const c = PAL[side], H = HLC[side];
    const sh = J['shr' + s], el = J['elbow' + s], ha = J['hand' + s];
    let o = side === 'n' ? capsule(sh, el, 10.6, 7.4, OUT) + capsule(el, ha, 7.2, 5.8, OUT) + '<circle cx="' + add(ha, unit2(el, ha), 1.3)[0].toFixed(1) + '" cy="' + add(ha, unit2(el, ha), 1.3)[1].toFixed(1) + '" r="4.6" fill="' + OUT + '"/>' : '';
    o += capsule(sh, el, 7.4, 5.6, c.skin);
    const ua = unit2(sh, el); const nrm = [-ua[1], ua[0]]; const fa = unit2(el, ha);
    const fr = (nrm[0] * fa[0] + nrm[1] * fa[1]) > 0 ? 1 : -1; // il bicipite sta dal lato in cui si piega il gomito
    const bC = add(lerp2(sh, el, 0.58), nrm, 1.7 * fr), tC = add(lerp2(sh, el, 0.55), nrm, -1.7 * fr);
    if (on('bic')) o += ell(bC, 5.4, 2.8, angOf(sh, el), H); else o += ell(bC, 4.8, 2.4, angOf(sh, el), c.skin2, 0.55);
    if (on('tri')) o += ell(tC, 5.4, 2.8, angOf(sh, el), H);
    o += capsule(sh, lerp2(sh, el, 0.38), 8.8, 8, c.shirt); // manica
    if (on('delt')) o += '<circle cx="' + sh[0].toFixed(1) + '" cy="' + sh[1].toFixed(1) + '" r="4.8" fill="' + H + '"/>';
    o += shine(sh, lerp2(sh, el, 0.4), 8.8, 8, '#8A95A8', side === 'n' ? 0.45 : 0.15);
    o += capsule(el, ha, 5.4, 4, c.skin) + shine(el, ha, 5.4, 4, '#FFE3C8', side === 'n' ? 0.3 : 0.12) + hand(el, ha, c.skin);
    return o;
  };
  const c = PAL.n, H = HLC.n;
  const nd = [(J.head[0] - J.sh[0]) / BODY.neck, (J.head[1] - J.sh[1]) / BODY.neck];
  const face = front ? [0, 0] : [-nd[1], nd[0]];
  const neck = capsule(J.sh, add(J.sh, nd, 6.4), 7.2, 6.4, OUT) + capsule(J.sh, add(J.sh, nd, 6.4), 5.6, 4.8, on('neck') ? H : c.skin);
  // testa: capelli dietro, viso, orecchio, occhio, naso
  const hd = J.head;
  let head = '<circle cx="' + hd[0].toFixed(1) + '" cy="' + hd[1].toFixed(1) + '" r="7" fill="' + c.skin + '"/>';
  if (front) head += '<path d="M' + (hd[0] - 7).toFixed(1) + ' ' + (hd[1] - 1).toFixed(1) + ' a7 7 0 0 1 14 0 q-7 -3.2 -14 0z" fill="' + c.hair + '"/>';
  else {
    const back = [-face[0], -face[1]]; const top = [-nd[0] * -1, -nd[1] * -1];
    const hc = add(add(hd, back, 1.6), nd, 1.3);
    head = '<circle cx="' + hc[0].toFixed(1) + '" cy="' + hc[1].toFixed(1) + '" r="6.6" fill="' + c.hair + '"/>' +
      '<circle cx="' + (hd[0] + face[0] * 0.9 - nd[0] * 0.4).toFixed(1) + '" cy="' + (hd[1] + face[1] * 0.9 - nd[1] * 0.4).toFixed(1) + '" r="6.3" fill="' + c.skin + '"/>';
    const nose = add(add(hd, face, 6.6), nd, -0.6); const eye = add(add(hd, face, 3.6), nd, 1.3); const ear = add(add(hd, back, 0.6), nd, -0.4);
    const brow = add(eye, nd, 1.6);
    head = '<circle cx="' + hd[0].toFixed(1) + '" cy="' + hd[1].toFixed(1) + '" r="7.9" fill="' + OUT + '"/>' + head;
    head += '<path d="M' + add(brow, face, -1.3).map((v) => v.toFixed(1)).join(' ') + ' L' + add(brow, face, 1.3).map((v) => v.toFixed(1)).join(' ') + '" stroke="' + c.hair + '" stroke-width="0.9" stroke-linecap="round"/>';
    head += '<circle cx="' + nose[0].toFixed(1) + '" cy="' + nose[1].toFixed(1) + '" r="1.6" fill="' + c.skin + '"/>' +
      '<circle cx="' + ear[0].toFixed(1) + '" cy="' + ear[1].toFixed(1) + '" r="1.7" fill="' + c.skin2 + '"/>' +
      '<circle cx="' + eye[0].toFixed(1) + '" cy="' + eye[1].toFixed(1) + '" r="0.95" fill="' + c.eye + '"/>';
  }
  let torso;
  if (front) {
    torso = '<path d="M' + J.shrF[0].toFixed(1) + ' ' + (J.shrF[1] - 2).toFixed(1) + ' L' + J.shrB[0].toFixed(1) + ' ' + (J.shrB[1] - 2).toFixed(1) + ' L' + (J.hiprB[0] - 0.5).toFixed(1) + ' ' + (J.hiprB[1] - 6).toFixed(1) + ' L' + (J.hiprF[0] + 0.5).toFixed(1) + ' ' + (J.hiprF[1] - 6).toFixed(1) + 'Z" fill="' + c.shirt + '" stroke="' + c.shirt + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M' + (J.hiprF[0] + 2).toFixed(1) + ' ' + (J.hiprF[1] - 6).toFixed(1) + ' L' + (J.hiprB[0] - 2).toFixed(1) + ' ' + (J.hiprB[1] - 6).toFixed(1) + ' L' + (J.hiprB[0] - 2).toFixed(1) + ' ' + (J.hiprB[1] + 4).toFixed(1) + ' L' + (J.hiprF[0] + 2).toFixed(1) + ' ' + (J.hiprF[1] + 4).toFixed(1) + 'Z" fill="' + c.shorts + '" stroke="' + c.shorts + '" stroke-width="4" stroke-linejoin="round"/>';
    if (on('chest') || on('torso')) torso += ell(lerp2(J.sh, J.hip, on('chest') ? 0.25 : 0.55), 8, on('chest') ? 4 : 7, 0, H);
    if (on('delt')) torso += '<circle cx="' + J.shrF[0].toFixed(1) + '" cy="' + J.shrF[1].toFixed(1) + '" r="4.6" fill="' + H + '"/><circle cx="' + J.shrB[0].toFixed(1) + '" cy="' + J.shrB[1].toFixed(1) + '" r="4.6" fill="' + H + '"/>';
  } else {
    // busto: maglietta con petto e schiena modellati, bacino nei pantaloncini, glutei
    const d = [J.sh[0] - J.hip[0], J.sh[1] - J.hip[1]]; const l = Math.hypot(d[0], d[1]) || 1; const bk = [d[1] / l, -d[0] / l]; const fr = [-bk[0], -bk[1]];
    const ang = angOf(J.hip, J.sh);
    // sagoma del busto: schiena con scapole, vita stretta, petto in fuori, spalle larghe
    const u = [d[0] / l, d[1] / l]; const P = (al, ac) => [J.hip[0] + u[0] * al * l + fr[0] * ac, J.hip[1] + u[1] * al * l + fr[1] * ac];
    const body = smooth([P(-0.06, -6.6), P(0.3, -5.4), P(0.62, -7.4), P(0.9, -7.8), P(1.1, -4.2), P(1.1, 3.4), P(0.86, 7.6), P(0.66, 7.2), P(0.42, 5.6), P(0.12, 6.4)]);
    torso = '<path d="' + body + '" fill="' + c.shirt + '" stroke="' + OUT + '" stroke-width="1.8" stroke-linejoin="round" paint-order="stroke"/>';
    torso += '<path d="' + smooth([P(0.55, -4.4), P(0.85, -5.6), P(1.0, -2), P(0.95, 3.2), P(0.8, 5), P(0.62, 3)]) + '" fill="#8A95A8" opacity=".22"/>'; // luce sul petto e sulle spalle
    torso += '<path d="M' + P(0.64, 6.6).map((v) => v.toFixed(1)).join(' ') + ' Q' + P(0.7, 3).map((v) => v.toFixed(1)).join(' ') + ' ' + P(0.86, 1.5).map((v) => v.toFixed(1)).join(' ') + '" stroke="' + OUT + '" stroke-width=".7" fill="none" opacity=".55"/>'; // piega sotto il petto
    if (on('chest')) torso += ell(P(0.76, 4.4), 6.5, 3.6, ang, H);
    if (on('back')) torso += ell(P(0.66, -4.4), 8.5, 3.4, ang, H);
    if (on('torso')) torso += ell(P(0.4, 3), 6.5, 3.2, ang, H);
    torso += capsule(add(J.hip, d, -0.04), lerp2(J.hip, J.sh, 0.2), 13.6, 13.4, c.shorts);           // pantaloncini
    torso += '<circle cx="' + add(J.hip, bk, 3).map((v) => v.toFixed(1)).join('" cy="') + '" r="6" fill="' + (on('glute') ? H : '#2A2F38') + '"/>'; // glutei
    if (on('delt')) torso += '<circle cx="' + J.sh[0].toFixed(1) + '" cy="' + J.sh[1].toFixed(1) + '" r="5.4" fill="' + H + '"/>';
  }
  const low = Math.max(J.ankleF[1], J.ankleB[1], J.handF[1], J.hip[1]);
  const shadow = low > FLOOR - 14 ? '<ellipse cx="' + ((J.hip[0] + J.sh[0]) / 2).toFixed(1) + '" cy="' + (FLOOR + 1.5) + '" rx="34" ry="2.6" fill="#000" opacity=".45"/>' : '';
  if (front) return shadow + leg('B', 'n') + leg('F', 'n') + torso + neck + head + arm('B', 'n') + arm('F', 'n');
  return shadow + arm('B', 'f') + leg('B', 'f') + torso + neck + head + leg('F', 'n') + arm('F', 'n');
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
  handstand: { hold: true, props: [{ k: 'wall', x: 110 }], a: { hip: [70, 62], t: 66, h: 0, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [56, 97, 'u'], fB: [55, 97, 'u'], tF: 20, tB: 20 }, b: { hip: [99, 42], t: -2, fF: [106, 5, 'f'], fB: [105, 6, 'f'], tF: 160, tB: 160 } },
  hspu: { props: [{ k: 'wall', x: 110 }, { k: 'cushion', x: 90, y: 100, w: 18 }], a: { hip: [99, 42], t: -2, hF: [100, 101, 'b'], hB: [98, 101, 'b'], fF: [106, 5, 'f'], fB: [105, 6, 'f'], tF: 160, tB: 160 }, b: { hip: [98, 58], t: 0, fF: [105, 21, 'f'], fB: [104, 22, 'f'] } },
  invrow: { props: [{ k: 'table', x: 86, y: 58, w: 56 }], a: { hip: [67.6, 94.5], t: 98.3, h: 0, hF: [100, 60, 'b'], hB: [98, 60, 'b'], fF: [30, 99, 'u'], fB: [29, 99, 'u'], tF: 175, tB: 175 }, b: { hip: [64.5, 83.1], t: 114.7 } },
  invrow_knee: { props: [{ k: 'table', x: 86, y: 58, w: 56 }], a: { hip: [70, 96], t: 98, hF: [100, 60, 'b'], hB: [98, 60, 'b'], fF: [50, 100, 'u'], fB: [49, 100, 'u'], tF: 100, tB: 100 }, b: { hip: [68, 86], t: 115 } },
  bentrow: { props: [{ k: 'pack', j: 'handF' }], a: { hip: [70, 66], t: 125, h: 10, fF: [83, 101, 'f'], fB: [77, 101, 'f'], hF: [96, 77, 'b'], hB: [93, 77, 'b'] }, b: { hip: [70, 66], t: 125, h: 10, hF: [86, 62, 'u'], hB: [84, 63, 'u'] } },
  onearmrow: { props: [{ k: 'chair', x: 94, y: 80, w: 24, back: 'r' }, { k: 'pack', j: 'handB' }], a: { hip: [66, 66], t: 110, h: 10, fF: [80, 101, 'f'], fB: [60, 101, 'f'], hF: [100, 78, 'b'], hB: [92, 85, 'b'] }, b: { hB: [82, 66, 'u'] } },
  bridge: { a: { hip: [66, 98], t: -87.8, h: 0, fF: [86, 101, 'u'], fB: [85, 101, 'u'], aF: [88, 90], aB: [86, 90] }, b: { hip: [66, 84], t: -60 } },
  bridge_single: { a: { hip: [66, 98], t: -87.8, fF: [86, 101, 'u'], fB: [96, 86, 'u'], tB: 150, aF: [88, 90], aB: [86, 90] }, b: { hip: [66, 84], t: -60, fB: [101, 69, 'u'] } },
  hipthrust: { props: [{ k: 'sofa', x: 6, y: 80, w: 40, back: 'l' }], a: { hip: [64, 96], t: -126.9, h: -20, fF: [88, 101, 'u'], fB: [86, 82, 'u'], tB: 150, aF: [-150, -120], aB: [-145, -115] }, b: { hip: [70, 79], t: -91.9, h: 0, fB: [98, 62, 'u'], aF: [-120, -95], aB: [-115, -90] } },
  legcurl: { props: [{ k: 'towel', j: 'ankleF' }], a: { hip: [66, 88], t: -68.5, fF: [102, 100, 'u'], fB: [101, 100, 'u'], tF: 160, tB: 160, aF: [90, 90], aB: [88, 90] }, b: { hip: [64, 85], t: -61.7, fF: [82, 100, 'u'], fB: [81, 100, 'u'], tF: 120, tB: 120 } },
  nordic: { inv: true, props: [{ k: 'sofa', x: 18, y: 86, w: 36, back: 'l' }, { k: 'cushion', x: 62, y: 100, w: 18 }], a: { hip: [70, 81], t: 180, h: 0, fF: [52, 100, 'd'], fB: [51, 100, 'd'], tF: -90, tB: -90, aF: [40, 170], aB: [35, 165] }, b: { hip: [84.6, 87.8], t: 130, h: 0, aF: [110, 100], aB: [105, 95] } },
  plank: { hold: true, a: { hip: [66, 95], t: 104, h: -10, hF: [112, 101, 'd'], hB: [110, 101, 'd'], fF: [36, 92, 'd'], fB: [35, 92, 'd'], tF: -70, tB: -70 }, b: { hip: [67.5, 90.9], t: 99.2, fF: [30, 97, 'u'], fB: [29, 97, 'u'], tF: 15, tB: 15 } },
  hollow: { hold: true, a: { hip: [80, 99], t: -90, h: 0, fF: [118, 100, 'u'], fB: [117, 100, 'u'], tF: 170, tB: 170, aF: [-92, -92], aB: [-90, -90] }, b: { t: -101.5, h: -5, fF: [116, 90, 'u'], fB: [115, 91, 'u'], tF: 160, tB: 160, aF: [-100, -100], aB: [-98, -98] } },
  lsit: { hold: true, props: [{ k: 'chair', x: 60, y: 74, w: 24, noBack: true }], a: { hip: [74, 78], t: 182, hF: [72, 73, 'b'], hB: [70, 73, 'b'], fF: [96, 101, 'u'], fB: [95, 101, 'u'], tF: 90, tB: 90 }, b: { hip: [74, 74], fF: [112, 76, 'u'], fB: [111, 76, 'u'], tF: 180, tB: 180 } },
  lsit_bent: { base: 'lsit', b: { hip: [74, 74], fF: [92, 66, 'u'], fB: [91, 66, 'u'], tF: 100, tB: 100 } },
  lsit_one: { base: 'lsit', b: { hip: [74, 74], fF: [112, 76, 'u'], fB: [92, 66, 'u'], tF: 180, tB: 100 } },
  pullup: { props: [{ k: 'bar', y: -4 }], a: { hip: [90, 55], t: 180, h: 0, hF: [94, -4, 'f'], hB: [86, -4, 'f'], fF: [82, 90, 'f'], fB: [81, 91, 'f'], tF: 40, tB: 40 }, b: { hip: [88, 38], t: 182, fF: [80, 73, 'f'], fB: [79, 74, 'f'] } },
  hangknee: { props: [{ k: 'bar', y: -4 }], a: { hip: [90, 55], t: 180, hF: [94, -4, 'f'], hB: [86, -4, 'f'], fF: [90, 93, 'f'], fB: [89, 93, 'f'], tF: 60, tB: 60 }, b: { hip: [88, 52], t: 176, fF: [108, 72, 'u'], fB: [107, 73, 'u'] } },
  hangleg: { base: 'hangknee', b: { hip: [86, 50], t: 172, fF: [123, 52, 'u'], fB: [122, 53, 'u'], tF: 170, tB: 170 } },
  t2b: { base: 'hangknee', b: { hip: [80, 44], t: 160, fF: [104, -2, 'u'], fB: [103, -1, 'u'], tF: 170, tB: 170 } },
  curl: { props: [{ k: 'band', a: 'toeF', b: 'handF' }], a: Object.assign({}, STAND, { hF: [83, 62, 'b'], hB: [79, 62, 'b'] }), b: Object.assign({}, STAND, { hF: [92, 37, 'd'], hB: [89, 38, 'd'] }) },
  curl_pack: { base: 'curl', props: [{ k: 'pack', j: 'handF' }] },
  triext: { inv: true, props: [{ k: 'band', a: 'ankleB', b: 'handF' }], a: Object.assign({}, STAND, { fB: [68, 101, 'f'], hF: [82, 4, 'u'], hB: [80, 4, 'u'] }), b: Object.assign({}, STAND, { fB: [68, 101, 'f'], hF: [70, 30, 'u'], hB: [69, 31, 'u'] }) },
  latraise: { front: true, props: [{ k: 'band', a: 'ankleF', b: 'handF' }, { k: 'band', a: 'ankleB', b: 'handB' }], a: { hip: [80, 63], t: 180, fF: [87, 101, 'f'], fB: [73, 101, 'b'], tF: 70, tB: 110, hF: [92, 62, 'f'], hB: [68, 62, 'b'] }, b: { hF: [116, 37, 'd'], hB: [44, 37, 'd'] } },
  facepull: { props: [{ k: 'door', x: 140, y: 32 }, { k: 'band', a: [139, 32], b: 'handF' }], a: Object.assign({}, STAND, { hF: [108, 36, 'd'], hB: [107, 37, 'd'] }), b: Object.assign({}, STAND, { hF: [90, 25, 'u'], hB: [89, 26, 'u'] }) },
  bandrow: { props: [{ k: 'door', x: 140, y: 47 }, { k: 'band', a: [139, 47], b: 'handF' }], a: Object.assign({}, STAND, { t: 176, hF: [106, 46, 'd'], hB: [105, 47, 'd'] }), b: Object.assign({}, STAND, { t: 182, hF: [86, 51, 'b'], hB: [85, 52, 'b'] }) },
  pulldown: { props: [{ k: 'door', x: 140, y: -6 }, { k: 'band', a: [139, -6], b: 'handF' }], a: { hip: [78, 74], t: 178, fF: [60, 100, 'd'], fB: [59, 100, 'd'], tF: -90, tB: -90, hF: [96, 22, 'u'], hB: [95, 23, 'u'] }, b: { hip: [78, 74], t: 182, hF: [88, 40, 'd'], hB: [87, 41, 'd'] } },
  yraise: { a: { hip: [60, 97], t: 90, h: 8, fF: [22, 99, 'u'], fB: [21, 99, 'u'], tF: 0, tB: 0, hF: [118, 99, 'u'], hB: [117, 99, 'u'] }, b: { hip: [60, 97], t: 88, h: 0, hF: [116, 86, 'u'], hB: [115, 87, 'u'] } },
  pronew: { a: { hip: [60, 97], t: 90, h: 8, fF: [22, 99, 'u'], fB: [21, 99, 'u'], tF: 0, tB: 0, hF: [116, 90, 'u'], hB: [115, 91, 'u'] }, b: { hip: [60, 97], t: 88, h: 0, hF: [98, 88, 'b'], hB: [97, 89, 'b'] } },
  pullover: { inv: true, props: [{ k: 'pack', j: 'handF' }], a: { hip: [70, 97], t: -90, h: 0, fF: [96, 101, 'u'], fB: [95, 101, 'u'], hF: [41, 68, 'f'], hB: [40, 68, 'f'] }, b: { hip: [70, 97], t: -90, hF: [12, 92, 'u'], hB: [11, 92, 'u'] } },
  calfstep: { props: [{ k: 'step', x: 82, y: 88, w: 40 }], a: { hip: [80, 52.4], t: 180, fF: [81, 90.4, 'f'], fB: [80, 90.4, 'f'], tF: 110, tB: 110, aF: [5, 5], aB: [0, 0] }, b: { hip: [84.6, 43.4], t: 180, fF: [85.6, 81.4, 'f'], fB: [84.6, 81.4, 'f'], tF: 20, tB: 20 } },
  calffloor: { a: { hip: [80, 63], t: 180, fF: [81, 101, 'f'], fB: [92, 92, 'f'], tF: 90, tB: 120, aF: [5, 5], aB: [0, 0] }, b: { hip: [83.5, 56.9], t: 180, fF: [84.5, 94.9, 'f'], fB: [95.5, 86, 'f'], tF: 30 } },
  dips: { props: [{ k: 'chair', x: 72, y: 72, w: 24, back: 'r' }], a: { hip: [84, 71], t: 180, h: 0, hF: [86, 70, 'b'], hB: [84, 70, 'b'], fF: [114, 100, 'u'], fB: [113, 100, 'u'], tF: 170, tB: 170 }, b: { hip: [82, 86], t: 176 } },
  /* Collo */
  neckflex: { a: { hip: [66, 98], t: -88, h: 0, fF: [88, 101, 'u'], fB: [87, 101, 'u'], aF: [88, 90], aB: [86, 90] }, b: { h: -55 } },
  neckext: { a: { hip: [60, 97], t: 90, h: -6, fF: [22, 99, 'u'], fB: [21, 99, 'u'], tF: 0, tB: 0, aF: [-88, -90], aB: [-86, -90] }, b: { h: 28 } },
  neckiso: { hold: true, a: Object.assign({}, STAND, { h: 0, hF: [84, 62, 'b'], hB: [76, 62, 'b'] }), b: { h: 4, hF: [88, 21, 'd'] } },
  neckisoback: { hold: true, a: Object.assign({}, STAND, { h: 0, hF: [84, 62, 'b'], hB: [76, 62, 'b'] }), b: { h: -4, hF: [72, 19, 'd'], hB: [71, 20, 'd'] } },
  necksideiso: { hold: true, front: true, a: { hip: [80, 63], t: 180, h: 0, fF: [86, 101, 'f'], fB: [74, 101, 'b'], tF: 80, tB: -80, hF: [90, 62, 'f'], hB: [70, 62, 'b'] }, b: { h: -5, hF: [88, 20, 'f'] } },
  shrug: { props: [{ k: 'pack', j: 'handF' }], a: Object.assign({}, STAND, { hF: [84, 62, 'b'], hB: [80, 62, 'b'] }), b: { hip: [80, 61.5], hF: [84, 57, 'b'], hB: [80, 57, 'b'] } },
  /* Riscaldamento e defaticamento */
  jacks: { front: true, a: { hip: [80, 63], t: 180, fF: [85, 101, 'f'], fB: [75, 101, 'b'], tF: 80, tB: -80, hF: [89, 63, 'f'], hB: [71, 63, 'b'] }, b: { hip: [80, 61], fF: [98, 101, 'f'], fB: [62, 101, 'b'], hF: [95, 8, 'f'], hB: [65, 8, 'b'] } },
  armcircle: { front: true, a: { hip: [80, 63], t: 180, fF: [86, 101, 'f'], fB: [74, 101, 'b'], tF: 80, tB: -80, hF: [116, 37, 'd'], hB: [44, 37, 'd'] }, b: { hF: [110, 14, 'd'], hB: [50, 14, 'd'] } },
  catcow: { a: { hip: [62, 74], t: 92, h: -40, hF: [93, 101, 'b'], hB: [91, 101, 'b'], fF: [44, 100, 'd'], fB: [43, 100, 'd'], tF: -90, tB: -90 }, b: { hip: [62, 72], t: 84, h: 50 } },
  childpose: { hold: true, a: { hip: [47, 86], t: 178, h: 0, fF: [40, 100, 'f'], fB: [39, 100, 'f'], tF: -90, tB: -90, hF: [50, 84, 'b'], hB: [48, 84, 'b'] }, b: { hip: [52, 86], t: 76, h: 25, hF: [112, 99, 'u'], hB: [111, 99, 'u'] } },
  hamstretch: { a: { hip: [50, 97], t: 150, h: 10, fF: [88, 99, 'u'], fB: [87, 99, 'u'], tF: 180, tB: 180, hF: [80, 88, 'u'], hB: [79, 89, 'u'] }, b: { t: 118, h: 20, hF: [90, 95, 'u'], hB: [89, 96, 'u'] } },
  quadstretch: { hold: true, props: [{ k: 'wall', x: 112 }], a: { hip: [80, 63], t: 180, fF: [82, 101, 'f'], fB: [78, 101, 'f'], tB: 90, hB: [78, 62, 'b'], hF: [110, 40, 'd'] }, b: { fB: [72, 62, 'd'], tB: -20, hB: [72, 60, 'b'] } },
  chestwall: { hold: true, props: [{ k: 'wall', x: 38 }], a: { hip: [72, 63], t: 180, fF: [78, 101, 'f'], fB: [70, 101, 'f'], hF: [74, 62, 'b'], hB: [80, 62, 'b'] }, b: { hip: [74, 63], t: 176, hF: [47, 33, 'd'] } },
  hipflexor: { hold: true, props: [{ k: 'cushion', x: 44, y: 100, w: 16 }], a: { hip: [70, 82], t: 180, fF: [100, 101, 'f'], fB: [36, 100, 'd'], tF: 90, tB: -90, hF: [94, 82, 'd'], hB: [92, 82, 'd'] }, b: { hip: [79, 88], t: 178 } },
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
  po_floor: 'pullover', pp_w: 'pronew', pp_slide: 'pronew',
  nf_lift: 'neckflex', nf_iso: 'neckiso', ne_prone: 'neckext', ne_iso: 'neckisoback', ns_iso: 'necksideiso', sh_bp: 'shrug'
};

/* Risolve le animazioni che ereditano da un'altra (base). */
function animDef(key) {
  const d = ANIMS[key]; if (!d) return null;
  if (!d.base) return d;
  const b = animDef(d.base);
  const a = Object.assign({}, b.a, d.a || {});
  const bb = Object.assign({}, b.b, d.a || {}, d.b || {});
  return { a: a, b: bb, hold: d.hold != null ? d.hold : b.hold, front: d.front || b.front, props: d.props || b.props, inv: d.inv || b.inv };
}

function frameInner(key, k, hl) {
  const d = animDef(key); const a = d.a; const b = Object.assign({}, a, d.b);
  const pose = lerpPose(a, b, k); const J = solve(pose, d.front);
  const props = d.props || [];
  const back = props.filter((p) => ['pack', 'band', 'towel'].indexOf(p.k) < 0).map((p) => propSvg(p, J)).join('');
  const fore = props.filter((p) => ['pack', 'band', 'towel'].indexOf(p.k) >= 0).map((p) => propSvg(p, J)).join('');
  return '<line x1="-10" y1="' + (FLOOR + 0.8) + '" x2="170" y2="' + (FLOOR + 0.8) + '" stroke="#2A2A2F" stroke-width="1.6"/>' + back + figureSvg(J, d.front, hl) + fore;
}

/* HTML del riquadro animato; l'animazione parte da sola (vedi tickAnims). */
function animBox(exId, cls) {
  const key = EX_ANIM[exId] || (ANIMS[exId] ? exId : null); if (!key || !ANIMS[key]) return '';
  const hl = EX[exId] ? EX[exId].m : '';
  return '<div class="anim ' + (cls || '') + '"><svg viewBox="0 -12 160 124" data-anim="' + key + '" data-hl="' + hl + '" role="img" aria-label="Animazione dell’esercizio">' + frameInner(key, 0, hl) + '</svg></div>';
}

let animT0 = 0;
function tickAnims(ts) {
  const els = document.querySelectorAll('svg[data-anim]');
  if (els.length) {
    if (!animT0) animT0 = ts;
    // Le dimostrazioni si muovono sempre, anche con "riduci animazioni": servono a capire l'esercizio.
    els.forEach((el) => {
      const key = el.getAttribute('data-anim'); const d = animDef(key);
      const ease = (x) => (1 - Math.cos(x * Math.PI)) / 2;
      let k;
      if (d.hold) { // entra in posizione, la tiene, torna indietro
        const ph = ((ts - animT0) % 4200) / 4200;
        k = ph < 0.2 ? ease(ph / 0.2) : ph < 0.8 ? 1 : ph < 0.95 ? ease(1 - (ph - 0.8) / 0.15) : 0;
      } else {
        const ph = ((ts - animT0) % 2800) / 2800;
        k = ph < 0.12 ? 0 : ph < 0.5 ? ease((ph - 0.12) / 0.38) : ph < 0.62 ? 1 : ease(1 - (ph - 0.62) / 0.38);
      }
      el.innerHTML = frameInner(key, k, el.getAttribute('data-hl') || '');
    });
  }
  requestAnimationFrame(tickAnims);
}
if (typeof window !== 'undefined' && window.requestAnimationFrame) requestAnimationFrame(tickAnims);
