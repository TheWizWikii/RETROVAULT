class IndicatorsService {

    async getCandles(symbol) {

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {

            const pair = `${String(symbol).toUpperCase()}USDT`;

            const url =
                `https://api.binance.com/api/v3/klines` +
                `?symbol=${encodeURIComponent(pair)}` +
                `&interval=${CONFIG.indicators.timeframe}` +
                `&limit=${CONFIG.indicators.candles}`;

            const response = await fetch(url, {
                signal: controller.signal,
                cache: "no-store"
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length < 30) {
                return null;
            }

            return data.map(row => ({
                open: Number(row[1]),
                high: Number(row[2]),
                low: Number(row[3]),
                close: Number(row[4]),
                volume: Number(row[5])
            }));

        } catch (error) {

            return null;

        } finally {

            clearTimeout(timeout);

        }

    }

    ema(values, period) {

        if (!Array.isArray(values) || values.length < period) {
            return null;
        }

        const multiplier = 2 / (period + 1);

        let result =
            values.slice(0, period)
                .reduce((sum, value) => sum + value, 0) / period;

        for (let i = period; i < values.length; i++) {

            result =
                ((values[i] - result) * multiplier) + result;

        }

        return result;

    }

    rsi(values, period = 14) {

        if (!Array.isArray(values) || values.length <= period) {
            return null;
        }

        let gains = 0;
        let losses = 0;

        for (let i = values.length - period; i < values.length; i++) {

            const difference = values[i] - values[i - 1];

            if (difference > 0) {
                gains += difference;
            } else {
                losses += Math.abs(difference);
            }

        }

        if (losses === 0) {
            return 100;
        }

        const averageGain = gains / period;
        const averageLoss = losses / period;
        const relativeStrength = averageGain / averageLoss;

        return 100 - (100 / (1 + relativeStrength));

    }

    macd(values) {

        const ema12 = this.ema(values, 12);
        const ema26 = this.ema(values, 26);

        if (ema12 === null || ema26 === null) {
            return null;
        }

        return ema12 - ema26;

    }

    stochastic(candles, period = 14) {

        if (!Array.isArray(candles) || candles.length < period) {
            return null;
        }

        const recent = candles.slice(-period);

        const highest = Math.max(...recent.map(candle => candle.high));
        const lowest = Math.min(...recent.map(candle => candle.low));
        const close = recent[recent.length - 1].close;

        if (highest === lowest) {
            return 50;
        }

        return ((close - lowest) / (highest - lowest)) * 100;

    }

    async analyze(symbol) {

        const candles = await this.getCandles(symbol);

        if (!candles) {
            return null;
        }

        const closes = candles.map(candle => candle.close);
        const price = closes[closes.length - 1];

        const ema20 = this.ema(closes, 20);
        const ema50 = this.ema(closes, 50);
        const ema200 = this.ema(closes, 200);

        return {
            price,
            rsi: this.rsi(closes),
            macd: this.macd(closes),
            stochastic: this.stochastic(candles),
            ema20,
            ema50,
            ema200
        };

    }

}

window.Indicators = new IndicatorsService();
