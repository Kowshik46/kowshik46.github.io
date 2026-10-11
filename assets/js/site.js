// Minimal visitor stats: one POST per page view to a Supabase Edge Function.
// The server hashes the IP; no cookies or local storage are used.
(function () {
  try {
    var ua = navigator.userAgent;
    var browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" :
      /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" :
      /Safari\//.test(ua) ? "Safari" : "Other";
    var w = window.screen.width;
    var device = /Mobi|Android|iPhone/.test(ua) ? "mobile" : /iPad|Tablet/.test(ua) ? "tablet" : "desktop";
    fetch("https://mytaeovzlriyrqnydaas.supabase.co/functions/v1/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: location.pathname,
        referrer: document.referrer,
        browser: browser,
        device_type: device,
        screen: w + "x" + window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    }).catch(function () {});
  } catch (e) {}
})();
