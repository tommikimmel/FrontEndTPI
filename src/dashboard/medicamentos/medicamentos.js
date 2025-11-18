// ===== CONFIGURACIÓN =====
const API_BASE = 'https://localhost:7013/api';
const PAGE_SIZE = 10;

let currentPage = 1;
let allItems = [];
let filteredItems = [];

// ===== UTILIDADES =====
const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(valor);
};

const obtenerDatos = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
};

// ===== ELEMENTOS DOM =====
const elementos = {
    filtroNombre: document.getElementById('filtroNombreMedicamento'),
    filtroSucursal: document.getElementById('filtroSucursalMedicamentos'),
    filtroPrecio: document.getElementById('filtroPrecioMedicamentos'),
    contenedor: document.getElementById('contMedicamentos'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState')
};

// ===== CARGAR SUCURSALES =====
const cargarSucursales = async () => {
    const datos = await obtenerDatos(`${API_BASE}/Sucursal/sucursales`);
    
    if (!datos) return;

    datos.forEach(sucursal => {
        const option = document.createElement('option');
        const descripcion = sucursal.Descripcion || sucursal.descripcion || sucursal.Nombre || sucursal.nombre || '';
        option.value = descripcion;
        option.textContent = descripcion;
        elementos.filtroSucursal.appendChild(option);
    });
};

// ===== OBTENER NOMBRE DE SUCURSAL =====
const obtenerNombreSucursal = (item) => {
    if (item.nombreSucursal) return item.nombreSucursal;
    if (item.NombreSucursal) return item.NombreSucursal;
    if (item.sucursal?.descripcion) return item.sucursal.descripcion;
    if (item.sucursal?.Descripcion) return item.sucursal.Descripcion;
    return 'Sin sucursal';
};

// ===== APLICAR FILTROS =====
const aplicarFiltros = () => {
    const nombreFiltro = elementos.filtroNombre.value.toLowerCase().trim();
    const sucursalFiltro = elementos.filtroSucursal.value;
    const ordenPrecio = elementos.filtroPrecio.value;

    // Filtrar
    filteredItems = allItems.filter(item => {
        const coincideNombre = !nombreFiltro || (item.nombre || '').toLowerCase().includes(nombreFiltro);
        const coincideSucursal = !sucursalFiltro || obtenerNombreSucursal(item) === sucursalFiltro;
        return coincideNombre && coincideSucursal;
    });

    // Ordenar por precio
    if (ordenPrecio === 'A') {
        filteredItems.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    } else if (ordenPrecio === 'D') {
        filteredItems.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    }

    currentPage = 1;
    renderizar();
};

// ===== RENDERIZAR MEDICAMENTOS =====
const renderizar = () => {
    elementos.loadingState.classList.add('hidden');
    elementos.contenedor.classList.remove('hidden');
    elementos.emptyState.classList.add('hidden');

    if (filteredItems.length === 0) {
        elementos.contenedor.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
        return;
    }

    const totalPaginas = Math.ceil(filteredItems.length / PAGE_SIZE);
    if (currentPage > totalPaginas) currentPage = totalPaginas;

    const inicio = (currentPage - 1) * PAGE_SIZE;
    const fin = inicio + PAGE_SIZE;
    const itemsPagina = filteredItems.slice(inicio, fin);

    elementos.contenedor.innerHTML = `
        ${itemsPagina.map(item => crearItemHTML(item)).join('')}
        ${crearPaginacionHTML(totalPaginas)}
    `;

    // Event listeners para botones
    elementos.contenedor.querySelectorAll('[data-action="editar"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Editar medicamento:', btn.dataset.id);
            // Implementar lógica de edición
        });
    });

    elementos.contenedor.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Está seguro de eliminar este medicamento?')) {
                console.log('Eliminar medicamento:', btn.dataset.id);
                // Implementar lógica de eliminación
            }
        });
    });
};

// ===== CREAR HTML DE ITEM =====
const crearItemHTML = (item) => {
    const nombre = item.nombre || 'Sin nombre';
    const precio = formatearMoneda(item.precio || item.precioVenta || 0);
    const stock = item.stockActual !== undefined ? item.stockActual : (item.stock || 0);
    const clasificacion = item.clasificacion || 'Sin clasificar';
    const sucursal = obtenerNombreSucursal(item);
    const id = item.medicamentoId || item.id || '';

    const stockClass = stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-700';

    return `
        <div class="item-row bg-white rounded-lg p-4 border border-gray-200">
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] gap-4 items-center">
                <div>
                    <h3 class="text-lg font-bold text-[#446D9E] mb-1">${nombre}</h3>
                    <p class="text-xs text-gray-500">Clasificación: ${clasificacion}</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-gray-500 mb-1">Precio</p>
                    <p class="font-semibold text-gray-800">${precio}</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-gray-500 mb-1">Stock</p>
                    <p class="${stockClass}">${stock} unidades</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-gray-500 mb-1">Clasificación</p>
                    <p class="text-gray-700">${clasificacion}</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-gray-500 mb-1">Sucursal</p>
                    <p class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block">${sucursal}</p>
                </div>
                <div class="flex gap-2">
                    <button data-action="editar" data-id="${id}" class="px-3 py-2 rounded-lg bg-[#446D9E] text-white hover:bg-[#3B5B8C] transition-all" title="Editar">
                        ✏️
                    </button>
                    <button data-action="eliminar" data-id="${id}" class="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
};

// ===== CREAR HTML DE PAGINACIÓN =====
const crearPaginacionHTML = (totalPaginas) => {
    if (totalPaginas <= 1) return '';

    let botones = '';

    // Botón anterior
    botones += `
        <button 
            onclick="cambiarPagina(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-all"
        >
            ← Anterior
        </button>
    `;

    // Botones de páginas
    const maxBotones = 7;
    let inicio = Math.max(1, currentPage - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    
    if (fin - inicio < maxBotones - 1) {
        inicio = Math.max(1, fin - maxBotones + 1);
    }

    for (let i = inicio; i <= fin; i++) {
        botones += `
            <button 
                onclick="cambiarPagina(${i})" 
                class="px-4 py-2 rounded-lg ${i === currentPage ? 'bg-[#446D9E] text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'} border transition-all"
            >
                ${i}
            </button>
        `;
    }

    // Botón siguiente
    botones += `
        <button 
            onclick="cambiarPagina(${currentPage + 1})" 
            ${currentPage === totalPaginas ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg border ${currentPage === totalPaginas ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-all"
        >
            Siguiente →
        </button>
    `;

    return `
        <div class="flex items-center justify-center gap-2 mt-6 flex-wrap">
            ${botones}
            <div class="text-sm text-gray-600 ml-4">
                Página ${currentPage} de ${totalPaginas} | ${filteredItems.length} medicamentos
            </div>
        </div>
    `;
};

// ===== CAMBIAR PÁGINA =====
window.cambiarPagina = (nuevaPagina) => {
    currentPage = nuevaPagina;
    renderizar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===== CARGAR MEDICAMENTOS =====
const cargarMedicamentos = async () => {
    elementos.loadingState.classList.remove('hidden');
    elementos.contenedor.classList.add('hidden');
    elementos.emptyState.classList.add('hidden');

    const datos = await obtenerDatos(`${API_BASE}/Medicamento/obtener_medicamentos_por_filtros`);

    if (!datos) {
        elementos.loadingState.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
        return;
    }

    allItems = Array.isArray(datos) ? datos : [];
    filteredItems = [...allItems];
    renderizar();
};

// ===== INICIALIZAR EVENT LISTENERS =====
const inicializarEventListeners = () => {
    elementos.filtroNombre.addEventListener('input', aplicarFiltros);
    elementos.filtroSucursal.addEventListener('change', aplicarFiltros);
    elementos.filtroPrecio.addEventListener('change', aplicarFiltros);
};

// ===== INICIALIZACIÓN =====
(async () => {
    await cargarSucursales();
    await cargarMedicamentos();
    inicializarEventListeners();
})();