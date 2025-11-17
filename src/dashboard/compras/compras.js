//Cargar sucursales
async function cargarFiltros() {
    fetch('https://localhost:7013/api/Sucursal/sucursales')
    .then(res => res.json())
    .then(data => {
        const filtroSucursalProductos = document.getElementById('filtroSucursalCompras');
        data.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.descripcion;
            option.textContent = sucursal.descripcion;
            filtroSucursalProductos.appendChild(option);
        });
    });

    fetch('https://localhost:7013/api/Proveedor/obtener_proveedores')
    .then(res => res.json())
    .then(data => {
        const filtroProveedorCompras = document.getElementById('filtroProveedorCompras');
        data.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.razonSocial;
            option.textContent = proveedor.razonSocial;
            filtroProveedorCompras.appendChild(option);
        });
    });
}

//Cargar compras
const contCompras = document.getElementById('contCompras');

const filtroSucursalEl = document.getElementById('filtroSucursalCompras');
const filtroProveedorEl = document.getElementById('filtroProveedorCompras');
const fechaInicioEl = document.getElementById('fechaInicio');
const fechaFinEl = document.getElementById('fechaFin');
let filtrosListenersBound = false;
async function cargarCompras() {
    // Leer filtros del DOM y construir query string.
    // Importante: las sucursales y proveedores se envían como texto (razonSocial/descripcion),
    // tal como solicitaste.
    const base = 'https://localhost:7013/api/Compra/obtener_compras_por_filtros';
    const url = new URL(base);
    const sucursalVal = filtroSucursalEl?.value || '';
    const proveedorVal = filtroProveedorEl?.value || '';
    const fechaInicioVal = fechaInicioEl?.value || '';
    const fechaFinVal = fechaFinEl?.value || '';

    if (sucursalVal) url.searchParams.set('sucursal', sucursalVal);
    if (proveedorVal) url.searchParams.set('proveedor', proveedorVal);
    if (fechaInicioVal) url.searchParams.set('fechaInicio', fechaInicioVal);
    if (fechaFinVal) url.searchParams.set('fechaFin', fechaFinVal);
    const existingOverlay = contCompras.querySelector('.detalleCompra') || document.querySelector('.detalleCompra');
    contCompras.innerHTML = '';
    if (existingOverlay) contCompras.appendChild(existingOverlay);

    fetch(url.toString())
    .then(res => res.json())
    .then(data => {
        if (!filtrosListenersBound) {
            if (filtroSucursalEl) filtroSucursalEl.addEventListener('change', () => { cargarCompras(); });
            if (filtroProveedorEl) filtroProveedorEl.addEventListener('change', () => { cargarCompras(); });
            if (fechaInicioEl) fechaInicioEl.addEventListener('change', () => { cargarCompras(); });
            if (fechaFinEl) fechaFinEl.addEventListener('change', () => { cargarCompras(); });
            filtrosListenersBound = true;
        }

        data.forEach(compra => {
            const div = document.createElement('div');
            div.className = "compra grid grid-cols-[4fr_2fr_2fr_1fr_1fr] items-center bg-white px-2 py-1 rounded shadow gap-1 mt-4 hover:scale-102 transition";
            
            div.innerHTML = `
                <h3 class="text-(--azul-dim) font-semibold text-xl mb-0">${compra.fechaFactura}</h3>
                <p class="text-(--negro-suave)">${compra.proveedor}</p>
                <p class="text-(--negro-suave)">${compra.sucursal}</p>
                <button id="editarCompra" class="px-1 py-1 rounded bg-(--azul-dim) text-(--blanco-frio)">✏️</button>
                <button id="eliminarCompra" class="px-1 py-1 rounded bg-(--azul-dim) text-(--blanco-frio)">❌</button>
            `

            div.dataset.id = compra.compraId

            div.addEventListener('click', async(e) => {
                // Evitar que el click que abre el overlay burbujee y active el listener global
                e.stopPropagation();
                const id = div.dataset.id;

                // Obtener el contenedor de detalle ya presente en el HTML
                const detalleOverlay = document.querySelector('.detalleCompra');
                if (!detalleOverlay) return;

                detalleOverlay.classList.remove('hidden');
                detalleOverlay.style.zIndex = '1000';

                const titleEl = detalleOverlay.querySelector('h2');
                if (titleEl) titleEl.textContent = `Detalle Compra - ${id}`;

                const existingRows = detalleOverlay.querySelectorAll('.detalle');
                existingRows.forEach(r => r.remove());

                // Traer el detalle de la compra
                fetch(`https://localhost:7013/api/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (!Array.isArray(data)) return;

                    data.forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'detalle grid grid-cols-[3fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-1 bg-white shadow rounded mt-2';

                        const codigo = item.codigoBarraMedicamentoId ?? item.codigoBarraProductoId ?? item.codigoBarra ?? 'Sin código';
                        const precioText = item.precio !== undefined ? `$${Number(item.precio).toLocaleString('es-AR')}` : '-';
                        const cantidad = item.cantidad ?? 0;

                        row.innerHTML = `
                            <span class="detalle-nombre">${codigo}</span>
                            <span class="detalle-precio">${precioText}</span>
                            <span class="detalle-cantidad">${cantidad}</span>
                            <button data-id="${item.detalleCompraId}" data-action="editarDetalleCompra" class="bg-(--azul-dim) rounded px-2">✏️</button>
                            <button data-id="${item.detalleCompraId}" data-action="eliminarDetalleCompra" class="bg-(--azul-dim) rounded px-2">❌</button>
                        `;

                        const footer = detalleOverlay.querySelector('footer');
                        if (footer) {
                            footer.insertAdjacentElement('beforebegin', row);
                        } else {
                            detalleOverlay.appendChild(row);
                        }
                    });

                    detalleOverlay.querySelectorAll('[data-action="editarDetalleCompra"]').forEach(btn => {
                        btn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const idDetalle = btn.dataset.id;
                            console.log('Editar detalle', idDetalle);
                        });
                    });
                    detalleOverlay.querySelectorAll('[data-action="eliminarDetalleCompra"]').forEach(btn => {
                        btn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const idDetalle = btn.dataset.id;
                            console.log('Eliminar detalle', idDetalle);
                            const row = btn.closest('.detalle');
                            if (row) row.remove();
                        });
                    });
                })
                .catch(err => console.error('Error cargando detalle compra', err));

                const btnCerrar = detalleOverlay.querySelector('#cerrarDetalleCompra');
                if (btnCerrar && !detalleOverlay.dataset.closeBound) {
                    btnCerrar.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        detalleOverlay.classList.add('hidden');
                    });
                    detalleOverlay.dataset.closeBound = '1';
                }
            });
            contCompras.appendChild(div);   
        });
    })
}

cargarFiltros()
cargarCompras()

if (!document.body.dataset.detalleGlobalCloseBound) {
    document.addEventListener('click', (ev) => {
        const detalleOverlay = document.querySelector('.detalleCompra');
        if (!detalleOverlay) return;
        // Si el overlay está visible y el click no está dentro del mismo, cerrarlo
        if (!detalleOverlay.classList.contains('hidden') && !detalleOverlay.contains(ev.target)) {
            detalleOverlay.classList.add('hidden');
        }
    });
    document.body.dataset.detalleGlobalCloseBound = '1';
}