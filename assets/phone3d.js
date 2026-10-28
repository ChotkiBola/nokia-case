// Generic 3D candybar phone for the hero (three.js). Not a replica of any specific model.
import * as THREE from "three";
import { RoundedBoxGeometry } from "/assets/vendor/RoundedBoxGeometry.js";

const canvas = document.getElementById("phone3d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  canvas.style.display = "none";
}

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, 0, 7.2);

  /* lights */
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0a1a3d, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3d7bff, 4.0); rim.position.set(-4, 1.5, -3); scene.add(rim);
  const fill = new THREE.PointLight(0x00b4ff, 6, 12); fill.position.set(2.5, -2, 2.5); scene.add(fill);

  /* phone body */
  const phone = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0f2a63, metalness: .35, roughness: .32, clearcoat: 1, clearcoatRoughness: .18 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.25, 2.7, .42, 8, .2), bodyMat);
  phone.add(body);

  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0x0a1c45, metalness: .2, roughness: .45, clearcoat: .6 });
  const face = new THREE.Mesh(new RoundedBoxGeometry(1.1, 2.5, .05, 6, .02), faceMat);
  face.position.z = .2; phone.add(face);

  /* screen with live canvas texture (LCD) */
  const sc = document.createElement("canvas"); sc.width = 384; sc.height = 300;
  const sctx = sc.getContext("2d");
  const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(.92, .78, .03, 4, .03), new THREE.MeshStandardMaterial({ color: 0x9fb7a9, roughness: .6 }));
  bezel.position.set(0, .62, .235); phone.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.84, .66), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, .62, .252); phone.add(screen);

  /* earpiece */
  const ear = new THREE.Mesh(new RoundedBoxGeometry(.32, .05, .03, 2, .02), new THREE.MeshStandardMaterial({ color: 0x030814, roughness: .8 }));
  ear.position.set(0, 1.12, .235); phone.add(ear);

  /* keys */
  const keyMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe7f3, roughness: .35, clearcoat: .8 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: 0x005aff, roughness: .3, clearcoat: 1 });
  const navGeo = new RoundedBoxGeometry(.36, .13, .05, 3, .05);
  const left = new THREE.Mesh(navGeo, keyMat); left.position.set(-.23, .02, .24); phone.add(left);
  const right = new THREE.Mesh(navGeo, keyMat); right.position.set(.23, .02, .24); phone.add(right);
  const ok = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .05, 32), accentMat);
  ok.rotation.x = Math.PI / 2; ok.position.set(0, .02, .245); phone.add(ok);
  const kGeo = new RoundedBoxGeometry(.26, .12, .05, 3, .05);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const k = new THREE.Mesh(kGeo, keyMat);
    k.position.set((c - 1) * .32, -.26 - r * .21, .24);
    phone.add(k);
  }
  scene.add(phone);

  /* soft shadow */
  const sh = document.createElement("canvas"); sh.width = sh.height = 128;
  const shc = sh.getContext("2d"); const grd = shc.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,20,70,.45)"); grd.addColorStop(1, "rgba(0,20,70,0)");
  shc.fillStyle = grd; shc.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.position.set(0, -1.85, -.2); scene.add(shadow);

  /* LCD content: years cycle */
  const frames = [["1865", "qog‘oz fabrikasi"], ["1998", "№1 telefon brendi"], ["2007", "40% bozor"], ["2013", "telefonlar sotildi"], ["2026", "AI tarmoqlari"]];
  let fi = 0, lastSwap = 0;
  function drawLCD(t) {
    sctx.fillStyle = "#c7f0d8"; sctx.fillRect(0, 0, sc.width, sc.height);
    sctx.fillStyle = "#43523d";
    sctx.font = '26px "VT323", monospace'; sctx.textAlign = "left";
    sctx.fillText("NOKIA CASE", 18, 34);
    sctx.textAlign = "right"; sctx.fillText("▮▮▮▯", sc.width - 18, 34);
    sctx.fillRect(18, 46, sc.width - 36, 2);
    const [y, txt] = frames[fi];
    sctx.textAlign = "center";
    sctx.font = '104px "VT323", monospace'; sctx.fillText(y, sc.width / 2, 170);
    sctx.font = '34px "VT323", monospace'; sctx.fillText(txt, sc.width / 2, 222);
    if (Math.floor(t / 500) % 2) sctx.fillRect(sc.width / 2 - 14, 252, 28, 4);
    for (let yy = 0; yy < sc.height; yy += 4) { sctx.fillStyle = "rgba(67,82,61,.06)"; sctx.fillRect(0, yy, sc.width, 2); }
    tex.needsUpdate = true;
  }

  /* sizing */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < .8 ? 8.6 : 7.2;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);

  /* interaction */
  let mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  /* intro */
  const intro = { y: -3.5, spin: -Math.PI * 1.25, s: .7 };
  if (window.gsap && !reduce) gsap.to(intro, { y: 0, spin: 0, s: 1, duration: 2.2, ease: "expo.out", delay: .2 });
  else { intro.y = 0; intro.spin = 0; intro.s = 1; }

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  document.fonts && document.fonts.load('40px "VT323"').then(() => drawLCD(0));
  resize(); drawLCD(0);
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    if (t * 1000 - lastSwap > 1900) { lastSwap = t * 1000; fi = (fi + 1) % frames.length; }
    drawLCD(t * 1000);
    const idle = reduce ? 0 : 1;
    phone.position.y = intro.y + Math.sin(t * 1.1) * .06 * idle;
    phone.rotation.y = intro.spin - .45 + Math.sin(t * .5) * .25 * idle + mx * .6;
    phone.rotation.x = .08 + my * -.3 + Math.sin(t * .7) * .03 * idle;
    phone.rotation.z = -.06 + Math.sin(t * .4) * .02 * idle;
    phone.scale.setScalar(intro.s);
    shadow.material.opacity = .6 + Math.sin(t * 1.1) * -.15;
    renderer.render(scene, camera);
  })();
}
