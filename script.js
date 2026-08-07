// ============================================================
//  CONFIGURACIÓN
// ============================================================
const CONFIG = {
    SYSTEMS: [
        'PS3', 'PS2', 'PSP', 'PS1', 'NES', 'SNES', 'N64',
        'GAMEBOY', 'GAMEBOY ADVANCE', 'GAMEBOY COLOR',
        'SEGA GENESIS', 'DREAMCAST', 'SATURN'
    ],
    DATA_PATH: 'data/'
};

// ============================================================
//  MAPEO DE SISTEMAS A LIBRETRO
// ============================================================
const systemMap = {
    'PS3': 'Sony - PlayStation 3',
    'PS2': 'Sony - PlayStation 2',
    'PSP': 'Sony - PlayStation Portable',
    'PS1': 'Sony - PlayStation',
    'NES': 'Nintendo - Nintendo Entertainment System',
    'SNES': 'Nintendo - Super Nintendo Entertainment System',
    'N64': 'Nintendo - Nintendo 64',
    'GAMEBOY': 'Nintendo - Game Boy',
    'GAMEBOY ADVANCE': 'Nintendo - Game Boy Advance',
    'GAMEBOY COLOR': 'Nintendo - Game Boy Color',
    'SEGA GENESIS': 'Sega - Mega Drive - Genesis',
    'DREAMCAST': 'Sega - Dreamcast',
    'SATURN': 'Sega - Saturn'
};

// ============================================================
//  FUNCIÓN PARA PORTADAS (SOPORTE TOTAL)
// ============================================================
function getCoverUrl(game) {
    const systemName = game.sistema || game.system || '';
    const systemFolder = systemMap[systemName] || systemName;
    const systemKey = systemName.toLowerCase();
    
    // ============================================
    // 1. URL PERSONALIZADA (completa)
    // ============================================
    if (game.cover && game.cover.startsWith('http')) {
        return game.cover;
    }
    
    // ============================================
    // 2. RUTA LOCAL COMPLETA (covers/ps3/nombre.png)
    // ============================================
    if (game.cover && game.cover.startsWith('covers/')) {
        return game.cover;
    }
    
    // ============================================
    // 3. NOMBRE DE ARCHIVO (solo el nombre.png)
    //    Busca en covers/[sistema]/nombre.png
    // ============================================
    if (game.cover && (game.cover.endsWith('.png') || game.cover.endsWith('.webp'))) {
        return `covers/${systemKey}/${game.cover}`;
    }
    
    // ============================================
    // 4. FALLBACK: LIBRETRO AUTOMÁTICO
    //    Usa el título del juego
    // ============================================
    const title = game.titulo || game.title || '';
    const cleanTitle = title.replace(/[:\/\\*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
    return `https://thumbnails.libretro.com/${encodeURIComponent(systemFolder)}/Named_Boxarts/${encodeURIComponent(cleanTitle)}.png`;
}

function getCoverWithFallback(game) {
    // Si tiene cover personalizado, devolverlo directamente
    if (game.cover && (game.cover.startsWith('http') || game.cover.startsWith('covers/'))) {
        return game.cover;
    }
    return getCoverUrl(game);
}

// ============================================================
//  CARGA DE JUEGOS
// ============================================================
let games = [];
let filteredGames = [];
let systems = [];
let currentSystem = 'all';
let searchQuery = '';
let isLoading = false;
let loadedSystems = new Set();

async function loadGamesFromSystem(system) {
    const systemKey = system.toLowerCase();
    const url = `${CONFIG.DATA_PATH}${systemKey}.json?t=${Date.now()}`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (!response.ok) {
            console.warn(`⚠️ No se pudo cargar ${systemKey}.json`);
            return [];
        }
        const data = await response.json();
        
        if (data.juegos && Array.isArray(data.juegos)) {
            return data.juegos.map(juego => ({
                id: juego.id || `${systemKey}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                titulo: juego.titulo || juego.title || 'Sin título',
                title: juego.titulo || juego.title || 'Sin título',
                sistema: data.sistema || system,
                system: data.sistema || system,
                year: juego.año || juego.year || 0,
                genero: juego.genero || 'Desconocido',
                desarrolladora: juego.desarrolladora || 'Desconocida',
                descripcion: juego.descripcion || 'Sin descripción disponible',
                description: juego.descripcion || 'Sin descripción disponible',
                cover: juego.cover || '',
                type: juego.type || 'ROM',
                downloads: [
                    { label: '🔵 Descarga Directa', url: juego.download || '#' },
                    { label: '🟢 Torrent', url: juego.torrent || '#' },
                    { label: '🟠 Magnet Link', url: juego.magnet || '#' }
                ]
            }));
        }
        return [];
    } catch (error) {
        console.error(`❌ Error cargando ${systemKey}.json:`, error);
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
        console.error('❌ Error cargando juegos:', error);
        return [];
    } finally {
        isLoading = false;
    }
}

// ============================================================
//  DOM REFS
// ============================================================
const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const systemSelect = document.getElementById('systemSelect');
const systemChips = document.getElementById('systemChips');
const addSystemSettingsBtn = document.getElementById('addSystemSettingsBtn');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.getElementById('settingsClose');
const systemList = document.getElementById('systemList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const gameCount = document.getElementById('gameCount');
const suggestionsEl = document.getElementById('suggestions');
const modal = document.getElementById('gameModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.querySelector('.modal-close');

// ============================================================
//  SISTEMAS
// ============================================================
function loadSystems() {
    try {
        const saved = localStorage.getItem('gameSystems');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) {
                systems = parsed;
                return;
            }
        }
    } catch (e) {}
    systems = [...CONFIG.SYSTEMS];
    saveSystems();
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
        chip.className = `system-chip ${currentSystem === sys ? 'active' : ''}`;
        chip.dataset.system = sys;
        chip.textContent = isLoaded ? sys : `${sys} ⏳`;
        chip.addEventListener('click', function() {
            currentSystem = this.dataset.system;
            systemSelect.value = currentSystem;
            renderSystemChips();
            filterGames();
        });
        systemChips.appendChild(chip);
    });
}

function renderSystemList() {
    systemList.innerHTML = '';
    systems.sort().forEach(sys => {
        const item = document.createElement('div');
        item.className = 'system-list-item';
        item.innerHTML = `
            ${sys}
            <span class="delete-system" data-system="${sys}">✕</span>
        `;
        item.querySelector('.delete-system').addEventListener('click', function() {
            removeSystem(this.dataset.system);
        });
        systemList.appendChild(item);
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
        alert(`⚠️ El sistema "${sys}" ya existe.`);
        return;
    }
    systems.push(sys);
    saveSystems();
    updateSystemSelect();
    renderSystemChips();
    renderSystemList();
    loadAllGames().then(() => {
        filterGames();
        renderSystemChips();
        updateGameCount();
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
    games = games.filter(g => g.sistema !== sys && g.system !== sys);
    updateSystemSelect();
    renderSystemChips();
    renderSystemList();
    filterGames();
    updateGameCount();
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
            if (!title.includes(query) && !systemName.includes(query) && !desc.includes(query)) return false;
        }
        return true;
    });

    renderGames();
    updateGameCount();
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
                        ? 'Asegúrate de tener archivos JSON en la carpeta data/' 
                        : searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'Selecciona otro sistema o busca otro juego'}
                </p>
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
            <div class="crypto-card" data-game-id="${gameId}">
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

    document.querySelectorAll('.crypto-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            if (gameId) {
                openModal(gameId);
            }
        });
    });
}

function updateGameCount() {
    gameCount.textContent = `${filteredGames.length} juegos`;
}

// ============================================================
//  COLORES POR SISTEMA
// ============================================================
function getSystemColor(system) {
    const colors = {
        'PS3': '#00ccff', 'PS2': '#ff0066', 'PSP': '#ffcc00',
        'PS1': '#66ff66', 'NES': '#ff4444', 'SNES': '#ff66ff',
        'N64': '#ff8800', 'GAMEBOY': '#88ff88',
        'GAMEBOY ADVANCE': '#44ddff', 'GAMEBOY COLOR': '#88dd88',
        'SEGA GENESIS': '#ff44ff', 'DREAMCAST': '#ffcc44',
        'SATURN': '#ff4488'
    };
    return colors[system] || '#00ccff';
}

// ============================================================
//  MODAL DE DETALLE
// ============================================================
function openModal(id) {
    const game = games.find(g => (g.id || '').toString() === id.toString());
    if (!game) {
        console.warn('Juego no encontrado:', id);
        return;
    }

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
                ${game.genero ? `<div style="color:#888;font-size:0.85rem;margin-top:4px;">🎮 ${game.genero}</div>` : ''}
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

// ============================================================
//  EVENTOS MODAL
// ============================================================
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// ============================================================
//  MODAL DE AJUSTES
// ============================================================
settingsBtn.addEventListener('click', function() {
    renderSystemList();
    settingsModal.classList.add('show');
    document.body.style.overflow = 'hidden';
});

settingsClose.addEventListener('click', function() {
    settingsModal.classList.remove('show');
    document.body.style.overflow = '';
});

settingsModal.addEventListener('click', function(e) {
    if (e.target === this) {
        settingsModal.classList.remove('show');
        document.body.style.overflow = '';
    }
});

addSystemSettingsBtn.addEventListener('click', addSystem);

// ============================================================
//  BACKUP
// ============================================================
function exportBackup() {
    const data = {
        systems: systems,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retro-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.systems && Array.isArray(data.systems) && data.systems.length > 0) {
                systems = data.systems;
                saveSystems();
                updateSystemSelect();
                renderSystemChips();
                renderSystemList();
                loadAllGames().then(() => {
                    filterGames();
                    updateGameCount();
                    alert('✅ Backup importado correctamente.');
                });
            } else {
                alert('❌ Archivo de backup inválido.');
            }
        } catch (error) {
            alert('❌ Error al leer el archivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

exportBtn.addEventListener('click', exportBackup);
importBtn.addEventListener('click', function() {
    importFile.click();
});
importFile.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        importBackup(this.files[0]);
    }
    this.value = '';
});

// ============================================================
//  BÚSQUEDA
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
        const gameId = g.id || `game-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <div data-game-id="${gameId}">
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
            const id = this.dataset.gameId;
            const game = games.find(g => (g.id || '').toString() === id.toString());
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
//  INICIO
// ============================================================
async function init() {
    loadSystems();
    updateSystemSelect();
    renderSystemChips();
    renderSystemList();
    await loadAllGames();
    filterGames();
    updateGameCount();

    console.log('🎮 Retro Game Vault cargado');
    console.log(`📚 ${games.length} juegos en la librería`);
    console.log(`🕹️ ${systems.length} sistemas disponibles`);
    console.log(`📂 Covers: Local (covers/) → URL personalizada → Libretro (fallback)`);
}

init();
