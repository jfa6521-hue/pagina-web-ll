// ==============================
// MQTT
// ==============================

const client = mqtt.connect(CONFIG_MQTT.BROKER_WS, {

    username: CONFIG_MQTT.USER,
    password: CONFIG_MQTT.PASS,

    clientId: "admin_" + Math.random().toString(16).substr(2, 8)

});

// ==============================
// CONEXIÓN
// ==============================

client.on("connect", () => {

    console.log("Admin MQTT conectado");

    // solo necesitamos este topic
    client.subscribe("esp32/usersAP");

});

// ==============================
// MENSAJES
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
    // USERS AP
    // ==========================
    if (topic === "esp32/usersAP") {

        const users = data.usuarios;

        // CLIENTES
        document.getElementById("client-count").textContent =
            users;

        // INTERNET
        const internetCard =
            document.getElementById("internet-card");

        const internetStatus =
            document.getElementById("internet-status");

        const internetDesc =
            document.getElementById("internet-desc");

        // lógica internet
        if (users >= 1) {

            internetCard.classList.remove("internet-off");
            internetCard.classList.add("internet-ok");

            internetStatus.textContent = "Conectado";

            internetDesc.textContent =
                "NAT Router activo · tráfico habilitado";

        }

        else {

            internetCard.classList.remove("internet-ok");
            internetCard.classList.add("internet-off");

            internetStatus.textContent = "Desconectado";

            internetDesc.textContent =
                "Sin dispositivos conectados";
        }
    }

});

// ==============================
// DESCONECTAR AL SALIR
// ==============================

window.addEventListener("beforeunload", () => {

    console.log("Desconectando MQTT admin...");

    client.end();

});