// ===== ELIMINAR PROVEEDOR =====
window.eliminarProveedor = async (cuit) => {
    const cuitLimpio = limpiarCUIT(cuit);
    
    console.log('=== INTENTANDO ELIMINAR ===');
    console.log('CUIT recibido:', cuit);
    console.log('CUIT limpio:', cuitLimpio);
    console.log('Longitud CUIT:', cuitLimpio.length);
    console.log('Es solo números?', /^\d+$/.test(cuitLimpio));
    
    // Buscar el proveedor para mostrar su nombre en la confirmación
    const proveedor = todosProveedores.find(p => limpiarCUIT(p.cuit) === cuitLimpio);
    console.log('Proveedor encontrado:', proveedor);
    
    const nombreProveedor = proveedor ? proveedor.razonSocial : `CUIT ${formatearCUIT(cuitLimpio)}`;
    
    if (!confirm(`¿Está seguro de eliminar el proveedor "${nombreProveedor}"?\n\nEsta acción no se puede deshacer.`)) {
        console.log('Usuario canceló la eliminación');
        return;
    }

    try {
        // Mostrar loading en el botón
        const botonEliminar = event.target.closest('button');
        const textoOriginal = botonEliminar.innerHTML;
        botonEliminar.disabled = true;
        botonEliminar.innerHTML = '<div class="spinner mx-auto" style="width: 20px; height: 20px; border-width: 2px;"></div>';

        const url = `${API_BASE}/Proveedor/borrar_proveedor?cuit=${cuitLimpio}`;
        console.log('URL DELETE completa:', url);

        // DELETE simple con query parameter
        const response = await fetch(url, {
            method: 'DELETE'
        });

        console.log('Status de respuesta:', response.status);
        console.log('OK?:', response.ok);
        
        // Intentar leer la respuesta
        const contentType = response.headers.get('content-type');
        console.log('Content-Type de respuesta:', contentType);
        
        let responseData;
        try {
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
            console.log('Respuesta del servidor:', responseData);
        } catch (e) {
            console.log('No se pudo leer el body de la respuesta:', e);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        alert(`Error al eliminar proveedor:\n${error.message}`);
        console.error('Error completo:', error);
    }
};
// ===== CONFIGURACIÓN =====
const API_BASE = 'https://localhost:7013/api';

let todosProveedores = [];
let proveedorEditando = null;

// ===== ELEMENTOS DOM =====
const elementos = {
    contenedor: document.getElementById('contProveedores'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    buscar: document.getElementById('buscarProveedor'),
    modal: document.getElementById('modalProveedor'),
    modalTitulo: document.getElementById('modalTitulo'),
    form: document.getElementById('formProveedor'),
    mensajeForm: document.getElementById('mensajeFormulario'),
    // Campos del formulario
    razonSocial: document.getElementById('razonSocial'),
    cuit: document.getElementById('cuit'),
    direccion: document.getElementById('direccion'),
    telefono: document.getElementById('telefono'),
    email: document.getElementById('email')
};

// ===== UTILIDADES =====
const obtenerDatos = async (url, opciones = {}) => {
    try {
        const response = await fetch(url, opciones);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        // Intentar parsear como JSON, si falla devolver texto
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};

const mostrarMensaje = (mensaje, tipo = 'success') => {
    elementos.mensajeForm.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
    
    if (tipo === 'success') {
        elementos.mensajeForm.classList.add('bg-green-100', 'text-green-800');
    } else {
        elementos.mensajeForm.classList.add('bg-red-100', 'text-red-800');
    }
    
    elementos.mensajeForm.textContent = mensaje;
    elementos.mensajeForm.classList.remove('hidden');
    
    setTimeout(() => {
        elementos.mensajeForm.classList.add('hidden');
    }, 5000);
};

// ===== MODAL =====
window.abrirModalAgregar = () => {
    proveedorEditando = null;
    elementos.modalTitulo.textContent = 'Agregar Proveedor';
    elementos.form.reset();
    elementos.mensajeForm.classList.add('hidden');
    elementos.cuit.readOnly = false;
    elementos.cuit.classList.remove('bg-gray-100', 'cursor-not-allowed');
    elementos.modal.classList.add('show');
};

window.abrirModalEditar = (proveedor) => {
    proveedorEditando = proveedor;
    elementos.modalTitulo.textContent = 'Editar Proveedor';
    
    // Llenar campos con datos actuales
    elementos.razonSocial.value = proveedor.razonSocial || '';
    elementos.cuit.value = limpiarCUIT(proveedor.cuit) || '';
    elementos.direccion.value = proveedor.direccionProveedor || '';
    elementos.telefono.value = proveedor.telefonoProveedor || '';
    elementos.email.value = proveedor.emailProveedor || '';
    
    // NO deshabilitar CUIT - necesitamos enviarlo
    elementos.cuit.readOnly = true; // Solo hacerlo de solo lectura visualmente
    elementos.cuit.classList.add('bg-gray-100', 'cursor-not-allowed');
    
    elementos.mensajeForm.classList.add('hidden');
    elementos.modal.classList.add('show');
};

window.cerrarModal = () => {
    elementos.modal.classList.remove('show');
    elementos.form.reset();
    elementos.cuit.readOnly = false;
    elementos.cuit.classList.remove('bg-gray-100', 'cursor-not-allowed');
    proveedorEditando = null;
};

// Cerrar modal al hacer click fuera
elementos.modal.addEventListener('click', (e) => {
    if (e.target === elementos.modal) {
        cerrarModal();
    }
});

// ===== CARGAR PROVEEDORES =====
const cargarProveedores = async () => {
    elementos.loadingState.classList.remove('hidden');
    elementos.contenedor.classList.add('hidden');
    elementos.emptyState.classList.add('hidden');

    try {
        const datos = await obtenerDatos(`${API_BASE}/Proveedor/obtener_proveedores`);
        
        if (!datos || !Array.isArray(datos)) {
            throw new Error('Datos inválidos');
        }

        // Filtrar solo proveedores activos
        todosProveedores = datos.filter(p => p.activo !== false);
        renderizarProveedores(todosProveedores);
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        elementos.loadingState.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
    }
};

// ===== LIMPIAR CUIT (quitar guiones) =====
const limpiarCUIT = (cuit) => {
    if (!cuit) return '';
    return cuit.toString().replace(/-/g, '');
};

// ===== FORMATEAR CUIT =====
const formatearCUIT = (cuit) => {
    if (!cuit) return 'Sin CUIT';
    const cuitLimpio = limpiarCUIT(cuit);
    if (cuitLimpio.length === 11) {
        return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`;
    }
    return cuit;
};

// ===== RENDERIZAR PROVEEDORES =====
const renderizarProveedores = (proveedores) => {
    elementos.loadingState.classList.add('hidden');
    
    if (!proveedores || proveedores.length === 0) {
        elementos.contenedor.classList.add('hidden');
        elementos.emptyState.classList.remove('hidden');
        return;
    }

    elementos.contenedor.classList.remove('hidden');
    elementos.emptyState.classList.add('hidden');
    
    elementos.contenedor.innerHTML = proveedores.map(proveedor => {
        const cuitLimpio = limpiarCUIT(proveedor.cuit);
        return `
        <div class="proveedor-card bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div class="flex flex-col h-full">
                <!-- Icono -->
                <div class="text-center mb-4">
                    <div class="w-16 h-16 mx-auto bg-[#446D9E] rounded-full flex items-center justify-center">
                        <span class="text-3xl text-white">🏢</span>
                    </div>
                </div>

                <!-- Información -->
                <div class="flex-1 space-y-3 mb-4">
                    <div class="text-center">
                        <h3 class="text-lg font-bold text-gray-800 mb-1 line-clamp-2">${proveedor.razonSocial || 'Sin nombre'}</h3>
                        <p class="text-sm text-gray-600 font-mono">${formatearCUIT(proveedor.cuit)}</p>
                    </div>

                    <div class="space-y-2 text-sm">
                        <div class="flex items-start gap-2">
                            <span class="text-gray-400 flex-shrink-0">📍</span>
                            <p class="text-gray-600 line-clamp-2">${proveedor.direccionProveedor || 'Sin dirección'}</p>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400">📞</span>
                            <p class="text-gray-600">${proveedor.telefonoProveedor || 'Sin teléfono'}</p>
                        </div>
                        
                        <div class="flex items-start gap-2">
                            <span class="text-gray-400 flex-shrink-0">📧</span>
                            <p class="text-gray-600 text-xs break-all">${proveedor.emailProveedor || 'Sin email'}</p>
                        </div>
                    </div>
                </div>

                <!-- Botones -->
                <div class="flex gap-2 pt-4 border-t border-gray-200">
                    <button 
                        onclick='editarProveedor(${JSON.stringify(proveedor).replace(/'/g, "&#39;")})' 
                        class="flex-1 bg-[#446D9E] text-white py-2 rounded-lg hover:bg-[#3B5B8C] transition-all font-semibold flex items-center justify-center gap-2"
                        title="Editar"
                    >
                        <span>✏️</span>
                        <span>Editar</span>
                    </button>
                    <button 
                        onclick="eliminarProveedor('${cuitLimpio}')" 
                        class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-all font-semibold flex items-center justify-center gap-2"
                        title="Eliminar"
                    >
                        <span>🗑️</span>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
};

// ===== BUSCAR PROVEEDORES =====
elementos.buscar.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase().trim();
    
    if (!termino) {
        renderizarProveedores(todosProveedores);
        return;
    }

    const filtrados = todosProveedores.filter(proveedor => {
        const razonSocial = (proveedor.razonSocial || '').toLowerCase();
        const cuit = limpiarCUIT(proveedor.cuit);
        return razonSocial.includes(termino) || cuit.includes(termino);
    });

    renderizarProveedores(filtrados);
});

// ===== EDITAR PROVEEDOR =====
window.editarProveedor = (proveedor) => {
    abrirModalEditar(proveedor);
};

// ===== ELIMINAR PROVEEDOR =====
window.eliminarProveedor = async (cuit) => {
    const cuitLimpio = limpiarCUIT(cuit);
    
    // Buscar el proveedor para mostrar su nombre en la confirmación
    const proveedor = todosProveedores.find(p => limpiarCUIT(p.cuit) === cuitLimpio);
    const nombreProveedor = proveedor ? proveedor.razonSocial : `CUIT ${formatearCUIT(cuitLimpio)}`;
    
    if (!confirm(`¿Está seguro de eliminar el proveedor "${nombreProveedor}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        // Mostrar loading en el botón
        const botonEliminar = event.target.closest('button');
        const textoOriginal = botonEliminar.innerHTML;
        botonEliminar.disabled = true;
        botonEliminar.innerHTML = '<div class="spinner mx-auto" style="width: 20px; height: 20px; border-width: 2px;"></div>';

        console.log('Eliminando proveedor con CUIT:', cuitLimpio);
        console.log('URL:', `${API_BASE}/Proveedor/borrar_proveedor?cuit=${cuitLimpio}`);

        // DELETE simple con query parameter
        const response = await fetch(`${API_BASE}/Proveedor/borrar_proveedor?cuit=${cuitLimpio}`, {
            method: 'DELETE'
        });

        console.log('Status de respuesta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(errorText || `Error ${response.status}`);
        }

        // Recargar proveedores
        await cargarProveedores();
        
        // Mostrar mensaje de éxito temporal
        const mensaje = document.createElement('div');
        mensaje.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        mensaje.textContent = '✓ Proveedor eliminado correctamente';
        document.body.appendChild(mensaje);
        
        setTimeout(() => {
            mensaje.remove();
        }, 3000);

    } catch (error) {
        alert(`Error al eliminar proveedor:\n${error.message}`);
        console.error('Error completo:', error);
        
        // Restaurar botón si hay error
        const botonEliminar = document.querySelector(`button[onclick*="${cuitLimpio}"]`);
        if (botonEliminar) {
            botonEliminar.disabled = false;
            botonEliminar.innerHTML = '<span>🗑️</span><span>Eliminar</span>';
        }
    }
};

// ===== GUARDAR PROVEEDOR (AGREGAR O EDITAR) =====
elementos.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cuitLimpio = limpiarCUIT(elementos.cuit.value);

    // Objeto con estructura EXACTA del API
    const proveedor = {
        proveedorId: 0,
        razonSocial: elementos.razonSocial.value.trim(),
        cuit: cuitLimpio,
        direccionProveedor: elementos.direccion.value.trim(),
        telefonoProveedor: elementos.telefono.value.trim(),
        emailProveedor: elementos.email.value.trim(),
        activo: true
    };

    // Validar CUIT (11 dígitos sin guiones)
    if (!/^\d{11}$/.test(proveedor.cuit)) {
        mostrarMensaje('El CUIT debe tener exactamente 11 dígitos', 'error');
        return;
    }

    // Log para debug
    console.log('Datos a enviar:', JSON.stringify(proveedor, null, 2));

    try {
        // Deshabilitar botón submit
        const btnSubmit = elementos.form.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<div class="spinner mx-auto" style="width: 20px; height: 20px; border-width: 2px;"></div>';

        if (proveedorEditando) {
            // ACTUALIZAR (PUT) - actualizar_proveedor con query parameter
            console.log('Actualizando proveedor con CUIT:', proveedor.cuit);
            const url = `${API_BASE}/Proveedor/actualizar_proveedor?cuit=${cuitLimpio}`;
            console.log('URL:', url);
            console.log('Payload:', JSON.stringify(proveedor, null, 2));
            
            const resultado = await obtenerDatos(
                url,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(proveedor)
                }
            );
            console.log('Respuesta del servidor:', resultado);
            mostrarMensaje('✓ Proveedor actualizado correctamente', 'success');
        } else {
            // INSERTAR (POST) - insert_proveedor
            console.log('Insertando nuevo proveedor');
            const resultado = await obtenerDatos(
                `${API_BASE}/Proveedor/insert_proveedor`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(proveedor)
                }
            );
            console.log('Respuesta del servidor:', resultado);
            mostrarMensaje('✓ Proveedor agregado correctamente', 'success');
        }

        // Recargar lista
        await cargarProveedores();
        
        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
            cerrarModal();
        }, 1500);

    } catch (error) {
        console.error('Error completo al guardar:', error);
        mostrarMensaje(error.message || 'Error al guardar proveedor', 'error');
    } finally {
        const btnSubmit = elementos.form.querySelector('button[type="submit"]');
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal || 'Guardar Proveedor';
    }
});

// ===== INICIALIZACIÓN =====
(async () => {
    await cargarProveedores();
})();