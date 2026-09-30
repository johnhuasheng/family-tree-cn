/* ===== 称呼推算引擎 ===== */
var WORD = {f:'爸爸',m:'妈妈',h:'丈夫',w:'妻子',s:'儿子',d:'女儿',ob:'哥哥',lb:'弟弟',os:'姐姐',ls:'妹妹',xb:'兄弟',xs:'姐妹'};
var DICT_SRC = [
'f|爸爸|父亲','m|妈妈|母亲','h|老公|丈夫','w|老婆|妻子','s|儿子|','d|女儿|',
'ob|哥哥|','lb|弟弟|','os|姐姐|','ls|妹妹|',
'ob,w|嫂子|嫂嫂','lb,w|弟媳|弟妹','os,h|姐夫|','ls,h|妹夫|',
'ob,s|侄子|','ob,d|侄女|','lb,s|侄子|','lb,d|侄女|','os,s|外甥|','os,d|外甥女|','ls,s|外甥|','ls,d|外甥女|',
'ob,s,w|侄媳|侄媳妇','lb,s,w|侄媳|侄媳妇','ob,d,h|侄女婿|','lb,d,h|侄女婿|',
'os,s,w|外甥媳妇|','ls,s,w|外甥媳妇|','os,d,h|外甥女婿|','ls,d,h|外甥女婿|',
'ob,s,s|侄孙|','lb,s,s|侄孙|','ob,s,d|侄孙女|','lb,s,d|侄孙女|',
'ob,d,s|侄外孙|','lb,d,s|侄外孙|','ob,d,d|侄外孙女|','lb,d,d|侄外孙女|',
'os,s,s|外甥孙|','ls,s,s|外甥孙|','os,s,d|外甥孙女|','ls,s,d|外甥孙女|',
'os,d,s|外甥孙|','ls,d,s|外甥孙|','os,d,d|外甥孙女|','ls,d,d|外甥孙女|',
's,w|儿媳|儿媳妇','d,h|女婿|','s,s|孙子|','s,d|孙女|','d,s|外孙|','d,d|外孙女|',
's,s,w|孙媳妇|','s,d,h|孙女婿|','s,s,s|曾孙|','s,s,d|曾孙女|',
's,w,f|亲家公|','s,w,m|亲家母|','d,h,f|亲家公|','d,h,m|亲家母|',
'f,f|爷爷|祖父','f,m|奶奶|祖母','m,f|外公|姥爷','m,m|外婆|姥姥',
'f,f,f|太爷爷|曾祖父','f,f,m|太奶奶|曾祖母','f,m,f|曾外祖父|太姥爷','f,m,m|曾外祖母|太姥姥',
'm,f,f|太外公|外曾祖父','m,f,m|太外婆|外曾祖母','m,m,f|外曾外祖父|','m,m,m|外曾外祖母|',
'f,ob|伯父|大伯','f,ob,w|伯母|大妈','f,lb|叔叔|叔父','f,lb,w|婶婶|婶子',
'f,os|姑妈|姑姑','f,ls|姑姑|小姑','f,os,h|姑父|姑丈','f,ls,h|姑父|姑丈',
'm,ob|舅舅|大舅','m,lb|舅舅|小舅','m,ob,w|舅妈|舅母','m,lb,w|舅妈|舅母',
'm,os|姨妈|大姨','m,ls|小姨|阿姨','m,os,h|姨父|姨丈','m,ls,h|姨父|姨丈',
'f,f,ob|大爷爷|伯祖父','f,f,ob,w|大奶奶|伯祖母','f,f,lb|小爷爷|叔祖父','f,f,lb,w|小奶奶|叔祖母',
'f,f,os|姑奶奶|姑祖母','f,f,ls|姑奶奶|姑祖母','f,f,os,h|姑爷爷|姑祖父','f,f,ls,h|姑爷爷|姑祖父',
'f,m,ob|舅爷爷|舅公','f,m,lb|舅爷爷|舅公','f,m,ob,w|舅奶奶|舅婆','f,m,lb,w|舅奶奶|舅婆',
'f,m,os|姨奶奶|姨婆','f,m,ls|姨奶奶|姨婆','f,m,os,h|姨爷爷|姨公','f,m,ls,h|姨爷爷|姨公',
'm,f,ob|伯姥爷|伯外祖父','m,f,lb|叔姥爷|叔外祖父','m,f,ob,w|伯姥姥|伯外祖母','m,f,lb,w|叔姥姥|叔外祖母',
'm,f,os|姑姥姥|姑外祖母','m,f,ls|姑姥姥|姑外祖母','m,m,ob|舅姥爷|舅外祖父','m,m,lb|舅姥爷|舅外祖父',
'm,m,os|姨姥姥|姨外祖母','m,m,ls|姨姥姥|姨外祖母',
'w,f|岳父|老丈人','w,m|岳母|丈母娘','h,f|公公|','h,m|婆婆|',
'w,ob|大舅子|内兄','w,lb|小舅子|内弟','w,os|大姨子|内姐','w,ls|小姨子|内妹',
'h,ob|大伯子|大伯哥','h,lb|小叔子|','h,os|大姑子|','h,ls|小姑子|',
'h,ob,w|妯娌|大嫂','h,lb,w|妯娌|弟妹','w,os,h|连襟|姐夫','w,ls,h|连襟|妹夫',
'w,ob,w|舅嫂|内嫂','w,lb,w|舅弟媳|',
'w,ob,s|内侄|','w,lb,s|内侄|','w,ob,d|内侄女|','w,lb,d|内侄女|',
'w,os,s|内甥|','w,ls,s|内甥|','w,os,d|内甥女|','w,ls,d|内甥女|',
'h,ob,s|侄子|','h,lb,s|侄子|','h,ob,d|侄女|','h,lb,d|侄女|',
'h,os,s|外甥|','h,ls,s|外甥|','h,os,d|外甥女|','h,ls,d|外甥女|'
];
var DICT = {};
DICT_SRC.forEach(function(l){ var a = l.split('|'); DICT[a[0]] = [a[1], a[2] || '']; });
(function genCousins(){
  ['f','m'].forEach(function(p){ ['ob','lb','os','ls'].forEach(function(sb){
    var pre = (p === 'f' && (sb === 'ob' || sb === 'lb')) ? '堂' : '表';
    [['s','哥','弟'],['d','姐','妹']].forEach(function(cx){
      var c = cx[0];
      [['o',cx[1]],['l',cx[2]]].forEach(function(ax){
        var k = p + ',' + sb + ',' + c + '&' + ax[0], t = pre + ax[1];
        var alt = pre === '堂' ? (c === 's' ? '堂兄弟' : '堂姐妹') : (c === 's' ? '表兄弟' : '表姐妹');
        DICT[k] = [t, alt];
        if (c === 's') DICT[k + ',w'] = [ax[0] === 'o' ? pre + '嫂' : pre + '弟媳', ''];
        else DICT[k + ',h'] = [t + '夫', ''];
        if (c === 's') { DICT[k + ',s'] = [pre + '侄', '']; DICT[k + ',d'] = [pre + '侄女', '']; }
        else { DICT[k + ',s'] = [pre + '外甥', '']; DICT[k + ',d'] = [pre + '外甥女', '']; }
      });
    });
  }); });
})();

function baseCode(c){ return c.split('&')[0]; }
function expandKey(codes){
  var outs = [''];
  codes.forEach(function(tok){
    var parts = tok.split('&'), c = parts[0], a = parts[1];
    var cs = c === 'xb' ? ['ob','lb'] : c === 'xs' ? ['os','ls'] : [c];
    var as = a === undefined ? [null] : a === 'x' ? ['o','l'] : [a];
    var opts = [];
    cs.forEach(function(cc){ as.forEach(function(aa){ opts.push(aa ? cc + '&' + aa : cc); }); });
    var next = [];
    outs.forEach(function(o){ opts.forEach(function(t){ next.push(o ? o + ',' + t : t); }); });
    outs = next;
  });
  return outs;
}
function uniq(a){ var s = []; a.forEach(function(x){ if (x && s.indexOf(x) < 0) s.push(x); }); return s; }
function exactTerm(codes){
  var keys = expandKey(codes), found = [];
  for (var i = 0; i < keys.length; i++){ if (!DICT[keys[i]]) return null; found.push(DICT[keys[i]]); }
  var t = uniq(found.map(function(f){ return f[0]; }));
  var alt = uniq(found.map(function(f){ return f[1]; })).filter(function(x){ return t.indexOf(x) < 0; });
  return { t: t.join(' / '), alt: alt.join('、'), exact: true, amb: t.length > 1 };
}
function termOf(codes){
  if (!codes.length) return { t: '我', alt: '', exact: true };
  var e = exactTerm(codes); if (e) return e;
  for (var n = codes.length - 1; n >= 1; n--){
    var pre = exactTerm(codes.slice(0, n));
    if (pre){
      var rest = codes.slice(n).map(function(c){ return WORD[baseCode(c)]; }).join('的');
      return { t: pre.t.split(' / ')[0] + '的' + rest, alt: '', exact: false };
    }
  }
  return { t: codes.map(function(c){ return WORD[baseCode(c)]; }).join('的'), alt: '', exact: false };
}
function describe(codes){
  return codes.map(function(c){ return WORD[baseCode(c)]; }).join('的');
}

/* ===== 图谱 ===== */
function kidsOf(M, id){
  var out = [];
  for (var k in M){ var q = M[k]; if (q.fa === id || q.mo === id) out.push(q); }
  return out.sort(function(a, b){ return ageKey(a) - ageKey(b); });
}
function ageKey(p){ return p.yr != null ? p.yr : (p.ord != null ? p.ord : 99999); }
function ageCmp(a, b, sib){
  if (a.yr && b.yr && a.yr !== b.yr) return a.yr < b.yr ? -1 : 1;
  if (!sib){
    var ya = a.yr || (a.ordY ? a.ord : null), yb = b.yr || (b.ordY ? b.ord : null);
    if (ya && yb && ya !== yb) return ya < yb ? -1 : 1;
  }
  if (sib){
    var ka = a.ord != null ? a.ord : a.yr, kb = b.ord != null ? b.ord : b.yr;
    if (a.yr && b.yr) { ka = a.yr; kb = b.yr; }
    if (ka != null && kb != null && ka !== kb) return ka < kb ? -1 : 1;
  }
  return 0;
}
function nbrs(M, id){
  var p = M[id], o = [];
  if (p.fa && M[p.fa]) o.push([p.fa, 'f']);
  if (p.mo && M[p.mo]) o.push([p.mo, 'm']);
  kidsOf(M, id).forEach(function(q){ o.push([q.id, q.g === 'M' ? 's' : 'd']); });
  if (p.sp && M[p.sp]) o.push([p.sp, M[p.sp].g === 'M' ? 'h' : 'w']);
  return o;
}
function bfs(M, from){
  var prev = {}; prev[from] = null; var q = [from];
  while (q.length){
    var id = q.shift();
    nbrs(M, id).forEach(function(e){ if (!(e[0] in prev)){ prev[e[0]] = { id: id, c: e[1] }; q.push(e[0]); } });
  }
  return prev;
}
function rawPath(prev, to){
  if (!(to in prev)) return null;
  var out = [], cur = to;
  while (prev[cur]){ out.unshift({ c: prev[cur].c, node: cur }); cur = prev[cur].id; }
  return out;
}
function normalize(M, from, raw){
  var out = [], prevNode = from;
  for (var i = 0; i < raw.length; i++){
    var r = raw[i], nx = raw[i + 1];
    if ((r.c === 'f' || r.c === 'm') && nx && (nx.c === 's' || nx.c === 'd') && nx.node !== prevNode){
      var q = M[nx.node], b = M[prevNode], k = ageCmp(q, b, true);
      var c = q.g === 'M' ? (k < 0 ? 'ob' : k > 0 ? 'lb' : 'xb') : (k < 0 ? 'os' : k > 0 ? 'ls' : 'xs');
      out.push({ c: c, node: nx.node }); prevNode = nx.node; i++; continue;
    }
    out.push({ c: r.c, node: r.node }); prevNode = r.node;
  }
  var g = 0, up = false, C = M[from];
  out.forEach(function(t){
    if (t.c === 'f' || t.c === 'm'){ g++; up = true; }
    else if (t.c === 's' || t.c === 'd'){
      g--;
      if (g === 0 && up){ var k = ageCmp(M[t.node], C, false); t.c += '&' + (k < 0 ? 'o' : k > 0 ? 'l' : 'x'); }
    }
  });
  return { toks: out, gen: g };
}
function sideOf(codes){
  if (codes.length <= 1) return 'core';
  for (var i = 0; i < codes.length - 1; i++){
    var a = baseCode(codes[i]), b = baseCode(codes[i + 1]);
    if ((a === 'h' || a === 'w') && /^(f|m|ob|lb|os|ls|xb|xs)$/.test(b)) return 'inlaw';
  }
  var c0 = baseCode(codes[0]);
  if (c0 === 'f') return 'pat';
  if (c0 === 'm') return 'mat';
  return 'core';
}
/* 从 from 看 to：称呼、关系链、辈分差、哪一边 */
function relation(M, from, to, prevCache){
  var prev = prevCache || bfs(M, from);
  var raw = rawPath(prev, to);
  if (!raw) return null;
  var n = normalize(M, from, raw);
  var codes = n.toks.map(function(t){ return t.c; });
  return { toks: n.toks, codes: codes, gen: n.gen, side: sideOf(codes), term: termOf(codes) };
}

/* ===== 称呼计算器（不依赖具体的人） ===== */
var SIB_RE = /^(ob|lb|os|ls|xb|xs)$/;
function genderOf(code, meG){
  var b = baseCode(code);
  if (/^(f|h|s|ob|lb|xb)$/.test(b)) return 'M';
  if (/^(m|w|d|os|ls|xs)$/.test(b)) return 'F';
  return meG;
}
function sibCode(g, age){ return g === 'M' ? (age === 'o' ? 'ob' : age === 'l' ? 'lb' : 'xb') : (age === 'o' ? 'os' : age === 'l' ? 'ls' : 'xs'); }
function sibAge(c){ return c.charAt(0) === 'o' ? 'o' : c.charAt(0) === 'l' ? 'l' : 'x'; }
function addMarkers(a){
  var g = 0, up = false;
  return a.map(function(c){
    if (c === 'f' || c === 'm'){ g++; up = true; return c; }
    if (c === 's' || c === 'd'){ g--; if (g === 0 && up) return c + '&x'; }
    return c;
  });
}
/* 把「我的 爸爸的 哥哥的 儿子…」这样一步步点出来的链化简：
   meG 是「我」的性别，用来判断「儿子的爸爸」是不是我自己之类的情况 */
function calcChain(input, meG){
  meG = meG || 'M';
  var a = input.slice(), selfHint = false, changed = true;
  while (changed){
    changed = false;
    for (var i = 0; i < a.length - 1; i++){
      var x = a[i], y = a[i + 1], rep = null;
      var prevG = i === 0 ? meG : genderOf(a[i - 1], meG);   // x 是「谁」的亲人：那个人的性别
      if (x === 'f' && y === 'w') rep = ['m'];
      else if (x === 'm' && y === 'h') rep = ['f'];
      else if ((x === 'h' && y === 'w') || (x === 'w' && y === 'h')) rep = [];
      else if (SIB_RE.test(x) && (y === 'f' || y === 'm')) rep = [y];
      else if ((x === 'f' || x === 'm') && (y === 's' || y === 'd')){
        var gy = y === 's' ? 'M' : 'F';
        rep = [sibCode(gy, 'x')]; if (gy === prevG) selfHint = true;
      }
      else if (SIB_RE.test(x) && SIB_RE.test(y)){
        // 哥哥的姐姐 = 姐姐；弟弟的妹妹 = 妹妹；年纪一大一小时说不准
        var ax = sibAge(x), ay = sibAge(y), g2 = genderOf(y, meG);
        if (ax === 'o' && ay === 'o') rep = [sibCode(g2, 'o')];
        else if (ax === 'l' && ay === 'l') rep = [sibCode(g2, 'l')];
        else { rep = [sibCode(g2, 'x')]; if (g2 === prevG) selfHint = true; }
      }
      else if ((x === 's' || x === 'd') && SIB_RE.test(y)) rep = [genderOf(y, meG) === 'M' ? 's' : 'd'];
      else if ((x === 's' || x === 'd') && (y === 'f' || y === 'm')){
        var pg = y === 'f' ? 'M' : 'F';
        rep = pg === prevG ? [] : [pg === 'M' ? 'h' : 'w'];
      }
      else if ((x === 'h' || x === 'w') && (y === 's' || y === 'd')) rep = [y];
      if (rep){ a.splice.apply(a, [i, 2].concat(rep)); changed = true; break; }
    }
  }
  a = addMarkers(a);
  var gen = 0; a.forEach(function(c){ var b = baseCode(c); if (b === 'f' || b === 'm') gen++; else if (b === 's' || b === 'd') gen--; });
  return { codes: a, gen: gen, selfHint: selfHint };
}
/* 反过来：已知「我 → TA」的关系链，求「TA → 我」的关系链 */
function invertChain(codes, meG){
  meG = meG || 'M';
  var base = codes.map(baseCode), out = [];
  var last = codes[codes.length - 1] || '', lastMark = last.indexOf('&') >= 0 ? last.split('&')[1] : null;
  for (var i = 0; i < base.length; i++){
    var c = base[i], g = i === 0 ? meG : genderOf(base[i - 1], meG), r;
    if (c === 'f' || c === 'm') r = g === 'M' ? 's' : 'd';
    else if (c === 's' || c === 'd') r = g === 'M' ? 'f' : 'm';
    else if (c === 'h' || c === 'w') r = g === 'M' ? 'h' : 'w';
    else if (c === 'ob' || c === 'os') r = sibCode(g, 'l');
    else if (c === 'lb' || c === 'ls') r = sibCode(g, 'o');
    else r = sibCode(g, 'x');
    out.unshift(r);
  }
  var gen = 0, up = false, n = out.length;
  return out.map(function(c, i){
    if (c === 'f' || c === 'm'){ gen++; up = true; return c; }
    if (c === 's' || c === 'd'){
      gen--;
      if (gen === 0 && up){
        var m = 'x';
        if (i === n - 1 && lastMark) m = lastMark === 'o' ? 'l' : lastMark === 'l' ? 'o' : 'x';
        return c + '&' + m;
      }
    }
    return c;
  });
}

/* ===== 修改 ===== */
function newId(){ return 'p' + Math.random().toString(36).slice(2, 8); }
function blank(){ return { id: newId(), name: '', g: 'M', yr: null, note: '', fa: null, mo: null, sp: null }; }
function siblingsIncl(M, X){
  var out = [X];
  for (var k in M){ var q = M[k]; if (q !== X && ((X.fa && q.fa === X.fa) || (X.mo && q.mo === X.mo))) out.push(q); }
  return out;
}
var REL_LABEL = { fa: '父亲', mo: '母亲', h: '丈夫', w: '妻子', s: '儿子', d: '女儿', ob: '哥哥', lb: '弟弟', os: '姐姐', ls: '妹妹' };
function addRel(M, anchorId, rel, info){
  var X = M[anchorId]; if (!X) return { err: '找不到这个人' };
  var nm = X.name || '这位亲人';
  var n = blank(); n.name = info.name || ''; n.yr = info.yr || null; n.note = info.note || '';
  if (rel === 'fa' || rel === 'mo'){
    n.g = rel === 'fa' ? 'M' : 'F';
    var cur = X[rel] && M[X[rel]];
    if (cur){
      if (cur.ph && !cur.name){ cur.name = n.name; cur.yr = n.yr; cur.note = n.note; cur.ph = false; return { id: cur.id }; }
      return { err: nm + ' 已经登记了' + (rel === 'fa' ? '父亲' : '母亲') + '（' + (cur.name || '未填名字') + '）。' };
    }
    M[n.id] = n;
    siblingsIncl(M, X).forEach(function(s){ if (!s[rel]) s[rel] = n.id; });
    var other = X[rel === 'fa' ? 'mo' : 'fa'] && M[X[rel === 'fa' ? 'mo' : 'fa']];
    if (other && !other.sp){ other.sp = n.id; n.sp = other.id; }
    return { id: n.id };
  }
  if (rel === 'h' || rel === 'w'){
    n.g = rel === 'h' ? 'M' : 'F';
    if (X.sp && M[X.sp]) return { err: nm + ' 已经登记了配偶（' + (M[X.sp].name || '未填名字') + '）。' };
    if ((rel === 'h' && X.g === 'M') || (rel === 'w' && X.g === 'F')) return { err: '性别对不上：' + nm + ' 登记的是' + (X.g === 'M' ? '男' : '女') + '性。' };
    M[n.id] = n; X.sp = n.id; n.sp = X.id;
    kidsOf(M, X.id).forEach(function(k){ if (X.g === 'M' && !k.mo) k.mo = n.id; if (X.g === 'F' && !k.fa) k.fa = n.id; });
    return { id: n.id };
  }
  if (rel === 's' || rel === 'd'){
    n.g = rel === 's' ? 'M' : 'F';
    if (X.g === 'M'){ n.fa = X.id; if (X.sp) n.mo = X.sp; } else { n.mo = X.id; if (X.sp) n.fa = X.sp; }
    M[n.id] = n; return { id: n.id };
  }
  // 兄弟姐妹
  n.g = (rel === 'ob' || rel === 'lb') ? 'M' : 'F';
  if (!X.fa && !X.mo){
    var ph = blank(); ph.ph = true; M[ph.id] = ph; X.fa = ph.id;
  }
  n.fa = X.fa; n.mo = X.mo;
  if (!n.yr){
    var older = rel === 'ob' || rel === 'os';
    var k = X.ord != null ? X.ord : X.yr;
    if (k == null){ X.ord = 0; k = 0; }
    n.ord = k + (older ? -0.5 : 0.5);
    if (X.yr || X.ordY) n.ordY = true;
  }
  M[n.id] = n; return { id: n.id };
}
function removePerson(M, id, rootId){
  if (id === rootId) return;
  var p = M[id]; if (!p) return;
  if (kidsOf(M, id).length){ p.name = ''; p.yr = null; p.note = ''; p.ph = true; }
  else { if (p.sp && M[p.sp] && M[p.sp].sp === id) M[p.sp].sp = null; delete M[id]; }
  // 清理不再连接任何人的占位
  var again = true;
  while (again){
    again = false;
    for (var k in M){
      var q = M[k];
      if (k !== rootId && q.ph && !q.name && !kidsOf(M, k).length && !q.fa && !q.mo){
        if (q.sp && M[q.sp] && M[q.sp].sp === k) M[q.sp].sp = null;
        delete M[k]; again = true;
      }
    }
  }
}

if (typeof module !== 'undefined') module.exports = { termOf: termOf, relation: relation, bfs: bfs, calcChain: calcChain, invertChain: invertChain, addRel: addRel, removePerson: removePerson, describe: describe, DICT: DICT };
