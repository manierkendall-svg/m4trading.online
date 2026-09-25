(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.getElementById("stars");
  const canvas2 = document.getElementById("stars2");
  if (canvas && canvas2) {
    const ctx = canvas.getContext("2d");
    const ctx2 = canvas2.getContext("2d");
    const stars = [];
    const twinkle = [];

    function size() {
      canvas.width = canvas2.width = window.innerWidth;
      canvas.height = canvas2.height = window.innerHeight;
    }

    function spawn() {
      stars.length = 0;
      twinkle.length = 0;
      const n = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 14000));
      for (let i = 0; i < n; i += 1) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 + 0.2,
          a: Math.random() * 0.8 + 0.2
        });
      }
      for (let i = 0; i < Math.floor(n / 4); i += 1) {
        twinkle.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 0.4,
          p: Math.random() * Math.PI * 2,
          s: 0.4 + Math.random() * 1.2
        });
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#c8c8c8";
      stars.forEach(function (s) {
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    let t = 0;
    function loop() {
      t += 0.016;
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      twinkle.forEach(function (s) {
        const a = 0.25 + Math.abs(Math.sin(t * s.s + s.p)) * 0.75;
        ctx2.fillStyle = Math.random() > 0.92 ? "#32cd32" : "#ffffff";
        ctx2.globalAlpha = a;
        ctx2.beginPath();
        ctx2.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx2.fill();
      });
      ctx2.globalAlpha = 1;
      if (!reduced) requestAnimationFrame(loop);
    }

    size();
    spawn();
    drawStatic();
    if (!reduced) loop();
    else {
      drawStatic();
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    }

    window.addEventListener("resize", function () {
      size();
      spawn();
      drawStatic();
    });
  }

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.style.cssText =
        "position:absolute;width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.5);pointer-events:none;transform:scale(0);left:" +
        (e.offsetX - 6) +
        "px;top:" +
        (e.offsetY - 6) +
        "px;animation:rip 0.45s ease-out forwards;";
      btn.appendChild(ripple);
      setTimeout(function () {
        ripple.remove();
      }, 500);
    });
  });

  const style = document.createElement("style");
  style.textContent =
    "@keyframes rip{to{transform:scale(18);opacity:0}}";
  document.head.appendChild(style);

  /* Nav sticks only after the top banner has scrolled out, so it never overlaps it */
  const banner = document.querySelector(".top-banner");
  const navEl = document.querySelector(".nav");
  const rootEl = document.documentElement;
  let navRaf = false;

  function syncNav() {
    if (!banner || !navEl) return;
    const stick = window.scrollY >= banner.offsetHeight - 1;
    navEl.classList.toggle("is-stuck", stick);
    rootEl.style.scrollPaddingTop = stick ? navEl.offsetHeight + "px" : "0px";
  }

  function queueNavSync() {
    if (navRaf) return;
    navRaf = true;
    requestAnimationFrame(function () {
      navRaf = false;
      syncNav();
    });
  }

  window.addEventListener("scroll", queueNavSync, { passive: true });
  window.addEventListener("resize", queueNavSync);
  window.addEventListener("load", queueNavSync);
  syncNav();

  /* Sound engine for tab buttons (Web Audio, no external files) */
  let audioCtx = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, dur, type, vol, at, glide) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + (at || 0);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function playClickSound() {
    const ctx = ensureAudio();
    if (!ctx) return;
    tone(900, 0.05, "triangle", 0.2, 0, 500);
    tone(1500, 0.03, "sine", 0.12, 0.012, 900);
    tone(220, 0.09, "sine", 0.24, 0.03, 120);
  }

  function playHoverSound() {
    const ctx = ensureAudio();
    if (!ctx) return;
    tone(1650, 0.035, "sine", 0.05, 0, 2100);
  }

  function unlockAudio() {
    if (ensureAudio()) document.removeEventListener("pointerdown", unlockAudio);
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true });

  function wireTab(btn) {
    btn.addEventListener("click", function () {
      btn.classList.remove("pop");
      void btn.offsetWidth;
      btn.classList.add("pop");
      playClickSound();
      setTimeout(function () {
        btn.classList.remove("pop");
      }, 560);
    });
    btn.addEventListener("mouseenter", function () {
      if (!btn.classList.contains("pop")) playHoverSound();
    });
    btn.addEventListener("animationend", function (e) {
      if (e.animationName === "tabPop") btn.classList.remove("pop");
    });
  }

  document.querySelectorAll(".nav-links a.tab-btn").forEach(wireTab);
  document.querySelectorAll(".nav-links a:not(.tab-btn)").forEach(wireTab);

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const note = document.getElementById("form-note");
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Sending...";
      setTimeout(function () {
        note.textContent = "Signal received. An M4 specialist will contact you shortly.";
        note.classList.add("ok");
        form.reset();
        btn.disabled = false;
        btn.textContent = "Transmit Request";
      }, 700);
    });
  }

  /* Floating AI robot */
  const bot = document.getElementById("m4-bot");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatLog = document.getElementById("chat-log");
  const hint = document.querySelector(".hint");

  if (!bot || !panel) return;

  let x = 28;
  let y = Math.max(120, window.innerHeight * 0.42);
  let vx = 0.55;
  let vy = 0.38;
  let paused = false;
  let dragging = false;
  let ox = 0;
  let oy = 0;

  function clamp() {
    const maxX = window.innerWidth - 84;
    const maxY = window.innerHeight - 84;
    x = Math.min(Math.max(8, x), maxX);
    y = Math.min(Math.max(70, y), maxY);
  }

  function place() {
    bot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }

  function wander() {
    if (!paused && !dragging && !reduced) {
      x += vx;
      y += vy;
      if (x <= 8 || x >= window.innerWidth - 84) vx *= -1;
      if (y <= 70 || y >= window.innerHeight - 84) vy *= -1;
      if (Math.random() < 0.008) {
        vx += (Math.random() - 0.5) * 0.4;
        vy += (Math.random() - 0.5) * 0.4;
        vx = Math.max(-0.9, Math.min(0.9, vx));
        vy = Math.max(-0.7, Math.min(0.7, vy));
      }
      clamp();
      place();
    }
    if (!reduced) requestAnimationFrame(wander);
  }

  bot.style.left = "0px";
  bot.style.top = "0px";
  place();
  if (!reduced) wander();

  bot.addEventListener("pointerdown", function (e) {
    if (e.target.closest && false) return;
    dragging = true;
    paused = true;
    ox = e.clientX - x;
    oy = e.clientY - y;
    bot.setPointerCapture(e.pointerId);
  });

  bot.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    x = e.clientX - ox;
    y = e.clientY - oy;
    clamp();
    place();
  });

  bot.addEventListener("pointerup", function () {
    dragging = false;
    if (!panel.classList.contains("open")) paused = false;
  });

  function openChat() {
    panel.classList.add("open");
    bot.setAttribute("aria-expanded", "true");
    paused = true;
    if (hint) hint.style.display = "none";
    chatInput.focus();
  }

  function closeChat() {
    panel.classList.remove("open");
    bot.setAttribute("aria-expanded", "false");
    paused = false;
    bot.focus();
  }

  bot.addEventListener("click", function (e) {
    if (dragging) return;
    if (panel.classList.contains("open")) closeChat();
    else openChat();
  });

  closeBtn.addEventListener("click", closeChat);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) closeChat();
  });

  const knowledge = [
    {
      keys: ["hello", "hi", "hey"],
      reply: "Hello. I am M4-AID, the on-site specialist for M4 Trading. Ask about robots, indicators, MetaTrader 5, TradingView, or how to request a custom system."
    },
    {
      keys: ["company", "about", "who", "m4"],
      reply: "M4 Trading (m4algotrading.com) creates and distributes algorithmic trading robots, indicators, and full systems for MetaTrader 5 and TradingView. Focus: precision automation, risk-aware logic, and deployable strategies."
    },
    {
      keys: ["robot", "ea", "expert", "bot"],
      reply: "M4 trading robots (Expert Advisors) execute rules on MetaTrader 5 with defined entries, exits, and risk controls. Request a custom EA or browse packaged systems in Products."
    },
    {
      keys: ["indicator", "signal"],
      reply: "Indicators are built for MT5 and TradingView. They surface entries, trend bias, and volatility without executing trades unless paired with a robot."
    },
    {
      keys: ["tradingview", "pine"],
      reply: "TradingView systems are delivered as Pine Script indicators or strategy scripts. You can overlay them on charts and, where licensed, automate via supported brokers."
    },
    {
      keys: ["metatrader", "mt5", "mt 5"],
      reply: "MetaTrader 5 is a primary deployment target. Robots compile as .ex5 Expert Advisors. Indicators install as custom MT5 studies. We also document lot sizing and magic-number isolation."
    },
    {
      keys: ["price", "cost", "buy", "pricing"],
      reply: "Pricing depends on license type: packaged robots, indicator suites, or fully custom builds. Use Contact to request a quote. Custom systems are scoped after a market and risk briefing."
    },
    {
      keys: ["contact", "email", "support"],
      reply: "Use the Contact section, or email hello@m4algotrading.com. Include platform (MT5 or TradingView), markets, and whether you need a robot, indicator, or full system."
    },
    {
      keys: ["video", "demo", "logo"],
      reply: "Place your logo at assets/logo.svg (or replace with a PNG named assets/logo.png and update the img src). Drop MP4/WebM files into assets/videos/ as hero.mp4, product.mp4, and overview.mp4."
    },
    {
      keys: ["risk", "disclaimer"],
      reply: "Algorithmic trading involves substantial risk of loss. Past performance of any robot or indicator is not a guarantee of future results. Systems are tools — not financial advice."
    }
  ];

  function answer(q) {
    const t = q.toLowerCase();
    for (let i = 0; i < knowledge.length; i += 1) {
      if (knowledge[i].keys.some(function (k) { return t.indexOf(k) !== -1; })) {
        return knowledge[i].reply;
      }
    }
    return "I can help with M4 robots, indicators, MT5, TradingView, pricing, contact, and how to add your logo/videos. Try asking: What does M4 Trading build?";
  }

  function addMsg(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    el.textContent = text;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q) return;
    addMsg(q, "user");
    chatInput.value = "";
    setTimeout(function () {
      addMsg(answer(q), "bot");
    }, 280);
  });
})();

/* Floating music player — wanders like the AI robot, with drag + play/pause */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const floatEl = document.getElementById("music-float");
  const btn = document.getElementById("music-btn");
  const audioEl = document.getElementById("m4-audio");
  const labelEl = document.querySelector("#music-state .music-label");
  if (!floatEl || !btn || !audioEl) return;

  let w = 0;
  let h = 0;
  function measure() {
    const r = floatEl.getBoundingClientRect();
    w = r.width;
    h = r.height;
  }
  measure();

  let x = Math.max(12, window.innerWidth - w - 28);
  let y = Math.max(70, window.innerHeight - h - 130);
  let vx = -0.5;
  let vy = -0.3;
  let dragLock = false;
  let moved = false;
  let ox = 0;
  let oy = 0;
  let hoverPause = false;

  function clampPos() {
    const maxX = window.innerWidth - w - 10;
    const maxY = window.innerHeight - h - 10;
    x = Math.max(10, Math.min(maxX < 10 ? 10 : maxX, x));
    y = Math.max(10, Math.min(maxY < 10 ? 10 : maxY, y));
  }

  function place() {
    floatEl.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }

  function wanderMusic() {
    if (!reduced && !dragLock && !hoverPause) {
      x += vx;
      y += vy;
      if (x <= 10 || x >= window.innerWidth - w - 10) vx *= -1;
      if (y <= 10 || y >= window.innerHeight - h - 10) vy *= -1;
      if (Math.random() < 0.006) {
        vx += (Math.random() - 0.5) * 0.3;
        vy += (Math.random() - 0.5) * 0.3;
        vx = Math.max(-0.6, Math.min(0.6, vx));
        vy = Math.max(-0.5, Math.min(0.5, vy));
      }
      clampPos();
      place();
    }
    if (!reduced) requestAnimationFrame(wanderMusic);
  }

  floatEl.style.left = "0px";
  floatEl.style.top = "0px";
  clampPos();
  place();
  if (!reduced) wanderMusic();
  else place();

  window.addEventListener("resize", function () {
    measure();
    clampPos();
    place();
  });

  function setLabel(text) {
    if (labelEl) labelEl.textContent = text;
  }

  function markPlaying() {
    floatEl.classList.add("playing");
    btn.setAttribute("aria-label", "Pause Star Wars Main Theme");
    setLabel("Playing");
  }

  function markPaused() {
    floatEl.classList.remove("playing");
    btn.setAttribute("aria-label", "Play Star Wars Main Theme");
    setLabel("Tap to play");
  }

  function markMissing() {
    floatEl.classList.remove("playing");
    btn.setAttribute("aria-label", "Add audio file then press play");
    setLabel("Add audio file");
  }

  audioEl.addEventListener("play", markPlaying);
  audioEl.addEventListener("pause", markPaused);
  audioEl.addEventListener("ended", markPaused);
  audioEl.addEventListener("error", markMissing);

  btn.addEventListener("click", function (e) {
    if (moved) return;
    e.stopPropagation();
    if (audioEl.paused) {
      const p = audioEl.play();
      if (p && p.catch) {
        p.catch(function () {
          markMissing();
        });
      }
    } else {
      audioEl.pause();
    }
  });

  floatEl.addEventListener("pointerdown", function (e) {
    dragLock = true;
    moved = false;
    ox = e.clientX - x;
    oy = e.clientY - y;
    floatEl.classList.add("dragging");
    if (floatEl.setPointerCapture) floatEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  floatEl.addEventListener("pointermove", function (e) {
    if (!dragLock) return;
    const nx = e.clientX - ox;
    const ny = e.clientY - oy;
    if (Math.abs(nx - x) > 2 || Math.abs(ny - y) > 2) moved = true;
    x = nx;
    y = ny;
    clampPos();
    place();
  });

  function endDrag() {
    if (!dragLock) return;
    dragLock = false;
    floatEl.classList.remove("dragging");
  }

  floatEl.addEventListener("pointerup", endDrag);
  floatEl.addEventListener("pointercancel", endDrag);

  floatEl.addEventListener("pointerenter", function () {
    hoverPause = true;
  });

  floatEl.addEventListener("pointerleave", function () {
    hoverPause = false;
  });
})();
