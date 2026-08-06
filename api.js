class ApiService {

    constructor() {

        this.coins = [];
        this.loaded = false;

    }

    //==================================
    // DESCARGAR MERCADO SOLO UNA VEZ
    //==================================

    async loadCoins(force = false) {

        if (this.loaded && !force) {
            return this.filterCoins();
        }

        this.coins = [];

        for (let page = 1; page <= CONFIG.api.pages; page++) {

            const url =
                `${CONFIG.api.baseUrl}/coins/markets` +
                `?vs_currency=${CONFIG.api.currency}` +
                `&order=market_cap_desc` +
                `&per_page=${CONFIG.api.perPage}` +
                `&page=${page}` +
                `&sparkline=false` +
                `&price_change_percentage=24h,7d`;

            try {

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(response.status);
                }

                const data = await response.json();

                this.coins.push(...data);

                // Evita el límite de CoinGecko
                await this.sleep(400);

            } catch (e) {

                console.error("CoinGecko:", e);

            }

        }

        this.loaded = true;

        return this.filterCoins();

    }

    //==================================
    // FILTROS
    //==================================

    filterCoins() {

        return this.coins.filter(c => {

            if (!c.market_cap) return false;
            if (!c.total_volume) return false;

            if (c.market_cap < CONFIG.filters.minMarketCap)
                return false;

            if (c.market_cap > CONFIG.filters.maxMarketCap)
                return false;

            if (c.total_volume < CONFIG.filters.minVolume)
                return false;

            return true;

        });

    }

    //==================================
    // BUSCAR
    //==================================

    search(text) {

        if (!text)
            return this.filterCoins();

        text = text.toLowerCase();

        return this.filterCoins().filter(c =>

            c.name.toLowerCase().includes(text) ||

            c.symbol.toLowerCase().includes(text)

        );

    }

    //==================================
    // BITCOIN
    //==================================

    getBitcoin() {

        return this.coins.find(c => c.id === "bitcoin");

    }

    //==================================
    // FORMATO
    //==================================

    money(value) {

        return new Intl.NumberFormat("es", {

            notation: "compact",

            maximumFractionDigits: 2

        }).format(value);

    }

    percent(value) {

        if (value === null || value === undefined)
            return "--";

        return value.toFixed(2) + "%";

    }

    //==================================
    // PAUSA
    //==================================

    sleep(ms) {

        return new Promise(resolve => {

            setTimeout(resolve, ms);

        });

    }

}

window.API = new ApiService();