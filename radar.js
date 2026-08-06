class Radar {

    constructor() {
        this.coins = [];
    }

    //=========================================
    // CARGAR RADAR
    //=========================================

    async load() {

        // Descarga y filtra desde CoinGecko
        const market = await API.loadCoins();

        // Score rápido SIN indicadores
        market.forEach(coin => {

            const result = ScoreEngine.calculate(coin);

            coin.score = result.score;
            coin.signal = result.signal;
            coin.analysis = ScoreEngine.buildAnalysis(result);

        });

        // Ordenar por score
        market.sort((a, b) => b.score - a.score);

        // Quedarnos SOLO con el TOP
        this.coins = market.slice(0, CONFIG.filters.maxResults);

        // Ahora sí analizamos técnicamente esas monedas
        await this.loadIndicators();

        // Pintar tabla
        this.render();

    }

    //=========================================
    // ANALIZAR SOLO TOP25
    //=========================================

    async loadIndicators() {

        for (const coin of this.coins) {

            try {

                const indicators =
                    await Indicators.analyze(
                        coin.symbol
                    );

                if (indicators) {

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

                }

            } catch (e) {

                console.log(
                    coin.symbol +
                    " no disponible en Binance."
                );

            }

        }

        this.coins.sort((a, b) => b.score - a.score);

    }

    //=========================================
    // TABLA
    //=========================================

    render() {

        const tbody =
            document.getElementById(
                "scannerTable"
            );

        tbody.innerHTML = "";

        this.coins.forEach((coin, index) => {

            const tr =
                document.createElement("tr");

            tr.innerHTML = `

<td>${index + 1}</td>

<td>

<div style="display:flex;align-items:center;gap:10px;">

<img src="${coin.image}" width="28">

<strong>${coin.symbol.toUpperCase()}</strong>

</div>

</td>

<td>$${coin.current_price.toFixed(6)}</td>

<td class="${coin.price_change_percentage_24h >= 0 ? "positive":"negative"}">

${coin.price_change_percentage_24h.toFixed(2)}%

</td>

<td>${API.money(coin.market_cap)}</td>

<td>${API.money(coin.total_volume)}</td>

<td>

${coin.indicators
? coin.indicators.rsi.toFixed(1)
: "--"}

</td>

<td>

${coin.indicators
? (coin.indicators.macd > 0 ? "🟢" : "🔴")
: "--"}

</td>

<td>

<strong>${coin.score}</strong>

</td>

<td style="color:${coin.signal.color};font-weight:bold;">

${coin.signal.text}

</td>

`;

            tr.onclick = () => {

                this.showDetails(coin);

            };

            tbody.appendChild(tr);

        });

    }

    //=========================================
    // PANEL DERECHO
    //=========================================

    showDetails(coin) {

        document.getElementById("coinImage").src =
            coin.image;

        document.getElementById("coinName").textContent =
            coin.name;

        document.getElementById("coinSymbol").textContent =
            coin.symbol.toUpperCase();

        document.getElementById("coinScore").textContent =
            coin.score;

        document.getElementById("coinSignal").textContent =
            coin.signal.text;

        document.getElementById("detailPrice").textContent =
            "$" + coin.current_price;

        document.getElementById("detailCap").textContent =
            API.money(coin.market_cap);

        document.getElementById("detailSpot").textContent =
            API.money(coin.total_volume);

        document.getElementById("detailATH").textContent =
            coin.ath_change_percentage.toFixed(2) + "%";

        if (coin.indicators) {

            document.getElementById("detailRSI").textContent =
                coin.indicators.rsi.toFixed(2);

            document.getElementById("detailMACD").textContent =
                coin.indicators.macd.toFixed(4);

            document.getElementById("detailStoch").textContent =
                coin.indicators.stochastic.toFixed(2);

            document.getElementById("detailEMA20").textContent =
                coin.indicators.ema20.toFixed(4);

            document.getElementById("detailEMA50").textContent =
                coin.indicators.ema50.toFixed(4);

            document.getElementById("detailEMA200").textContent =
                coin.indicators.ema200.toFixed(4);

        }

        document.getElementById("analysisText").textContent =
            coin.analysis;

    }

}

window.Radar = new Radar();