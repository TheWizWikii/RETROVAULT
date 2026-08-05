# Altcoin Opportunity Radar — Versión final local

Dashboard personal estático para GitHub Pages.

## Incluye

- Indicador visual de Miedo y Codicia con histórico.
- Precio y variación de Bitcoin.
- Dos carteras separadas: **largo plazo** y **spot rápido/scalping**.
- Alta, edición y borrado manual de posiciones.
- Actualización automática de precio, valor y PnL mediante CoinGecko.
- Presupuesto configurable para spot rápido.
- Radar de microcaps conocidas con score orientativo.
- Watchlist editable.
- Diario de operaciones.
- Exportación/importación de copia de seguridad.

## Publicar en GitHub Pages

1. Sube todos los archivos a la raíz del repositorio.
2. En GitHub abre **Settings → Pages**.
3. En **Source**, selecciona **Deploy from a branch**.
4. Elige `main` y `/ (root)`.
5. Guarda. La URL será:
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`

## Datos y privacidad

Las carteras, la watchlist y el diario se guardan en `localStorage`, es decir, únicamente en el navegador actual. Usa **Ajustes → Exportar datos** para crear copias.

La web utiliza endpoints públicos de CoinGecko y Alternative.me. CoinGecko puede limitar las peticiones sin una clave Demo. Puedes introducir una clave Demo en Ajustes; no uses una clave Pro en una página pública.

## Importante

El score del radar es un filtro matemático simple y no asesoramiento financiero. Una web estática no puede obtener datos premium de Coinglass, spot flow, funding o token unlocks sin una API autorizada y un backend que proteja las claves.

## Versión 2.3
- Fallback de BTC actual: CoinGecko → Binance → caché local.
- Histórico BTC: CoinGecko → Binance → caché local.
- Fear & Greed: Alternative.me → caché local.
- El gráfico muestra la fuente activa, líneas más finas y barras laterales por zonas de sentimiento.
- CoinGlass no se conecta directamente desde GitHub Pages porque su clave quedaría expuesta; se puede añadir después mediante un proxy seguro.


## v2.4 — precisión Kraken
- Cantidades y precios con hasta 10 decimales.
- Admite formatos 26423.6846, 26.423,6846 y 26,423.6846.
- Las cantidades ya no se abrevian en la cartera.


## Alertas de objetivos
Activa las notificaciones desde la sección Spot rápido. La app avisa cuando el precio actual alcanza el porcentaje objetivo. En una web estática de GitHub Pages las alertas funcionan mientras la página esté abierta; las alertas con la web cerrada requerirían un backend y notificaciones push.


## Copias de seguridad completas

- **Exportar TODO** descarga un JSON versionado con carteras, watchlist, diario, presupuesto, objetivos y ajustes locales.
- **Importar TODO** restaura ese archivo en cualquier navegador u ordenador.
- Antes de cada importación se crea automáticamente una copia de seguridad interna. Puedes recuperarla desde **Ajustes → Restaurar copia anterior**.
- No utiliza Supabase, Firebase, login ni servidor. Todo se guarda en `localStorage`.
- Sustituir los archivos de GitHub no borra tus datos mientras mantengas la misma URL y no borres los datos del navegador.
