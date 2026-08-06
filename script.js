// ============================================================
//  CONFIGURACIÓN
// ============================================================
const CONFIG = {
    // Sistemas disponibles (puedes añadir más aquí)
    SYSTEMS: [
        'PS3',
        'PS2',
        'PSP',
        'PS1',
        'NES',
        'SNES',
        'N64',
        'GAMEBOY',
        'GAMEBOY ADVANCE',
        'GAMEBOY COLOR',
        'SEGA GENESIS',
        'DREAMCAST',
        'SATURN',
        'NEOGEO',
        'ATARI 2600'
    ],
    // Tipos de contenido
    TYPES: ['ROM', 'Port', 'Homebrew', 'ISO', 'CHD'],
    // Ruta base para los archivos JSON
    DATA_PATH: 'data/'
};

// ============================================================
//  MAPEO DE SISTEMAS A NOMBRES DE CARPETA DE LIBRETRO
// ============================================================
const systemMap = {
    'PS3': 'Sony - PlayStation 3',
    'PS2': 'Sony - PlayStation 2',
    'PSP': 'Sony - PlayStation Portable',
    'PS1': 'Sony - PlayStation',
    'PSX': 'Sony - PlayStation',
    'NES': 'Nintendo - Nintendo Entertainment System',
    'SNES': 'Nintendo - Super Nintendo Entertainment System',
    'N64': 'Nintendo - Nintendo 64',
    'GAMEBOY': 'Nintendo - Game Boy',
    'GAMEBOY ADVANCE': 'Nintendo - Game Boy Advance',
    'GAMEBOY COLOR': 'Nintendo - Game Boy Color',
    'SEGA GENESIS': 'Sega - Mega Drive - Genesis',
    'DREAMCAST': 'Sega - Dreamcast',
    'SATURN': 'Sega - Saturn',
    'SEGA CD': 'Sega - Mega-CD - Sega CD',
    'SEGA 32X': 'Sega - 32X',
    'NEOGEO': 'SNK - Neo Geo',
    'NEOGEO CD': 'SNK - Neo Geo CD',
    'NEOGEO POCKET': 'SNK - Neo Geo Pocket',
    'ATARI 2600': 'Atari - 2600',
    'ATARI 7800': 'Atari - 7800',
    'ATARI LYNX': 'Atari - Lynx',
    'ATARI JAGUAR': 'Atari - Jaguar',
    '3DO': 'The 3DO Company - 3DO',
    'WONDERSWAN': 'Bandai - WonderSwan',
    'WONDERSWAN COLOR': 'Bandai - WonderSwan Color',
    'PC ENGINE': 'NEC - PC Engine - TurboGrafx 16',
    'PC ENGINE CD': 'NEC - PC Engine CD - TurboGrafx-CD',
    'MSX': 'Microsoft - MSX',
    'MSX2': 'Microsoft - MSX2',
    'XBOX': 'Microsoft - Xbox',
    'XBOX 360': 'Microsoft - Xbox 360',
    'AMIGA': 'Commodore - Amiga',
    'C64': 'Commodore - 64',
    'WII': 'Nintendo - Wii',
    'WII U': 'Nintendo - Wii U',
    'GAMECUBE': 'Nintendo - GameCube',
    'DS': 'Nintendo - Nintendo DS',
    '3DS': 'Nintendo - Nintendo 3DS',
    'VIRTUAL BOY': 'Nintendo - Virtual Boy',
    'MASTER SYSTEM': 'Sega - Master System - Mark III',
    'GAME GEAR': 'Sega - Game Gear',
    'SCUMMVM': 'ScummVM',
    'DOS': 'DOS',
    'MAME': 'MAME',
    'FBNEO': 'FBNeo - Arcade Games'
};

// ============================================================
//  FUNCIÓN PARA GENERAR URL DE PORTADA DESDE LIBRETRO
// ============================================================
function getCoverUrl(game) {
    const systemFolder = systemMap[game.sistema] || game.sistema || game.system;
    // Usar el título del juego (puede venir como titulo o title)
    const title = game.titulo || game.title || '';
    // Limpiar el nombre del juego para la URL
    const cleanTitle = title
        .replace(/[:\/\\*?"<>|]/g, '') // Eliminar caracteres inválidos
        .replace(/\s+/g, ' ') // Espacios normales
        .trim();
    
    // Si el juego tiene cover personalizado, usarlo
    if (game.cover && game.cover.startsWith('http')) {
        return game.cover;
    }
    
    // Si tiene cover en formato Libretro (ej: "covers/ps3/Last of Us.png")
    if (game.cover && game.cover.includes('covers/')) {
        // Intentar construir URL desde Libretro
        const fileName = game.cover.split('/').pop();
        const cleanFileName = fileName.replace('.png', '').replace('.webp', '');
        return `https://thumbnails.libretro.com/${systemFolder}/Named_Boxarts/${cleanFileName}.png`;
    }
    
    // Fallback: usar el título limpio
    return `https://thumbnails.libretro.com/${systemFolder}/Named_Boxarts/${cleanTitle}.png`;
}

// ============================================================
//  FUNCIÓN PARA OBTENER PORTADA CON FALLBACK
// ============================================================
function getCoverWithFallback(game) {
    const url = getCoverUrl(game);
    // Si el juego tiene una portada manual (URL directa)
    if (game.cover && game.cover.startsWith('http')) {
        return game.cover;
    }
    return url;
}

// ============================================================
//  CARGA DINÁMICA DE JUEGOS DESDE JSON
// ============================================================
let games = [];
let filteredGames = [];
let systems = [...CONFIG.SYSTEMS];
let currentSystem = 'all';
let searchQuery = '';
let isLoading = false;
let loadedSystems = new Set();

async function loadGamesFromSystem(system) {
    const systemKey = system.toLowerCase();
    const url = `${CONFIG.DATA_PATH}${systemKey}.json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`No se pudo cargar ${systemKey}.json`);
            return [];
        }
        const data = await response.json();
        
        // Asegurar que los juegos tengan el campo sistema
        if (data.juegos && Array.isArray(data.juegos)) {
            // Mapear los campos del JSON al formato interno
            return data.juegos.map(juego => ({
                id: juego.id || `${systemKey}-${juego.titulo?.toLowerCase().replace(/\s+/g, '-')}`,
                titulo: juego.titulo || juego.title || 'Sin título',
                title: juego.titulo || juego.title || 'Sin título', // Para compatibilidad
                sistema: data.sistema || system,
                system: data.sistema || system, // Para compatibilidad
                year: juego.año || juego.year || 0,
                genero: juego.genero || 'Desconocido',
                desarrolladora: juego.desarrolladora || 'Desconocida',
                descripcion: juego.descripcion || 'Sin descripción disponible',
                description: juego.descripcion || 'Sin descripción disponible',
                cover: juego.cover || '',
                downloads: [
                    { label: '🔵 Descarga Directa', url: juego.download || '#' },
                    { label: '🟢 Torrent', url: juego.torrent || '#' },
                    { label: '🟠 Magnet Link', url: juego.magnet || '#' }
                ]
            }));
        }
        return [];
    } catch (error) {
        console.error(`Error cargando ${systemKey}.json:`, error);
        return [];
    }
}

async function loadAllGames() {
    if (isLoading) return;
    isLoading = true;
    
    const allGames = [];
    const systemPromises = systems.map(system => loadGamesFromSystem(system));
    
    try {
        const results = await Promise.all(systemPromises);
        results.forEach((gamesList, index) => {
            if (gamesList.length > 0) {
                allGames.push(...gamesList);
                loadedSystems.add(systems[index]);
            }
        });
        
        games = allGames;
        console.log(`✅ Cargados ${games.length} juegos de ${loadedSystems.size} sistemas`);
        return games;
    } catch (error) {
        console.error('Error cargando juegos:', error);
        return [];
    } finally {
        isLoading = false;
    }
}

// ============================================================
//  ESTADO
// ============================================================
let favoriteGames = new Set();

// ============================================================
//  DOM REFS
// ============================================================
const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const systemSelect = document.getElementById('systemSelect');
const systemChips = document.getElementById('systemChips');
const addSystemBtn = document.getElementById('addSystemBtn');
const refreshBtn = document.getElementById('refreshBtn');
const gameCount = document.getElementById('gameCount');
const suggestionsEl = document.getElementById('suggestions');
const modal = document.getElementById('gameModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.querySelector('.modal-close');

// ============================================================
//  INICIALIZAR SISTEMAS
// ============================================================
function initSystems() {
    // Cargar sistemas guardados
    try {
        const saved = localStorage.getItem('gameSystems');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) {
                systems = parsed;
            }
        }
    } catch (e) {}

    updateSystemSelect();
    renderSystemChips();
}

function saveSystems() {
    localStorage.setItem('gameSystems', JSON.stringify(systems));
}

function updateSystemSelect() {
    const currentVal = systemSelect.value;
    systemSelect.innerHTML = '<option value="all">🎮 Todos los sistemas</option>';
    systems.sort().forEach(sys => {
        const opt = document.createElement('option');
        opt.value = sys;
        opt.textContent = sys;
        systemSelect.appendChild(opt);
    });
    if (currentVal && systems.includes(currentVal)) {
        systemSelect.value = currentVal;
    } else {
        systemSelect.value = 'all';
        currentSystem = 'all';
    }
}

function renderSystemChips() {
    systemChips.innerHTML = '';
    systems.sort().forEach(sys => {
        const isLoaded = loadedSystems.has(sys);
        const chip = document.createElement('span');
        chip.className = `system-chip ${currentSystem === sys ? 'active' : ''} ${!isLoaded ? 'loading' : ''}`;
        chip.dataset.system = sys;
        chip.innerHTML = `
            ${sys}
            ${!isLoaded ? ' ⏳' : ''}
            <span class="delete-chip" data-system="${sys}">✕</span>
        `;
        chip.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-chip')) return;
            currentSystem = this.dataset.system || sys;
            systemSelect.value = currentSystem;
            renderSystemChips();
            filterGames();
        });
        chip.querySelector('.delete-chip').addEventListener('click', function(e) {
            e.stopPropagation();
            const sys = this.dataset.system;
            removeSystem(sys);
        });
        systemChips.appendChild(chip);
    });
}

// ============================================================
//  AÑADIR / ELIMINAR SISTEMAS
// ============================================================
function addSystem() {
    const newSystem = prompt('🎮 Introduce el nombre del nuevo sistema (ej: SEGA SATURN):');
    if (!newSystem || newSystem.trim() === '') return;
    const sys = newSystem.trim().toUpperCase();
    if (systems.includes(sys)) {
        alert(`El sistema "${sys}" ya existe.`);
        return;
    }
    systems.push(sys);
    saveSystems();
    initSystems();
    systemSelect.value = sys;
    currentSystem = sys;
    renderSystemChips();
    // Recargar juegos incluyendo el nuevo sistema
    loadAllGames().then(() => {
        filterGames();
        renderSystemChips();
    });
}

function removeSystem(sys) {
    if (systems.length <= 1) {
        alert('⚠️ Debes tener al menos un sistema.');
        return;
    }
    if (!confirm(`¿Eliminar sistema "${sys}" y sus juegos?`)) return;
    systems = systems.filter(s => s !== sys);
    loadedSystems.delete(sys);
    saveSystems();
    if (currentSystem === sys) {
        currentSystem = 'all';
        systemSelect.value = 'all';
    }
    // Recargar juegos sin el sistema eliminado
    games = games.filter(g => g.sistema !== sys && g.system !== sys);
    initSystems();
    filterGames();
}

// ============================================================
//  FILTRAR JUEGOS
// ============================================================
function filterGames() {
    const query = searchQuery.toLowerCase().trim();
    const system = currentSystem;

    filteredGames = games.filter(game => {
        if (system !== 'all' && game.sistema !== system && game.system !== system) return false;
        if (query) {
            const title = (game.titulo || game.title || '').toLowerCase();
            const systemName = (game.sistema || game.system || '').toLowerCase();
            const desc = (game.descripcion || game.description || '').toLowerCase();
            const matchTitle = title.includes(query);
            const matchSystem = systemName.includes(query);
            const matchDesc = desc.includes(query);
            if (!matchTitle && !matchSystem && !matchDesc) return false;
        }
        return true;
    });

    renderGames();
    updateCount();
}

// ============================================================
//  RENDERIZAR JUEGOS
// ============================================================
function renderGames() {
    if (isLoading) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Cargando juegos...</h3>
                <p style="color:#555577;">Espera mientras se cargan los datos</p>
            </div>
        `;
        return;
    }

    if (filteredGames.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gamepad"></i>
                <h3>${games.length === 0 ? '📂 No hay juegos cargados' : 'No hay juegos que coincidan'}</h3>
                <p style="color:#555577;margin-top:10px;">
                    ${games.length === 0 
                        ? 'Asegúrate de tener archivos JSON en la carpeta data/ con los juegos' 
                        : searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'Selecciona otro sistema o busca otro juego'}
                </p>
                ${games.length === 0 ? `
                    <div style="margin-top:20px;background:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
                        <p style="color:#888;font-size:0.85rem;">
                            📁 Crea archivos JSON en la carpeta <code style="background:rgba(0,204,255,0.1);padding:2px 8px;border-radius:4px;color:#00ccff;">data/</code> 
                            con el formato <code style="background:rgba(255,0,102,0.1);padding:2px 8px;border-radius:4px;color:#ff0066;">ps3.json</code>
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
        return;
    }

    let html = '';
    for (const game of filteredGames) {
        const systemName = game.sistema || game.system || 'Desconocido';
        const systemColor = getSystemColor(systemName);
        const coverUrl = getCoverWithFallback(game);
        const title = game.titulo || game.title || 'Sin título';
        const year = game.year || game.año || 'N/A';
        const type = game.type || 'ROM';
        const gameId = game.id || `game-${Math.random().toString(36).substr(2, 9)}`;
        
        html += `
            <div class="crypto-card" data-id="${gameId}" onclick="openModal('${gameId}')">
                <div class="card-image">
                    <img src="${coverUrl}" 
                         alt="${title}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400/1a1a2e/00ccff?text=${encodeURIComponent(title)}';" />
                    <span class="system-badge" style="border-color:${systemColor};color:${systemColor};">${systemName}</span>
                </div>
                <div class="card-body">
                    <h3>${title}</h3>
                    <div class="card-meta">
                        <span class="year">📅 ${year}</span>
                        <span class="type">${type}</span>
                    </div>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function updateCount() {
    gameCount.textContent = `${filteredGames.length} juegos`;
}

// ============================================================
//  COLORES POR SISTEMA
// ============================================================
function getSystemColor(system) {
    const colors = {
        'PS3': '#00ccff',
        'PS2': '#ff0066',
        'PSP': '#ffcc00',
        'PS1': '#66ff66',
        'PSX': '#66ff66',
        'NES': '#ff4444',
        'SNES': '#ff66ff',
        'N64': '#ff8800',
        'GAMEBOY': '#88ff88',
        'GAMEBOY ADVANCE': '#44ddff',
        'GAMEBOY COLOR': '#88dd88',
        'SEGA GENESIS': '#ff44ff',
        'DREAMCAST': '#ffcc44',
        'SATURN': '#ff4488',
        'SEGA CD': '#ff8844',
        'SEGA 32X': '#ff44aa',
        'NEOGEO': '#ffaa00',
        'NEOGEO CD': '#ffaa44',
        'NEOGEO POCKET': '#ffaa88',
        'ATARI 2600': '#ff6644',
        'ATARI 7800': '#ff6644',
        'ATARI LYNX': '#ff8844',
        'ATARI JAGUAR': '#ff6644',
        '3DO': '#44ff88',
        'WONDERSWAN': '#66ccff',
        'WONDERSWAN COLOR': '#66ccff',
        'PC ENGINE': '#ff44cc',
        'PC ENGINE CD': '#ff44cc',
        'MSX': '#44aaff',
        'MSX2': '#44aaff',
        'XBOX': '#44ff44',
        'XBOX 360': '#44ff44',
        'AMIGA': '#ff8844',
        'C64': '#8888ff',
        'WII': '#88ddff',
        'WII U': '#88ddff',
        'GAMECUBE': '#44dd88',
        'DS': '#88ccff',
        '3DS': '#88ccff',
        'VIRTUAL BOY': '#ff4488',
        'MASTER SYSTEM': '#ff66cc',
        'GAME GEAR': '#ff66cc',
        'SCUMMVM': '#66ff88',
        'DOS': '#888888',
        'MAME': '#ffaa44',
        'FBNEO': '#ffaa44'
    };
    return colors[system] || '#00ccff';
}

// ============================================================
//  MODAL DE DETALLE
// ============================================================
function openModal(id) {
    const game = games.find(g => (g.id || `game-${Math.random().toString(36).substr(2, 9)}`) === id);
    if (!game) return;

    const systemName = game.sistema || game.system || 'Desconocido';
    const systemColor = getSystemColor(systemName);
    const coverUrl = getCoverWithFallback(game);
    const title = game.titulo || game.title || 'Sin título';
    const year = game.year || game.año || 'N/A';
    const type = game.type || 'ROM';
    const description = game.descripcion || game.description || 'Sin descripción disponible.';
    const downloads = game.downloads || [
        { label: '🔵 Descarga Directa', url: '#' },
        { label: '🟢 Torrent', url: '#' },
        { label: '🟠 Magnet Link', url: '#' }
    ];

    modalBody.innerHTML = `
        <div class="modal-top">
            <div class="modal-cover">
                <img src="${coverUrl}" 
                     alt="${title}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x400/1a1a2e/ff0066?text=${encodeURIComponent(title)}';" />
            </div>
            <div class="modal-info">
                <h2>${title}</h2>
                <div class="modal-system" style="border-color:${systemColor};color:${systemColor};">${systemName}</div>
                <div class="modal-year">📅 ${year}</div>
                <div class="modal-type">${type}</div>
                ${game.genero ? `<div style="color:#888;font-size:0.85rem;">🎮 ${game.genero}</div>` : ''}
                ${game.desarrolladora ? `<div style="color:#888;font-size:0.85rem;">👨‍💻 ${game.desarrolladora}</div>` : ''}
                <div class="modal-description">${description}</div>
            </div>
        </div>
        <div class="download-buttons">
            ${downloads.map((dl, i) => `
                <a href="${dl.url || '#'}" target="_blank" class="btn-download ${i === 0 ? 'primary' : i === 1 ? 'secondary' : 'tertiary'}">
                    <i class="fas fa-download"></i> ${dl.label}
                </a>
            `).join('')}
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Eventos del modal
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// ============================================================
//  BÚSQUEDA Y SUGERENCIAS
// ============================================================
let searchTimeout = null;

searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const val = this.value.trim();
    searchQuery = val;
    if (val.length > 0) {
        searchTimeout = setTimeout(() => showSuggestions(val), 300);
    } else {
        suggestionsEl.classList.remove('show');
        filterGames();
    }
});

searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        suggestionsEl.classList.remove('show');
        filterGames();
    }
});

searchBtn.addEventListener('click', function() {
    searchQuery = searchInput.value.trim();
    suggestionsEl.classList.remove('show');
    filterGames();
});

function showSuggestions(query) {
    const q = query.toLowerCase();
    const matches = games
        .filter(g => {
            const title = (g.titulo || g.title || '').toLowerCase();
            const system = (g.sistema || g.system || '').toLowerCase();
            return title.includes(q) || system.includes(q);
        })
        .slice(0, 8);

    if (matches.length === 0) {
        suggestionsEl.classList.remove('show');
        return;
    }

    suggestionsEl.innerHTML = matches.map(g => {
        const title = g.titulo || g.title || 'Sin título';
        const system = g.sistema || g.system || 'Desconocido';
        const cover = getCoverWithFallback(g);
        return `
            <div data-id="${g.id || 'game-' + Math.random().toString(36).substr(2, 9)}">
                <img src="${cover}" 
                     alt="${title}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/32x32/1a1a2e/00ccff?text=?';" />
                <span><strong>${title}</strong> <span style="color:#666;font-size:0.8rem;">${system}</span></span>
            </div>
        `;
    }).join('');
    suggestionsEl.classList.add('show');

    suggestionsEl.querySelectorAll('div').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            const game = games.find(g => (g.id || `game-${Math.random().toString(36).substr(2, 9)}`) === id);
            if (game) {
                const title = game.titulo || game.title || '';
                searchInput.value = title;
                searchQuery = title;
                suggestionsEl.classList.remove('show');
                filterGames();
                openModal(id);
            }
        });
    });
}

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrapper') && !e.target.closest('.suggestions')) {
        suggestionsEl.classList.remove('show');
    }
});

// ============================================================
//  FILTRO POR SISTEMA
// ============================================================
systemSelect.addEventListener('change', function() {
    currentSystem = this.value;
    renderSystemChips();
    filterGames();
});

// ============================================================
//  REFRESH / RESET
// ============================================================
refreshBtn.addEventListener('click', function() {
    searchInput.value = '';
    searchQuery = '';
    currentSystem = 'all';
    systemSelect.value = 'all';
    suggestionsEl.classList.remove('show');
    renderSystemChips();
    filterGames();
});

// ============================================================
//  AÑADIR SISTEMA
// ============================================================
addSystemBtn.addEventListener('click', addSystem);

// ============================================================
//  INICIO
// ============================================================
async function init() {
    initSystems();
    await loadAllGames();
    filterGames();
    renderSystemChips();
    
    // Añadir la función openModal al ámbito global
    window.openModal = openModal;

    console.log('🎮 Retro Game Vault cargado');
    console.log(`📚 ${games.length} juegos en la librería`);
    console.log(`🕹️ ${systems.length} sistemas disponibles`);
    console.log(`📂 Cargados: ${[...loadedSystems].join(', ')}`);
    console.log(`🖼️ Portadas desde: https://thumbnails.libretro.com/`);
}

init();
