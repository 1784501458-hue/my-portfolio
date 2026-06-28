import { WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, PointsMaterial, Points, IcosahedronGeometry, MeshBasicMaterial, Mesh, SphereGeometry, TorusGeometry, Vector2, Raycaster } from 'three';
import { Renderer, Program, Mesh as OglMesh, Triangle } from 'ogl';

/* --- THEME TOGGLE — dark / light mode --- */
(function initTheme() {
  const root = document.documentElement;
  const btns = document.querySelectorAll("#themeToggle, #themeToggle-mobile");

  function applyTheme(dark) {
    if (dark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (window.__updateAuroraTheme) window.__updateAuroraTheme(dark);
  }

  let themeMem = localStorage.getItem("theme");
let dark = (themeMem === "dark" || themeMem === null);
  applyTheme(dark);

  window.__applyTheme = applyTheme;
  window.__isDark = () => dark;

  let animating = false;

  if (btns.length > 0) {
    btns.forEach(btn => btn.addEventListener("click", () => {
      if (animating) return;
      const overlay = document.getElementById("theme-transition-overlay");
      animating = true;
      dark = !dark;
      localStorage.setItem("theme", dark ? "dark" : "light");

      if (!overlay) {
        applyTheme(dark);
        animating = false;
        return;
      }

      const rect = btn.getBoundingClientRect();
      const ox = (((rect.left + rect.width / 2) / window.innerWidth) * 100).toFixed(2) + "%";
      const oy = (((rect.top + rect.height / 2) / window.innerHeight) * 100).toFixed(2) + "%";

      overlay.style.background = dark ? "#0d0d12" : "#f4f4f5";
      overlay.textContent = "";
      overlay.style.transition = "none";
      overlay.style.clipPath = `circle(0% at ${ox} ${oy})`;

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          overlay.style.transition = "clip-path 0.28s cubic-bezier(0.25, 0, 0.35, 1)";
          overlay.style.clipPath = `circle(150% at ${ox} ${oy})`;
        }),
      );

      setTimeout(() => {
        applyTheme(dark);
        overlay.style.transition = "none";
        overlay.style.clipPath = "circle(0% at 50% 50%)";
        animating = false;
      }, 290);
    }));
  }
})();

/* --- JS PARTICLE BACKGROUND (THREE.JS) --- */
function initThree() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true, 
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth > 768 ? 2 : 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); 

  const scene = new Scene();
  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 30);

  /* --- Particle field (多巴胺纯色系) --- */
  const COUNT = 700;
  const geo = new BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 100;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    
    const t_color = Math.random();
    // 强制锁死在纯粉色、青色、紫色
    if (t_color > 0.6) {
      col[i * 3] = 1.0; col[i * 3 + 1] = 0.2; col[i * 3 + 2] = 0.8; // 纯亮粉 (Barbie Pink)
    } else if (t_color > 0.3) {
      col[i * 3] = 0.0; col[i * 3 + 1] = 0.9; col[i * 3 + 2] = 1.0; // 纯霓虹青 (Cyan)
    } else {
      col[i * 3] = 0.6; col[i * 3 + 1] = 0.1; col[i * 3 + 2] = 1.0; // 纯电音紫 (Electric Purple)
    }
    sizes[i] = Math.random() * 1.5 + 0.5;
  }
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.setAttribute("size", new BufferAttribute(sizes, 1));

  const mat = new PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.7, 
    sizeAttenuation: true,
  });
  const particles = new Points(geo, mat);
  scene.add(particles);

  /* --- Central wireframe --- */
  let icoGeo = new IcosahedronGeometry(4, 0);
  if (icoGeo.index !== null) {
    icoGeo = icoGeo.toNonIndexed();
  }
  const icoMat = new MeshBasicMaterial({
    color: 0xFF10A0, // 核心多面体改为极度亮眼的荧光粉
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const ico = new Mesh(icoGeo, icoMat);
  scene.add(ico);

  const hitGeo = new SphereGeometry(5, 16, 16);
  const hitMat = new MeshBasicMaterial({ visible: false });
  const hitMesh = new Mesh(hitGeo, hitMat);
  ico.add(hitMesh);

  const posAttr = icoGeo.attributes.position;
  const origPos = new Float32Array(posAttr.array);
  const targetPos = new Float32Array(posAttr.array.length);

  for (let i = 0; i < posAttr.array.length; i += 9) {
    const cx = (origPos[i] + origPos[i + 3] + origPos[i + 6]) / 3;
    const cy = (origPos[i + 1] + origPos[i + 4] + origPos[i + 7]) / 3;
    const cz = (origPos[i + 2] + origPos[i + 5] + origPos[i + 8]) / 3;
    const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const explodeDist = Math.random() * 8 + 4; 

    for (let v = 0; v < 3; v++) {
      targetPos[i + v * 3] = origPos[i + v * 3] + (cx / len) * explodeDist + (Math.random() - 0.5) * 2;
      targetPos[i + v * 3 + 1] = origPos[i + v * 3 + 1] + (cy / len) * explodeDist + (Math.random() - 0.5) * 2;
      targetPos[i + v * 3 + 2] = origPos[i + v * 3 + 2] + (cz / len) * explodeDist + (Math.random() - 0.5) * 2;
    }
  }

  const ringGeo = new TorusGeometry(6, 0.015, 2, 40);
  const ringMat = new MeshBasicMaterial({
    color: 0x00FFFF, // 青色光环
    transparent: true,
    opacity: 0.35,
  });
  const ring = new Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.5;
  scene.add(ring);

  const mouse = { x: 0, y: 0 };
  const rayMouse = new Vector2(-999, -999);
  const raycaster = new Raycaster();
  let explodeProgress = 0;

  document.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    rayMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    rayMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return; 

    t += 0.003;
    particles.rotation.y = t * 0.04;
    particles.rotation.x = t * 0.012;
    ico.rotation.y = t * 0.5;
    ico.rotation.x = t * 0.3;
    ring.rotation.z = t * 0.2;

    raycaster.setFromCamera(rayMouse, camera);
    const intersects = raycaster.intersectObject(hitMesh);
    const isHovered = intersects.length > 0;

    explodeProgress += ((isHovered ? 1 : 0) - explodeProgress) * 0.08;

    if (explodeProgress > 0.001) {
      for (let i = 0; i < posAttr.array.length; i++) {
        const wobble = isHovered ? Math.sin(t * 20 + i) * 0.1 * explodeProgress : 0;
        posAttr.array[i] = origPos[i] + (targetPos[i] - origPos[i]) * explodeProgress + wobble;
      }
      posAttr.needsUpdate = true;
    } else if (posAttr.array[0] !== origPos[0]) {
      for (let i = 0; i < posAttr.array.length; i++) posAttr.array[i] = origPos[i];
      posAttr.needsUpdate = true;
    }

    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* --- SOFT AURORA BACKGROUND (纯正多巴胺锁定版) --- */
function initAurora() {
  const container = document.getElementById('aurora-bg');
  if (!container) return;

  function hexToVec3(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  const vertexShader = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
  `;

  // 移除了原版生成红黄色的 cosineGradient 公式
  const fragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uResolution;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uBrightness;
  uniform vec3 uColor1; // 绑定的纯粉色
  uniform vec3 uColor2; // 绑定的纯青色
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;
  uniform float uBandHeight;
  uniform float uBandSpread;
  uniform float uOctaveDecay;
  uniform float uLayerOffset;
  uniform float uColorSpeed;
  uniform vec2 uMouse;
  uniform float uMouseInfluence;
  uniform bool uEnableMouse;

  #define TAU 6.28318

  vec3 gradientHash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 234.6)), dot(p, vec3(269.5, 183.3, 198.3)), dot(p, vec3(169.5, 283.3, 156.9)));
    vec3 h = fract(sin(p) * 43758.5453123);
    float phi = acos(2.0 * h.x - 1.0);
    float theta = TAU * h.y;
    return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
  }

  float quinticSmooth(float t) {
    float t2 = t * t; float t3 = t * t2;
    return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
  }

  float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
    float x = px * frequency; float y = py * frequency;
    float fx = floor(x); float fy = floor(y); float fz = floor(pz);
    float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

    vec3 g000 = gradientHash(vec3(fx, fy, fz)); vec3 g100 = gradientHash(vec3(cx, fy, fz));
    vec3 g010 = gradientHash(vec3(fx, cy, fz)); vec3 g110 = gradientHash(vec3(cx, cy, fz));
    vec3 g001 = gradientHash(vec3(fx, fy, cz)); vec3 g101 = gradientHash(vec3(cx, fy, cz));
    vec3 g011 = gradientHash(vec3(fx, cy, cz)); vec3 g111 = gradientHash(vec3(cx, cy, cz));

    float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz)); float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
    float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz)); float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
    float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz)); float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
    float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz)); float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

    float sx = quinticSmooth(x - fx); float sy = quinticSmooth(y - fy); float sz = quinticSmooth(pz - fz);

    float lx00 = mix(d000, d100, sx); float lx10 = mix(d010, d110, sx);
    float lx01 = mix(d001, d101, sx); float lx11 = mix(d011, d111, sx);

    float ly0 = mix(lx00, lx10, sy); float ly1 = mix(lx01, lx11, sy);
    return amplitude * mix(ly0, ly1, sz);
  }

  float auroraGlow(float t, vec2 shift) {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv += shift;
    float noiseVal = 0.0;
    float freq = uNoiseFreq; float amp = uNoiseAmp;
    vec2 samplePos = uv * uScale;

    for (float i = 0.0; i < 3.0; i += 1.0) {
      noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
      amp *= uOctaveDecay; freq *= 2.0;
    }
    float yBand = uv.y * 10.0 - uBandHeight * 10.0;
    return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float t = uSpeed * 0.4 * uTime;
    vec2 shift = vec2(0.0);
    if (uEnableMouse) { shift = (uMouse - 0.5) * uMouseInfluence; }

    // 强行锁死纯正颜色：没有红色！
    // mix1 和 mix2 用来让颜色在这三个极品亮色之间平滑流动
    float mix1 = sin(uv.x * 4.0 + uTime * uColorSpeed) * 0.5 + 0.5;
    float mix2 = cos(uv.y * 3.0 - uTime * uColorSpeed) * 0.5 + 0.5;
    
    vec3 purePink = uColor1; // 由 JS 传入的亮粉色
    vec3 purePurple = vec3(0.6, 0.1, 0.95); // 纯电音紫
    vec3 pureCyan = uColor2; // 由 JS 传入的青色
    
    // 第一层极光：在亮粉色和紫色之间流动
    vec3 colorA = mix(purePink, purePurple, mix1);
    // 第二层极光：在青色和亮粉色之间流动
    vec3 colorB = mix(pureCyan, purePink, mix2);
    
    vec3 col = vec3(0.0);
    // 用 1.4 乘数直接暴力拉高发光亮度，去灰！
    col += 0.85 * auroraGlow(t, shift) * colorA;
    col += 0.85 * auroraGlow(t + uLayerOffset, shift) * colorB;

    col *= uBrightness;
    float alpha = clamp(length(col), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
  `;

  const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0); 
  container.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const isDark = window.__isDark ? window.__isDark() : false;
  
  let program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [window.innerWidth, window.innerHeight, window.innerWidth / window.innerHeight] },
      uSpeed: { value: 0.9 }, 
      uScale: { value: 1.5 },
      uBrightness: { value: 1.0 }, // 再次提亮
      
      // 核心多巴胺颜色锁死：FF33CC 是极其明亮娇嫩的粉，绝不发红
      uColor1: { value: hexToVec3(isDark ? '#FF10A0' : '#FF33CC') }, 
      uColor2: { value: hexToVec3('#00FFFF') }, // 霓虹青
      
      uNoiseFreq: { value: 2.5 },
      uNoiseAmp: { value: 1.0 },
      uBandHeight: { value: 0.5 },
      uBandSpread: { value: 0.7 },
      uOctaveDecay: { value: 0.1 },
      uLayerOffset: { value: 0 },
      uColorSpeed: { value: 2.0 }, 
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseInfluence: { value: 0.35 },
      uEnableMouse: { value: true }
    }
  });

  const mesh = new OglMesh(gl, { geometry, program });

  window.__updateAuroraTheme = (dark) => {
    program.uniforms.uColor1.value = hexToVec3(dark ? '#FF10A0' : '#FF33CC');
  };

  let currentMouse = [0.5, 0.5];
  let targetMouse = [0.5, 0.5];

  window.addEventListener('mousemove', (e) => {
    targetMouse = [ e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight ];
  });
  window.addEventListener('mouseleave', () => { targetMouse = [0.5, 0.5]; });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (program) {
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function update(time) {
    requestAnimationFrame(update);
    program.uniforms.uTime.value = time * 0.001;
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    program.uniforms.uMouse.value[0] = currentMouse[0];
    program.uniforms.uMouse.value[1] = currentMouse[1];
    renderer.render({ scene: mesh });
  }
  requestAnimationFrame(update);
}

/* --- STARTUP HOOKS --- */
window.addEventListener("load", () => {
  if (window.requestIdleCallback) {
    requestIdleCallback(initThree);
    requestIdleCallback(initAurora);
  } else {
    setTimeout(initThree, 1000);
    setTimeout(initAurora, 1000);
  }
});

/* --- TYPING ANIMATION --- */
(function typing() {
  const phrases = [
    "ARTISTA AI",
    "GAME DESIGNER",
    "CREATIVE CODER",
    "3D ARTIST",
    "INTERACTION DESIGNER",
  ];
  let pi = 0, ci = 0, del = false;
  const els = document.querySelectorAll("#typedRole, #typedRole-mobile");
  if (els.length === 0) return;
  function tick() {
    const cur = phrases[pi];
    const text = del ? cur.slice(0, --ci) : cur.slice(0, ++ci);
    els.forEach(el => el.textContent = text);
    if (!del && ci === cur.length) {
      del = true;
      setTimeout(tick, 1800);
      return;
    }
    if (del && ci === 0) {
      del = false;
      pi = (pi + 1) % phrases.length;
    }
    setTimeout(tick, del ? 55 : 100);
  }
  tick();
})();

/* --- NAVIGATION — smooth scroll & highlight --- */
const sectionOrder = ["home", "about", "skills", "projects", "certs", "contact"];
function switchSection(name) {
  const targetDesktop = document.getElementById("panel-" + name);
  const targetMobile = document.getElementById("panel-" + name + "-mobile");
  if (targetDesktop && targetDesktop.offsetParent !== null) targetDesktop.scrollIntoView({ behavior: "smooth", block: "start" });
  else if (targetMobile && targetMobile.offsetParent !== null) targetMobile.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchSection(btn.dataset.section));
});

function updateActiveNav() {
  const triggerY = window.innerHeight * 0.35;
  let closestSection = null;
  let closestDist = Infinity;
  sectionOrder.forEach((name) => {
    const el = document.getElementById("panel-" + name);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const dist = Math.abs(rect.top - triggerY);
    if (dist < closestDist) {
      closestDist = dist;
      closestSection = name;
    }
  });
  if (closestSection) {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(`.nav-btn[data-section="${closestSection}"]`).forEach((b) => b.classList.add("active"));
  }
}
window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

/* --- SECTION REVEAL ON SCROLL --- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".panel-inner").forEach((el) => revealObserver.observe(el));

/* --- INLINE EVENT HANDLERS REPLACEMENT --- */
document.addEventListener("DOMContentLoaded", () => {
  const navBrandBtn = document.getElementById("navBrandBtn");
  if (navBrandBtn) navBrandBtn.addEventListener("click", () => switchSection("home"));
  const exploreBtn = document.getElementById("exploreBtn");
  if (exploreBtn) exploreBtn.addEventListener("click", () => switchSection("projects"));
});

/* --- CONTACT FORM --- */
document.querySelectorAll("#contactForm, #contactForm-mobile").forEach(form => form.addEventListener("submit", function (e) {
  e.preventDefault();
  const btn = this.querySelector("[id^=formSubmitBtn]");
  const note = this.querySelector("[id^=formNote]");
  const name = this.querySelector("[id^=formName]").value.trim();
  const email = this.querySelector("[id^=formEmail]").value.trim();
  const msg = this.querySelector("[id^=formMessage]").value.trim();
  btn.textContent = "[ TRASMISSIONE IN CORSO... ]";
  btn.disabled = true;
  setTimeout(() => {
    window.location.href = `mailto:your_email@gmail.com?subject=Contatto Portfolio da ${encodeURIComponent(name)}&body=${encodeURIComponent(msg + "\n\nDa: " + email)}`;
    btn.textContent = "[ INVIA MESSAGGIO ]";
    btn.disabled = false;
    note.textContent = "// TRASMISSIONE COMPLETATA — client email aperto.";
    note.className = "form-note success";
    this.reset();
    setTimeout(() => { note.textContent = ""; note.className = "form-note"; }, 5000);
  }, 800);
}));

/* --- MOBILE HAMBURGER MENU (GSAP Staggered) --- */
(function initStaggeredMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const panel = document.getElementById("staggeredPanel");
  const menuOverlay = document.getElementById("menuOverlay");
  if (!hamburgerBtn || !panel || typeof gsap === "undefined") return;

  let isMenuOpen = false;
  gsap.set(".sm-prelayer", { x: 0, xPercent: 100 });
  gsap.set(".staggered-menu-panel", { x: 0, xPercent: 100 });
  gsap.set(".sm-panel-itemLabel", { y: 100, rotation: 5, opacity: 0 });
  gsap.set(".menu-overlay", { clipPath: "inset(0px 0px 0px 100%)", opacity: 0, pointerEvents: "none" });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
  tl.to(".menu-overlay", { clipPath: "inset(0px 0px 0px 0px)", opacity: 1, duration: 0.6, pointerEvents: "auto", ease: "power2.inOut" })
    .to(".sm-prelayer", { xPercent: 0, duration: 0.8, stagger: 0.1 }, "-=0.4")
    .to(".staggered-menu-panel", { xPercent: 0, duration: 0.8 }, "-=0.6")
    .to(".sm-panel-itemLabel", { y: 0, rotation: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power4.out" }, "-=0.4");

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    hamburgerBtn.classList.toggle("open", isMenuOpen);
    panel.classList.toggle("active", isMenuOpen);
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    if (isMenuOpen) tl.play(); else tl.reverse();
  }

  hamburgerBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  panel.querySelectorAll(".sm-panel-item").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      if (isMenuOpen) toggleMenu();
      setTimeout(() => switchSection(targetId), 600);
    });
  });
  if (menuOverlay) menuOverlay.addEventListener("click", () => { if (isMenuOpen) toggleMenu(); });
})();
/* --- PROJECT DETAIL OVERLAY (视频+多图弹窗逻辑) --- */
window.openProjectDetails = function(p) { 
  const overlay = document.getElementById("projectOverlay");
  
  // 1. 填充文字
  document.getElementById("overlayPre").textContent = `// ${p.category}`;
  document.getElementById("overlayTitle").textContent = p.title;
  document.getElementById("overlayDesc").textContent = p.desc;

  // 2. 填充 YouTube 视频
  const videoContainer = document.getElementById("overlayVideoContainer");
  const videoIframe = document.getElementById("overlayVideo");
  if (p.videoId && p.videoId.trim() !== "") {
    // 自动播放并静音，方便教授直接看画面
    videoIframe.src = `https://www.youtube.com/embed/${p.videoId}?autoplay=1&mute=1`;
    videoContainer.style.display = "block";
  } else {
    videoIframe.src = "";
    videoContainer.style.display = "none";
  }

  // 3. 填充第二张效果图
  const detailImg = document.getElementById("overlayDetailImg");
  if (p.detailImg && p.detailImg.trim() !== "") {
    detailImg.src = p.detailImg;
    detailImg.style.display = "block";
  } else {
    // 如果没有第二张图，就显示封面图兜底
    detailImg.src = p.img;
    detailImg.style.display = "block";
  }

  // 4. 填充技术标签
  const techEl = document.getElementById("overlayTech");
  techEl.textContent = "";
  if(p.tech) {
    p.tech.forEach((t) => {
      const span = document.createElement("span");
      span.textContent = t;
      techEl.appendChild(span);
    });
  }

  // 5. 显示弹窗并锁定背景滚动
  overlay.classList.add("open");
  document.body.style.overflow = "hidden"; 
};

/* --- 终极强制关闭逻辑 --- */
window.closeProject = function() {
  const overlay = document.getElementById("projectOverlay");
  if(overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
  const videoIframe = document.getElementById("overlayVideo");
  if(videoIframe) videoIframe.src = ""; 
};

// 无论点击哪里，只要点到了关闭按钮，就强制执行！
document.addEventListener("click", function(e) {
  if (e.target && (e.target.id === "closeOverlayBtn" || e.target.closest("#closeOverlayBtn"))) {
    window.closeProject();
  }
});

