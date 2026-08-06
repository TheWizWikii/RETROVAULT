// ============================================================
//  CONFIGURACIÓN - MicroCaps Hunter
// ============================================================
const CONFIG = {
    REFRESH_INTERVAL: 60000,           // 60 segundos
    MAX_CRYPTOS: 30,
    MAX_MARKET_CAP: 100000000,         // $100M (microcaps)
    MIN_MARKET_CAP: 100000,            // $100K (evitar basura)
    TIMEFRAME: '1h',                   // '1h', '4h', '1d', '7d'
    COINGECKO_API: 'https://api.coingecko.com/api/v3',
};

const DEFAULT_CRYPTOS = [
    // Microcaps prometedoras (ejemplos)
    'kaspa', 'celestia', 'sei', 'arbitrum', 'optimism',
    'gala', 'chiliz', 'enjincoin', 'apecoin', 'magic'
];

// ============================================================
//  ESTADO
// ============================================================
let cryptos = [];
let favorites = new Set();
let cryptoData = {};
let filterFavoritesOnly = false;
let isRefreshing = false;
let lastSignal = {};

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
    const url = `${CONFIG.COINGECKO_API}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetchCryptoData:', error);
        return {};
    }
}

// ============================================================
//  OBTENER VELAS CON TEMPORALIDAD
// ============================================================
async function fetchOHLC(id, timeframe = '1h') {
    // Mapeo de temporalidad a días y minutos para la API
    const timeframeMap = {
        '1h': { days: 1, interval: 'hourly' },
        '4h': { days: 7, interval: '4h' },
        '1d': { days: 30, interval: 'daily' },
        '7d': { days: 90, interval: 'daily' },
    };
    
    const config = timeframeMap[timeframe] || timeframeMap['1h'];
    
    try {
        // Para datos horarios, usamos el endpoint de mercado
        const url = `${CONFIG.COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${config.days}&interval=${config.interval}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (!data.prices || data.prices.length < 20) return null;
        
        // Convertir a formato OHLC
        const prices = data.prices;
        const volumes = data.total_volumes || [];
        
        // Crear velas a partir de los precios
        const candles = [];
        let currentCandle = null;
        const intervalMs = config.interval === 'hourly' ? 3600000 : 
                          config.interval === '4h' ? 14400000 : 86400000;
        
        for (let i = 0; i < prices.length; i++) {
            const [time, price] = prices[i];
            const vol = volumes[i] ? volumes[i][1] : 0;
            
            if (!currentCandle || time - currentCandle.time > intervalMs) {
                if (currentCandle) candles.push(currentCandle);
                currentCandle = {
                    time: time,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: vol
                };
            } else {
                currentCandle.high = Math.max(currentCandle.high, price);
                currentCandle.low = Math.min(currentCandle.low, price);
                currentCandle.close = price;
                currentCandle.volume += vol;
            }
        }
        if (currentCandle) candles.push(currentCandle);
        
        return candles;
    } catch (e) {
        console.warn(`No se pudieron obtener velas para ${id}`, e);
        return null;
    }
}

// ============================================================
//  CÁLCULO DE INDICADORES (INTERNOS, NO SE MUESTRAN)
// ============================================================

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
    return 100 - (100 / (1 + (avgGain / avgLoss)));
}

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
    return { 
        k: kSmooth[kSmooth.length - 1] || 50, 
        d: d[d.length - 1] || 50 
    };
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
//  DETECTOR DE SUELO (PISO DE PRECIO)
// ============================================================
function detectFloor(closes) {
    if (closes.length < 30) return { isAtFloor: false, floorLevel: null, distance: 0 };
    
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const currentPrice = closes[closes.length - 1];
    const range = maxPrice - minPrice;
    
    // Si el rango es muy pequeño, no hay mucho movimiento
    if (range < 0.01) return { isAtFloor: false, floorLevel: null, distance: 0 };
    
    // Distancia desde el suelo (0% = en el suelo, 100% = en el techo)
    const distanceFromFloor = ((currentPrice - minPrice) / range) * 100;
    
    // Buscar si el precio ha rebotado en este suelo recientemente
    const recentCloses = closes.slice(-10);
    const touchesFloor = recentCloses.some(c => (c - minPrice) / range < 0.05);
    
    return {
        isAtFloor: distanceFromFloor < 15,
        floorLevel: minPrice,
        distance: distanceFromFloor,
        touchesFloor: touchesFloor,
        range: range,
        maxPrice: maxPrice,
        minPrice: minPrice
    };
}

// ============================================================
//  SEÑAL DE ENTRADA COMPLETA (OCULTA INDICADORES TÉCNICOS)
// ============================================================
function generateEntrySignal(id, marketData, ohlcData) {
    if (!ohlcData || ohlcData.length < 30) {
        return {
            signal: '⏳ Sin datos suficientes',
            score: 0,
            confidence: 'baja',
            details: []
        };
    }
    
    const closes = ohlcData.map(c => c.close);
    const highs = ohlcData.map(c => c.high);
    const lows = ohlcData.map(c => c.low);
    const currentPrice = closes[closes.length - 1];
    const marketCap = marketData.market_cap || 0;
    const change24h = marketData.price_change_percentage_24h || 0;
    
    // 1. RSI (sobrevendido < 30 es bueno para comprar)
    const rsi = calculateRSI(closes, 14);
    const rsiSignal = rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral';
    
    // 2. MACD
    const macd = calculateMACD(closes, 12, 26, 9);
    const macdSignal = macd ? macd.trend : 'neutral';
    
    // 3. Estocástico
    const stoch = calculateStochastic(highs, lows, closes, 14, 3, 3);
    const stochSignal = stoch.k < 20 ? 'bullish' : stoch.k > 80 ? 'bearish' : 'neutral';
    
    // 4. Detector de suelo
    const floor = detectFloor(closes);
    
    // 5. ¿Es microcap?
    const isMicroCap = marketCap < 100000000 && marketCap > 100000;
    const isSmallCap = marketCap < 1000000000 && marketCap > 100000000;
    
    // 6. Volumen (si hay)
    const volumes = ohlcData.map(c => c.volume);
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const currentVolume = volumes[volumes.length - 1] || 0;
    const volumeSpike = currentVolume > avgVolume * 1.5;
    
    // ===== PUNTUACIÓN (0-100) =====
    let score = 50;
    const details = [];
    
    // RSI: +15 si sobrevendido, -15 si sobrecomprado
    if (rsi < 30) {
        score += 15;
        details.push('✅ RSI sobrevendido');
    } else if (rsi > 70) {
        score -= 15;
        details.push('❌ RSI sobrecomprado');
    } else if (rsi < 45) {
        score += 5;
        details.push('📈 RSI en zona de compra');
    }
    
    // MACD: +10 si bullish
    if (macdSignal === 'bullish') {
        score += 10;
        details.push('✅ MACD alcista');
    } else if (macdSignal === 'bearish') {
        score -= 10;
        details.push('❌ MACD bajista');
    }
    
    // Estocástico: +10 si sobrevendido
    if (stoch.k < 20) {
        score += 10;
        details.push('✅ Estocástico sobrevendido');
    } else if (stoch.k > 80) {
        score -= 10;
        details.push('❌ Estocástico sobrecomprado');
    }
    
    // Suelo: +20 si está en suelo
    if (floor.isAtFloor) {
        score += 20;
        details.push(`✅ PRECIO EN SUELO (${floor.distance.toFixed(0)}% desde mínimo)`);
    } else if (floor.distance < 30) {
        score += 10;
        details.push(`📉 Cerca del suelo (${floor.distance.toFixed(0)}%)`);
    } else if (floor.distance > 70) {
        score -= 10;
        details.push('⚠️ Precio cerca de máximos');
    }
    
    // Microcap bonus
    if (isMicroCap) {
        score += 15;
        details.push('🚀 MICROCAP (alto potencial)');
    } else if (isSmallCap) {
        score += 5;
        details.push('📊 Small cap');
    }
    
    // Cambio 24h
    if (change24h < -5) {
        score += 10;
        details.push('📉 Caída fuerte - posible rebote');
    } else if (change24h > 15) {
        score -= 10;
        details.push('⚠️ Subida fuerte - posible corrección');
    }
    
    // Volumen
    if (volumeSpike) {
        score += 5;
        details.push('📊 Volumen anormal (atención)');
    }
    
    // Ajustar entre 0 y 100
    score = Math.min(100, Math.max(0, score));
    
    // ===== SEÑAL FINAL =====
    let signal, confidence;
    if (score >= 75) {
        signal = '🚀 COMPRA FUERTE';
        confidence = 'alta';
    } else if (score >= 60) {
        signal = '📈 COMPRA MODERADA';
        confidence = 'media-alta';
    } else if (score >= 45) {
        signal = '⏸️ NEUTRAL - ESPERAR';
        confidence = 'media';
    } else if (score >= 30) {
        signal = '📉 EVITAR - BAJISTA';
        confidence = 'media-baja';
    } else {
        signal = '⛔ NO ENTRAR';
        confidence = 'baja';
    }
    
    // Información adicional para el tooltip
    const priceInfo = {
        currentPrice: currentPrice,
        minPrice: floor.minPrice,
        maxPrice: floor.maxPrice,
        distanceFromFloor: floor.distance,
        marketCap: marketCap,
        rsi: rsi,
        stochK: stoch.k,
        macdTrend: macdSignal,
        change24h: change24h
    };
    
    return {
        signal,
        score: Math.round(score),
        confidence,
        details: details.slice(0, 5), // Máximo 5 detalles
        priceInfo,
        isMicroCap,
        isSmallCap
    };
}

// ============================================================
//  PROCESAR DATOS CON SEÑAL DE ENTRADA
// ============================================================
async function enrichWithSignals(marketData) {
    const enriched = {};
    
    for (const item of marketData) {
        const id = item.id;
        const ohlc = await fetchOHLC(id, CONFIG.TIMEFRAME);
        
        // Señal de entrada
        const signal = generateEntrySignal(id, item, ohlc);
        
        // Sparkline (para el mini gráfico)
        const sparkline = item.sparkline_in_7d?.price || [];
        
        enriched[id] = {
            ...item,
            signal,
            sparkline,
            ohlc: ohlc
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
                <h3>${filterFavoritesOnly ? 'No tienes favoritas ⭐' : 'Añade tu primera microcap 🚀'}</h3>
                <p style="color:#555577;margin-top:10px;">
                    ${filterFavoritesOnly ? 'Marca ⭐ en alguna tarjeta' : 'Busca microcaps y pulsa Añadir'}
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
            html += `<div class="crypto-card loading-card">
                <i class="fas fa-spinner fa-spin"></i> Cargando ${id}...
            </div>`;
            continue;
        }

        const isFav = favorites.has(id);
        const signal = data.signal || { signal: '⏳', score: 0, details: [] };
        const price = data.current_price || 0;
        const marketCap = data.market_cap || 0;
        const change24h = data.price_change_percentage_24h || 0;
        const changeClass = change24h >= 0 ? 'positive' : 'negative';
        const imgSrc = data.image || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png';

        // Color según señal
        let signalColor = '#ffcc00';
        let signalBg = 'rgba(255,204,0,0.1)';
        if (signal.signal.includes('COMPRA FUERTE')) {
            signalColor = '#00ff88';
            signalBg = 'rgba(0,255,136,0.15)';
        } else if (signal.signal.includes('COMPRA MODERADA')) {
            signalColor = '#44ddff';
            signalBg = 'rgba(68,221,255,0.12)';
        } else if (signal.signal.includes('EVITAR') || signal.signal.includes('NO ENTRAR')) {
            signalColor = '#ff4466';
            signalBg = 'rgba(255,68,102,0.12)';
        } else if (signal.signal.includes('NEUTRAL')) {
            signalColor = '#ffcc00';
            signalBg = 'rgba(255,204,0,0.08)';
        }

        // Formatear market cap
        let mcDisplay = '';
        if (marketCap >= 1e9) mcDisplay = `$${(marketCap / 1e9).toFixed(2)}B`;
        else if (marketCap >= 1e6) mcDisplay = `$${(marketCap / 1e6).toFixed(2)}M`;
        else mcDisplay = `$${marketCap.toLocaleString()}`;

        // Detalles de la señal (tooltip)
        const detailsHtml = signal.details && signal.details.length > 0
            ? signal.details.map(d => `<li style="font-size:0.75rem;padding:2px 0;color:#aaa;">${d}</li>`).join('')
            : '<li style="font-size:0.75rem;color:#666;">Sin datos suficientes</li>';

        // Mini sparkline (si existe)
        let sparkHtml = '';
        if (data.sparkline && data.sparkline.length > 0) {
            const min = Math.min(...data.sparkline);
            const max = Math.max(...data.sparkline);
            const range = max - min || 1;
            const points = data.sparkline.map((p, i) => {
                const x = (i / (data.sparkline.length - 1)) * 100;
                const y = 100 - ((p - min) / range) * 80 - 10;
                return `${x},${y}`;
            }).join(' ');
            const lastColor = data.sparkline[data.sparkline.length - 1] > data.sparkline[0] ? '#00ff88' : '#ff4466';
            sparkHtml = `
                <svg viewBox="0 0 100 40" style="width:100%;height:40px;margin-top:8px;">
                    <polyline points="${points}" fill="none" stroke="${lastColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }

        html += `
            <div class="crypto-card" data-id="${id}" style="border-color: ${signalColor}40;">
                <!-- Borde superior con color de señal -->
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg, ${signalColor}, ${signalColor}88);"></div>
                
                <div class="card-header">
                    <div class="name">
                        <img src="${imgSrc}" alt="${id}" loading="lazy" />
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

                <!-- SEÑAL PRINCIPAL - GRANDE Y CLARA -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 8px;">
                    <div style="font-size:1.6rem;font-weight:900;font-family:'Orbitron',sans-serif;color:${signalColor};text-shadow:0 0 30px ${signalColor}40;">
                        ${signal.signal || '⏳'}
                    </div>
                    <div style="background:${signalBg};padding:4px 14px;border-radius:20px;border:1px solid ${signalColor}40;">
                        <span style="font-weight:700;color:${signalColor};font-size:0.9rem;">${signal.score || 0}/100</span>
                    </div>
                </div>

                <!-- PRECIO -->
                <div class="price-main">
                    $${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                    <span class="usd">USD</span>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 10px;">
                    <div class="change-24h ${changeClass}" style="margin:0;">
                        ${change24h >= 0 ? '▲' : '▼'} ${Math.abs(change24h).toFixed(2)}% 24h
                    </div>
                    <div class="market-cap" style="margin:0;font-size:0.8rem;">
                        📊 ${mcDisplay}
                    </div>
                </div>

                <!-- DETALLES DE LA SEÑAL (desplegable con hover) -->
                <div style="position:relative;">
                    <div style="background:rgba(255,255,255,0.02);border-radius:12px;padding:10px 12px;border:1px solid rgba(255,255,255,0.04);cursor:pointer;" 
                         onclick="this.nextElementSibling.classList.toggle('show')">
                        <span style="color:#666;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">
                            <i class="fas fa-info-circle"></i> ¿Por qué esta señal?
                        </span>
                        <span style="float:right;color:#444;font-size:0.7rem;">▼</span>
                    </div>
                    <div style="display:none;background:rgba(0,0,0,0.4);border-radius:12px;padding:12px 14px;margin-top:4px;border:1px solid rgba(255,255,255,0.03);">
                        <ul style="list-style:none;padding:0;margin:0;">
                            ${detailsHtml}
                        </ul>
                        <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);font-size:0.65rem;color:#555;">
                            ⏱️ Temporalidad: ${CONFIG.TIMEFRAME} · Datos en tiempo real
                        </div>
                    </div>
                </div>

                ${sparkHtml}
            </div>
        `;
    }

    grid.innerHTML = html;

    // Eventos
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(this.dataset.id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeCrypto(this.dataset.id);
        });
    });
}

// ============================================================
//  ACTUALIZAR DATOS
// ============================================================
async function refreshAll() {
    if (isRefreshing) return;
    if (cryptos.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-plus-circle"></i><h3>Añade microcaps para empezar</h3></div>`;
        return;
    }

    isRefreshing = true;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando...';

    try {
        const marketData = await fetchCryptoData(cryptos);
        if (!marketData || Object.keys(marketData).length === 0) {
            throw new Error('No se obtuvieron datos');
        }

        const enriched = await enrichWithSignals(marketData);
        cryptoData = enriched;

        const now = new Date();
        lastUpdateEl.textContent = `⏱️ ${now.toLocaleTimeString()}`;

        renderCards();
    } catch (error) {
        console.error('Error:', error);
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
//  CRUD
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
        alert(`Máximo ${CONFIG.MAX_CRYPTOS} criptos`);
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
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-plus-circle"></i><h3>¡Añade tu primera microcap!</h3></div>`;
        cryptoCount.textContent = '0';
    }
}

function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveState();
    renderCards();
}

// ============================================================
//  AUTOCOMPLETADO
// ============================================================
let searchTimeout = null;
let allCoins = [];

async function loadCoinList() {
    try {
        const res = await fetch(`${CONFIG.COINGECKO_API}/coins/list`);
        if (res.ok) allCoins = await res.json();
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
            addCrypto(this.dataset.id);
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
        if (val) addCrypto(val);
    }
});

addBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) addCrypto(val);
});

refreshBtn.addEventListener('click', refreshAll);

favFilterBtn.addEventListener('click', function() {
    filterFavoritesOnly = !filterFavoritesOnly;
    this.classList.toggle('active');
    renderCards();
});

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

    if (cryptos.length > 0) {
        await refreshAll();
    } else {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-rocket"></i><h3>MicroCaps Hunter 🚀</h3><p style="color:#555577;">Añade microcaps con potencial arriba</p></div>`;
        cryptoCount.textContent = '0';
    }

    setInterval(refreshAll, CONFIG.REFRESH_INTERVAL);
}

init();

console.log('🚀 MicroCaps Hunter iniciado');
console.log(`📊 ${cryptos.length} criptos en seguimiento`);
console.log(`⏱️ Temporalidad: ${CONFIG.TIMEFRAME}`);
