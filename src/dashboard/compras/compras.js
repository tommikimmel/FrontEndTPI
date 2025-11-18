// ===== CONFIGURACIÓN =====
const API_BASE = 'https://localhost:7013/api';

let todasCompras = [];
let sucursalesCache = [];
let proveedoresCache = [];
let empleadosCache = [];
let repartidoresCache = [];
let compraActual = null;
let detalleEditando = null;
let detallesTemporales = [];

// ===== ELEMENTOS DOM =====
const elementos = {
    loadingState: document.getElementById('loadingState'),
    contCompras: document.getElementById('contCompras'),
    emptyState: document.getElementById('emptyState'),
    filtroSucursal: document.getElementById('filtroSucursal'),
    filtroProveedor: document.getElementById('filtroProveedor'),
    fechaInicio: document.getElementById('fechaInicio'),
    fechaFin: document.getElementById('fechaFin')
};

// ===== UTILIDADES =====
const fetchAPI = async (url, opciones = {}) => {
    try {
        const response = await fetch(url, opciones);
        if (!response.ok) {
            let errorMsg = `HTTP ${response.status}`;
            try {
                const errorData = await response.text();
                console.error('Error del servidor:', errorData);
                errorMsg = errorData || errorMsg;
            } catch (e) {
                console.error('No se pudo leer el error del servidor');
            }
            throw new Error(errorMsg);
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error('Error API:', error);
        throw error;
    }
};

const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
};


// ===== CARGAR FILTROS =====
const cargarFiltros = async () => {
    try {
        // Cargar datos en paralelo con manejo individual de errores
        const [sucursalesResult, proveedoresResult, empleadosResult, repartidoresResult] = await Promise.allSettled([
            fetchAPI(`${API_BASE}/Sucursal/sucursales`),
            fetchAPI(`${API_BASE}/Proveedor/obtener_proveedores`),
            fetchAPI(`${API_BASE}/Empleado`),
            fetchAPI(`${API_BASE}/Repartidor`)
        ]);

        // Procesar sucursales
        if (sucursalesResult.status === 'fulfilled') {
            sucursalesCache = Array.isArray(sucursalesResult.value) ? sucursalesResult.value : [];
            sucursalesCache.forEach(s => {
                const descripcion = s.descripcion || 'Sin descripción';
                const opt = document.createElement('option');
                opt.value = descripcion;
                opt.textContent = descripcion;
                elementos.filtroSucursal.appendChild(opt);
            });
        } else {
            console.error('Error cargando sucursales:', sucursalesResult.reason);
        }

        // Procesar proveedores
        if (proveedoresResult.status === 'fulfilled') {
            proveedoresCache = Array.isArray(proveedoresResult.value) ? proveedoresResult.value : [];
            proveedoresCache.forEach(p => {
                const razon = p.razonSocial || 'Proveedor';
                const provId = p.proveedorId;
                if (provId) {
                    const opt = document.createElement('option');
                    opt.value = provId;
                    opt.textContent = razon;
                    elementos.filtroProveedor.appendChild(opt);
                }
            });
        } else {
            console.error('Error cargando proveedores:', proveedoresResult.reason);
        }

        // Procesar empleados
        if (empleadosResult.status === 'fulfilled') {
            empleadosCache = Array.isArray(empleadosResult.value) ? empleadosResult.value : [];
            console.log('Empleados cargados:', empleadosCache.length);
        } else {
            console.error('Error cargando empleados:', empleadosResult.reason);
            empleadosCache = [];
        }

        // Procesar repartidores
        if (repartidoresResult.status === 'fulfilled') {
            repartidoresCache = Array.isArray(repartidoresResult.value) ? repartidoresResult.value : [];
            console.log('Repartidores cargados:', repartidoresCache.length);
        } else {
            console.error('Error cargando repartidores:', repartidoresResult.reason);
            repartidoresCache = [];
        }
    } catch (error) {
        console.error('Error general cargando filtros:', error);
    }
};

// ===== CARGAR COMPRAS =====
const cargarCompras = async () => {
    elementos.loadingState.classList.remove('hidden');
    elementos.contCompras.classList.add('hidden');
    elementos.emptyState.classList.add('hidden');

    try {
        const url = new URL(`${API_BASE}/Compra/obtener_compras_por_filtros`);
        
        if (elementos.filtroSucursal.value) {
            url.searchParams.set('sucursal', elementos.filtroSucursal.value);
        }
        if (elementos.filtroProveedor.value) {
            url.searchParams.set('proveedorId', elementos.filtroProveedor.value);
        }
        if (elementos.fechaInicio.value) {
            url.searchParams.set('fechaInicio', elementos.fechaInicio.value);
        }
        if (elementos.fechaFin.value) {
            url.searchParams.set('fechaFin', elementos.fechaFin.value);
        }

        console.log('URL de filtrado:', url.toString());
        
        const datos = await fetchAPI(url.toString());
        todasCompras = Array.isArray(datos) ? datos : [];
        renderizarCompras();
    } catch (error) {
        console.error('Error cargando compras:', error);
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
        <div class="bg-white rounded-lg p-4 shadow-md border hover:shadow-lg transition cursor-pointer" onclick="verDetalleCompra(${compra.compraId || compra.id})">
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
                    <p class="text-sm text-gray-500">ID</p>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${compra.compraId || compra.id}</span>
                </div>
                <div class="flex gap-2" onclick="event.stopPropagation()">
                    <button onclick="editarCompra(${compra.compraId || compra.id})" class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition" title="Editar">
                        ✏️
                    </button>
                    <button onclick="eliminarCompra(${compra.compraId || compra.id})" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// ===== ELIMINAR COMPRA =====
const eliminarCompra = async (id) => {
    if (!confirm(`¿Eliminar la compra #${id}?`)) return;

    try {
        await fetchAPI(`${API_BASE}/Compra/borrar_compra?id=${id}`, {
            method: 'DELETE'
        });
        alert('✓ Compra eliminada');
        await cargarCompras();
    } catch (error) {
        alert('Error al eliminar la compra: ' + error.message);
    }
};

window.eliminarCompra = eliminarCompra;

// ===== VER DETALLE COMPRA =====
const verDetalleCompra = async (id) => {
    const compra = todasCompras.find(c => (c.compraId || c.id) === id);
    if (!compra) {
        alert('Compra no encontrada');
        return;
    }

    compraActual = id;
    document.getElementById('modalTituloDetalle').textContent = `Detalles - Compra #${id}`;
    
    const contDetalles = document.getElementById('contDetalles');
    contDetalles.innerHTML = '<div class="flex justify-center py-8"><div class="spinner"></div></div>';
    
    document.getElementById('modalDetalle').classList.add('show');
    await cargarDetalles();
};

const cargarDetalles = async () => {
    const contDetalles = document.getElementById('contDetalles');
    
    try {
        const detalles = await fetchAPI(`${API_BASE}/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${compraActual}`);
        
        if (!detalles || detalles.length === 0) {
            contDetalles.innerHTML = '<p class="text-center text-gray-500 py-8">No hay detalles para esta compra. Presiona "Agregar Detalle" para comenzar.</p>';
            return;
        }
        
        contDetalles.innerHTML = detalles.map(d => `
            <div class="bg-gray-50 rounded-lg p-4 border">
                <div class="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 items-center">
                    <div>
                        <p class="text-sm text-gray-500">Código de Barra</p>
                        <p class="font-semibold">${d.codigoBarraMedicamentoId || d.codigoBarraProductoId || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Lote</p>
                        <p class="font-semibold">${d.loteProductoId || d.loteMedicamentoId || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Cantidad</p>
                        <p class="font-semibold text-lg">${d.cantidad}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Detalle ID</p>
                        <p class="font-mono text-xs">#${d.detalleCompraId}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editarDetalle(${d.detalleCompraId})" class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition" title="Editar">✏️</button>
                        <button onclick="eliminarDetalle(${d.detalleCompraId})" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Eliminar">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        contDetalles.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar los detalles</p>';
    }
};

window.verDetalleCompra = verDetalleCompra;

// ===== CERRAR MODAL DETALLE =====
const cerrarModalDetalle = () => {
    document.getElementById('modalDetalle').classList.remove('show');
    compraActual = null;
};

window.cerrarModalDetalle = cerrarModalDetalle;

// ===== MODAL AGREGAR/EDITAR DETALLE =====
window.abrirModalAgregarDetalle = () => {
    if (!compraActual) {
        alert('No hay compra seleccionada');
        return;
    }
    detalleEditando = null;
    document.getElementById('modalTituloFormDetalle').textContent = 'Agregar Detalle';
    document.getElementById('formDetalle').reset();
    document.getElementById('mensajeFormDetalle').classList.add('hidden');
    document.getElementById('modalFormDetalle').classList.add('show');
};

window.editarDetalle = async (detalleId) => {
    try {
        const detalles = await fetchAPI(`${API_BASE}/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${compraActual}`);
        const detalle = detalles.find(d => d.detalleCompraId === detalleId);
        
        if (!detalle) {
            alert('Detalle no encontrado');
            return;
        }
        
        detalleEditando = detalle;
        document.getElementById('modalTituloFormDetalle').textContent = 'Editar Detalle';
        
        // Llenar formulario
        document.getElementById('tipoDetalle').value = detalle.codigoBarraMedicamentoId ? 'medicamento' : 'producto';
        document.getElementById('codigoBarra').value = detalle.codigoBarraMedicamentoId || detalle.codigoBarraProductoId || '';
        document.getElementById('cantidadDetalle').value = detalle.cantidad || 0;
        document.getElementById('loteDetalle').value = detalle.loteMedicamentoId || detalle.loteProductoId || 0;
        
        document.getElementById('mensajeFormDetalle').classList.add('hidden');
        document.getElementById('modalFormDetalle').classList.add('show');
    } catch (error) {
        alert('Error al cargar detalle: ' + error.message);
    }
};

window.eliminarDetalle = async (detalleId) => {
    if (!confirm(`¿Eliminar el detalle #${detalleId}?`)) return;

    try {
        await fetchAPI(`${API_BASE}/DetalleCompra/borrar_detalle_compra?id=${detalleId}`, {
            method: 'DELETE'
        });
        
        // Recargar detalles
        await cargarDetalles();
        
        // Mensaje temporal
        const mensaje = document.createElement('div');
        mensaje.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[2000]';
        mensaje.textContent = '✓ Detalle eliminado correctamente';
        document.body.appendChild(mensaje);
        setTimeout(() => mensaje.remove(), 2000);
    } catch (error) {
        alert('Error al eliminar detalle: ' + error.message);
    }
};

window.cerrarModalFormDetalle = () => {
    document.getElementById('modalFormDetalle').classList.remove('show');
    document.getElementById('formDetalle').reset();
    detalleEditando = null;
};

// ===== MODAL AGREGAR COMPRA =====
// ===== GESTIÓN DE DETALLES TEMPORALES =====
const renderizarDetallesTemporales = () => {
    const container = document.getElementById('listaDetallesTemp');
    
    if (detallesTemporales.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">No hay detalles agregados. Debe agregar al menos uno para crear la compra.</p>';
        return;
    }
    
    container.innerHTML = detallesTemporales.map((detalle, index) => `
        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between">
            <div class="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Tipo:</span>
                    <span class="font-semibold ml-1">${detalle.tipo === 'medicamento' ? '💊 Med' : '🛍️ Prod'}</span>
                </div>
                <div>
                    <span class="text-gray-500">Código:</span>
                    <span class="font-semibold ml-1">${detalle.codigoBarra}</span>
                </div>
                <div>
                    <span class="text-gray-500">Cant:</span>
                    <span class="font-semibold ml-1">${detalle.cantidad}</span>
                </div>
            </div>
            <button type="button" onclick="eliminarDetalleTemp(${index})" class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">✕</button>
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
    
    const detalle = {
        tipo: tipo,
        codigoBarra: codigoBarra,
        cantidad: cantidad,
        lote: lote,
        // Si es producto: loteProductoId tiene valor, loteMedicamentoId es null
        loteProductoId: tipo === 'producto' ? lote : null,
        codigoBarraMedicamentoId: tipo === 'medicamento' ? codigoBarra : null,
        codigoBarraProductoId: tipo === 'producto' ? codigoBarra : null,
        // Si es medicamento: loteMedicamentoId tiene valor, loteProductoId es null
        loteMedicamentoId: tipo === 'medicamento' ? lote : null
    };
    
    detallesTemporales.push(detalle);
    renderizarDetallesTemporales();
    
    // Limpiar campos
    document.getElementById('tipoDetalleTemp').value = '';
    document.getElementById('codigoBarraTemp').value = '';
    document.getElementById('cantidadTemp').value = '';
    document.getElementById('loteTemp').value = '0';
};

window.eliminarDetalleTemp = (index) => {
    detallesTemporales.splice(index, 1);
    renderizarDetallesTemporales();
};

window.abrirModalAgregarCompra = async () => {
    document.getElementById('modalTituloCompra').textContent = 'Nueva Compra';
    document.getElementById('formCompra').reset();
    document.getElementById('mensajeFormCompra').classList.add('hidden');
    delete document.getElementById('formCompra').dataset.compraId;
    detallesTemporales = [];
    renderizarDetallesTemporales();
    
    // Llenar selects
    const selSucursal = document.getElementById('sucursalCompra');
    const selProveedor = document.getElementById('proveedorCompra');
    const selEmpleado = document.getElementById('empleadoCompra');
    const selRepartidor = document.getElementById('repartidorCompra');
    
    selSucursal.innerHTML = '<option value="">Seleccionar</option>';
    selProveedor.innerHTML = '<option value="">Seleccionar</option>';
    selEmpleado.innerHTML = '<option value="">Seleccionar</option>';
    selRepartidor.innerHTML = '<option value="">Seleccionar</option>';
    
    sucursalesCache.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.sucursalId;
        opt.textContent = s.descripcion || 'Sin descripción';
        selSucursal.appendChild(opt);
    });
    
    proveedoresCache.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.proveedorId;
        opt.textContent = p.razonSocial || 'Proveedor';
        selProveedor.appendChild(opt);
    });
    
    if (empleadosCache.length === 0) {
        try {
            const empleados = await fetchAPI(`${API_BASE}/Empleado`);
            empleadosCache = Array.isArray(empleados) ? empleados : [];
        } catch (error) {
            console.error('Error cargando empleados:', error);
        }
    }
    
    empleadosCache.forEach(e => {
        const nombreCompleto = `${e.nombreEmpleado || ''} ${e.apellidoEmpleado || ''}`.trim() || 'Empleado';
        const opt = document.createElement('option');
        opt.value = e.empleadoId;
        opt.textContent = nombreCompleto;
        selEmpleado.appendChild(opt);
    });
    
    if (repartidoresCache.length === 0) {
        try {
            const repartidores = await fetchAPI(`${API_BASE}/Repartidor`);
            repartidoresCache = Array.isArray(repartidores) ? repartidores : [];
        } catch (error) {
            console.error('Error cargando repartidores:', error);
        }
    }
    
    repartidoresCache.forEach(r => {
        const nombreCompleto = `${r.nombreRepartidor || ''} ${r.apellidoRepartidor || ''}`.trim() || 'Repartidor';
        const opt = document.createElement('option');
        opt.value = r.repartidorId;
        opt.textContent = nombreCompleto;
        selRepartidor.appendChild(opt);
    });
    
    // Fecha por defecto: hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaCompra').value = hoy;
    
    // Mostrar sección de detalles temporales
    document.getElementById('seccionDetallesTemp').classList.remove('hidden');
    
    document.getElementById('modalCompra').classList.add('show');
};

// ===== EDITAR COMPRA =====
const editarCompra = async (id) => {
    const compra = todasCompras.find(c => (c.compraId || c.id) === id);
    if (!compra) {
        alert('Compra no encontrada');
        return;
    }

    // Cargar datos del modal
    document.getElementById('modalTituloCompra').textContent = 'Editar Compra';
    
    // Llenar selects del formulario
    const selSucursal = document.getElementById('sucursalCompra');
    const selProveedor = document.getElementById('proveedorCompra');
    const selEmpleado = document.getElementById('empleadoCompra');
    
    // Limpiar opciones existentes excepto la primera
    selSucursal.innerHTML = '<option value="">Seleccionar</option>';
    selProveedor.innerHTML = '<option value="">Seleccionar</option>';
    selEmpleado.innerHTML = '<option value="">Seleccionar</option>';
    
    // Llenar sucursales
    sucursalesCache.forEach(s => {
        const descripcion = s.descripcion || 'Sin descripción';
        const sucId = s.sucursalId;
        const opt = document.createElement('option');
        opt.value = sucId;
        opt.textContent = descripcion;
        selSucursal.appendChild(opt);
    });
    
    // Llenar proveedores
    proveedoresCache.forEach(p => {
        const razon = p.razonSocial || 'Proveedor';
        const provId = p.proveedorId;
        const opt = document.createElement('option');
        opt.value = provId;
        opt.textContent = razon;
        selProveedor.appendChild(opt);
    });
    
    // Llenar empleados
    console.log('Empleados cache:', empleadosCache); // Debug
    if (empleadosCache.length === 0) {
        console.warn('No hay empleados cargados, intentando cargar...');
        try {
            const empleados = await fetchAPI(`${API_BASE}/Empleado`);
            empleadosCache = Array.isArray(empleados) ? empleados : [];
            console.log('Empleados cargados dinámicamente:', empleadosCache.length);
        } catch (error) {
            console.error('Error cargando empleados:', error);
        }
    }
    
    empleadosCache.forEach(e => {
        console.log('Empleado:', e); // Debug
        const nombreCompleto = `${e.nombreEmpleado || ''} ${e.apellidoEmpleado || ''}`.trim() || 'Empleado';
        const empId = e.empleadoId;
        const opt = document.createElement('option');
        opt.value = empId;
        opt.textContent = nombreCompleto;
        selEmpleado.appendChild(opt);
    });
    
    // Llenar repartidores
    const selRepartidor = document.getElementById('repartidorCompra');
    selRepartidor.innerHTML = '<option value="">Seleccionar</option>';
    
    if (repartidoresCache.length === 0) {
        try {
            const repartidores = await fetchAPI(`${API_BASE}/Repartidor`);
            repartidoresCache = Array.isArray(repartidores) ? repartidores : [];
        } catch (error) {
            console.error('Error cargando repartidores:', error);
        }
    }
    
    repartidoresCache.forEach(r => {
        const nombreCompleto = `${r.nombreRepartidor || ''} ${r.apellidoRepartidor || ''}`.trim() || 'Repartidor';
        const opt = document.createElement('option');
        opt.value = r.repartidorId;
        opt.textContent = nombreCompleto;
        selRepartidor.appendChild(opt);
    });
    
    // Setear valores actuales
    document.getElementById('fechaCompra').value = new Date(compra.fechaCompra || compra.fechaFactura).toISOString().split('T')[0];
    selSucursal.value = compra.sucursalId || '';
    selProveedor.value = compra.proveedorId || '';
    selEmpleado.value = compra.empleadoId || '';
    
    // Guardar ID de compra para el submit
    document.getElementById('formCompra').dataset.compraId = id;
    
    // Ocultar sección de detalles temporales (solo para crear)
    document.getElementById('seccionDetallesTemp').classList.add('hidden');
    
    // Mostrar modal
    document.getElementById('modalCompra').classList.add('show');
};

window.editarCompra = editarCompra;

// ===== CERRAR MODAL =====
const cerrarModalCompra = () => {
    document.getElementById('modalCompra').classList.remove('show');
    document.getElementById('formCompra').reset();
    delete document.getElementById('formCompra').dataset.compraId;
    detallesTemporales = [];
    document.getElementById('seccionDetallesTemp').classList.add('hidden');
};

window.cerrarModalCompra = cerrarModalCompra;

// ===== GUARDAR COMPRA =====
const guardarCompra = async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const compraId = form.dataset.compraId;
    const mensajeForm = document.getElementById('mensajeFormCompra');
    
    const fechaInput = document.getElementById('fechaCompra').value;
    const sucursalId = parseInt(document.getElementById('sucursalCompra').value);
    const proveedorId = parseInt(document.getElementById('proveedorCompra').value);
    const empleadoId = parseInt(document.getElementById('empleadoCompra').value);
    const repartidorId = parseInt(document.getElementById('repartidorCompra').value) || 0;
    
    if (!sucursalId || !proveedorId || !empleadoId) {
        mensajeForm.textContent = 'Sucursal, Proveedor y Empleado son requeridos';
        mensajeForm.className = 'p-4 rounded-lg bg-red-100 text-red-800';
        mensajeForm.classList.remove('hidden');
        return;
    }
    
    // Validar detalles al crear nueva compra
    if (!compraId && detallesTemporales.length === 0) {
        mensajeForm.textContent = 'Debes agregar al menos un detalle a la compra';
        mensajeForm.className = 'p-4 rounded-lg bg-red-100 text-red-800';
        mensajeForm.classList.remove('hidden');
        return;
    }
    
    const payload = {
        fechaCompra: fechaInput + 'T18:30:00',  
        empleadoId: empleadoId,
        proveedorId: proveedorId,
        repartidorId: repartidorId,
        sucursalId: sucursalId,
        activo: true,
        DetallesCompras: []
    };
    
    // Si estamos editando, obtener detalles existentes
    if (compraId) {
        try {
            const detalles = await fetchAPI(`${API_BASE}/DetalleCompra/obtener_detalle_compra_por_id?idCompra=${compraId}`);
            if (Array.isArray(detalles)) {
                payload.DetallesCompras = detalles.map(d => ({
                    loteProductoId: d.loteProductoId || 0,
                    codigoBarraMedicamentoId: d.codigoBarraMedicamentoId || null,
                    codigoBarraProductoId: d.codigoBarraProductoId || null,
                    cantidad: d.cantidad || 0,
                    loteMedicamentoId: d.loteMedicamentoId || 0
                }));
            }
        } catch (error) {
            console.error('Error cargando detalles:', error);
        }
    } else {
        // Si estamos creando, usar detalles temporales
        payload.detallesCompraDtoLts = detallesTemporales.map(d => ({
            loteProductoId: d.loteProductoId === null ? null : (d.loteProductoId || 0),
            codigoBarraMedicamentoId: d.codigoBarraMedicamentoId,
            codigoBarraProductoId: d.codigoBarraProductoId,
            cantidad: d.cantidad,
            loteMedicamentoId: d.loteMedicamentoId === null ? null : (d.loteMedicamentoId || 0)
        }));
    }
    
    try {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Guardando...';
        
        console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
        
        let nuevaCompraId = null;
        
        if (compraId) {
            // ACTUALIZAR
            console.log('Actualizando compra ID:', compraId);
            await fetchAPI(`${API_BASE}/Compra/actulizar_maestro_detalle?id=${compraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            mensajeForm.textContent = '✓ Compra actualizada correctamente';
            
            await cargarCompras();
            setTimeout(() => cerrarModalCompra(), 1500);
        } else {
            // INSERTAR
            console.log('Insertando nueva compra');
            const resultado = await fetchAPI(`${API_BASE}/Compra/insertar_maestro_detalle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Resultado de inserción:', resultado);
            
            // El API puede devolver el ID de la compra creada
            nuevaCompraId = resultado.idCompra || resultado.compraId || resultado.id;
            
            mensajeForm.textContent = '✓ Compra creada correctamente. Ahora agrega los detalles...';
            mensajeForm.className = 'p-4 rounded-lg bg-green-100 text-green-800';
            mensajeForm.classList.remove('hidden');
            
            await cargarCompras();
            
            // Cerrar modal de compra y abrir modal de detalles
            setTimeout(() => {
                cerrarModalCompra();
                
                // Si obtuvimos el ID, abrir directamente el modal de detalles
                if (nuevaCompraId) {
                    compraActual = nuevaCompraId;
                    verDetalleCompra(nuevaCompraId);
                } else {
                    // Si no, mostrar mensaje para que el usuario haga click en la compra
                    const aviso = document.createElement('div');
                    aviso.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-[2000]';
                    aviso.textContent = 'Compra creada. Haz click en ella para agregar detalles.';
                    document.body.appendChild(aviso);
                    setTimeout(() => aviso.remove(), 4000);
                }
            }, 1000);
        }
        
        mensajeForm.className = 'p-4 rounded-lg bg-green-100 text-green-800';
        mensajeForm.classList.remove('hidden');
    } catch (error) {
        console.error('Error completo:', error);
        mensajeForm.textContent = 'Error: ' + error.message;
        mensajeForm.className = 'p-4 rounded-lg bg-red-100 text-red-800';
        mensajeForm.classList.remove('hidden');
    } finally {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
};

document.getElementById('formCompra').addEventListener('submit', guardarCompra);

// ===== GUARDAR DETALLE =====
document.getElementById('formDetalle').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!compraActual) {
        alert('No hay compra seleccionada');
        return;
    }
    
    const tipo = document.getElementById('tipoDetalle').value;
    const codigoBarra = document.getElementById('codigoBarra').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadDetalle').value);
    const lote = parseInt(document.getElementById('loteDetalle').value) || 0;
    const mensajeForm = document.getElementById('mensajeFormDetalle');
    
    const payload = {
        loteProductoId: tipo === 'producto' ? lote : 0,
        codigoBarraMedicamentoId: tipo === 'medicamento' ? codigoBarra : null,
        codigoBarraProductoId: tipo === 'producto' ? codigoBarra : null,
        cantidad: cantidad,
        loteMedicamentoId: tipo === 'medicamento' ? lote : 0
    };
    
    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Guardando...';
        
        if (detalleEditando) {
            // ACTUALIZAR
            await fetchAPI(`${API_BASE}/DetalleCompra/actualizar_detalle_compra?id=${detalleEditando.detalleCompraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            mensajeForm.textContent = '✓ Detalle actualizado correctamente';
        } else {
            // INSERTAR
            await fetchAPI(`${API_BASE}/DetalleCompra/insertar_detalle_compra?idCompra=${compraActual}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            mensajeForm.textContent = '✓ Detalle agregado correctamente';
        }
        
        mensajeForm.className = 'p-4 rounded-lg bg-green-100 text-green-800';
        mensajeForm.classList.remove('hidden');
        
        await cargarDetalles();
        setTimeout(() => cerrarModalFormDetalle(), 1500);
    } catch (error) {
        mensajeForm.textContent = 'Error: ' + error.message;
        mensajeForm.className = 'p-4 rounded-lg bg-red-100 text-red-800';
        mensajeForm.classList.remove('hidden');
    } finally {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
});

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