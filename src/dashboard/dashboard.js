// ===== CONFIGURACIÓN =====
const API_BASE = 'https://localhost:7013/api';
const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Formato de moneda argentino
const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(valor);
};

// ===== MANEJO DE ERRORES =====
const manejarError = (error, contexto) => {
    console.error(`Error en ${contexto}:`, error);
    return null;
};

// ===== UTILIDAD FETCH CON MANEJO DE ERRORES =====
const obtenerDatos = async (url, contexto, esTexto = false) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return esTexto ? await response.text() : await response.json();
    } catch (error) {
        manejarError(error, contexto);
        return null;
    }
};

// ===== FACTURACIÓN DIARIA =====
const cargarFacturacionDiaria = async () => {
    const fecha = new Date();
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    const facturacionEl = document.getElementById('facturacionDiaria');
    
    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_ganancia?dia=${dia}&mes=${mes}&anio=${anio}`,
        'Facturación Diaria',
        true
    );

    if (data !== null) {
        facturacionEl.textContent = formatearMoneda(parseFloat(data));
    } else {
        facturacionEl.innerHTML = '<span class="text-red-500 text-sm">Error</span>';
    }
};

// ===== CANTIDAD DE VENTAS =====
const cargarCantidadVentas = async () => {
    const cantidadVentasEl = document.getElementById('cantidadVentas');
    cantidadVentasEl.textContent = '230';
};

// ===== PRODUCTOS TOP =====
const cargarProductosTop = async () => {
    const container = document.getElementById('contProductosTop');
    container.innerHTML = '<li class="flex justify-center py-4"><div class="spinner"></div></li>';

    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_producto_top`,
        'Productos Top'
    );

    if (!data || data.length === 0) {
        container.innerHTML = '<li class="text-center text-gray-500 py-4">No hay datos</li>';
        return;
    }

    container.innerHTML = data.map((producto, index) => `
        <li class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold text-gray-400">#${index + 1}</span>
                    <div>
                        <p class="font-semibold text-gray-800">${producto.nombre || producto.codigoDeBarra}</p>
                        <p class="text-xs text-gray-500">Código: ${producto.codigoDeBarra}</p>
                    </div>
                </div>
                <span class="bg-[#446D9E] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ${producto.cantidadVendidaTotal} ventas
                </span>
            </div>
            <div class="text-xs text-gray-600 mt-2">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${producto.sucursal}</span>
            </div>
        </li>
    `).join('');
};

// ===== MEDICAMENTOS TOP =====
const cargarMedicamentosTop = async () => {
    const container = document.getElementById('contMedicamentosTop');
    container.innerHTML = '<li class="flex justify-center py-4"><div class="spinner"></div></li>';

    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_medicamento_top`,
        'Medicamentos Top'
    );

    if (!data || data.length === 0) {
        container.innerHTML = '<li class="text-center text-gray-500 py-4">No hay datos</li>';
        return;
    }

    container.innerHTML = data.map((medicamento, index) => `
        <li class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold text-gray-400">#${index + 1}</span>
                    <div>
                        <p class="font-semibold text-gray-800">${medicamento.nombre || medicamento.codigoDeBarra}</p>
                        <p class="text-xs text-gray-500">Código: ${medicamento.codigoDeBarra}</p>
                    </div>
                </div>
                <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ${medicamento.cantidadVendidaTotal} ventas
                </span>
            </div>
            <div class="text-xs text-gray-600 mt-2">
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">${medicamento.sucursal}</span>
            </div>
        </li>
    `).join('');
};

// ===== GRÁFICO DE BARRAS - GANANCIAS =====
let chartGanancias = null;

const cargarGraficoGanancias = async () => {
    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_ganancias_mensuales`,
        'Gráfico Ganancias'
    );

    if (!data || data.length === 0) return;

    const datosOrdenados = [...data].reverse();
    const labels = datosOrdenados.map(x => MESES[x.mes]);
    const valores = datosOrdenados.map(x => x.importe);

    const ctx = document.getElementById('graficoGanancias');
    
    if (chartGanancias) chartGanancias.destroy();

    chartGanancias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ganancias ($)',
                data: valores,
                backgroundColor: '#446D9E',
                borderRadius: 8,
                borderWidth: 2,
                borderColor: '#3B5B8C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => `Ganancia: ${formatearMoneda(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => formatearMoneda(value) },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
};

// ===== GRÁFICO DE TORTA - MÉTODOS DE PAGO =====
let chartMetodosPago = null;

const cargarGraficoMetodosPago = async () => {
    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_metodo_pago_utilizado`,
        'Métodos de Pago'
    );

    if (!data || data.length === 0) return;

    const labels = data.map(x => x.metodO_PAGO);
    const valores = data.map(x => x.cantidadMPUsado);

    const colores = ['#446D9E', '#3B5B8C', '#5A8BC4', '#7BA3D6', '#9CBBE8', '#003366', '#004C99', '#0066CC', '#3399FF', '#66B2FF'];

    const ctx = document.getElementById('graficoMetodosPago');
    
    if (chartMetodosPago) chartMetodosPago.destroy();

    chartMetodosPago = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: colores.slice(0, labels.length),
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 }, usePointStyle: true }
                }
            }
        }
    });
};

// ===== GRÁFICO DE TORTA - SUCURSALES =====
let chartSucursales = null;

const cargarGraficoSucursales = async () => {
    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_ventas_por_sucursal`,
        'Ventas por Sucursal'
    );

    if (!data || data.length === 0) return;

    const labels = data.map(x => x.sucursal);
    const valores = data.map(x => x.cantidadSucursal);

    const colores = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#84cc16', '#65a30d', '#4d7c0f'];

    const ctx = document.getElementById('graficoSucursales');
    
    if (chartSucursales) chartSucursales.destroy();

    chartSucursales = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: colores.slice(0, labels.length),
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 }, usePointStyle: true }
                }
            }
        }
    });
};

// ===== INICIALIZACIÓN =====
(async () => {
    await Promise.all([
        cargarFacturacionDiaria(),
        cargarCantidadVentas(),
        cargarProductosTop(),
        cargarMedicamentosTop(),
        cargarGraficoGanancias(),
        cargarGraficoMetodosPago(),
        cargarGraficoSucursales()
    ]);
})();