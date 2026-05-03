/* ══════════════════════════════════════════════════════
   config.js  —  Configuración global del proyecto
   ══════════════════════════════════════════════════════

   Este archivo es el ÚNICO lugar donde debes cambiar
   la dirección del broker y los nombres de los topics.
   ══════════════════════════════════════════════════════ */

const CONFIG = {

  /* ── BROKER ──────────────────────────────────────────
     Broker público gratuito para comenzar.
     Cuando uses tu propio broker, cambia solo esta línea.
     Tu broker Mosquitto con WebSockets: "ws://TU_IP:9001"
  ─────────────────────────────────────────────────────── */
  broker: "wss://broker.hivemq.com:8884/mqtt",

  /* ── TOPICS (deben coincidir con el código del ESP32) ─ */
  topics: {
    temperatura : "esp32/temperatura",  // publica: "25.3"
    bateria     : "esp32/bateria",      // publica: "78"  (0-100%)
    nfc         : "esp32/nfc",          // publica JSON: {"uid":"A3F2","nombre":"Carlos"}
    wifi_clientes: "esp32/wifi",        // publica JSON: [{"nombre":"iPhone","mac":"AA:BB"}]
  },

  /* ── GRÁFICA DE TEMPERATURA ─────────────────────────── */
  maxPuntosGrafica: 40,
  tempAlerta: 35,   // °C — a partir de este valor el borde se vuelve rojo

};

/* ── MQTT: conexión compartida (se crea una sola vez) ─── */
const mqttCliente = mqtt.connect(CONFIG.broker, {
  clientId : "web_" + Math.random().toString(16).slice(2, 8),
  clean    : true,
  reconnectPeriod: 3000,
});
