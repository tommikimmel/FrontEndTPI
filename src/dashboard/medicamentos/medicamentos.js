
//Cargar sucursales para filtro
const filtroSucursalMedicamentos = document.getElementById("filtroSucursalMedicamentos");
async function cargarSucursalesParaFiltro() {
    const res = await fetch("https://localhost:7013/api/Sucursal/sucursales");
    const datos = await res.json();
    datos.forEach(sucursal => {
        const option = document.createElement("option");
        // Normalizar posibles formas de la propiedad Descripcion (mayúsculas/minúsculas)
        const descripcion = sucursal.Descripcion ?? sucursal.descripcion ?? sucursal.Nombre ?? sucursal.nombre ?? '';
        // Guardamos la descripción como valor porque el API de medicamentos ahora devuelve "nombreSucursal" (string con el nombre)
        option.value = descripcion;
        option.textContent = descripcion;
        filtroSucursalMedicamentos.appendChild(option);
    });
}
cargarSucursalesParaFiltro();

//Cargar medicamentos
const filtroNombreInput = document.getElementById('filtroNombreMedicamento');
const filtroPrecioSelect = document.getElementById('filtroPrecioMedicamentos');
const contMedicamentos = document.getElementById("contMedicamentos");

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAGE_SIZE = 10;
let currentPage = 1;

async function loadAndFilterMedicamentos({ nameFilter, sucursalFilter, priceOrder, page } = {}) {
    // gestionar página
    currentPage = (typeof page === 'number' && page > 0) ? Math.floor(page) : currentPage || 1;
    const name = (typeof nameFilter === 'string') ? nameFilter.trim().toLowerCase() : (filtroNombreInput?.value || '').trim().toLowerCase();
    const sucursal = (typeof sucursalFilter === 'string') ? sucursalFilter : (filtroSucursalMedicamentos?.value || '');
    const order = (typeof priceOrder === 'string') ? priceOrder : (filtroPrecioSelect?.value || '');

    // Cargar todos los medicamentos y filtrar en cliente
    const res = await fetch('https://localhost:7013/api/Medicamento/obtener_medicamentos_por_filtros');
    const data = await res.json();

    let items = Array.isArray(data) ? data.slice() : [];

    if (name) {
        items = items.filter(m => (m.nombre || '').toString().toLowerCase().includes(name));
    }

    if (sucursal) {
        items = items.filter(m => {
            if (m.nombreSucursal !== undefined) return String(m.nombreSucursal) === String(sucursal);
            if (m.NombreSucursal !== undefined) return String(m.NombreSucursal) === String(sucursal);

            if (m.sucursalId !== undefined) return String(m.sucursalId) === String(sucursal);
            if (m.Sucursal && (m.Sucursal.SucursalId !== undefined || m.Sucursal.sucursalId !== undefined)) {
                return String(m.Sucursal.SucursalId ?? m.Sucursal.sucursalId) === String(sucursal);
            }

            if (m.sucursal && (m.sucursal.descripcion || m.sucursal.Descripcion)) {
                return String(m.sucursal.descripcion ?? m.sucursal.Descripcion) === String(sucursal);
            }

            return false;
        });
    }

    if (order === 'A') {
        items.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
    } else if (order === 'D') {
        items.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));
    }

    // Render paginado
    contMedicamentos.innerHTML = '';
    if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-(--negro-suave)';
        empty.textContent = 'No se encontraron medicamentos.';
        contMedicamentos.appendChild(empty);
        return;
    }

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = items.slice(start, end);

    pageItems.forEach(medicamento => {
        const div = document.createElement('div');
        div.className = 'producto grid grid-cols-[3fr_1fr_1fr_1fr_2fr_1fr] items-center bg-white p-2 rounded shadow gap-1';

        const nombre = medicamento.nombre || '';
        const precio = Number(medicamento.precio || medicamento.precioVenta || 0);
        const stock = medicamento.stockActual !== undefined ? medicamento.stockActual : (medicamento.stock || 0);
        const clasif = medicamento.clasificacion || '';
        const sucNombre = medicamento.nombreSucursal || (medicamento.sucursal && medicamento.sucursal.descripcion) || '';
        
        div.innerHTML = `
            <h3 class="text-(--azul-dim) font-semibold text-lg mb-0">${nombre}</h3>
            <p class="text-(--negro-suave)">${money.format(precio)}</p>
            <p>${stock} unidades</p>
            <p>${clasif}</p>
            <p>${sucNombre}</p>
            <div class="flex gap-2 justify-end col-span-1">
                <button data-action="editar" class="px-2 py-1 rounded bg-(--azul-dim) text-(--blanco-frio)">✏️</button>
                <button data-action="eliminar" class="px-2 py-1 rounded bg-(--azul-dim) text-(--blanco-frio)">❌</button>
            </div>
        `;

        contMedicamentos.appendChild(div);
    });

    // Paginación: controles al final del contenedor
    const pagination = document.createElement('div');
    pagination.className = 'w-full flex items-center justify-center gap-2 mt-4';

    function makeButton(label, disabled) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.className = `px-3 py-1 rounded ${disabled ? 'opacity-50 cursor-not-allowed' : 'bg-(--azul-dim) text-(--blanco-frio)'}`;
        if (disabled) btn.disabled = true;
        return btn;
    }

    // Prev
    const prevBtn = makeButton('Anterior', currentPage === 1);
    prevBtn.addEventListener('click', () => loadAndFilterMedicamentos({ page: currentPage - 1 }));
    pagination.appendChild(prevBtn);

    // pages (mostrar hasta 7 botones centrados)
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);

    for (let p = startPage; p <= endPage; p++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = String(p);
        btn.className = `px-2 py-1 rounded ${p === currentPage ? 'bg-(--azul-dim) text-(--blanco-frio)' : 'bg-(--plata-mate) text-(--negro-suave)'}`;
        btn.addEventListener('click', () => loadAndFilterMedicamentos({ page: p }));
        pagination.appendChild(btn);
    }

    // Next
    const nextBtn = makeButton('Siguiente', currentPage === totalPages);
    nextBtn.addEventListener('click', () => loadAndFilterMedicamentos({ page: currentPage + 1 }));
    pagination.appendChild(nextBtn);

    // Texto de estado
    const status = document.createElement('div');
    status.className = 'ml-4 text-(--negro-suave)';
    status.textContent = `Página ${currentPage} de ${totalPages} | ${totalItems} medicamentos`;
    pagination.appendChild(status);

    contMedicamentos.appendChild(pagination);
}

// Inicializar carga y listeners de filtros
loadAndFilterMedicamentos();

if (filtroNombreInput) filtroNombreInput.addEventListener('input', () => { currentPage = 1; loadAndFilterMedicamentos({ page: 1 }); });
if (filtroSucursalMedicamentos) filtroSucursalMedicamentos.addEventListener('change', () => { currentPage = 1; loadAndFilterMedicamentos({ page: 1 }); });
if (filtroPrecioSelect) filtroPrecioSelect.addEventListener('change', () => { currentPage = 1; loadAndFilterMedicamentos({ page: 1 }); });

