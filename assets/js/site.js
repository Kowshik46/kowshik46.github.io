// Minimal visitor stats: anonymous page views, time on page, scroll depth and
// outbound link clicks sent to a Supabase Edge Function. The server hashes the
// IP. A random ID kept in local storage (cookie as backup) lets return visits
// from different networks count as one visitor; it holds no personal data.
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
    function rid() {
      try { return crypto.randomUUID(); } catch (e) {}
      return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    var visitorId = null;
    try {
      visitorId = localStorage.getItem("_vid");
      if (!visitorId) {
        var m = document.cookie.match(/(?:^|; )_vid=([^;]+)/);
        visitorId = m ? m[1] : rid();
        localStorage.setItem("_vid", visitorId);
      }
    } catch (e) {
      var m2 = document.cookie.match(/(?:^|; )_vid=([^;]+)/);
      visitorId = m2 ? m2[1] : rid();
    }
    try { document.cookie = "_vid=" + visitorId + "; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
    var start = Date.now(), maxScroll = 0, sent = false;

    function send(data) {
      data.view_id = viewId;
      data.visitor_id = visitorId;
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
