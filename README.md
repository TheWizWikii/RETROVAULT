# ⚡ CryptoNeon Dashboard

Dashboard de criptomonedas con estilo cyberpunk/neon, indicadores técnicos (RSI, MACD, Estocástico) y puntuación de entrada.

## 🚀 Características

- Añadir/eliminar criptos con búsqueda y autocompletado
- Marcar favoritas para scalp rápido
- Información: precio, market cap, cambio 24h
- Indicadores: RSI, MACD, Estocástico
- Puntuación de entrada potencial (0-10)
- Actualización automática cada 60 segundos
- Diseño neon moderno con efectos glow
- Datos en tiempo real vía CoinGecko (sin API key)

## 📦 Instalación

1. Clona o descarga los archivos
2. Sube a GitHub Pages o cualquier hosting estático
3. ¡Listo! No necesita backend ni dependencias

## 🔧 Personalización

- Cambia `DEFAULT_CRYPTOS` en `script.js` para tus criptos por defecto
- Ajusta `REFRESH_INTERVAL` (en milisegundos)
- Modifica colores en `style.css` para cambiar el tema

## 📊 APIs utilizadas

- [CoinGecko API](https://www.coingecko.com/en/api) - gratuita, sin key

## 📝 Notas

- Los indicadores se calculan en el frontend con velas de 30 días
- La puntuación de entrada es orientativa, combina RSI, MACD, estocástico y cambio 24h
- Los datos se guardan en `localStorage` de tu navegador

---

Hecho con ❤️ y mucho neón