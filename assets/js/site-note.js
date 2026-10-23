// "Report a broken step" form: posts to the report Edge Function, which stores it in the site database.
(function () {
  var f = document.getElementById("cc-report");
  if (!f) return;
  var msg = f.querySelector(".cc-report-msg"), btn = f.querySelector("button[type=submit]");
  var ua = navigator.userAgent;
  var browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(f);
    btn.disabled = true; msg.textContent = "Sending…";
    fetch("https://mytaeovzlriyrqnydaas.supabase.co/functions/v1/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location.pathname,
        what_broke: d.get("what_broke"),
        expected: d.get("expected"),
        email: d.get("email"),
        version: d.get("version"),
        website: d.get("website"),
        browser: browser
      })
    }).then(function (r) {
      if (r.ok) { f.reset(); msg.textContent = "Thank you. Your report was sent and I will look at it."; }
      else if (r.status === 429) { msg.textContent = "Too many reports from your network just now. Please try again later."; btn.disabled = false; }
      else if (r.status === 400) { msg.textContent = "Please describe what broke (a few words at least) and check the email address."; btn.disabled = false; }
      else { msg.textContent = "Could not send. Please try again in a little while."; btn.disabled = false; }
    }).catch(function () { msg.textContent = "Could not send. Please try again in a little while."; btn.disabled = false; });
  });
})();
