(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const G = window.gsap;
  if (!G) root.classList.remove("anim");
  if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ================= host (presenter) mode ================= */
  const params = new URLSearchParams(location.search);
  if (params.has("host")) {
    store.set("nokia-host", "1");
    if (params.get("host")) store.set("nokia-key", params.get("host"));
    history.replaceState(null, "", location.pathname + location.hash);
  }
  if (params.has("guest")) store.set("nokia-host", "0");
  const isHost = store.get("nokia-host") === "1";
  const hostKey = store.get("nokia-key") || "";
  if (isHost) document.body.classList.add("is-host");

  /* ================= QR + join url ================= */
  const joinUrl = location.origin + "/join";
  $$("[data-join-url]").forEach(el => (el.textContent = joinUrl.replace(/^https?:\/\//, "")));
  try {
    const qr = qrcode(0, "M"); qr.addData(joinUrl); qr.make();
    const svg = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    $$("[data-qr]").forEach(el => (el.innerHTML = svg));
  } catch (e) { $$("[data-qr]").forEach(el => (el.textContent = "QR")); }

  /* ================= dynamic content ================= */
  const TL = [
    ["1865", "Fredrik Idestam qog‘oz fabrikasiga asos soldi", "rise"],
    ["1967", "Qog‘oz, rezina va kabel zavodlari birlashib, Nokia korporatsiyasi tuzildi", "rise"],
    ["1987", "Birinchi qo‘lda olib yuriladigan telefon, Mobira Cityman", "rise"],
    ["1991", "Dunyodagi birinchi GSM qo‘ng‘irog‘i Nokia uskunalari orqali amalga oshirildi", "rise"],
    ["1992", "Yorma Ollila bosh direktor, kompaniya mobil aloqaga ixtisoslashdi", "rise"],
    ["1998", "Nokia dunyodagi eng yirik telefon ishlab chiqaruvchisi", "rise"],
    ["2007", "Bozor ulushi cho‘qqida, Apple iPhone’ni taqdim etdi", "crisis"],
    ["2011", "«Yonayotgan platforma» maktubi, Windows Phone tanlandi", "crisis"],
    ["2013", "Telefon biznesi Microsoftga 5,44 mlrd yevroga sotildi", "crisis"],
    ["2016", "Alcatel-Lucent sotib olindi, brend HMDga litsenziyaga berildi", "rebirth"],
    ["2025", "Infinera sotib olindi, Nvidia 1 mlrd dollar kiritdi", "rebirth"],
    ["2026", "Sun’iy intellekt infratuzilmasiga burilish", "rebirth"],
  ];
  const track = $("#track");
  track.innerHTML = TL.map(([y, t, p]) => `<div class="tcard" data-p="${p}"><b>${y}</b><p>${t}</p></div>`).join("");

  const pic = $("#pictogram");
  const phoneSvg = '<svg class="ph" viewBox="0 0 40 72"><rect class="body" x="2" y="2" width="36" height="68" rx="9"/><rect x="8" y="10" width="24" height="20" rx="3" fill="rgba(255,255,255,.75)"/><g fill="rgba(255,255,255,.6)"><rect x="8" y="38" width="6" height="4" rx="2"/><rect x="17" y="38" width="6" height="4" rx="2"/><rect x="26" y="38" width="6" height="4" rx="2"/><rect x="8" y="46" width="6" height="4" rx="2"/><rect x="17" y="46" width="6" height="4" rx="2"/><rect x="26" y="46" width="6" height="4" rx="2"/><rect x="8" y="54" width="6" height="4" rx="2"/><rect x="17" y="54" width="6" height="4" rx="2"/><rect x="26" y="54" width="6" height="4" rx="2"/></g></svg>';
  pic.innerHTML = phoneSvg.repeat(5);

  const PS = [
    ["Mobil tarmoqlar bozori turg‘un", "Uskuna bilan birga obuna asosidagi dasturiy ta’minot va AI-RAN xizmatlarini sotish"],
    ["2025-yilda rentabellik 13,4% dan 10,2% ga tushdi", "Kam daromadli yo‘nalishlardan chiqish, IP va optik tarmoqlarga e’tibor, Infinera’dan 200 mln € tejamkorlik"],
    ["Restrukturizatsiya tufayli pul oqimi manfiy", "Dasturni muddatida yakunlash, zaxiralar va debitorlik qarzlarini qat’iy nazorat qilish"],
    ["AI talabiga ishlab chiqarish quvvati yetmayapti", "Yangi optik zavodlarni tezroq ishga tushirish, Nvidia bilan birgalikda rejalashtirish"],
    ["Huawei va Ericsson bilan narx raqobati", "Narx emas, «ishonchli yetkazib beruvchi» maqomi, energiya tejamkorlik va 6G yetakchiligi bilan raqobatlashish"],
  ];
  const psGrid = $("#psGrid");
  PS.forEach(([p, s], i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "flip"; b.dataset.a = "up";
    b.setAttribute("aria-label", `Muammo ${i + 1}: ${p}. Yechimni ko‘rish uchun bosing`);
    b.innerHTML = `<div class="inner"><div class="face front"><span class="k">Muammo ${i + 1}</span><p>${p}</p><span class="hint">Yechimni ko‘rish uchun bosing</span></div><div class="face back"><span class="k">Yechim ${i + 1}</span><p>${s}</p></div></div>`;
    b.addEventListener("click", () => b.classList.toggle("open"));
    psGrid.appendChild(b);
  });

  const SCEN = {
    android: { tag: "Taxminiy ssenariy", title: "Nokia Android bilan", text: "Nokia tayyor ilovalar do‘koniga ega bo‘lib, smartfon bozoriga tezroq qaytishi mumkin edi. Kuchli brend, dizayn va arzon ishlab chiqarish uni yirik Android ishlab chiqaruvchilaridan biriga aylantirishi mumkin edi.", pts: ["Afzallik: ilovalar muammosi darhol hal bo‘ladi", "Xavf: Samsung va boshqa Android brendlari bilan qattiq narx raqobati", "Xavf: Google’ga bog‘liqlik, boshqalardan farqlanish qiyinlashadi"], real: "Haqiqatda Nokia Android asosidagi Nokia X telefonini faqat 2014-yilda chiqardi. Bu juda kech edi." },
    wp: { tag: "Haqiqatda tanlangan yo‘l", title: "Nokia Windows Phone bilan", text: "2011-yilda Stiven Elop Microsoft bilan strategik hamkorlikni tanladi. Lumia smartfonlarining dizayni maqtaldi, lekin Windows Phone ilovalar soni bo‘yicha iOS va Android’dan ancha ortda qoldi.", pts: ["Natija: smartfonlar bozoridagi ulush 2013-yilga kelib 3% gacha tushdi", "Natija: telefon biznesi Microsoftga 5,44 mlrd yevroga sotildi", "Natija: qariyb 32 ming xodim Microsoftga o‘tdi"], real: "Bu yo‘l Nokia telefon biznesining tugashiga olib keldi, lekin sotuvdan tushgan mablag‘ tarmoq biznesiga burilishga yordam berdi." },
    own: { tag: "Taxminiy ssenariy", title: "Nokia o‘z tizimi bilan", text: "Nokia’ning MeeGo tizimidagi N9 smartfoni 2011-yilda yaxshi baholangan edi. O‘z tizimi mustaqillik berardi, lekin ilovalar ekotizimini noldan qurish uchun vaqt qolmagan edi.", pts: ["Afzallik: mustaqillik va boshqalardan farqlanish", "Xavf: dasturchilar allaqachon iOS va Android’ga ketgan edi", "Xavf: katta investitsiya va bir necha yil vaqt kerak edi"], real: "Haqiqatda MeeGo Windows Phone foydasiga to‘xtatildi, N9 esa bu tizimdagi yagona ommaviy telefon bo‘lib qoldi." },
  };
  $$("#s-whatif .opt").forEach(b => b.addEventListener("click", () => {
    $$("#s-whatif .opt").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    const s = SCEN[b.dataset.opt];
    const box = $("#scenario");
    box.innerHTML = `<span class="tag">${s.tag}</span><h3>${s.title}</h3><p>${s.text}</p><ul>${s.pts.map(p => `<li>${p}</li>`).join("")}</ul><p class="real">${s.real}</p>`;
    if (G && !reduce) G.from(box.children, { y: 16, autoAlpha: 0, stagger: .06, duration: .45, ease: "power2.out" });
  }));

  /* ================= text splitting ================= */
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = 1;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(" ");
  }
  function splitChars(el) {
    if (el.dataset.split) return;
    el.dataset.split = 1;
    el.innerHTML = [...el.textContent.trim()].map(c => `<span class="w"><span class="ch">${c}</span></span>`).join("");
  }
  $$('[data-a="title"]').forEach(splitWords);
  $$('[data-a="letters"]').forEach(splitChars);

  /* ================= counters ================= */
  function fmtNum(el, v) {
    const dec = +(el.dataset.dec || 0);
    const s = el.dataset.plain ? String(Math.round(v)) : v.toFixed(dec).replace(".", ",");
    return (el.dataset.prefix || "") + s + (el.dataset.suffix || "");
  }
  function countUp(el, tl, at) {
    const to = parseFloat(el.dataset.count), from = parseFloat(el.dataset.from || 0);
    const o = { v: from };
    el.textContent = fmtNum(el, from);
    tl.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = fmtNum(el, o.v)) }, at);
  }

  /* ================= slide enter animation ================= */
  function playIn(sec) {
    const els = $$("[data-a]", sec);
    if (!G || reduce) {
      els.forEach(e => (e.style.visibility = "visible"));
      $$("[data-count]", sec).forEach(e => (e.textContent = fmtNum(e, parseFloat(e.dataset.count))));
      $$(".track-bar i[data-w]", sec).forEach(i => (i.style.width = i.dataset.w + "%"));
      $$(".vbar i[data-h]", sec).forEach(i => (i.style.height = i.dataset.h + "%"));
      $$("#pictogram .ph", sec).forEach((p, i) => p.classList.toggle("on", i < 2));
      return;
    }
    const tl = G.timeline({ defaults: { ease: "power3.out" } });
    let t = 0;
    els.forEach(el => {
      const kind = el.dataset.a;
      G.set(el, { visibility: "visible" });
      if (kind === "title" || kind === "letters") {
        const parts = $$(".w > span", el);
        tl.fromTo(parts, { yPercent: 115, rotate: kind === "letters" ? 8 : 3 }, { yPercent: 0, rotate: 0, duration: kind === "letters" ? 1.1 : .9, stagger: kind === "letters" ? .06 : .045, ease: "expo.out" }, t);
        t += .18;
      } else if (kind === "scale") {
        tl.fromTo(el, { autoAlpha: 0, scale: .86, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: "expo.out" }, t);
        t += .12;
      } else if (kind === "pop") {
        tl.fromTo(el.children.length ? el.children : el, { autoAlpha: 0, scale: 0, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: .6, stagger: .07, ease: "back.out(2.2)" }, t);
        t += .1;
      } else {
        tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .9 }, t);
        t += .09;
      }
      if (el.dataset.count) countUp(el, tl, Math.max(0, t - .1));
    });
    const bars = $$(".track-bar i[data-w]", sec);
    if (bars.length) tl.fromTo(bars, { width: 0 }, { width: i => bars[i].dataset.w + "%", duration: 1.6, stagger: .18, ease: "power4.out" }, .4);
    const vb = $$(".vbar i[data-h]", sec);
    if (vb.length) tl.fromTo(vb, { height: 0 }, { height: i => vb[i].dataset.h + "%", duration: 1.3, stagger: .12, ease: "expo.out" }, .5);
    const phs = $$("#pictogram .ph", sec);
    if (phs.length) {
      phs.forEach(p => p.classList.remove("on"));
      tl.fromTo(phs, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .08, duration: .6, ease: "back.out(1.8)" }, .5);
      tl.add(() => phs[0].classList.add("on"), 1.2).add(() => phs[1].classList.add("on"), 1.45);
    }
    return tl;
  }

  /* ================= activation ================= */
  const sections = $$("section.slide");
  let current = null;
  const played = new WeakSet();
  function activate(sec, replay) {
    if (!sec) return;
    if (current !== sec) {
      current && current.classList.remove("on");
      current = sec;
      sec.classList.add("on");
      document.body.dataset.theme = sec.dataset.theme || "light";
      document.body.dataset.slide = sec.id;
      Live.onSlide(sec);
      Embers.toggle(sec.id === "s-platform");
      if (sec.id === "s-finale" && window.SnakeRahmat) setTimeout(() => window.SnakeRahmat.startMessage(), 700);
    }
    if (replay || !played.has(sec)) { played.add(sec); playIn(sec); }
  }

  /* scroll mode triggers */
  const triggers = [];
  function setupScroll() {
    if (!window.ScrollTrigger) { sections.forEach(s => activate(s)); return; }
    sections.forEach(sec => {
      triggers.push(ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 45%",
        onEnter: () => activate(sec), onEnterBack: () => activate(sec),
      }));
    });
    if (!reduce) {
      const tlSec = $("#s-timeline");
      triggers.push(ScrollTrigger.create({
        trigger: tlSec, start: "top top", end: "bottom bottom", scrub: .6,
        animation: G.fromTo(track, { x: 0 }, { x: () => -(track.scrollWidth - innerWidth + 40), ease: "none" }),
        invalidateOnRefresh: true,
      }));
      G.to("#phone3d", { yPercent: 18, ease: "none", scrollTrigger: { trigger: "#s-hero", start: "top top", end: "bottom top", scrub: true } });
    }
    triggers.push(ScrollTrigger.create({
      start: 0, end: "max", onUpdate: self => ($("#progress").style.width = self.progress * 100 + "%"),
    }));
  }

  /* ================= presentation mode ================= */
  let idx = 0, presenting = false;
  function fit(sec) {
    const st = $(".stage", sec);
    if (!st || sec.classList.contains("timeline")) return;
    st.style.transform = "none";
    const s = Math.min(1, (innerHeight - 20) / st.scrollHeight, innerWidth / st.scrollWidth);
    st.style.transform = s < 1 ? `scale(${s})` : "none";
  }
  function show(i, dir = 1) {
    const next = Math.max(0, Math.min(sections.length - 1, i));
    const prev = sections[idx], sec = sections[next];
    if (presenting && prev === sec && prev.classList.contains("current")) return;
    idx = next;
    if (prev !== sec && G && !reduce) {
      G.to(prev, { autoAlpha: 0, scale: .96, filter: "blur(8px)", duration: .55, ease: "power2.inOut", onComplete: () => { prev.classList.remove("current"); G.set(prev, { clearProps: "filter,scale" }); } });
    } else if (prev !== sec) prev.classList.remove("current");
    sec.classList.add("current");
    fit(sec);
    if (G && !reduce) G.fromTo(sec, { autoAlpha: 0, scale: 1.04, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: .8, ease: "power3.out", delay: prev !== sec ? .15 : 0 });
    if (sec.id === "s-timeline" && G) {
      G.killTweensOf(track);
      G.fromTo(track, { x: innerWidth * .2 }, { x: -(track.scrollWidth - innerWidth + 40), duration: reduce ? 0 : 9, ease: "power1.inOut", delay: .6 });
    }
    current && current.classList.remove("on");
    current = null;
    activate(sec, true);
    $("#slideNum").textContent = `${idx + 1} / ${sections.length}`;
    $("#progress").style.width = ((idx + 1) / sections.length) * 100 + "%";
  }
  function enterPresent(start) {
    presenting = true;
    triggers.forEach(t => t.disable(true));
    document.body.classList.add("present");
    $("#presentBtn").textContent = "Taqdimotdan chiqish";
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    sections.forEach(s => s.classList.remove("current"));
    idx = start;
    show(start);
  }
  function exitPresent() {
    presenting = false;
    document.body.classList.remove("present");
    $("#presentBtn").textContent = "Taqdimot rejimi";
    sections.forEach(s => { s.classList.remove("current"); if (G) G.set(s, { clearProps: "all" }); const st = $(".stage", s); if (st) st.style.transform = ""; });
    if (G) G.set(track, { clearProps: "transform" });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    triggers.forEach(t => t.enable());
    window.ScrollTrigger && ScrollTrigger.refresh();
    sections[idx].scrollIntoView();
  }
  $("#presentBtn").addEventListener("click", e => { e.currentTarget.blur(); presenting ? exitPresent() : enterPresent(0); });
  $$("[data-start]").forEach(b => b.addEventListener("click", e => { e.currentTarget.blur(); enterPresent(1); }));
  $("#prevBtn").addEventListener("click", () => show(idx - 1, -1));
  $("#nextBtn").addEventListener("click", () => show(idx + 1, 1));
  $("#exitBtn").addEventListener("click", exitPresent);
  addEventListener("resize", () => { if (presenting) fit(sections[idx]); });
  document.addEventListener("fullscreenchange", () => { if (presenting) setTimeout(() => fit(sections[idx]), 150); });
  addEventListener("keydown", e => {
    if (window.SnakeRahmat && window.SnakeRahmat.isPlaying()) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (!presenting) { if (e.key === "p" || e.key === "P") enterPresent(0); return; }
    const onControl = e.target.closest && e.target.closest("button, a");
    if (onControl && (e.key === " " || e.key === "Enter")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(idx + 1, 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); show(idx - 1, -1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(sections.length - 1);
    else if (e.key === "Escape") exitPresent();
  });
  let tx = null;
  addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => {
    if (tx === null || !presenting || (window.SnakeRahmat && window.SnakeRahmat.isPlaying())) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1));
  });

  /* ================= embers (burning platform) ================= */
  var Embers = (() => {
    const cv = $("#embers"), ctx = cv.getContext("2d");
    let on = false, parts = [], raf = 0;
    function size() { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; }
    function spawn() { return { x: Math.random() * cv.width, y: cv.height + 10, r: 1 + Math.random() * 3, vy: .6 + Math.random() * 1.8, vx: (Math.random() - .5) * .6, life: 0, max: 240 + Math.random() * 200, h: 10 + Math.random() * 30 }; }
    function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (parts.length < 140) parts.push(spawn(), spawn());
      parts.forEach(p => {
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life + p.h) / 30) * .4;
        const a = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = `hsla(${p.h},100%,${55 + p.r * 5}%,${a * .9})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      parts = parts.filter(p => p.life < p.max && p.y > -10);
      const g = ctx.createLinearGradient(0, cv.height, 0, cv.height * .55);
      g.addColorStop(0, "rgba(255,70,40,.28)"); g.addColorStop(1, "rgba(255,70,40,0)");
      ctx.fillStyle = g; ctx.fillRect(0, cv.height * .55, cv.width, cv.height * .45);
      if (on) raf = requestAnimationFrame(frame);
    }
    addEventListener("resize", () => on && size());
    return { toggle(v) { if (reduce || v === on) return; on = v; cancelAnimationFrame(raf); if (on) { size(); frame(); } else ctx.clearRect(0, 0, cv.width, cv.height); } };
  })();

  /* ================= LIVE: reactions, word clouds, polls ================= */
  var Live = (() => {
    const EMO = ["👏", "🔥", "😮", "😂", "❤️", "🤯"];
    const fx = $("#fx");
    const seen = new Set();
    let primed = false, lastState = "", sec = null, timer = null, busy = false, offline = false;

    function sendState(s) {
      if (!isHost || s === lastState) return;
      lastState = s;
      fetch("/api/host", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: "state", s, key: hostKey }) })
        .then(r => { if (r.status === 403) { document.querySelector(".host-chip").textContent = "Kalit noto‘g‘ri"; } })
        .catch(() => { lastState = ""; });
    }

    function spawn(i) {
      if (!EMO[i] || fx.childElementCount > 80) return;
      const el = document.createElement("span");
      el.className = "rx"; el.textContent = EMO[i];
      el.style.left = (4 + Math.random() * 88) + "vw";
      el.style.fontSize = (34 + Math.random() * 30) + "px";
      fx.appendChild(el);
      if (!G || reduce) { setTimeout(() => el.remove(), 1500); return; }
      const dur = 3.4 + Math.random() * 1.8;
      const tl = G.timeline({ onComplete: () => el.remove() });
      tl.fromTo(el, { y: 0, scale: .3, autoAlpha: 0 }, { y: -(innerHeight + 140), duration: dur, ease: "power1.out" }, 0)
        .to(el, { scale: 1, autoAlpha: 1, duration: .35, ease: "back.out(3)" }, 0)
        .to(el, { x: (Math.random() - .5) * 220, rotate: (Math.random() - .5) * 50, duration: dur, ease: "sine.inOut" }, 0)
        .to(el, { autoAlpha: 0, duration: dur * .3 }, dur * .7);
    }

    /* word cloud layout: spiral placement, sizes by sqrt(count) */
    const measure = document.createElement("canvas").getContext("2d");
    const palettes = ["#005aff", "#071a3d", "#00a6ff", "#3b6cff", "#0b2e7a"];
    function renderCloud(key, counts) {
      const box = $(`[data-cloud-box="${key}"]`), empty = $(`[data-cloud-empty="${key}"]`);
      if (!box) return;
      const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 60);
      const total = entries.reduce((a, [, c]) => a + c, 0);
      $$(`[data-cloud-count="${key}"]`).forEach(e => (e.textContent = total));
      empty.style.display = entries.length ? "none" : "grid";
      const W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) return;
      const max = entries.length ? entries[0][1] : 1;
      const big = Math.min(110, W / 7), small = Math.max(18, big * .24);
      const placed = [];
      const layout = [];
      entries.forEach(([word, c], n) => {
        const size = Math.round(small + (big - small) * Math.sqrt(c / max));
        measure.font = `800 ${size}px "Inter Tight"`;
        const w = measure.measureText(word).width + 14, h = size * 1.05 + 6;
        let x = 0, y = 0, ok = false;
        for (let t = 0; t < 900 && !ok; t += .35) {
          const r = 4 * t;
          x = r * Math.cos(t) * 1.35; y = r * Math.sin(t) * .8;
          const rect = { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 };
          if (rect.l < -W / 2 + 8 || rect.r > W / 2 - 8 || rect.t < -H / 2 + 8 || rect.b > H / 2 - 8) continue;
          ok = !placed.some(p => !(rect.r < p.l || rect.l > p.r || rect.b < p.t || rect.t > p.b));
          if (ok) placed.push(rect);
        }
        if (ok) layout.push({ word, c, size, x, y, color: palettes[n % palettes.length] });
      });
      const existing = new Map($$(".cw", box).map(el => [el.dataset.w, el]));
      layout.forEach(item => {
        let el = existing.get(item.word);
        const isNew = !el;
        if (isNew) {
          el = document.createElement("span");
          el.className = "cw"; el.dataset.w = item.word; el.textContent = item.word;
          el.title = isHost ? "Ikki marta bosing: so‘zni yashirish" : "";
          if (isHost) el.addEventListener("dblclick", () => hideWord(key, item.word, el));
          box.appendChild(el);
        }
        existing.delete(item.word);
        el.style.color = item.color;
        if (G && !reduce) {
          if (isNew) {
            G.set(el, { xPercent: -50, yPercent: -50, x: item.x, y: item.y, fontSize: item.size });
            G.fromTo(el, { scale: 0, autoAlpha: 0, rotate: -8 }, { scale: 1, autoAlpha: 1, rotate: 0, duration: .9, ease: "elastic.out(1, .55)" });
          } else {
            G.to(el, { x: item.x, y: item.y, fontSize: item.size, duration: .9, ease: "expo.out" });
          }
        } else {
          el.style.transform = `translate(-50%,-50%) translate(${item.x}px,${item.y}px)`;
          el.style.fontSize = item.size + "px";
        }
      });
      existing.forEach(el => el.remove());
    }
    function hideWord(key, word, el) {
      el.remove();
      fetch("/api/host", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: "hide", k: key, w: word, key: hostKey }) }).catch(() => {});
    }

    function renderPoll(key, counts) {
      const box = $(`[data-poll-box="${key}"]`);
      if (!box) return;
      const opts = $$("[data-opt]", box);
      const total = opts.reduce((a, o) => a + (counts[o.dataset.opt] || 0), 0);
      opts.forEach(o => {
        const n = counts[o.dataset.opt] || 0, pct = total ? Math.round(n / total * 100) : 0;
        $(".cnt", o).textContent = `${n} · ${pct}%`;
        $(".track-bar i", o).style.width = pct + "%";
      });
      $$(`[data-poll-total="${key}"]`).forEach(e => (e.textContent = total));
    }

    function renderTotals(t) {
      const el = $("#totals");
      const items = EMO.map((e, i) => [e, t[i] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
      el.innerHTML = items.length ? items.map(([e, n]) => `<span>${e} ${n}</span>`).join("") : "<span>Hali reaksiya yo‘q</span>";
    }

    async function tick() {
      if (busy || document.hidden) return;
      busy = true;
      const p = new URLSearchParams({ screen: 1 });
      if (sec && sec.dataset.cloud) p.set("cloud", sec.dataset.cloud);
      if (sec && sec.dataset.poll) p.set("poll", sec.dataset.poll);
      if (sec && sec.dataset.totals) p.set("totals", 1);
      try {
        const r = await fetch("/api/live?" + p, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || r.status);
        offline = false;
        $$("[data-online]").forEach(e => (e.textContent = j.online));
        const fresh = [];
        (j.reactions || []).forEach(x => { if (!seen.has(x.id)) { seen.add(x.id); fresh.push(x.i); } });
        if (seen.size > 600) { const keep = [...seen].slice(-300); seen.clear(); keep.forEach(k => seen.add(k)); }
        if (primed) fresh.reverse().forEach((i, n) => setTimeout(() => spawn(i), (n / Math.max(1, fresh.length)) * 900));
        primed = true;
        if (j.cloud && sec && sec.dataset.cloud) renderCloud(sec.dataset.cloud, j.cloud);
        if (j.poll && sec && sec.dataset.poll) renderPoll(sec.dataset.poll, j.poll);
        if (j.totals) renderTotals(j.totals);
      } catch (e) {
        offline = true;
        $$("[data-online]").forEach(el => (el.textContent = "0"));
      } finally { busy = false; }
    }

    return {
      onSlide(s) {
        sec = s;
        sendState(s.dataset.live || "react");
        if (!timer) { tick(); timer = setInterval(tick, 1000); }
        else tick();
      },
      demo(i) { spawn(i); },
    };
  })();

  setupScroll();
  activate(sections[0]);
  window.NokiaLive = Live;
})();
