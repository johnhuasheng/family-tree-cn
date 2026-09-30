
/* ===== 页面 ===== */
var RESET = '__RESET__';
var FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;900&display=swap">\n';
var THREE_TAG = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></' + 'script>\n';
var HOSTS = '<div id="app"></div><div id="drawer-host"></div><div id="modal-host"></div><div id="toast" role="status" aria-live="polite"></div>\n';
var LS_KEY = 'family-generations-v1';
var NOW = new Date().getFullYear();
var SIDES = [
  { k: 'pat', name: '父系', sub: '爸爸那边' },
  { k: 'core', name: '本家', sub: '自家人' },
  { k: 'mat', name: '母系', sub: '妈妈那边' },
  { k: 'inlaw', name: '姻亲', sub: '配偶与亲家那边' }
];
var SIDE_NAME = { pat: '父系 · 爸爸那边', core: '本家', mat: '母系 · 妈妈那边', inlaw: '姻亲' };
var GEN_NAME = { '4': '高祖辈', '3': '曾祖辈', '2': '祖辈', '1': '父辈', '0': '同辈', '-1': '子辈', '-2': '孙辈', '-3': '曾孙辈', '-4': '玄孙辈' };
var CN_NUM = ['零', '一', '两', '三', '四', '五', '六'];
var CALC_KEYS = [['f','爸爸'],['m','妈妈'],['h','老公'],['w','老婆'],['s','儿子'],['ob','哥哥'],['lb','弟弟'],['os','姐姐'],['ls','妹妹'],['d','女儿']];

var ORIGINAL = JSON.parse(document.getElementById('family-data').textContent);
var DATA = clone(ORIGINAL);
var M = {};
var S = { center: DATA.root, sel: null, edit: false, dirty: false, mode: 'view', calc: [], calcG: null, saving: false, view: 'table' };
try { if (location.hash === '#3d') S.view = '3d'; else if (localStorage.getItem('family-view') === '3d') S.view = '3d'; } catch (e) {}
var ART = null;

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function reindex(){ M = {}; DATA.people.forEach(function(p){ M[p.id] = p; }); if (!M[S.center]) S.center = DATA.root; if (S.sel && !M[S.sel]) S.sel = null; }
function commit(){ DATA.people = Object.keys(M).map(function(k){ return M[k]; }); DATA.sample = false; S.dirty = true; if (S.mode === 'local') saveLocal(); reindex(); }
function genName(g){ return GEN_NAME[String(g)] || (g > 0 ? '上' + g + '代' : '下' + (-g) + '代'); }
function genPhrase(g){ if (g === 0) return '同一辈'; return (g > 0 ? '高' : '低') + (CN_NUM[Math.abs(g)] || Math.abs(g)) + '辈'; }
function dispName(p){ return p.name || ''; }
function centerLabel(){ return S.center === DATA.root ? '我' : (M[S.center].name || '这位亲人'); }

function toast(msg){
  var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(function(){ t.classList.remove('show'); }, 3200);
}

/* ---------- 计算整张图 ---------- */
function computeAll(){
  var prev = bfs(M, S.center), rows = [];
  var rootPrev = bfs(M, DATA.root);
  var rootToCenter = relation(M, DATA.root, S.center, rootPrev);
  var centerAbs = rootToCenter ? rootToCenter.gen : 0;
  DATA.people.forEach(function(p){
    var r = relation(M, S.center, p.id, prev);
    if (!r) return;
    var toks = r.toks, last = toks[toks.length - 1];
    var anchor = S.center, spouseFlag = 0;
    if (toks.length){
      var lb = baseCode(last.c);
      if (lb === 'h' || lb === 'w'){ spouseFlag = 1; anchor = toks.length > 1 ? toks[toks.length - 2].node : S.center; }
      else anchor = p.id;
    }
    r.p = p; r.sortKey = [ageKey(M[anchor]), anchor, spouseFlag];
    rows.push(r);
  });
  return { rows: rows, centerAbs: centerAbs, prev: prev };
}
function pathSet(prev, id){
  var set = {}; var raw = rawPath(prev, id); if (!raw) return set;
  set[S.center] = 1; raw.forEach(function(t){ set[t.node] = 1; }); return set;
}

/* ---------- 渲染 ---------- */
function render(){
  reindex();
  var all = computeAll(), rows = all.rows;
  var onPath = S.sel ? pathSet(all.prev, S.sel) : {};
  var gens = {}; rows.forEach(function(r){ (gens[r.gen] = gens[r.gen] || []).push(r); });
  var keys = Object.keys(gens).map(Number).sort(function(a, b){ return b - a; });
  var named = DATA.people.filter(function(p){ return !p.ph || p.name; });
  var canEdit = S.mode !== 'view';

  var h = '';
  var sideCount = { pat: 0, core: 0, mat: 0, inlaw: 0 };
  rows.forEach(function(r){ if (r.p.id !== S.center) sideCount[r.side]++; });
  h += '<div class="wrap' + (FIRST_RENDER ? ' intro' : '') + '"><header class="masthead"><div class="brand"><span class="seal" aria-hidden="true">谱</span><div>';
  h += '<p class="eyebrow">以' + esc(centerLabel()) + '为中心 · 家族辈分</p>';
  h += '<h1>' + esc(DATA.title || '我的家族辈分谱') + '</h1>';
  h += '<p class="stats"><span><b>' + named.length + '</b>位亲人</span><span><b>' + keys.length + '</b>代同谱</span><span>点任意一位，看怎么称呼</span></p></div></div>';
  h += '<div class="controls"><label class="persp"><span>视角</span><select id="center-select" aria-label="站在谁的角度看">';
  var opts = rows.slice().filter(function(r){ return !r.p.ph || r.p.name; }).sort(function(a, b){ return b.gen - a.gen || a.sortKey[0] - b.sortKey[0]; });
  var rp = bfs(M, DATA.root);
  opts.forEach(function(r){
    var rr = relation(M, DATA.root, r.p.id, rp);
    var label = r.p.id === DATA.root ? '我（' + (r.p.name || '自己') + '）' : (r.p.name || '未填名字') + '（我的' + rr.term.t.split(' / ')[0] + '）';
    h += '<option value="' + r.p.id + '"' + (r.p.id === S.center ? ' selected' : '') + '>' + esc(label) + '</option>';
  });
  h += '</select></label>';
  if (canEdit) h += S.edit ? '<button class="btn primary" data-act="add">＋ 添加亲属</button><button class="btn" data-act="settings">设置与备份</button><button class="btn ghost" data-act="edit-off">完成编辑</button>' : '<button class="btn" data-act="edit-on">编辑家谱</button>';
  h += '</div></header>';

  var ICON_TABLE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M2 6.5h12M6.5 6.5v7"/></svg>';
  var ICON_3D = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.8 13.6 5v6L8 14.2 2.4 11V5z"/><path d="M2.4 5 8 8.2 13.6 5M8 8.2v6"/></svg>';
  h += '<nav class="viewbar"><div class="seg" role="tablist" aria-label="查看方式"><button role="tab" aria-selected="' + (S.view === 'table') + '" data-act="view" data-view="table">' + ICON_TABLE + '辈分表</button><button role="tab" aria-selected="' + (S.view === '3d') + '" data-act="view" data-view="3d">' + ICON_3D + '3D 关系图</button></div>';
  h += S.view === '3d' ? '<p class="hint"><span>' + esc(centerLabel()) + '在正中间，亲人一层层向外延伸</span><span>上下是辈分，方位是哪一边</span></p></nav>'
    : '<p class="hint"><span>越往上辈分越高</span><span>左边爸爸家，右边妈妈家</span><span>填出生年份可分清堂哥、堂弟</span></p></nav>';

  if (S.center !== DATA.root){
    h += '<div class="viewing"><span>现在站在 <b>' + esc(centerLabel()) + '</b> 的角度，每张卡片写的是 TA 该怎么称呼对方。</span><button class="btn" data-act="center-root">回到我的角度</button></div>';
  }
  if (DATA.sample){
    h += '<div class="notice"><span class="stamp">示例</span><p><b>这是一份示例家谱，</b>名字都是虚构的，用来演示效果。' + (canEdit ? '点「编辑家谱」直接改，或清空后从你自己开始填。' : '') + '</p>' + (canEdit ? '<button class="btn danger" data-act="clear-ask">清空示例，从我开始</button>' : '') + '</div>';
  }

  if (S.view === '3d') h += '<div id="stage-slot"></div>';
  else {
  var ci = 0;
  h += '<section class="panel"><div class="chart-scroll"><div class="chart" role="list"><div class="corner">辈分</div>';
  SIDES.forEach(function(s){ h += '<div class="colhead ' + s.k + '"><strong>' + s.name + '</strong><span>' + s.sub + '</span><em>' + sideCount[s.k] + ' 人</em></div>'; });
  keys.forEach(function(g, gi){
    var abs = g + all.centerAbs, zb = (DATA.zibei || {})[String(abs)] || '';
    h += '<div class="band' + (gi === 0 ? ' first' : '') + (gi === keys.length - 1 ? ' last' : '') + (g === 0 ? ' is-zero' : '') + '"><div class="gen' + (g === 0 ? ' is-zero' : '') + '"><span class="gen-num">' + (g > 0 ? '+' + g : g) + '</span><span class="gen-name">' + genName(g) + '</span>';
    if (S.edit) h += '<button class="zibei' + (zb ? '' : ' empty') + '" data-act="zibei" data-gen="' + abs + '" title="设置这一辈的字辈">' + (zb ? esc(zb) + '字辈' : '＋字辈') + '</button>';
    else if (zb) h += '<span class="zibei" title="这一辈名字里共用的字">' + esc(zb) + '字辈</span>';
    h += '</div>';
    SIDES.forEach(function(s){
      var list = gens[g].filter(function(r){ return r.side === s.k; }).sort(function(a, b){
        return a.sortKey[0] - b.sortKey[0] || (a.sortKey[1] < b.sortKey[1] ? -1 : a.sortKey[1] > b.sortKey[1] ? 1 : 0) || a.sortKey[2] - b.sortKey[2];
      });
      h += '<div class="cell ' + s.k + (list.length ? '' : ' empty') + (g === 0 ? ' row0' : '') + '"><span class="cell-tag">' + s.name + ' · ' + s.sub + '</span>';
      // 同一个「锚点」下的本人和配偶放成一对，中间用线连起来
      for (var i = 0; i < list.length; i++){
        var a = list[i], b = list[i + 1];
        if (b && b.sortKey[1] === a.sortKey[1] && b.sortKey[2] === 1 && a.sortKey[2] === 0){
          h += '<div class="pair">' + cardHTML(a, onPath, ci++) + '<span class="tie" aria-hidden="true" style="--i:' + ci + '"></span>' + cardHTML(b, onPath, ci++) + '</div>'; i++;
        } else h += cardHTML(a, onPath, ci++);
      }
      h += '</div>';
    });
    h += '</div>';
  });
  h += '</div></div></section>';
  }

  h += calcHTML();
  h += '<footer class="foot"><span>称呼按普通话里最常见的叫法推算，各地习惯不同（比如姥爷 / 外公、姑妈 / 姑姑），以你家里的叫法为准。';
  if (S.mode === 'local') h += ' 你在这里填写的家人信息只保存在你自己的浏览器里，不会上传到任何地方；换电脑或清除浏览器数据前，记得在「设置与备份」里复制一份备份。';
  h += '</span></footer></div>';

  if (S.edit && S.mode === 'publish' && S.dirty){
    h += '<div class="savebar" role="region" aria-label="保存"><p>有还没保存的修改。保存后，所有打开这个页面的人都能看到。</p><button class="btn" data-act="discard">放弃修改</button><button class="btn seal-btn" data-act="save"' + (S.saving ? ' disabled' : '') + '>' + (S.saving ? '正在保存…' : '保存到页面') + '</button></div>';
  }
  var slot0 = document.getElementById('stage-slot'); if (slot0 && slot0.firstChild) slot0.removeChild(slot0.firstChild);
  document.getElementById('app').innerHTML = h;
  var slot = document.getElementById('stage-slot');
  if (slot) G3.show(slot, all); else G3.hide();
  renderCalcOut();
  renderDrawer();
  FIRST_RENDER = false;
}
var FIRST_RENDER = true;

function cardHTML(r, onPath, idx){
  var p = r.p, isC = p.id === S.center;
  var cls = 'pcard' + (isC ? ' is-center' : '') + (p.ph && !p.name ? ' ph' : '') + (S.sel === p.id ? ' is-sel' : (onPath[p.id] ? ' on-path' : ''));
  var term = isC ? (S.center === DATA.root ? '我' : '本人') : r.term.t;
  var via = '';
  if (isC) via = '中心';
  else if (r.codes.length === 1) via = r.term.alt ? r.term.alt.split('、')[0] : '';
  else if (r.sortKey[2] === 1){
    // 配偶写成「伯父的妻子」，比「爸爸的哥哥的妻子」短也更好懂
    var last = baseCode(r.codes[r.codes.length - 1]);
    via = termOf(r.codes.slice(0, -1)).t.split(' / ')[0] + '的' + (last === 'h' ? '丈夫' : '妻子');
  } else via = describe(r.codes);
  var h = '<button class="' + cls + '" role="listitem" data-act="sel" data-id="' + p.id + '" style="--i:' + (idx || 0) + '" title="' + esc(p.name || '') + '">';
  h += '<span class="term">' + esc(term) + '</span>';
  if (r.term.amb && !isC) h += '<span class="amb">填上出生年份可确定</span>';
  if (via) h += '<span class="via">' + esc(via) + '</span>';
  return h + '</button>';
}

var CALC_GROUPS = [['长辈', [['f','爸爸'],['m','妈妈']]], ['平辈', [['ob','哥哥'],['lb','弟弟'],['os','姐姐'],['ls','妹妹']]], ['配偶', [['h','老公'],['w','老婆']]], ['晚辈', [['s','儿子'],['d','女儿']]]];
function calcHTML(){
  var h = '<section class="panel calc" aria-labelledby="calc-title"><div class="calc-in"><h2 id="calc-title">称呼计算器</h2><p class="lead">没录进家谱的亲戚，也能一步步点出来，比如「妈妈 → 哥哥 → 女儿」。</p>';
  var myG = calcGender();
  h += '<div class="kgroup"><span class="klabel">我是</span><div class="gseg" role="group" aria-label="我的性别"><button data-act="calc-g" data-g="M" aria-pressed="' + (myG === 'M') + '">男</button><button data-act="calc-g" data-g="F" aria-pressed="' + (myG === 'F') + '">女</button></div><span class="gnote">决定 TA 叫你侄子还是侄女</span></div>';
  CALC_GROUPS.forEach(function(g){
    h += '<div class="kgroup"><span class="klabel">' + g[0] + '</span><div class="krow">';
    g[1].forEach(function(k){ h += '<button class="key" data-act="calc" data-c="' + k[0] + '">' + k[1] + '</button>'; });
    h += '</div></div>';
  });
  h += '<div class="kact"><button class="btn" data-act="calc-back">退一步</button><button class="btn ghost" data-act="calc-clear">清空</button></div></div><div class="calc-out" id="calc-out" aria-live="polite"></div></section>';
  return h;
}
function calcGender(){ return S.calcG || (M[DATA.root] && M[DATA.root].g) || 'M'; }
function syncGenderButtons(){
  var g = calcGender();
  Array.prototype.forEach.call(document.querySelectorAll('[data-act="calc-g"]'), function(b){ b.setAttribute('aria-pressed', String(b.dataset.g === g)); });
}
function renderCalcOut(){
  var el = document.getElementById('calc-out'); if (!el) return;
  if (!S.calc.length){
    el.innerHTML = '<div class="chainline"><span class="chip me">我</span><span class="arrow">→ 点按钮开始</span></div><div class="calc-term" style="color:var(--faint)">？</div><div class="calc-meta">每点一下，就往外走一层关系。结果会告诉你：该叫 TA 什么、TA 叫你什么、差几辈。</div>';
    return;
  }
  var g = calcGender(), c = calcChain(S.calc, g);
  var line = '<span class="chip me">我</span>';
  S.calc.forEach(function(k){ line += '<span class="arrow">的</span><span class="chip">' + WORD_CALC[k] + '</span>'; });
  var h = '<div class="chainline">' + line + '</div>';
  if (!c.codes.length){
    h += '<div class="calc-term">就是你自己</div><div class="calc-meta">这一串关系绕了一圈，又回到了你本人。</div>';
    el.innerHTML = h; return;
  }
  var t = termOf(c.codes), back = termOf(invertChain(c.codes, g));
  var genTxt = c.gen === 0 ? '同辈 · 和我同一辈' : genName(c.gen) + ' · 比我' + genPhrase(c.gen);
  h += '<div class="calc-res"><div class="res-main"><span class="res-lbl">我该叫 TA</span><span class="calc-term">' + esc(t.t) + '</span>' + (t.alt ? '<span class="res-alt">也叫 ' + esc(t.alt) + '</span>' : '') + '</div>';
  h += '<div class="res-side"><div><span class="res-lbl">TA 叫我</span><b>' + esc(back.t) + '</b></div><div><span class="res-lbl">辈分</span><span>' + esc(genTxt) + '</span></div></div></div>';
  var notes = [];
  if (t.amb || back.amb) notes.push('带「/」的要看两人谁年纪大');
  if (c.selfHint) notes.push('这一步也可能又指回同一个人');
  if (!t.exact) notes.push('这层关系没有常用的专门称呼，按关系描述');
  if (notes.length) h += '<div class="calc-meta">' + esc(notes.join(' · ')) + '</div>';
  el.innerHTML = h;
}
var WORD_CALC = { f: '爸爸', m: '妈妈', h: '老公', w: '老婆', s: '儿子', d: '女儿', ob: '哥哥', lb: '弟弟', os: '姐姐', ls: '妹妹' };

/* ---------- 详情 ---------- */
function renderDrawer(){
  var host = document.getElementById('drawer-host');
  if (!S.sel || !M[S.sel]){ host.innerHTML = ''; return; }
  var p = M[S.sel], isC = p.id === S.center;
  var r = relation(M, S.center, p.id), back = isC ? null : relation(M, p.id, S.center);
  var cl = centerLabel();
  var h = '<aside class="drawer side-' + (isC ? 'core' : r.side) + '" role="dialog" aria-label="亲人详情"><button class="d-close" data-act="close" aria-label="关闭">×</button><div class="d-head">';
  h += '<div class="d-eyebrow">' + (isC ? '当前视角的中心' : SIDE_NAME[r.side] + ' · ' + esc(cl) + '称呼 TA 为') + '</div>';
  h += '<h2 class="d-term">' + esc(isC ? (S.center === DATA.root ? '我' : '本人') : r.term.t) + '</h2>';
  if (!isC && r.term.alt) h += '<div class="d-alt">也叫 ' + esc(r.term.alt) + '</div>';
  h += '<div class="d-name">' + (p.name ? esc(p.name) : '<span style="color:var(--muted)">未填名字</span>');
  if (p.yr) h += ' <small>' + p.yr + ' 年生 · ' + Math.max(0, NOW - p.yr) + ' 岁</small>';
  h += '</div></div>';
  if (!isC){
    h += '<div class="chainline">';
    h += '<span class="chip me">' + esc(cl) + '</span>';
    r.toks.forEach(function(t){
      var q = M[t.node], sub = relation(M, S.center, t.node);
      h += '<span class="arrow">→</span><span class="chip">' + esc(sub.term.t.split(' / ')[0]) + (q.name ? ' ' + esc(q.name) : '') + '</span>';
    });
    h += '</div>';
    h += '<dl class="facts">';
    h += '<dt>辈分</dt><dd>' + genName(r.gen) + ' · ' + (r.gen === 0 ? '和' + esc(cl) + '同一辈' : '比' + esc(cl) + genPhrase(r.gen)) + '</dd>';
    h += '<dt>哪一边</dt><dd><span class="side-dot" style="background:var(--' + r.side + ')"></span>' + SIDE_NAME[r.side] + '</dd>';
    h += '<dt>关系</dt><dd>' + esc(cl) + '的' + esc(describe(r.codes)) + '</dd>';
    if (back) h += '<dt>TA 叫' + (S.center === DATA.root ? '我' : '对方') + '</dt><dd><b>' + esc(back.term.t) + '</b></dd>';
    h += '</dl>';
  }
  if (p.note) h += '<p class="d-note">' + esc(p.note) + '</p>';
  if (p.ph && !p.name) h += '<p class="small">这个位置是为了把亲戚连起来自动加的，可以点「编辑资料」填上名字。</p>';
  h += '<div class="d-actions">';
  if (!isC && (!p.ph || p.name)) h += '<button class="btn primary" data-act="center-here">站在 TA 的角度看</button>';
  if (S.edit){
    h += '<button class="btn" data-act="edit-person">编辑资料</button><button class="btn" data-act="add-to">给 TA 添加亲属</button>';
    if (p.id !== DATA.root) h += '<button class="btn danger" data-act="del-ask">删除</button>';
  }
  h += '</div></aside>';
  host.innerHTML = h;
}

/* ---------- 弹窗 ---------- */
function openModal(html){ document.getElementById('modal-host').innerHTML = '<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>'; var f = document.querySelector('.modal input, .modal select'); if (f) f.focus(); }
function closeModal(){ document.getElementById('modal-host').innerHTML = ''; }

function personOptions(selId){
  var rp = bfs(M, DATA.root), out = '';
  var list = DATA.people.map(function(p){ return { p: p, r: relation(M, DATA.root, p.id, rp) }; }).filter(function(x){ return x.r; });
  list.sort(function(a, b){ return b.r.gen - a.r.gen || ageKey(a.p) - ageKey(b.p); });
  list.forEach(function(x){
    var t = x.p.id === DATA.root ? '我' : x.r.term.t.split(' / ')[0];
    var label = x.p.id === DATA.root ? '我' + (x.p.name ? '（' + x.p.name + '）' : '') : t + '（' + (x.p.name || '未填名字') + '）';
    out += '<option value="' + x.p.id + '"' + (x.p.id === selId ? ' selected' : '') + '>' + esc(label) + '</option>';
  });
  return out;
}
function openAdd(anchorId){
  var h = '<h2>添加亲属</h2>';
  h += '<div class="field"><span>TA 和谁是什么关系</span><div class="rel-row">TA 是<select id="f-anchor">' + personOptions(anchorId || DATA.root) + '</select>的<select id="f-rel">';
  Object.keys(REL_LABEL).forEach(function(k){ h += '<option value="' + k + '">' + REL_LABEL[k] + '</option>'; });
  h += '</select></div></div>';
  h += '<label class="field"><span>姓名（不知道可以先空着）</span><input id="f-name" maxlength="20" autocomplete="off"></label>';
  h += '<label class="field"><span>出生年份（大概也行，用来区分哥哥弟弟、堂哥堂弟）</span><input id="f-yr" inputmode="numeric" maxlength="4" placeholder="例如 1968" autocomplete="off"></label>';
  h += '<label class="field"><span>备注（住哪里、做什么，方便别人认人）</span><input id="f-note" maxlength="60" autocomplete="off"></label>';
  h += '<p class="preview" id="f-preview"></p><p class="err" id="f-err" hidden></p>';
  h += '<div class="m-actions"><button class="btn ghost" data-act="modal-close">取消</button><button class="btn primary" data-act="add-confirm">添加</button></div>';
  openModal(h); updatePreview();
}
function readAddForm(){
  var yr = parseInt(document.getElementById('f-yr').value, 10);
  return { anchor: document.getElementById('f-anchor').value, rel: document.getElementById('f-rel').value,
    info: { name: document.getElementById('f-name').value.trim(), yr: (yr > 1800 && yr <= NOW + 1) ? yr : null, note: document.getElementById('f-note').value.trim() } };
}
function updatePreview(){
  var el = document.getElementById('f-preview'); if (!el) return;
  var f = readAddForm(), M2 = clone(M), res = addRel(M2, f.anchor, f.rel, f.info);
  var err = document.getElementById('f-err');
  if (res.err){ el.hidden = true; err.hidden = false; err.textContent = res.err; return; }
  err.hidden = true; el.hidden = false;
  var r = relation(M2, DATA.root, res.id);
  el.innerHTML = '添加后，我称呼 TA 为 <b>' + esc(r ? r.term.t : '—') + '</b>' + (r && r.term.amb ? '<br><span class="small">填上出生年份就能确定是哪一个</span>' : '');
}
function openEdit(id){
  var p = M[id], isRoot = id === DATA.root;
  var h = '<h2>编辑资料</h2>';
  h += '<label class="field"><span>姓名</span><input id="e-name" maxlength="20" value="' + esc(p.name) + '" autocomplete="off"></label>';
  if (isRoot) h += '<label class="field"><span>性别（决定你的配偶叫老公还是老婆）</span><select id="e-g"><option value="M"' + (p.g === 'M' ? ' selected' : '') + '>男</option><option value="F"' + (p.g === 'F' ? ' selected' : '') + '>女</option></select></label>';
  h += '<label class="field"><span>出生年份</span><input id="e-yr" inputmode="numeric" maxlength="4" value="' + (p.yr || '') + '" autocomplete="off"></label>';
  h += '<label class="field"><span>备注</span><input id="e-note" maxlength="60" value="' + esc(p.note) + '" autocomplete="off"></label>';
  h += '<p class="err" id="e-err" hidden></p>';
  h += '<div class="m-actions"><button class="btn ghost" data-act="modal-close">取消</button><button class="btn primary" data-act="edit-confirm" data-id="' + id + '">保存资料</button></div>';
  openModal(h);
}
function openZibei(abs){
  var cur = (DATA.zibei || {})[String(abs)] || '';
  var h = '<h2>设置字辈</h2><p class="small">很多家族同一辈人的名字里共用一个字，比如「建国、建华、建军」都是「建」字辈。没有可以留空。</p>';
  h += '<label class="field"><span>这一辈的字</span><input id="z-val" maxlength="2" value="' + esc(cur) + '" autocomplete="off"></label>';
  h += '<div class="m-actions"><button class="btn ghost" data-act="modal-close">取消</button><button class="btn primary" data-act="zibei-confirm" data-gen="' + abs + '">确定</button></div>';
  openModal(h);
}
function openSettings(){
  var h = '<h2>设置与备份</h2>';
  h += '<label class="field"><span>家谱名称</span><input id="s-title" maxlength="20" value="' + esc(DATA.title || '') + '" autocomplete="off"></label>';
  h += '<div class="m-actions"><button class="btn primary" data-act="title-confirm">更新名称</button></div><hr class="sep">';
  h += '<div class="field"><span>备份：复制下面这段数据存好，以后可以原样导入</span><textarea id="s-export" rows="4" readonly>' + esc(JSON.stringify(DATA)) + '</textarea></div>';
  h += '<div class="m-actions"><button class="btn" data-act="copy-export">复制备份数据</button></div><hr class="sep">';
  h += '<div class="field"><span>导入：把备份数据粘贴到这里（会替换当前家谱）</span><textarea id="s-import" rows="4"></textarea></div><p class="err" id="s-err" hidden></p>';
  h += '<div class="m-actions"><button class="btn ghost" data-act="modal-close">关闭</button><button class="btn" data-act="import-confirm">导入</button></div>';
  openModal(h);
}

/* ---------- 保存 ---------- */
function buildDoc(){
  var style = document.getElementById('page-style').textContent;
  var code = document.getElementById('app-code').textContent;
  var json = JSON.stringify(DATA).replace(/</g, '\\u003c');
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + RESET + '</style></head><body>' +
    '<title>家族辈分谱</title>\n' + FONTS + '<style id="page-style">' + style + '</style>\n' + HOSTS +
    '<script type="application/json" id="family-data">' + json + '</' + 'script>\n' + THREE_TAG + '<script id="app-code">' + code + '</' + 'script>\n</body></html>';
}
function save(){
  if (!ART || S.saving) return;
  S.saving = true; render();
  try { sessionStorage.setItem('family-saved', '1'); } catch (e) {}
  ART.publish(buildDoc()).then(function(){ /* 页面会自动重新载入 */ }, function(e){
    S.saving = false;
    try { sessionStorage.removeItem('family-saved'); } catch (x) {}
    var c = e && e.code;
    if (c === 'conflict') toast('别处刚保存了新版本，正在载入最新内容');
    else if (['not_writer', 'not_granted', 'not_declared', 'consent_required', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0){ S.mode = 'view'; S.edit = false; toast('这份家谱你只能查看，修改不会保存'); }
    else if (c === 'rate_limited') toast('保存得太频繁了，请过一会儿再点保存');
    else if (c === 'too_large') toast('家谱数据太大，保存失败');
    else toast('保存没成功，请稍后再试一次');
    render();
  });
}
function saveLocal(){ try { localStorage.setItem(LS_KEY, JSON.stringify(DATA)); } catch (e) {} }
function loadLocal(){
  try { var s = localStorage.getItem(LS_KEY); if (s){ var d = JSON.parse(s); if (d && d.people && d.root) DATA = d; } } catch (e) {}
}

/* ---------- 交互 ---------- */
var delArmed = false, clearArmed = false;
document.addEventListener('click', function(ev){
  var el = ev.target.closest('[data-act]'); if (!el) return;
  var act = el.getAttribute('data-act');
  if (act === 'overlay'){ if (ev.target === el) closeModal(); return; }
  switch (act){
    case 'sel': S.sel = S.sel === el.dataset.id ? null : el.dataset.id; delArmed = false; render(); break;
    case 'close': S.sel = null; render(); break;
    case 'center-here': S.center = S.sel; render(); toast('已切换到 ' + centerLabel() + ' 的角度'); break;
    case 'center-root': S.center = DATA.root; render(); break;
    case 'edit-on': S.edit = true; render(); break;
    case 'edit-off': S.edit = false; render(); if (S.mode === 'publish' && S.dirty) toast('还有修改没保存，记得点「保存到页面」'); break;
    case 'add': openAdd(S.sel || S.center); break;
    case 'add-to': openAdd(S.sel); break;
    case 'modal-close': closeModal(); break;
    case 'add-confirm': {
      var f = readAddForm(), res = addRel(M, f.anchor, f.rel, f.info);
      if (res.err){ var e1 = document.getElementById('f-err'); e1.hidden = false; e1.textContent = res.err; return; }
      commit(); closeModal(); S.sel = res.id; render(); toast('已添加'); break;
    }
    case 'edit-person': openEdit(S.sel); break;
    case 'edit-confirm': {
      var p = M[el.dataset.id], yr = parseInt(document.getElementById('e-yr').value, 10);
      p.name = document.getElementById('e-name').value.trim();
      p.yr = (yr > 1800 && yr <= NOW + 1) ? yr : null;
      p.note = document.getElementById('e-note').value.trim();
      if (p.name) p.ph = false;
      var gs = document.getElementById('e-g');
      if (gs && gs.value !== p.g){
        var sp = p.sp && M[p.sp];
        if (sp && sp.g === gs.value){ var e2 = document.getElementById('e-err'); e2.hidden = false; e2.textContent = '已登记的配偶和你是同一性别，先删掉配偶再改性别。'; return; }
        p.g = gs.value;
        for (var k in M){ var q = M[k]; if (q.fa === p.id && p.g === 'F'){ q.fa = q.mo; q.mo = p.id; } else if (q.mo === p.id && p.g === 'M'){ q.mo = q.fa; q.fa = p.id; } }
      }
      commit(); closeModal(); render(); break;
    }
    case 'del-ask': {
      if (!delArmed){ delArmed = true; el.textContent = '再点一次确认删除'; return; }
      delArmed = false; var id = S.sel; removePerson(M, id, DATA.root); commit(); S.sel = null; render();
      toast(M[id] ? '已清空资料（TA 连着其他亲人，所以位置保留）' : '已删除'); break;
    }
    case 'zibei': openZibei(el.dataset.gen); break;
    case 'zibei-confirm': {
      DATA.zibei = DATA.zibei || {};
      var v = document.getElementById('z-val').value.trim();
      if (v) DATA.zibei[el.dataset.gen] = v; else delete DATA.zibei[el.dataset.gen];
      commit(); closeModal(); render(); break;
    }
    case 'settings': openSettings(); break;
    case 'title-confirm': { DATA.title = document.getElementById('s-title').value.trim() || '我的家族辈分谱'; commit(); render(); toast('名称已更新'); break; }
    case 'copy-export': {
      var ta = document.getElementById('s-export');
      var done = function(){ toast('备份数据已复制'); };
      var fallback = function(){ ta.focus(); ta.select(); toast('已选中，按 Ctrl+C / ⌘C 复制'); };
      try { navigator.clipboard.writeText(ta.value).then(done, fallback); } catch (e) { fallback(); }
      break;
    }
    case 'import-confirm': {
      var e3 = document.getElementById('s-err');
      try {
        var d = JSON.parse(document.getElementById('s-import').value);
        if (!d || !Array.isArray(d.people) || !d.root || !d.people.some(function(x){ return x.id === d.root; })) throw 0;
        DATA = d; S.center = d.root; S.sel = null; reindex(); commit(); closeModal(); render(); toast('已导入');
      } catch (x) { e3.hidden = false; e3.textContent = '这段数据看不懂，请粘贴完整的备份内容。'; }
      break;
    }
    case 'clear-ask': {
      if (!clearArmed){ clearArmed = true; el.textContent = '确定清空？再点一次'; return; }
      clearArmed = false;
      DATA = { v: 1, sample: false, title: '我的家族辈分谱', root: 'me', zibei: {}, people: [{ id: 'me', name: '', g: 'M', yr: null, note: '', fa: null, mo: null, sp: null }] };
      S.center = 'me'; S.sel = 'me'; S.edit = true; reindex(); S.dirty = true; if (S.mode === 'local') saveLocal();
      render(); openEdit('me'); break;
    }
    case 'discard': DATA = clone(ORIGINAL); S.dirty = false; S.sel = null; S.center = DATA.root; render(); toast('已恢复到上次保存的样子'); break;
    case 'save': save(); break;
    case 'view': S.view = el.dataset.view; try { localStorage.setItem('family-view', S.view); } catch (e) {} render(); break;
    case 'rot-toggle': G3.toggleRotate(); break;
    case 'view-reset': G3.resetView(); break;
    case 'calc':
      if (!S.calc.length && (el.dataset.c === 'h' || el.dataset.c === 'w')){ S.calcG = el.dataset.c === 'h' ? 'F' : 'M'; syncGenderButtons(); }
      S.calc.push(el.dataset.c); renderCalcOut(); break;
    case 'calc-g': S.calcG = el.dataset.g; syncGenderButtons(); renderCalcOut(); break;
    case 'calc-back': S.calc.pop(); renderCalcOut(); break;
    case 'calc-clear': S.calc = []; renderCalcOut(); break;
  }
});
document.addEventListener('change', function(ev){
  if (ev.target.id === 'center-select'){ S.center = ev.target.value; S.sel = null; render(); }
  if (ev.target.id === 'f-anchor' || ev.target.id === 'f-rel') updatePreview();
});
document.addEventListener('input', function(ev){ if (ev.target.id === 'f-yr' || ev.target.id === 'f-name') updatePreview(); });
document.addEventListener('keydown', function(ev){
  if (ev.key !== 'Escape') return;
  if (document.getElementById('modal-host').innerHTML) closeModal();
  else if (S.sel){ S.sel = null; render(); }
});
function themeChanged(){ G3.invalidate(); if (S.view === '3d') render(); }
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged); } catch (e) {}
try { new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
window.addEventListener('beforeunload', function(ev){ if (S.mode === 'publish' && S.dirty && !S.saving){ ev.preventDefault(); ev.returnValue = ''; } });

/* ---------- 启动 ---------- */
try { if (sessionStorage.getItem('family-saved')){ sessionStorage.removeItem('family-saved'); setTimeout(function(){ toast('已保存，所有打开这个页面的人都会看到新版本'); }, 300); } } catch (e) {}
if (!window.claude || typeof window.claude.use !== 'function'){ S.mode = 'local'; loadLocal(); }
render();
if (S.mode !== 'local'){
  Promise.all([window.claude.use('artifact'), window.claude.use('user')]).then(function(res){
    var art = res[0], usr = res[1];
    if (!art) return;
    var check = usr && usr.canEdit ? usr.canEdit().catch(function(){ return true; }) : Promise.resolve(true);
    return check.then(function(can){ if (can){ ART = art; S.mode = 'publish'; render(); } });
  }).catch(function(){});
}
