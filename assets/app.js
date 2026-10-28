(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- background pixel grid ---------------- */
  const bg = $("#bg-grid"), bctx = bg.getContext("2d");
  let cells = [];
  function sizeBg() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    bg.width = innerWidth * dpr; bg.height = innerHeight * dpr;
    bg.style.width = innerWidth + "px"; bg.style.height = innerHeight + "px";
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells = [];
    const n = Math.round((innerWidth * innerHeight) / 26000);
    for (let i = 0; i < n; i++) cells.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, p: Math.random() * Math.PI * 2, s: .4 + Math.random() * .8 });
  }
  function drawBg(t) {
    bctx.clearRect(0, 0, innerWidth, innerHeight);
    const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#3d8bff";
    bctx.strokeStyle = "rgba(120,150,190,0.06)"; bctx.lineWidth = 1;
    const g = 48;
    for (let x = (-(scrollY * .15) % g); x < innerWidth; x += g) { bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, innerHeight); bctx.stroke(); }
    for (let y = (-(scrollY * .3) % g); y < innerHeight; y += g) { bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(innerWidth, y); bctx.stroke(); }
    bctx.fillStyle = accent;
    for (const c of cells) {
      const a = (Math.sin(t / 900 * c.s + c.p) + 1) / 2;
      bctx.globalAlpha = a * .35;
      bctx.fillRect(Math.round(c.x / 8) * 8, Math.round(c.y / 8) * 8, 4, 4);
    }
    bctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(drawBg);
  }
  sizeBg(); addEventListener("resize", sizeBg); requestAnimationFrame(drawBg);

  /* ---------------- hero LCD boot ---------------- */
  const boot = $("#boot");
  const bootFrames = [
    "1865<small>qog‘oz fabrikasi</small>",
    "1998<small>№1 telefon brendi</small>",
    "2007<small>40% bozor</small>",
    "2013<small>telefonlar sotildi</small>",
    "2026<small>AI tarmoqlari</small>",
  ];
  let bi = 0;
  function bootStep() { boot.innerHTML = `<div class="fade-in">${bootFrames[bi]}</div>`; bi = (bi + 1) % bootFrames.length; }
  bootStep(); setInterval(bootStep, 1800);

  /* ---------------- counters ---------------- */
  function runCounter(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const fmt = v => (el.dataset.plain ? Math.round(v).toString() : v.toFixed(dec).replace(".", ","));
    if (reduce) { el.textContent = pre + fmt(target) + suf; return; }
    const start = el.dataset.plain ? 1800 : 0, t0 = performance.now(), dur = 1500;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + fmt(start + (target - start) * e) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------------- timeline ---------------- */
  const TL = [
    ["1865", "Fredrik Idestam Finlyandiyada qog‘oz fabrikasiga asos soldi", "rise"],
    ["1967", "Qog‘oz, rezina va kabel zavodlari birlashib, Nokia korporatsiyasi tuzildi", "rise"],
    ["1987", "Birinchi qo‘lda olib yuriladigan telefon, Mobira Cityman", "rise"],
    ["1991", "Dunyodagi birinchi GSM qo‘ng‘irog‘i Nokia uskunalari orqali amalga oshirildi", "rise"],
    ["1992", "Yorma Ollila bosh direktor bo‘ldi, kompaniya mobil aloqaga ixtisoslashdi", "rise"],
    ["1998", "Nokia dunyodagi eng yirik telefon ishlab chiqaruvchisiga aylandi", "rise"],
    ["2007", "Bozor ulushi cho‘qqida, Apple esa iPhone ni taqdim etdi", "crisis"],
    ["2011", "«Yonayotgan platforma» maktubi, Windows Phone tanlandi", "crisis"],
    ["2013", "Telefon biznesi Microsoftga 5,44 mlrd yevroga sotildi", "crisis"],
    ["2016", "Alcatel-Lucent sotib olindi, telefon brendi HMDga litsenziyaga berildi", "rebirth"],
    ["2025", "Infinera sotib olindi, Nvidia 1 mlrd dollar investitsiya kiritdi", "rebirth"],
    ["2026", "Ikki segmentli tuzilma va sun’iy intellekt infratuzilmasiga burilish", "rebirth"],
  ];
  const tl = $("#timeline");
  TL.forEach(([y, t, p]) => {
    const d = document.createElement("div");
    d.className = "tl-item"; d.dataset.p = p;
    d.innerHTML = `<div class="tl-year">${y}</div><div class="tl-dot"></div><div class="tl-text">${t}</div>`;
    tl.appendChild(d);
  });
  const tlItems = $$(".tl-item"), rail = $("#railFill");
  function lightTimeline(upto) {
    tlItems.forEach((it, i) => it.classList.toggle("on", i <= upto));
    const last = tlItems[Math.max(0, upto)];
    rail.style.height = upto < 0 ? "0" : (last.offsetTop + 14) + "px";
  }
  function timelineByScroll() {
    if (document.body.classList.contains("present")) return;
    const mid = innerHeight * .62; let upto = -1;
    tlItems.forEach((it, i) => { if (it.getBoundingClientRect().top < mid) upto = i; });
    lightTimeline(upto);
  }
  let tlAnim = null;
  function timelineAuto() {
    clearInterval(tlAnim); let i = -1; lightTimeline(-1);
    tlAnim = setInterval(() => { i++; lightTimeline(i); if (i >= tlItems.length - 1) clearInterval(tlAnim); }, reduce ? 0 : 260);
  }

  /* ---------------- section activation ---------------- */
  function activate(sec) {
    if (!sec) return;
    document.body.dataset.phase = sec.dataset.phase || "rise";
    $$(".reveal", sec).forEach(el => el.classList.add("in"));
    $$("[data-count]", sec).forEach(runCounter);
    $$(".bar i[data-w]", sec).forEach(i => (i.style.width = i.dataset.w + "%"));
    $$(".vbar i[data-h]", sec).forEach(i => (i.style.height = i.dataset.h + "%"));
    if (sec.id === "s-finale") window.SnakeRahmat && window.SnakeRahmat.startMessage();
    if (sec.id === "s-poll") startPolling(); else stopPolling();
  }
  const sections = $$("section.slide");
  const io = new IntersectionObserver(entries => {
    if (document.body.classList.contains("present")) return;
    entries.forEach(e => { if (e.isIntersecting) activate(e.target); });
  }, { threshold: .35 });
  sections.forEach(s => io.observe(s));
  // reveal small blocks independently
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: .15 });
  $$(".reveal").forEach(el => rio.observe(el));

  addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    $("#progress").style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
    timelineByScroll();
  }, { passive: true });

  /* ---------------- what if ---------------- */
  const SCEN = {
    android: {
      tag: "Taxminiy ssenariy",
      title: "Nokia Android bilan",
      text: "Nokia tayyor ilovalar do‘koniga ega bo‘lib, smartfon bozoriga tezroq qaytishi mumkin edi. Kuchli brend, dizayn va arzon ishlab chiqarish uni yirik Android ishlab chiqaruvchilaridan biriga aylantirishi mumkin edi.",
      pts: ["Afzallik: ilovalar muammosi darhol hal bo‘ladi", "Xavf: Samsung va boshqa Android brendlari bilan qattiq narx raqobati", "Xavf: Google ga bog‘liqlik, boshqalardan farqlanish qiyinlashadi"],
      real: "Haqiqatda Nokia Android asosidagi Nokia X telefonini faqat 2014-yilda chiqardi. Bu juda kech edi."
    },
    wp: {
      tag: "Haqiqatda tanlangan yo‘l",
      title: "Nokia Windows Phone bilan",
      text: "2011-yilda Stiven Elop Microsoft bilan strategik hamkorlikni tanladi. Lumia smartfonlari dizayni maqtaldi, lekin Windows Phone ilovalar soni bo‘yicha iOS va Android dan ancha ortda qoldi.",
      pts: ["Natija: bozor ulushi 2013-yilga kelib 3% gacha tushdi", "Natija: 2013-yilda telefon biznesi Microsoftga 5,44 mlrd yevroga sotildi", "Natija: qariyb 32 ming xodim Microsoftga o‘tdi"],
      real: "Bu yo‘l Nokia telefon biznesining tugashiga olib keldi, lekin sotuvdan tushgan mablag‘ tarmoq biznesiga burilishga yordam berdi."
    },
    own: {
      tag: "Taxminiy ssenariy",
      title: "Nokia o‘z tizimi bilan",
      text: "Nokia’ning MeeGo tizimidagi N9 smartfoni 2011-yilda yaxshi baholangan edi. O‘z tizimi to‘liq nazorat va mustaqillikni berardi, lekin ilovalar ekotizimini noldan qurish uchun vaqt qolmagan edi.",
      pts: ["Afzallik: mustaqillik va boshqalardan farqlanish", "Xavf: dasturchilar allaqachon iOS va Android ga ketgan edi", "Xavf: katta investitsiya va bir necha yil vaqt talab qilinardi"],
      real: "Haqiqatda MeeGo Windows Phone foydasiga to‘xtatildi, N9 esa bu tizimdagi yagona ommaviy telefon bo‘lib qoldi."
    },
  };
  $$(".choice").forEach(b => b.addEventListener("click", () => {
    $$(".choice").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    const s = SCEN[b.dataset.choice];
    $("#scenario").innerHTML = `<div class="fade-in"><span class="tag">${s.tag}</span><h3>${s.title}</h3><p>${s.text}</p><ul>${s.pts.map(p => `<li>${p}</li>`).join("")}</ul><p class="real">${s.real}</p></div>`;
  }));

  /* ---------------- problems / solutions ---------------- */
  const PS = [
    ["Mobil tarmoqlar bozori turg‘un, operatorlar investitsiyani kamaytirmoqda", "Uskuna bilan birga obuna asosidagi dasturiy ta’minot va AI-RAN xizmatlarini sotish"],
    ["2025-yilda rentabellik 13,4% dan 10,2% ga tushdi", "Kam daromadli yo‘nalishlardan chiqish, IP va optik tarmoqlarga e’tibor, Infinera’dan 200 mln € tejamkorlik"],
    ["Restrukturizatsiya tufayli erkin pul oqimi manfiy", "Dasturni muddatida yakunlash, zaxiralar va debitorlik qarzlarini qat’iy nazorat qilish"],
    ["AI talabiga ishlab chiqarish quvvati yetmayapti", "Yangi optik zavodlarni tezroq ishga tushirish, Nvidia bilan birgalikda rejalashtirish"],
    ["Huawei va Ericsson bilan narx raqobati", "Narx emas, «ishonchli yetkazib beruvchi» maqomi, energiya tejamkorlik va 6G yetakchiligi bilan raqobatlashish"],
  ];
  const psGrid = $("#psGrid");
  PS.forEach(([p, s], i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "flip"; b.setAttribute("aria-label", `Muammo ${i + 1}: ${p}. Yechimni ko‘rish uchun bosing`);
    b.innerHTML = `<div class="inner"><div class="face front"><span class="k">Muammo ${i + 1}</span><p>${p}</p><span class="hint">Yechimni ko‘rish uchun bosing</span></div><div class="face back"><span class="k">Yechim ${i + 1}</span><p>${s}</p></div></div>`;
    b.addEventListener("click", () => b.classList.toggle("open"));
    psGrid.appendChild(b);
  });

  /* ---------------- live poll ---------------- */
  const POLLS = {
    q1: { q: "2011-yilda Nokia qaysi yo‘lni tanlashi kerak edi?", opts: { android: "Android", wp: "Windows Phone", own: "O‘z tizimi (MeeGo)" } },
    q2: { q: "Nokia inqirozining asosiy sababi nima?", opts: { tech: "Texnologik kechikish", mgmt: "Boshqaruv va madaniyat", comp: "Kuchli raqobatchilar" } },
  };
  let activePoll = "q1", pollTimer = null;
  const voteUrl = location.origin + "/vote";
  $("#voteUrl").textContent = voteUrl.replace(/^https?:\/\//, "");
  try { const qr = qrcode(0, "M"); qr.addData(voteUrl); qr.make(); $("#qr").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
  catch (e) { $("#qr").textContent = "QR yuklanmadi"; }

  const tabs = $("#pollTabs");
  Object.entries(POLLS).forEach(([id, p], i) => {
    const t = document.createElement("button");
    t.type = "button"; t.role = "tab"; t.textContent = `${i + 1}-savol`;
    t.setAttribute("aria-selected", id === activePoll);
    t.addEventListener("click", () => { activePoll = id; $$("button", tabs).forEach(x => x.setAttribute("aria-selected", x === t)); renderPoll({}); fetchResults(); });
    tabs.appendChild(t);
  });
  function renderPoll(counts) {
    const p = POLLS[activePoll];
    $("#pollQ").textContent = p.q;
    const total = Object.keys(p.opts).reduce((a, k) => a + (+counts[k] || 0), 0);
    $("#pollBars").innerHTML = Object.entries(p.opts).map(([k, label]) => {
      const n = +counts[k] || 0, pct = total ? Math.round((n / total) * 100) : 0;
      return `<div class="pbar"><div class="lbl"><span>${label}</span><b>${n} · ${pct}%</b></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
    }).join("");
    $("#pollTotal").textContent = `Jami ovozlar: ${total}`;
  }
  async function fetchResults() {
    try {
      const r = await fetch(`/api/results?poll=${activePoll}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      renderPoll(j.counts || {}); $("#pollNote").textContent = "Natijalar har 2 soniyada yangilanadi.";
    } catch (e) {
      renderPoll({});
      $("#pollNote").textContent = "Ovozlar bazasi ulanmagan. Vercel’da Upstash Redis’ni ulang (README faylida ko‘rsatilgan).";
    }
  }
  function startPolling() { if (pollTimer) return; fetchResults(); pollTimer = setInterval(fetchResults, 2000); }
  function stopPolling() { clearInterval(pollTimer); pollTimer = null; }
  renderPoll({});

  /* ---------------- presentation mode ---------------- */
  let cur = 0;
  function fit(sec) {
    const w = $(".wrap", sec); if (!w) return;
    w.style.transform = "none";
    const availH = innerHeight - 130, availW = innerWidth * .9;
    const s = Math.min(1, availH / w.scrollHeight, availW / w.scrollWidth);
    w.style.transform = s < 1 ? `scale(${s})` : "none";
  }
  function show(i) {
    cur = Math.max(0, Math.min(sections.length - 1, i));
    sections.forEach((s, k) => s.classList.toggle("current", k === cur));
    const sec = sections[cur];
    fit(sec); activate(sec);
    if (sec.id === "s-timeline") timelineAuto();
    $("#slideNum").textContent = `${cur + 1} / ${sections.length}`;
    $("#progress").style.width = ((cur + 1) / sections.length) * 100 + "%";
  }
  function enterPresent(start = 0) {
    document.body.classList.add("present");
    $("#presentBtn").textContent = "Taqdimotdan chiqish";
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    show(start);
  }
  function exitPresent() {
    document.body.classList.remove("present");
    $("#presentBtn").textContent = "Taqdimot rejimi";
    sections.forEach(s => { s.classList.remove("current"); const w = $(".wrap", s); if (w) w.style.transform = ""; });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    sections[cur].scrollIntoView({ behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  }
  $("#presentBtn").addEventListener("click", () => document.body.classList.contains("present") ? exitPresent() : enterPresent(0));
  $$("[data-start]").forEach(b => b.addEventListener("click", () => enterPresent(0)));
  $("#prevBtn").addEventListener("click", () => show(cur - 1));
  $("#nextBtn").addEventListener("click", () => show(cur + 1));
  $("#exitBtn").addEventListener("click", exitPresent);
  addEventListener("resize", () => { if (document.body.classList.contains("present")) fit(sections[cur]); });
  document.addEventListener("fullscreenchange", () => { if (document.body.classList.contains("present")) setTimeout(() => fit(sections[cur]), 120); });
  addEventListener("keydown", e => {
    if (window.SnakeRahmat && window.SnakeRahmat.isPlaying()) return; // the game owns the arrows
    if (!document.body.classList.contains("present")) {
      if (e.key === "p" || e.key === "P") enterPresent(0);
      return;
    }
    const onControl = e.target.closest && e.target.closest("button, a, input");
    if (onControl && (e.key === " " || e.key === "Enter")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(cur + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); show(cur - 1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(sections.length - 1);
    else if (e.key === "Escape") exitPresent();
  });
  // swipe between slides on touch screens
  let tx = null;
  addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => {
    if (tx === null || !document.body.classList.contains("present")) return;
    if (window.SnakeRahmat && window.SnakeRahmat.isPlaying()) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1));
  });
})();
