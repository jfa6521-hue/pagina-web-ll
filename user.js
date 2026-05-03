/* ══════════════════════════════════════════════════════
   user.js  —  Lógica de la página de usuario
   ══════════════════════════════════════════════════════ */

/* ── Estado local ── */
const personas = {};   // { uid: { nombre, ingresos:[{ts}], elem } }

/* ── Gráfica de temperatura ── */
const ctx = document.getElementById("chart-temp").getContext("2d");
const grafica = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "°C",
      data: [],
      borderColor: "#00c8ff",
      backgroundColor: "rgba(0,200,255,0.07)",
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.4,
    }],
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        min: 0, max: 50,
        grid: { color: "#1c2030" },
        ticks: { color: "#3a4155", font: { size: 9 } },
      },
    },
  },
});

/* ── Estado de conexión ── */
function setEstado(s) {
  const dot = document.getElementById("dot");
  const txt = document.getElementById("stxt");
  dot.className = "dot " + { conectado:"on", desconectado:"off", conectando:"wait" }[s];
  txt.textContent = { conectado:"Conectado", desconectado:"Sin conexión", conectando:"Conectando" }[s];
}

/* ── MQTT ── */
setEstado("conectando");

mqttCliente.on("connect", () => {
  setEstado("conectado");
  Object.values(CONFIG.topics).forEach(t => mqttCliente.subscribe(t));
});
mqttCliente.on("reconnect", () => setEstado("conectando"));
mqttCliente.on("offline",   () => setEstado("desconectado"));

mqttCliente.on("message", (topic, payload) => {
  const v = payload.toString().trim();

  if (topic === CONFIG.topics.temperatura) actualizarTemp(v);
  if (topic === CONFIG.topics.bateria)     actualizarBat(v);
  if (topic === CONFIG.topics.nfc)         registrarNfc(v);
});

/* ════════════════════════════════════
   TEMPERATURA
════════════════════════════════════ */
function actualizarTemp(raw) {
  const n = parseFloat(raw);
  if (isNaN(n)) return;

  document.getElementById("val-temp").textContent = n.toFixed(1);

  const card = document.getElementById("card-temp");
  card.style.borderColor = n >= CONFIG.tempAlerta ? "var(--red)" : "var(--border)";

  // Agregar punto
  grafica.data.labels.push(hora());
  grafica.data.datasets[0].data.push(n);
  if (grafica.data.labels.length > CONFIG.maxPuntosGrafica) {
    grafica.data.labels.shift();
    grafica.data.datasets[0].data.shift();
  }
  grafica.update();

  pulsar("card-temp");
}

/* ════════════════════════════════════
   BATERÍA
════════════════════════════════════ */
function actualizarBat(raw) {
  const n = Math.max(0, Math.min(100, parseInt(raw, 10)));
  if (isNaN(n)) return;

  // Color dinámico
  const color = n > 50 ? "var(--green)" : n > 20 ? "var(--accent2)" : "var(--red)";
  const estado = n > 80 ? "Carga completa" : n > 50 ? "Batería buena"
               : n > 20 ? "Batería media"  : "Batería baja";

  document.getElementById("val-bat").textContent  = n + "%";
  document.getElementById("val-bat").style.color  = color;
  document.getElementById("bat-lbl").textContent  = estado;
  document.getElementById("bat-bar").style.width  = n + "%";
  document.getElementById("bat-bar").style.background = color;

  // Escalar rectángulo SVG
  const bf = document.getElementById("bf");
  bf.style.fill = color;
  bf.style.transform = `scaleY(${n / 100})`;

  pulsar("card-bat");
}

/* ════════════════════════════════════
   NFC  — CAJONES (DRAWERS)
════════════════════════════════════ */

/*
  El ESP32 publica en esp32/nfc:
  {"uid":"A3F2B1C2","nombre":"Carlos"}
  Si no tienes nombre definido, puedes publicar solo {"uid":"A3F2B1C2"}
  y el sistema usará el UID como identificador.
*/
function registrarNfc(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const uid    = (data.uid || "UNKNOWN").toUpperCase();
  const nombre = data.nombre || ("Tarjeta " + uid.slice(-4));
  const ts     = hora();

  if (!personas[uid]) {
    // Primera vez que vemos esta tarjeta — crear cajón
    crearDrawer(uid, nombre);
  }

  // Registrar ingreso
  personas[uid].ingresos.unshift({ ts });
  actualizarDrawer(uid, ts);
}

function crearDrawer(uid, nombre) {
  // Ocultar placeholder
  const empty = document.getElementById("nfc-empty");
  if (empty) empty.style.display = "none";

  const inicial = nombre.charAt(0).toUpperCase();
  const id      = "drawer-" + uid;

  const div = document.createElement("div");
  div.className = "drawer";
  div.id        = id;
  div.innerHTML = `
    <div class="dhead" onclick="toggleDrawer('${id}')">
      <div class="avatar">${inicial}</div>
      <div class="dinfo">
        <div class="dname">${nombre}</div>
        <div class="duid">UID: ${uid}</div>
      </div>
      <div class="dright">
        <span class="badge" id="badge-${uid}">0</span>
        <span class="dtime" id="time-${uid}">--:--:--</span>
        <svg class="chev" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="dbody">
      <div class="elog" id="elog-${uid}"></div>
    </div>`;

  document.getElementById("nfc-list").appendChild(div);
  personas[uid].elem = div;
}

function actualizarDrawer(uid, ts) {
  const p    = personas[uid];
  const div  = p.elem || document.getElementById("drawer-" + uid);

  // Contador
  document.getElementById("badge-" + uid).textContent = p.ingresos.length;
  document.getElementById("time-"  + uid).textContent = ts;

  // Agregar fila al log
  const elog = document.getElementById("elog-" + uid);
  const row  = document.createElement("div");
  row.className = "erow";
  row.innerHTML = `<div class="edot"></div><span class="ets">${ts}</span><span>Acceso registrado</span>`;
  elog.prepend(row);

  // Flash en el cajón
  div.classList.remove("flash");
  void div.offsetWidth;  // reflow
  div.classList.add("flash");
}

function toggleDrawer(id) {
  document.getElementById(id).classList.toggle("open");
}

/* ── Helpers ── */
function hora() {
  return new Date().toLocaleTimeString("es-CO", { hour12: false });
}

function pulsar(id) {
  const c = document.getElementById(id);
  c.classList.remove("pulse");
  void c.offsetWidth;
  c.classList.add("pulse");
}
