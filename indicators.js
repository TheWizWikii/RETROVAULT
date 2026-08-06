class Indicators {

    // ===============================
    // Descargar velas desde Binance
    // ===============================

    async getCandles(symbol) {

        try {

            const url =
                `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=${CONFIG.indicators.timeframe}&limit=${CONFIG.indicators.candles}`;

            const response = await fetch(url);

            const data = await response.json();

            if (!Array.isArray(data))
                return null;

            return data.map(c => ({
                open: Number(c[1]),
                high: Number(c[2]),
                low: Number(c[3]),
                close: Number(c[4]),
                volume: Number(c[5])
            }));

        }

        catch {

            return null;

        }

    }

    // ===============================
    // EMA
    // ===============================

    ema(values, period) {

        const multiplier = 2 / (period + 1);

        let ema = values[0];

        for (let i = 1; i < values.length; i++) {

            ema = ((values[i] - ema) * multiplier) + ema;

        }

        return ema;

    }

    // ===============================
    // RSI
    // ===============================

    rsi(values, period = 14) {

        if (values.length <= period)
            return 50;

        let gain = 0;
        let loss = 0;

        for (let i = values.length - period; i < values.length; i++) {

            const diff = values[i] - values[i - 1];

            if (diff >= 0)
                gain += diff;
            else
                loss -= diff;

        }

        if (loss === 0)
            return 100;

        const rs = gain / loss;

        return +(100 - (100 / (1 + rs))).toFixed(2);

    }

    // ===============================
    // MACD
    // ===============================

    macd(values) {

        const ema12 = this.ema(values, 12);

        const ema26 = this.ema(values, 26);

        return +(ema12 - ema26).toFixed(4);

    }

    // ===============================
    // Estocástico
    // ===============================

    stochastic(candles, period = 14) {

        const last = candles.slice(-period);

        const highest = Math.max(...last.map(c => c.high));

        const lowest = Math.min(...last.map(c => c.low));

        const close = last[last.length - 1].close;

        return +(((close - lowest) / (highest - lowest)) * 100).toFixed(2);

    }

    // ===============================
    // Analizar moneda
    // ===============================

    async analyze(symbol) {

        const candles = await this.getCandles(symbol);

        if (!candles)
            return null;

        const closes = candles.map(c => c.close);

        const current = closes[closes.length - 1];

        return {

            price: current,

            rsi: this.rsi(closes),

            macd: this.macd(closes),

            stochastic: this.stochastic(candles),

            ema20: +this.ema(closes, 20).toFixed(4),

            ema50: +this.ema(closes, 50).toFixed(4),

            ema200: +this.ema(closes, 200).toFixed(4)

        };

    }

}

window.Indicators = new Indicators();