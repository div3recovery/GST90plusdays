/* STO Recovery App – Gandhinagar Division · version 2 · Developed by Mehul Ranavasiya */
var API_URL = (window.APP_CONFIG && window.APP_CONFIG.apiUrl) || '';
var S = { meta: null, role: '', unit: '', sto: '', pin: '', by: '', d: null, stack: [], screen: '', head: null, cur: null,
          catF: '', ledF: 'todo', listMode: 'rec', listF: 'all', catSel: '', recMode: '', actType: '', fld: {} };
var R = { pm: 'rec', data: null, tab: 'ov', unit: 'all', type: 'all', act: 'all', per: 'month', recView: 'unit', showAll: false };

/* ---------------- helpers ---------------- */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function inr(n) { n = Number(n) || 0; return Math.round(n).toLocaleString('en-IN'); }
function short(n) { n = Number(n) || 0; if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr'; if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L'; return inr(n); }
function dmy(s) { if (!s) return ''; var p = String(s).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : s; }
function store(k, v) { try { localStorage.setItem('rec2_' + k, v); } catch (e) {} }
function recall(k) { try { return localStorage.getItem('rec2_' + k) || ''; } catch (e) { return ''; } }
function busy(on) { $('loading').classList.toggle('hide', !on); }
function toast(t) { var e = $('toast'); e.textContent = t; e.classList.remove('hide'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.add('hide'); }, 2800); }
function stepShort(s) { if (!s) return ''; var i = s.indexOf('('); return i > 8 ? s.slice(0, i).trim() : s; }
function cases(n) { return n + (n === 1 ? ' case' : ' cases'); }
function shortU(u) { var m = String(u).match(/(\d+)/); return m ? 'G-' + m[1] : u; }
function daysAgo(iso) { if (!iso || !S.d) return null; return Math.round((new Date(S.d.today + 'T12:00:00') - new Date(iso.slice(0, 10) + 'T12:00:00')) / 864e5); }
function todayIso() { return S.d ? S.d.today : new Date().toISOString().slice(0, 10); }
function numVal(id) { return $(id).value.replace(/[,\s]/g, ''); }
function isNum(v) { return /^\d+(\.\d+)?$/.test(v); }
function ic(n, c) { return '<svg class="ic' + (c ? ' ' + c : '') + '"><use href="#i-' + n + '"/></svg>'; }
function ringSvg(p, size) {
  size = size || 38; var c = 94.2, d = Math.max(0, Math.min(1, p)) * c;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 38 38"><circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="5"/>' +
    '<circle cx="19" cy="19" r="15" fill="none" stroke="#E2B456" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + d.toFixed(1) + ' ' + c + '" transform="rotate(-90 19 19)"/></svg>';
}

/* ---------------- server ---------------- */
function api(fn) {
  var args = [].slice.call(arguments, 1);
  if (!API_URL || /PASTE_WEB_APP_URL/.test(API_URL)) return Promise.reject('App link not set. Ask the Division office (config.js).');
  return fetch(API_URL, { method: 'POST', credentials: 'omit', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: fn, args: args }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { if (!j.ok) throw { server: j.error }; return j.data; })
    .catch(function (e) { throw (e && e.server) ? e.server : 'Cannot reach the server. Please check internet and try again.'; });
}

/* ---------------- navigation ---------------- */
var VIEWS = ['sStart', 'sLogin', 'sRole', 'sHome', 'sCat', 'sCatForm', 'sLedger', 'sList', 'sRec', 'sAct', 'sCase', 'sAdmin', 'sDash', 'sOff', 'sRev', 'sLists'];
var REFRESH = {
  sHome: function () { renderHome(); }, sCat: function () { renderCat(); }, sLedger: function () { renderLedger(); },
  sList: function () { renderList(); }, sCase: function () { if (S.cur) openCase(S.cur.demandId, true); }, sDash: function () { renderReport(); }
};
/** head: {mode:'hero'|'heroSm'|'bar', t, s, k(kpis html)} */
function show(id, head, opt) {
  opt = opt || {};
  if (opt.reset) S.stack = opt.reset;
  else if (!opt.noPush && S.screen && S.screen !== id) S.stack.push({ id: S.screen, head: S.head });
  VIEWS.forEach(function (v) { $(v).classList.toggle('hide', v !== id); });
  S.screen = id; S.head = head || { mode: 'bar', t: 'STO Recovery', s: '' };
  setHead(S.head);
  if (!opt.keepScroll) window.scrollTo(0, 0);
}
function setHead(h) {
  var hero = h.mode === 'hero' || h.mode === 'heroSm';
  $('topBar').classList.toggle('big', hero); document.body.classList.toggle('st', hero);
  $('heroBox').classList.toggle('hide', !hero); $('heroBox').classList.toggle('sm', h.mode === 'heroSm');
  $('tbRow').classList.toggle('hide', hero);
  if (hero) { $('heroT').textContent = h.t || ''; $('heroS').textContent = h.s || ''; }
  else {
    $('title').classList.toggle('wi', !!h.ic);
    $('title').innerHTML = h.ic ? '<svg class="hic"><use href="#icoDash"/></svg><span>' + esc(h.t) + '<small>' + esc(h.s || '') + '</small></span>'
      : esc(h.t) + '<small>' + esc(h.s || '') + '</small>';
  }
  $('kpis').innerHTML = h.k || ''; $('kpis').classList.toggle('hide', !h.k);
}
function goBack() {
  var p = S.stack.pop();
  if (!p) { if (S.screen !== 'sStart') toStart(); return; }
  show(p.id, p.head, { noPush: true });
  if (REFRESH[p.id]) REFRESH[p.id]();
}
function toStart() {
  show('sStart', { mode: 'hero', t: 'Recovery – ' + ((S.meta && S.meta.division) || 'Gandhinagar Division'), s: 'Choose how you want to open the app' }, { reset: [] });
}

/* ---------------- start ---------------- */
function init() {
  var saved = null; try { saved = JSON.parse(recall('meta') || 'null'); } catch (e) {}
  if (saved && saved.units) startWith(saved); else { busy(true); toStart(); }
  api('getMeta').then(function (m) {
    busy(false); store('meta', JSON.stringify(m));
    var first = !S.meta; S.meta = m; fillSelects();
    if (first) startWith(m);
  }).catch(function (e) { busy(false); if (!S.meta) { toStart(); toast(String(e)); } });
  var rep = null; try { rep = JSON.parse(recall('report') || 'null'); } catch (e) {}
  if (rep) startPct(rep);
  api('getReport', '').then(function (r) { store('report', JSON.stringify(r)); startPct(r); if (S.screen === 'sDash' && R.data && R.data.month === r.month) { R.data = r; renderReport(); } }).catch(function () {});
}
function startWith(m) { S.meta = m; fillSelects(); toStart(); }
function startPct(r) {
  var G = totals(r.rows, 'all', 'all'), t = G.pending * r.targetPct / 100;
  var p = t ? G.recovered * 100 / t : 0;
  $('startPct').innerHTML = t ? '<b>' + p.toFixed(1) + '%</b>of target' : '';
  $('startBar').classList.toggle('hide', !t); $('startBar').firstChild.style.width = Math.min(100, Math.max(p, p > 0 ? 2 : 0)) + '%';
}
function fillSelects() {
  var m = S.meta, opts = m.units.map(function (u) { return '<option>' + esc(u.name) + '</option>'; }).join('');
  var keepU = $('unit').value || recall('unit');
  $('unit').innerHTML = '<option value="">-- Select Unit --</option>' + opts;
  if (keepU && m.units.some(function (x) { return x.name === keepU; })) $('unit').value = keepU;
  fillSto(); var s = recall('sto'); if (s) { $('sto').value = s; pinBox(); }
  if (!$('by').value) $('by').value = recall('by');
  $('ru').innerHTML = opts; $('admUnit').innerHTML = opts;
  var ru = recall('ru'); if (ru) $('ru').value = ru;
}
function fillSto() {
  var u = S.meta.units.find(function (x) { return x.name === $('unit').value; });
  $('sto').innerHTML = '<option value="">-- Select STO --</option>' + (u ? u.stos.map(function (s) { return '<option>' + esc(s.name) + '</option>'; }).join('') : '');
  pinBox();
}
function pinBox() {
  var u = S.meta.units.find(function (x) { return x.name === $('unit').value; });
  var s = u && u.stos.find(function (x) { return x.name === $('sto').value; });
  $('pinWrap').classList.toggle('hide', !(s && s.hasPin));
}

/* ---------------- STO login & data ---------------- */
function ckey(u, s) { return 'cases_' + u + '|' + s; }
function cacheGet(u, s, pin) { try { var o = JSON.parse(localStorage.getItem('rec2_' + ckey(u, s)) || 'null'); return o && o.pin === pin ? o.data : null; } catch (e) { return null; } }
function cachePut() { if (S.role !== 'sto') return; try { localStorage.setItem('rec2_' + ckey(S.unit, S.sto), JSON.stringify({ pin: S.pin, data: S.d })); } catch (e) {} }
function loginSto() {
  var unit = $('unit').value, sto = $('sto').value, by = $('by').value.trim(), pin = $('pin').value;
  $('loginErr').textContent = '';
  if (!unit || !sto) { $('loginErr').textContent = 'Please select Unit and STO.'; return; }
  if (!by) { $('loginErr').textContent = 'Please enter your name.'; return; }
  store('unit', unit); store('sto', sto); store('by', by);
  S.role = 'sto'; S.unit = unit; S.sto = sto; S.pin = pin; S.by = by;
  var saved = cacheGet(unit, sto, pin);
  if (saved) { S.d = saved; goHome(); syncNote('Refreshing latest data…'); } else busy(true);
  api('getCases', unit, sto, pin, 'sto').then(function (d) {
    busy(false); syncNote(''); S.d = d; cachePut();
    if (!saved) goHome(); else if (REFRESH[S.screen]) REFRESH[S.screen]();
  }).catch(function (e) {
    busy(false);
    if (saved) syncNote('Could not refresh – showing data saved on this phone.');
    else { S.role = ''; $('loginErr').textContent = e; }
  });
}
function syncNote(t) { var e = $('syncHome'); e.textContent = t; e.classList.toggle('hide', !t); }
function openLogin() { show('sLogin', { mode: 'bar', t: 'STO Login', s: (S.meta && S.meta.division) || 'Gandhinagar Division' }); }
function openRoleLogin() { setRole(ROLE); show('sRole', { mode: 'bar', t: 'Monitoring Officers Login', s: (S.meta && S.meta.division) || 'Gandhinagar Division' }); }
function logout() { S.rep = null; S.role = ''; S.d = null; toStart(); show('sLogin', { mode: 'bar', t: 'STO Login', s: S.meta.division }); }
function goHome() {
  show('sHome', { mode: 'heroSm', t: S.unit + ' · ' + S.sto, s: S.by + ' · ' + S.d.monthLabel }, { reset: [{ id: 'sStart', head: { mode: 'hero', t: 'Recovery – ' + S.meta.division, s: 'Choose how you want to open the app' } }] });
  renderHome();
}
function work() { return S.d.cases.filter(function (c) { return c.cat === 'Recoverable'; }); }
function checkedToday(c) { return c.ledgerOn && c.ledgerOn.slice(0, 10) === S.d.today; }
function caseById(id) { return S.d.cases.find(function (c) { return c.demandId === id; }); }
function replaceCase(n) { var i = S.d.cases.findIndex(function (c) { return c.demandId === n.demandId; }); if (i >= 0) { n.actsMonth = S.d.cases[i].actsMonth; S.d.cases[i] = n; } cachePut(); return n; }
/* Active / Cancelled filter (STO screens) – Active by default */
function tyNow() { if (!S.ty) S.ty = recall('ty') || 'A'; return S.ty; }
function tyOk(c) { var t = tyNow(); return t === 'all' || (t === 'C') === (c.type === 'Cancelled'); }
function setTy(t, fn) { S.ty = t; store('ty', t); window[fn](); }
function tySeg(scr, base, fn, pend) {
  var t = tyNow(), a = base.filter(function (c) { return c.type !== 'Cancelled'; }), cn = base.length - a.length;
  function lab(k, n, list) { var p = pend ? list.filter(pend).length : 0; return p ? '<i class="tyd" title="pending">' + p + '</i>' : n; }
  var can = base.filter(function (c) { return c.type === 'Cancelled'; });
  $('ty_' + scr).innerHTML = [['A', 'Active', lab('A', a.length, a)], ['C', 'Cancelled', lab('C', cn, can)], ['all', 'All', lab('all', base.length, base)]].map(function (x) {
    return '<button class="' + (t === x[0] ? 'on' : '') + '" onclick="setTy(\'' + x[0] + '\',\'' + fn + '\')">' + x[1] + ' <b>' + x[2] + '</b></button>'; }).join('');
}
/* "My standing" – the STO's position in the Division */
function loadStanding() {
  if (S.rep && Date.now() - S.repAt < 300000) { renderStanding(); return; }
  if (!S.rep) { try { var c = JSON.parse(recall('report') || 'null'); if (c && c.rows) { S.rep = c; S.repAt = 0; renderStanding(); } } catch (e) {} }
  api('getReport', '').then(function (r) { S.rep = r; S.repAt = Date.now(); store('report', JSON.stringify(r)); if (S.screen === 'sHome') renderStanding(); }).catch(function () {});
}
function setStBy(v, ev) { if (ev) ev.stopPropagation(); S.stBy = v; store('stBy', v); renderStanding(); }
function renderStanding() {
  var el = $('myStand'), r = S.rep; if (!r || !r.rows) { el.classList.add('hide'); return; }
  var by = S.stBy || recall('stBy') || 'amt', A = by === 'amt';            // rank by Amount recovered (default) or % of target
  var val = function (x) { return A ? x.recovered : x.pct; };
  var L = stoRank(r).sort(function (a, b) { return val(b) - val(a) || b.recovered - a.recovered; }), i = -1;
  L.forEach(function (x, k) { if (x.unit === S.unit && x.sto === S.sto) i = k; });
  if (i < 0) { el.classList.add('hide'); return; }
  var me = L[i], n = L.length, ahead = function (list) { return 1 + list.filter(function (x) { return val(x) > val(me) + 1e-9; }).length; };
  var rk = ahead(L), U = L.filter(function (x) { return x.unit === S.unit; }), ur = ahead(U);
  var uRec = U.reduce(function (a, x) { return a + x.recovered; }, 0), uTg = U.reduce(function (a, x) { return a + x.target; }, 0), uAvg = uTg ? uRec * 100 / uTg : 0, uAvgAmt = U.length ? uRec / U.length : 0;
  var need = function (o) { return Math.max(0, Math.ceil(A ? o.recovered - me.recovered : o.pct / 100 * me.target - me.recovered) + 1); }, gap;
  if (rk === 1) gap = me.recovered > 0 ? ic('trophy') + ' <b>You are leading the Division</b> – keep it up!' : 'Record your first recovery to get on the board';
  else if (rk > 5 && !(val(L[4]) > val(me))) gap = 'Record a recovery to move up the board';
  else if (rk > 5) gap = 'Only <b>&#8377;' + short(need(L[4])) + '</b> more to reach the <b>Top 5</b>';
  else { var ab = L[rk - 2]; gap = '<b>&#8377;' + short(need(ab)) + '</b> more to overtake <b>#' + (rk - 1) + '</b> (' + esc(ab.sto) + ' · ' + esc(shortU(ab.unit)) + ')'; }
  var top = Math.max(L[0].recovered, 1), w = function (x) { return Math.min(100, A ? x * 100 / top : x).toFixed(1); };
  var won = r.som && r.som.top && r.som.top[0] && r.som.top[0].unit === S.unit && r.som.top[0].sto === S.sto;
  el.classList.remove('hide');
  el.innerHTML = (won ? '<div class="msW">' + TROPHY + '<span>You were <b>STO of the Month</b> for ' + esc(r.som.monthLabel) + '</span></div>' : '') +
    '<div class="msT"><div class="msR"><span>Rank</span><b>' + rk + '</b><em>of ' + n + '</em></div><div class="msB">' +
    '<div class="msH"><span class="msK">My standing · ' + esc(r.monthLabel) + '</span><span class="msS"><button class="' + (A ? 'on' : '') + '" onclick="setStBy(\'amt\',event)">&#8377; Amount</button><button class="' + (A ? '' : 'on') + '" onclick="setStBy(\'pct\',event)">% Target</button></span></div>' +
    (A ? '<div class="msL"><span>You</span><b>&#8377;' + short(me.recovered) + '</b><em>' + me.pct.toFixed(1) + '% of target</em></div><div class="bar g"><i style="width:' + w(me.recovered) + '%"></i></div>' +
         '<div class="msL"><span>' + esc(shortU(S.unit)) + ' avg</span><b>&#8377;' + short(uAvgAmt) + '</b><em>Rank ' + ur + ' of ' + U.length + ' in Unit</em></div><div class="bar"><i style="width:' + w(uAvgAmt) + '%"></i></div>'
       : '<div class="msL"><span>You</span><b>' + me.pct.toFixed(1) + '%</b><em>of target · &#8377;' + short(me.recovered) + '</em></div><div class="bar g"><i style="width:' + w(me.pct) + '%"></i></div>' +
         '<div class="msL"><span>' + esc(shortU(S.unit)) + ' average</span><b>' + uAvg.toFixed(1) + '%</b><em>Rank ' + ur + ' of ' + U.length + ' in Unit</em></div><div class="bar"><i style="width:' + w(uAvg) + '%"></i></div>') +
    '</div></div><div class="msG">' + gap + '</div>';
}
function renderHome() {
  $('whoName').textContent = S.by + ' · ' + S.unit + ' · ' + S.sto;
  loadStanding();
  var cs = S.d.cases, w = work(), dec = 0, con = 0;
  cs.forEach(function (c) { if (c.catStatus === 'decide') dec++; else if (c.catStatus === 'confirm') con++; });
  if (!S.d.locked && dec + con > 0) {
    $('tCat').innerHTML = '<b>' + (dec + con) + '</b>pending';
    $('tCatS').textContent = (dec ? dec + ' new to decide · ' : '') + con + ' to confirm';
  } else { $('tCat').innerHTML = '<b>' + cs.length + '</b>cases'; $('tCatS').textContent = 'Categories for ' + S.d.monthLabel; }
  var toCheck = w.filter(function (c) { return !checkedToday(c); }).length;
  $('tLed').innerHTML = '<b>' + toCheck + '</b>to check today';
  var rec = 0, acts = 0; cs.forEach(function (c) { rec += c.recovered; acts += c.actsMonth || 0; });
  $('tRec').innerHTML = '<b>&#8377;' + short(rec) + '</b>this month';
  $('tAct').innerHTML = '<b>' + acts + '</b>this month';
}

/* ---------------- categories ---------------- */
var CAT_CLS = { 'Recoverable': 'c1', 'NCLT / Liquidation': 'c2', 'Tribunal / HC / SC / Court': 'c3', 'Other (Rectification, Revision, Litigation)': 'c4', 'Paid via DRC-03 (not in DCR)': 'c5' };
var CAT_SHORT = { 'Recoverable': 'Recoverable', 'NCLT / Liquidation': 'NCLT / Liquidation', 'Tribunal / HC / SC / Court': 'Tribunal / Court',
  'Other (Rectification, Revision, Litigation)': 'Other', 'Paid via DRC-03 (not in DCR)': 'Paid via DRC-03' };
function catChip(c) { return c ? '<span class="cat ' + (CAT_CLS[c] || 'c4') + '">' + esc(CAT_SHORT[c] || c) + '</span>' : '<span class="cat c0">Not decided</span>'; }
function openCat() {
  var cs = S.d.cases, dec = cs.filter(function (c) { return c.catStatus === 'decide'; }).length;
  if (!S.catF) S.catF = S.d.locked ? 'all' : (dec ? 'decide' : 'confirm');
  show('sCat', { mode: 'bar', t: 'Case Categories', s: S.unit + ' · ' + S.sto + ' · ' + S.d.monthLabel });
  renderCat();
}
function renderCat() {
  var all = S.d.cases, L = S.d.locked, n = { decide: 0, confirm: 0, done: 0 };
  tySeg('sCat', all, 'renderCat', L ? null : function (c) { return c.catStatus !== 'done'; });
  var cs = all.filter(tyOk); all.forEach(function (c) { n[c.catStatus]++; });
  if (!L && n.decide + n.confirm > 0) {
    $('catBan').className = 'ban';
    $('catBan').innerHTML = '<b>' + S.d.monthLabel + ': ' + n.confirm + ' to confirm' + (n.decide ? ' · ' + n.decide + ' new to decide' : '') + '</b>' + (n.decide ? 'NEW cases: tap <strong>Decide</strong> and select the category. ' : '') + 'For the others the category proposed by the Division office is shown: tap <strong>Confirm</strong> if correct, or <strong>Change</strong> and write the reason.';
  } else {
    var cnt = {}; all.forEach(function (c) { cnt[c.cat] = (cnt[c.cat] || 0) + 1; });
    $('catBan').className = 'ban ok';
    $('catBan').innerHTML = '<b>&#10003; All ' + all.length + ' cases have a category for ' + S.d.monthLabel + '</b>' +
      Object.keys(cnt).map(function (k) { return esc(CAT_SHORT[k] || k) + ': ' + cnt[k]; }).join(' · ') + '. Work on Recoverable cases in Ledger, Recovery and Actions.';
  }
  n = { decide: 0, confirm: 0, done: 0 }; cs.forEach(function (c) { n[c.catStatus]++; });
  var pills = L ? [['all', 'All ' + cs.length]] : (n.decide ? [['decide', 'New, to decide ' + n.decide]] : []).concat([['confirm', 'To confirm ' + n.confirm], ['done', 'Done ' + n.done], ['all', 'All']]);
  if (!pills.some(function (p) { return p[0] === S.catF; })) S.catF = 'all';
  $('catPills').innerHTML = pills.map(function (p) { return '<button class="pill' + (S.catF === p[0] ? ' on' : '') + '" onclick="S.catF=\'' + p[0] + '\';renderCat()">' + p[1] + '</button>'; }).join('');
  var q = $('qCat').value.trim().toLowerCase();
  var list = cs.filter(function (c) {
    if (S.catF !== 'all' && c.catStatus !== S.catF) return false;
    if (q && (c.name + ' ' + c.gstin + ' ' + c.demandId).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return b.pending - a.pending; });
  $('catRows').innerHTML = list.length ? list.map(function (c) {
    var btns = '';
    if (!L) {
      if (c.catStatus === 'decide') btns = '<button class="mb f" onclick="openCatForm(\'' + esc(c.demandId) + '\')">Decide</button>';
      else if (c.catStatus === 'confirm') btns = '<button class="mb" onclick="openCatForm(\'' + esc(c.demandId) + '\')">Change</button><button class="mb f" onclick="confirmOne(\'' + esc(c.demandId) + '\')">Confirm</button>';
      else btns = '<button class="mb" onclick="openCatForm(\'' + esc(c.demandId) + '\')">Change</button>';
    }
    var sub = esc(c.gstin) + ' · ' + esc(c.type) + (c.catDetails ? ' · ' + esc(c.catDetails) : '') + (c.catReason ? '<br><i>Reason: ' + esc(c.catReason) + '</i>' : '');
    return '<div class="cs' + (c.catStatus === 'decide' ? ' r' : c.catStatus === 'confirm' ? ' a' : ' g') + '" style="cursor:default"><div class="n">' + esc(c.name) + (c.catStatus === 'decide' ? ' <span class="tg new">NEW</span>' : '') + '</div>' +
      '<div class="gs">' + sub + '</div>' + idLine(c) + '<div class="amt">&#8377;' + short(c.pending) + '</div>' +
      '<div class="meta">' + catChip(c.catStatus === 'decide' ? '' : c.cat) + (c.catStatus === 'confirm' ? '<span class="from">proposed</span>' : '') + (c.catStatus === 'done' && c.catPrev && c.catPrev !== c.cat ? '<span class="from">changed from ' + esc(CAT_SHORT[c.catPrev] || c.catPrev) + '</span>' : c.catStatus === 'done' && !L ? '<span class="from">confirmed</span>' : '') +
      '<span class="acts">' + btns + '</span></div></div>';
  }).join('') : '<div class="empty">No cases in this view</div>';
  var nc = cs.filter(function (c) { return c.catStatus === 'confirm'; }).length;
  $('catBar').classList.toggle('hide', L || !nc);
  $('confirmAllBtn').innerHTML = '&#10003; Confirm all ' + nc + ' unchanged' + (tyNow() === 'all' ? '' : tyNow() === 'A' ? ' (Active)' : ' (Cancelled)');
  $('catRows').style.paddingBottom = (!L && nc) ? '90px' : '20px';
}
function confirmIds(ids, msg) {
  busy(true);
  api('confirmCategories', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, ids: ids }).then(function (r) {
    busy(false);
    S.d.cases.forEach(function (c) { if (ids.indexOf(c.demandId) >= 0 && c.catStatus === 'confirm') c.catStatus = 'done'; });
    cachePut(); toast(msg || ('Confirmed ' + r.confirmed + ' ✓')); renderCat();
  }).catch(function (e) { busy(false); toast(String(e)); });
}
function confirmOne(id) { confirmIds([id], 'Confirmed ✓'); }
function confirmAll() {
  var ids = S.d.cases.filter(function (c) { return c.catStatus === 'confirm' && tyOk(c); }).map(function (c) { return c.demandId; });
  if (!ids.length) return;
  if (!confirm('Confirm the proposed category for all ' + ids.length + ' remaining cases?')) return;
  S.catF = 'done'; confirmIds(ids);
}
var CAT_DESC = {
  'NCLT / Liquidation': 'NCLT case no., admission date',
  'Tribunal / HC / SC / Court': 'Forum, case / appeal no., stay order',
  'Other (Rectification, Revision, Litigation)': 'Type, reference no.',
  'Paid via DRC-03 (not in DCR)': 'ARN, date, amount',
  'Recoverable': 'Case goes to Ledger, Recovery and Actions'
};
var CAT_FIELDS = {
  'NCLT / Liquidation': [['NCLT case no', 'text', 1], ['Admission date', 'date', 0]],
  'Tribunal / HC / SC / Court': [['Forum', ['Appellate Tribunal (GSTAT)', 'High Court', 'Supreme Court', 'Other court'], 1], ['Case no', 'text', 1], ['Stay', ['Full stay', 'Partial stay', 'No stay'], 1]],
  'Other (Rectification, Revision, Litigation)': [['Type', ['Rectification', 'Revision', 'Litigation', 'Other'], 1], ['Reference no', 'text', 0]],
  'Paid via DRC-03 (not in DCR)': [['ARN', 'text', 1], ['Date', 'date', 1], ['Amount', 'num', 1]]
};
function parseDet(s) { var o = {}; String(s || '').split(';').forEach(function (p) { var i = p.indexOf(':'); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }
function openCatForm(id) {
  var c = caseById(id); if (!c) return; S.cur = c; S.catSel = c.catStatus === 'decide' ? '' : c.cat; S.fld = parseDet(c.catDetails);
  show('sCatForm', { mode: 'bar', t: c.name, s: c.gstin + ' · ₹' + inr(c.pending) });
  $('catErr').textContent = ''; $('catBox').innerHTML = caseBox(c);
  S.catProp = c.catPrev || (c.catStatus === 'confirm' ? c.cat : '');
  $('catCur').classList.toggle('hide', !S.catProp);
  $('catCur').innerHTML = '<div class="hint" style="font-size:12.5px">Proposed by the Division office: <b>' + esc(S.catProp) + '</b>' + (c.catStatus === 'confirm' && c.catDetails ? ' · ' + esc(c.catDetails) : '') + '</div>';
  $('catReason').value = c.catReason || '';
  renderCatForm();
}
function renderCatForm() {
  $('catOpts').innerHTML = S.meta.categories.map(function (k) {
    return '<button class="op' + (S.catSel === k ? ' on' : '') + '" onclick="pickCat(\'' + esc(k) + '\')"><span class="rd"></span><div>' +
      (k === 'Recoverable' ? '<b style="color:#17663A">Recoverable</b>' : esc(k)) + '<small>' + esc(CAT_DESC[k] || '') + '</small></div></button>';
  }).join('');
  var f = CAT_FIELDS[S.catSel], chg = !!S.catProp && !!S.catSel && S.catSel !== S.catProp;
  $('catRsn').classList.toggle('hide', !chg);
  if (chg) $('catRsnT').textContent = 'Reason for change (from ' + (CAT_SHORT[S.catProp] || S.catProp) + ' to ' + (CAT_SHORT[S.catSel] || S.catSel) + ')';
  $('catSave').textContent = chg ? 'Save change' : S.catProp ? 'Confirm category' : 'Save category';
  $('catDet').classList.toggle('hide', !f);
  if (!f) return;
  $('catDetT').textContent = 'Details for ' + (CAT_SHORT[S.catSel] || S.catSel);
  $('catFields').innerHTML = f.map(function (x, i) {
    var v = S.fld[x[0]] || '', inp;
    if (Array.isArray(x[1])) {
      if (x[0] === 'Stay') inp = '<div class="seg">' + x[1].map(function (o) { return '<button class="' + (v === o ? 'on' : '') + '" onclick="readCatFields();S.fld.Stay=\'' + o + '\';renderCatForm()">' + o + '</button>'; }).join('') + '</div>';
      else inp = '<select id="cf' + i + '"><option value="">-- Select --</option>' + x[1].map(function (o) { return '<option' + (v === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
    } else if (x[1] === 'date') inp = '<input id="cf' + i + '" type="date" value="' + esc(v ? v.split('-').reverse().join('-') : '') + '">';
    else inp = '<input id="cf' + i + '" type="text"' + (x[1] === 'num' ? ' inputmode="numeric"' : '') + ' value="' + esc(v) + '">';
    return '<label>' + esc(x[0]) + (x[2] ? '' : ' (optional)') + '</label>' + inp;
  }).join('');
}
function pickCat(k) { readCatFields(); S.catSel = k; renderCatForm(); }
function readCatFields() {
  var f = CAT_FIELDS[S.catSel]; if (!f) return;
  f.forEach(function (x, i) { if (x[0] === 'Stay') return; var e = $('cf' + i); if (!e) return; var v = e.value.trim(); if (x[1] === 'date' && v) v = dmy(v); S.fld[x[0]] = v; });
}
function saveCat() {
  var e = $('catErr'); e.textContent = '';
  if (!S.catSel) { e.textContent = 'Please select a category.'; return; }
  readCatFields();
  var f = CAT_FIELDS[S.catSel] || [], parts = [];
  for (var i = 0; i < f.length; i++) {
    var v = S.fld[f[i][0]] || '';
    if (f[i][2] && !v) { e.textContent = 'Please fill ' + f[i][0] + '.'; return; }
    if (f[i][1] === 'num' && v && !isNum(v.replace(/,/g, ''))) { e.textContent = f[i][0] + ' must be a number.'; return; }
    if (v) parts.push(f[i][0] + ': ' + v);
  }
  var reason = $('catReason').value.trim(), chg = !!S.catProp && S.catSel !== S.catProp;
  if (chg && reason.length < 5) { e.textContent = 'Please write the reason for changing the category.'; $('catReason').focus(); return; }
  busy(true);
  api('saveCategory', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: S.cur.demandId, category: S.catSel, details: parts.join('; '), reason: chg ? reason : '' })
    .then(function (n) { busy(false); replaceCase(n); toast('Category saved ✓'); goBack(); })
    .catch(function (err) { busy(false); e.textContent = err; });
}

/* ---------------- ledger ---------------- */
var GROUPS = { A: ['LA', 'Adjustable now'], P: ['LP', 'PMT-09 needed'], C: ['LC', 'Credit only · demand is int./penalty'],
  B: ['LB', 'Break-up needed'], N: ['LN', 'No balance'], U: ['LU', 'Not checked'] };
function ledgerCalc(o) {
  var bal = Math.max(0, Number(o.balance) || 0);
  if ((o.cash === '' || o.cash == null) && (o.credit === '' || o.credit == null)) return { group: 'U', adjustable: 0, fromCash: 0, fromCredit: 0, wrong: 0, taxDue: null };
  var cash = Number(o.cash) || 0, credit = Number(o.credit) || 0;
  var has = [o.tax, o.interest, o.penalty].some(function (x) { return x !== '' && x != null; });
  var ok = o.cashHead !== 'No';
  var fromCash = ok ? Math.min(cash, bal) : 0, wrong = ok ? 0 : Math.min(cash, bal);
  var rem = bal - fromCash, taxDue = has ? Math.max(0, Math.min(Number(o.tax) || 0, rem)) : null;
  var fromCredit = taxDue === null ? 0 : Math.min(credit, taxDue), adj = fromCash + fromCredit;
  var group = adj > 0 ? 'A' : wrong > 0 ? 'P' : (credit > 0 && taxDue === null) ? 'B' : credit > 0 ? 'C' : 'N';
  return { group: group, adjustable: adj, fromCash: fromCash, fromCredit: fromCredit, wrong: wrong, taxDue: taxDue, credit: credit, cash: cash };
}
function ledChip(c) { var g = GROUPS[c.ledgerGroup || 'U'] || GROUPS.U; return '<span class="lg ' + g[0] + '">' + g[1] + (c.ledgerGroup === 'A' ? ' ₹' + short(c.adjustable) : '') + '</span>'; }
function ledAge(c) {
  if (!c.ledgerOn) return '<b style="color:#C33441">never checked</b>';
  var d = daysAgo(c.ledgerOn);
  if (d === 0) return 'checked today'; if (d >= S.meta.freshDays) return '<b style="color:#C33441">not checked ' + d + ' days</b>';
  return 'last: ' + dmy(c.ledgerOn).slice(0, 5);
}
function openLedger() { show('sLedger', { mode: 'bar', t: 'Ledger Balance', s: 'Daily check · ' + dmy(S.d.today) }); renderLedger(); }
function renderLedger() {
  tySeg('sLedger', work(), 'renderLedger', function (c) { return !checkedToday(c); });
  var w = work().filter(tyOk), done = w.filter(checkedToday).length, adj = w.filter(function (c) { return c.ledgerGroup === 'A'; }).length;
  $('ledPrg').textContent = done + ' of ' + w.length + ' checked today';
  $('ledBar').style.width = (w.length ? Math.round(done * 100 / w.length) : 0) + '%';
  var pills = [['todo', 'To check ' + (w.length - done)], ['done', 'Checked today ' + done], ['adj', 'Adjustable ' + adj], ['all', 'All ' + w.length]];
  $('ledPills').innerHTML = pills.map(function (p) { return '<button class="pill' + (S.ledF === p[0] ? ' on' : '') + '" onclick="S.ledF=\'' + p[0] + '\';renderLedger()">' + p[1] + '</button>'; }).join('');
  var q = $('qLed').value.trim().toLowerCase();
  var list = w.filter(function (c) {
    if (S.ledF === 'todo' && checkedToday(c)) return false;
    if (S.ledF === 'done' && !checkedToday(c)) return false;
    if (S.ledF === 'adj' && c.ledgerGroup !== 'A') return false;
    if (q && (c.name + ' ' + c.gstin).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return b.balance - a.balance; });
  $('ledRows').innerHTML = list.length ? list.map(ledRow).join('') : '<div class="empty">' + (S.ledF === 'todo' ? '&#10003; All cases checked today' : 'No cases in this view') + '</div>';
}
function ledRow(c) {
  var id = esc(c.demandId), cash = c.cash === '' ? '' : c.cash, cr = c.credit === '' ? '' : c.credit;
  var btn = checkedToday(c) ? '<button class="mb g" id="lb_' + id + '" onclick="ledSave(\'' + id + '\')">&#10003; Checked</button>'
    : (c.ledgerOn ? '<button class="mb" id="lb_' + id + '" onclick="ledSave(\'' + id + '\')">Same as<br>before</button>' : '<button class="mb f" id="lb_' + id + '" onclick="ledSave(\'' + id + '\')">Save</button>');
  var head = (Number(cash) || 0) > 0 ? '' : ' hide';
  return '<div class="lr" id="lr_' + id + '"><div class="t"><span class="nm" onclick="openCase(\'' + id + '\')">' + esc(c.name) + ' &#8250;' + idLine(c) + '</span><small>Bal &#8377;' + short(c.balance) + '<br>' + ledAge(c) + '</small></div>' +
    '<div class="f"><div><label>Cash (&#8377;)</label><input id="lc_' + id + '" inputmode="numeric" value="' + cash + '" placeholder="0" oninput="ledEdit(\'' + id + '\')"></div>' +
    '<div><label>Credit (&#8377;)</label><input id="ld_' + id + '" inputmode="numeric" value="' + cr + '" placeholder="0" oninput="ledEdit(\'' + id + '\')"></div>' + btn + '</div>' +
    '<div class="hd' + head + '" id="lh_' + id + '">Cash under the same head as demand? <button class="' + (c.cashHead !== 'No' ? 'on' : '') + '" onclick="ledHead(\'' + id + '\',\'Yes\')">Yes</button><button class="' + (c.cashHead === 'No' ? 'on' : '') + '" onclick="ledHead(\'' + id + '\',\'No\')">No – PMT-09</button></div>' +
    '<div class="st">' + (c.ledgerOn ? ledChip(c) : '') + (c.ledgerGroup === 'B' ? '<button class="mb" onclick="openCase(\'' + id + '\')">Enter break-up</button>' : '') + '</div></div>';
}
var LED_HEAD = {};
function ledHead(id, v) { LED_HEAD[id] = v; var b = $('lh_' + id).querySelectorAll('button'); b[0].classList.toggle('on', v === 'Yes'); b[1].classList.toggle('on', v === 'No'); ledEdit(id); }
function ledEdit(id) {
  var cash = $('lc_' + id).value.replace(/[,\s]/g, ''); $('lh_' + id).classList.toggle('hide', !(Number(cash) > 0));
  var b = $('lb_' + id); b.className = 'mb f'; b.innerHTML = 'Save';
}
function ledSave(id) {
  var c = caseById(id), cash = $('lc_' + id).value.replace(/[,\s]/g, ''), cr = $('ld_' + id).value.replace(/[,\s]/g, '');
  if (cash === '') cash = '0'; if (cr === '') cr = '0';
  if (!isNum(cash) || !isNum(cr)) { toast('Please enter numbers only.'); return; }
  var head = LED_HEAD[id] || c.cashHead || 'Yes';
  var b = $('lb_' + id); b.disabled = true; b.innerHTML = '…';
  api('saveLedger', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: id, cash: cash, credit: cr, cashHead: head, reason: c.notAdj })
    .then(function (n) { replaceCase(n); delete LED_HEAD[id]; toast('Saved ✓ ' + (GROUPS[n.ledgerGroup] || GROUPS.U)[1]); var el = $('lr_' + id); if (el) el.outerHTML = ledRow(n); var y = window.scrollY; renderLedger(); window.scrollTo(0, y); })
    .catch(function (e) { b.disabled = false; b.innerHTML = 'Save'; toast(String(e)); });
}

/* ---------------- recovery / actions lists ---------------- */
function openList(mode) {
  S.listMode = mode; S.listF = 'all';
  show('sList', { mode: 'bar', t: mode === 'rec' ? 'Recovery Made' : 'Actions Taken', s: S.unit + ' · ' + S.sto + ' · ' + S.d.monthLabel });
  renderList();
}
function renderList() {
  var mode = S.listMode, base = mode === 'unit' ? S.d.cases : work(), pills;
  tySeg('sList', base, 'renderList', null); var all = base.filter(tyOk);
  if (mode === 'rec') pills = [['all', 'All ' + all.length], ['done', 'Recovered this month ' + all.filter(function (c) { return c.recovered > 0; }).length], ['none', 'No recovery yet']];
  else if (mode === 'act') pills = [['all', 'All ' + all.length], ['none', 'No action this month ' + all.filter(function (c) { return !c.actsMonth; }).length], ['done', 'With actions']];
  else {
    var stos = []; all.forEach(function (c) { if (stos.indexOf(c.sto) < 0) stos.push(c.sto); }); stos.sort();
    pills = [['all', 'All STOs ' + all.length]].concat(stos.map(function (s) { return [s, s]; }));
  }
  if (!pills.some(function (p) { return p[0] === S.listF; })) S.listF = 'all';
  $('listPills').innerHTML = pills.map(function (p) { return '<button class="pill' + (S.listF === p[0] ? ' on' : '') + '" onclick="S.listF=\'' + esc(p[0]) + '\';renderList()">' + esc(p[1]) + '</button>'; }).join('');
  var q = $('qList').value.trim().toLowerCase();
  var list = all.filter(function (c) {
    if (q && (c.name + ' ' + c.gstin + ' ' + c.demandId).toLowerCase().indexOf(q) < 0) return false;
    if (mode === 'rec') { if (S.listF === 'done' && !(c.recovered > 0)) return false; if (S.listF === 'none' && c.recovered > 0) return false; }
    else if (mode === 'act') { if (S.listF === 'done' && !c.actsMonth) return false; if (S.listF === 'none' && c.actsMonth) return false; }
    else if (S.listF !== 'all' && c.sto !== S.listF) return false;
    return true;
  }).sort(function (a, b) { return b.balance - a.balance; });
  $('listRows').innerHTML = list.length ? list.map(function (c) {
    var id = esc(c.demandId), meta, cls, fn;
    if (mode === 'rec') { cls = c.recovered > 0 ? 'g' : ''; meta = c.recovered > 0 ? '<span>' + ic('cash') + ' Recovered &#8377;' + short(c.recovered) + ' this month' + (c.recMode ? ' · ' + esc(c.recMode) : '') + '</span>' : '<span>No recovery this month</span>'; fn = 'openRec'; }
    else if (mode === 'act') {
      cls = c.actsMonth ? 'g' : '';
      var last = c.stepDate || c.spotDate ? ((c.stepDate >= c.spotDate ? stepShort(c.step) + ' · ' + dmy(c.stepDate).slice(0, 5) : 'Spot visit · ' + dmy(c.spotDate).slice(0, 5))) : '';
      meta = '<span>' + ic('gavel') + ' ' + (c.actsMonth ? c.actsMonth + ' action' + (c.actsMonth > 1 ? 's' : '') + ' this month' : 'No action this month') + (last ? ' · last: ' + esc(last) : '') + '</span>'; fn = 'openAct';
    } else { cls = c.cat === 'Recoverable' ? (c.updatedOn && daysAgo(c.updatedOn) < S.meta.freshDays ? 'g' : 'r') : ''; meta = catChip(c.cat || '') + (c.cat === 'Recoverable' ? ledChip(c) : '') + (c.recovered > 0 ? '<span>' + ic('cash') + ' &#8377;' + short(c.recovered) + '</span>' : ''); fn = 'openCase'; }
    return '<div class="cs ' + cls + '" onclick="' + fn + '(\'' + id + '\')"><div class="n">' + esc(c.name) + '</div><div class="gs">' + esc(c.gstin) + (mode === 'unit' ? ' · ' + esc(c.sto) : '') + ' · ' + esc(c.type) + '</div>' + idLine(c) +
      '<div class="amt">&#8377;' + short(c.balance) + '</div><div class="meta">' + meta + '</div></div>';
  }).join('') : '<div class="empty">No cases in this view</div>';
}

/* ---------------- recovery form ---------------- */
/* ---- case identification: Demand ID, order date, tax period, F.Y., section ---- */
function fyOfDate(d, m, y) { y = Number(y); m = Number(m); return m >= 4 ? y + '-' + String(y + 1).slice(-2) : (y - 1) + '-' + String(y).slice(-2); }
function fyOf(c) {
  var t = String(c.taxPeriod || ''), d = t.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/g);
  if (d && d.length) {
    var p = function (x) { var q = x.split(/[-\/.]/); return fyOfDate(q[0], q[1], q[2]); }, a = p(d[0]), b = p(d[d.length - 1]);
    return a === b ? a : a + ' to ' + b;
  }
  var f = t.match(/(\d{4})\s*-\s*(\d{2,4})/); if (f) return f[1] + '-' + f[2].slice(-2);
  return '';
}
function idLine(c) {
  var fy = fyOf(c);
  return '<div class="idl"><b>' + esc(c.demandId) + '</b>' + (c.demandDate ? ' · ' + dmy(c.demandDate) : '') + (fy ? ' · F.Y. ' + esc(fy) : '') + '</div>';
}
function caseBox(c) {
  var fy = fyOf(c), rows = [
    ['Demand ID', '<b class="mono">' + esc(c.demandId) + '</b>'], ['Order date', c.demandDate ? dmy(c.demandDate) : '–'],
    ['Tax period', esc(c.taxPeriod || '–')], ['Year (F.Y.)', esc(fy || '–')],
    ['Section', esc(c.section || '–')], ['Case type', esc(c.type || '–')],
    ['Original demand', '&#8377;' + inr(c.original)], ['Pending demand', '&#8377;' + inr(c.pending)]];
  if (c.tradeName && c.tradeName.toUpperCase() !== String(c.name).toUpperCase()) rows.unshift(['Trade name', esc(c.tradeName)]);
  return '<div class="cbh">' + ic('doc') + ' Check that this is the correct case</div><div class="cbg">' +
    rows.map(function (r) { return '<div' + (r[0] === 'Trade name' ? ' class="w"' : '') + '><span>' + r[0] + '</span>' + r[1] + '</div>'; }).join('') + '</div>';
}
function caseKpis(c) {
  return '<div class="kpi"><span>Balance pending</span><b>&#8377;' + inr(c.balance) + '</b></div>' +
    '<div class="kpi">' + (c.mobile ? '<a href="tel:' + esc(c.mobile) + '"><span>Call taxpayer</span><b>' + ic('phone') + ' ' + esc(c.mobile) + '</b></a>' : '<span>Mobile</span><b>–</b>') + '</div>';
}
function openRec(id) {
  var c = caseById(id); if (!c) return; S.cur = c; S.recMode = '';
  show('sRec', { mode: 'bar', t: c.name, s: c.gstin, k: '<div class="kpi"><span>Balance pending</span><b>&#8377;' + inr(c.balance) + '</b></div><div class="kpi"><span>Recovered this month</span><b>&#8377;' + inr(c.recovered) + '</b></div>' });
  ['rAmt', 'rRef', 'rRem'].forEach(function (k) { $(k).value = ''; }); $('rDate').value = todayIso(); $('rDate').max = todayIso(); $('rErr').textContent = '';
  $('recBox').innerHTML = caseBox(c);
  renderModes(); recPreview();
  $('rHist').innerHTML = '<h4><i>' + ic('clock') + '</i>Recoveries recorded</h4><div class="hint">Loading…</div>';
  api('getHistory', S.unit, S.sto, S.pin, id, 'sto').then(function (h) {
    $('rHist').innerHTML = '<h4><i>' + ic('clock') + '</i>Recoveries recorded</h4>' + (h.recoveries.length ? h.recoveries.map(function (r) {
      return '<div class="ev"><i>' + ic('cash') + '</i><div><b>&#8377;' + inr(r.amount) + ' · ' + esc(r.mode) + '</b><small>' + dmy(r.date) + (r.ref ? ' · ' + esc(r.ref) : '') + (r.remarks ? ' · ' + esc(r.remarks) : '') + ' · ' + esc(r.by) + '</small></div></div>';
    }).join('') : '<div class="hint">No recovery recorded yet.</div>');
  }).catch(function () { $('rHist').innerHTML = '<h4><i>' + ic('clock') + '</i>Recoveries recorded</h4><div class="hint">History not available offline.</div>'; });
}
function renderModes() { $('rModes').innerHTML = S.meta.recoveryModes.map(function (m) { return '<button class="chip' + (S.recMode === m ? ' on' : '') + '" onclick="S.recMode=\'' + esc(m) + '\';renderModes()">' + esc(m) + '</button>'; }).join(''); }
function recPreview() {
  var a = Number(numVal('rAmt')) || 0, c = S.cur;
  $('rPrev').innerHTML = '<div class="ln" style="margin:0"><span>New balance after saving</span><b>&#8377;' + inr(Math.max(c.balance - a, 0)) + '</b></div>';
}
function saveRec() {
  var e = $('rErr'), a = numVal('rAmt'); e.textContent = '';
  if (!isNum(a) || !(Number(a) > 0)) { e.textContent = 'Please enter the amount recovered.'; return; }
  if (!$('rDate').value) { e.textContent = 'Please enter the date of recovery.'; return; }
  if (!S.recMode) { e.textContent = 'Please select how it was recovered.'; return; }
  if (S.recMode === 'Other' && !$('rRem').value.trim()) { e.textContent = 'Please describe the mode in Remarks.'; return; }
  if (Number(a) > S.cur.balance && !confirm('Amount is more than balance pending (₹' + inr(S.cur.balance) + '). Save anyway?')) return;
  busy(true);
  api('saveRecovery', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: S.cur.demandId, amount: a, date: $('rDate').value, mode: S.recMode, ref: $('rRef').value, remarks: $('rRem').value })
    .then(function (n) { busy(false); replaceCase(n); toast('Recovery saved ✓'); goBack(); })
    .catch(function (err) { busy(false); e.textContent = err; });
}

/* ---------------- actions form ---------------- */
var ACTIONS = [
  { k: 'spot', t: 'Spot visits', i: ic('pin'), re: /^spot visit$/i }, { k: 'bank', t: 'Bank attachments', i: ic('bank'), re: /bank/i },
  { k: 'stock', t: 'Stock attachments', i: ic('box'), re: /stock/i }, { k: 'itc', t: 'ITC set-off', i: ic('swap'), re: /itc/i },
  { k: 'third', t: 'Third-party attachments', i: ic('users'), re: /third party/i }, { k: 'share', t: 'Share / MF attachments', i: ic('trend'), re: /share|debenture|mutual/i },
  { k: 'rrc', t: 'RRC (other jurisdiction)', i: ic('globe'), re: /rrc|other jurisdiction/i }, { k: 'prop', t: 'Property attachments', i: ic('home'), re: /property|auction/i },
  { k: 'fir', t: 'Police complaints (FIR)', i: ic('siren'), re: /police|fir\b/i }, { k: 'notice', t: 'Notices / reminders', i: ic('mail'), re: /notice|reminder/i },
  { k: 'pay', t: 'Payments by taxpayer', i: ic('card'), re: /payment|drc-03/i }, { k: 'other', t: 'Other actions', i: ic('edit'), re: /./ }
];
function actKey(step) { for (var i = 0; i < ACTIONS.length; i++) if (ACTIONS[i].re.test(step)) return ACTIONS[i].k; return 'other'; }
function actOf(k) { return ACTIONS.find(function (a) { return a.k === k; }); }
function actIcon(step) { return actOf(actKey(step)).i; }
function openAct(id) {
  var c = caseById(id); if (!c) return; S.cur = c; S.actType = '';
  show('sAct', { mode: 'bar', t: c.name, s: c.gstin + ' · ' + c.type, k: caseKpis(c) });
  ['aRef', 'aRem'].forEach(function (k) { $(k).value = ''; }); $('aDate').value = todayIso(); $('aDate').max = todayIso(); $('aErr').textContent = '';
  $('actBox').innerHTML = caseBox(c);
  renderActTypes(); loadActHist(id);
}
function actTypes() { return ['Spot visit'].concat(S.cur.type === 'Cancelled' ? S.meta.stepsCancelled : S.meta.stepsActive); }
function renderActTypes() {
  $('aTypes').innerHTML = actTypes().map(function (t, i) { return '<button class="chip' + (S.actType === t ? ' on' : '') + '" onclick="S.actType=actTypes()[' + i + '];renderActTypes()">' + actIcon(t) + ' ' + esc(stepShort(t)) + '</button>'; }).join('');
}
function histHtml(items, kind) {
  if (!items.length) return '<div class="hint">' + (kind === 'act' ? 'No action recorded yet.' : 'Nothing recorded yet.') + '</div>';
  var out = '', lastM = '';
  items.forEach(function (x) {
    if (x.month !== lastM) { lastM = x.month; out += '<div class="mh">' + (x.month === S.d.month ? 'This month' : monthLabel(x.month)) + '</div>'; }
    out += x.html;
  });
  return out;
}
function monthLabel(k) { var m = String(k).match(/^(\d{4})-(\d{2})$/); return m ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m[2]) - 1] + '-' + m[1] : k; }
function actItems(h) {
  return h.actions.map(function (a) { return { month: a.month, html: '<div class="ev"><i>' + actIcon(a.action) + '</i><div><b>' + esc(stepShort(a.action)) + '</b><small>' + dmy(a.date) + (a.ref ? ' · ' + esc(a.ref) : '') + (a.remarks ? ' · ' + esc(a.remarks) : '') + ' · ' + esc(a.by) + '</small></div></div>' }; });
}
function loadActHist(id) {
  $('aHist').innerHTML = '<div class="hint">Loading…</div>';
  api('getHistory', S.unit, S.sto, S.pin, id, 'sto').then(function (h) { $('aHist').innerHTML = histHtml(actItems(h), 'act'); })
    .catch(function () { $('aHist').innerHTML = '<div class="hint">History not available offline.</div>'; });
}
function saveAct() {
  var e = $('aErr'); e.textContent = '';
  if (!S.actType) { e.textContent = 'Please select the action taken.'; return; }
  if (!$('aDate').value) { e.textContent = 'Please enter the date.'; return; }
  if (/^other/i.test(S.actType) && !$('aRem').value.trim()) { e.textContent = 'Please describe the action in Remarks.'; return; }
  busy(true);
  api('saveAction', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: S.cur.demandId, action: S.actType, date: $('aDate').value, ref: $('aRef').value, remarks: $('aRem').value })
    .then(function (n) { busy(false); var old = caseById(n.demandId); n.actsMonth = (old && old.actsMonth || 0) + 1; var i = S.d.cases.indexOf(old); if (i >= 0) S.d.cases[i] = n; cachePut(); toast('Action added ✓'); goBack(); })
    .catch(function (err) { busy(false); e.textContent = err; });
}

/* ---------------- case summary ---------------- */
function openCase(id, again) {
  var c = caseById(id); if (!c) return; S.cur = c;
  var ro = S.role !== 'sto', head = { mode: 'bar', t: c.name, s: c.gstin + ' · ' + c.type + ' · Sec ' + c.section, k: caseKpis(c) };
  if (again) setHead(head); else show('sCase', head);
  var rec = c.cat === 'Recoverable';
  $('hubCat').classList.toggle('hide', rec);
  $('hubCat').innerHTML = '<b>Category: ' + esc(c.cat || 'Not decided') + '</b>' + esc(c.catDetails || '') + (c.cat ? '' : ' Decide the category in Case Categories.');
  var last = c.stepDate || c.spotDate ? (c.stepDate >= c.spotDate ? stepShort(c.step) + ' · ' + dmy(c.stepDate) : 'Spot visit · ' + dmy(c.spotDate)) : 'No action recorded';
  var card = function (bg, ico, top, main, extra, btn) { return '<div class="hb"><i>' + ico + '</i><div class="x"><span>' + top + '</span><b>' + main + '</b>' + (extra || '') + '</div>' + (btn || '') + '</div>'; };
  $('hubCards').innerHTML = !rec ? '' :
    card('', ic('ledger'), 'Ledger · ' + (c.ledgerOn ? ledAge(c) : 'never checked'), c.ledgerOn ? 'Cash &#8377;' + short(c.cash) + ' · Credit &#8377;' + short(c.credit) : '–', c.ledgerOn ? '<br>' + ledChip(c) : '', '') +
    card('', ic('cash'), 'Recovery · this month', '&#8377;' + inr(c.recovered) + ' recovered', c.recMode ? '<br><span>' + esc(c.recMode) + ' · ' + dmy(c.recDate) + '</span>' : '', ro ? '' : '<button class="mb" onclick="openRec(\'' + esc(c.demandId) + '\')">+ Add</button>') +
    card('', ic('gavel'), 'Actions · ' + (c.actsMonth || 0) + ' this month', esc(last), '', ro ? '' : '<button class="mb" onclick="openAct(\'' + esc(c.demandId) + '\')">+ Add</button>');
  renderHubLedger(); renderHubBrk();
  $('hubInfo').innerHTML = [['Demand ID', esc(c.demandId)], ['Recovery ID', esc(c.recoveryId)], ['Demand order date', dmy(c.demandDate)],
    ['Tax period', esc(c.taxPeriod || '–')], ['Year (F.Y.)', esc(fyOf(c) || '–')], ['Section', esc(c.section || '–')], ['Source of demand', esc(c.source || '–')],
    ['Trade name', esc(c.tradeName || '–')], ['Case type', esc(c.type)], ['Demand status', esc(c.demandStatus)],
    ['Original demand', '&#8377;' + inr(c.original)], ['Pending demand (DCR)', '&#8377;' + inr(c.pending)], ['Recovered this month', '&#8377;' + inr(c.recovered)], ['STO', esc(c.unit) + ' · ' + esc(c.sto)],
    ['Last updated', c.updatedOn ? dmy(c.updatedOn) + ' ' + c.updatedOn.slice(11) + ' · ' + esc(c.updatedBy) : '–']]
    .map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
  $('hubHist').innerHTML = '<div class="hint">Loading…</div>';
  api('getHistory', S.unit, S.role === 'sto' ? S.sto : c.sto, S.pin, c.demandId, S.role === 'sto' ? 'sto' : 'unit').then(function (h) {
    var items = actItems(h).concat(h.recoveries.map(function (r) { return { month: r.month, date: r.date, html: '<div class="ev"><i>' + ic('cash') + '</i><div><b>Recovered &#8377;' + inr(r.amount) + ' · ' + esc(r.mode) + '</b><small>' + dmy(r.date) + (r.ref ? ' · ' + esc(r.ref) : '') + ' · ' + esc(r.by) + '</small></div></div>' }; }));
    h.actions.forEach(function (a, i) { items[i].date = a.date; });
    h.categories.forEach(function (k) { items.push({ month: k.month, date: k.month + '-00', html: '<div class="ev"><i>' + ic('folder') + '</i><div><b>Category: ' + esc(CAT_SHORT[k.category] || k.category) + ' (' + esc(k.how) + ')</b><small>' + esc(k.details || '') + ' ' + esc(k.by) + '</small></div></div>' }); });
    items.sort(function (a, b) { return a.month === b.month ? (b.date || '').localeCompare(a.date || '') : b.month.localeCompare(a.month); });
    $('hubHist').innerHTML = histHtml(items, 'all');
  }).catch(function () { $('hubHist').innerHTML = '<div class="hint">History not available offline.</div>'; });
}
var HUB = {};
function renderHubLedger() {
  var c = S.cur, ro = S.role !== 'sto' || c.cat !== 'Recoverable';
  if (c.cat !== 'Recoverable') { $('hubLedger').classList.add('hide'); return; }
  $('hubLedger').classList.remove('hide');
  HUB = { cash: c.cash === '' ? '' : String(c.cash), credit: c.credit === '' ? '' : String(c.credit), head: c.cashHead || 'Yes', reason: c.notAdj || '' };
  $('hubLedger').innerHTML = '<h4><i>' + ic('ledger') + '</i>Ledger check<em>' + (c.ledgerOn ? ledAge(c).replace(/<[^>]+>/g, '') : 'never checked') + '</em></h4>' +
    (ro ? '<div class="hint">Cash &#8377;' + inr(c.cash) + ' · Credit &#8377;' + inr(c.credit) + (c.notAdj ? '<br>Reason not adjusted: ' + esc(c.notAdj) : '') + '</div><div id="hubRes"></div>' :
    '<div class="row2"><div><label>Cash ledger (all heads)</label><input id="hCash" inputmode="numeric" value="' + HUB.cash + '" placeholder="0" oninput="hubCalc()"></div>' +
    '<div><label>Credit ledger (ITC)</label><input id="hCred" inputmode="numeric" value="' + HUB.credit + '" placeholder="0" oninput="hubCalc()"></div></div>' +
    '<div id="hHeadW"><label>Is the cash under the same head as the demand?</label><div class="seg" id="hHead"><button data-v="Yes" onclick="HUB.head=\'Yes\';hubCalc()">Yes</button><button data-v="No" onclick="HUB.head=\'No\';hubCalc()">No – PMT-09 needed</button></div></div>' +
    '<div id="hubRes"></div><label>If not adjusted, why?</label><select id="hReason"><option value="">— Select reason —</option>' +
    S.meta.notAdjReasons.map(function (r) { return '<option' + (HUB.reason === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select>' +
    '<button class="btn sm" onclick="hubSaveLedger()">Save ledger check</button>');
  hubCalc();
}
function hubCalc() {
  var c = S.cur, ro = S.role !== 'sto';
  var cash = ro ? c.cash : ($('hCash').value.replace(/[,\s]/g, '') || (c.cash === '' && $('hCred').value === '' ? '' : '0'));
  var cred = ro ? c.credit : ($('hCred').value.replace(/[,\s]/g, '') || (cash === '' ? '' : '0'));
  if (!ro) { $('hHeadW').classList.toggle('hide', !(Number(cash) > 0)); [].forEach.call($('hHead').children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === HUB.head); }); }
  var r = ledgerCalc({ balance: c.balance, cash: cash, credit: cred, cashHead: HUB.head, tax: c.tax, interest: c.interest, penalty: c.penalty });
  $('hubRes').innerHTML = resBox(r, c);
}
function resBox(r, c) {
  if (r.group === 'U') return '<div class="res U" style="margin:10px 0 0"><div class="h"><b>Ledger not checked yet</b></div></div>';
  var g = GROUPS[r.group], intPen = (Number(c.interest) || 0) + (Number(c.penalty) || 0), warn = '';
  if (r.group === 'A' && intPen > 0 && r.credit > r.fromCredit) warn = 'Interest + Penalty &#8377;' + inr(intPen) + ' cannot be paid from credit. Ask the taxpayer to pay it in cash.';
  if (r.group === 'P') warn = 'Cash &#8377;' + inr(r.wrong) + ' is under a different head. Ask the taxpayer to transfer it with Form GST PMT-09, then adjust.';
  if (r.group === 'C') warn = 'Credit &#8377;' + inr(r.credit) + ' cannot be used: the pending demand is interest / penalty. Ask for cash payment or use other recovery modes.';
  if (r.group === 'B') warn = 'Enter the demand break-up (Tax / Interest / Penalty) below to know how much credit can be used.';
  if (r.group === 'N') warn = 'No balance in the ledgers. Use other recovery modes.';
  return '<div class="res ' + r.group + '" style="margin:10px 0 0"><div class="h"><b>' + g[1].toUpperCase() + '</b>' + (r.group === 'A' ? '<span class="lg LA">Set off within ' + S.d.setoffDays + ' days</span>' : '') + '</div>' +
    (r.group === 'A' ? '<div class="amt">&#8377;' + inr(r.adjustable) + '</div><div class="ln"><span>From cash ledger</span><b>&#8377;' + inr(r.fromCash) + '</b></div>' +
      '<div class="ln"><span>From credit (against tax only)</span><b>&#8377;' + inr(r.fromCredit) + '</b></div>' : '') + (warn ? '<div class="warn">' + warn + '</div>' : '') + '</div>';
}
function hubSaveLedger() {
  var cash = $('hCash').value.replace(/[,\s]/g, '') || '0', cred = $('hCred').value.replace(/[,\s]/g, '') || '0';
  if (!isNum(cash) || !isNum(cred)) { toast('Please enter numbers only.'); return; }
  busy(true);
  api('saveLedger', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: S.cur.demandId, cash: cash, credit: cred, cashHead: HUB.head, reason: $('hReason').value })
    .then(function (n) { busy(false); replaceCase(n); toast('Ledger saved ✓'); openCase(n.demandId, true); })
    .catch(function (e) { busy(false); toast(String(e)); });
}
function renderHubBrk() {
  var c = S.cur, ro = S.role !== 'sto', has = c.tax !== '' || c.interest !== '' || c.penalty !== '';
  if (c.cat !== 'Recoverable') { $('hubBrk').classList.add('hide'); return; }
  $('hubBrk').classList.remove('hide');
  var v = function (k) { return c[k] === '' ? '' : c[k]; };
  $('hubBrk').innerHTML = '<h4><i>' + ic('list') + '</i>Demand break-up<em>enter once</em></h4>' + (ro ? (has ? '<div class="row3" style="font-size:12.5px;margin-top:6px"><div>Tax<br><b>&#8377;' + short(c.tax) + '</b></div><div>Interest<br><b>&#8377;' + short(c.interest) + '</b></div><div>Penalty<br><b>&#8377;' + short(c.penalty) + '</b></div></div>' : '<div class="hint">Not entered.</div>') :
    '<div class="row3"><div><label>Tax</label><input id="bTax" inputmode="numeric" value="' + v('tax') + '" oninput="brkCheck()"></div><div><label>Interest</label><input id="bInt" inputmode="numeric" value="' + v('interest') + '" oninput="brkCheck()"></div><div><label>Penalty</label><input id="bPen" inputmode="numeric" value="' + v('penalty') + '" oninput="brkCheck()"></div></div>' +
    '<div class="hint" id="bChk"></div><button class="btn sm sec2" onclick="saveBrk()">Save break-up</button>');
  if (!ro) brkCheck();
}
function brkCheck() {
  var t = ['bTax', 'bInt', 'bPen'].reduce(function (a, k) { return a + (Number(numVal(k)) || 0); }, 0), p = S.cur.pending;
  $('bChk').innerHTML = !t ? 'Enter the break-up from the DRC-07 / demand order.' : (Math.abs(t - p) <= 1 ? '<span style="color:#17663A">&#10003; Matches pending demand &#8377;' + inr(p) + '</span>' : 'Total &#8377;' + inr(t) + ' · pending demand (DCR) &#8377;' + inr(p));
}
function saveBrk() {
  var t = numVal('bTax'), i = numVal('bInt'), p = numVal('bPen');
  if ([t, i, p].some(function (x) { return x !== '' && !isNum(x); })) { toast('Please enter numbers only.'); return; }
  busy(true);
  api('saveBreakup', { unit: S.unit, sto: S.sto, pin: S.pin, by: S.by, demandId: S.cur.demandId, tax: t, interest: i, penalty: p })
    .then(function (n) { busy(false); replaceCase(n); toast('Break-up saved ✓'); openCase(n.demandId, true); })
    .catch(function (e) { busy(false); toast(String(e)); });
}

/* ---------------- Unit Head / Admin ---------------- */
var ROLE = 'unit';
function setRole(r) { ROLE = r; [].forEach.call($('roleSeg').children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === r); }); $('ruWrap').classList.toggle('hide', r !== 'unit');
  $('roleName').textContent = { jc: 'Joint Commissioner · Divisional Head', dc: 'Deputy Commissioner · Range Head', unit: 'Unit Head of a Ghatak', admin: 'Division Admin · month control' }[r]; }
function loginRole() {
  var pin = $('rpin').value.trim(), e = $('roleErr'); e.textContent = '';
  if (!pin) { e.textContent = 'Please enter the PIN.'; return; }
  busy(true);
  var u = ROLE === 'unit' ? $('ru').value : ''; if (u) store('ru', u);
  api('checkRole', ROLE, u, '', pin).then(function () { busy(false); S.role = ROLE; S.ownUnit = u; S.unit = u; S.pin = pin; S.offUnit = u || S.offUnit; openOff(); })
    .catch(function (x) { busy(false); e.textContent = x; });
}
function openUnitView() {
  S.listMode = 'unit'; S.listF = 'all';
  show('sList', { mode: 'bar', t: S.unit, s: 'View only · ' + S.d.monthLabel + ' · ' + S.d.cases.length + ' cases' });
  renderList();
}
function openAdmin(info) {
  show('sAdmin', { mode: 'bar', t: 'Month control', s: 'Division Admin · ' + info.monthLabel });
  renderAdmin(info);
}
function renderAdmin(info) {
  $('admMonth').innerHTML = '<h4><i>' + ic('calendar') + '</i>Current month</h4><div style="font-size:13px;margin-top:8px;line-height:1.8">Month: <b>' + esc(info.monthLabel) + '</b> · started ' + esc(info.startedOn) +
    '<br>Cases: <b>' + info.cases + '</b>' + (info.noSto ? '<br><b style="color:#C33441">' + ic('alert') + ' ' + info.noSto + (info.noSto > 1 ? ' cases have' : ' case has') + ' no STO</b> – fill the STO column of the Cases sheet (e.g. STO-1). They are not shown to any STO until then.' : '') + '<br>Category decisions: <b>' + info.done + ' of ' + info.cases + '</b> done' + (info.locked ? '' : ' · ' + info.decide + ' new to decide · ' + info.confirm + ' to confirm') + '</div>';
  $('admLockBox').innerHTML = info.locked ? '<div class="ban ok"><b>' + ic('lock') + ' Categories locked for ' + esc(info.monthLabel) + '</b>Locked on ' + esc(info.lockedOn) + '. STOs now see categories as final.</div>' :
    '<div style="margin:10px 14px 0"><button class="btn" style="margin:0" onclick="lockNow()">' + ic('lock') + ' Lock categories for ' + esc(info.monthLabel) +
    '<br><small style="font-weight:400;font-size:11px;opacity:.85">' + (info.decide + info.confirm ? (info.decide + info.confirm) + ' decisions still pending with STOs · they keep the proposed category' : 'All STOs have decided') + (info.changed ? ' · ' + info.changed + ' changed by STOs' : '') + '</small></button></div>';
}
function lockNow() {
  if (!confirm('Lock categories now? Undecided cases will be treated as Recoverable and STOs cannot change categories this month.')) return;
  busy(true);
  api('lockMonth', S.pin).then(function (info) { busy(false); toast('Locked ✓'); renderAdmin(info); }).catch(function (e) { busy(false); toast(String(e)); });
}
function admViewUnit() {
  var u = $('admUnit').value; busy(true);
  api('getCases', u, 'ALL', S.pin, 'admin').then(function (d) { busy(false); S.unit = u; S.d = d; openUnitView(); }).catch(function (e) { busy(false); toast(String(e)); });
}
function exportCsv(kind) {
  busy(true);
  api('exportRows', S.pin, kind).then(function (r) {
    busy(false);
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var csv = '﻿' + [r.headers].concat(r.rows).map(function (row) { return row.map(q).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = r.name.replace(/[^\w-]+/g, '_') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    toast(r.rows.length + ' rows downloaded ✓');
  }).catch(function (e) { busy(false); toast(String(e)); });
}

/* ---------------- dashboard ---------------- */
function openDash() {
  R.tab = R.tab || 'ov';
  show('sDash', { mode: 'bar', ic: 1, t: 'Dashboard', s: (S.meta ? S.meta.division : '') + ' · public view' });
  var rep = null; try { rep = JSON.parse(recall('report') || 'null'); } catch (e) {}
  if (rep && (!R.data || R.data.month === rep.month)) { R.data = rep; renderReport(); }
  loadReport(R.data && !R.data.isCurrent ? R.data.month : '');   // current month view always follows the latest month
}
function loadReport(month) {
  if (!R.data) busy(true); else { $('dSync').textContent = 'Refreshing…'; $('dSync').classList.remove('hide'); }
  api('getReport', month || '').then(function (r) {
    busy(false); $('dSync').classList.add('hide'); R.data = r; if (r.isCurrent) store('report', JSON.stringify(r)); renderReport();
  }).catch(function (e) { busy(false); $('dSync').textContent = R.data ? 'Could not refresh – showing saved figures.' : String(e); $('dSync').classList.remove('hide'); });
}
function setTab(t) { R.tab = t; window.scrollTo(0, 0); renderReport(); }
function setR(k, v) { R[k] = v; renderReport(); }
function pick(r, type) {
  type = type || R.type;
  if (type === 'A') return Object.assign({}, r.A); if (type === 'C') return Object.assign({}, r.C);
  var o = {}; Object.keys(r.A).forEach(function (k) { o[k] = (typeof r.A[k] === 'number') ? r.A[k] + r.C[k] : (r.A[k] > r.C[k] ? r.A[k] : r.C[k]); }); return o;
}
function rowsF(rows, unit) { unit = unit || R.unit; return rows.filter(function (r) { return unit === 'all' || r.unit === unit; }); }
function totals(rows, unit, type) {
  var G = { cases: 0, pending: 0, recovered: 0, updated: 0, ledgerToday: 0, actions: 0, adjustable: 0, avail: 0, overdue: 0, overdueAmt: 0, adjustedLedger: 0, notChecked: 0, gA: 0, gP: 0, gC: 0, gB: 0, gN: 0, gU: 0 };
  rowsF(rows, unit).forEach(function (r) { var f = pick(r, type); for (var k in G) G[k] += f[k] || 0; });
  return G;
}
function unitsOf(rows) { var u = []; rows.forEach(function (r) { if (u.indexOf(r.unit) < 0) u.push(r.unit); }); return u; }
function renderReport() {
  var d = R.data; if (!d) return;
  $('dMonth').innerHTML = d.months.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === d.month ? ' selected' : '') + '>' + m[1] + (m[0] === d.month && d.isCurrent ? '' : '') + '</option>'; }).join('');
  var units = unitsOf(d.rows);
  if (R.unit !== 'all' && units.indexOf(R.unit) < 0) R.unit = 'all';
  $('dUnit').innerHTML = '<option value="all">All Units</option>' + units.map(function (u) { return '<option' + (R.unit === u ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('');
  $('dType').value = R.type;
  [].forEach.call($('dTabs').children, function (b) { b.classList.toggle('on', b.getAttribute('data-t') === R.tab); });
  $('dAsOn').textContent = (d.isCurrent ? 'As on ' + d.asOn : d.monthLabel + ' (closed month)') + ' · Target = ' + d.targetPct + '% of pending demand of Recoverable cases';
  var f = { ov: renderOverview, rec: renderRecovery, act: renderActions, led: renderLedgerTab, cat: renderCatTab }[R.tab];
  $('dBody').innerHTML = f();
}
function pctOf(r) { var t = r.pending * R.data.targetPct / 100; return t ? r.recovered / t : 0; }
function renderOverview() {
  var d = R.data, G = totals(d.rows), tgt = G.pending * d.targetPct / 100, p = tgt ? G.recovered / tgt : 0, html = '';
  var scope = (R.unit === 'all' ? 'Division' : R.unit) + (R.type === 'all' ? '' : R.type === 'A' ? ' · Active' : ' · Cancelled');
  html += '<div class="hl">' + ringSvg(p, 58) + '<div><span>Recovered in ' + esc(d.monthLabel) + ' · ' + esc(scope) + '</span><b>&#8377;' + short(G.recovered) + '</b><span>of &#8377;' + short(tgt) + ' target · ' + (p * 100).toFixed(1) + '%</span></div></div>';
  html += somCard();
  html += '<div class="kgrid">';
  if (d.isCurrent) {
    html += '<div class="kb"><span>Cases updated (last ' + d.freshDays + ' days)</span><b>' + G.updated + ' / ' + G.cases + '</b></div>' +
      '<div class="kb"><span>Ledgers checked today</span><b>' + G.ledgerToday + ' / ' + G.cases + '</b></div>';
  } else html += '<div class="kb"><span>Recoverable cases</span><b>' + G.cases + '</b></div><div class="kb"><span>Pending demand</span><b>&#8377;' + short(G.pending) + '</b></div>';
  html += '<div class="kb"><span>Actions this month</span><b>' + G.actions + '</b></div>';
  if (d.isCurrent && !d.locked) {
    var pend = 0; rowsF(d.rows).forEach(function (r) { pend += r.decide + r.confirm; });
    html += '<div class="kb"><span>Category decisions pending</span><b style="color:' + (pend ? '#C33441' : '#17663A') + '">' + pend + '</b></div>';
  } else html += '<div class="kb"><span>Adjustable in ledgers</span><b>&#8377;' + short(G.adjustable) + '</b></div>';
  html += '</div>' + perfChart();
  if (d.isCurrent) {
    var noUp = rowsF(d.rows).filter(function (r) { var f = pick(r); return f.cases > 0 && f.updated === 0; });
    var od = rowsF(d.rows).map(function (r) { var f = pick(r); return { r: r, n: f.overdue, a: f.overdueAmt }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.a - a.a; });
    var odAmt = od.reduce(function (a, x) { return a + x.a; }, 0), odN = od.reduce(function (a, x) { return a + x.n; }, 0);
    var any = noUp.length || od.length;
    html += '<div class="al' + (any ? '' : ' okk') + '"><h5>' + (any ? ic('alert') + ' Needs attention' : ic('check') + ' Nothing needs attention') + '</h5>' +
      '<div class="ai"><span class="dot r"></span><span>STOs with no update in ' + d.freshDays + ' days<small>' + (noUp.length ? noUp.slice(0, 8).map(function (r) { return shortU(r.unit) + ' ' + r.sto; }).join(' · ') + (noUp.length > 8 ? ' · +' + (noUp.length - 8) : '') : 'All STOs updated') + '</small></span><b>' + noUp.length + '</b></div>' +
      '<div class="ai"><span class="dot a"></span><span>Ledger adjustable, not set off ' + d.setoffDays + '+ days<small>' + (od.length ? odN + ' cases · ' + od.slice(0, 6).map(function (x) { return shortU(x.r.unit) + ' ' + x.r.sto; }).join(' · ') : 'None') + '</small></span><b>&#8377;' + short(odAmt) + '</b></div></div>';
  }
  var list = rowsF(d.rows).map(function (r) { var f = pick(r); f.unit = r.unit; f.sto = r.sto; f.p = pctOf(f); return f; }).filter(function (f) { return f.cases > 0; })
    .sort(function (a, b) { return b.p - a.p || b.recovered - a.recovered; });
  var medal = [1, 2, 3], shown = R.showAll ? list : list.slice(0, 10);
  html += '<div class="rk"><h4>' + ic('trophy') + ' STO ranking · % of target (' + esc(d.monthLabel) + ')</h4>' + shown.map(function (f, i) {
    var m = i < 3 && f.recovered > 0;
    return '<div class="rr"><span class="no2">' + (m ? '<span class="md md' + medal[i] + '">' + medal[i] + '</span>' : i + 1) + '</span><span class="nm">' + shortU(f.unit) + ' · ' + esc(f.sto) + '</span><div class="bar"><i style="width:' + Math.min(100, f.p * 100).toFixed(0) + '%"></i></div><span class="p">' + (f.p * 100).toFixed(1) + '%</span></div>';
  }).join('') + (list.length > 10 ? '<button class="lnk" onclick="R.showAll=!R.showAll;renderReport()">' + (R.showAll ? 'Show top 10' : 'View all ' + list.length + ' STOs ›') + '</button>' : '') + '</div>';
  if (R.unit === 'all') {
    var us = unitsOf(d.rows).map(function (u) { var G2 = totals(d.rows, u); return { u: u, p: pctOf(G2), rec: G2.recovered, n: G2.cases }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.p - a.p; });
    html += '<div class="rk"><h4>' + ic('building') + ' Units · % of target</h4>' + us.map(function (x) {
      return '<div class="rr"><span class="nm" style="width:130px">' + esc(x.u) + '</span><div class="bar"><i style="width:' + Math.min(100, x.p * 100).toFixed(0) + '%"></i></div><span class="p">' + (x.p * 100).toFixed(1) + '%</span></div>';
    }).join('') + '</div>';
  }
  html += '<button class="share" onclick="shareSummary()">' + ic('share') + ' Share summary (WhatsApp)</button><button class="lnk" onclick="window.print()">' + ic('print') + ' Print / Save as PDF</button>';
  return html;
}
/* ---------- STO ranking (division, Active + Cancelled, Recoverable cases) ---------- */
function stoRank(rep) {
  var tp = Number(rep.targetPct) || 0;
  return rep.rows.map(function (r) {
    var pend = r.A.pending + r.C.pending, rec = r.A.recovered + r.C.recovered, tg = pend * tp / 100;
    return { unit: r.unit, sto: r.sto, cases: r.A.cases + r.C.cases, pending: pend, recovered: rec, target: tg, actions: r.A.actions + r.C.actions,
      pct: tg ? rec * 100 / tg : 0, name: (rep.names || {})[r.unit + '|' + r.sto] || '' };
  }).filter(function (x) { return x.cases > 0; }).sort(function (a, b) { return b.pct - a.pct || b.recovered - a.recovered; });
}
var TROPHY = '<svg viewBox="0 0 64 64" class="tro"><defs><linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6A0"/><stop offset=".55" stop-color="#E2B04E"/><stop offset="1" stop-color="#A8771E"/></linearGradient></defs>' +
  '<path d="M20 10h24v14a12 12 0 0 1-24 0z" fill="url(#tG)"/><path d="M20 14h-8v4a9 9 0 0 0 9 9M44 14h8v4a9 9 0 0 1-9 9" fill="none" stroke="url(#tG)" stroke-width="3.4" stroke-linecap="round"/>' +
  '<path d="M28 35h8v8h-8z" fill="url(#tG)"/><rect x="21" y="43" width="22" height="7" rx="2" fill="url(#tG)"/><rect x="17" y="50" width="30" height="5" rx="2" fill="url(#tG)"/>' +
  '<path d="M32 15.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z" fill="#0B2470" opacity=".75"/></svg>';
function byAmt(rep) { return stoRank(rep).filter(function (x) { return x.recovered > 0; }).sort(function (a, b) { return b.recovered - a.recovered; }); }
function somCard() {
  var d = R.data, top, label, live = false;
  if (!d.isCurrent) { top = byAmt(d).slice(0, 3); label = d.monthLabel; }
  else if (d.som && d.som.top && d.som.top.length) { top = d.som.top; label = d.som.monthLabel; }
  var lead = d.isCurrent ? byAmt(d)[0] : null;
  if (!top || !top.length) {
    if (!lead) return '';
    top = [lead]; label = d.monthLabel; live = true;
  }
  var w = top[0], who = function (x) { return esc(x.sto) + ' · ' + esc(x.unit); };
  var h = '<div class="som' + (live ? ' live' : '') + '"><div class="somT">' + TROPHY + '<div><span class="somK">' + (live ? 'Race for STO of the Month · ' : 'STO of the Month · ') + esc(label) + '</span>' +
    '<b class="somN">' + who(w) + '</b>' + (w.name ? '<span class="somP">' + esc(w.name) + '</span>' : '') + '</div></div>' +
    '<div class="somS"><div class="big"><b>&#8377;' + short(w.recovered) + '</b><span>amount recovered</span></div><div><b>' + (w.actions || 0) + '</b><span>actions</span></div><div><b>' + (w.cases || 0) + '</b><span>cases</span></div></div>';
  if (live) h += '<div class="somF">Leading so far · the STO of the Month is announced when ' + esc(label) + ' closes</div>';
  else {
    if (top.length > 1) h += '<div class="somR">' + top.slice(1).map(function (x, i) { return '<span><i class="md md' + (i + 2) + '">' + (i + 2) + '</i>' + who(x) + ' · <b>&#8377;' + short(x.recovered) + '</b></span>'; }).join('') + '</div>';
    if (lead && d.isCurrent) h += '<div class="somF">' + esc(d.monthLabel) + ' race · leading now: <b>' + who(lead) + '</b> (&#8377;' + short(lead.recovered) + ')</div>';
  }
  return h + '</div>';
}
/* Performance comparison: Units (or STOs of the selected Unit) – Recovery / Ledgers / Actions */
function perfChart() {
  var d = R.data, byUnit = R.unit === 'all', pm = R.pm || 'rec';
  var items = byUnit
    ? unitsOf(d.rows).map(function (u) { var g = totals(d.rows, u); g.lab = shortU(u); g.full = u; return g; })
    : rowsF(d.rows).map(function (r) { var g = pick(r); g.lab = r.sto.replace('STO-', 'STO '); g.full = r.unit + ' · ' + r.sto; return g; });
  items = items.filter(function (g) { return g.cases > 0; });
  items.forEach(function (g) {
    var chk = d.isCurrent ? g.cases - g.notChecked : g.cases - g.gU, tg = g.pending * d.targetPct / 100;
    if (pm === 'rec') { g.v = g.recovered; g.top = '&#8377;' + short(g.recovered); g.sub = (tg ? (g.recovered * 100 / tg).toFixed(1) : '0.0') + '% of target'; }
    else if (pm === 'led') { g.v = g.cases ? chk / g.cases : 0; g.top = Math.round(g.v * 100) + '%'; g.sub = chk + ' / ' + g.cases + ' cases'; }
    else { g.v = g.actions; g.top = String(g.actions); g.sub = (g.cases ? (g.actions / g.cases).toFixed(1) : '0') + ' per case'; }
  });
  items.sort(function (a, b) { return b.v - a.v; });
  var n = Math.max(items.length, 1), W = 340, H = 214, L = 8, T = 26, B = 46, cw = (W - L * 2) / n, bw = Math.min(38, cw * 0.56);
  var max = Math.max.apply(null, items.map(function (g) { return g.v; }).concat([pm === 'led' ? 1 : 0, 1e-9]));
  var y = function (v) { return T + (H - T - B) * (1 - v / max); }, base = H - B;
  var svg = '<defs><linearGradient id="pbN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A4FB8"/><stop offset="1" stop-color="#0B2470"/></linearGradient>' +
    '<linearGradient id="pbG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D27A"/><stop offset="1" stop-color="#C9993F"/></linearGradient></defs>';
  for (var k = 1; k <= 3; k++) { var gy = (T + (base - T) * k / 4).toFixed(1); svg += '<line x1="' + L + '" x2="' + (W - L) + '" y1="' + gy + '" y2="' + gy + '" stroke="#EFEAE0" stroke-dasharray="3 3"/>'; }
  svg += '<line x1="' + L + '" x2="' + (W - L) + '" y1="' + base + '" y2="' + base + '" stroke="#D9CFB8"/>';
  items.forEach(function (g, i) {
    var cx = L + cw * i + cw / 2, h = Math.max(base - y(g.v), g.v > 0 ? 3 : 0), first = i === 0 && g.v > 0;
    svg += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="5" fill="url(#' + (first ? 'pbG' : 'pbN') + ')"><title>' + esc(g.full) + '</title></rect>' +
      '<text x="' + cx.toFixed(1) + '" y="' + (base - h - 6).toFixed(1) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + (first ? '#9A6B18' : '#0B2160') + '">' + g.top + '</text>' +
      '<text x="' + cx.toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0B2160">' + esc(g.lab) + '</text>' +
      '<text x="' + cx.toFixed(1) + '" y="' + (base + 28) + '" text-anchor="middle" font-size="8.2" fill="#8A8676">' + g.sub.replace(' cases', '').replace('% of target', '%') + '</text>';
  });
  var M = { rec: ['Recovery made', 'Amount recovered in ' + esc(d.monthLabel) + ' · small figure = % of target'],
            led: ['Ledgers checked', (d.isCurrent ? 'Recoverable cases with ledger checked in the last ' + d.freshDays + ' days' : 'Recoverable cases with ledger status') + ' · small figure = checked / cases'],
            act: ['Actions taken', 'Actions recorded in ' + esc(d.monthLabel) + ' · small figure = actions per case'] };
  var seg = [['rec', 'Recovery'], ['led', 'Ledgers'], ['act', 'Actions']].map(function (x) { return '<button class="' + (pm === x[0] ? 'on' : '') + '" onclick="setR(\'pm\',\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('');
  return '<div class="chart pc"><div class="pch"><h4>' + ic('chart') + ' ' + (byUnit ? 'Unit-wise' : esc(R.unit) + ' · STO-wise') + ' performance</h4></div>' +
    '<div class="seg pcs">' + seg + '</div><div class="pcm"><b>' + M[pm][0] + '</b> · ' + M[pm][1] + '</div>' +
    (items.length ? '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '">' + svg + '</svg>' : '<div class="empty">No cases</div>') +
    '<div class="pcl"><span><i class="g"></i>Highest</span><span><i class="n"></i>' + (byUnit ? 'Other Units' : 'Other STOs') + '</span>' + (byUnit ? '<span class="tip">Select a Unit above to compare its STOs</span>' : '') + '</div></div>';
}
function trendChart(tgt) {
  var d = R.data, m = d.month.split('-'), days = new Date(Number(m[0]), Number(m[1]), 0).getDate();
  var daily = {}; d.trend.forEach(function (t) { if ((R.unit === 'all' || t[0] === R.unit) && (R.type === 'all' || t[1] === R.type)) { var dd = Number(t[2].slice(8, 10)); if (t[2].slice(0, 7) === d.month) daily[dd] = (daily[dd] || 0) + Number(t[3]); } });
  var upto = d.isCurrent ? Number(d.today.slice(8, 10)) : days, cum = 0, pts = [], max = Math.max(tgt, 1);
  for (var i = 1; i <= upto; i++) { cum += daily[i] || 0; pts.push([i, cum]); }
  max = Math.max(max, cum) * 1.08;
  var W = 320, H = 150, x = function (v) { return 26 + (v - 1) * (W - 34) / Math.max(days - 1, 1); }, y = function (v) { return 10 + (H - 32) * (1 - v / max); };
  var grid = '', step = max / 4;
  for (var g = 0; g <= 4; g++) { var gv = step * g; grid += '<line x1="26" x2="' + (W - 6) + '" y1="' + y(gv).toFixed(1) + '" y2="' + y(gv).toFixed(1) + '" stroke="#EEE"/><text x="0" y="' + (y(gv) + 3).toFixed(1) + '" font-size="8" fill="#999">' + (gv >= 1e7 ? (gv / 1e7).toFixed(1) + 'Cr' : (gv / 1e5).toFixed(0) + 'L') + '</text>'; }
  var line = pts.map(function (p) { return x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1); }).join(' ');
  var lp = pts[pts.length - 1] || [1, 0];
  return '<div class="chart"><h4>Recovery in ' + esc(d.monthLabel) + ' vs target</h4><svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" style="margin-top:6px">' + grid +
    '<line x1="' + x(1) + '" y1="' + y(0) + '" x2="' + x(days) + '" y2="' + y(tgt) + '" stroke="#C9993F" stroke-width="2" stroke-dasharray="5 4"/>' +
    '<text x="' + (x(days) - 70) + '" y="' + (y(tgt) - 5) + '" font-size="9" fill="#A87A22" font-weight="700">Target &#8377;' + short(tgt) + '</text>' +
    (pts.length > 1 ? '<polyline points="' + line + '" fill="none" stroke="#0B2470" stroke-width="2.5" stroke-linejoin="round"/>' : '') +
    '<circle cx="' + x(lp[0]).toFixed(1) + '" cy="' + y(lp[1]).toFixed(1) + '" r="3.5" fill="#0B2470"/>' +
    '<text x="' + Math.min(x(lp[0]) - 20, W - 90).toFixed(1) + '" y="' + (y(lp[1]) - 8).toFixed(1) + '" font-size="9" fill="#0B2160" font-weight="700">&#8377;' + short(lp[1]) + '</text>' +
    '<text x="' + x(1) + '" y="' + (H - 6) + '" font-size="8" fill="#999">1</text><text x="' + (x(Math.ceil(days / 2)) - 4) + '" y="' + (H - 6) + '" font-size="8" fill="#999">' + Math.ceil(days / 2) + '</text><text x="' + (x(days) - 8) + '" y="' + (H - 6) + '" font-size="8" fill="#999">' + days + '</text></svg></div>';
}
function shareSummary() {
  var d = R.data, G = totals(d.rows), tgt = G.pending * d.targetPct / 100, p = tgt ? G.recovered * 100 / tgt : 0;
  var lines = ['*Recovery Progress – ' + (R.unit === 'all' ? d.division : R.unit) + '*', d.monthLabel + (d.isCurrent ? ' · as on ' + d.asOn : ''), '',
    'Recovered: ₹' + short(G.recovered) + ' of ₹' + short(tgt) + ' target (' + p.toFixed(1) + '%)'];
  if (d.isCurrent) lines.push('Cases updated (' + d.freshDays + ' days): ' + G.updated + '/' + G.cases, 'Ledgers checked today: ' + G.ledgerToday + '/' + G.cases);
  lines.push('Actions this month: ' + G.actions);
  if (R.unit === 'all') {
    lines.push('', '*Unit-wise*');
    unitsOf(d.rows).forEach(function (u) { var G2 = totals(d.rows, u); if (G2.cases) lines.push(u + ': ₹' + short(G2.recovered) + ' (' + (pctOf(G2) * 100).toFixed(1) + '%)'); });
  }
  lines.push('', '_STO Recovery App_');
  var text = lines.join('\n');
  if (navigator.share) navigator.share({ text: text }).catch(function () {});
  else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}
function typeName() { return R.type === 'A' ? 'Active cases' : R.type === 'C' ? 'Cancelled cases' : 'All cases'; }
function renderRecovery() {
  var d = R.data, html = '<div class="pills"><button class="pill sub2' + (R.recView === 'unit' ? ' on' : '') + '" onclick="setR(\'recView\',\'unit\')">By Unit</button><button class="pill sub2' + (R.recView === 'rank' ? ' on' : '') + '" onclick="setR(\'recView\',\'rank\')">' + ic('trophy') + ' STO ranking</button></div>';
  var rows = rowsF(d.rows).map(function (r) { var f = pick(r); f.unit = r.unit; f.sto = r.sto; f.target = f.pending * d.targetPct / 100; f.p = f.target ? f.recovered / f.target : 0; return f; });
  if (R.recView === 'rank') {
    html += rows.filter(function (r) { return r.cases > 0; }).sort(function (a, b) { return b.p - a.p || b.recovered - a.recovered; }).map(function (r, i) {
      return '<div class="rk" style="margin-top:8px;display:flex;gap:10px;align-items:center"><b style="width:26px;text-align:center;color:var(--ind)">' + (i + 1) + '</b><div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(r.unit) + ' · ' + esc(r.sto) + '</b><div class="hint" style="margin:1px 0 0">&#8377;' + short(r.recovered) + ' of &#8377;' + short(r.target) + ' · ' + r.cases + ' cases</div><div class="bar"><i style="width:' + Math.min(100, r.p * 100).toFixed(0) + '%"></i></div></div><b style="color:var(--ind3)">' + (r.p * 100).toFixed(1) + '%</b></div>';
    }).join('');
  } else {
    unitsOf(rows).forEach(function (u) {
      var T = { cases: 0, pending: 0, recovered: 0, target: 0, updated: 0 };
      html += '<div class="sumcard"><h5>' + esc(u) + ' · ' + typeName() + '</h5><table class="sumt"><tr><th>STO</th><th>Cases</th><th>Balance</th><th>Recovered</th><th>% Target</th>' + (d.isCurrent ? '<th>Updated</th>' : '') + '</tr>';
      rows.filter(function (r) { return r.unit === u; }).forEach(function (r) { html += recLine(r.sto, r); for (var k in T) T[k] += r[k]; });
      html += recLine('Total', T, true) + '</table></div>';
    });
  }
  return html;
}
function recLine(name, r, tot) {
  var p = r.target ? r.recovered / r.target : 0, pu = r.cases ? Math.round(r.updated * 100 / r.cases) : 0, cls = pu >= 75 ? 'ok' : pu < 25 ? 'no' : 'old';
  return '<tr' + (tot ? ' class="tot"' : '') + '><td>' + esc(name) + '</td><td>' + r.cases + '</td><td>' + short(r.pending - r.recovered) + '</td><td>' + short(r.recovered) + '</td>' +
    '<td>' + (r.target ? (p * 100).toFixed(1) + '%' : '-') + '<div class="bar"><i style="width:' + Math.min(100, p * 100).toFixed(0) + '%"></i></div></td>' +
    (R.data.isCurrent ? '<td>' + (r.cases ? '<span class="tg ' + cls + '">' + r.updated + '/' + r.cases + '</span>' : '–') + '</td>' : '') + '</tr>';
}
function renderActions() {
  var d = R.data, from = '';
  if (d.isCurrent && R.per === '7') { var t = new Date(d.today + 'T12:00:00'); t.setDate(t.getDate() - 6); from = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  var html = d.isCurrent ? '<div class="pills"><button class="pill sub2' + (R.per === 'month' ? ' on' : '') + '" onclick="setR(\'per\',\'month\')">Whole ' + esc(d.monthLabel) + '</button><button class="pill sub2' + (R.per === '7' ? ' on' : '') + '" onclick="setR(\'per\',\'7\')">Last 7 days</button></div>' : '';
  var ev = d.events.filter(function (e) { return (R.unit === 'all' || e[0] === R.unit) && (R.type === 'all' || e[2] === R.type) && (!from || e[4] >= from); }).map(function (e) { return { u: e[0], s: e[1], k: actKey(e[3]) }; });
  var cnt = {}; ACTIONS.forEach(function (a) { cnt[a.k] = 0; }); ev.forEach(function (e) { cnt[e.k]++; });
  html += '<div class="tiles"><button class="tile all' + (R.act === 'all' ? ' on' : '') + '" onclick="setR(\'act\',\'all\')"><i>' + ic('bolt') + '</i><b>' + ev.length + '</b><span>All actions</span></button>' +
    ACTIONS.filter(function (a) { return a.k !== 'other' || cnt.other; }).map(function (a) { return '<button class="tile' + (R.act === a.k ? ' on' : '') + (cnt[a.k] ? '' : ' zero') + '" onclick="setR(\'act\',\'' + a.k + '\')"><i>' + a.i + '</i><b>' + cnt[a.k] + '</b><span>' + a.t + '</span></button>'; }).join('') + '</div>';
  html += '<div class="note">Actions recorded in the app (' + typeName().toLowerCase() + '). Each case + action + date is counted once. Tap a tile to see that action STO-wise.</div>';
  var byS = {}; ev.forEach(function (e) { var k = e.u + '|' + e.s; byS[k] = byS[k] || { all: 0 }; byS[k][e.k] = (byS[k][e.k] || 0) + 1; byS[k].all++; });
  var a = R.act === 'all' ? null : actOf(R.act), rows = rowsF(d.rows), max = 0;
  rows.forEach(function (r) { var o = byS[r.unit + '|' + r.sto] || {}; max = Math.max(max, o[R.act] || 0); });
  unitsOf(rows).forEach(function (u) {
    var tot = 0;
    html += '<div class="sumcard"><h5>' + esc(u) + (a ? ' · ' + a.t : ' · All actions') + '</h5><table class="sumt"><tr><th>STO</th><th>' + (a ? 'Count' : 'Actions') + '</th><th style="text-align:left">' + (a ? '' : 'Break-up') + '</th></tr>';
    rows.filter(function (r) { return r.unit === u; }).forEach(function (r) {
      var o = byS[r.unit + '|' + r.sto] || { all: 0 }, n = o[R.act] || 0, third; tot += n;
      if (a) third = '<div class="bar" style="margin:0"><i style="width:' + (max ? Math.round(n * 100 / max) : 0) + '%"></i></div>';
      else third = ACTIONS.filter(function (x) { return o[x.k]; }).sort(function (x, y) { return o[y.k] - o[x.k]; }).map(function (x) { return '<span class="chipx">' + x.i + ' ' + o[x.k] + '</span>'; }).join('') || '<span style="color:#aaa">No action</span>';
      html += '<tr><td>' + esc(r.sto) + '</td><td' + (n ? '' : ' class="zero0"') + '>' + n + '</td><td class="brk">' + third + '</td></tr>';
    });
    html += '<tr class="tot"><td>Total</td><td>' + tot + '</td><td></td></tr></table></div>';
  });
  return html;
}
function renderLedgerTab() {
  var d = R.data, G = totals(d.rows), max = Math.max(G.avail, G.adjustable, 1), html = '';
  if (d.isCurrent) {
    html += '<div class="funnel"><b class="t">Ledger set-off · ' + (R.unit === 'all' ? 'Division' : esc(R.unit)) + '</b>' +
      '<div class="fr"><span>Available in ledgers</span><div class="fb"><i style="width:100%;background:#7F96D6"></i></div><b>&#8377;' + short(G.avail) + '</b></div>' +
      '<div class="fr"><span>Adjustable now</span><div class="fb"><i style="width:' + Math.round(G.adjustable * 100 / max) + '%;background:#7FD39C"></i></div><b>&#8377;' + short(G.adjustable) + '</b></div>' +
      '<div class="fr"><span>Adjusted this month</span><div class="fb"><i style="width:' + Math.min(100, Math.round(G.adjustedLedger * 100 / max)) + '%;background:#C9A46A"></i></div><b>&#8377;' + short(G.adjustedLedger) + '</b></div></div>' +
      '<div class="gt"><div style="border-left-color:#2E9E5B"><b>' + cases(G.gA) + '</b><span><span class="dot g"></span>Adjustable now</span></div><div style="border-left-color:#E0A526"><b>' + cases(G.gP) + '</b><span><span class="dot a"></span>PMT-09 needed</span></div>' +
      '<div style="border-left-color:#D64550"><b>' + cases(G.gC) + '</b><span><span class="dot r"></span>Credit only, int./penalty</span></div><div style="border-left-color:#999"><b>' + cases(G.notChecked) + '</b><span><span class="dot n"></span>Not checked ' + d.freshDays + '+ days</span></div></div>';
  } else html += '<div class="note">' + esc(d.monthLabel) + ' (closed): ledger status at month end. Adjustable &#8377;' + short(G.adjustable) + ' · adjusted via ledger &#8377;' + short(G.adjustedLedger) + '.</div>';
  var rows = rowsF(d.rows);
  unitsOf(rows).forEach(function (u) {
    html += '<div class="sumcard"><h5>' + esc(u) + '</h5><table class="sumt"><tr><th>STO</th>' + (d.isCurrent ? '<th>Checked today</th>' : '') + '<th>Adjustable</th><th>Adjusted</th>' + (d.isCurrent ? '<th>Pending ' + d.setoffDays + '+ days</th>' : '') + '</tr>';
    rows.filter(function (r) { return r.unit === u; }).forEach(function (r) {
      var f = pick(r);
      html += '<tr><td>' + esc(r.sto) + '</td>' + (d.isCurrent ? '<td>' + f.ledgerToday + '/' + f.cases + '</td>' : '') + '<td>' + short(f.adjustable) + '</td><td>' + short(f.adjustedLedger) + '</td>' +
        (d.isCurrent ? '<td' + (f.overdue ? ' class="zero0"' : '') + '>' + (f.overdue ? f.overdue + ' · ' + short(f.overdueAmt) : '0') + '</td>' : '') + '</tr>';
    });
    html += '</table></div>';
  });
  return html;
}
function renderCatTab() {
  var d = R.data, rows = rowsF(d.rows), html = '';
  if (d.isCurrent && !d.locked) {
    var tot = 0, dec = 0, con = 0; rows.forEach(function (r) { tot += r.total; dec += r.decide; con += r.confirm; });
    var done = tot - dec - con;
    html += '<div class="funnel"><b class="t">Category decisions · ' + (R.unit === 'all' ? 'Division' : esc(R.unit)) + '</b>' +
      '<div class="fr"><span>Decided</span><div class="fb"><i style="width:' + (tot ? Math.round(done * 100 / tot) : 0) + '%;background:#7FD39C"></i></div><b>' + done + '/' + tot + '</b></div>' +
      '<div class="fr"><span>New, to decide</span><div class="fb"><i style="width:' + (tot ? Math.round(dec * 100 / tot) : 0) + '%;background:#F28B95"></i></div><b>' + dec + '</b></div>' +
      '<div class="fr"><span>To confirm</span><div class="fb"><i style="width:' + (tot ? Math.round(con * 100 / tot) : 0) + '%;background:#C9A46A"></i></div><b>' + con + '</b></div></div>';
    var pend = rows.filter(function (r) { return r.decide + r.confirm > 0; }).sort(function (a, b) { return (b.decide + b.confirm) - (a.decide + a.confirm); });
    html += '<div class="al' + (pend.length ? '' : ' okk') + '"><h5>' + (pend.length ? ic('clock') + ' STOs with pending category decisions' : ic('check') + ' All STOs have decided') + '</h5>' +
      pend.map(function (r) { return '<div class="ai"><span>' + esc(shortU(r.unit)) + ' · ' + esc(r.sto) + '<small>' + r.decide + ' new · ' + r.confirm + ' to confirm</small></span><b style="color:#C33441">' + (r.decide + r.confirm) + '</b></div>'; }).join('') +
      (pend.length && rows.length > pend.length ? '<div class="ai" style="color:#17663A"><span>' + (rows.length - pend.length) + ' other STOs</span><b>All done</b></div>' : '') + '</div>';
  }
  var cat = {}; d.categories.forEach(function (k) { cat[k] = { n: 0, amt: 0 }; });
  rows.forEach(function (r) { d.categories.forEach(function (k) { cat[k].n += r.cat[k].n; cat[k].amt += r.cat[k].amt; }); });
  html += '<div class="sumcard"><h5>By category · ' + (R.unit === 'all' ? 'Division' : esc(R.unit)) + ' · ' + esc(d.monthLabel) + '</h5><table class="sumt"><tr><th>Category</th><th>Cases</th><th>Amount</th></tr>' +
    d.categories.map(function (k) { return '<tr><td>' + esc(CAT_SHORT[k] || k) + '</td><td>' + cat[k].n + '</td><td>&#8377;' + short(cat[k].amt) + '</td></tr>'; }).join('') + '</table></div>';
  unitsOf(rows).forEach(function (u) {
    html += '<div class="sumcard"><h5>' + esc(u) + '</h5><table class="sumt"><tr><th>STO</th><th>Recov.</th><th>Court</th><th>NCLT</th><th>Other</th><th>DRC-03</th></tr>';
    rows.filter(function (r) { return r.unit === u; }).forEach(function (r) {
      var c = r.cat;
      html += '<tr><td>' + esc(r.sto) + '</td><td>' + c['Recoverable'].n + '</td><td>' + c['Tribunal / HC / SC / Court'].n + '</td><td>' + c['NCLT / Liquidation'].n + '</td><td>' + c['Other (Rectification, Revision, Litigation)'].n + '</td><td>' + c['Paid via DRC-03 (not in DCR)'].n + '</td></tr>';
    });
    html += '</table></div>';
  });
  return html;
}

/* ---------------- install, offline, back button ---------------- */
var deferredPrompt = null;
function isInstalled() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; $('installBox').classList.remove('hide'); $('installBtn').classList.remove('hide'); $('installHint').classList.add('hide'); });
window.addEventListener('appinstalled', function () { deferredPrompt = null; $('installBox').classList.add('hide'); toast('App installed ✓ – open it from your home screen'); });
function installApp() { if (!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; $('installBox').classList.add('hide'); }); }
if (!isInstalled()) setTimeout(function () { if (!deferredPrompt) { $('installBox').classList.remove('hide'); $('installHint').classList.remove('hide'); } }, 2500);
if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
if (window.history && history.pushState) {
  history.pushState({ app: 1 }, '');
  window.addEventListener('popstate', function () {
    if (S.screen !== 'sStart') { goBack(); history.pushState({ app: 1 }, ''); }
    else history.back();
  });
}
init();

/* ================= OFFICERS (JC / DC / Unit Head / Admin) + REVIEW SHEETS ================= */
var ROLE_NAMES = { jc: 'Joint Commissioner', dc: 'Deputy Commissioner', unit: 'Unit Head', admin: 'Division Admin' };
function headDesig(unit, list, heads) { if (list && heads) { var i = list.indexOf(unit); if (i >= 0 && heads[i]) return heads[i]; } var u = (S.meta && S.meta.units || []).find(function (x) { return x.name === unit; }); return (u && u.head) || (/\b(28|29)\b/.test(unit) ? 'State Tax Officer' : 'Assistant Commissioner'); }
function openOff() {
  var r = S.role, sub = { jc: 'Divisional Head', dc: 'Range Head', unit: headDesig(S.ownUnit) + ' · ' + S.ownUnit, admin: S.meta.division }[r] + ' · ' + (S.meta.monthLabel || '');
  S.offHead = { mode: 'bar', t: ROLE_NAMES[r], s: sub };
  show('sOff', S.offHead, { reset: [{ id: 'sRole', head: { mode: 'bar', t: 'Monitoring Officers Login', s: S.meta.division } }] });
  var opts = S.meta.units.map(function (u) { return '<option' + (u.name === (S.offUnit || S.ownUnit) ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
  $('offUnitBox').innerHTML = r === 'unit' ? '' : '<div class="sec"><h4><i>' + ic('building') + '</i>Unit</h4><select id="offUnit" style="margin-top:8px" onchange="S.offUnit=this.value">' + opts + '</select><div class="hint">Used for the Unit Review Sheet and for viewing cases.</div></div>';
  $('offAdmin').classList.toggle('hide', r !== 'admin');
  $('offUnitT').textContent = r === 'unit' ? S.ownUnit + ' · STO-wise' : 'Selected Unit · STO-wise';
}
function offUnit() { return S.role === 'unit' ? S.ownUnit : ($('offUnit') ? $('offUnit').value : S.ownUnit); }
function offViewCases() {
  var u = offUnit(); busy(true);
  api('getCases', u, 'ALL', S.pin, S.role === 'unit' ? 'unit' : S.role).then(function (d) { busy(false); S.unit = u; S.d = d; openUnitView(); }).catch(function (e) { busy(false); toast(String(e)); });
}
function offAdmin() { busy(true); api('adminInfo', S.pin).then(function (info) { busy(false); openAdmin(info); }).catch(function (e) { busy(false); toast(String(e)); }); }

var RV = { fit: true };
function openReview(scope) {
  scope = scope === 'unit' ? offUnit() : 'ALL';
  busy(true);
  api('getReview', S.role, S.ownUnit || '', S.pin, scope).then(function (d) {
    busy(false); RV.d = d; RV.html = scope === 'ALL' ? divSheet(d) : unitSheet(d, scope);
    RV.title = (scope === 'ALL' ? 'Division-Review-Sheet-' + d.division : 'Unit-Review-Sheet-' + scope).replace(/[^\w]+/g, '-') + '-' + d.monthLabel;
    show('sRev', { mode: 'bar', t: scope === 'ALL' ? 'Division Review Sheet' : 'Unit Review Sheet', s: (scope === 'ALL' ? 'Unit-wise · ' : scope + ' · STO-wise · ') + d.monthLabel });
    $('revBody').innerHTML = RV.html; revFit();
  }).catch(function (e) { busy(false); toast(String(e)); });
}
function revFit(toggle) {
  if (toggle) RV.fit = !RV.fit;
  var w = Math.min(window.innerWidth, 560) - 20, z = RV.fit ? Math.min(1, w / 760) : 1;
  $('revBody').style.zoom = z; $('revWrap').style.overflowX = RV.fit ? 'hidden' : 'auto';
  $('revFitBtn').innerHTML = ic(RV.fit ? 'search' : 'list') + (RV.fit ? ' Actual size' : ' Fit to screen');
}
function revPdf() {
  var t = document.title; document.title = RV.title; document.body.classList.add('printing');
  $('revBody').style.zoom = 1;
  setTimeout(function () { window.print(); }, 50);
  var done = function () { document.title = t; document.body.classList.remove('printing'); revFit(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); setTimeout(function () { if (document.body.classList.contains('printing') && !window.matchMedia('print').matches) done(); }, 60000);
}

/* ---- review helpers ---- */
function rvDays(iso, today) { if (!iso) return null; return Math.round((new Date(today + 'T12:00:00') - new Date(iso.slice(0, 10) + 'T12:00:00')) / 864e5); }
function rvP(a, b) { return b ? a * 100 / b : 0; }
function rvR(x) { return '&#8377;' + short(x); }
function rvDmy(iso) { return iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(0, 4) : '–'; }
function rvSum(a, f) { var t = 0; a.forEach(function (x) { t += f(x); }); return t; }
var RV_ACT = [['Spot visit', ['spot']], ['Notice / reminder', ['notice', 'reminder']], ['Bank attachment', ['bank']], ['ITC set-off', ['itc']], ['Third-party attachment', ['third party']],
  ['Stock attachment', ['stock']], ['Share / MF attachment', ['share', 'mutual', 'debenture']], ['Property attachment', ['property', 'auction']], ['RRC (other jurisdiction)', ['rrc', 'other jurisdiction']],
  ['Police complaint (FIR)', ['police', 'fir']], ['Payment by taxpayer', ['payment', 'drc-03']], ['Other', ['']]];
function rvKind(s) { s = String(s).toLowerCase(); for (var i = 0; i < RV_ACT.length; i++) if (RV_ACT[i][1].some(function (k) { return s.indexOf(k) >= 0; })) return RV_ACT[i][0]; return 'Other'; }
var RV_CATS = { 'Recoverable': 'Recoverable', 'Tribunal / HC / SC / Court': 'Tribunal / Court', 'NCLT / Liquidation': 'NCLT / Liquidation', 'Other (Rectification, Revision, Litigation)': 'Other', 'Paid via DRC-03 (not in DCR)': 'Paid via DRC-03' };
function rvSort(a) { return a.slice().sort(function (x, y) { return x.length - y.length || (x < y ? -1 : x > y ? 1 : 0); }); }

/* one Unit (or the Division) computed */
function rvCalc(d, unit) {
  var cs = d.cases.filter(function (c) { return !unit || c.u === unit; });
  var W = cs.filter(function (c) { return c.c === 'Recoverable' && c.s !== 'Not assigned'; });
  var recs = d.recs.filter(function (r) { return !unit || r.u === unit; }), acts = d.acts.filter(function (a) { return !unit || a.u === unit; });
  var acted = {}; acts.forEach(function (a) { acted[a.id] = 1; });
  var o = { all: cs, W: W, recs: recs, acts: acts, acted: acted };
  o.cases = W.length; o.pend = rvSum(W, function (c) { return c.p; }); o.tgt = o.pend * d.targetPct / 100; o.rec = rvSum(recs, function (r) { return r.a; }); o.p = rvP(o.rec, o.tgt);
  o.covn = W.filter(function (c) { return acted[c.id]; }).length; o.cov = rvP(o.covn, o.cases);
  o.upd = W.filter(function (c) { var x = rvDays(c.up, d.today); return x !== null && x < d.freshDays; }).length;
  o.led = W.filter(function (c) { var x = rvDays(c.lo, d.today); return x !== null && x < d.freshDays; }).length;
  o.never = W.filter(function (c) { return !c.lo; }); o.nobrk = W.filter(function (c) { return c.tax === null; });
  o.avail = rvSum(W.filter(function (c) { return c.lo; }), function (c) { return c.cash + c.cr; });
  o.adjA = W.filter(function (c) { return c.lg === 'A'; }); o.adj = rvSum(o.adjA, function (c) { return c.adj; });
  o.od = o.adjA.filter(function (c) { var x = rvDays(c.as, d.today); return x !== null && x >= d.setoffDays; }); o.odamt = rvSum(o.od, function (c) { return c.adj; });
  o.pmt = W.filter(function (c) { return c.lg === 'P'; }); o.adjm = rvSum(recs.filter(function (r) { return /ledger/i.test(r.m); }), function (r) { return r.a; });
  o.unas = cs.filter(function (c) { return c.s === 'Not assigned'; }); o.unasRec = o.unas.filter(function (c) { return c.c === 'Recoverable'; });
  o.stos = rvSort(W.map(function (c) { return c.s; }).filter(function (s, i, a) { return a.indexOf(s) === i; }));
  o.stoNoAct = o.stos.filter(function (s) { return !acts.some(function (a) { return a.s === s; }); });
  o.stoStale = o.stos.filter(function (s) { return !W.some(function (c) { var x = rvDays(c.up, d.today); return c.s === s && x !== null && x < d.freshDays; }); });
  o.act = W.filter(function (c) { return c.t === 'Active'; }); o.can = W.filter(function (c) { return c.t !== 'Active'; });
  return o;
}
function rvLast(c) {
  var a = [[c.sd, c.st], [c.sv, 'Spot visit']].filter(function (x) { return x[0]; }).sort(function (x, y) { return y[0] < x[0] ? -1 : 1; })[0];
  return a ? esc(rvStep(a[1])) + ' · ' + rvDmy(a[0]) : '<span class="mut">No action recorded</span>';
}
function rvStep(s) { s = String(s || ''); if (/notice|reminder/i.test(s)) return 'Notice / reminder'; if (/^other/i.test(s)) return 'Other'; if (/^payment/i.test(s)) return 'Payment by taxpayer'; s = stepShort(s); return s.length > 30 ? s.slice(0, 29) + '…' : s; }
function rvLed(c) {
  if (!c.lo) return '<span class="tg n">Never checked</span>';
  var g = { A: ['g', 'Adjustable ' + rvR(c.adj)], P: ['a', 'PMT-09'], C: ['r', 'Credit only'], B: ['b', 'Break-up needed'], N: ['n', 'No balance'] }[c.lg] || ['n', 'Checked'];
  return '<span class="tg ' + g[0] + '">' + g[1] + '</span>';
}
function rvHead(d, title, sub, right) {
  return '<div class="hd"><img src="logo-badge-sm.png" alt=""><div><h1>' + title + '</h1><div class="s">' + sub + '</div></div><div class="r">' + right + '</div></div>';
}
function rvK(label, val, em, hl) { return '<div class="kb' + (hl ? ' hl' : '') + '"><span>' + label + '</span><b>' + val + '</b>' + (em ? '<em>' + em + '</em>' : '') + '</div>'; }
function rvGlance(d, o) {
  return '<div class="k">' +
    '<div class="kb hx"><span>Recovered in ' + esc(d.monthLabel) + '</span><b>' + rvR(o.rec) + '</b><em>of ' + rvR(o.tgt) + ' target · ' + o.p.toFixed(1) + '%</em><div class="bar"><i style="width:' + Math.min(100, o.p).toFixed(0) + '%"></i></div></div>' +
    rvK('Recoverable cases', o.cases, 'Active ' + o.act.length + ' · Cancelled ' + o.can.length) +
    rvK('Pending demand', rvR(o.pend), 'Active ' + rvR(rvSum(o.act, function (c) { return c.p; })) + ' · Cancelled ' + rvR(rvSum(o.can, function (c) { return c.p; }))) +
    rvK('Target (' + d.targetPct + '% of pending)', rvR(o.tgt), 'Balance to target ' + rvR(Math.max(o.tgt - o.rec, 0))) +
    rvK('Cases updated · last ' + d.freshDays + ' days', o.upd + ' / ' + o.cases, rvP(o.upd, o.cases).toFixed(0) + '%') +
    rvK('Ledgers checked · last ' + d.freshDays + ' days', o.led + ' / ' + o.cases, rvP(o.led, o.cases).toFixed(0) + '%') +
    rvK('Actions this month', o.acts.length, 'on ' + o.covn + ' cases · coverage ' + o.cov.toFixed(0) + '%') +
    rvK('Adjustable in ledgers', rvR(o.adj), o.adjA.length + ' cases · ' + o.od.length + ' pending ' + d.setoffDays + '+ days') + '</div>';
}
function rvH2(l, t, sm, cls) { return '<h2' + (cls ? ' class="' + cls + '"' : '') + '><i>' + l + '</i>' + t + (sm ? ' <small>· ' + sm + '</small>' : '') + '</h2>'; }
function rvRed(cond) { return cond ? ' class="red"' : ''; }
function rvTop(d, list, withUnit, n) {
  var top = list.slice().sort(function (a, b) { return b.p - a.p; }).slice(0, n);
  return { top: top, html: '<table><tr><th>#</th><th class="l">Taxpayer</th><th class="l">' + (withUnit ? 'Unit · STO' : 'STO') + '</th><th class="l">Type</th><th>Pending</th><th class="l">Last action</th><th class="l">Ledger</th><th>Recovered (' + esc(d.monthLabel.slice(0, 3)) + ')</th></tr>' +
    top.map(function (c, i) {
      var rc = rvSum(d.recs.filter(function (r) { return r.id === c.id; }), function (r) { return r.a; });
      return '<tr><td>' + (i + 1) + '</td><td class="l nm">' + esc(c.n) + ' <span class="mut sm">' + esc(c.g) + '</span></td><td class="l">' + (withUnit ? esc(c.u.replace('Ghatak ', 'G-').split(' (')[0]) + ' · ' : '') + esc(c.s) + '</td><td class="l">' + esc(c.t) + '</td><td><b>' + short(c.p) + '</b></td><td class="l">' + rvLast(c) + '</td><td class="l">' + rvLed(c) + '</td><td>' + (rc ? '<span class="grn">' + short(rc) + '</span>' : '<span class="mut">–</span>') + '</td></tr>';
    }).join('') + '</table>' };
}
function rvPts(pts) { return '<div class="pts">' + (pts.map(function (p) { return '<div class="' + p[0] + '">' + p[1] + '</div>'; }).join('') || '<div class="a">Nothing pending.</div>') + '</div>'; }
function rvFoot(d) { return '<div class="ft"><span>Generated by STO Recovery App · Developed by Mehul Ranavasiya</span><span>Target = ' + d.targetPct + '% of pending demand of Recoverable cases · Coverage = cases with at least one action this month</span></div>'; }
function rvCatTable(d, cs) {
  var rows = d.categories.map(function (k) { var x = cs.filter(function (c) { return c.c === k; }); return '<tr><td>' + esc(RV_CATS[k] || k) + '</td><td>' + x.length + '</td><td>' + rvR(rvSum(x, function (c) { return c.p; })) + '</td></tr>'; }).join('');
  var und = cs.filter(function (c) { return !c.c; });
  return '<table><tr><th>Category</th><th>Cases</th><th>Pending</th></tr>' + rows + (und.length ? '<tr><td>Not decided</td><td>' + und.length + '</td><td>' + rvR(rvSum(und, function (c) { return c.p; })) + '</td></tr>' : '') +
    '<tr class="tot"><td>Total (all cases)</td><td>' + cs.length + '</td><td>' + rvR(rvSum(cs, function (c) { return c.p; })) + '</td></tr></table>';
}
function rvModes(recs) { var m = {}; recs.forEach(function (r) { m[r.m] = m[r.m] || [0, 0]; m[r.m][0]++; m[r.m][1] += r.a; }); return Object.keys(m).sort(function (a, b) { return m[b][1] - m[a][1]; }).map(function (k) { return [k, m[k][0], m[k][1]]; }); }

/* ---- Unit Review Sheet (STO-wise) ---- */
function unitSheet(d, unit) {
  var o = rvCalc(d, unit), F = d.freshDays, rank = d.rank.indexOf(unit) + 1, H = [];
  var sc = o.stos.map(function (s) {
    var cs = o.W.filter(function (c) { return c.s === s; }), p = rvSum(cs, function (c) { return c.p; }), t = p * d.targetPct / 100, rc = rvSum(o.recs.filter(function (r) { return r.s === s; }), function (r) { return r.a; });
    var ac = o.acts.filter(function (a) { return a.s === s; }), covn = cs.filter(function (c) { return o.acted[c.id]; }).length, od = o.od.filter(function (c) { return c.s === s; });
    var last = cs.map(function (c) { return c.up; }).filter(String).sort().pop() || '';
    return { sto: s, cases: cs.length, pend: p, tgt: t, rec: rc, p: rvP(rc, t), acts: ac.length, covn: covn, cov: rvP(covn, cs.length), od: od.length, odamt: rvSum(od, function (c) { return c.adj; }), last: last,
      upd: cs.filter(function (c) { var x = rvDays(c.up, d.today); return x !== null && x < F; }).length, led: cs.filter(function (c) { var x = rvDays(c.lo, d.today); return x !== null && x < F; }).length };
  }).sort(function (a, b) { return b.p - a.p || b.rec - a.rec; });
  H.push(rvHead(d, 'Unit Review Sheet · ' + esc(unit), 'Pending 90+ days Recovery · ' + esc(d.division) + ' · Unit Head: ' + esc(headDesig(unit, d.units, d.heads)),
    'Month: <b>' + esc(d.monthLabel) + '</b><br>As on: <b>' + rvDmy(d.today) + '</b><br>Rank among ' + d.units.length + ' Units: <b>' + (rank || '–') + '</b>'));
  H.push(rvH2('A', 'Position at a glance', 'Recoverable cases with STO assigned') + rvGlance(d, o));
  var modes = rvModes(o.recs);
  H.push('<div class="two"><div class="av">' + rvH2('B', 'Category position', 'all ' + o.all.length + ' cases') + rvCatTable(d, o.all) + '</div><div class="av">' + rvH2('C', 'Recovery by mode') +
    '<table><tr><th>Mode of recovery</th><th>Entries</th><th>Amount</th></tr>' + (modes.map(function (m) { return '<tr><td>' + esc(m[0]) + '</td><td>' + m[1] + '</td><td>' + rvR(m[2]) + '</td></tr>'; }).join('') || '<tr><td colspan="3" class="mut">No recovery this month</td></tr>') +
    '<tr class="tot"><td>Total</td><td>' + o.recs.length + '</td><td>' + rvR(o.rec) + '</td></tr></table></div></div>');
  H.push(rvH2('D', 'STO scorecard', 'ranked by % of target') + '<table><tr><th>#</th><th class="l">STO</th><th>Cases</th><th>Pending</th><th>Target</th><th>Recovered</th><th>% Target</th><th>Actions</th><th>Coverage</th><th>Updated ' + F + 'd</th><th>Ledger ' + F + 'd</th><th>Set-off due</th><th>Last update</th></tr>' +
    sc.map(function (x, i) {
      return '<tr><td>' + (i + 1) + '</td><td class="l"><b>' + esc(x.sto) + '</b></td><td>' + x.cases + '</td><td>' + short(x.pend) + '</td><td>' + short(x.tgt) + '</td><td>' + short(x.rec) + '</td><td>' + x.p.toFixed(1) + '%</td><td' + rvRed(!x.acts) + '>' + x.acts + '</td><td' + rvRed(x.cov < 25) + '>' + x.cov.toFixed(0) + '%</td><td>' + x.upd + '/' + x.cases + '</td><td' + rvRed(!x.led) + '>' + x.led + '/' + x.cases + '</td><td' + rvRed(x.od) + '>' + (x.od ? x.od + ' · ' + short(x.odamt) : '–') + '</td><td>' + (x.last ? rvDmy(x.last).slice(0, 5) : '–') + '</td></tr>';
    }).join('') + '<tr class="tot"><td></td><td class="l">Unit total</td><td>' + o.cases + '</td><td>' + short(o.pend) + '</td><td>' + short(o.tgt) + '</td><td>' + short(o.rec) + '</td><td>' + o.p.toFixed(1) + '%</td><td>' + o.acts.length + '</td><td>' + o.cov.toFixed(0) + '%</td><td>' + o.upd + '/' + o.cases + '</td><td>' + o.led + '/' + o.cases + '</td><td>' + (o.od.length ? o.od.length + ' · ' + short(o.odamt) : '–') + '</td><td></td></tr></table>');
  var pts = [];
  sc.forEach(function (x) { if (x.od) pts.push(['r', '<b>' + esc(x.sto) + '</b>: ' + rvR(x.odamt) + ' adjustable in ledger in ' + x.od + ' case' + (x.od > 1 ? 's' : '') + ', not set off for ' + d.setoffDays + '+ days.']); });
  var z = sc.filter(function (x) { return !x.acts; }); if (z.length) pts.push(['r', '<b>No action this month</b>: ' + z.map(function (x) { return esc(x.sto) + ' (' + x.cases + ' cases, ' + rvR(x.pend) + ')'; }).join(', ') + '.']);
  var lo = sc.filter(function (x) { return x.acts && x.cov < 25; }); if (lo.length) pts.push(['a', '<b>Low coverage</b> (action in under 25% of cases): ' + lo.map(function (x) { return esc(x.sto) + ' ' + x.covn + ' of ' + x.cases; }).join(', ') + '.']);
  var st = sc.filter(function (x) { var k = rvDays(x.last, d.today); return k === null || k >= F; }); if (st.length) pts.push(['a', '<b>No case updated in the last ' + F + ' days</b>: ' + st.map(function (x) { return esc(x.sto) + (x.last ? ' (last ' + rvDmy(x.last).slice(0, 5) + ')' : ' (never)'); }).join(', ') + '.']);
  var nl = sc.filter(function (x) { return !x.led; }); if (nl.length) pts.push(['a', '<b>Ledger not checked in the last ' + F + ' days</b> by: ' + nl.map(function (x) { return esc(x.sto); }).join(', ') + '.']);
  if (o.unasRec.length) pts.push(['a', o.unasRec.length + ' Recoverable case' + (o.unasRec.length > 1 ? 's' : '') + ' (' + rvR(rvSum(o.unasRec, function (c) { return c.p; })) + ') have no STO assigned – not being worked.']);
  var T = rvTop(d, o.W, false, 10), tna = T.top.filter(function (c) { return !o.acted[c.id]; });
  if (tna.length) pts.push(['a', tna.length + ' of the top 10 cases (' + rvR(rvSum(tna, function (c) { return c.p; })) + ') have no action this month.']);
  if (o.p < 50) pts.push(['a', 'Recovery is ' + o.p.toFixed(1) + '% of the monthly target; ' + rvR(Math.max(o.tgt - o.rec, 0)) + ' more needed to reach it.']);
  H.push(rvH2('E', 'Points for review', 'generated from the data') + rvPts(pts));
  H.push(rvH2('F', 'Recoveries recorded in ' + esc(d.monthLabel), o.recs.length + ' entries · ' + rvR(o.rec), 'pb') + '<table><tr><th>Date</th><th class="l">Taxpayer</th><th class="l">STO</th><th class="l">Mode</th><th>Amount</th></tr>' +
    (o.recs.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).map(function (r) { return '<tr><td>' + rvDmy(r.d) + '</td><td class="l">' + esc(r.n) + '</td><td class="l">' + esc(r.s) + '</td><td class="l">' + esc(r.m) + '</td><td>' + inr(r.a) + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="mut">No recovery recorded</td></tr>') +
    '<tr class="tot"><td></td><td class="l">Total</td><td></td><td></td><td>' + inr(o.rec) + '</td></tr></table>');
  H.push(rvH2('G', 'Ledger set-off position') + '<div class="k k5">' + rvK('Available in checked ledgers', rvR(o.avail)) + rvK('Adjustable now', rvR(o.adj), o.adjA.length + ' cases') + rvK('Adjusted this month (ledger)', rvR(o.adjm)) + rvK('PMT-09 needed', o.pmt.length, 'cases') + rvK('Never checked', '<span class="red">' + o.never.length + '</span>', 'of ' + o.cases + ' cases') + '</div>' +
    '<table style="margin-top:7px"><tr><th class="l">Taxpayer</th><th class="l">STO</th><th>Cash</th><th>Credit</th><th>Adjustable</th><th>Adjustable since</th><th>Days</th><th class="l">Reason (if any)</th></tr>' +
    (o.od.slice().sort(function (a, b) { return b.adj - a.adj; }).map(function (c) { return '<tr><td class="l nm">' + esc(c.n) + ' <span class="mut sm">' + esc(c.id) + '</span></td><td class="l">' + esc(c.s) + '</td><td>' + inr(c.cash) + '</td><td>' + inr(c.cr) + '</td><td><b>' + inr(c.adj) + '</b></td><td>' + rvDmy(c.as) + '</td><td class="red">' + rvDays(c.as, d.today) + '</td><td class="l">' + esc(c.na || '–') + '</td></tr>'; }).join('') || '<tr><td colspan="8" class="mut">No adjustable amount pending set-off</td></tr>') +
    '</table><div class="mut sm" style="margin-top:3px">List: cases where an adjustable amount was found in the ledger ' + d.setoffDays + '+ days ago and is still not set off.</div>');
  var kinds = RV_ACT.map(function (k) { return k[0]; }).filter(function (k) { return o.acts.some(function (a) { return rvKind(a.a) === k; }); });
  if (!kinds.length) kinds = ['Spot visit'];
  var tot = {}, tn = 0, tna2 = [];
  H.push('<div class="av">' + rvH2('H', 'Actions taken in ' + esc(d.monthLabel) + ' · STO-wise', 'each case + action + date counted once') + '<table><tr><th class="l">STO</th>' + kinds.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '<th>Total</th><th>Cases with no action</th></tr>' +
    o.stos.map(function (s) {
      var ac = o.acts.filter(function (a) { return a.s === s; }), cnt = {}; ac.forEach(function (a) { var k = rvKind(a.a); cnt[k] = (cnt[k] || 0) + 1; tot[k] = (tot[k] || 0) + 1; }); tn += ac.length;
      var na = o.W.filter(function (c) { return c.s === s && !o.acted[c.id]; }); tna2 = tna2.concat(na);
      return '<tr><td class="l"><b>' + esc(s) + '</b></td>' + kinds.map(function (k) { return '<td>' + (cnt[k] || '<span class="mut">–</span>') + '</td>'; }).join('') + '<td' + rvRed(!ac.length) + '><b>' + ac.length + '</b></td><td>' + na.length + ' · ' + short(rvSum(na, function (c) { return c.p; })) + '</td></tr>';
    }).join('') + '<tr class="tot"><td class="l">Total</td>' + kinds.map(function (k) { return '<td>' + (tot[k] || 0) + '</td>'; }).join('') + '<td>' + tn + '</td><td>' + tna2.length + ' · ' + short(rvSum(tna2, function (c) { return c.p; })) + '</td></tr></table></div>');
  var tp = rvSum(T.top, function (c) { return c.p; });
  H.push(rvH2('I', 'Top 10 Recoverable cases by pending demand', rvR(tp) + ' = ' + rvP(tp, o.pend).toFixed(0) + '% of Unit pending') + T.html);
  H.push(rvH2('J', 'Data gaps') + '<table><tr><th class="l">Item</th><th>Cases</th><th>Amount</th><th class="l">Action needed</th></tr>' +
    '<tr><td class="l">Ledger never checked (Recoverable)</td><td>' + o.never.length + '</td><td>' + rvR(rvSum(o.never, function (c) { return c.p; })) + '</td><td class="l">STO to check cash &amp; credit ledger</td></tr>' +
    '<tr><td class="l">Demand break-up (Tax / Interest / Penalty) not entered</td><td>' + o.nobrk.length + '</td><td>' + rvR(rvSum(o.nobrk, function (c) { return c.p; })) + '</td><td class="l">Enter once from DRC-07 – needed for credit set-off</td></tr>' +
    '<tr><td class="l">Cases with no STO assigned (all categories)</td><td>' + o.unas.length + '</td><td>' + rvR(rvSum(o.unas, function (c) { return c.p; })) + '</td><td class="l">Assign STO in the Google Sheet</td></tr>' +
    '<tr><td class="l">&nbsp;&nbsp;of which Recoverable</td><td' + rvRed(o.unasRec.length) + '>' + o.unasRec.length + '</td><td>' + rvR(rvSum(o.unasRec, function (c) { return c.p; })) + '</td><td class="l">Not being worked by anyone</td></tr></table>');
  H.push('<div class="av">' + rvH2('K', 'Directions of the reviewing officer') + '<div class="dir"></div><div class="sig"><div>' + esc(headDesig(unit, d.units, d.heads)) + '<br>(Unit Head) · ' + esc(unit.split(' (')[0]) + '</div><div>Deputy Commissioner<br>(Range Head)</div><div>Joint Commissioner<br>(Divisional Head)</div></div></div>');
  H.push(rvFoot(d));
  return '<div class="rv">' + H.join('') + '</div>';
}

/* ---- Division Review Sheet (Unit-wise) ---- */
function divSheet(d) {
  var D = rvCalc(d, null), F = d.freshDays, H = [], U = {};
  d.units.forEach(function (u) { U[u] = rvCalc(d, u); U[u].u = u; });
  var order = d.units.slice().sort(function (a, b) { return U[b].p - U[a].p || U[b].rec - U[a].rec; });
  H.push(rvHead(d, 'Division Review Sheet · ' + esc(d.division), 'Pending 90+ days Recovery · Unit-wise review · ' + d.units.length + ' Units',
    'Month: <b>' + esc(d.monthLabel) + '</b><br>As on: <b>' + rvDmy(d.today) + '</b><br>Review: <b>DC (Range) · JC (Division)</b>'));
  H.push(rvH2('A', 'Division at a glance', 'Recoverable cases with STO assigned') + rvGlance(d, D));
  var nsto = 0, nnoact = 0;
  H.push(rvH2('B', 'Unit scorecard', 'ranked by % of target') + '<table><tr><th>#</th><th class="l">Unit</th><th>STOs</th><th>Cases</th><th>Pending</th><th>Target</th><th>Recovered</th><th>% Target</th><th>Actions</th><th>Coverage</th><th>Updated ' + F + 'd</th><th>Ledger ' + F + 'd</th><th>Set-off due</th><th>STOs no action</th></tr>' +
    order.map(function (u, i) {
      var x = U[u]; nsto += x.stos.length; nnoact += x.stoNoAct.length;
      return '<tr><td>' + (i + 1) + '</td><td class="l"><b>' + esc(u) + '</b></td><td>' + x.stos.length + '</td><td>' + x.cases + '</td><td>' + short(x.pend) + '</td><td>' + short(x.tgt) + '</td><td>' + short(x.rec) + '</td><td><b>' + x.p.toFixed(1) + '%</b><div class="bar"><i style="width:' + Math.min(100, x.p * 3).toFixed(0) + '%"></i></div></td><td' + rvRed(!x.acts.length) + '>' + x.acts.length + '</td><td' + rvRed(x.cov < 25) + '>' + x.cov.toFixed(0) + '%</td><td>' + x.upd + '/' + x.cases + '</td><td' + rvRed(rvP(x.led, x.cases) < 25) + '>' + x.led + '/' + x.cases + '</td><td' + rvRed(x.od.length) + '>' + (x.od.length ? x.od.length + ' · ' + short(x.odamt) : '–') + '</td><td' + rvRed(x.stoNoAct.length) + '>' + x.stoNoAct.length + ' of ' + x.stos.length + '</td></tr>';
    }).join('') + '<tr class="tot"><td></td><td class="l">Division</td><td>' + nsto + '</td><td>' + D.cases + '</td><td>' + short(D.pend) + '</td><td>' + short(D.tgt) + '</td><td>' + short(D.rec) + '</td><td>' + D.p.toFixed(1) + '%</td><td>' + D.acts.length + '</td><td>' + D.cov.toFixed(0) + '%</td><td>' + D.upd + '/' + D.cases + '</td><td>' + D.led + '/' + D.cases + '</td><td>' + D.od.length + ' · ' + short(D.odamt) + '</td><td>' + nnoact + ' of ' + nsto + '</td></tr></table>' +
    '<div class="mut sm" style="margin-top:3px">Bar under % Target is scaled ×3 for visibility. Coverage = cases with at least one action this month.</div>');
  var pts = [];
  order.forEach(function (u) {
    var x = U[u], b = [];
    if (x.od.length) b.push(rvR(x.odamt) + ' adjustable in ledger in ' + x.od.length + ' cases not set off for ' + d.setoffDays + '+ days');
    if (x.stoNoAct.length) b.push('no action this month by ' + x.stoNoAct.join(', '));
    if (x.cases && x.cov < 25) b.push('action coverage only ' + x.cov.toFixed(0) + '% (' + x.covn + ' of ' + x.cases + ' cases)');
    if (x.stoStale.length) b.push('no update in ' + F + ' days by ' + x.stoStale.join(', '));
    if (x.cases && rvP(x.led, x.cases) < 25) b.push('ledgers checked in only ' + x.led + ' of ' + x.cases + ' cases in ' + F + ' days');
    if (x.unasRec.length) b.push(x.unasRec.length + ' Recoverable cases (' + rvR(rvSum(x.unasRec, function (c) { return c.p; })) + ') without STO');
    if (b.length) pts.push([x.od.length || x.stoNoAct.length ? 'r' : 'a', '<b>' + esc(u) + '</b> (' + x.p.toFixed(1) + '% of target): ' + esc(b.join('; ')).replace(/&amp;#8377;/g, '&#8377;') + '.']);
  });
  var lag = order.filter(function (u) { return U[u].p < 1; }); if (lag.length) pts.push(['r', '<b>Below 1% of target</b>: ' + lag.map(esc).join(', ') + '.']);
  pts.push(['a', '<b>Division</b>: recovery ' + D.p.toFixed(1) + '% of the monthly target; ' + rvR(Math.max(D.tgt - D.rec, 0)) + ' more needed to reach it.']);
  H.push(rvH2('C', 'Points for review · Unit-wise', 'generated from the data') + rvPts(pts));
  var cats = d.categories, CT = {};
  H.push(rvH2('D', 'Category position · Unit-wise', 'all cases (cases / pending)', 'pb') + '<table><tr><th class="l">Unit</th>' + cats.map(function (k) { return '<th>' + esc(RV_CATS[k] || k) + '</th>'; }).join('') + '<th>Total</th></tr>' +
    d.units.map(function (u) {
      return '<tr><td class="l"><b>' + esc(u) + '</b></td>' + cats.concat(['__']).map(function (k) {
        var x = U[u].all.filter(function (c) { return k === '__' || c.c === k; }), a = rvSum(x, function (c) { return c.p; });
        CT[k] = CT[k] || [0, 0]; CT[k][0] += x.length; CT[k][1] += a;
        return x.length ? '<td>' + x.length + '<br><span class="mut">' + short(a) + '</span></td>' : '<td class="mut">–</td>';
      }).join('') + '</tr>';
    }).join('') + '<tr class="tot"><td class="l">Division</td>' + cats.concat(['__']).map(function (k) { return '<td>' + CT[k][0] + '<br>' + short(CT[k][1]) + '</td>'; }).join('') + '</tr></table>');
  var modes = rvModes(D.recs).map(function (m) { return m[0]; });
  H.push(rvH2('E', 'Recovery by mode · Unit-wise') + '<table><tr><th class="l">Unit</th>' + modes.map(function (m) { return '<th>' + esc(m) + '</th>'; }).join('') + '<th>Entries</th><th>Total</th><th class="l">Largest recovery</th></tr>' +
    order.map(function (u) {
      var rr = U[u].recs, big = rr.slice().sort(function (a, b) { return b.a - a.a; })[0];
      return '<tr><td class="l"><b>' + esc(u) + '</b></td>' + modes.map(function (m) { var x = rr.filter(function (r) { return r.m === m; }); return '<td>' + (x.length ? short(rvSum(x, function (r) { return r.a; })) : '<span class="mut">–</span>') + '</td>'; }).join('') +
        '<td>' + rr.length + '</td><td><b>' + short(U[u].rec) + '</b></td><td class="l">' + (big ? short(big.a) + ' · ' + esc(big.n.slice(0, 26)) : '<span class="mut">No recovery</span>') + '</td></tr>';
    }).join('') + '<tr class="tot"><td class="l">Division</td>' + modes.map(function (m) { return '<td>' + short(rvSum(D.recs.filter(function (r) { return r.m === m; }), function (r) { return r.a; })) + '</td>'; }).join('') + '<td>' + D.recs.length + '</td><td>' + short(D.rec) + '</td><td></td></tr></table>');
  H.push(rvH2('F', 'Ledger set-off position · Unit-wise') + '<table><tr><th class="l">Unit</th><th>Checked ' + F + 'd</th><th>Never checked</th><th>Available</th><th>Adjustable now</th><th>Pending ' + d.setoffDays + '+ days</th><th>Adjusted (' + esc(d.monthLabel.slice(0, 3)) + ')</th><th>PMT-09</th></tr>' +
    order.map(function (u) { var x = U[u]; return '<tr><td class="l"><b>' + esc(u) + '</b></td><td>' + x.led + '/' + x.cases + '</td><td' + rvRed(rvP(x.never.length, x.cases) > 50) + '>' + x.never.length + '</td><td>' + short(x.avail) + '</td><td>' + short(x.adj) + '<br><span class="mut">' + x.adjA.length + ' cases</span></td><td' + rvRed(x.od.length) + '>' + (x.od.length ? x.od.length + ' · ' + short(x.odamt) : '–') + '</td><td>' + (x.adjm ? short(x.adjm) : '–') + '</td><td>' + x.pmt.length + '</td></tr>'; }).join('') +
    '<tr class="tot"><td class="l">Division</td><td>' + D.led + '/' + D.cases + '</td><td>' + D.never.length + '</td><td>' + short(D.avail) + '</td><td>' + short(D.adj) + '</td><td>' + D.od.length + ' · ' + short(D.odamt) + '</td><td>' + short(D.adjm) + '</td><td>' + D.pmt.length + '</td></tr></table>');
  var kinds = RV_ACT.map(function (k) { return k[0]; }).filter(function (k) { return D.acts.some(function (a) { return rvKind(a.a) === k; }); }); if (!kinds.length) kinds = ['Spot visit'];
  var tot = {};
  H.push('<div class="av">' + rvH2('G', 'Actions taken in ' + esc(d.monthLabel) + ' · Unit-wise', 'each case + action + date counted once') + '<table><tr><th class="l">Unit</th>' + kinds.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '<th>Total</th><th>Cases with no action</th></tr>' +
    order.map(function (u) {
      var x = U[u], cnt = {}; x.acts.forEach(function (a) { var k = rvKind(a.a); cnt[k] = (cnt[k] || 0) + 1; tot[k] = (tot[k] || 0) + 1; });
      var na = x.W.filter(function (c) { return !x.acted[c.id]; });
      return '<tr><td class="l"><b>' + esc(u) + '</b></td>' + kinds.map(function (k) { return '<td>' + (cnt[k] || '<span class="mut">–</span>') + '</td>'; }).join('') + '<td' + rvRed(!x.acts.length) + '><b>' + x.acts.length + '</b></td><td>' + na.length + ' · ' + short(rvSum(na, function (c) { return c.p; })) + '</td></tr>';
    }).join('') + (function () { var na = D.W.filter(function (c) { return !D.acted[c.id]; }); return '<tr class="tot"><td class="l">Division</td>' + kinds.map(function (k) { return '<td>' + (tot[k] || 0) + '</td>'; }).join('') + '<td>' + D.acts.length + '</td><td>' + na.length + ' · ' + short(rvSum(na, function (c) { return c.p; })) + '</td></tr>'; })() + '</table></div>');
  var T = rvTop(d, D.W, true, 15), tp = rvSum(T.top, function (c) { return c.p; });
  H.push(rvH2('H', 'Top 15 Recoverable cases of the Division', rvR(tp) + ' = ' + rvP(tp, D.pend).toFixed(0) + '% of Division pending', 'pb') + T.html);
  H.push(rvH2('I', 'Data gaps · Unit-wise') + '<table><tr><th class="l">Unit</th><th>Ledger never checked</th><th>Break-up not entered</th><th>Cases without STO</th><th>of which Recoverable</th></tr>' +
    d.units.map(function (u) { var x = U[u]; return '<tr><td class="l"><b>' + esc(u) + '</b></td><td>' + x.never.length + ' · ' + short(rvSum(x.never, function (c) { return c.p; })) + '</td><td>' + x.nobrk.length + '</td><td>' + x.unas.length + ' · ' + short(rvSum(x.unas, function (c) { return c.p; })) + '</td><td' + rvRed(x.unasRec.length) + '>' + (x.unasRec.length ? x.unasRec.length + ' · ' + short(rvSum(x.unasRec, function (c) { return c.p; })) : '–') + '</td></tr>'; }).join('') +
    '<tr class="tot"><td class="l">Division</td><td>' + D.never.length + '</td><td>' + D.nobrk.length + '</td><td>' + D.unas.length + '</td><td>' + D.unasRec.length + '</td></tr></table>');
  H.push('<div class="av">' + rvH2('J', 'Directions / decisions in the review meeting') + '<div class="dir" style="height:150px"></div><div class="sig s2"><div>Deputy Commissioner<br>(Range Head)</div><div>Joint Commissioner<br>(Divisional Head)</div></div></div>');
  H.push(rvFoot(d));
  return '<div class="rv">' + H.join('') + '</div>';
}

/* ================= ADMIN: MONTHLY CATEGORY LIST (upload / confirm / download) ================= */
var UP = {};
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (UP.loading) return UP.loading;
  UP.loading = new Promise(function (ok, no) {
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = function () { ok(window.XLSX); }; s.onerror = function () { UP.loading = null; no('Could not load the Excel reader. Check the internet and try again.'); };
    document.head.appendChild(s);
  });
  return UP.loading;
}
function upPick() { $('upFile').value = ''; $('upFile').click(); }
function upFileChosen(inp) {
  var f = inp.files && inp.files[0]; if (!f) return;
  $('upName').textContent = f.name; $('upPrev').innerHTML = ''; busy(true);
  loadXlsx().then(function (X) {
    return f.arrayBuffer().then(function (buf) {
      var wb = X.read(buf, { type: 'array' }), table = null;
      wb.SheetNames.some(function (n) {               // first sheet that has a "Demand ID" header
        var rows = X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '', dateNF: 'dd-mm-yyyy' });
        if (rows.slice(0, 15).some(function (r) { return r.some(function (c) { return String(c).replace(/\s+/g, '').toLowerCase() === 'demandid'; }); })) { table = rows; UP.sheet = n; return true; }
        return false;
      });
      if (!table) throw 'No sheet with a "Demand ID" column found in this file.';
      UP.table = upTrim(table);
      return api('previewUpload', S.pin, UP.table);
    });
  }).then(function (p) { busy(false); UP.prev = p; renderUpPrev(); })
    .catch(function (e) { busy(false); $('upPrev').innerHTML = '<div class="ban" style="margin:10px 0 0;background:#FBE1E3;border-color:#F3C3C8;color:#A1182B"><b>' + ic('alert') + ' File not accepted</b>' + esc(String(e)) + '</div>'; });
}
/** keep only the columns the app needs (smaller upload) */
function upTrim(rows) {
  var want = ['unit', 'sto', 'stoseries', 'demandid', 'recoveryid', 'dateofdemandorder', 'gstin/temporaryid', 'legalname', 'mobileno.', 'section/act', 'demandstatus', 'originaldemandinrs.', 'pendingdemandinrs.', 'status(active/cancel)', 'tradename', 'sourceofdemand'];
  var key = function (s) { return String(s).replace(/\s+/g, '').toLowerCase(); }, cols = null, out = [];
  rows.forEach(function (r) {
    var ks = r.map(key);
    if (ks.indexOf('demandid') >= 0) { cols = []; ks.forEach(function (k, i) { if (want.indexOf(k) >= 0 || k.indexOf('recoverystatusason') === 0 || k.indexOf('taxperiod') === 0) cols.push(i); }); out.push(cols.map(function (i) { return r[i]; })); return; }
    if (cols && r.some(function (c) { return String(c).trim(); })) out.push(cols.map(function (i) { return r[i] == null ? '' : r[i]; }));
  });
  return out;
}
function renderUpPrev() {
  var p = UP.prev, bad = p.badCatCount > 0, html = '';
  var what = p.mode === 'new' ? 'Starts <b>' + esc(p.monthLabel) + '</b>. ' + esc(p.curLabel) + ' will be closed and saved (it stays viewable on the Dashboard).' :
    p.mode === 'update' ? 'Updates the current month <b>' + esc(p.monthLabel) + '</b> (recoveries and actions already entered are kept).' :
    p.mode === 'first' ? 'First list of the app – loads <b>' + esc(p.monthLabel) + '</b>.' : '<b style="color:#A1182B">' + esc(p.monthLabel) + ' is older than the current month ' + esc(p.curLabel) + ' – cannot be loaded.</b>';
  html += '<div class="upbox"><div class="uph">' + ic('sheet') + '<div><b>' + esc(p.catHeader) + '</b><span>' + p.cases + ' cases · ₹' + short(p.pending) + ' pending</span></div></div><div class="upw">' + what + '</div>';
  html += '<table class="upt"><tr><th>Category</th><th>Cases</th><th>Pending</th></tr>' + p.categories.map(function (c) {
    return '<tr' + (c.cat === 'Recoverable' ? ' class="rc"' : c.cat === 'Not understood' ? ' class="bd"' : c.cat === 'To be decided by STO' ? ' class="td"' : '') + '><td>' + esc(CAT_SHORT[c.cat] || c.cat) + '</td><td>' + c.n + '</td><td>₹' + short(c.amt) + '</td></tr>';
  }).join('') + '</table>';
  html += '<table class="upt"><tr><th>Unit</th><th>Cases</th><th>Recoverable</th></tr>' + p.units.map(function (u) {
    var r = u.cat['Recoverable'] || { n: 0, amt: 0 }; return '<tr><td>' + esc(u.unit) + '</td><td>' + u.cases + '</td><td>' + r.n + ' · ₹' + short(r.amt) + '</td></tr>';
  }).join('') + '</table>';
  if (p.mode !== 'first') html += '<div class="upc"><span><b>' + p.newCases + '</b>new case' + (p.newCases === 1 ? '' : 's') + '</span><span><b>' + p.gone + '</b>no longer in list</span><span><b>' + p.catChanged + '</b>category changed</span><span><b>' + p.stoChanged + '</b>STO changed</span></div>';
  if (bad) html += '<div class="ban" style="margin:10px 0 0;background:#FBE1E3;border-color:#F3C3C8;color:#A1182B"><b>' + ic('alert') + ' ' + p.badCatCount + (p.badCatCount > 1 ? ' cases' : ' case') + ': category not understood</b>' +
    p.badCat.map(function (b) { return esc(b.unit) + ' · ' + esc(b.demandId) + ' · ' + esc(b.name) + ' – "' + esc(b.text) + '"'; }).join('<br>') + '<br>Use one of: Recoverable · Tribunal/HC/SC/Court case · NCLT, Liquidation Case · Any Other (Rectification, Revision, Litigation etc.) · Payment made through DRC-03 which is not shown in DCR. Correct the file and upload again.</div>';
  if (p.blankNew || p.blankOld) html += '<div class="ban info" style="margin:10px 0 0"><b>Category left blank in the list</b>' + (p.blankNew ? p.blankNew + (p.blankNew > 1 ? ' new cases' : ' new case') + ': the STO will decide the category (shown as NEW).' : '') + (p.blankNew && p.blankOld ? '<br>' : '') + (p.blankOld ? p.blankOld + (p.blankOld > 1 ? ' cases' : ' case') + ' of last month: last month\'s category is proposed.' : '') + '</div>';
  if (p.noStoCount) html += '<div class="ban" style="margin:10px 0 0"><b>' + p.noStoCount + (p.noStoCount > 1 ? ' cases' : ' case') + ' without STO SERIES</b>They keep last month\'s STO; a completely new case without STO goes to "Not assigned".</div>';
  if (p.newCombos.length) html += '<div class="ban info" style="margin:10px 0 0"><b>New Unit / STO in the list</b>' + p.newCombos.map(esc).join(', ') + ' – will be added to the Lists tab (set PIN there).</div>';
  var ok = !bad && p.mode !== 'old';
  html += '<button class="btn" ' + (ok ? '' : 'disabled ') + 'onclick="upApply()">' + ic('check') + ' Load proposed categories &amp; ' + (p.mode === 'new' ? 'start ' : 'update ') + esc(p.monthLabel) + '</button>' +
    '<div class="hint" style="text-align:center">STOs will then <b>Confirm</b> or <b>Change</b> (with reason) each category. Lock the month when done.</div></div>';
  $('upPrev').innerHTML = html;
}
function upApply() {
  var p = UP.prev;
  if (!confirm((p.mode === 'new' ? 'Start ' + p.monthLabel + ' and close ' + p.curLabel + '?' : 'Load the categories for ' + p.monthLabel + '?') + '\n\n' + p.cases + ' cases. STOs will confirm or change the proposed categories.')) return;
  busy(true);
  api('applyUpload', S.pin, UP.table, p.month).then(function (r) {
    busy(false); UP.prev = null; toast(r.monthLabel + ' loaded ✓');
    $('upPrev').innerHTML = '<div class="ban ok" style="margin:10px 0 0"><b>' + ic('check') + ' ' + esc(r.monthLabel) + (r.started ? ' – proposed categories loaded' : ' – list updated') + '</b>' + r.cases + ' cases · <b>' + r.recoverable + ' Recoverable</b> (₹' + short(r.recoverablePending) + ')' + (r.started ? ' · STOs now confirm or change the categories' : ' · case details refreshed, entries and STO decisions kept') + (r.toDecide ? ' · <b>' + r.toDecide + ' new ' + (r.toDecide > 1 ? 'cases' : 'case') + ' for STOs to decide</b>' : '') +
      (r.newCases ? ' · ' + r.newCases + ' new' : '') + (r.archived ? ' · ' + r.archived + ' no longer in list (moved to "Archived Cases")' : '') + (r.noSto ? ' · <b style="color:#A1182B">' + r.noSto + ' without STO – fill in the Cases sheet</b>' : '') +
      (r.combosAdded ? '<br>' + r.combosAdded + ' new Unit/STO added to the Lists tab – set their PINs.' : '') + '</div>' +
      '<div class="hint" style="text-align:center;margin-top:8px">Follow progress in Dashboard → Categories. When all STOs have decided, tap <b>Lock categories</b> below and download the final lists.</div>';
    $('upName').textContent = 'No file chosen';
    try { localStorage.removeItem('rec2_report'); } catch (e) {}
    api('adminInfo', S.pin).then(function (info) { renderAdmin(info); }).catch(function () {});
  }).catch(function (e) { busy(false); toast(String(e)); });
}
function dlLists() {
  busy(true);
  Promise.all([loadXlsx(), api('monthList', S.pin)]).then(function (a) {
    var X = a[0], d = a[1], wb = X.utils.book_new(), ci = d.headers.indexOf('Category'), ui = 0, pi = d.headers.indexOf('Pending Demand (Rs)');
    var units = d.rows.map(function (r) { return r[ui]; }).filter(function (u, i, x) { return x.indexOf(u) === i; }).sort();
    var cats = d.categories.concat(d.rows.some(function (r) { return d.categories.indexOf(r[ci]) < 0; }) ? ['Not decided'] : []);
    var sum = [[d.division + ' · Pending 90+ days · Category lists · ' + d.monthLabel], [], ['Unit'].concat(cats.reduce(function (a, c) { return a.concat([(CAT_SHORT[c] || c) + ' (cases)', (CAT_SHORT[c] || c) + ' (Rs)']); }, [])).concat(['Total cases', 'Total (Rs)'])];
    var tot = cats.map(function () { return [0, 0]; }), T = [0, 0];
    units.forEach(function (u) {
      var row = [u], rs = d.rows.filter(function (r) { return r[ui] === u; });
      cats.forEach(function (c, k) { var x = rs.filter(function (r) { return r[ci] === c; }), amt = x.reduce(function (s, r) { return s + (r[pi] || 0); }, 0); row.push(x.length, amt); tot[k][0] += x.length; tot[k][1] += amt; });
      var all = rs.reduce(function (s, r) { return s + (r[pi] || 0); }, 0); row.push(rs.length, all); T[0] += rs.length; T[1] += all; sum.push(row);
    });
    sum.push(['Total'].concat(tot.reduce(function (a, x) { return a.concat(x); }, [])).concat(T));
    var ws = X.utils.aoa_to_sheet(sum); ws['!cols'] = [{ wch: 22 }].concat(sum[2].slice(1).map(function () { return { wch: 16 }; })); X.utils.book_append_sheet(wb, ws, 'Summary');
    var add = function (name, rows) { var s = X.utils.aoa_to_sheet([d.headers].concat(rows)); s['!cols'] = [22, 8, 10, 18, 18, 12, 17, 40, 12, 9, 30, 16, 16, 30, 30, 30, 26, 40, 18].map(function (w) { return { wch: w }; }); s['!autofilter'] = { ref: 'A1:S' + (rows.length + 1) }; X.utils.book_append_sheet(wb, s, name); };
    var sorted = d.rows.slice().sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : (b[pi] || 0) - (a[pi] || 0); });
    add('All cases', sorted);
    var SN = { 'Recoverable': 'Recoverable', 'Tribunal / HC / SC / Court': 'Tribunal-HC-SC-Court', 'NCLT / Liquidation': 'NCLT-Liquidation', 'Other (Rectification, Revision, Litigation)': 'Other (Rect-Rev-Litig)', 'Paid via DRC-03 (not in DCR)': 'Paid DRC-03 not in DCR', 'Not decided': 'Not decided' };
    cats.forEach(function (c) { add(SN[c] || c.slice(0, 30), sorted.filter(function (r) { return r[ci] === c; })); });
    var di = d.headers.indexOf('STO decision'); if (di >= 0) { var chg = sorted.filter(function (r) { return r[di] === 'Changed by STO'; }); if (chg.length) add('Changed by STOs', chg); }
    X.writeFile(wb, ('Category-Lists-' + (d.locked ? 'FINAL-' : 'PROVISIONAL-') + d.division + '-' + d.monthLabel).replace(/[^\w-]+/g, '-') + '.xlsx');
    busy(false); toast('Category lists downloaded ✓');
  }).catch(function (e) { busy(false); toast(String(e)); });
}

/* ================= ADMIN: IMPORT ENTRIES OF THE OLD APP (Excel) ================= */
var OI = {};
function oiPick() { $('oiFile').value = ''; $('oiFile').click(); }
function oiFileChosen(inp) {
  var f = inp.files && inp.files[0]; if (!f) return;
  $('oiName').textContent = f.name; $('oiPrev').innerHTML = ''; busy(true);
  loadXlsx().then(function (X) {
    return f.arrayBuffer().then(function (buf) {
      var wb = X.read(buf, { type: 'array' }), table = null;
      var names = wb.SheetNames.slice().sort(function (a, b) { return (b === 'Updates') - (a === 'Updates'); });
      names.some(function (n) {
        var rows = X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' });
        if (rows.slice(0, 5).some(function (r) { var k = r.map(function (c) { return String(c).trim(); }); return k.indexOf('Timestamp') >= 0 && k.indexOf('Demand ID') >= 0; })) { table = rows; return true; }
        return false;
      });
      if (!table) throw 'The tab "Updates" (with Timestamp and Demand ID) was not found. Download the OLD app\'s Google Sheet as Excel and choose that file.';
      var hi = table.findIndex(function (r) { return r.map(function (c) { return String(c).trim(); }).indexOf('Timestamp') >= 0; });
      var dcols = table[hi].map(function (c, i) { return ['Timestamp', 'Spot Visit Date', 'Step Date', 'Recovery Date'].indexOf(String(c).trim()) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
      var wall = function (v) {                        // Excel date number -> "yyyy-mm-ddThh:mm:ss" (as shown in the sheet)
        var t = new Date(Math.round((v - 25569) * 864e5)), p = function (n) { return ('0' + n).slice(-2); };
        return t.getUTCFullYear() + '-' + p(t.getUTCMonth() + 1) + '-' + p(t.getUTCDate()) + 'T' + p(t.getUTCHours()) + ':' + p(t.getUTCMinutes()) + ':' + p(t.getUTCSeconds());
      };
      OI.table = table.slice(hi).map(function (r, k) { return k === 0 ? r : r.map(function (c, i) { return dcols.indexOf(i) >= 0 && typeof c === 'number' && c > 20000 ? wall(c) : c; }); });
      return api('previewOldImport', S.pin, OI.table, $('oiFull').checked);
    });
  }).then(function (p) { busy(false); OI.prev = p; renderOiPrev(); })
    .catch(function (e) { busy(false); $('oiPrev').innerHTML = '<div class="ban" style="margin:10px 0 0;background:#FBE1E3;border-color:#F3C3C8;color:#A1182B"><b>' + ic('alert') + ' File not accepted</b>' + esc(String(e)) + '</div>'; });
}
function oiFullChanged() {
  if (!OI.table) return; busy(true);
  api('previewOldImport', S.pin, OI.table, $('oiFull').checked).then(function (p) { busy(false); OI.prev = p; renderOiPrev(); }).catch(function (e) { busy(false); toast(String(e)); });
}
function renderOiPrev() {
  var p = OI.prev, html = '<div class="upbox"><div class="uph">' + ic('refresh') + '<div><b>Old app entries after ' + esc(p.from) + '</b><span>' + (p.rows ? p.rows + (p.rows === 1 ? ' new entry' : ' new entries') + ' · up to ' + esc(p.to) : 'nothing new') + '</span></div></div>';
  if (!p.rows && !p.full) { $('oiPrev').innerHTML = html + '<div class="upw">No entries after the last import. Nothing to do. (To re-check everything, tick "Re-check ALL old app entries" above.)</div></div>'; return; }
  if (p.full) html += '<div class="upw"><b>Full re-check:</b> ' + p.rows + ' old app entries checked · <b>' + p.rec + ' recoveries (₹' + short(p.recAmt) + ') missing in this app</b> will be added' + (p.monthFixed ? ' · ' + p.monthFixed + ' earlier entries moved to the month they were reported' : '') + ' · ' + p.dup + ' already present. Old app total recovery: <b>₹' + short(p.oldTotal || 0) + '</b>.</div>';
  html += '<div class="upc"><span><b>' + p.rec + '</b>recoveries</span><span><b>₹' + short(p.recAmt) + '</b>recovered</span><span><b>' + p.act + '</b>actions</span><span><b>' + p.led + '</b>ledger</span></div>';
  if (p.dup) html += '<div class="upw">' + p.dup + ' entries are already in this app – they will be skipped.</div>';
  if (p.sample.length) html += '<table class="upt"><tr><th>Date</th><th>Taxpayer · STO</th><th>Amount</th></tr>' + p.sample.map(function (x) { return '<tr><td>' + esc(x.d.slice(0, 5)) + '</td><td style="text-align:left">' + esc(x.n) + '<br><small style="color:#5E6580">' + esc(shortU(x.u)) + ' · ' + esc(x.s) + ' · ' + esc(x.m) + '</small></td><td>₹' + short(x.a) + '</td></tr>'; }).join('') + '</table>';
  var st = Object.keys(p.stos).sort();
  if (st.length) html += '<div class="upw"><b>Entries by STO:</b> ' + st.map(function (k) { return esc(k.replace('Ghatak ', 'G-').replace(/ \([^)]*\)/, '')) + ' ' + p.stos[k]; }).join(' · ') + '</div>';
  if (p.unmatched.length) html += '<div class="ban" style="margin:10px 0 0"><b>' + p.unmatched.length + ' entr' + (p.unmatched.length > 1 ? 'ies' : 'y') + ' for cases not in the current list</b>' + p.unmatched.slice(0, 10).map(esc).join('<br>') + (p.unmatched.length > 10 ? '<br>…' : '') + '<br>They are kept in the sheet "Old App Import".</div>';
  html += '<button class="btn" onclick="oiApply()">' + ic('check') + (p.full ? ' Re-check &amp; fix' : ' Import ' + p.rows + ' entries') + '</button></div>';
  $('oiPrev').innerHTML = html;
}
function oiApply() {
  if (!confirm(OI.prev.full ? 'Re-check all old app entries and add the missing ones?' : 'Import ' + OI.prev.rows + ' entries of the old app into this app?')) return;
  busy(true);
  api('applyOldImport', S.pin, OI.table, !!OI.prev.full).then(function (r) {
    busy(false); OI = {}; $('oiName').textContent = 'No file chosen';
    try { localStorage.removeItem('rec2_report'); } catch (e) {}
    $('oiPrev').innerHTML = '<div class="ban ok" style="margin:10px 0 0"><b>' + ic('check') + ' Imported</b>' + r.rec + (r.rec === 1 ? ' recovery' : ' recoveries') + ' (₹' + short(r.recAmt) + ') · ' + clN(r.act, 'action') + ' · ' + r.led + (r.led === 1 ? ' ledger entry' : ' ledger entries') + (r.unmatched.length ? ' · ' + r.unmatched.length + ' not found (see sheet "Old App Import")' : '') + (r.monthFixed ? ' · month corrected for ' + r.monthFixed + ' earlier entries' : '') +
      '<br>Old app total recovery <b>₹' + short(r.oldTotal || 0) + '</b> · this app <b>₹' + short(r.appTotal || 0) + '</b> (includes entries made directly in this app)' + (r.unmatchedAmt ? ' · ₹' + short(r.unmatchedAmt) + ' is on cases not in the current list' : '') + '</div>';
    $('oiFull').checked = false;
  }).catch(function (e) { busy(false); toast(String(e)); });
}

/* ================= CASE LISTS (JC / DC / Unit Head / Admin) ================= */
var CL = { tab: 'rec', sub: { rec: 'made', act: 'done', led: 'A', cat: 'Recoverable' }, unit: 'all', sto: 'all', type: 'all', akind: 'all', q: '', lim: 50 };
function openCaseLists() {
  var scope = S.role === 'unit' ? S.ownUnit : 'ALL'; busy(true);
  api('getReview', S.role, S.ownUnit || '', S.pin, scope).then(function (d) {
    busy(false); CL.d = d; CL.unit = S.role === 'unit' ? S.ownUnit : 'all'; CL.sto = 'all'; CL.lim = 50; CL.cache = {};
    var rec = {}, act = {};
    d.recs.forEach(function (r) { var x = rec[r.id] = rec[r.id] || { amt: 0, n: 0, d: '', m: '' }; x.amt += r.a; x.n++; if (r.d >= x.d) { x.d = r.d; x.m = r.m; } });
    d.acts.forEach(function (a) { (act[a.id] = act[a.id] || []).push(a); });
    Object.keys(act).forEach(function (k) { act[k].sort(function (a, b) { return a.d < b.d ? 1 : -1; }); });
    CL.rec = rec; CL.act = act;
    show('sLists', { mode: 'bar', t: 'Case lists', s: (scope === 'ALL' ? d.division : scope) + ' · ' + d.monthLabel });
    clFilters(); renderCL();
  }).catch(function (e) { busy(false); toast(String(e)); });
}
function clFilters() {
  var d = CL.d, units = d.units.filter(function (u) { return d.cases.some(function (c) { return c.u === u; }); });
  $('clUnit').innerHTML = (S.role === 'unit' ? '' : '<option value="all">All Units</option>') + units.map(function (u) { return '<option' + (u === CL.unit ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('');
  clStoOpts();
}
function clStoOpts() {
  var stos = rvSort(CL.d.cases.filter(function (c) { return CL.unit === 'all' || c.u === CL.unit; }).map(function (c) { return c.s; }).filter(function (s, i, a) { return a.indexOf(s) === i; }));
  if (CL.unit === 'all') CL.sto = 'all';
  $('clSto').innerHTML = '<option value="all">All STOs</option>' + (CL.unit === 'all' ? '' : stos.map(function (s) { return '<option' + (s === CL.sto ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join(''));
  $('clSto').disabled = CL.unit === 'all';
}
function clSet(k, v) { CL[k] = v; CL.lim = 50; if (k === 'unit') clStoOpts(); if (k === 'tab') { $('clQ').value = ''; CL.q = ''; } renderCL(); }
function clSub(v) { CL.sub[CL.tab] = v; CL.lim = 50; renderCL(); }
function clBase() {
  return CL.d.cases.filter(function (c) {
    return (CL.unit === 'all' || c.u === CL.unit) && (CL.sto === 'all' || c.s === CL.sto) && (CL.type === 'all' || (CL.type === 'A' ? c.t === 'Active' : c.t !== 'Active'));
  });
}
function clQ(list) {
  var q = CL.q.trim().toLowerCase(); if (!q) return list;
  return list.filter(function (c) { return (c.n + ' ' + c.g + ' ' + c.id).toLowerCase().indexOf(q) >= 0; });
}
function clWho(c) { return esc(shortU(c.u)) + ' · ' + esc(c.s) + ' · ' + esc(c.t); }
function clRow(c, right, sub, rank) {
  return '<div class="cl" onclick="clOpen(\'' + esc(c.id) + '\')">' + (rank ? '<span class="clr">' + rank + '</span>' : '') + '<div class="clm"><b>' + esc(c.n) + '</b><span>' + clWho(c) + '</span>' + (sub ? '<div class="cls">' + sub + '</div>' : '') + '</div><div class="clv">' + right + '</div></div>';
}
function renderCL() {
  [].forEach.call($('clTabs').children, function (b) { b.classList.toggle('on', b.getAttribute('data-t') === CL.tab); });
  var d = CL.d, base = clBase(), W = base.filter(function (c) { return c.c === 'Recoverable'; }), sub = CL.sub[CL.tab], pills = [], list = [], html = '', rows = [], cols = [], F = d.freshDays;
  var P = function (k, t, n) { pills.push('<button class="pill' + (sub === k ? ' on' : '') + '" onclick="clSub(\'' + k + '\')">' + t + (n != null ? ' <em>' + n + '</em>' : '') + '</button>'); };
  var sum = function (a, f) { return a.reduce(function (s, x) { return s + f(x); }, 0); };
  if (CL.tab === 'rec') {
    var made = W.filter(function (c) { return CL.rec[c.id]; });
    P('made', 'Recovery made', made.length); P('unit', 'By Unit'); P('sto', 'STO ranking'); P('none', 'Highest pending · no recovery');
    if (sub === 'made') {
      list = clQ(made).sort(function (a, b) { return CL.rec[b.id].amt - CL.rec[a.id].amt; });
      html = clHead(clN(list.length, 'case'), '₹' + short(sum(list, function (c) { return CL.rec[c.id].amt; })) + ' recovered');
      html += list.slice(0, CL.lim).map(function (c, i) { var r = CL.rec[c.id]; return clRow(c, '<b class="grn">₹' + short(r.amt) + '</b><small>of ₹' + short(c.p) + '</small>', esc(r.m) + ' · ' + rvDmy(r.d) + (r.n > 1 ? ' · ' + r.n + ' entries' : ''), i + 1); }).join('');
      cols = ['#', 'Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Recovered this month (Rs)', 'Entries', 'Last mode', 'Last date'];
      rows = list.map(function (c, i) { var r = CL.rec[c.id]; return [i + 1, c.u, c.s, c.t, c.id, c.g, c.n, c.p, r.amt, r.n, r.m, rvDmy(r.d)]; });
    } else if (sub === 'unit' || sub === 'sto') {
      var groups = {};
      W.forEach(function (c) { var k = sub === 'unit' ? c.u : c.u + '|' + c.s; var g = groups[k] = groups[k] || { u: c.u, s: c.s, cases: 0, pend: 0, rec: 0, made: 0 }; g.cases++; g.pend += c.p; if (CL.rec[c.id]) { g.rec += CL.rec[c.id].amt; g.made++; } });
      CL.groups = { sub: sub };
      list = Object.keys(groups).map(function (k) { var g = groups[k]; g.tgt = g.pend * d.targetPct / 100; g.p = g.tgt ? g.rec * 100 / g.tgt : 0; return g; }).sort(function (a, b) { return b.rec - a.rec || b.p - a.p; });
      CL.groups.list = list;
      html = clHead(list.length + (sub === 'unit' ? ' Units' : ' STOs'), '₹' + short(sum(list, function (g) { return g.rec; })) + ' recovered');
      html += list.map(function (g, i) {
        return '<div class="cl" onclick="clGo(' + i + ')"><span class="clr' + (i < 3 && g.rec ? ' md md' + (i + 1) : '') + '">' + (i + 1) + '</span><div class="clm"><b>' + esc(sub === 'unit' ? g.u : shortU(g.u) + ' · ' + g.s) + '</b><span>' + g.made + ' of ' + g.cases + ' cases recovered · target ₹' + short(g.tgt) + '</span><div class="bar"><i style="width:' + Math.min(100, g.p).toFixed(0) + '%"></i></div></div><div class="clv"><b class="grn">₹' + short(g.rec) + '</b><small>' + g.p.toFixed(1) + '% of target</small></div></div>';
      }).join('');
      cols = ['#', 'Unit'].concat(sub === 'sto' ? ['STO'] : []).concat(['Recoverable cases', 'Cases with recovery', 'Pending (Rs)', 'Target (Rs)', 'Recovered (Rs)', '% of target']);
      rows = list.map(function (g, i) { return [i + 1, g.u].concat(sub === 'sto' ? [g.s] : []).concat([g.cases, g.made, g.pend, Math.round(g.tgt), g.rec, Number(g.p.toFixed(1))]); });
    } else {
      list = clQ(W.filter(function (c) { return !CL.rec[c.id]; })).sort(function (a, b) { return b.p - a.p; });
      html = clHead(clN(list.length, 'case') + ' without recovery', '₹' + short(sum(list, function (c) { return c.p; })) + ' pending');
      html += list.slice(0, CL.lim).map(function (c, i) { return clRow(c, '<b>₹' + short(c.p) + '</b><small>pending</small>', 'Last action: ' + rvLast(c) + ' · ' + rvLed(c), i + 1); }).join('');
      cols = ['#', 'Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Ledger status'];
      rows = list.map(function (c, i) { return [i + 1, c.u, c.s, c.t, c.id, c.g, c.n, c.p, c.lo ? ({ A: 'Adjustable', P: 'PMT-09', C: 'Credit only', B: 'Break-up needed', N: 'No balance' }[c.lg] || '') : 'Never checked']; });
    }
  } else if (CL.tab === 'act') {
    var done = W.filter(function (c) { return CL.act[c.id]; }), kinds = {};
    done.forEach(function (c) { CL.act[c.id].forEach(function (a) { var k = rvKind(a.a); kinds[k] = (kinds[k] || 0) + 1; }); });
    P('done', 'Actions taken', done.length); P('none', 'No action this month', W.length - done.length);
    if (sub === 'done') {
      html += '<div class="clk"><select onchange="CL.akind=this.value;CL.lim=50;renderCL()"><option value="all">All action types</option>' + RV_ACT.map(function (k) { return kinds[k[0]] ? '<option value="' + esc(k[0]) + '"' + (CL.akind === k[0] ? ' selected' : '') + '>' + esc(k[0]) + ' (' + kinds[k[0]] + ')</option>' : ''; }).join('') + '</select></div>';
      var hasK = function (c) { return CL.akind === 'all' || CL.act[c.id].some(function (a) { return rvKind(a.a) === CL.akind; }); };
      list = clQ(done.filter(hasK)).sort(function (a, b) { return CL.act[b.id][0].d < CL.act[a.id][0].d ? -1 : 1; });
      html += clHead(clN(list.length, 'case'), clN(sum(list, function (c) { return CL.act[c.id].length; }), 'action'));
      html += list.slice(0, CL.lim).map(function (c) {
        var A = CL.act[c.id];
        return clRow(c, '<b>' + A.length + '</b><small>action' + (A.length > 1 ? 's' : '') + '</small>', A.slice(0, 3).map(function (a) { return '<span class="chipx">' + ic(rvIcon(a.a)) + ' ' + esc(rvStep(a.a)) + ' · ' + rvDmy(a.d).slice(0, 5) + '</span>'; }).join('') + (A.length > 3 ? ' +' + (A.length - 3) : '') + (A[0].r ? '<br><i class="clrm">' + esc(A[0].r) + '</i>' : ''));
      }).join('');
      cols = ['Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Actions this month', 'Action', 'Date', 'Remarks', 'By'];
      list.forEach(function (c) { CL.act[c.id].forEach(function (a) { rows.push([c.u, c.s, c.t, c.id, c.g, c.n, c.p, CL.act[c.id].length, a.a, rvDmy(a.d), a.r || '', a.b || '']); }); });
    } else {
      list = clQ(W.filter(function (c) { return !CL.act[c.id]; })).sort(function (a, b) { return b.p - a.p; });
      html = clHead(clN(list.length, 'case') + ' without action', '₹' + short(sum(list, function (c) { return c.p; })) + ' pending');
      html += list.slice(0, CL.lim).map(function (c) { return clRow(c, '<b>₹' + short(c.p) + '</b><small>pending</small>', 'Last action: ' + rvLast(c)); }).join('');
      cols = ['Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Last step', 'Last step date', 'Spot visit date'];
      rows = list.map(function (c) { return [c.u, c.s, c.t, c.id, c.g, c.n, c.p, c.st, rvDmy(c.sd), rvDmy(c.sv)]; });
    }
  } else if (CL.tab === 'led') {
    var due = function (c) { var x = rvDays(c.as, d.today); return c.lg === 'A' && x !== null && x >= d.setoffDays; };
    var stale = function (c) { var x = rvDays(c.lo, d.today); return !c.lo || x >= F; };
    var LG = [['A', 'Adjustable now', function (c) { return c.lg === 'A'; }], ['due', 'Set-off due ' + d.setoffDays + '+ days', due], ['P', 'PMT-09 needed', function (c) { return c.lg === 'P'; }],
      ['C', 'Credit only (int./penalty)', function (c) { return c.lg === 'C'; }], ['B', 'Break-up needed', function (c) { return c.lg === 'B'; }], ['N', 'No balance', function (c) { return c.lo && c.lg === 'N'; }],
      ['never', 'Never checked', function (c) { return !c.lo; }], ['stale', 'Not checked ' + F + '+ days', stale]];
    LG.forEach(function (g) { P(g[0], g[1], W.filter(g[2]).length); });
    var g = LG.find(function (x) { return x[0] === sub; }) || LG[0];
    list = clQ(W.filter(g[2])).sort(function (a, b) { return (b.adj - a.adj) || (b.cash + b.cr - a.cash - a.cr) || (b.p - a.p); });
    var adjT = sum(list, function (c) { return c.adj; });
    html = clHead(clN(list.length, 'case'), adjT ? '₹' + short(adjT) + ' adjustable' : '₹' + short(sum(list, function (c) { return c.p; })) + ' pending');
    html += list.slice(0, CL.lim).map(function (c) {
      var x = rvDays(c.as, d.today), y = rvDays(c.lo, d.today);
      var right = c.lg === 'A' ? '<b class="grn">₹' + short(c.adj) + '</b><small>' + (x !== null ? (x >= d.setoffDays ? '<span class="red">' + x + ' days</span>' : x + ' days') : '') + '</small>' : '<b>₹' + short(c.p) + '</b><small>pending</small>';
      return clRow(c, right, c.lo ? 'Cash ₹' + short(c.cash) + ' · Credit ₹' + short(c.cr) + ' · checked ' + (y === 0 ? 'today' : y + ' days ago') + (c.na ? '<br><i class="clrm">' + esc(c.na) + '</i>' : '') : '<span class="red">Ledger never checked</span>');
    }).join('');
    cols = ['Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Cash (Rs)', 'Credit (Rs)', 'Adjustable (Rs)', 'Adjustable since', 'Checked on', 'Reason not adjusted'];
    rows = list.map(function (c) { return [c.u, c.s, c.t, c.id, c.g, c.n, c.p, c.lo ? c.cash : '', c.lo ? c.cr : '', c.adj, rvDmy(c.as), rvDmy(c.lo), c.na]; });
  } else {
    var isChg = function (c) { return c.ds === 'done' && c.cp && c.cp !== c.c; }, isPend = function (c) { return c.ds !== 'done'; };
    d.categories.forEach(function (k) { P(k, RV_CATS[k] || k, base.filter(function (c) { return c.c === k; }).length); });
    P('chg', 'Changed by STOs', base.filter(isChg).length);
    var np = base.filter(isPend).length; if (np || sub === 'pend') P('pend', 'Pending with STO', np);
    list = clQ(base.filter(sub === 'chg' ? isChg : sub === 'pend' ? isPend : function (c) { return c.c === sub; })).sort(function (a, b) { return b.p - a.p; });
    html = clHead(clN(list.length, 'case'), '₹' + short(sum(list, function (c) { return c.p; })) + ' pending');
    html += list.slice(0, CL.lim).map(function (c) {
      var info = sub === 'chg' ? '<span class="chipx">' + esc(RV_CATS[c.cp] || c.cp) + ' → <b>' + esc(RV_CATS[c.c] || c.c) + '</b></span>' + (c.rs ? '<br><i class="clrm">Reason: ' + esc(c.rs) + '</i>' : '') : sub === 'pend' ? 'Proposed: ' + esc(RV_CATS[c.c] || c.c) : (c.cd ? esc(c.cd) : '');
      return clRow(c, '<b>₹' + short(c.p) + '</b><small>pending</small>', info);
    }).join('');
    cols = ['Unit', 'STO', 'Type', 'Demand ID', 'GSTIN', 'Legal Name', 'Pending (Rs)', 'Category', 'Details', 'Proposed category', 'Reason for change'];
    rows = list.map(function (c) { return [c.u, c.s, c.t, c.id, c.g, c.n, c.p, c.c, c.cd, c.cp, c.rs]; });
  }
  if (list.length > CL.lim && !(CL.tab === 'rec' && (sub === 'unit' || sub === 'sto'))) html += '<button class="lnk" onclick="CL.lim+=100;renderCL()">Show more (' + (list.length - CL.lim) + ' more) ›</button>';
  if (!list.length) html += '<div class="empty">No cases in this list</div>';
  CL.xl = { cols: cols, rows: rows, name: ({ rec: 'Recovery', act: 'Actions', led: 'Ledger', cat: 'Category' }[CL.tab]) + '-' + (pills.length ? sub : '') };
  $('clPills').innerHTML = pills.join('');
  $('clSrch').classList.toggle('hide', CL.tab === 'rec' && (sub === 'unit' || sub === 'sto'));
  $('clBody').innerHTML = html;
}
function clGo(i) {
  var g = CL.groups.list[i]; if (!g) return;
  if (S.role !== 'unit') { CL.unit = g.u; $('clUnit').value = g.u; }
  clStoOpts(); CL.sto = CL.groups.sub === 'sto' ? g.s : 'all'; $('clSto').value = CL.sto;
  CL.sub.rec = 'made'; CL.lim = 50; renderCL(); window.scrollTo(0, 0);
}
function rvIcon(s) { var k = rvKind(s); return { 'Spot visit': 'pin', 'Notice / reminder': 'mail', 'Bank attachment': 'bank', 'ITC set-off': 'swap', 'Third-party attachment': 'users', 'Stock attachment': 'box', 'Share / MF attachment': 'trend', 'Property attachment': 'home', 'RRC (other jurisdiction)': 'globe', 'Police complaint (FIR)': 'siren', 'Payment by taxpayer': 'card' }[k] || 'edit'; }
function clN(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function clHead(a, b) { return '<div class="clh"><div><b>' + a + '</b><span>' + b + '</span></div><button onclick="clXl()">' + ic('download') + ' Excel</button></div>'; }
function clXl() {
  var x = CL.xl; if (!x || !x.rows.length) { toast('Nothing to download'); return; }
  busy(true);
  loadXlsx().then(function (X) {
    var ws = X.utils.aoa_to_sheet([x.cols].concat(x.rows)); ws['!cols'] = x.cols.map(function (c) { return { wch: /Name/.test(c) ? 38 : /Unit/.test(c) ? 20 : /Remarks|Reason|Details|Action$/.test(c) ? 34 : 15 }; });
    var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'List');
    var scope = (CL.unit === 'all' ? 'All-Units' : CL.unit) + (CL.sto === 'all' ? '' : '-' + CL.sto);
    X.writeFile(wb, (x.name + '-' + scope + '-' + CL.d.monthLabel).replace(/[^\w-]+/g, '-') + '.xlsx'); busy(false);
  }).catch(function (e) { busy(false); toast(String(e)); });
}
function clOpen(id) {
  var c = CL.d.cases.find(function (x) { return x.id === id; }); if (!c) return;
  var go = function (data) { S.unit = c.u; S.d = data; openCase(id); };
  if (CL.cache[c.u]) return go(CL.cache[c.u]);
  busy(true);
  api('getCases', c.u, 'ALL', S.pin, S.role).then(function (data) { busy(false); CL.cache[c.u] = data; go(data); }).catch(function (e) { busy(false); toast(String(e)); });
}
