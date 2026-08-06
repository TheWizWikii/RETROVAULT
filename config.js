window.CONFIG = {

    // ============================
    // COINGECKO
    // ============================

    api: {

        baseUrl: "https://api.coingecko.com/api/v3",

        currency: "usd",

        pages: 8,

        perPage: 250

    },

    // ============================
    // FILTROS DEL RADAR
    // ============================

    filters: {

        minMarketCap: 5000000,      // 5M

        maxMarketCap: 150000000,    //150M

        minVolume: 2000000,         //2M

        maxResults: 25

    },

    // ============================
    // PUNTUACIÓN
    // ============================

    score: {

        volumeWeight: 25,

        marketCapWeight: 20,

        athWeight: 20,

        momentumWeight: 15,

        technicalWeight: 20

    },

    // ============================
    // SEÑALES
    // ============================

    signals: {

        strongBuy: 90,

        buy: 75,

        watch: 60,

        avoid: 0

    },

    // ============================
    // INTERVALO INDICADORES
    // ============================

    indicators: {

        timeframe: "4h",

        candles: 200

    }

};