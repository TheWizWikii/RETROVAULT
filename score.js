class ScoreEngine {

    calculate(coin, indicators = null) {

        let score = 0;

        const reasons = [];

        //====================================
        // MARKET CAP
        //====================================

        if (coin.market_cap <= 30000000) {

            score += 20;
            reasons.push("Microcap con alto potencial");

        } else if (coin.market_cap <= 70000000) {

            score += 15;
            reasons.push("Capitalización baja");

        } else {

            score += 10;

        }

        //====================================
        // LIQUIDEZ
        //====================================

        const ratio = coin.total_volume / coin.market_cap;

        if (ratio >= 0.50) {

            score += 20;
            reasons.push("Excelente relación Volumen / MCAP");

        } else if (ratio >= 0.25) {

            score += 15;
            reasons.push("Buena liquidez");

        } else if (ratio >= 0.10) {

            score += 10;

        }

        //====================================
        // DISTANCIA ATH
        //====================================

        if (coin.ath_change_percentage <= -90) {

            score += 15;
            reasons.push("Muy lejos del ATH");

        } else if (coin.ath_change_percentage <= -75) {

            score += 10;

        }

        //====================================
        // MOMENTUM
        //====================================

        const p24 = coin.price_change_percentage_24h || 0;

        if (p24 > 0 && p24 < 15) {

            score += 10;
            reasons.push("Momentum saludable");

        }

        //====================================
        // INDICADORES TÉCNICOS
        //====================================

        if (indicators) {

            // RSI

            if (indicators.rsi >= 40 && indicators.rsi <= 60) {

                score += 10;
                reasons.push("RSI equilibrado");

            }

            // MACD

            if (indicators.macd > 0) {

                score += 10;
                reasons.push("MACD alcista");

            }

            // EMA20

            if (indicators.price > indicators.ema20) {

                score += 5;
                reasons.push("Precio sobre EMA20");

            }

            // EMA50

            if (indicators.price > indicators.ema50) {

                score += 5;
                reasons.push("Precio sobre EMA50");

            }

            // Estocástico

            if (
                indicators.stochastic >= 20 &&
                indicators.stochastic <= 80
            ) {

                score += 5;

            }

        }

        //====================================
        // LIMITE
        //====================================

        score = Math.min(score, 100);

        return {

            score,

            signal: this.signal(score),

            reasons

        };

    }

    //====================================
    // SEÑALES
    //====================================

    signal(score) {

        if (score >= CONFIG.signals.strongBuy) {

            return {

                text: "🟢 Compra fuerte",

                color: "#16c784"

            };

        }

        if (score >= CONFIG.signals.buy) {

            return {

                text: "🟢 Compra",

                color: "#16c784"

            };

        }

        if (score >= CONFIG.signals.watch) {

            return {

                text: "🟡 Esperar",

                color: "#f5b942"

            };

        }

        return {

            text: "🔴 Evitar",

            color: "#ea3943"

        };

    }

    //====================================
    // ANÁLISIS
    //====================================

    buildAnalysis(result) {

        let text = "";

        result.reasons.forEach(r => {

            text += "✔ " + r + "\n";

        });

        text += "\n";

        switch (result.signal.text) {

            case "🟢 Compra fuerte":

                text +=
                    "La combinación de liquidez, volumen e indicadores hace que sea una de las mejores oportunidades del radar.";

                break;

            case "🟢 Compra":

                text +=
                    "Presenta buenas condiciones para una posible entrada, aunque conviene vigilar el volumen.";

                break;

            case "🟡 Esperar":

                text +=
                    "Todavía no reúne suficientes señales para entrar. Conviene esperar confirmación.";

                break;

            default:

                text +=
                    "Actualmente no presenta una configuración favorable para una entrada en spot.";

        }

        return text;

    }

}

window.ScoreEngine = new ScoreEngine();