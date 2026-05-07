/* ══════════════════════════════════════════════════════
   admin.js  —  Lógica de la página de administrador
   ══════════════════════════════════════════════════════ */

/* ── Estado ── */
const contadores = {};   // { uid: { nombre, count } }
let   totalAccesos = 0;

/* ── Estado de conexión ── */
function setEstado(s) {
  document.getElementById("dot").className = "dot " + {conectado:"on",desconectado:"off",conectando:"wait"}[s];
  document.getElementById("stxt").textContent = {conectado:"Conectado",desconectado:"Sin conexión",conectando:"Conectando"}[s];
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
  if (topic === CONFIG.topics.wifi_clientes) actualizarWifi(v);
  if (topic === CONFIG.topics.nfc)           registrarNfc(v);
});

/* ════════════════════════════════════
   CLIENTES WIFI
════════════════════════════════════ */

/*
  El ESP32 publica en esp32/wifi un JSON array:
  [
    {"nombre": "iPhone de Ana", "mac": "AA:BB:CC:DD:EE:FF"},
    {"nombre": "Android-2F3A",  "mac": "11:22:33:44:55:66"}
  ]
  
  Si no tienes el nombre, puedes publicar solo:
  [{"mac":"AA:BB:CC:DD:EE:FF"},{"mac":"11:22:33:44:55:66"}]
*/
function actualizarWifi(raw) {
  let clientes;
  try { clientes = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(clientes)) return;

  // Actualizar badge
  document.getElementById("stat-wifi").textContent   = clientes.length;
  document.getElementById("wifi-badge").textContent  = clientes.length + " conectado" + (clientes.length !== 1 ? "s" : "");

  const lista  = document.getElementById("wifi-list");
  const empty  = document.getElementById("wifi-empty");

  if (clientes.length === 0) {
    lista.innerHTML = "";
    lista.appendChild(empty);
    empty.style.display = "";
    return;
  }

  empty.style.display = "none";

  // Reconstruir lista (simple, se actualiza completa cada vez)
  lista.innerHTML = "";
  clientes.forEach((c, i) => {
    const nombre = c.nombre || "Dispositivo " + (i + 1);
    const mac    = c.mac    || "—";
    const div    = document.createElement("div");
    div.className = "wifi-item";
    div.innerHTML = `
      <div class="wifi-icon">📱</div>
      <div>
        <div class="wifi-name">${nombre}</div>
        <div class="wifi-mac">${mac}</div>
      </div>
      <div class="wifi-right">
        <span class="wifi-signal">WiFi</span>
        <div class="wifi-dot"></div>
      </div>`;
    lista.appendChild(div);
  });
}

/* ════════════════════════════════════
   CONTADORES NFC (por persona)
════════════════════════════════════ */

/*
  El ESP32 publica en esp32/nfc:
  {"uid":"A3F2B1C2","nombre":"Carlos"}
  Cada mensaje = un acceso.
*/
function registrarNfc(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const uid    = (data.uid || "UNKNOWN").toUpperCase();
  const nombre = data.nombre || ("Persona " + (Object.keys(contadores).length + 1));

  // Incrementar contador
  totalAccesos++;
  document.getElementById("stat-accesos").textContent = totalAccesos;

  if (!contadores[uid]) {
    contadores[uid] = { nombre, count: 0 };
    document.getElementById("stat-personas").textContent = Object.keys(contadores).length;
    crearContador(uid, nombre);
    document.getElementById("counter-empty").style.display = "none";
  }

  contadores[uid].count++;
  actualizarContador(uid);
}

function crearContador(uid, nombre) {
  const inicial = nombre.charAt(0).toUpperCase();
  const div = document.createElement("div");
  div.className = "counter-card";
  div.id = "cc-" + uid;
  div.innerHTML = `
    <div class="c-avatar">${inicial}</div>
    <div class="c-info">
      <div class="c-name" title="${nombre}">${nombre}</div>
      <div class="c-uid">UID: ${uid.slice(-8)}</div>
      <div class="c-count" id="cc-num-${uid}">0</div>
      <div class="c-count-lbl">ingresos</div>
    </div>`;
  document.getElementById("counter-grid").appendChild(div);
}

function actualizarContador(uid) {
  const n   = contadores[uid].count;
  const el  = document.getElementById("cc-num-" + uid);
  const card= document.getElementById("cc-" + uid);

  if (el) el.textContent = n;

  // Flash
  if (card) {
    card.classList.remove("new-entry");
    void card.offsetWidth;
    card.classList.add("new-entry");
  }
}
