(function () {
  "use strict";

  var CFG = window.TOTSELECTA_CONFIG;
  var QUEUE_KEY = "totselecta.cua";
  var SENT_KEY = "totselecta.enviats";

  var form = document.getElementById("lead-form");
  var vinsEl = document.getElementById("vins");
  var submitBtn = document.getElementById("submit");
  var queueEl = document.getElementById("queue");
  var queueCount = document.getElementById("queue-count");
  var sentCount = document.getElementById("sent-count");
  var statusEl = document.getElementById("status");
  var toastEl = document.getElementById("toast");
  var sending = false;

  // ---------- Llista de vins ----------
  var CHECK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  CFG.VINS.forEach(function (vi) {
    var label = document.createElement("label");
    label.className = "vi";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "vins";
    input.value = vi;
    var box = document.createElement("span");
    box.className = "box";
    box.innerHTML = CHECK_SVG;
    var name = document.createElement("span");
    name.className = "name";
    name.textContent = vi;
    label.append(input, box, name);
    vinsEl.appendChild(label);
  });

  // ---------- Emmagatzematge local ----------
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sense espai */ }
  }

  function getQueue() { return load(QUEUE_KEY, []); }
  function setQueue(q) { save(QUEUE_KEY, q); renderCounters(); }

  function renderCounters() {
    var q = getQueue();
    queueCount.textContent = q.length;
    queueEl.hidden = q.length === 0;
    sentCount.textContent = load(SENT_KEY, 0);
  }

  // ---------- Missatges ----------
  var toastTimer;
  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = "toast show " + (kind || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = "toast " + (kind || ""); }, 3200);
  }

  function configured() {
    return CFG.SCRIPT_URL && /^https:\/\/script\.google\.com\/.+\/exec$/.test(CFG.SCRIPT_URL);
  }
  if (!configured()) {
    statusEl.hidden = false;
    statusEl.textContent = "L'app encara no està connectada al full de càlcul (falta la URL de l'Apps Script a config.js). Els contactes es desaran en aquest dispositiu fins que es configuri.";
  }

  // ---------- Formulari ----------
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function readForm() {
    var fd = new FormData(form);
    return {
      id: uid(),
      data: new Date().toISOString(),
      restaurant: (fd.get("restaurant") || "").trim(),
      client: (fd.get("client") || "").trim(),
      poblacio: (fd.get("poblacio") || "").trim(),
      telefon: (fd.get("telefon") || "").trim(),
      email: (fd.get("email") || "").trim(),
      interes: fd.getAll("vins").join(", "),
      notes: (fd.get("notes") || "").trim()
    };
  }

  function markInvalid(name, invalid) {
    form.elements[name].closest(".field").classList.toggle("invalid", invalid);
  }

  function validate(lead) {
    var ok = true;
    markInvalid("restaurant", !lead.restaurant);
    if (!lead.restaurant) ok = false;

    var badEmail = lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email);
    markInvalid("email", !!badEmail);
    if (badEmail) ok = false;
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var lead = readForm();
    if (!validate(lead)) {
      if (!lead.restaurant) toast("Falta el nom del restaurant", "err");
      else if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) toast("El correu no és vàlid", "err");
      return;
    }
    var q = getQueue();
    q.push(lead);
    setQueue(q);
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    flush(true);
  });

  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field");
    if (f) f.classList.remove("invalid");
  });

  document.getElementById("clear").addEventListener("click", function () {
    if (confirm("Vols esborrar les dades del formulari?")) {
      form.reset();
      form.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });
    }
  });

  document.getElementById("retry").addEventListener("click", function () { flush(true); });

  // ---------- Enviament al full de càlcul ----------
  function send(lead) {
    var body = JSON.stringify(Object.assign({ token: CFG.TOKEN }, lead));
    // text/plain evita la petició "preflight" CORS, que l'Apps Script no admet
    return fetch(CFG.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body,
      redirect: "follow"
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "Resposta no vàlida");
    });
  }

  function flush(userTriggered) {
    if (sending) return;
    var q = getQueue();
    if (!q.length) return;
    if (!configured()) {
      if (userTriggered) toast("Desat al dispositiu (app sense configurar)", "warn");
      return;
    }
    if (!navigator.onLine) {
      if (userTriggered) toast("Sense connexió · desat i pendent d'enviar", "warn");
      return;
    }
    sending = true;
    submitBtn.disabled = true;
    var sent = 0;

    (function next() {
      var q = getQueue();
      if (!q.length) return done();
      var lead = q[0];
      send(lead).then(function () {
        setQueue(getQueue().filter(function (l) { return l.id !== lead.id; }));
        save(SENT_KEY, load(SENT_KEY, 0) + 1);
        sent++;
        next();
      }).catch(function (err) {
        console.warn("Error enviant", err);
        done(err);
      });
    })();

    function done(err) {
      sending = false;
      submitBtn.disabled = false;
      renderCounters();
      if (err) {
        if (userTriggered) toast("No s'ha pogut enviar · desat i pendent", "warn");
      } else if (sent) {
        toast(sent === 1 ? "Contacte desat ✓" : sent + " contactes enviats ✓", "ok");
      }
    }
  }

  window.addEventListener("online", function () { flush(false); });
  setInterval(function () { flush(false); }, 60000);

  renderCounters();
  flush(false);

  // ---------- Funcionament sense connexió ----------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
