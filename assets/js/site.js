// Minimal visitor stats: anonymous page views, time on page, scroll depth and
// outbound link clicks sent to a Supabase Edge Function. The server hashes the
// IP; no cookies or local storage are used.
(function () {
  try {
    var URL_ = "https://mytaeovzlriyrqnydaas.supabase.co/functions/v1/ping";
    var ua = navigator.userAgent;
    var browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" :
      /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" :
      /Safari\//.test(ua) ? "Safari" : "Other";
    var device = /Mobi|Android|iPhone/.test(ua) ? "mobile" : /iPad|Tablet/.test(ua) ? "tablet" : "desktop";
    var q = new URLSearchParams(location.search);
    var viewId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    var start = Date.now(), maxScroll = 0, sent = false;

    function send(data) {
      data.view_id = viewId;
      data.path = location.pathname;
      fetch(URL_, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify(data)
      }).catch(function () {});
    }

    send({
      type: "view",
      referrer: document.referrer,
      browser: browser,
      device_type: device,
      screen: window.screen.width + "x" + window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utm_source: q.get("utm_source"),
      utm_medium: q.get("utm_medium"),
      utm_campaign: q.get("utm_campaign")
    });

    window.addEventListener("scroll", function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
      if (pct > maxScroll) maxScroll = pct;
    }, { passive: true });

    function engage() {
      if (sent) return;
      sent = true;
      send({ type: "engage", seconds: (Date.now() - start) / 1000, scroll_pct: maxScroll });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") engage();
    });
    window.addEventListener("pagehide", engage);

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (a && a.host !== location.host) send({ type: "click", target: a.href });
    });
  } catch (e) {}
})();
