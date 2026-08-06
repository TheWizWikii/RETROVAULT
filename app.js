window.addEventListener("DOMContentLoaded", async () => {

    const refreshButton = document.getElementById("refreshButton");
    const searchInput = document.getElementById("searchCoin");

    // ==========================
    // Actualizar Radar
    // ==========================

    refreshButton.addEventListener("click", async () => {

        refreshButton.disabled = true;
        refreshButton.textContent = "Actualizando...";

        await Radar.load();

        refreshButton.disabled = false;
        refreshButton.textContent = "Actualizar Radar";

    });

    // ==========================
    // Buscar moneda
    // ==========================

    searchInput.addEventListener("keyup", () => {

        const value = searchInput.value.toLowerCase();

        const rows = document.querySelectorAll("#scannerTable tr");

        rows.forEach(row => {

            if (row.innerText.toLowerCase().includes(value)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

    // ==========================
    // Datos BTC
    // ==========================

    const btc = API.getBitcoin();

    if (btc) {

        document.getElementById("btcPrice").textContent =
            "$" + btc.current_price.toLocaleString();

    }

    // ==========================
    // Fear & Greed (temporal)
    // ==========================

    document.getElementById("fearGreed").textContent = "--";

    // ==========================
    // Dominancia BTC (temporal)
    // ==========================

    document.getElementById("btcDominance").textContent = "--";

    // ==========================
    // Cargar Radar
    // ==========================

    await Radar.load();

});