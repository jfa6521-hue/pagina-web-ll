async function loadAdminData() {

  try {

    const res = await fetch("/api/admin");

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    // =========================
    // CLIENTES
    // =========================
    document.getElementById("client-count").textContent =
      data.clients;

    // =========================
    // INTERNET
    // =========================
    const internetCard =
      document.getElementById("internet-card");

    const internetStatus =
      document.getElementById("internet-status");

    const internetDesc =
      document.getElementById("internet-desc");

    // Si hay al menos 1 cliente
    if (data.clients >= 1) {

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

  catch (err) {
    console.error("Error admin API:", err);
  }
}

// =========================
// INICIO
// =========================
function startAdmin() {

  loadAdminData();

  setInterval(loadAdminData, 3000);
}

window.addEventListener("load", startAdmin);