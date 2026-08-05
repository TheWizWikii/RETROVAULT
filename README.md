# Altcoin Opportunity Radar V3

Dashboard estático para GitHub Pages con:

- cartera spot a largo plazo;
- cartera spot rápido / scalping;
- cantidades y precios medios exactos;
- PnL actualizado con datos de mercado;
- objetivos y notificaciones mientras la página está abierta;
- watchlist, radar y diario;
- índice de miedo y codicia;
- copia local automática;
- cuenta y sincronización privada mediante Supabase.

## 1. Conserva tus monedas actuales

Antes de sustituir los archivos, pulsa **Ajustes → Exportar datos** en la versión actual. La V3 usa las mismas claves de `localStorage`, así que tus datos deberían continuar en el mismo navegador y dominio, pero el backup evita cualquier riesgo.

## 2. Crear el proyecto de Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor**.
3. Copia y ejecuta el contenido completo de `supabase-setup.sql`.
4. Abre la configuración/API del proyecto y copia:
   - **Project URL**;
   - **Publishable key** o **anon public key**.
5. Edita `config.js`:

```js
supabase: {
  url: "https://TU-PROYECTO.supabase.co",
  publishableKey: "TU_CLAVE_PUBLICABLE"
},
```

No uses ni publiques la clave `service_role`.

## 3. Configurar autenticación

En Supabase, abre **Authentication → URL Configuration**.

- Site URL: `https://thewizwikii.github.io/altcoin-opportunity-radar/`
- Redirect URLs: añade la misma dirección.

En **Authentication → Providers → Email**, puedes mantener activada la confirmación por correo. Si está activada, el usuario deberá confirmar el email antes del primer inicio de sesión.

## 4. Subir a GitHub

Sustituye todos los archivos de la raíz de tu repositorio por los de esta carpeta:

- `index.html`
- `styles.css`
- `app.js`
- `cloud.js`
- `config.js`
- `supabase-setup.sql`
- `README.md`
- `.gitignore`

Tu web seguirá en:

`https://thewizwikii.github.io/altcoin-opportunity-radar/`

Espera al despliegue y recarga con `Ctrl + F5`.

## 5. Primera sincronización

1. Abre la web en el navegador donde ya tienes tu cartera.
2. Pulsa **Iniciar sesión**.
3. Crea una cuenta o entra con una existente.
4. Si la cuenta no tiene datos en la nube, la aplicación subirá automáticamente la copia local actual.
5. Después, cada cambio relevante se guarda localmente y se sincroniza con Supabase tras una breve espera.

## Evitar sobrescribir datos

- **Descargar desde nube** reemplaza el estado local por la última copia de Supabase.
- **Subir copia local** reemplaza la copia de Supabase por lo que aparece en ese navegador.
- Antes de una operación importante, usa **Ajustes → Exportar datos**.

## Seguridad

El archivo SQL activa Row Level Security y crea políticas para que cada usuario solo pueda leer, insertar, actualizar y borrar su propia fila. La clave publicable se usa en el navegador; la clave `service_role` nunca debe aparecer en GitHub.

## Funcionamiento sin Supabase

Si no configuras Supabase, la aplicación sigue funcionando con `localStorage`, exportación e importación manual. El indicador superior mostrará **Solo local**.
