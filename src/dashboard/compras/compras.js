// ===== CONFIGURACIÓN =====
const API_BASE = 'https://localhost:7013/api';

let todasCompras = [];
let compraActual = null;
let detalleEditando = null;
let detallesTemporales = [];

// ===== ELEMENTOS DOM =====
const elementos = {
    loadingState: document.getElementById('loadingState'),
    contCompras: document.getElementById('contCompras'),
    emptyState: document.getElementById('emptyState'),
    // Filtros
    filtroSucursal: document.getElementById('filtroSucursal'),
    filtroProveedor: document.getElementById('filtroProveedor'),
    fechaInicio: document.getElementById('fechaInicio'),
    fechaFin: document.getElementById('fechaFin'),
    // Modales
    modalCompra: document.getElementById('modalCompra'),
    modalDetalle: document.getElementById('modalDetalle'),
    modalFormDetalle: document.getElementById('modalFormDetalle')
};

// ===== UTILIDADES =====
const fetchAPI = async (url, opciones = {}) => {
    try {
        const response = await fetch(url, opciones);
        if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`);
        const contentType = response.headers.get('content-type');
        return contentType?.includes('application/json') ? await response.json() : await response.text();
    } catch (error) {
        console.error('Error API:', error);
        throw error;
    }
};

const mostrarMensaje = (contenedor, mensaje, tipo = 'success') => {
    contenedor.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
    contenedor.classList.add(tipo === 'success' ? 'bg-green-100' : 'bg-red-100', tipo === 'success' ? 'text-green-800' : 'text-red-800');
    contenedor.textContent = mensaje;
    contenedor.classList.remove('hidden');
    setTimeout(() => contenedor.classList.add('hidden'), 5000);
};

const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
};

// ===== CARGAR FILTROS =====
const cargarFiltros = async () => {
    try {
        const [sucursales, proveedores, empleados, repartidores] = await Promise.all([
            fetchAPI(`${API_BASE}/Sucursal/sucursales`),
            fetchAPI(`${API_BASE}/Proveedor/obtener_proveedores`),
            fetchAPI(`${API_BASE}/Empleado`),
            fetchAPI(`${API_BASE}/Repartidor`)
        ]);

        // Llenar filtros de sucursales - usar sucursalId como value
        sucursales.forEach(s => {
            const option = document.createElement('option');
            option.value = s.sucursalId;
            option.textContent = s.descripcion || s.Descripcion || 'Sin descripción';
            elementos.filtroSucursal.appendChild(option.cloneNode(true));
            document.getElementById('sucursalCompra').appendChild(option);
        });

        // Llenar filtros de proveedores - usar proveedorId como value
        proveedores.forEach(p => {
            const option = document.createElement('option');
            option.value = p.proveedorId;
            option.textContent = p.razonSocial || 'Sin nombre';
            elementos.filtroProveedor.appendChild(option.cloneNode(true));
            document.getElementById('proveedorCompra').appendChild(option);
        });

        // Llenar combobox de empleados
        console.log('Empleados recibidos:', empleados);
        const selectEmpleado = document.getElementById('empleadoCompra');
        empleados.forEach(e => {
            const option = document.createElement('option');
            option.value = e.empleadoId;
            option.textContent = `${e.nombreEmpleado || ''} ${e.apellidoEmpleado || ''}`.trim() || 'Empleado';
            selectEmpleado.appendChild(option);
        });

        // Llenar combobox de repartidores
        console.log('Repartidores recibidos:', repartidores);
        const selectRepartidor = document.getElementById('repartidorCompra');
        repartidores.forEach(r => {
            const option = document.createElement('option');
            option.value = r.repartidorId;
            option.textContent = `${r.nombreRepartidor || ''} ${r.apellidoRepartidor || ''}`.trim() || 'Repartidor';
            selectRepartidor.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
};

// ===== CARGAR COMPRAS =====
const cargarCompras = async () => {
    elementos.loadingState.classList.remove('hidden');
    elementos.contCompras.classList.add('hidden');
    elementos.emptyState.classList.add('hidden');

    try {
        const url = new URL(`${API_BASE}/Compra/obtener_compras_por_filtros`);
        if (elementos.filtroSucursal.value) url.searchParams.set('sucursal', elementos.filtroSucursal.value);
        if (elementos.filtroProveedor.value) url.searchParams.set('proveedor', elementos.filtroProveedor.value);
        if (elementos.fechaInicio.value) url.searchParams.set('fechaInicio', elementos.fechaInicio.value);
        if (elementos.fechaFin.value) url.searchParams.set('fechaFin', elementos.fechaFin.value);

        const datos = await fetchAPI(url.toString());
        todasCompras = Array.isArray(datos) ? datos.filter(c => c.activo !== false) : [];
        renderizarCompras();
    } catch (error) {
        elementos.loadingState.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
    }
};

// ===== RENDERIZAR COMPRAS =====
const renderizarCompras = () => {
    elementos.loadingState.classList.add('hidden');
    
    if (todasCompras.length === 0) {
        elementos.contCompras.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
        return;
    }

    elementos.contCompras.classList.remove('hidden');
    elementos.emptyState.classList.add('hidden');

    elementos.contCompras.innerHTML = todasCompras.map(compra => `
        <div class="compra-item bg-white rounded-lg p-4 shadow-md border hover:shadow-lg transition cursor-pointer" onclick='verDetalle(${JSON.stringify(compra).replace(/'/g, "&#39;")})'>
            <div class="grid grid-cols-[2fr_2fr_2fr_1fr_auto] gap-4 items-center">
                <div>
                    <p class="text-sm text-gray-500">Fecha</p>
                    <p class="font-semibold text-gray-800">${formatearFecha(compra.fechaFactura || compra.fechaCompra)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Proveedor</p>
                    <p class="text-gray-800">${compra.proveedor || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Sucursal</p>
                    <p class="text-gray-800">${compra.sucursal || 'N/A'}</p>
                </div>
                <div>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">ID: ${compra.compraId || compra.id}</span>
                </div>
                <div class="flex gap-2" onclick="event.stopPropagation()">
                    <button onclick='editarCompra(${JSON.stringify(compra).replace(/'/g, "&#39;")})' class="px-3 py-2 bg-[#446D9E] text-white rounded-lg hover:bg-[#3B5B8C] transition" title="Editar">✏️</button>
                    <button onclick="eliminarCompra(${compra.compraId || compra.id})" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Eliminar">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
};

// ===== MODAL COMPRA =====
window.abrirModalAgregarCompra = () => {
    compraActual = null;
    detallesTemporales = [];
    document.getElementById('modalTituloCompra').textContent = 'Nueva Compra';
    document.getElementById('formCompra').reset();
    document.getElementById('fechaCompra').valueAsDate = new Date();
    document.getElementById('seccionDetallesTemp').classList.remove('hidden');
    renderizarDetallesTemp();
    elementos.modalCompra.classList.add('show');
};

window.editarCompra = async (compra) => {
    compraActual = compra;
    document.getElementById('modalTituloCompra').textContent = 'Editar Compra';
    document.getElementById('fechaCompra').value = new Date(compra.fechaFactura || compra.fechaCompra).toISOString().split('T')[0];
    document.getElementById('sucursalCompra').value = compra.sucursalId;
    document.getElementById('proveedorCompra').value = compra.proveedorId;
    document.getElementById('empleadoCompra').value = compra.empleadoId || 1;
    document.getElementById('repartidorCompra').value = compra.repartidorId || 1;
    
    // Cargar detalles existentes
    await cargarDetallesParaEditar(compra.compraId || compra.id);
    
    document.getElementById('seccionDetallesTemp').classList.add('hidden');
    document.getElementById('seccionDetallesEditar').classList.remove('hidden');
    elementos.modalCompra.classList.add('show');
};

window.cerrarModalCompra = () => {
    elementos.modalCompra.classList.remove('show');
    compraActual = null;
    detallesTemporales = [];
    document.getElementById('seccionDetallesEditar').classList.add('hidden');
};

// ===== CARGAR DETALLES PARA EDITAR =====
const cargarDetallesParaEditar = async (idCompra) => {
    try {
        const detalles = await fetchAPI(`${API_BASE}/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${idCompra}`);
        detallesTemporales = detalles.map(d => ({
            tipo: d.codigoBarraMedicamentoId ? 'medicamento' : 'producto',
            codigoBarra: d.codigoBarraMedicamentoId || d.codigoBarraProductoId,
            cantidad: d.cantidad,
            lote: d.loteMedicamentoId || d.loteProductoId || 0,
            loteProductoId: d.loteProductoId || null,
            codigoBarraMedicamentoId: d.codigoBarraMedicamentoId || null,
            codigoBarraProductoId: d.codigoBarraProductoId || null,
            loteMedicamentoId: d.loteMedicamentoId || null
        }));
        renderizarDetallesEditar();
    } catch (error) {
        console.error('Error cargando detalles:', error);
        detallesTemporales = [];
    }
};

const renderizarDetallesEditar = () => {
    const lista = document.getElementById('listaDetallesEditar');
    
    if (detallesTemporales.length === 0) {
        lista.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">No hay detalles cargados.</p>';
        return;
    }
    
    lista.innerHTML = detallesTemporales.map((d, idx) => `
        <div class="bg-white p-3 rounded-lg border flex items-center justify-between">
            <div class="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Tipo:</span>
                    <span class="font-semibold ml-1">${d.tipo === 'medicamento' ? '💊 Med' : '🛍️ Prod'}</span>
                </div>
                <div>
                    <span class="text-gray-500">Código:</span>
                    <span class="font-semibold ml-1">${d.codigoBarra}</span>
                </div>
                <div>
                    <span class="text-gray-500">Cant:</span>
                    <span class="font-semibold ml-1">${d.cantidad}</span>
                </div>
            </div>
        </div>
    `).join('');
};

// ===== GESTIÓN DE DETALLES TEMPORALES =====
const renderizarDetallesTemp = () => {
    const lista = document.getElementById('listaDetallesTemp');
    
    if (detallesTemporales.length === 0) {
        lista.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">No hay detalles agregados. Debe agregar al menos uno para crear la compra.</p>';
        return;
    }
    
    lista.innerHTML = detallesTemporales.map((d, idx) => `
        <div class="bg-white p-3 rounded-lg border flex items-center justify-between">
            <div class="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Tipo:</span>
                    <span class="font-semibold ml-1">${d.tipo === 'medicamento' ? '💊 Med' : '🛍️ Prod'}</span>
                </div>
                <div>
                    <span class="text-gray-500">Código:</span>
                    <span class="font-semibold ml-1">${d.codigoBarra}</span>
                </div>
                <div>
                    <span class="text-gray-500">Cant:</span>
                    <span class="font-semibold ml-1">${d.cantidad}</span>
                </div>
            </div>
            <button type="button" onclick="eliminarDetalleTemp(${idx})" class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">✕</button>
        </div>
    `).join('');
};

window.agregarDetalleTemp = () => {
    const tipo = document.getElementById('tipoDetalleTemp').value;
    const codigoBarra = document.getElementById('codigoBarraTemp').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadTemp').value);
    const lote = parseInt(document.getElementById('loteTemp').value) || 0;
    
    if (!tipo || !codigoBarra || !cantidad || cantidad < 1) {
        alert('Completa todos los campos requeridos del detalle');
        return;
    }
    
    detallesTemporales.push({
        tipo,
        codigoBarra,
        cantidad,
        lote,
        loteProductoId: tipo === 'producto' ? lote : null,
        codigoBarraMedicamentoId: tipo === 'medicamento' ? codigoBarra : null,
        codigoBarraProductoId: tipo === 'producto' ? codigoBarra : null,
        loteMedicamentoId: tipo === 'medicamento' ? lote : null
    });
    
    // Limpiar campos
    document.getElementById('tipoDetalleTemp').value = '';
    document.getElementById('codigoBarraTemp').value = '';
    document.getElementById('cantidadTemp').value = '';
    document.getElementById('loteTemp').value = '0';
    
    renderizarDetallesTemp();
};

window.eliminarDetalleTemp = (idx) => {
    detallesTemporales.splice(idx, 1);
    renderizarDetallesTemp();
};

// ===== GUARDAR COMPRA =====
document.getElementById('formCompra').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensajeForm = document.getElementById('mensajeFormCompra');

    // Validar detalles al crear
    if (!compraActual && detallesTemporales.length === 0) {
        mostrarMensaje(mensajeForm, 'Debes agregar al menos un detalle', 'error');
        return;
    }

    const detallesArray = detallesTemporales.map(d => ({
        loteProductoId: d.loteProductoId === null ? null : (d.loteProductoId || 0),
        codigoBarraMedicamentoId: d.codigoBarraMedicamentoId,
        codigoBarraProductoId: d.codigoBarraProductoId,
        cantidad: d.cantidad,
        loteMedicamentoId: d.loteMedicamentoId === null ? null : (d.loteMedicamentoId || 0)
    }));

    const compra = {
        fechaCompra: new Date(document.getElementById('fechaCompra').value).toISOString(),
        empleadoId: parseInt(document.getElementById('empleadoCompra').value) || 1,
        proveedorId: parseInt(document.getElementById('proveedorCompra').value),
        repartidorId: parseInt(document.getElementById('repartidorCompra').value) || 1,
        sucursalId: parseInt(document.getElementById('sucursalCompra').value),
        activo: true
    };
    
    // Para UPDATE usamos detallesCompraDtoLts, para INSERT usamos DetallesCompras
    if (compraActual) {
        compra.detallesCompraDtoLts = detallesArray;
    } else {
        compra.DetallesCompras = detallesArray;
    }

    console.log('Compra a guardar:', compra);

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        if (compraActual) {
            // ACTUALIZAR (PUT) - parámetro "id" según documentación
            const url = `${API_BASE}/Compra/actulizar_maestro_detalle?id=${compraActual.compraId || compraActual.idCompra}`;
            console.log('PUT URL:', url);
            
            await fetchAPI(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(compra)
            });
            mostrarMensaje(mensajeForm, '✓ Compra actualizada', 'success');
        } else {
            // INSERTAR (POST)
            console.log('POST URL:', `${API_BASE}/Compra/insertar_maestro_detalle`);
            
            await fetchAPI(`${API_BASE}/Compra/insertar_maestro_detalle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(compra)
            });
            mostrarMensaje(mensajeForm, '✓ Compra creada', 'success');
        }

        await cargarCompras();
        setTimeout(() => cerrarModalCompra(), 1500);
    } catch (error) {
        console.error('Error al guardar compra:', error);
        mostrarMensaje(mensajeForm, error.message, 'error');
    } finally {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
});

// ===== ELIMINAR COMPRA =====
window.eliminarCompra = async (id) => {
    if (!confirm('¿Eliminar esta compra?')) return;

    try {
        await fetchAPI(`${API_BASE}/Compra/borrar_compra?id=${id}`, { method: 'DELETE' });
        await cargarCompras();
        alert('✓ Compra eliminada');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

// ===== VER DETALLE =====
window.verDetalle = async (compra) => {
    compraActual = compra;
    document.getElementById('modalTituloDetalle').textContent = `Detalles - Compra #${compra.compraId}`;
    elementos.modalDetalle.classList.add('show');
    await cargarDetalles(compra.compraId);
};

window.cerrarModalDetalle = () => {
    elementos.modalDetalle.classList.remove('show');
    compraActual = null;
};

// ===== CARGAR DETALLES =====
const cargarDetalles = async (idCompra) => {
    try {
        const detalles = await fetchAPI(`${API_BASE}/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${idCompra}`);
        const cont = document.getElementById('contDetalles');

        if (!detalles || detalles.length === 0) {
            cont.innerHTML = '<p class="text-center text-gray-500 py-4">No hay detalles</p>';
            return;
        }

        cont.innerHTML = detalles.map(d => `
            <div class="bg-gray-50 rounded-lg p-4 border flex items-center justify-between">
                <div class="flex-1 grid grid-cols-3 gap-4">
                    <div>
                        <p class="text-sm text-gray-500">Código</p>
                        <p class="font-semibold">${d.codigoBarraMedicamentoId || d.codigoBarraProductoId || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Cantidad</p>
                        <p class="font-semibold">${d.cantidad}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Tipo</p>
                        <p class="font-semibold">${d.codigoBarraMedicamentoId ? 'Medicamento' : 'Producto'}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick='editarDetalle(${JSON.stringify(d).replace(/'/g, "&#39;")})' class="px-3 py-2 bg-[#446D9E] text-white rounded hover:bg-[#3B5B8C]">✏️</button>
                    <button onclick="eliminarDetalle(${d.detalleCompraId})" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('contDetalles').innerHTML = '<p class="text-red-500 text-center">Error al cargar detalles</p>';
    }
};

// ===== MODAL FORM DETALLE =====
window.abrirModalAgregarDetalle = () => {
    detalleEditando = null;
    document.getElementById('modalTituloFormDetalle').textContent = 'Agregar Detalle';
    document.getElementById('formDetalle').reset();
    elementos.modalFormDetalle.classList.add('show');
};

window.editarDetalle = (detalle) => {
    detalleEditando = detalle;
    document.getElementById('modalTituloFormDetalle').textContent = 'Editar Detalle';
    document.getElementById('tipoDetalle').value = detalle.codigoBarraMedicamentoId ? 'medicamento' : 'producto';
    document.getElementById('codigoBarra').value = detalle.codigoBarraMedicamentoId || detalle.codigoBarraProductoId;
    document.getElementById('cantidadDetalle').value = detalle.cantidad;
    elementos.modalFormDetalle.classList.add('show');
};

window.cerrarModalFormDetalle = () => {
    elementos.modalFormDetalle.classList.remove('show');
    detalleEditando = null;
};

// ===== GUARDAR DETALLE =====
document.getElementById('formDetalle').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensajeForm = document.getElementById('mensajeFormDetalle');

    const tipo = document.getElementById('tipoDetalle').value;
    const lote = parseInt(document.getElementById('loteDetalle').value) || 0;
    
    const detalle = {
        loteProductoId: tipo === 'producto' ? lote : 0,
        codigoBarraMedicamentoId: tipo === 'medicamento' ? document.getElementById('codigoBarra').value : null,
        codigoBarraProductoId: tipo === 'producto' ? document.getElementById('codigoBarra').value : null,
        cantidad: parseInt(document.getElementById('cantidadDetalle').value),
        loteMedicamentoId: tipo === 'medicamento' ? lote : 0
    };

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;

        if (detalleEditando) {
            // ACTUALIZAR
            await fetchAPI(`${API_BASE}/DetalleCompra/actualizar_detalle_compra?id=${detalleEditando.detalleCompraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detalle)
            });
            mostrarMensaje(mensajeForm, '✓ Detalle actualizado', 'success');
        } else {
            // INSERTAR
            await fetchAPI(`${API_BASE}/DetalleCompra/insertar_detalle_compra?idCompra=${compraActual.compraId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detalle)
            });
            mostrarMensaje(mensajeForm, '✓ Detalle agregado', 'success');
        }

        await cargarDetalles(compraActual.compraId);
        setTimeout(() => cerrarModalFormDetalle(), 1500);
    } catch (error) {
        mostrarMensaje(mensajeForm, error.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

// ===== ELIMINAR DETALLE =====
window.eliminarDetalle = async (id) => {
    if (!confirm('¿Eliminar este detalle?')) return;

    try {
        await fetchAPI(`${API_BASE}/DetalleCompra/borrar_detalle_compra?id=${id}`, { method: 'DELETE' });
        await cargarDetalles(compraActual.compraId);
        alert('✓ Detalle eliminado');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

// ===== EVENT LISTENERS =====
elementos.filtroSucursal.addEventListener('change', cargarCompras);
elementos.filtroProveedor.addEventListener('change', cargarCompras);
elementos.fechaInicio.addEventListener('change', cargarCompras);
elementos.fechaFin.addEventListener('change', cargarCompras);

// ===== INIT =====
(async () => {
    await cargarFiltros();
    await cargarCompras();
})();