# Altcoin Opportunity Radar

Dashboard estático orientado a:

- detectar altcoins conocidas con capitalización baja/media y volumen suficiente;
- gestionar una watchlist personal;
- controlar cartera de largo plazo y un bloque de spot rápido;
- mostrar el Crypto Fear & Greed Index;
- llevar un diario de operaciones;
- exportar e importar copias de seguridad.

## CoinGecko

La aplicación intenta usar los endpoints de mercado de CoinGecko. Si recibes errores de límite de uso:

1. crea una clave gratuita Demo de CoinGecko;
2. abre **Ajustes** en el dashboard;
3. pega la clave Demo.

La clave se guarda en `localStorage`. No uses una clave Pro o sensible en una web pública, porque el código que corre en el navegador es visible.

## Personalizar monedas

Edita `config.js`:

- `defaultWatchlist`: monedas que aparecen al abrir la web por primera vez;
- `knownUniverse`: universo de monedas que puede analizar el scanner;
- `defaultPortfolio`: posiciones iniciales.

Usa IDs de CoinGecko, no necesariamente el ticker. Ejemplos:

- `storj`
- `bonk`
- `vanar-chain`
- `portal-2`
- `zeta-chain`

## Datos y privacidad

La cartera, watchlist, diario y ajustes se guardan únicamente en el navegador mediante `localStorage`. Usa el botón **Exportar datos** para crear copias de seguridad y poder mover la configuración a otro dispositivo.

## Limitaciones

- Es un radar heurístico, no un sistema de trading automático.
- El volumen global de CoinGecko no equivale necesariamente a volumen spot puro.
- CoinGecko y Alternative.me pueden imponer límites o cambiar sus APIs.
- GitHub Pages es estático; para alertas privadas, sincronización entre dispositivos o APIs con claves secretas hace falta un backend o una función serverless.

## Aviso

Uso educativo. Las criptomonedas de baja capitalización pueden sufrir pérdidas rápidas y problemas de liquidez.
