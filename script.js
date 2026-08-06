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
        'SEGA GENESIS',
        'DREAMCAST',
        'SATURN'
    ],
    // Tipos de contenido
    TYPES: ['ROM', 'Port', 'Homebrew', 'ISO', 'CHD']
};

// ============================================================
//  DATOS DE EJEMPLO (JUEGOS)
//  ¡Puedes añadir más juegos aquí!
// ============================================================
const GAME_LIBRARY = [
    // PS3
    {
        id: 'the-last-of-us',
        title: 'The Last of Us',
        system: 'PS3',
        type: 'ROM',
        year: 2013,
        description: 'En un mundo post-apocalíptico, Joel debe escoltar a una joven llamada Ellie a través de Estados Unidos. Una historia emocionante sobre supervivencia y conexión humana.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/00ccff?text=TLOU',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    {
        id: 'god-of-war-3',
        title: 'God of War III',
        system: 'PS3',
        type: 'ROM',
        year: 2010,
        description: 'Kratos continúa su venganza contra los dioses del Olimpo en esta épica conclusión de la trilogía original.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ff0066?text=GOW3',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // PS2
    {
        id: 'shadow-of-colossus',
        title: 'Shadow of the Colossus',
        system: 'PS2',
        type: 'ROM',
        year: 2005,
        description: 'Un joven guerrero llamado Wander debe derrotar a 16 colosos gigantes para salvar a una doncella. Una obra maestra del arte y la narrativa.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ffcc00?text=SOTC',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    {
        id: 'final-fantasy-x',
        title: 'Final Fantasy X',
        system: 'PS2',
        type: 'ROM',
        year: 2001,
        description: 'La historia de Tidus y Yuna en Spira, donde deben detener a Sin, una criatura que amenaza el mundo.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/00ccff?text=FFX',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // PSP
    {
        id: 'crisis-core',
        title: 'Crisis Core: Final Fantasy VII',
        system: 'PSP',
        type: 'ROM',
        year: 2007,
        description: 'El juego precuela de Final Fantasy VII, donde seguimos a Zack Fair, un soldado de Shinra, en su viaje.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ff0066?text=CC',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    {
        id: 'patapon',
        title: 'Patapon',
        system: 'PSP',
        type: 'ROM',
        year: 2007,
        description: 'Un juego de ritmo y estrategia donde controlas a un ejército de criaturas usando tambores.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ffcc00?text=PATAPON',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // PS1
    {
        id: 'metal-gear-solid',
        title: 'Metal Gear Solid',
        system: 'PS1',
        type: 'ROM',
        year: 1998,
        description: 'El legendario juego de sigilo de Hideo Kojima. Solid Snake debe infiltrarse en una base nuclear y detener a FOXHOUND.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/00ccff?text=MGS',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    {
        id: 'castlevania-sotn',
        title: 'Castlevania: Symphony of the Night',
        system: 'PS1',
        type: 'ROM',
        year: 1997,
        description: 'Alucard despierta en el castillo de Drácula. Un metroidvania clásico que redefinió el género.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ff0066?text=CAS',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // NES
    {
        id: 'super-mario-bros-3',
        title: 'Super Mario Bros. 3',
        system: 'NES',
        type: 'ROM',
        year: 1988,
        description: 'Una de las mejores entregas de Mario. Con nuevos power-ups y mundos variados, es un clásico absoluto.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ffcc00?text=SMB3',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // GAMEBOY
    {
        id: 'pokemon-red',
        title: 'Pokémon Red Version',
        system: 'GAMEBOY',
        type: 'ROM',
        year: 1996,
        description: 'El juego que inició la fiebre Pokémon. Atrapa, entrena y combate con más de 150 criaturas.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/ff0066?text=POKE',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    },
    // Homebrew (ejemplo)
    {
        id: 'cave-story',
        title: 'Cave Story',
        system: 'PSP',
        type: 'Homebrew',
        year: 2004,
        description: 'Un clásico de la escena homebrew. Un shooter de plataformas con una historia profunda y mecánicas adictivas.',
        cover: 'https://via.placeholder.com/300x400/1a1a2e/00ccff?text=CAVE',
        downloads: [
            { label: 'Descarga 1 (Mega)', url: '#' },
            { label: 'Descarga 2 (MediaFire)', url: '#' },
            { label: 'Descarga 3 (Google Drive)', url: '#' }
        ]
    }
];

// ============================================================
//  ESTADO
// ============================================================
let games = [...GAME_LIBRARY];
let filteredGames = [];
let systems = [...CONFIG.SYSTEMS];
let currentSystem = 'all';
let searchQuery = '';

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
        const chip = document.createElement('span');
        chip.className = `system-chip ${currentSystem === sys ? 'active' : ''}`;
        chip.innerHTML = `
            ${sys}
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
    const newSystem = prompt('Introduce el nombre del nuevo sistema (ej: SEGA SATURN):');
    if (!newSystem || newSystem.trim() === '') return;
    const sys = newSystem.trim().toUpperCase();
    if (systems.includes(sys)) {
        alert(`El sistema "${sys}" ya existe.`);
        return;
    }
    systems.push(sys);
    saveSystems();
    initSystems();
    // Añadir automáticamente al select
    systemSelect.value = sys;
    currentSystem = sys;
    renderSystemChips();
    filterGames();
}

function removeSystem(sys) {
    if (systems.length <= 1) {
        alert('Debes tener al menos un sistema.');
        return;
    }
    if (!confirm(`¿Eliminar sistema "${sys}"?`)) return;
    systems = systems.filter(s => s !== sys);
    saveSystems();
    if (currentSystem === sys) {
        currentSystem = 'all';
        systemSelect.value = 'all';
    }
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
        // Filtro por sistema
        if (system !== 'all' && game.system !== system) return false;
        // Filtro por búsqueda
        if (query) {
            const matchTitle = game.title.toLowerCase().includes(query);
            const matchSystem = game.system.toLowerCase().includes(query);
            const matchDesc = game.description.toLowerCase().includes(query);
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
    if (filteredGames.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gamepad"></i>
                <h3>No hay juegos que coincidan</h3>
                <p style="color:#555577;margin-top:10px;">
                    ${searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'Añade juegos a la librería'}
                </p>
            </div>
        `;
        return;
    }

    let html = '';
    for (const game of filteredGames) {
        const systemColor = getSystemColor(game.system);
        html += `
            <div class="crypto-card" data-id="${game.id}" onclick="openModal('${game.id}')">
                <div class="card-image">
                    <img src="${game.cover}" alt="${game.title}" loading="lazy" />
                    <span class="system-badge" style="border-color:${systemColor};color:${systemColor};">${game.system}</span>
                </div>
                <div class="card-body">
                    <h3>${game.title}</h3>
                    <div class="card-meta">
                        <span class="year">${game.year}</span>
                        <span class="type">${game.type}</span>
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
//  COLORES POR SISTEMA (efecto visual)
// ============================================================
function getSystemColor(system) {
    const colors = {
        'PS3': '#00ccff',
        'PS2': '#ff0066',
        'PSP': '#ffcc00',
        'PS1': '#66ff66',
        'NES': '#ff4444',
        'SNES': '#ff66ff',
        'N64': '#ff8800',
        'GAMEBOY': '#88ff88',
        'GAMEBOY ADVANCE': '#44ddff',
        'SEGA GENESIS': '#ff44ff',
        'DREAMCAST': '#ffcc44',
        'SATURN': '#ff4488'
    };
    return colors[system] || '#00ccff';
}

// ============================================================
//  MODAL DE DETALLE
// ============================================================
function openModal(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;

    const systemColor = getSystemColor(game.system);

    modalBody.innerHTML = `
        <div class="modal-top">
            <div class="modal-cover">
                <img src="${game.cover}" alt="${game.title}" />
            </div>
            <div class="modal-info">
                <h2>${game.title}</h2>
                <div class="modal-system" style="border-color:${systemColor};color:${systemColor};">${game.system}</div>
                <div class="modal-year">📅 ${game.year}</div>
                <div class="modal-type">${game.type}</div>
                <div class="modal-description">${game.description}</div>
            </div>
        </div>
        <div class="download-buttons">
            ${game.downloads.map((dl, i) => `
                <a href="${dl.url}" target="_blank" class="btn-download ${i === 0 ? 'primary' : i === 1 ? 'secondary' : 'tertiary'}">
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
        .filter(g => g.title.toLowerCase().includes(q) || g.system.toLowerCase().includes(q))
        .slice(0, 8);

    if (matches.length === 0) {
        suggestionsEl.classList.remove('show');
        return;
    }

    suggestionsEl.innerHTML = matches.map(g => `
        <div data-id="${g.id}">
            <img src="${g.cover}" alt="${g.title}" />
            <span><strong>${g.title}</strong> <span style="color:#666;font-size:0.8rem;">${g.system}</span></span>
        </div>
    `).join('');
    suggestionsEl.classList.add('show');

    suggestionsEl.querySelectorAll('div').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            searchInput.value = games.find(g => g.id === id).title;
            searchQuery = searchInput.value;
            suggestionsEl.classList.remove('show');
            filterGames();
            openModal(id);
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
function init() {
    initSystems();
    filterGames();

    // Añadir la función openModal al ámbito global para que funcione desde el onclick
    window.openModal = openModal;

    console.log('🎮 Retro Game Vault cargado');
    console.log(`📚 ${games.length} juegos en la librería`);
    console.log(`🕹️ ${systems.length} sistemas disponibles`);
}

init();
