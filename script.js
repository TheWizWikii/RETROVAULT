// ============================================================
//  CONFIGURACIÓN
// ============================================================
const CONFIG = {
    REFRESH_INTERVAL: 60000,        // 60 segundos
    MAX_CRYPTOS: 30,
    COINGECKO_API: 'https://api.coingecko.com/api/v3',
    // Si quieres usar API key (opcional, pero más límites):
    // API_KEY: 'tu-api-key-aqui',
};

const DEFAULT_CRYPTOS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'];

// ============================================================
//  ESTADO
// ============================================================
let cryptos = [];               // Lista de IDs (ej: 'bitcoin')
let favorites = new Set();      // Set de IDs favoritos
let cryptoData = {};           // Datos completos por ID
let filterFavoritesOnly = false;
let isRefreshing = false;

// ============================================================
//  DOM REFS
// ============================================================
const grid = document.getElementById('cryptoGrid');
const input = document.getElementById('cryptoInput');
const addBtn = document.getElementById('addBtn');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdateEl = document.getElementById('lastUpdate');
const suggestionsEl = document.getElementById('suggestions');
const favFilterBtn = document.getElementById('favoritesFilterBtn');
const cryptoCount = document.getElementById('cryptoCount');

// ============================================================
//  CARGA INICIAL
// ============================================================
function loadState() {
    try {
        const saved = localStorage.getItem('cryptoWatchlist');
        if (saved) {
            const parsed = JSON.parse(saved);
            cryptos = parsed.filter(id => typeof id === 'string' && id.length > 0);
        }
        if (!cryptos || cryptos.length === 0) {
            cryptos = [...DEFAULT_CRYPTOS];
        }

        const savedFavs = localStorage.getItem('cryptoFavorites');
        if (savedFavs) {
            const parsed = JSON.parse(savedFavs);
            favorites = new Set(parsed.filter(id => typeof id === 'string'));
        }
    } catch (e) {
        cryptos = [...DEFAULT_CRYPTOS];
        favorites = new Set();
    }
    // Limpiar duplicados
    cryptos = [...new Set(cryptos)];
    saveState();
}

function saveState() {
    localStorage.setItem('cryptoWatchlist', JSON.stringify(cryptos));
    localStorage.setItem('cryptoFavorites', JSON.stringify([...favorites]));
}

// ============================================================
//  API COINGECKO
// ============================================================
async function fetchCryptoData(ids) {
    if (!ids || ids.length === 0) return {};

    const idsParam = ids.join(',');
    const url = `${CONFIG.COINGECKO_API}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetchCryptoData:', error);
        return {};
    }
}

// ============================================================
//  OBTENER VELAS PARA INDICADORES (RSI, MACD, ESTOCÁSTICO)
// ============================================================
async function fetchOHLC(id, days = 30) {
    try {
        const url = `${CONFIG.COINGECKO_API}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // data: [[timestamp, open, high, low, close], ...]
        return data.map(candle => ({
            time: candle[0] / 1000,
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4]
        }));
    } catch (e) {
        console.warn(`No se pudieron obtener velas para ${id}`, e);
        return null;
    }
}

// ============================================================
//  CÁLCULO DE INDICADORES
// ============================================================

// ---- RSI (Relative Strength Index) ----
function calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
        }
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return rsi;
}

// ---- MACD (línea MACD, señal, histograma) ----
function calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    if (closes.length < slow + signal) return null;
    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);
    const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
    const signalLine = calculateEMA(macdLine, signal);
    const histogram = macdLine.map((v, i) => v - signalLine[i]);
    return {
        macdLine: macdLine[macdLine.length - 1],
        signalLine: signalLine[signalLine.length - 1],
        histogram: histogram[histogram.length - 1],
        trend: histogram[histogram.length - 1] > 0 ? 'bullish' : 'bearish'
    };
}

function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

// ---- Estocástico (Stochastic Oscillator) ----
function calculateStochastic(highs, lows, closes, period = 14, smoothK = 3, smoothD = 3) {
    if (closes.length < period + smoothK + smoothD) return { k: 50, d: 50 };
    const kValues = [];
    for (let i = period - 1; i < closes.length; i++) {
        const low = Math.min(...lows.slice(i - period + 1, i + 1));
        const high = Math.max(...highs.slice(i - period + 1, i + 1));
        const k = ((closes[i] - low) / (high - low)) * 100;
        kValues.push(k);
    }
    const kSmooth = calculateSMA(kValues, smoothK);
    const d = calculateSMA(kSmooth, smoothD);
    const lastK = kSmooth[kSmooth.length - 1] || 50;
    const lastD = d[d.length - 1] || 50;
    return { k: lastK, d: lastD };
}

function calculateSMA(data, period) {
    const result = [];
    for (let i = 0; i <= data.length - period; i++) {
        const sum = data.slice(i, i + period).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

// ============================================================
//  PROCESAR DATOS CON INDICADORES
// ============================================================
async function enrichWithIndicators(marketData) {
    const enriched = {};

    for (const item of marketData) {
        const id = item.id;
        const ohlc = await fetchOHLC(id, 30);
        let indicators = {
            rsi: 50,
            macd: { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral' },
            stochastic: { k: 50, d: 50 },
            entryScore: 5
        };

        if (ohlc && ohlc.length > 20) {
            const closes = ohlc.map(c => c.close);
            const highs = ohlc.map(c => c.high);
            const lows = ohlc.map(c => c.low);

            indicators.rsi = calculateRSI(closes, 14);

            const macd = calculateMACD(closes, 12, 26, 9);
            if (macd) indicators.macd = macd;

            const stoch = calculateStochastic(highs, lows, closes, 14, 3, 3);
            if (stoch) indicators.stochastic = stoch;

            // Puntuación de entrada (0-10)
            let score = 5;
            // RSI: <30 sobrevendido (bueno para comprar) / >70 sobrecomprado
            if (indicators.rsi < 30) score += 2;
            else if (indicators.rsi > 70) score -= 2;
            else if (indicators.rsi < 45) score += 1;

            // MACD: histograma positivo = momentum alcista
            if (indicators.macd.histogram > 0) score += 1.5;
            else score -= 1;

            // Estocástico: K < 20 sobrevendido, K > 80 sobrecomprado
            if (indicators.stochastic.k < 20) score += 1.5;
            else if (indicators.stochastic.k > 80) score -= 1.5;

            // Cambio 24h: si es positivo y fuerte ( > 3% ) suma, si es muy negativo resta
            if (item.price_change_percentage_24h > 3) score += 0.5;
            else if (item.price_change_percentage_24h < -3) score -= 0.5;

            // Ajustar entre 0 y 10
            score = Math.min(10, Math.max(0, score));
            indicators.entryScore = Math.round(score * 10) / 10;
        }

        enriched[id] = {
            ...item,
            indicators
        };
    }

    return enriched;
}

// ============================================================
//  RENDERIZADO DE TARJETAS
// ============================================================
function renderCards() {
    let displayIds = filterFavoritesOnly
        ? cryptos.filter(id => favorites.has(id))
        : cryptos;

    if (displayIds.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-rocket"></i>
                <h3>${filterFavoritesOnly ? 'No tienes favoritas aún ⭐' : 'Añade tu primera cripto 🚀'}</h3>
                <p style="color:#555577;margin-top:10px;">
                    ${filterFavoritesOnly ? 'Marca ⭐ en alguna tarjeta' : 'Escribe el nombre y pulsa Añadir'}
                </p>
            </div>
        `;
        cryptoCount.textContent = '0';
        return;
    }

    cryptoCount.textContent = displayIds.length;

    let html = '';
    for (const id of displayIds) {
        const data = cryptoData[id];
        if (!data) {
            html += `<div class="crypto-card" style="opacity:0.5;text-align:center;padding:40px;">
                <i class="fas fa-spinner fa-spin"></i> Cargando ${id}...
            </div>`;
            continue;
        }

        const isFav = favorites.has(id);
        const change = data.price_change_percentage_24h || 0;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeArrow = change >= 0 ? '▲' : '▼';
        const price = data.current_price || 0;
        const marketCap = data.market_cap || 0;

        const ind = data.indicators || { rsi: 50, macd: { trend: 'neutral' }, stochastic: { k: 50, d: 50 }, entryScore: 5 };
        const rsiVal = ind.rsi || 50;
        const rsiClass = rsiVal < 30 ? 'bullish' : rsiVal > 70 ? 'bearish' : 'neutral';
        const macdClass = ind.macd?.trend === 'bullish' ? 'bullish' : ind.macd?.trend === 'bearish' ? 'bearish' : 'neutral';
        const stochK = ind.stochastic?.k || 50;
        const stochClass = stochK < 20 ? 'bullish' : stochK > 80 ? 'bearish' : 'neutral';
        const score = ind.entryScore || 5;
        const scoreClass = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';

        const imgSrc = data.image || `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`;

        html += `
            <div class="crypto-card" data-id="${id}">
                <div class="card-header">
                    <div class="name">
                        <img src="${imgSrc}" alt="${id}" loading="lazy" onerror="this.src='https://assets.coingecko.com/coins/images/1/small/bitcoin.png'" />
                        <div>
                            <h3>${data.name || id}</h3>
                            <span class="symbol">${data.symbol?.toUpperCase() || id}</span>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${id}" title="Favorita">
                            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button class="delete-btn" data-id="${id}" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="price-main">
                    $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    <span class="usd">USD</span>
                </div>

                <div class="change-24h ${changeClass}">
                    ${changeArrow} ${Math.abs(change).toFixed(2)}%
                </div>

                <div class="market-cap">
                    Market Cap: <span>$${(marketCap / 1e9).toFixed(2)}B</span>
                </div>

                <div class="indicators">
                    <div class="indicator-item">
                        <div class="label">RSI</div>
                        <div class="value ${rsiClass}">${rsiVal.toFixed(1)}</div>
                    </div>
                    <div class="indicator-item">
                        <div class="label">MACD</div>
                        <div class="value ${macdClass}">${ind.macd?.trend === 'bullish' ? '🐂' : ind.macd?.trend === 'bearish' ? '🐻' : '⏸️'}</div>
                    </div>
                    <div class="indicator-item">
                        <div class="label">Estocástico</div>
                        <div class="value ${stochClass}">${stochK.toFixed(0)}%</div>
                    </div>
                    <div class="score-badge">
                        <div class="label">🎯 Puntuación Entrada</div>
                        <div class="value ${scoreClass}">${score}/10</div>
                    </div>
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;

    // Eventos en tarjetas
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            toggleFavorite(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            removeCrypto(id);
        });
    });
}

// ============================================================
//  ACTUALIZAR DATOS COMPLETOS
// ============================================================
async function refreshAll() {
    if (isRefreshing) return;
    if (cryptos.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-plus-circle"></i><h3>Añade criptos para empezar</h3></div>`;
        return;
    }

    isRefreshing = true;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

    try {
        const marketData = await fetchCryptoData(cryptos);
        if (!marketData || Object.keys(marketData).length === 0) {
            throw new Error('No se obtuvieron datos');
        }

        // Enriquecer con indicadores (en paralelo)
        const enriched = await enrichWithIndicators(marketData);
        cryptoData = enriched;

        // Guardar timestamp
        const now = new Date();
        lastUpdateEl.textContent = `⏱️ ${now.toLocaleTimeString()}`;

        renderCards();
    } catch (error) {
        console.error('Error en refreshAll:', error);
        grid.innerHTML = `
            <div class="empty-state" style="color:#ff4466;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al obtener datos</h3>
                <p style="color:#777799;">${error.message || 'Intenta de nuevo más tarde'}</p>
            </div>
        `;
    } finally {
        isRefreshing = false;
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    }
}

// ============================================================
//  CRUD DE CRIPTOS
// ============================================================
function addCrypto(id) {
    id = id.trim().toLowerCase();
    if (!id) return;
    if (cryptos.includes(id)) {
        input.value = '';
        suggestionsEl.classList.remove('show');
        return;
    }
    if (cryptos.length >= CONFIG.MAX_CRYPTOS) {
        alert(`Máximo ${CONFIG.MAX_CRYPTOS} criptos permitidas`);
        return;
    }
    cryptos.push(id);
    saveState();
    input.value = '';
    suggestionsEl.classList.remove('show');
    refreshAll();
}

function removeCrypto(id) {
    cryptos = cryptos.filter(c => c !== id);
    favorites.delete(id);
    delete cryptoData[id];
    saveState();
    renderCards();
    if (cryptos.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-plus-circle"></i><h3>¡Añade tu primera cripto!</h3></div>`;
        cryptoCount.textContent = '0';
    }
}

function toggleFavorite(id) {
    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
    }
    saveState();
    renderCards();
}

// ============================================================
//  AUTOCOMPLETADO (sugerencias desde CoinGecko)
// ============================================================
let searchTimeout = null;
let allCoins = [];

async function loadCoinList() {
    try {
        const res = await fetch(`${CONFIG.COINGECKO_API}/coins/list`);
        if (res.ok) {
            allCoins = await res.json();
        }
    } catch (e) {
        console.warn('No se pudo cargar lista de monedas');
    }
}

function showSuggestions(query) {
    if (!query || query.length < 1 || allCoins.length === 0) {
        suggestionsEl.classList.remove('show');
        return;
    }
    const q = query.toLowerCase();
    const matches = allCoins
        .filter(c => c.id.includes(q) || c.symbol.includes(q) || c.name.toLowerCase().includes(q))
        .slice(0, 8);

    if (matches.length === 0) {
        suggestionsEl.classList.remove('show');
        return;
    }

    suggestionsEl.innerHTML = matches.map(c =>
        `<div data-id="${c.id}" data-name="${c.name}">${c.name} (${c.symbol.toUpperCase()})</div>`
    ).join('');
    suggestionsEl.classList.add('show');

    suggestionsEl.querySelectorAll('div').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            input.value = id;
            suggestionsEl.classList.remove('show');
            addCrypto(id);
        });
    });
}

// ============================================================
//  EVENTOS
// ============================================================
input.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const val = this.value.trim();
    if (val.length > 0) {
        searchTimeout = setTimeout(() => showSuggestions(val), 300);
    } else {
        suggestionsEl.classList.remove('show');
    }
});

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = this.value.trim();
        if (val) {
            addCrypto(val);
        }
    }
});

addBtn.addEventListener('click', function() {
    const val = input.value.trim();
    if (val) {
        addCrypto(val);
    }
});

refreshBtn.addEventListener('click', refreshAll);

favFilterBtn.addEventListener('click', function() {
    filterFavoritesOnly = !filterFavoritesOnly;
    this.classList.toggle('active');
    renderCards();
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrapper') && !e.target.closest('.suggestions')) {
        suggestionsEl.classList.remove('show');
    }
});

// ============================================================
//  INICIO
// ============================================================
async function init() {
    loadState();
    await loadCoinList();

    // Si no hay datos, cargar los default
    if (cryptos.length > 0) {
        await refreshAll();
    } else {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-rocket"></i><h3>Bienvenido a CryptoNeon 🚀</h3><p style="color:#555577;">Añade tus criptos favoritas arriba</p></div>`;
        cryptoCount.textContent = '0';
    }

    // Actualización automática cada 60s
    setInterval(refreshAll, CONFIG.REFRESH_INTERVAL);
}

init();

console.log('⚡ CryptoNeon Dashboard cargado');
console.log(`📊 ${cryptos.length} criptos en seguimiento`);
console.log(`⭐ ${favorites.size} favoritas`);