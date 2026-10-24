// Claude Quiz: a start screen, then one question at a time with instant feedback, a progress bar,
// a results card with a reading list, and a certificate. Without JavaScript every question is listed
// with a "Show the answer" box instead.
(function () {
  var qs = [].slice.call(document.querySelectorAll(".cc-q[data-answer]"));
  if (!qs.length) return;
  var TOTAL = qs.length, KEY = "cc-claude-quiz";
  var STAGES = { basics: "Basics", control: "Control", extend: "Extend", operate: "Operate" };
  var DAYS = { "01": "Using it vs. using it well", "02": "Context and CLAUDE.md", "03": "Setup: terminal and VS Code",
    "04": "Prompts, plan mode and shortcuts", "05": "Context, permissions and control", "06": "Git, commits and reviews",
    "07": "MCP: plug it into your tools", "08": "Skills and slash commands", "09": "Subagents and hooks",
    "10": "Plugins and marketplaces", "11": "Scripts and GitHub Actions", "12": "Models, cost and parallel sessions" };
  var BANDS = [
    { min: TOTAL, title: "Claude Code Grandmaster", line: "A perfect score. Teach the rest of us." },
    { min: TOTAL - 3, title: "Claude Code Whisperer", line: "Plans before it builds. Denies before it allows." },
    { min: Math.round(TOTAL * 0.64), title: "Certified Prompt Wrangler", line: "Knows when to /clear and when to /compact." },
    { min: Math.round(TOTAL * 0.36), title: "Context Window Apprentice", line: "The foundations are in. The dials are next." },
    { min: 0, title: "Brave Explorer", line: "Took the quiz anyway. Day 1 is waiting." }
  ];
  var band = function (s) { for (var i = 0; i < BANDS.length; i++) if (s >= BANDS[i].min) return BANDS[i]; };
  var L = "ABCD", body = document.body;
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  // Remember where the visitor came from (for the certificate row in the stats dashboard).
  var p = new URLSearchParams(location.search), src = {};
  try { src = JSON.parse(sessionStorage.getItem(KEY + "-src") || "null") || {
    utm_source: p.get("utm_source"), utm_campaign: p.get("utm_campaign"), referrer: document.referrer || null };
    sessionStorage.setItem(KEY + "-src", JSON.stringify(src)); } catch (e) {}

  body.classList.add("cc-quiz-js");

  // Quiz header: exit, position, stage, score and a progress bar.
  var bar = document.createElement("div");
  bar.className = "cc-qbar";
  bar.innerHTML = '<div class="cc-qbar-row"><button type="button" class="cc-qbar-exit" aria-label="Exit the quiz"><i class="fas fa-times"></i> Exit</button>' +
    '<span class="cc-qbar-pos"></span><span class="cc-qbar-score"></span></div><div class="cc-qbar-track"><i></i></div>';
  var list = document.getElementById("questions");
  list.parentNode.insertBefore(bar, list);
  bar.querySelector(".cc-qbar-exit").addEventListener("click", function () { exit(); });

  var cur = 0;
  qs.forEach(function (q, i) {
    q.dataset.i = i;
    [].slice.call(q.querySelectorAll(".cc-opts li")).forEach(function (li, j) {
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.addEventListener("click", function () { pick(q, j); });
      li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(q, j); } });
    });
    var nx = document.createElement("button");
    nx.type = "button"; nx.className = "cc-btn solid cc-next";
    nx.innerHTML = i === TOTAL - 1 ? 'See my result <i class="fas fa-trophy"></i>' : 'Next question <i class="fas fa-arrow-right"></i>';
    nx.addEventListener("click", function () { go(i + 1); });
    q.appendChild(nx);
    if (state[i] != null) mark(q, state[i]);
  });

  // Start buttons: resume where you left off, or show the result if you already finished.
  var starts = [].slice.call(document.querySelectorAll(".cc-start"));
  function label() {
    var n = score().n;
    starts.forEach(function (b) {
      b.innerHTML = n === 0 ? '<i class="fas fa-play"></i> Start the quiz' : n < TOTAL ? '<i class="fas fa-play"></i> Resume the quiz (' + n + "/" + TOTAL + ")" : '<i class="fas fa-trophy"></i> See my result';
    });
  }
  starts.forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); begin(); }); });
  label();

  function first() { for (var i = 0; i < TOTAL; i++) if (state[i] == null) return i; return TOTAL; }
  function begin() { body.classList.remove("review"); body.classList.add("quiz-on"); go(first()); }
  function exit() { body.classList.remove("quiz-on", "review", "finished"); label(); window.scrollTo(0, 0); }
  function go(i) {
    cur = i;
    qs.forEach(function (q, k) { q.classList.toggle("cur", k === i); });
    body.classList.toggle("finished", i >= TOTAL);
    if (i >= TOTAL) result(score());
    update();
    window.scrollTo(0, 0);
    var q = qs[i]; if (q) { var f = q.classList.contains("done") ? q.querySelector(".cc-next") : q.querySelector(".cc-opts li"); if (f) f.focus({ preventScroll: true }); }
  }

  function pick(q, j) {
    if (q.classList.contains("done") || body.classList.contains("review")) return;
    state[q.dataset.i] = j; save();
    mark(q, j);
    update();
    q.querySelector(".cc-next").focus({ preventScroll: true });
  }
  function mark(q, j) {
    var ans = Number(q.dataset.answer), lis = q.querySelectorAll(".cc-opts li");
    q.classList.add("done", j === ans ? "right" : "wrong");
    lis[ans].classList.add("is-right");
    if (j !== ans) lis[j].classList.add("is-wrong");
    var d = q.querySelector(".cc-ans"); if (d) d.open = true;
    var v = q.querySelector(".cc-verdict") || q.insertBefore(document.createElement("p"), d);
    var cheers = ["Correct! +1", "Nailed it. +1", "Yes! +1", "Spot on. +1"];
    v.className = "cc-verdict " + (j === ans ? "ok" : "no");
    v.textContent = j === ans ? cheers[q.dataset.i % cheers.length] : "Not quite. You picked " + L[j] + ", the answer is " + L[ans] + ".";
  }
  function score() {
    var s = 0, n = 0, st = {}, miss = {};
    qs.forEach(function (q, i) {
      var k = q.dataset.stage; st[k] = st[k] || [0, 0]; st[k][1]++;
      if (state[i] == null) return; n++;
      if (Number(state[i]) === Number(q.dataset.answer)) { s++; st[k][0]++; } else miss[q.dataset.day] = (miss[q.dataset.day] || 0) + 1;
    });
    return { s: s, n: n, st: st, miss: miss };
  }
  function update() {
    var r = score(), q = qs[cur];
    bar.querySelector(".cc-qbar-pos").textContent = cur >= TOTAL ? "Finished" : "Question " + (cur + 1) + " of " + TOTAL + " · " + STAGES[q.dataset.stage];
    bar.querySelector(".cc-qbar-score").innerHTML = "Score <b>" + r.s + "</b>";
    bar.querySelector(".cc-qbar-track i").style.width = (cur >= TOTAL ? 100 : (cur + (q && q.classList.contains("done") ? 1 : 0)) / TOTAL * 100) + "%";
  }

  // Keyboard: A to D (or 1 to 4) picks, Enter or the right arrow moves on.
  document.addEventListener("keydown", function (e) {
    if (!body.classList.contains("quiz-on") || cur >= TOTAL || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName)) return;
    var q = qs[cur], k = e.key.toUpperCase(), j = "ABCD".indexOf(k); if (j < 0) j = "1234".indexOf(k);
    if (j >= 0 && !q.classList.contains("done")) { e.preventDefault(); pick(q, j); }
    else if ((e.key === "ArrowRight" || e.key === "Enter") && q.classList.contains("done") && e.target.tagName !== "BUTTON") { e.preventDefault(); go(cur + 1); }
  });

  var box = document.getElementById("cc-result");
  function result(r) {
    if (!box) return;
    var b = band(r.s), days = Object.keys(r.miss).sort();
    box.hidden = false;
    box.querySelector(".cc-r-score").textContent = r.s + " / " + TOTAL;
    box.querySelector(".cc-r-title").textContent = b.title;
    box.querySelector(".cc-r-line").textContent = b.line;
    box.querySelector(".cc-r-stages").innerHTML = Object.keys(STAGES).map(function (k) {
      var x = r.st[k] || [0, 0]; return "<span><b>" + STAGES[k] + "</b> " + x[0] + "/" + x[1] + "</span>";
    }).join("");
    box.querySelector(".cc-r-read").innerHTML = days.length
      ? "<h3>Your reading list</h3><ul>" + days.map(function (d) {
          return '<li><a href="../day-' + d + '/">Day ' + Number(d) + ": " + DAYS[d] + "</a> <span>" + r.miss[d] + " missed</span></li>";
        }).join("") + "</ul>"
      : "<h3>Nothing to revisit</h3><p>Full marks. Pick a hook from Day 9 or the Day 12 dials and build something real this week.</p>";
  }
  var again = document.getElementById("cc-again");
  if (again) again.addEventListener("click", function () {
    state = {}; save();
    qs.forEach(function (q) {
      q.classList.remove("done", "right", "wrong");
      [].forEach.call(q.querySelectorAll(".cc-opts li"), function (li) { li.classList.remove("is-right", "is-wrong"); });
      var v = q.querySelector(".cc-verdict"); if (v) v.remove();
      var d = q.querySelector(".cc-ans"); if (d) d.open = false;
    });
    var o = document.getElementById("cc-cert-out"); if (o) { o.hidden = true; o.innerHTML = ""; }
    begin();
  });
  var review = document.getElementById("cc-review");
  if (review) review.addEventListener("click", function () {
    body.classList.remove("quiz-on", "finished"); body.classList.add("review");
    document.getElementById("questions").scrollIntoView();
  });

  // ----- certificate -----
  var form = document.getElementById("cc-cert-form");
  if (!form) return;
  var msg = form.querySelector(".cc-cert-msg"), btn = form.querySelector("button[type=submit]");
  var out = document.getElementById("cc-cert-out");
  var ua = navigator.userAgent;
  var browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var r = score(), name = (new FormData(form).get("name") || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (r.n < TOTAL) { msg.textContent = "Answer all " + TOTAL + " questions first."; return; }
    if (name.length < 2) { msg.textContent = "Type the name you want on the certificate."; return; }
    var b = band(r.s), stages = {};
    Object.keys(STAGES).forEach(function (k) { var x = r.st[k] || [0, 0]; stages[k] = x[0] + "/" + x[1]; });
    btn.disabled = true; msg.textContent = "Printing your certificate…";
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (x) {}
    fetch("https://mytaeovzlriyrqnydaas.supabase.co/functions/v1/award", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz: "claude-quiz", name: name, score: r.s, total: TOTAL, title: b.title, stages: stages,
        utm_source: src.utm_source, utm_campaign: src.utm_campaign, referrer: src.referrer, browser: browser, tz: tz,
        website: new FormData(form).get("website") })
    }).then(function (res) { return res.ok ? res.json() : null; }).catch(function () { return null; })
      .then(function (j) {
        draw(name, r, b, stages, j && j.cert_id);
        msg.textContent = j && j.cert_id ? "Done! Certificate " + j.cert_id + "." : "Here it is. (It could not be registered just now, so it has no ID.)";
        btn.disabled = false;
      });
  });

  function draw(name, r, b, stages, id) {
    var c = document.createElement("canvas"); c.width = 1200; c.height = 1200;
    var x = c.getContext("2d"), F = "Inter, 'Segoe UI', sans-serif";
    var go = function () {
      x.fillStyle = "#0a0a0f"; x.fillRect(0, 0, 1200, 1200);
      var g = x.createRadialGradient(950, 150, 0, 950, 150, 650); g.addColorStop(0, "rgba(99,102,241,0.38)"); g.addColorStop(1, "rgba(99,102,241,0)");
      x.fillStyle = g; x.fillRect(0, 0, 1200, 1200);
      g = x.createRadialGradient(150, 1100, 0, 150, 1100, 550); g.addColorStop(0, "rgba(244,114,182,0.2)"); g.addColorStop(1, "rgba(244,114,182,0)");
      x.fillStyle = g; x.fillRect(0, 0, 1200, 1200);
      x.strokeStyle = "rgba(165,180,252,0.45)"; x.lineWidth = 3; x.strokeRect(40, 40, 1120, 1120);
      x.strokeStyle = "rgba(165,180,252,0.18)"; x.lineWidth = 1.5; x.strokeRect(56, 56, 1088, 1088);
      x.textAlign = "center";
      x.fillStyle = "#a5b4fc"; x.font = "600 26px " + F; spaced("CLAUDE QUIZ · " + TOTAL + " QUESTIONS", 600, 150, 5);
      x.fillStyle = "#e8e8f0"; x.font = "800 64px " + F; x.fillText("Certificate of Not Just", 600, 250);
      x.fillText("Pressing Enter", 600, 325);
      x.fillStyle = "rgba(232,232,240,0.6)"; x.font = "400 28px " + F; x.fillText("This certifies that", 600, 410);
      var size = 92; x.font = "800 " + size + "px " + F;
      while (x.measureText(name).width > 1000 && size > 40) { size -= 4; x.font = "800 " + size + "px " + F; }
      var w = x.measureText(name).width;
      g = x.createLinearGradient(600 - w / 2, 0, 600 + w / 2, 0); g.addColorStop(0, "#818cf8"); g.addColorStop(1, "#f472b6");
      x.fillStyle = g; x.fillText(name, 600, 520);
      x.fillStyle = "rgba(232,232,240,0.6)"; x.font = "400 28px " + F;
      x.fillText("took the Claude Quiz on Claude Code and scored", 600, 590);
      x.fillStyle = "#fff"; x.font = "800 120px " + F; x.fillText(r.s + "/" + TOTAL, 600, 725);
      // title badge
      x.font = "700 38px " + F; var tw = x.measureText(b.title).width + 80;
      x.fillStyle = "rgba(99,102,241,0.18)"; round(600 - tw / 2, 765, tw, 70, 35); x.fill();
      x.strokeStyle = "rgba(165,180,252,0.6)"; x.lineWidth = 2; x.stroke();
      x.fillStyle = "#c7d2fe"; x.fillText(b.title, 600, 813);
      x.fillStyle = "rgba(232,232,240,0.75)"; x.font = "italic 400 28px " + F; x.fillText(b.line, 600, 885);
      // stage chips, terminal style
      x.font = "500 24px 'Cascadia Code', Consolas, 'DejaVu Sans Mono', monospace"; x.fillStyle = "#6ee7b7";
      x.fillText("> " + Object.keys(STAGES).map(function (k) { return STAGES[k].toLowerCase() + " " + stages[k]; }).join("  ·  "), 600, 950);
      // footer
      x.textAlign = "left"; x.fillStyle = "rgba(232,232,240,0.5)"; x.font = "400 20px " + F; x.fillText("Issued by", 100, 1022);
      x.fillStyle = "#fff"; x.font = "700 28px " + F; x.fillText("Kowshik Kesavarapu", 100, 1060);
      x.fillStyle = "#a5b4fc"; x.font = "500 24px " + F; x.fillText("github.com/Kowshik46", 100, 1098);
      x.textAlign = "right"; x.fillStyle = "#a5b4fc"; x.font = "600 24px " + F; x.fillText("kowshik.co.in/claude-code/quiz", 1100, 1060);
      x.fillStyle = "rgba(232,232,240,0.5)"; x.font = "400 20px " + F;
      x.fillText((id ? id + " · " : "") + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), 1100, 1098);
      show(c, name, r, b);
    };
    function spaced(t, cx, y, sp) { var tot = 0, i; for (i = 0; i < t.length; i++) tot += x.measureText(t[i]).width + sp; var px = cx - tot / 2; x.textAlign = "left";
      for (i = 0; i < t.length; i++) { x.fillText(t[i], px, y); px += x.measureText(t[i]).width + sp; } x.textAlign = "center"; }
    function round(a, y, w, h, rr) { x.beginPath(); x.moveTo(a + rr, y); x.arcTo(a + w, y, a + w, y + h, rr); x.arcTo(a + w, y + h, a, y + h, rr); x.arcTo(a, y + h, a, y, rr); x.arcTo(a, y, a + w, y, rr); x.closePath(); }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
  }
  function show(c, name, r, b) {
    var url = c.toDataURL("image/png"), page = "https://kowshik.co.in/claude-code/quiz/?utm_source=linkedin&utm_campaign=quiz-cert";
    var text = "I scored " + r.s + "/" + TOTAL + " on the Claude Quiz and I am officially a " + b.title + ". Think you can beat it? " + page;
    out.hidden = false;
    out.innerHTML = '<img alt="Your Claude Code quiz certificate" width="1200" height="1200" />' +
      '<div class="cc-jump"><a class="cc-btn solid" download="claude-code-certificate.png"><i class="fas fa-download"></i> Download PNG</a>' +
      '<a class="cc-btn" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(page) + '"><i class="fab fa-linkedin"></i> Share on LinkedIn</a>' +
      '<button type="button" class="cc-btn" id="cc-copy"><i class="fas fa-copy"></i> Copy brag text</button></div>' +
      '<p class="cc-cert-tip">Tip: download the image, then attach it to your LinkedIn post with the brag text. Tag me so I can cheer.</p>';
    out.querySelector("img").src = url;
    out.querySelector("a[download]").href = url;
    out.querySelector("#cc-copy").addEventListener("click", function () {
      var t = this; (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { t.innerHTML = '<i class="fas fa-check"></i> Copied'; }, function () {
        var ta = document.createElement("textarea"); ta.value = text; ta.rows = 3; ta.className = "cc-copy-box"; t.parentNode.after(ta); ta.select();
      });
    });
    out.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();
