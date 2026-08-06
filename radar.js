class RadarService {

    constructor() {
        this.coins = [];
        this.loading = false;
    }

    async load(force = false) {

        if (this.loading) {
            return;
        }

        this.loading = true;

        try {

            const market = await API.loadCoins(force);

            if (!Array.isArray(market) || market.length === 0) {

                this.showMessage(
                    "No se recibieron monedas. CoinGecko puede haber limitado temporalmente las peticiones."
                );

                return;

            }

            market.forEach(coin => {

                const result = ScoreEngine.calculate(coin);

                coin.score = result.score;
                coin.signal = result.signal;
                coin.analysis = ScoreEngine.buildAnalysis(result);
                coin.indicators = null;

            });

            market.sort((a, b) => b.score - a.score);

            this.coins = market.slice(
                0,
                CONFIG.filters.maxResults
            );

            // Mostrar inmediatamente datos de CoinGecko.
            this.render();

            // Seleccionar la primera moneda inmediatamente.
            if (this.coins.length > 0) {
                this.showDetails(this.coins[0]);
            }

            // Cargar indicadores sin bloquear la tabla.
            await this.loadIndicators();

        } catch (error) {

            console.error("Error al cargar el radar:", error);

            this.showMessage(
                "No se pudo cargar el radar. Revisa la consola del navegador."
            );

        } finally {

            this.loading = false;

        }

    }

    async loadIndicators() {

        const batchSize = 5;

        for (let start = 0; start < this.coins.length; start += batchSize) {

            const batch = this.coins.slice(
                start,
                start + batchSize
            );

            await Promise.allSettled(
                batch.map(async coin => {

                    const indicators =
                        await Indicators.analyze(coin.symbol);

                    if (!indicators) {
                        return;
                    }

                    coin.indicators = indicators;

                    const result =
                        ScoreEngine.calculate(
                            coin,
                            indicators
                        );

                    coin.score = result.score;
                    coin.signal = result.signal;
                    coin.analysis =
                        ScoreEngine.buildAnalysis(result);

                })
            );

            this.coins.sort((a, b) => b.score - a.score);

            this.render();

            await this.sleep(250);

        }

    }

    render() {

        const tbody =
            document.getElementById("scannerTable");

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        this.coins.forEach((coin, index) => {

            const row = document.createElement("tr");

            const change =
                Number(coin.price_change_percentage_24h) || 0;

            const rsi =
                this.formatIndicator(
                    coin.indicators?.rsi,
                    1
                );

            const macd = coin.indicators?.macd;

            const macdText =
                Number.isFinite(macd)
                    ? macd >= 0
                        ? "🟢 Alcista"
                        : "🔴 Bajista"
                    : "Analizando…";

            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <img
                            src="${coin.image || ""}"
                            width="28"
                            height="28"
                            alt=""
                        >
                        <strong>${coin.symbol.toUpperCase()}</strong>
                    </div>
                </td>

                <td>${this.formatPrice(coin.current_price)}</td>

                <td class="${change >= 0 ? "positive" : "negative"}">
                    ${change >= 0 ? "+" : ""}${change.toFixed(2)}%
                </td>

                <td>${API.money(coin.market_cap)}</td>

                <td>${API.money(coin.total_volume)}</td>

                <td>${rsi}</td>

                <td>${macdText}</td>

                <td><strong>${coin.score}</strong></td>

                <td style="color:${coin.signal.color};font-weight:700;">
                    ${coin.signal.text}
                </td>
            `;

            row.addEventListener("click", () => {
                this.showDetails(coin);
            });

            tbody.appendChild(row);

        });

    }

    showDetails(coin) {

        this.setText("coinName", coin.name);
        this.setText("coinSymbol", coin.symbol.toUpperCase());
        this.setText("coinScore", coin.score);
        this.setText("coinSignal", coin.signal.text);

        const image = document.getElementById("coinImage");

        if (image) {
            image.src = coin.image || "";
            image.alt = coin.name || "";
        }

        this.setText(
            "detailPrice",
            this.formatPrice(coin.current_price)
        );

        this.setText(
            "detailCap",
            API.money(coin.market_cap)
        );

        this.setText(
            "detailSpot",
            API.money(coin.total_volume)
        );

        this.setText(
            "detailATH",
            Number.isFinite(Number(coin.ath_change_percentage))
                ? `${Number(coin.ath_change_percentage).toFixed(2)}%`
                : "--"
        );

        const indicators = coin.indicators;

        this.setText(
            "detailRSI",
            this.formatIndicator(indicators?.rsi, 2)
        );

        this.setText(
            "detailMACD",
            this.formatIndicator(indicators?.macd, 6)
        );

        this.setText(
            "detailStoch",
            this.formatIndicator(indicators?.stochastic, 2)
        );

        this.setText(
            "detailEMA20",
            this.formatPrice(indicators?.ema20)
        );

        this.setText(
            "detailEMA50",
            this.formatPrice(indicators?.ema50)
        );

        this.setText(
            "detailEMA200",
            this.formatPrice(indicators?.ema200)
        );

        this.setText(
            "analysisText",
            coin.analysis ||
                "Indicadores técnicos no disponibles para esta moneda."
        );

    }

    showMessage(message) {

        const tbody =
            document.getElementById("scannerTable");

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="padding:30px;text-align:center;">
                    ${message}
                </td>
            </tr>
        `;

    }

    setText(id, value) {

        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                value === null ||
                value === undefined ||
                value === ""
                    ? "--"
                    : value;
        }

    }

    formatIndicator(value, decimals = 2) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number.toFixed(decimals)
            : "Analizando…";

    }

    formatPrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "--";
        }

        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits:
                number < 0.01 ? 8 : 4
        }).format(number);

    }

    sleep(milliseconds) {

        return new Promise(resolve =>
            setTimeout(resolve, milliseconds)
        );

    }

}

window.Radar = new RadarService();
