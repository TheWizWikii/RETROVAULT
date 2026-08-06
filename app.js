window.addEventListener("DOMContentLoaded", () => {

    const refreshButton =
        document.getElementById("refreshButton");

    const searchInput =
        document.getElementById("searchCoin");

    async function loadRadar(force = false) {

        refreshButton.disabled = true;
        refreshButton.textContent = "Actualizando...";

        try {

            await Radar.load(force);

            const bitcoin = API.getBitcoin();

            if (bitcoin) {

                document.getElementById("btcPrice").textContent =
                    new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0
                    }).format(bitcoin.current_price);

            }

        } catch (error) {

            console.error(error);

        } finally {

            refreshButton.disabled = false;
            refreshButton.textContent = "Actualizar Radar";

        }

    }

    refreshButton.addEventListener("click", () => {
        loadRadar(true);
    });

    searchInput.addEventListener("input", () => {

        const value =
            searchInput.value.trim().toLowerCase();

        document
            .querySelectorAll("#scannerTable tr")
            .forEach(row => {

                row.style.display =
                    row.textContent
                        .toLowerCase()
                        .includes(value)
                        ? ""
                        : "none";

            });

    });

    document.getElementById("fearGreed").textContent = "--";
    document.getElementById("btcDominance").textContent = "--";

    loadRadar(false);

});
