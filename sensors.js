// ==============================
// ESTADO GLOBAL
// ==============================
let lastNFC1 = -1;
let lastNFC2 = -1;
let tempChart = null;
let tempData = [];
let tempLabels = [];


//FUNCION PARA CREAR LA GRAFICA
function initTempChart() {
  const ctx = document.getElementById("chart-temp");

  if (!ctx) {
    console.error("Canvas chart-temp no encontrado");
    return;
  }

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: tempLabels,
      datasets: [{
        label: "Temperatura",
        data: tempData,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { display: false },
        y: { display: true }
      }
    }
  });
}

//UPDATE DE LA GRAFICA
function updateTempChart(value) {
  if (!tempChart) return;

  const now = new Date().toLocaleTimeString();

  tempData.push(value);
  tempLabels.push(now);

  // limitar a últimos 20 puntos
  if (tempData.length > 20) {
    tempData.shift();
    tempLabels.shift();
  }

  tempChart.update();
}

// ==============================
// ACTUALIZAR UI
// ==============================
function updateUI(data) {

  
  // ===== TEMPERATURA =====
  document.getElementById("val-temp").textContent = data.temp;

// actualizar gráfica
updateTempChart(data.temp);

  // ===== BATERÍA =====
  const bat = data.bat;

  document.getElementById("val-bat").textContent = bat + "%";
  document.getElementById("bat-bar").style.width = bat + "%";

  const color = bat > 60 ? "#22d37a" : bat > 30 ? "#f59e0b" : "#f43f5e";
  document.getElementById("val-bat").style.color = color;

  // ===== NFC (solo si cambia) =====
  const container = document.getElementById("nfc-list");
  const empty = document.getElementById("nfc-empty");

  if (data.nfc1 !== lastNFC1 || data.nfc2 !== lastNFC2) {

    lastNFC1 = data.nfc1;
    lastNFC2 = data.nfc2;

    empty.style.display = "none";

    container.innerHTML = `
      <div style="padding:10px;border:1px solid #1c2030;border-radius:8px;margin-bottom:8px;">
        <strong>Persona 1 (ID: RFID_001)</strong><br>
        Accesos: ${data.nfc1}
      </div>

      <div style="padding:10px;border:1px solid #1c2030;border-radius:8px;">
        <strong>Persona 2 (ID: RFID_002)</strong><br>
        Accesos: ${data.nfc2}
      </div>
    `;
  }
}

// ==============================
// CARGA DE DATOS (SIN abort)
// ==============================
async function loadAll() {
  try {
    const res = await fetch("/api/sensors");

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    console.log("DATA:", data); // debug opcional

    updateUI(data);

  } catch (err) {
    console.error("Error API:", err);
  }
}

// ==============================
// INICIO
// ==============================
function startApp() {
  initTempChart();
  loadAll(); // primera carga
  // más estable para ESP32
  setInterval(loadAll, 3000);
}

// ==============================
// EVENTOS
// ==============================
window.addEventListener("load", startApp);