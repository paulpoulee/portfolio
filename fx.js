/* Effets 3D et scroll du portfolio.
   Amélioration progressive : sans JavaScript, sans WebGL ou avec « réduire les animations »,
   le site reste identique à la version sans effets. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const home = document.getElementById('home-view');
  const caseView = document.getElementById('case-view');
  const root = document.documentElement;
  root.classList.add('fx');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);

  /* ---------- État partagé : souris, scroll, vitesse ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, sx: 0, sy: 0, on: 0, onT: 0 };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = e.clientY / innerHeight * 2 - 1;
    mouse.onT = 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.onT = 0; });
  let lastY = scrollY, vel = 0;

  /* ---------- Titres révélés ligne par ligne ---------- */
  function splitLines(el) {
    if (!el || el.dataset.fxSplit) return;
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    const balanced = parts.every(p => (p.match(/<(em|span|strong)\b/g) || []).length === (p.match(/<\/(em|span|strong)>/g) || []).length);
    if (!balanced) return;
    el.dataset.fxSplit = '1';
    el.innerHTML = parts.map((p, i) => `<span class="fx-line"><span class="fx-line-in" style="--i:${i}">${p}</span></span>`).join('');
    el.classList.add('fx-split');
  }
  const lineObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('fx-in'); lineObserver.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });

  /* ---------- Éléments animés au scroll ---------- */
  // kind: card (projets), side (cartes collaboration), depth (blocs), tilt (survol seul)
  let items = [];
  function register(el, kind, extra = {}) {
    if (!el || el.dataset.fx) return;
    el.dataset.fx = kind;
    const item = { el, kind, e: 0, rx: 0, ry: 0, trx: 0, try: 0, hover: false, ...extra };
    if (kind === 'card') {
      item.img = el.querySelector(':scope > img');
      item.el.classList.add('fx-card');
    }
    if (fine.matches && (kind === 'card' || kind === 'side' || extra.tilt)) {
      el.addEventListener('pointerenter', () => { item.hover = true; });
      el.addEventListener('pointerleave', () => { item.hover = false; item.trx = 0; item.try = 0; });
      el.addEventListener('pointermove', ev => {
        const r = el.getBoundingClientRect();
        item.try = ((ev.clientX - r.left) / r.width - .5) * (item.max || 10);
        item.trx = -((ev.clientY - r.top) / r.height - .5) * (item.max || 10);
        el.style.setProperty('--fx-gx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--fx-gy', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    }
    items.push(item);
  }

  function scan() {
    items = items.filter(i => i.el.isConnected);
    const scope = home.hidden ? caseView : home;
    scope.querySelectorAll('.section-head h2,.collaboration-heading h2,.about-grid h2,.contact h2,.case-section h2,.next-project h2').forEach(h => {
      splitLines(h); if (h.classList.contains('fx-split') && !h.classList.contains('fx-in')) lineObserver.observe(h);
    });
    scope.querySelectorAll('.projects .project-visual').forEach(el => register(el, 'card', { max: 12 }));
    scope.querySelectorAll('.collaboration-card').forEach((el, i) => register(el, 'side', { dir: i % 2 ? 1 : -1, max: 6 }));
    scope.querySelectorAll('.approach>div,.timeline article,.education>div,.project-role article,.focus-list article,.axis-grid article,.deliverables>div,.project-facts>div').forEach((el, i, all) => {
      const siblings = [...el.parentElement.children];
      register(el, 'depth', { stagger: siblings.indexOf(el) % 4 });
    });
    scope.querySelectorAll('.resume-card,.certificate-featured,.epitech-collection,.case-quote').forEach(el => register(el, 'depth', { stagger: 0, tilt: false }));
    scope.querySelectorAll('.resume-thumb,.certificate-featured .certificate-thumb').forEach(el => register(el, 'tilt', { tilt: true, max: 14 }));
    const cover = scope.querySelector('.case-cover');
    if (cover) register(cover, 'cover');
    const next = scope.querySelector('.next-project h2');
    if (next) register(next, 'next');
    const count = scope.querySelector('.epitech-count');
    if (count && !count.dataset.fxCount) {
      count.dataset.fxCount = '1';
      const node = count.firstChild, target = parseInt(node.textContent, 10) || 0;
      new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return; obs.disconnect();
        const t0 = performance.now();
        const tick = now => { const t = clamp((now - t0) / 1400); node.textContent = String(Math.round(ease(t) * target)).padStart(2, '0'); if (t < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }, { threshold: .6 }).observe(count);
    }
  }

  /* ---------- Accueil : héros en 3D ---------- */
  const heroParts = ['.hero-intro', '.profession', '.hero-bottom', '.hero-top'].map(s => document.querySelector(s));
  const frame = document.querySelector('.portrait-frame');
  const hero = document.querySelector('.hero');
  const ticker = document.querySelector('.ticker-track');
  let tickerX = 0;

  function frameDOM(dt) {
    const vh = innerHeight;
    // héros
    if (!home.hidden && hero) {
      const h = clamp(scrollY / (hero.offsetHeight || vh));
      heroParts.forEach((el, i) => {
        if (!el) return;
        el.style.translate = `0 ${(-h * (60 + i * 35)).toFixed(1)}px`;
        el.style.opacity = (1 - h * .85).toFixed(3);
      });
      if (frame) {
        const ry = mouse.sx * 9 - h * 22, rx = -mouse.sy * 7 + h * 14;
        frame.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(1 - h * .1).toFixed(3)})`;
        frame.style.setProperty('--fx-sx', (12 - ry * 1.2).toFixed(1) + 'px');
        frame.style.setProperty('--fx-sy', (-12 - rx * 1.2).toFixed(1) + 'px');
        const img = frame.querySelector('img');
        if (img) img.style.translate = `${(-mouse.sx * 10).toFixed(1)}px ${(h * 50 - mouse.sy * 8).toFixed(1)}px`;
      }
      // bandeau défilant piloté par la vitesse du scroll
      if (ticker) {
        const group = ticker.firstElementChild;
        const w = group ? group.offsetWidth : 0;
        tickerX -= (0.6 + Math.abs(vel) * .35) * Math.sign(vel || 1) * dt * 60;
        if (w) { tickerX %= w; if (tickerX > 0) tickerX -= w; }
        ticker.style.transform = `translate3d(${tickerX.toFixed(1)}px,0,0) skewX(${clamp(-vel * .25, -12, 12).toFixed(2)}deg)`;
      }
    }
    const k = 1 - Math.pow(.001, dt); // lissage indépendant du nombre d'images par seconde
    const skew = clamp(vel * .05, -3, 3);
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const target = clamp((vh - r.top) / (vh * .8));
      it.e = lerp(it.e, target, k * .9);
      it.rx = lerp(it.rx, it.hover ? it.trx : 0, k * .7);
      it.ry = lerp(it.ry, it.hover ? it.try : 0, k * .7);
      const e = ease(clamp(it.e));
      if (it.kind === 'card') {
        const lift = it.hover ? 30 : 0;
        it.el.style.transform = `perspective(1400px) translate3d(0,${((1 - e) * 110).toFixed(1)}px,${(-(1 - e) * 220 + lift).toFixed(1)}px) rotateX(${((1 - e) * 26 + it.rx).toFixed(2)}deg) rotateY(${it.ry.toFixed(2)}deg) skewY(${skew.toFixed(2)}deg)`;
        it.el.style.opacity = (0.15 + e * .85).toFixed(3);
        if (it.img) {
          const c = (r.top + r.height / 2 - vh / 2) / vh;
          it.img.style.translate = `${(-it.ry * 1.4).toFixed(1)}px ${(c * -46 + it.rx * 1.4).toFixed(1)}px`;
          it.img.style.scale = '1.1';
        }
      } else if (it.kind === 'side') {
        it.el.style.transform = `perspective(1400px) translate3d(${(it.dir * (1 - e) * 120).toFixed(1)}px,${((1 - e) * 40).toFixed(1)}px,${(-(1 - e) * 160).toFixed(1)}px) rotateY(${(-it.dir * (1 - e) * 24 + it.ry).toFixed(2)}deg) rotateX(${it.rx.toFixed(2)}deg)`;
        it.el.style.opacity = (0.2 + e * .8).toFixed(3);
      } else if (it.kind === 'depth') {
        const d = clamp(it.e * 1.25 - it.stagger * .08);
        const de = ease(d);
        it.el.style.transform = `perspective(1200px) translate3d(0,${((1 - de) * 70).toFixed(1)}px,${(-(1 - de) * 180).toFixed(1)}px) rotateX(${((1 - de) * 18).toFixed(2)}deg)`;
        it.el.style.opacity = (de).toFixed(3);
        it.el.style.setProperty('--fx-e', de.toFixed(3));
      } else if (it.kind === 'tilt') {
        it.el.style.transform = `perspective(900px) rotateX(${it.rx.toFixed(2)}deg) rotateY(${it.ry.toFixed(2)}deg) translateZ(${it.hover ? 20 : 0}px)`;
      } else if (it.kind === 'cover') {
        const c = clamp((vh - r.top) / vh);
        const ce = ease(c);
        it.el.style.transform = `perspective(1600px) rotateX(${((1 - ce) * 28).toFixed(2)}deg) scale(${(.82 + ce * .18).toFixed(3)})`;
        it.el.style.borderRadius = `${((1 - ce) * 60).toFixed(0)}px`;
      } else if (it.kind === 'next') {
        it.el.style.transform = `translate3d(${((1 - e) * -160).toFixed(1)}px,0,0) skewX(${((1 - e) * -10).toFixed(2)}deg)`;
      }
    }
  }

  /* ---------- Nuage de particules en WebGL (accueil) ---------- */
  const gl3d = (() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) return null;
    document.body.prepend(canvas);

    const small = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
    const N = small ? 6000 : 14000;
    const R = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) R[i] = Math.random();
    const rnd = i => R[i * 4], rnd2 = i => R[i * 4 + 1], rnd3 = i => R[i * 4 + 2];

    // Formes : xyz + amplitude du « souffle » de chaque point
    const shapes = {
      sphere() { const a = new Float32Array(N * 4), g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), t = g * i, s = .92 + rnd3(i) * .1; a.set([Math.cos(t) * rr * s, y * s, Math.sin(t) * rr * s, 1], i * 4); } return a; },
      torus() { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) { const u = rnd(i) * Math.PI * 2, v = rnd2(i) * Math.PI * 2, Rm = .78, r = .3 + (rnd3(i) - .5) * .04; a.set([(Rm + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (Rm + r * Math.cos(v)) * Math.sin(u), .8], i * 4); } return a; },
      plane() { const a = new Float32Array(N * 4), s = Math.ceil(Math.sqrt(N)); for (let i = 0; i < N; i++) { const x = (i % s) / (s - 1) * 2 - 1, z = Math.floor(i / s) / (s - 1) * 2 - 1; a.set([x * 1.6, 0, z * 1.6, .25], i * 4); } return a; },
      helix() { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) { const t = i / N, strand = i % 3, ang = t * Math.PI * 9 + (strand === 1 ? Math.PI : 0), y = t * 2.4 - 1.2; if (strand === 2) { const k = rnd(i); a.set([Math.cos(ang) * .45 * (k * 2 - 1), y, Math.sin(ang) * .45 * (k * 2 - 1), .4], i * 4); } else { const j = (rnd2(i) - .5) * .06; a.set([Math.cos(ang) * .45 + j, y, Math.sin(ang) * .45 + j, .6], i * 4); } } return a; },
      galaxy() { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) { const arm = i % 3, d = Math.pow(rnd(i), .6), ang = arm / 3 * Math.PI * 2 + d * 5.2 + (rnd2(i) - .5) * .5 * (1 - d * .5), sp = (rnd3(i) - .5) * .12 * (1 - d); a.set([Math.cos(ang) * d * 1.2, sp, Math.sin(ang) * d * 1.2, .5], i * 4); } return a; },
      cube() { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) { const f = i % 6, u = rnd(i) * 2 - 1, v = rnd2(i) * 2 - 1, s = .62, p = f < 2 ? [f ? s : -s, u * s, v * s] : f < 4 ? [u * s, f % 2 ? s : -s, v * s] : [u * s, v * s, f % 2 ? s : -s]; a.set([...p, .5], i * 4); } return a; },
    };
    const cache = {};
    const shape = name => cache[name] || (cache[name] = shapes[name]());

    const vs = `
      attribute vec4 aA; attribute vec4 aB; attribute vec4 aR;
      uniform float uMix, uTime, uDpr, uVel, uWaveA, uWaveB, uTiltA, uTiltB, uAlA, uAlB, uMouseOn;
      uniform vec2 uView, uRot, uMouse; uniform vec3 uCA, uCB;
      varying float vA; varying float vC;
      mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
      mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
      vec3 live(vec4 a, float wave, float t){
        vec3 p=a.xyz;
        p+=a.w*.045*vec3(sin(p.y*4.+t+aR.x*6.28),sin(p.z*4.+t*1.1+aR.y*6.28),sin(p.x*4.+t*.9+aR.z*6.28));
        p.y+=wave*sin(p.x*2.6+t*1.3)*cos(p.z*2.2+t*.9);
        return p;
      }
      void main(){
        float t=uTime*.6;
        float m=smoothstep(aR.w*.45,aR.w*.45+.55,uMix);
        vec3 pa=rx(uTiltA)*live(aA,uWaveA,t);
        vec3 pb=rx(uTiltB)*live(aB,uWaveB,t);
        vec3 p=mix(pa,pb,m);
        p+=sin(m*3.14159)*(aR.xyz-.5)*.9;
        p*=1.+abs(uVel)*.004*aR.z;
        p=ry(uRot.x)*rx(uRot.y)*p;
        float persp=3.2/(3.2-p.z);
        vec3 c=mix(uCA,uCB,m);
        vec2 s=c.xy+p.xy*persp*c.z;
        vec2 dm=s-uMouse; float dl=length(dm);
        float f=uMouseOn*smoothstep(150.,0.,dl);
        s+=normalize(dm+.001)*f*50.;
        gl_Position=vec4(s/(uView*.5),0.,1.);
        gl_PointSize=(1.6+aR.x*2.4+step(.985,aR.y)*5.)*persp*uDpr*(1.+f*.9);
        vA=mix(uAlA,uAlB,m)*(.45+.75*smoothstep(-1.3,1.,p.z))*(1.-step(.985,aR.y)*.6);
        vC=clamp(aR.y*.8+f+(1.-persp)*-.6,0.,1.);
      }`;
    const fs = `
      precision mediump float; varying float vA; varying float vC;
      void main(){
        vec2 q=gl_PointCoord-.5; float r=length(q); if(r>.5)discard;
        float a=smoothstep(.5,.05,r)*vA;
        vec3 col=mix(vec3(.39,.38,.92),vec3(.82,.81,1.),vC);
        gl_FragColor=vec4(col*a,a);
      }`;
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    try { gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs)); } catch (err) { canvas.remove(); return null; }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return null; }
    gl.useProgram(prog);
    const U = {}; ['uMix', 'uTime', 'uDpr', 'uVel', 'uWaveA', 'uWaveB', 'uTiltA', 'uTiltB', 'uAlA', 'uAlB', 'uMouseOn', 'uView', 'uRot', 'uMouse', 'uCA', 'uCB'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    const buf = (data, name, usage) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0); return b; };
    buf(R, 'aR', gl.STATIC_DRAW);
    const bA = buf(shape('sphere'), 'aA', gl.DYNAMIC_DRAW);
    const bB = buf(shape('sphere'), 'aB', gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    // Une forme par section de l'accueil. center() renvoie [x, y, rayon] en px (origine au centre, y vers le haut).
    const narrow = () => innerWidth < 900;
    const rectCenter = (el, k) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - innerWidth / 2, innerHeight / 2 - (r.top + r.height / 2), r.height * k]; };
    const stages = [
      { sel: '.hero', shape: 'sphere', alpha: 1, tilt: 0, wave: 0, center: () => frame && frame.offsetWidth ? rectCenter(frame, narrow() ? .54 : .6) : [innerWidth * .25, 0, innerHeight * .35] },
      { sel: '#collaborer', shape: 'torus', alpha: .8, tilt: 1.05, wave: 0, center: () => [0, 0, Math.min(innerWidth, innerHeight) * .62] },
      { sel: '#projets', shape: 'plane', alpha: .75, tilt: .32, wave: .16, center: () => [0, -innerHeight * .28, Math.max(innerWidth, innerHeight) * .62] },
      { sel: '#apropos', shape: 'helix', alpha: .9, tilt: .25, wave: 0, center: () => [narrow() ? 0 : -innerWidth * .3, 0, innerHeight * .42] },
      { sel: '#parcours', shape: 'galaxy', alpha: .85, tilt: 1.1, wave: .05, center: () => [narrow() ? 0 : innerWidth * .28, 0, innerHeight * .55] },
      { sel: '#certificats', shape: 'cube', alpha: .9, tilt: .5, wave: 0, center: () => [narrow() ? 0 : innerWidth * .3, innerHeight * .05, innerHeight * .32] },
    ].map(s => ({ ...s, el: document.querySelector(s.sel) })).filter(s => s.el);

    let pair = [0, 0], dpr = 1, t0 = performance.now();
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
      canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize(); addEventListener('resize', resize);
    function setPair(a, b) {
      if (pair[0] === a && pair[1] === b) return;
      pair = [a, b];
      gl.bindBuffer(gl.ARRAY_BUFFER, bA); gl.bufferSubData(gl.ARRAY_BUFFER, 0, shape(stages[a].shape));
      gl.bindBuffer(gl.ARRAY_BUFFER, bB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, shape(stages[b].shape));
    }
    let rot = 0;
    return {
      canvas,
      render(dt) {
        const vh = innerHeight, P = scrollY + vh / 2;
        let a = 0, b = 0, m = 0;
        for (let j = 1; j < stages.length; j++) {
          const top = stages[j].el.getBoundingClientRect().top + scrollY;
          if (P > top + vh * .45) { a = b = j; continue; }
          if (P > top - vh * .45) { a = j - 1; b = j; m = (P - (top - vh * .45)) / (vh * .9); }
          break;
        }
        setPair(a, b);
        const A = stages[a], B = stages[b], cA = A.center(), cB = B.center();
        // le nuage s'efface dans la section contact (fond violet) et le pied de page
        const contact = document.getElementById('contact');
        let fade = 1;
        if (contact) fade = clamp((contact.getBoundingClientRect().top - vh * .35) / (vh * .5));
        rot += dt * (.12 + Math.abs(vel) * .01);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.uMix, m); gl.uniform1f(U.uTime, (performance.now() - t0) / 1000);
        gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uVel, vel);
        gl.uniform1f(U.uWaveA, A.wave); gl.uniform1f(U.uWaveB, B.wave);
        gl.uniform1f(U.uTiltA, A.tilt + mouse.sy * .15); gl.uniform1f(U.uTiltB, B.tilt + mouse.sy * .15);
        gl.uniform1f(U.uAlA, A.alpha * fade); gl.uniform1f(U.uAlB, B.alpha * fade);
        gl.uniform1f(U.uMouseOn, mouse.on);
        gl.uniform2f(U.uView, innerWidth, innerHeight);
        gl.uniform2f(U.uRot, rot + mouse.sx * .5, 0);
        gl.uniform2f(U.uMouse, mouse.x - innerWidth / 2, innerHeight / 2 - mouse.y);
        gl.uniform3f(U.uCA, ...cA); gl.uniform3f(U.uCB, ...cB);
        gl.drawArrays(gl.POINTS, 0, N);
      },
    };
  })();

  /* ---------- Boucle principale ---------- */
  let last = performance.now(), running = true;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const k = 1 - Math.pow(.002, dt);
    vel = lerp(vel, (scrollY - lastY) / Math.max(dt, .001) / 60, k); lastY = scrollY;
    mouse.sx = lerp(mouse.sx, mouse.nx, k * .6); mouse.sy = lerp(mouse.sy, mouse.ny, k * .6);
    mouse.on = lerp(mouse.on, mouse.onT, k);
    frameDOM(dt);
    if (gl3d) {
      const show = !home.hidden;
      gl3d.canvas.style.display = show ? '' : 'none';
      if (show) gl3d.render(dt);
    }
    requestAnimationFrame(loop);
  }

  function reset() {
    running = false;
    root.classList.remove('fx');
    gl3d?.canvas.remove();
    document.querySelectorAll('[data-fx],.portrait-frame,.portrait-frame img,.fx-card>img,.hero-intro,.profession,.hero-bottom,.hero-top,.ticker-track').forEach(el => { ['transform', 'opacity', 'translate', 'scale', 'border-radius'].forEach(p => el.style.removeProperty(p)); });
    document.querySelectorAll('.fx-split').forEach(h => h.classList.add('fx-in'));
  }
  reduced.addEventListener('change', () => { if (reduced.matches) reset(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running && !reduced.matches) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  });

  scan();
  new MutationObserver(() => requestAnimationFrame(scan)).observe(caseView, { childList: true });
  addEventListener('hashchange', () => requestAnimationFrame(scan));
  requestAnimationFrame(loop);
})();
