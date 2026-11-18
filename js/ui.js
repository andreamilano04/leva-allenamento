/* LEVA 2.0 — Utilità di interfaccia, icone, grafici e componenti. */
'use strict';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtD = (k) => parseD(k).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const fmtDL = (k) => parseD(k).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
const unit = (u) => (u === 's' ? 's' : 'rip');
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
const fmtMin = (m) => (m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '') : m + ' min');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const sv = (d, w) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const ICON = {
  home: sv('<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>'),
  cal: sv('<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  dumb: sv('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>', 2.2),
  chart: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  user: sv('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.8 4.3-5.5 7.5-5.5s6.1 1.7 7.5 5.5"/>'),
  play: sv('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>', 1.5),
  pause: sv('<path d="M8.5 5.5v13M15.5 5.5v13"/>', 3),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3),
  x: sv('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.4"/>', 2.2),
  plus: sv('<path d="M12 5v14M5 12h14"/>', 2.6),
  minus: sv('<path d="M5 12h14"/>', 2.6),
  chevR: sv('<path d="M9 5l7 7-7 7"/>', 2.2),
  chevL: sv('<path d="M15 5l-7 7 7 7"/>', 2.2),
  clock: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  flame: sv('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 3-5.6 3.6-9.3 2.4 1.4 3.4 3.8 3.4 5.5 1-.6 1.6-1.7 1.8-2.9 1.9 1.5 4.2 4 4.2 6.7 0 3.6-2.6 6.2-6.5 6.2z"/>'),
  bolt: sv('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>'),
  trophy: sv('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>'),
  scale: sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9.5a5.5 5.5 0 0 1 8 0l-2.6 2.6a1.9 1.9 0 0 0-2.8 0z"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>', 2.2),
  swap: sv('<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>'),
  up: sv('<path d="M12 19V5M6 11l6-6 6 6"/>', 2.4),
  down: sv('<path d="M12 5v14M6 13l6 6 6-6"/>', 2.4),
  target: sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'),
  repeat: sv('<path d="M17 2.5 20.5 6 17 9.5M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5M7 21.5 3.5 18 7 14.5M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/>'),
  warn: sv('<path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.3"/>', 2.1),
  food: sv('<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 4-3 7h3v11"/>'),
  heart: sv('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>'),
  moon: sv('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>'),
  stop: sv('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>', 1.5),
  dl: sv('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  ul: sv('<path d="M12 15.5V4.5M7 9l5-5 5 5M5 20h14"/>'),
  trash: sv('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'),
  phone: sv('<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M11 18.5h2"/>'),
  muscle: sv('<path d="M5 19c2-1 4-1.2 6.5-.5 3 .8 6 .3 7.5-2.5 1.5-3-.5-6.5-3.5-6.5-1.6 0-2.8.8-3.5 2l-1.2-3.8L13 5.5 11.5 3 8 4.5l1.5 6.5C7.5 12 5.5 14.5 5 19z"/>')
};

/* ---------- Grafici (SVG) ---------- */
function lineChart(pts, opt) {
  opt = opt || {};
  if (pts.length < 2) return '<div class="empty">' + esc(opt.empty || 'Servono almeno 2 misurazioni per vedere il grafico.') + '</div>';
  const W = 340, H = opt.h || 160, pl = 34, pr = 10, pt = 14, pb = 24;
  const ys = pts.map((p) => p.y); if (opt.goal != null) ys.push(opt.goal);
  let y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  const minSpan = opt.minSpan || 1; if (y1 - y0 < minSpan) { const m = (y0 + y1) / 2; y0 = m - minSpan / 2; y1 = m + minSpan / 2; }
  const py = (y1 - y0) * 0.12; y0 -= py; y1 += py;
  const x0 = pts[0].x, x1 = pts[pts.length - 1].x;
  const X = (x) => pl + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (W - pl - pr);
  const Y = (y) => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
  const area = line + ' L' + X(x1).toFixed(1) + ' ' + (H - pb) + ' L' + X(x0).toFixed(1) + ' ' + (H - pb) + ' Z';
  const f = opt.int ? (v) => String(Math.round(v)) : fmt1;
  let grid = '';
  for (let i = 0; i <= 2; i++) { const v = y0 + ((y1 - y0) * i) / 2; const y = Y(v).toFixed(1); grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="#29292D" stroke-dasharray="2 4"/><text x="' + (pl - 7) + '" y="' + y + '" dy="4" text-anchor="end" font-size="10" fill="#8D8D94">' + f(v) + '</text>'; }
  let goal = '';
  if (opt.goal != null) { const gy = Y(opt.goal).toFixed(1); goal = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="#FF7A3D" stroke-dasharray="5 5"/><text x="' + (W - pr) + '" y="' + gy + '" dy="-6" text-anchor="end" font-size="10" fill="#FF7A3D">obiettivo</text>'; }
  const lp = pts[pts.length - 1];
  const xl = '<text x="' + pl + '" y="' + (H - 6) + '" font-size="10" fill="#8D8D94">' + esc(opt.l0 || '') + '</text><text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end" font-size="10" fill="#8D8D94">' + esc(opt.l1 || '') + '</text>';
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opt.label || 'Grafico') + '"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4F03A" stop-opacity=".3"/><stop offset="1" stop-color="#C4F03A" stop-opacity="0"/></linearGradient></defs>' + grid + '<path d="' + area + '" fill="url(#' + gid + ')"/><path d="' + line + '" fill="none" stroke="#C4F03A" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' + goal + '<circle cx="' + X(lp.x).toFixed(1) + '" cy="' + Y(lp.y).toFixed(1) + '" r="5" fill="#C4F03A" stroke="#151517" stroke-width="2.5"/>' + xl + '</svg>';
}

/* Barre verticali come nelle app fitness: binario scuro e barra lime. */
function barChart(vals, labels, opt) {
  opt = opt || {};
  const W = 340, H = opt.h || 170, pb = 22, pt = 18, n = vals.length;
  const max = Math.max.apply(null, vals.concat([opt.min || 1]));
  const gap = 10, bw = (W - gap * (n - 1)) / n;
  let out = '';
  vals.forEach((v, i) => {
    const x = i * (bw + gap); const hh = H - pb - pt; const h = v > 0 ? Math.max(6, (v / max) * hh) : 0;
    out += '<rect x="' + x.toFixed(1) + '" y="' + pt + '" width="' + bw.toFixed(1) + '" height="' + hh + '" rx="' + Math.min(10, bw / 2) + '" fill="#1F1F22"/>';
    if (h) out += '<rect x="' + x.toFixed(1) + '" y="' + (pt + hh - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + Math.min(10, bw / 2) + '" fill="' + (i === n - 1 ? '#C4F03A' : '#9DC22E') + '"/>';
    if (v > 0) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (pt + hh - h - 5).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#C9C9CE">' + esc(opt.fmt ? opt.fmt(v) : v) + '</text>';
    out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#8D8D94">' + esc(labels[i]) + '</text>';
  });
  return '<svg class="chart" viewBox="0 -4 ' + W + ' ' + (H + 4) + '" role="img" aria-label="' + esc(opt.label || 'Grafico a barre') + '">' + out + '</svg>';
}

function spark(vals) {
  if (vals.length < 2) return '';
  const W = 64, H = 26; const a = Math.min.apply(null, vals), b = Math.max.apply(null, vals); const rg = b - a || 1;
  const d = vals.map((v, i) => (i ? 'L' : 'M') + ((i / (vals.length - 1)) * (W - 4) + 2).toFixed(1) + ' ' + (H - 3 - ((v - a) / rg) * (H - 6)).toFixed(1)).join(' ');
  return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#C4F03A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* ---------- Componenti ---------- */
function field(id, label, type, val, ph, step) {
  return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '"' + (type === 'number' ? ' inputmode="decimal"' : ' autocomplete="off"') + (step ? ' step="' + step + '"' : '') + ' value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"></div>';
}
function seg(id, opts, cur, act) {
  return '<div class="seg" id="' + id + '">' + opts.map((o) => '<button data-a="' + (act || 'segPick') + '" data-v="' + o[0] + '" class="' + (String(o[0]) === String(cur) ? 'on' : '') + '">' + esc(o[1]) + '</button>').join('') + '</div>';
}
function toggle(id, on, title, sub, act) {
  return '<button class="switch" data-a="' + (act || 'tog') + '" data-v="' + id + '" aria-pressed="' + (on ? 'true' : 'false') + '"><div class="f"><b>' + esc(title) + '</b>' + (sub ? '<div class="muted small">' + esc(sub) + '</div>' : '') + '</div><span class="tog ' + (on ? 'on' : '') + '" id="' + id + '"></span></button>';
}
function daysPicker(id, sel) {
  return '<div class="days" id="' + id + '">' + WD.map((d, i) => '<button data-a="dayPick" data-v="' + i + '" class="' + (sel.indexOf(i) >= 0 ? 'on' : '') + '" aria-label="' + d + '">' + WD1[i] + '</button>').join('') + '</div>';
}
function tile(icon, label, value, act, v) {
  return '<' + (act ? 'button data-a="' + act + '"' + (v ? ' data-v="' + v + '"' : '') : 'div') + ' class="tile"><span class="ic">' + ICON[icon] + '</span><div><b>' + value + '</b><div class="l">' + esc(label) + '</div></div></' + (act ? 'button' : 'div') + '>';
}
function dots(i, n) { let h = '<span class="dots5" aria-label="Difficoltà ' + (i + 1) + ' su ' + n + '">'; for (let k = 0; k < n; k++) h += '<i class="' + (k <= i ? 'on' : '') + '"></i>'; return h + '</span>'; }
function rangeTxt(r, u, side) { return r[0] + '–' + r[1] + ' ' + unit(u) + (side ? ' per lato' : ''); }

function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.add('show'); $('#sheet .pane').scrollTop = 0; }
function closeSheet() { $('#sheet').classList.remove('show'); }
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
