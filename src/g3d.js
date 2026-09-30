
/* ===== 3D 关系图 =====
   布局：每一辈是一层圆环，上下排开；我在同辈这层的圆心。
   方位固定：父系在左、本家在前、母系在右、姻亲在后。
   连线只画「从我出发怎么走到 TA」的那一条，所以整张图是一棵从我长出去的树。 */
var G3 = (function(){
  var stage = null, labelsEl = null, msgEl = null, renderer = null, scene = null, camera = null, root = null;
  var nodes = {}, edges = [], axisLabels = [], running = false, raf = 0, sig = '', lastCenter = null;
  var HOME_THETA = 0, HOME_PHI = 1.02;
  var cam = { theta: HOME_THETA, phi: HOME_PHI, r: 24, ty: 0 }, home = null;
  var auto = false, dragging = false, introT = 1, reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var H = 3.2;
  var SECT = { core: Math.PI / 2, pat: Math.PI, mat: 0, inlaw: -Math.PI / 2 };

  function css(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }
  function ensureStage(){
    if (stage) return stage;
    stage = document.createElement('div'); stage.className = 'stage';
    stage.innerHTML = '<div class="labels3d"></div>' +
      '<div class="stage-ui"><div class="legend3d"><span><i style="background:var(--pat)"></i>父系 · 左</span><span><i style="background:var(--core)"></i>本家 · 前</span><span><i style="background:var(--mat)"></i>母系 · 右</span><span><i style="background:var(--inlaw)"></i>姻亲 · 后</span></div>' +
      '<div class="stage-btns"><button class="btn" data-act="rot-toggle" id="rot-btn">自动旋转</button><button class="btn" data-act="view-reset">回到正面</button></div></div>' +
      '<p class="stage-hint">拖动旋转 · 滚轮或双指缩放 · 点称呼看详情</p>' +
      '<div class="stage-msg" hidden></div>';
    labelsEl = stage.querySelector('.labels3d'); msgEl = stage.querySelector('.stage-msg');
    bindPointer();
    return stage;
  }
  function initGL(){
    if (renderer) return true;
    if (!window.THREE){ msgEl.hidden = false; msgEl.textContent = '3D 图需要联网加载图形组件，现在没能加载成功。请检查网络后刷新页面。'; return false; }
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { msgEl.hidden = false; msgEl.textContent = '这台设备的浏览器不支持 3D 显示，可以切回「辈分表」查看。'; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.insertBefore(renderer.domElement, stage.firstChild);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    var dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(5, 12, 12); scene.add(dl);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    return true;
  }
  function resize(){
    if (!renderer) return;
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  /* ---- 布局 ---- */
  function sortRows(list){
    return list.sort(function(a, b){ return a.sortKey[0] - b.sortKey[0] || (a.sortKey[1] < b.sortKey[1] ? -1 : a.sortKey[1] > b.sortKey[1] ? 1 : 0) || a.sortKey[2] - b.sortKey[2]; });
  }
  /* 放射状树：我在圆心，每个人占父节点扇区里的一小块，
     离我几步就在第几圈，所以连线一层层向外张开、互不交叉 */
  var STEP = 2.5;
  // 树上的「上一个人」：按称呼链走，爸爸的哥哥挂在爸爸下面，姐姐直接挂在我下面
  function parentOf(r){ if (r.p.id === S.center) return null; return r.toks.length > 1 ? r.toks[r.toks.length - 2].node : S.center; }
  function layout(rows){
    var kids = {}, rowOf = {};
    rows.forEach(function(r){ rowOf[r.p.id] = r; var pv = parentOf(r); if (pv){ (kids[pv] = kids[pv] || []).push(r.p.id); } });
    var weight = {};
    function wt(id){ var k = kids[id] || [], s = 0; k.forEach(function(c){ s += wt(c); }); return (weight[id] = Math.max(1, s)); }
    wt(S.center);
    function order(ids){ return sortRows(ids.map(function(id){ return rowOf[id]; })).map(function(r){ return r.p.id; }); }
    var pos = {}, depth = {}; pos[S.center] = new THREE.Vector3(0, 0, 0); depth[S.center] = 0;
    // 第一圈的方位：妈妈那边在右、自家人在前、爸爸那边在左、配偶那边在后
    var RANK = { m: 0, s: 1, d: 1, ob: 1, lb: 1, os: 1, ls: 1, xb: 1, xs: 1, f: 2, h: 3, w: 3 };
    var first = (kids[S.center] || []).slice().sort(function(a, b){
      var ca = baseCode(rowOf[a].codes[0]), cb = baseCode(rowOf[b].codes[0]);
      return (RANK[ca] - RANK[cb]) || (ageKey(M[a]) - ageKey(M[b]));
    });
    var total = weight[S.center], unit = Math.PI * 2 / total;
    var mW = 0; first.forEach(function(id){ if (baseCode(rowOf[id].codes[0]) === 'm') mW += weight[id]; });
    var coreW = 0; first.forEach(function(id){ if (RANK[baseCode(rowOf[id].codes[0])] === 1) coreW += weight[id]; });
    // 让「自家人」这一块正对前方
    var a0 = Math.PI / 2 - (mW + coreW / 2) * unit;
    function place(ids, start, d){
      var a = start;
      ids.forEach(function(id){
        var span = weight[id] * unit, mid = a + span / 2, r = rowOf[id];
        depth[id] = d;
        pos[id] = new THREE.Vector3(Math.cos(mid) * d * STEP, r.gen * H, Math.sin(mid) * d * STEP);
        if (kids[id]) place(order(kids[id]), a, d + 1);
        a += span;
      });
    }
    place(first, a0, 1);
    var ringR = {};
    rows.forEach(function(r){ var p = pos[r.p.id]; ringR[r.gen] = Math.max(ringR[r.gen] || 1.6, Math.hypot(p.x, p.z) + 1); });
    var R = 0; Object.keys(ringR).forEach(function(g){ R = Math.max(R, ringR[g]); });
    return { pos: pos, R: R, ringR: ringR };
  }

  function clearScene(){
    if (!root) return;
    scene.remove(root);
    root.traverse(function(o){ if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    root = null; nodes = {}; edges = []; axisLabels = []; labelsEl.innerHTML = '';
  }
  function build(all){
    clearScene();
    root = new THREE.Group(); scene.add(root);
    var rows = all.rows, L = layout(rows), pos = L.pos, R = L.R;
    var col = { pat: css('--pat'), core: css('--core'), mat: css('--mat'), inlaw: css('--inlaw'), seal: css('--seal'), muted: css('--muted') };
    var sphereG = new THREE.SphereGeometry(1, 28, 20);
    var gens = {};
    rows.forEach(function(r){
      var p = r.p, isC = p.id === S.center, ph = p.ph && !p.name;
      var c = new THREE.Color(isC ? col.seal : col[r.side]);
      var mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 1, emissive: c, emissiveIntensity: isC ? 0.3 : 0.1 });
      var m = new THREE.Mesh(sphereG, mat), s = isC ? 0.5 : 0.24;
      m.scale.setScalar(s); m.userData.base = s; root.add(m);
      var lab = document.createElement('button');
      lab.type = 'button'; lab.className = 'n3 s-' + r.side + (isC ? ' c' : '') + (ph ? ' ph' : ''); lab.setAttribute('data-id', p.id);
      var term = isC ? (S.center === DATA.root ? '我' : '本人') : r.term.t;
      lab.textContent = term; lab.setAttribute('title', term + (p.name ? '（' + p.name + '）' : ''));
      labelsEl.appendChild(lab);
      nodes[p.id] = { mesh: m, target: pos[p.id], label: lab, row: r, ph: ph, alpha: 1 };
      gens[r.gen] = 1;
    });
    // 树状连线：每个人只连到「从我走过来」的上一个人
    rows.forEach(function(r){
      var pv = parentOf(r); if (!pv || !nodes[pv]) return;
      var g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      var ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col[r.side], transparent: true, opacity: 0.55 }));
      root.add(ln); edges.push({ a: pv, b: r.p.id, line: ln, side: r.side });
    });
    // 每一辈一圈细环 + 中轴
    var keys = Object.keys(gens).map(Number), top = Math.max.apply(null, keys), bot = Math.min.apply(null, keys);
    keys.forEach(function(g){
      var pts = [];
      for (var i = 0; i <= 120; i++){ var a = i / 120 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * L.ringR[g], g * H, Math.sin(a) * L.ringR[g])); }
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: g === 0 ? col.seal : col.muted, transparent: true, opacity: g === 0 ? 0.35 : 0.16 })));
      if (g !== 0){
        var el = document.createElement('span'); el.className = 'g3';
        el.textContent = genName(g) + (g > 0 ? ' +' + g : ' ' + g);
        labelsEl.appendChild(el);
        axisLabels.push({ el: el, at: new THREE.Vector3(0, g * H, 0) });
      }
    });
    if (top > bot){
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, bot * H, 0), new THREE.Vector3(0, top * H, 0)]),
        new THREE.LineDashedMaterial({ color: col.muted, dashSize: 0.25, gapSize: 0.2, transparent: true, opacity: 0.35 })).computeLineDistances());
    }
    home = { ty: (top + bot) / 2 * H - 0.5, r: Math.max(R * 2.55, (top - bot + 1) * H * 2) };
    introT = reduced ? 1 : 0;
  }

  var onPath = {}, pathEdges = {}, hasSel = false;
  function applySelection(){
    onPath = {}; pathEdges = {}; hasSel = !!(S.sel && nodes[S.sel]);
    if (hasSel){
      var pv = S.center; onPath[pv] = 1;
      nodes[S.sel].row.toks.forEach(function(t){ onPath[t.node] = 1; pathEdges[pv + '>' + t.node] = 1; pv = t.node; });
    }
    Object.keys(nodes).forEach(function(id){
      var n = nodes[id], sel = id === S.sel;
      n.label.classList.toggle('sel', sel); n.label.classList.toggle('path', !!onPath[id] && !sel);
      n.mesh.userData.boost = sel ? 1.7 : onPath[id] && hasSel ? 1.3 : 1;
    });
    var seal = css('--seal');
    edges.forEach(function(e){
      e.on = !!pathEdges[e.a + '>' + e.b];
      e.line.material.color.set(e.on ? seal : css('--' + e.side));
    });
  }

  /* ---- 交互 ---- */
  function bindPointer(){
    var pts = {}, start = null, moved = 0, pinch0 = 0, r0 = 0;
    stage.addEventListener('pointerdown', function(e){
      if (e.target.closest('.stage-ui')) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      var ids = Object.keys(pts);
      if (ids.length === 1){ start = { t: e.target.closest('.n3') }; moved = 0; dragging = true; }
      if (ids.length === 2){ var a = pts[ids[0]], b = pts[ids[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); r0 = cam.r; }
    });
    stage.addEventListener('pointermove', function(e){
      if (!pts[e.pointerId]) return;
      var p = pts[e.pointerId], dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      var ids = Object.keys(pts);
      if (ids.length === 1){
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 4 && auto){ auto = false; syncRotBtn(); }
        cam.theta -= dx * 0.007; cam.phi = Math.max(0.75, Math.min(1.95, cam.phi - dy * 0.006));
      } else if (ids.length === 2 && pinch0){
        var a = pts[ids[0]], b = pts[ids[1]];
        cam.r = clampR(r0 * pinch0 / Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1));
      }
    });
    function end(e){
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      if (!Object.keys(pts).length){
        dragging = false;
        if (start && moved <= 4){
          if (start.t){ var id = start.t.getAttribute('data-id'); S.sel = S.sel === id ? null : id; render(); }
          else if (S.sel){ S.sel = null; render(); }
        }
        start = null; pinch0 = 0;
      }
    }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', function(e){ e.preventDefault(); cam.r = clampR(cam.r * (1 + Math.sign(e.deltaY) * 0.08)); }, { passive: false });
    stage.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && e.target.classList.contains('n3')){ e.preventDefault(); var id = e.target.getAttribute('data-id'); S.sel = S.sel === id ? null : id; render(); }
    });
  }
  function fitR(){ var asp = camera ? camera.aspect : 1.6; return clampR(home.r * (asp < 1.3 ? Math.min(1.4, 0.85 / asp) : 1)); }
  function clampR(r){ return Math.max(6, Math.min(110, r)); }
  function syncRotBtn(){ var b = document.getElementById('rot-btn'); if (b) b.textContent = auto ? '停止旋转' : '自动旋转'; }

  /* ---- 每一帧 ---- */
  var v = null, toCam = null;
  function frame(){
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!root) return;
    if (!v){ v = new THREE.Vector3(); toCam = new THREE.Vector3(); }
    if (auto && !dragging) cam.theta += 0.0018;
    if (introT < 1) introT = Math.min(1, introT + 0.025);
    var k = 1 - Math.pow(1 - introT, 3);
    cam.ty += (home.ty - cam.ty) * 0.1;
    camera.position.set(Math.sin(cam.phi) * Math.sin(cam.theta) * cam.r, cam.ty + Math.cos(cam.phi) * cam.r, Math.sin(cam.phi) * Math.cos(cam.theta) * cam.r);
    camera.lookAt(0, cam.ty, 0);
    toCam.set(Math.sin(cam.theta), 0, Math.cos(cam.theta));
    var w = stage.clientWidth, h = stage.clientHeight;
    Object.keys(nodes).forEach(function(id){
      var n = nodes[id], t = n.target;
      n.mesh.position.set(t.x * k, t.y * k, t.z * k);
      n.mesh.scale.setScalar(n.mesh.userData.base * (n.mesh.userData.boost || 1));
      // 转到背面的人自动变淡，避免前后叠在一起
      var rad = Math.hypot(t.x, t.z), facing = rad > 0.01 ? (t.x * toCam.x + t.z * toCam.z) / rad : 1;
      var a = 0.22 + 0.78 * Math.pow((facing + 1) / 2, 1.3);
      if (hasSel) a = onPath[id] ? 1 : Math.min(a, 0.14);
      if (n.ph) a *= 0.6;
      n.alpha = a; n.mesh.material.opacity = a;
      var el = n.label;
      v.copy(n.mesh.position); v.y -= n.mesh.scale.x + 0.08; v.project(camera);
      if (v.z > 1){ el.style.visibility = 'hidden'; return; }
      var dist = camera.position.distanceTo(n.mesh.position), sc = Math.max(0.7, Math.min(1.15, 24 / dist));
      el.style.visibility = 'visible';
      el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px) translate(-50%,0) scale(' + sc.toFixed(3) + ')';
      el.style.zIndex = String(1000 - Math.round(dist * 5));
      el.style.opacity = String(Math.max(a, id === S.sel ? 1 : 0) * (introT < 1 ? k : 1));
      el.style.pointerEvents = a < 0.3 ? 'none' : '';
    });
    edges.forEach(function(e){
      var A = nodes[e.a], B = nodes[e.b], pa = A.mesh.position, pb = B.mesh.position, arr = e.line.geometry.attributes.position.array;
      arr[0] = pa.x; arr[1] = pa.y; arr[2] = pa.z; arr[3] = pb.x; arr[4] = pb.y; arr[5] = pb.z;
      e.line.geometry.attributes.position.needsUpdate = true;
      e.line.material.opacity = e.on ? 0.95 : Math.min(A.alpha, B.alpha) * (hasSel ? 0.5 : 0.6);
    });
    axisLabels.forEach(function(g){
      v.copy(g.at).project(camera);
      g.el.style.visibility = v.z > 1 ? 'hidden' : 'visible';
      g.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-50%)';
    });
    renderer.render(scene, camera);
  }

  function signature(all){
    return S.center + '|' + document.documentElement.getAttribute('data-theme') + '|' + (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) + '|' +
      all.rows.map(function(r){ return r.p.id + ':' + r.term.t + ':' + r.side + ':' + (r.p.ph && !r.p.name ? 1 : 0) + ':' + r.p.fa + r.p.mo + r.p.sp; }).join(',');
  }
  return {
    show: function(slot, all){
      slot.appendChild(ensureStage());
      if (!initGL()) return;
      resize();
      var sg = signature(all);
      if (sg !== sig){
        var recenter = lastCenter !== S.center;
        sig = sg; build(all);
        if (recenter){ cam.r = fitR(); cam.ty = home.ty; cam.theta = HOME_THETA; cam.phi = HOME_PHI; }
        else introT = 1;
        lastCenter = S.center;
      }
      applySelection(); syncRotBtn();
      if (!running){ running = true; frame(); }
    },
    hide: function(){ running = false; cancelAnimationFrame(raf); },
    toggleRotate: function(){ auto = !auto; syncRotBtn(); },
    resetView: function(){ if (!home) return; cam.theta = HOME_THETA; cam.phi = HOME_PHI; cam.r = fitR(); auto = false; syncRotBtn(); },
    invalidate: function(){ sig = ''; }
  };
})();
