// Timeline 3D: a generic object for each era (form factors, not replicas of specific models).
import * as THREE from "three";
import { RoundedBoxGeometry } from "/assets/vendor/RoundedBoxGeometry.js";

const canvas = document.getElementById("era3d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { if (canvas) canvas.style.display = "none"; }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
  camera.position.set(0, .1, 7.4);
  scene.add(new THREE.HemisphereLight(0xeef3ff, 0x1a2a4a, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x4d8bff, 3.2); rim.position.set(-4, 2, -3); scene.add(rim);

  const rb = (w, h, d, r, mat, seg = 5) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)), mat);
  const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: .45, metalness: .1, clearcoat: .4 }, o));

  /* ---------- screen textures ---------- */
  function lcdTexture(year, label, color = "#c7f0d8", ink = "#43523d") {
    const c = document.createElement("canvas"); c.width = 320; c.height = 240;
    const g = c.getContext("2d");
    g.fillStyle = color; g.fillRect(0, 0, 320, 240);
    g.fillStyle = ink; g.textAlign = "center";
    g.font = '96px "VT323", monospace'; g.fillText(year, 160, 130);
    g.font = '30px "VT323", monospace'; g.fillText(label, 160, 180);
    for (let y = 0; y < 240; y += 4) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(0, y, 320, 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function colorTexture(year, tiles) {
    const c = document.createElement("canvas"); c.width = 300; c.height = 540;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 300, 540); grd.addColorStop(0, "#0a2a6b"); grd.addColorStop(1, "#00a6ff");
    g.fillStyle = grd; g.fillRect(0, 0, 300, 540);
    g.fillStyle = "#fff"; g.textAlign = "left";
    g.font = '700 64px "Inter Tight", sans-serif'; g.fillText(year, 22, 92);
    if (tiles) {
      const cols = ["#ff3b4a", "#ffb000", "#2fe0b0", "#7c5cff", "#ffffff", "#00d0ff"];
      for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = .9; g.fillRect(22 + (i % 2) * 134, 130 + Math.floor(i / 2) * 98, 122, 86); }
      g.globalAlpha = 1;
    } else {
      for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(60 + (i % 3) * 90, 190 + Math.floor(i / 3) * 100, 28, 0, Math.PI * 2); g.fill(); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const screenMesh = (w, h, tex) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));

  function keypad(group, cols, rows, x0, y0, dx, dy, w, h, z, m) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = rb(w, h, .05, Math.min(w, h) / 2.2, m, 2);
      k.position.set(x0 + c * dx, y0 - r * dy, z); group.add(k);
    }
  }

  /* ---------- era builders ---------- */
  const B = {
    paper() {
      const g = new THREE.Group();
      const sheet = mat(0xf4efe4, { roughness: .9, clearcoat: 0 });
      for (let i = 0; i < 6; i++) { const s = rb(1.7, .05, 1.2, .02, sheet, 1); s.position.y = -.6 + i * .06; s.rotation.y = (i % 2 ? .06 : -.05) * i; g.add(s); }
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 48), sheet);
      roll.rotation.z = Math.PI / 2; roll.position.set(0, .05, 0); g.add(roll);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.62, 24), mat(0x8a6a45, { roughness: .8 }));
      core.rotation.z = Math.PI / 2; core.position.copy(roll.position); g.add(core);
      g.rotation.x = .35; return g;
    },
    cable() {
      const g = new THREE.Group();
      const wood = mat(0x8a6a45, { roughness: .8, clearcoat: 0 });
      for (const z of [-.55, .55]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .1, 48), wood); d.rotation.x = Math.PI / 2; d.position.z = z; g.add(d); }
      const wire = mat(0x1d1f24, { roughness: .35, clearcoat: .8 });
      const copper = mat(0xc4743a, { metalness: .8, roughness: .3 });
      for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.55 + (i % 3) * .14, .07, 12, 48), i % 4 === 0 ? copper : wire); t.position.z = -.45 + i * .11; g.add(t); }
      g.rotation.y = .6; return g;
    },
    brick(y) {
      const g = new THREE.Group();
      const body = mat(0x2b2f36, { roughness: .6 });
      g.add(rb(.78, 2.5, .52, .08, body));
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .9, 16), mat(0x111317)); ant.position.set(.24, 1.68, 0); g.add(ant);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), mat(0x111317)); tip.position.set(.24, 2.13, 0); g.add(tip);
      const scr = screenMesh(.56, .22, lcdTexture(y, "")); scr.position.set(0, .85, .262); g.add(scr);
      for (let i = 0; i < 4; i++) { const l = rb(.4, .025, .02, .01, mat(0x15171b), 1); l.position.set(0, 1.08 + i * .045, .262); g.add(l); }
      keypad(g, 3, 5, -.22, .45, .22, .2, .17, .12, .265, mat(0xb9c0c9));
      return g;
    },
    early(y) {
      const g = new THREE.Group();
      g.add(rb(.82, 2.05, .38, .16, mat(0x23262d)));
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .38, 16), mat(0x101215)); ant.position.set(-.26, 1.18, 0); g.add(ant);
      const bez = rb(.66, .5, .03, .04, mat(0x101215), 2); bez.position.set(0, .5, .19); g.add(bez);
      const scr = screenMesh(.56, .4, lcdTexture(y, "GSM")); scr.position.set(0, .5, .207); g.add(scr);
      keypad(g, 2, 1, -.17, .08, .34, 0, .26, .1, .2, mat(0x9aa3ae));
      keypad(g, 3, 4, -.24, -.18, .24, .19, .18, .11, .2, mat(0xc7ced8));
      return g;
    },
    classic(y) {
      const g = new THREE.Group();
      g.add(rb(.95, 1.95, .44, .32, mat(0x0b3d91, { clearcoat: 1, roughness: .3 })));
      const face = rb(.82, 1.8, .04, .26, mat(0x0a1c45), 3); face.position.z = .2; g.add(face);
      const bez = rb(.7, .58, .03, .06, mat(0x9fb7a9), 2); bez.position.set(0, .5, .225); g.add(bez);
      const scr = screenMesh(.62, .5, lcdTexture(y, "")); scr.position.set(0, .5, .242); g.add(scr);
      const nav = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .05, 32), mat(0x005aff, { clearcoat: 1 })); nav.rotation.x = Math.PI / 2; nav.position.set(0, .03, .24); g.add(nav);
      keypad(g, 2, 1, -.26, .03, .52, 0, .22, .1, .235, mat(0xdfe7f3));
      keypad(g, 3, 4, -.25, -.22, .25, .17, .2, .1, .235, mat(0xdfe7f3));
      return g;
    },
    slider(y) {
      const g = new THREE.Group();
      g.add(rb(.95, 2.0, .16, .12, mat(0x8d939c, { metalness: .6, roughness: .3 })));
      keypad(g, 3, 4, -.27, -.42, .27, .15, .22, .1, .09, mat(0x2a2e35));
      const front = rb(.95, 1.4, .16, .12, mat(0x15171c, { clearcoat: 1 })); front.position.set(0, .36, .16); g.add(front);
      const scr = screenMesh(.8, 1.08, colorTexture(y, false)); scr.position.set(0, .4, .242); g.add(scr);
      return g;
    },
    touch(y) {
      const g = new THREE.Group();
      g.add(rb(1.05, 2.1, .18, .16, mat(0x00a2e8, { clearcoat: 1, roughness: .25 })));
      const glass = rb(.98, 2.0, .03, .12, mat(0x05070c, { clearcoat: 1, roughness: .1 }), 3); glass.position.z = .09; g.add(glass);
      const scr = screenMesh(.9, 1.62, colorTexture(y, true)); scr.position.set(0, .02, .108); g.add(scr);
      return g;
    },
    network(y) {
      const g = new THREE.Group();
      const white = mat(0xf2f5fa, { roughness: .4 }), blue = mat(0x005aff, { clearcoat: 1 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 2.6, 16), white); pole.position.set(-.45, 0, 0); g.add(pole);
      for (let i = 0; i < 3; i++) { const a = rb(.16, .7, .08, .03, white, 2); const ang = i * Math.PI * 2 / 3; a.position.set(-.45 + Math.cos(ang) * .2, .9, Math.sin(ang) * .2); a.rotation.y = -ang; g.add(a); }
      const rack = rb(.75, 1.7, .6, .06, mat(0x0b1426, { roughness: .5 })); rack.position.set(.5, -.45, 0); g.add(rack);
      const leds = [];
      for (let r = 0; r < 7; r++) {
        const slot = rb(.62, .14, .02, .02, mat(0x1c2940), 1); slot.position.set(.5, .2 - r * .21, .31); g.add(slot);
        for (let k = 0; k < 3; k++) {
          const led = new THREE.Mesh(new THREE.CircleGeometry(.022, 12), new THREE.MeshBasicMaterial({ color: k === 0 ? 0x2fe0b0 : 0x5aa0ff }));
          led.position.set(.28 + k * .06, .2 - r * .21, .322); g.add(led); leds.push(led);
        }
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .015, 8, 64), blue); ring.position.set(-.45, .9, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
      g.userData.leds = leds; g.userData.ring = ring;
      return g;
    },
  };

  /* ---------- show / transitions ---------- */
  let current = null, currentEra = "", wantEra = null, wantYear = "";
  const holder = new THREE.Group(); scene.add(holder);
  function fitObject(obj) {
    const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
    const s = 2.5 / Math.max(size.y, size.x * .9, .01);
    obj.scale.setScalar(s); obj.userData.base = s;
  }
  function show(era, year) {
    wantEra = era; wantYear = year;
    if (!B[era]) return;
    const next = B[era](year);
    fitObject(next);
    const base = next.userData.base;
    const old = current;
    current = next; currentEra = era;
    holder.add(next);
    if (window.gsap && !reduce) {
      if (old) gsap.to(old.scale, { x: 0.001, y: 0.001, z: 0.001, duration: .35, ease: "power2.in", onComplete: () => holder.remove(old) });
      if (old) gsap.to(old.rotation, { y: old.rotation.y + 1.2, duration: .35 });
      next.scale.setScalar(0.001);
      next.rotation.y = -1.4;
      gsap.to(next.scale, { x: base, y: base, z: base, duration: .8, delay: old ? .25 : 0, ease: "back.out(1.6)" });
      gsap.to(next.rotation, { y: 0, duration: 1.1, delay: old ? .25 : 0, ease: "expo.out" });
    } else if (old) holder.remove(old);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    return true;
  }
  let mx = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; });
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden || !resize()) return;
    const t = clock.getElapsedTime();
    holder.rotation.y = reduce ? -.35 : -.35 + Math.sin(t * .6) * .35 + mx * .4;
    holder.rotation.x = .06;
    holder.position.y = reduce ? 0 : Math.sin(t * 1.2) * .05;
    if (current && current.userData.leds) {
      current.userData.leds.forEach((l, i) => (l.visible = Math.sin(t * 6 + i * 1.7) > -.3));
      current.userData.ring.scale.setScalar(1 + (t % 1.5) * .6);
      current.userData.ring.material.opacity = 1;
    }
    renderer.render(scene, camera);
  })();

  const api = {
    show(era, year) {
      if (era === currentEra && current) {
        if (year !== wantYear) show(era, year); // same era, new year: rebuild quickly so the screen shows the year
        return;
      }
      show(era, year);
    },
  };
  window.Era3D = api;
  const go = () => { const p = window.__eraPending; if (p) api.show(p[0], p[1]); else api.show("paper", "1865"); };
  if (document.fonts) document.fonts.load('40px "VT323"').then(go, go); else go();
}
