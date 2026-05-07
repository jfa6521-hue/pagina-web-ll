// ==============================
// MQTT
// ==============================

const client = mqtt.connect(CONFIG_MQTT.BROKER_WS, {

    username: CONFIG_MQTT.USER,
    password: CONFIG_MQTT.PASS,

    clientId: "web_" + Math.random().toString(16).substr(2, 8)

});

// ==============================
// CHART TEMPERATURA
// ==============================

const tempData = [];
const tempLabels = [];

const ctx = document.getElementById("chart-temp");

const tempChart = new Chart(ctx, {

    type: "line",

    data: {
        labels: tempLabels,
        datasets: [{
            label: "Temperatura",
            data: tempData,
            tension: 0.3
        }]
    },

    options: {
        responsive: true,
        animation: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// ==============================
// MQTT CONNECT
// ==============================

client.on("connect", () => {

    console.log("MQTT conectado");

    client.subscribe("esp32/temperatura");
    client.subscribe("esp32/bateria");
    client.subscribe("esp32/nfc");
    //client.subscribe("esp32/usersAP");
});

// ==============================
// MQTT MESSAGE
// ==============================

client.on("message", (topic, message) => {

    const raw = message.toString();

    console.log(topic, raw);

    let data;

    try {
        data = JSON.parse(raw);
    } catch (err) {
        console.error("JSON inválido:", err);
        return;
    }

    // ==========================
    // TEMPERATURA
    // ==========================
    if (topic === "esp32/temperatura") {

        const temp = data.temp;

        document.getElementById("val-temp").textContent = temp;

        // chart
        tempData.push(Number(temp));
        tempLabels.push("");

        if (tempData.length > 20) {
            tempData.shift();
            tempLabels.shift();
        }

        tempChart.update();
    }

    // ==========================
    // BATERÍA
    // ==========================
    else if (topic === "esp32/bateria") {

        const bat = data.bat;

        document.getElementById("val-bat").textContent = bat + "%";

        document.getElementById("bat-bar").style.width = bat + "%";

        const color =
            bat > 60 ? "#22d37a" :
            bat > 30 ? "#f59e0b" :
            "#f43f5e";

        document.getElementById("val-bat").style.color = color;
    }

    // ==========================
    // NFC
    // ==========================
    else if (topic === "esp32/nfc") {

        document.getElementById("nfc1-val").textContent = data.persona1;

        document.getElementById("nfc2-val").textContent = data.persona2;
    }

});

// ==============================
// DESCONECTAR AL SALIR
// ==============================

window.addEventListener("beforeunload", () => {

    console.log("Desconectando MQTT...");

    client.end();

});