
# 🎮 Retro Game Vault

Gestor de ROMs, Ports y Homebrew con estilo cyberpunk/neon.
https://thewizwikii.github.io/RETROVAULT/

## ✨ Características

- 📚 **Librería de juegos** con portadas, sistema y año
- 🔍 **Búsqueda** por nombre, sistema o descripción
- 🕹️ **Filtro por sistema** con chips seleccionables
- ➕ **Añadir sistemas** fácilmente (se guardan en localStorage)
- 🖼️ **Modal con detalles** del juego (portada grande, descripción, año)
- ⬇️ **3 botones de descarga** alternativos por juego
- 🎨 **Diseño neon retro-futurista**

## 📦 Instalación

1. Descarga los archivos
2. Sube a GitHub Pages o cualquier hosting
3. ¡Listo! No necesita backend

## 🎯 Cómo añadir juegos

Abre `script.js` y busca `GAME_LIBRARY`. Añade un nuevo objeto:

```javascript
{
    id: 'tu-juego',              // Identificador único
    title: 'Mi Juego',
    system: 'PS3',               // Debe existir en SYSTEMS
    type: 'ROM',                 // ROM, Port, Homebrew, ISO, CHD
    year: 2024,
    description: 'Descripción del juego...',
    cover: 'https://...',        // URL de la portada
    downloads: [
        { label: 'Descarga 1 (Mega)', url: '#' },
        { label: 'Descarga 2 (MediaFire)', url: '#' },
        { label: 'Descarga 3 (Google Drive)', url: '#' }
    ]
}
