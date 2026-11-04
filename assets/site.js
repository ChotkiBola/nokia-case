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
  let isHost = store.get("nokia-host") === "1";
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
  // [year, short text, phase, famous model, 3D era, Wikipedia article for the photo]
  const TL = [
    ["1987", "Ilk ko‘chma telefonlardan. Gorbachyov ham shunday telefondan qo‘ng‘iroq qilgan", "rise", "Mobira Cityman", "brick", "Mobira_Cityman_900"],
    ["1992", "Birinchi tijoriy GSM telefon", "rise", "Nokia 1011", "early", "Nokia_1011"],
    ["1994", "Ilk bor «Nokia tune» yangradi", "rise", "Nokia 2110", "early", "Nokia_2110"],
    ["1997", "Telefonga Snake o‘yini keldi", "rise", "Nokia 6110", "classic", "Nokia_6110"],
    ["1998", "Nokia dunyoda 1-o‘rinda", "rise", "Nokia 5110", "classic", "Nokia_5110"],
    ["2000", "126 million dona sotildi", "rise", "Nokia 3310", "classic", "Nokia_3310"],
    ["2003", "250 milliondan ortiq sotildi", "rise", "Nokia 1100", "classic", "Nokia_1100"],
    ["2007", "Cho‘qqi. Shu yili iPhone chiqdi", "crisis", "Nokia N95", "slider", "Nokia_N95"],
    ["2011", "Windows Phone tanlandi", "crisis", "Nokia Lumia 800", "touch", "Nokia_Lumia_800"],
    ["2013", "Telefon biznesi sotildi", "crisis", "Nokia Lumia 1020", "touch", "Nokia_Lumia_1020"],
  ];
  const track = $("#track");
  track.innerHTML = TL.map(([y, t, p, m, e], i) => `<div class="tcard" data-p="${p}" data-era="${e}" data-i="${i}"><b>${y}</b>${m ? `<span class="tmodel">${m}</span>` : ""}<p>${t}</p></div>`).join("");
  const tcards = $$(".tcard", track);
  const ERA_LABEL = { paper: "Qog‘oz fabrikasi davri", cable: "Kabel va rezina davri", brick: "Ilk mobil telefonlar", early: "Ilk GSM telefonlar", classic: "Tugmali telefonlar davri", slider: "Ilk smartfonlar", touch: "Sensorli smartfonlar", network: "Tarmoq va AI infratuzilmasi" };
  let tlAct = -1;
  const eraPhoto = $("#eraPhoto"), eraImg = $("#eraImg"), eraCredit = $("#eraCredit");
  function showEra(i) {
    const [y, , , m, e, wiki] = TL[i];
    const ph = wiki && Wiki.get(wiki);
    if (ph) {
      // real photo from Wikipedia
      document.body.classList.add("era-has-photo");
      const swap = () => {
        eraImg.src = ph.src; eraImg.alt = m;
        eraCredit.innerHTML = `Foto: <a href="${ph.page}" target="_blank" rel="noopener">Wikipedia</a>`;
      };
      if (G && !reduce) {
        G.to(eraPhoto, { autoAlpha: 0, y: 20, rotateY: -25, duration: .25, ease: "power2.in", onComplete: () => {
          swap();
          G.fromTo(eraPhoto, { autoAlpha: 0, y: 30, rotateY: 30, scale: .9 }, { autoAlpha: 1, y: 0, rotateY: 0, scale: 1, duration: .8, ease: "back.out(1.4)" });
        } });
      } else { swap(); eraPhoto.style.opacity = 1; eraPhoto.style.visibility = "visible"; }
    } else {
      document.body.classList.remove("era-has-photo");
      if (window.Era3D) window.Era3D.show(e, y); else window.__eraPending = [e, y];
    }
  }
  function setTlAct(i) {
    i = Math.max(0, Math.min(TL.length - 1, i));
    if (i === tlAct) return;
    tlAct = i;
    tcards.forEach((c, k) => c.classList.toggle("active", k === i));
    const [y, , , m, e] = TL[i];
    const cap = $("#eraCap");
    if (cap) cap.innerHTML = `<b>${y}</b><span>${m || ERA_LABEL[e]}</span>`;
    showEra(i);
  }
  // nearest card to a focus line that slides from 22% to 80% of the screen as the track scrolls
  function tlActFromPosition(progress) {
    const fx = innerWidth * (.22 + .58 * progress);
    let best = 0, bd = Infinity;
    tcards.forEach((c, k) => { const r = c.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - fx); if (d < bd) { bd = d; best = k; } });
    setTlAct(best);
  }

  /* ---------- photos from Wikipedia (loaded in the viewer's browser, cached) ---------- */
  var Wiki = (() => {
    const KEY = "nokia-wiki-v1", map = {};
    try { Object.assign(map, JSON.parse(store.get(KEY) || "{}")); } catch (e) {}
    const listeners = [];
    function apply() {
      $$("[data-wiki]").forEach(el => {
        const ph = map[el.dataset.wiki], box = $(".ph", el);
        if (ph && box && !box.querySelector("img")) {
          const img = new Image();
          img.alt = ""; img.loading = "lazy"; img.decoding = "async";
          img.onload = () => box.classList.add("has-img");
          img.src = ph.src;
          box.appendChild(img);
          box.title = "Foto: Wikipedia";
        }
      });
      listeners.forEach(f => f());
    }
    async function load(titles) {
      const need = titles.filter(t => t && !map[t]);
      for (let i = 0; i < need.length; i += 20) {
        const chunk = need.slice(i, i + 20);
        const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=600&titles=" + encodeURIComponent(chunk.join("|"));
        try {
          const j = await (await fetch(url)).json();
          const back = {};
          (j.query.normalized || []).forEach(n => (back[n.to] = n.from));
          (j.query.redirects || []).forEach(n => (back[n.to] = back[n.from] || n.from));
          Object.values(j.query.pages || {}).forEach(pg => {
            if (!pg.thumbnail) return;
            const original = back[pg.title] || pg.title.replace(/ /g, "_");
            const keyT = chunk.find(t => t === original || t.replace(/_/g, " ") === pg.title || t.replace(/_/g, " ") === original.replace(/_/g, " ")) || original;
            map[keyT] = { src: pg.thumbnail.source, page: "https://en.wikipedia.org/wiki/" + encodeURIComponent(pg.title.replace(/ /g, "_")) };
          });
        } catch (e) { /* offline or blocked: keep 3D and initials */ }
      }
      store.set(KEY, JSON.stringify(map));
      apply();
    }
    return { get: t => map[t], load, apply, onChange: f => listeners.push(f) };
  })();
  Wiki.onChange(() => { if (tlAct >= 0) { const i = tlAct; tlAct = -1; setTlAct(i); } });
  Wiki.apply();
  Wiki.load([...TL.map(r => r[5]), ...$$("[data-wiki]").map(el => el.dataset.wiki)]);
  setTlAct(0);

  const pic = $("#pictogram");
  const phoneSvg = '<svg class="ph" viewBox="0 0 40 72"><rect class="body" x="2" y="2" width="36" height="68" rx="9"/><rect x="8" y="10" width="24" height="20" rx="3" fill="rgba(255,255,255,.75)"/><g fill="rgba(255,255,255,.6)"><rect x="8" y="38" width="6" height="4" rx="2"/><rect x="17" y="38" width="6" height="4" rx="2"/><rect x="26" y="38" width="6" height="4" rx="2"/><rect x="8" y="46" width="6" height="4" rx="2"/><rect x="17" y="46" width="6" height="4" rx="2"/><rect x="26" y="46" width="6" height="4" rx="2"/><rect x="8" y="54" width="6" height="4" rx="2"/><rect x="17" y="54" width="6" height="4" rx="2"/><rect x="26" y="54" width="6" height="4" rx="2"/></g></svg>';
  pic.innerHTML = phoneSvg.repeat(5);

  const PS = [
    ["Mobil tarmoqlar bozori turg‘un", "Dasturiy ta’minot va AI-RAN xizmatlarini obuna asosida sotish"],
    ["Foyda 2025-yilda kamaydi", "Kam daromadli yo‘nalishlardan chiqish, IP va optik tarmoqlarga e’tibor"],
    ["AI talabiga quvvat yetmayapti", "Yangi zavodlarni tezroq ishga tushirish, Nvidia bilan rejalashtirish"],
    ["Huawei va Ericsson bilan narx raqobati", "Narx emas, ishonchlilik va 6G yetakchiligi bilan raqobatlashish"],
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
      Connect.toggle(sec.id === "s-connect");
      const revealAt = sections.findIndex(x => x.id === "s-connect");
      $("#brandName").textContent = sections.indexOf(sec) >= revealAt ? "Nokia case study" : "Case study";
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
        onUpdate: self => requestAnimationFrame(() => tlActFromPosition(self.progress)),
      }));
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
    if (s >= 1) { st.style.transform = "none"; return; }
    st.style.transform = `scale(${s})`;
    // a stage taller than the screen is centred on itself, not on the screen: shift it back into view
    const r = st.getBoundingClientRect();
    const dy = (innerHeight - r.height) / 2 - r.top;
    if (Math.abs(dy) > 1) st.style.transform = `translateY(${dy}px) scale(${s})`;
  }
  /* timeline in presentation mode: arrows, wheel, drag and swipe move the cards */
  const TLnav = (() => {
    let x = 0;
    const max = () => Math.max(0, track.scrollWidth - innerWidth + 40);
    const bar = $("#tlBar i");
    function move(v, dur = .8, fromPos = true) {
      x = Math.max(0, Math.min(max(), v));
      const sync = () => fromPos && tlActFromPosition(max() ? x / max() : 0);
      if (G) G.to(track, { x: -x, duration: reduce ? 0 : dur, ease: "power3.out", overwrite: true, onUpdate: sync });
      else { track.style.transform = `translateX(${-x}px)`; sync(); }
      if (bar) bar.style.width = (max() ? (x / max()) * 100 : 100) + "%";
    }
    // bring card i near the left third of the screen and make it active
    function goCard(i) {
      i = Math.max(0, Math.min(tcards.length - 1, i));
      setTlAct(i);
      const c = tcards[i];
      move(c.offsetLeft + c.offsetWidth / 2 - innerWidth * .35, .9, false);
    }
    return {
      active: () => presenting && sections[idx] && sections[idx].id === "s-timeline",
      reset(atEnd) {
        if (G) G.killTweensOf(track);
        tlAct = -1;
        goCard(atEnd ? tcards.length - 1 : 0);
        if (G && !reduce) G.fromTo(tcards, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .04, duration: .7, ease: "power3.out", delay: .3, clearProps: "opacity,visibility,transform" });
      },
      next() { if (tlAct >= tcards.length - 1) return false; goCard(tlAct + 1); return true; },
      prev() { if (tlAct <= 0) return false; goCard(tlAct - 1); return true; },
      go: goCard,
      by(d, dur) { move(x + d, dur); },
      get x() { return x; },
    };
  })();
  tcards.forEach((c, k) => c.addEventListener("click", () => { if (TLnav.active()) TLnav.go(k); }));
  const tlSec = $("#s-timeline");
  tlSec.addEventListener("wheel", e => {
    if (!TLnav.active()) return;
    e.preventDefault();
    TLnav.by((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 1.4, .5);
  }, { passive: false });
  let drag = null;
  tlSec.addEventListener("pointerdown", e => { if (TLnav.active()) { drag = { sx: e.clientX, x: TLnav.x }; tlSec.setPointerCapture(e.pointerId); tlSec.style.cursor = "grabbing"; } });
  tlSec.addEventListener("pointermove", e => { if (drag) TLnav.by(drag.x - (e.clientX - drag.sx) * 1.2 - TLnav.x, .3); });
  const endDrag = () => { drag = null; tlSec.style.cursor = ""; };
  tlSec.addEventListener("pointerup", endDrag);
  tlSec.addEventListener("pointercancel", endDrag);

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
    setTimeout(() => { if (presenting && sections[idx] === sec) fit(sec); }, 700);
    if (G && !reduce) G.fromTo(sec, { autoAlpha: 0, scale: 1.04, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: .8, ease: "power3.out", delay: prev !== sec ? .15 : 0 });
    if (sec.id === "s-timeline") TLnav.reset(dir < 0);
    current && current.classList.remove("on");
    current = null;
    activate(sec, true);
    $("#slideNum").textContent = `${idx + 1} / ${sections.length}`;
    $("#progress").style.width = ((idx + 1) / sections.length) * 100 + "%";
  }
  function enterPresent(start) {
    presenting = true;
    // the screen that runs the presentation controls the phones (unless opened with ?guest)
    if (!isHost && store.get("nokia-host") !== "0") {
      isHost = true;
      store.set("nokia-host", "1");
      document.body.classList.add("is-host");
    }
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
  $$("[data-start]").forEach(b => b.addEventListener("click", e => { e.currentTarget.blur(); enterPresent(0); }));
  $("#prevBtn").addEventListener("click", () => { if (!(TLnav.active() && TLnav.prev()) && !(window.Quiz && Quiz.prev())) show(idx - 1, -1); });
  $("#nextBtn").addEventListener("click", () => { if (!(TLnav.active() && TLnav.next()) && !(window.Quiz && Quiz.next())) show(idx + 1, 1); });
  $("#exitBtn").addEventListener("click", exitPresent);
  addEventListener("resize", () => { if (presenting) fit(sections[idx]); });
  document.addEventListener("fullscreenchange", () => { if (presenting) setTimeout(() => fit(sections[idx]), 150); });
  addEventListener("keydown", e => {
    if (window.SnakeRahmat && window.SnakeRahmat.isPlaying()) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (!presenting) { if (e.key === "p" || e.key === "P") enterPresent(0); return; }
    const onControl = e.target.closest && e.target.closest("button, a");
    if (onControl && (e.key === " " || e.key === "Enter")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); if (!(TLnav.active() && TLnav.next()) && !(window.Quiz && Quiz.next())) show(idx + 1, 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); if (!(TLnav.active() && TLnav.prev()) && !(window.Quiz && Quiz.prev())) show(idx - 1, -1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(sections.length - 1);
    else if (e.key === "Escape") exitPresent();
  });
  let tx = null;
  addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => {
    if (tx === null || !presenting || (window.SnakeRahmat && window.SnakeRahmat.isPlaying())) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (TLnav.active()) return; // timeline is moved by dragging
    if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1));
  });

  /* ================= embers (burning platform) ================= */
  var Embers = (() => {
    const cv = $("#embers"), ctx = cv.getContext("2d");
    let on = false, parts = [], raf = 0;
    function size() { cv.width = cv.clientWidth; cv.height = cv.clientHeight; }
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
        .then(r => {
          if (r.ok) return;
          lastState = "";
          if (r.status === 403) {
            document.querySelector(".host-chip").textContent = "Kalit noto‘g‘ri";
            warn("Telefonlar slaydga ergashmayapti: Vercel’da HOST_KEY o‘rnatilgan. Saytni /?host=KALIT manzili bilan oching.");
          }
        })
        .catch(() => { lastState = ""; });
    }
    function warn(text) {
      if (document.querySelector(".db-warn")) return;
      const w = document.createElement("div");
      w.className = "db-warn"; w.textContent = text;
      document.body.appendChild(w);
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
      if (sec && sec.dataset.quiz) p.set("quiz", window.Quiz ? Quiz.cur() : 0);
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
        if (j.quiz && window.Quiz) Quiz.render(j.quiz);
      } catch (e) {
        offline = true;
        $$("[data-online]").forEach(el => (el.textContent = "0"));
        if (/Redis/.test(e.message || "") && !document.querySelector(".db-warn")) {
          const w = document.createElement("div");
          w.className = "db-warn";
          w.textContent = "Ovoz va reaksiyalar bazasi ulanmagan: Vercel → Storage → Upstash Redis’ni ulang va Redeploy qiling";
          document.body.appendChild(w);
        }
      } finally { busy = false; }
    }

    return {
      onSlide(s) {
        sec = s;
        sendState(s.id === "s-quiz" && window.Quiz ? Quiz.state() : (s.dataset.live || "react"));
        if (!timer) { tick(); timer = setInterval(tick, 1000); }
        else tick();
      },
      demo(i) { spawn(i); },
      sendState,
      burst(emoji, n) {
        for (let k = 0; k < n; k++) setTimeout(() => {
          const el = document.createElement("span");
          el.className = "rx"; el.textContent = emoji;
          el.style.left = (4 + Math.random() * 92) + "vw"; el.style.fontSize = (30 + Math.random() * 34) + "px";
          fx.appendChild(el);
          if (!G || reduce) { setTimeout(() => el.remove(), 1200); return; }
          const d = 2.6 + Math.random() * 1.4;
          G.timeline({ onComplete: () => el.remove() })
            .fromTo(el, { y: 0, autoAlpha: 1, rotate: 0 }, { y: -(innerHeight + 140), rotate: (Math.random() - .5) * 360, duration: d, ease: "power2.out" })
            .to(el, { x: (Math.random() - .5) * 300, duration: d, ease: "sine.inOut" }, 0)
            .to(el, { autoAlpha: 0, duration: d * .3 }, d * .7);
        }, k * 40);
      },
    };
  })();

  /* ================= intro: two sides connect (original animation) ================= */
  var Connect = (() => {
    const cv = $("#connect"), ctx = cv.getContext("2d");
    const title = $("#connectTitle"), sub = $("#connectSub");
    let on = false, raf = 0, t0 = 0, pts = [];
    function size() { cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
    function build() {
      const W = cv.clientWidth, H = cv.clientHeight;
      pts = [];
      for (let i = 0; i < 90; i++) {
        const side = i % 2 ? 1 : -1;
        pts.push({ side, sx: side < 0 ? -40 : W + 40, sy: Math.random() * H, tx: W / 2 + side * (40 + Math.random() * W * .38), ty: H * .5 + (Math.random() - .5) * H * .7, d: Math.random() * .6 });
      }
    }
    const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
    function frame(now) {
      const W = cv.clientWidth, H = cv.clientHeight, t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * .5;
      // two lead points travel toward the centre and meet
      const k = ease(t / 1.6);
      const lx = -20 + (cx - 6 + 20) * k, rx = W + 20 - (W + 20 - cx - 6) * k;
      const glow = (x, y, r, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(120,180,255,${a})`); g.addColorStop(1, "rgba(120,180,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
      ctx.strokeStyle = "rgba(90,150,255,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, cy); ctx.lineTo(lx, cy); ctx.moveTo(W + 20, cy); ctx.lineTo(rx, cy); ctx.stroke();
      glow(lx, cy, 26, .9); glow(rx, cy, 26, .9);
      if (k >= 1) {
        const p = Math.min(1, (t - 1.6) / .5);
        glow(cx, cy, 60 + p * 260, .55 * (1 - p) + .15);
      }
      // the network grows from both sides after they meet
      const nk = ease((t - 1.8) / 2.2);
      if (nk > 0) {
        const cur = pts.map(q => ({ x: q.sx + (q.tx - q.sx) * ease((t - 1.8 - q.d) / 1.8), y: q.sy + (q.ty - q.sy) * ease((t - 1.8 - q.d) / 1.8), side: q.side }));
        ctx.lineWidth = 1;
        for (let i = 0; i < cur.length; i++) {
          for (let j = i + 1; j < cur.length; j++) {
            const dx = cur[i].x - cur[j].x, dy = cur[i].y - cur[j].y, d = Math.hypot(dx, dy);
            if (d < 120) { ctx.strokeStyle = `rgba(110,170,255,${(1 - d / 120) * .35 * nk})`; ctx.beginPath(); ctx.moveTo(cur[i].x, cur[i].y); ctx.lineTo(cur[j].x, cur[j].y); ctx.stroke(); }
          }
          ctx.strokeStyle = `rgba(110,170,255,${.12 * nk})`; ctx.beginPath(); ctx.moveTo(cur[i].x, cur[i].y); ctx.lineTo(cx, cy); ctx.stroke();
        }
        cur.forEach(c => { ctx.fillStyle = c.side < 0 ? "rgba(160,200,255,.9)" : "rgba(130,240,255,.9)"; ctx.beginPath(); ctx.arc(c.x, c.y, 2.4, 0, 7); ctx.fill(); });
      }
      if (on) raf = requestAnimationFrame(frame);
    }
    function words(el) {
      if (!el.dataset.split) { el.dataset.split = 1; el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(" "); }
      return $$(".w > span", el);
    }
    // optional video: if /assets/intro.mp4 exists it plays instead of the canvas animation
    const vid = $("#introVideo");
    let hasVideo = false;
    if (vid) {
      vid.addEventListener("loadeddata", () => {
        hasVideo = true; document.body.classList.add("has-intro-video");
        const sec = $("#s-connect"); sec.dataset.theme = "light";
        if (document.body.dataset.slide === "s-connect") document.body.dataset.theme = "light";
      }, { once: true });
      vid.addEventListener("ended", () => {
        if (!on) return;
        if (G) {
          G.to(vid, { autoAlpha: 0, duration: .8 });
          G.set([title, sub], { visibility: "visible" });
          G.fromTo(words(title), { yPercent: 115 }, { yPercent: 0, stagger: .08, duration: 1, ease: "expo.out", delay: .4 });
          G.fromTo(sub, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, delay: 1.2 });
        } else { vid.style.opacity = 0; title.style.visibility = sub.style.visibility = "visible"; }
      });
    }
    function playVideo() {
      if (G) G.set([title, sub], { visibility: "hidden" }); else title.style.visibility = sub.style.visibility = "hidden";
      if (G) G.set(vid, { autoAlpha: 1 }); else vid.style.opacity = 1;
      vid.currentTime = 0; vid.muted = false;
      vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
    }
    return {
      toggle(v) {
        if (v === on) return;
        on = v; cancelAnimationFrame(raf);
        if (!on) { if (vid) vid.pause(); return; }
        if (hasVideo) { playVideo(); return; }
        size(); build(); t0 = performance.now();
        if (reduce) { on = false; frame(t0 + 5000); title.style.visibility = sub.style.visibility = "visible"; return; }
        raf = requestAnimationFrame(frame);
        if (G) {
          G.set([title, sub], { visibility: "visible" });
          G.fromTo(words(title), { yPercent: 115 }, { yPercent: 0, stagger: .08, duration: 1, ease: "expo.out", delay: 1.9 });
          G.fromTo(sub, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, delay: 2.8 });
        }
      },
    };
  })();
  addEventListener("resize", () => { if (document.body.dataset.slide === "s-connect") { Connect.toggle(false); Connect.toggle(true); } });

  /* ================= team quiz «Nokia muzeyi» ================= */
  window.Quiz = (() => {
    const sec = $("#s-quiz");
    if (!sec) return null;
    const TIME = 20;
    const TEAMS = { a: { n: "3310", c: "#005aff" }, b: { n: "1100", c: "#ff7a00" }, c: { n: "N95", c: "#00b47a" } };
    const L = ["A", "B", "C", "D"];
    // answers must match QUIZ in api/_redis.js
    const Q = [
      { w: "Nokia_3310", e: "📱", cap: "Nokia 3310", q: "Bu afsonaviy telefon qaysi yili chiqqan?", o: ["1996", "2000", "2004", "2007"], a: 1, note: "Nokia 3310 2000-yilda chiqqan va «buzilmas telefon» nomini olgan." },
      { w: "Nokia_3310", e: "📱", cap: "Nokia 3310", q: "Nokia 3310 jami qancha sotilgan?", o: ["26 mln", "60 mln", "126 mln", "1 mlrd"], a: 2, note: "126 million dona: o‘z davrining eng ommabop telefonlaridan biri." },
      { w: "Nokia_1100", e: "🔦", cap: "Nokia 1100", q: "Bu Nokia 1100. U qancha sotilgan?", o: ["50 mln", "120 mln", "250 mln", "1 mlrd"], a: 2, note: "250 milliondan ortiq: tarixdagi eng ko‘p sotilgan telefonlardan biri." },
      { w: "Fredrik_Idestam", e: "🏭", cap: "Fredrik Idestam, 1865", q: "Nokia 1865-yilda nima ishlab chiqarishdan boshlangan?", o: ["Qog‘oz", "Avtomobil", "Televizor", "Soat"], a: 0, note: "Fredrik Idestam Finlyandiyada qog‘oz fabrikasini ochgan." },
      { w: "Nokia_8110", e: "🍌", cap: "Nokia 8110 «banan»", q: "Bu «banan» telefon qaysi filmda mashhur bo‘lgan?", o: ["Titanik", "Matritsa", "Terminator 2", "Garri Potter"], a: 1, note: "1999-yilgi «Matritsa» filmida Neo shu telefondan foydalanadi." },
      { w: "Nokia_6110", e: "🐍", cap: "Nokia 6110, 1997", q: "Bu telefon qaysi o‘yinni mashhur qilgan?", o: ["Tetris", "Pac-Man", "Snake", "Angry Birds"], a: 2, note: "Snake ilk bor 1997-yilda Nokia 6110 da paydo bo‘lgan." },
      { w: "Mobira_Cityman_900", e: "🧱", cap: "Mobira Cityman, 1987", q: "1987-yilgi bu telefon qancha og‘ir bo‘lgan?", o: ["≈ 200 g", "≈ 400 g", "≈ 800 g", "≈ 2 kg"], a: 2, note: "Taxminan 800 gramm: hozirgi smartfondan 4 baravar og‘ir." },
      { w: "", e: "🌍", cap: "2007-yil", q: "2007-yilda dunyodagi har 100 ta telefondan nechtasi Nokia edi?", o: ["10 tasi", "25 tasi", "40 tasi", "70 tasi"], a: 2, note: "Taxminan 40 foiz: bu Nokia’ning cho‘qqisi edi." },
    ];
    const box = { teams: $("#qzTeams"), photo: $("#qzPhoto"), cap: $("#qzCap"), num: $("#qzNum"), timer: $("#qzTimer"), ans: $("#qzAns"), q: $("#qzQ"), opts: $("#qzOpts"), note: $("#qzNote"), board: $("#qzBoard"), win: $("#qzWin"), top: $("#qzTop"), btn: $("#qzNext") };
    const esc = t => String(t || "").replace(/[<>&"]/g, "");
    let phase = "intro", step = -1, data = null, t0 = 0, tmr = 0;

    box.teams.innerHTML = Object.entries(TEAMS).map(([k, t]) => `<div class="qt" style="--c:${t.c}" data-t="${k}"><b>${t.n}</b><span><em>0</em> kishi</span></div>`).join("");
    box.board.innerHTML = Object.entries(TEAMS).map(([k, t]) => `<div class="qb" style="--c:${t.c}" data-t="${k}"><b>${t.n}</b><div class="tr"><i></i></div><span>0</span></div>`).join("");
    Wiki.load(Q.map(x => x.w).filter(Boolean));
    Wiki.onChange(() => { if (phase === "q" || phase === "r") photo(); });

    const stateName = () => phase === "intro" ? "team" : phase === "q" ? `quiz:${step}` : phase === "r" ? `qrev:${step}` : "qend";
    function photo() {
      const x = Q[step], ph = x.w && Wiki.get(x.w);
      box.photo.innerHTML = ph ? `<img src="${ph.src}" alt="${esc(x.cap)}">` : `<span class="qz-emoji">${x.e}</span>`;
      box.cap.innerHTML = `<b>Eksponat №${step + 1}</b>${esc(x.cap)}${ph ? ` · <a href="${ph.page}" target="_blank" rel="noopener">Wikipedia</a>` : ""}`;
    }
    function timer() {
      const left = Math.max(0, TIME - (Date.now() - t0) / 1000);
      box.timer.style.setProperty("--p", left / TIME);
      box.timer.querySelector("b").textContent = Math.ceil(left);
      box.timer.classList.toggle("low", left <= 5);
      if (!left) { clearInterval(tmr); box.note.textContent = "Vaqt tugadi! Javobni ochish uchun → ni bosing."; }
    }
    function draw() {
      sec.dataset.phase = phase;
      clearInterval(tmr);
      if (phase === "q" || phase === "r") {
        const x = Q[step];
        photo();
        box.num.textContent = `Savol ${step + 1} / ${Q.length}`;
        box.q.textContent = x.q;
        box.opts.innerHTML = x.o.map((o, i) => `<div class="qo" data-i="${i}"><b>${L[i]}</b><span>${o}</span><em></em><i></i></div>`).join("");
        box.note.textContent = "";
        if (phase === "q") {
          t0 = Date.now(); timer(); tmr = setInterval(timer, 200);
          box.btn.textContent = "Javobni ochish";
          if (G && !reduce) {
            G.fromTo(".qz-frame", { autoAlpha: 0, rotateY: -20, scale: .9 }, { autoAlpha: 1, rotateY: 0, scale: 1, duration: .8, ease: "back.out(1.5)" });
            G.fromTo(".qo", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .07, duration: .5, ease: "power3.out", delay: .2 });
          }
        } else {
          box.timer.style.setProperty("--p", 0); box.timer.querySelector("b").textContent = "✓";
          $$(".qo", box.opts).forEach((el, i) => el.classList.add(i === x.a ? "ok" : "no"));
          box.note.textContent = x.note;
          box.btn.textContent = step + 1 < Q.length ? "Keyingi savol" : "Natijalarni ko‘rish";
          if (G && !reduce) G.fromTo(".qo.ok", { scale: .94 }, { scale: 1, duration: .6, ease: "back.out(3)" });
        }
      }
      if (phase === "intro") box.btn.textContent = "Viktorinani boshlash";
      if (phase === "end") {
        box.btn.textContent = "Davom etish";
        Live.burst("🏆", 10); setTimeout(() => Live.burst("🎉", 26), 300);
      }
      render();
      if (presenting) fit(sec);
    }
    function set(ph, st) { phase = ph; step = st; draw(); Live.sendState(stateName()); }
    function render(j) {
      if (j) data = j;
      const d = data || { counts: [0, 0, 0, 0], answered: 0, teams: {}, top: [] };
      Object.keys(TEAMS).forEach(k => {
        const t = d.teams[k] || { members: 0, score: 0 };
        const q = box.teams.querySelector(`[data-t="${k}"] em`); if (q) q.textContent = t.members;
      });
      box.ans.textContent = `${d.answered} ta javob`;
      if (phase === "r") {
        const max = Math.max(1, ...d.counts);
        $$(".qo", box.opts).forEach((el, i) => { $("em", el).textContent = d.counts[i] || 0; $("i", el).style.width = ((d.counts[i] || 0) / max) * 100 + "%"; });
      }
      const scores = Object.keys(TEAMS).map(k => (d.teams[k] || {}).score || 0), top = Math.max(1, ...scores);
      Object.keys(TEAMS).forEach((k, n) => {
        const el = box.board.querySelector(`[data-t="${k}"]`);
        $("i", el).style.width = (scores[n] / top) * 100 + "%";
        $("span", el).textContent = scores[n];
        el.classList.toggle("lead", phase !== "intro" && scores[n] === Math.max(...scores) && scores[n] > 0);
      });
      if (phase === "end") {
        const order = Object.keys(TEAMS).sort((x, y) => ((d.teams[y] || {}).score || 0) - ((d.teams[x] || {}).score || 0));
        const best = order[0], bs = (d.teams[best] || {}).score || 0;
        box.win.innerHTML = bs ? `G‘olib jamoa: <span style="color:${TEAMS[best].c}">«${TEAMS[best].n}»</span>` : "Hali ball to‘planmadi";
        box.top.innerHTML = (d.top || []).filter(p => p.p > 0).map((p, i) => `<li><i>${i + 1}</i><b>${esc(p.n) || "Ismsiz o‘yinchi"}</b><em style="color:${(TEAMS[p.t] || {}).c || "inherit"}">${TEAMS[p.t] ? TEAMS[p.t].n : ""}</em><span>${p.p}</span></li>`).join("");
      }
    }
    function advance() {
      if (phase === "intro") set("q", 0);
      else if (phase === "q") set("r", step);
      else if (phase === "r") step + 1 < Q.length ? set("q", step + 1) : set("end", Q.length);
      else return false;
      return true;
    }
    function back() {
      if (phase === "intro") return false;
      if (phase === "q") step === 0 ? set("intro", -1) : set("r", step - 1);
      else if (phase === "r") set("q", step);
      else set("r", Q.length - 1);
      return true;
    }
    const here = () => presenting && sections[idx] === sec;
    box.btn.addEventListener("click", e => { e.currentTarget.blur(); if (!advance()) show(sections.indexOf(sec) + 1, 1); });
    return {
      render, state: stateName,
      cur: () => Math.max(0, Math.min(Q.length - 1, step)),
      next: () => here() && advance(),
      prev: () => here() && back(),
    };
  })();

  setupScroll();
  activate(sections[0]);
  window.NokiaLive = Live;
})();
