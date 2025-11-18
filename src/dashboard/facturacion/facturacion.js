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

// ===== OBTENER FECHA ACTUAL =====
const obtenerFechaActual = () => {
    const fecha = new Date();
    return {
        dia: fecha.getDate(),
        mes: fecha.getMonth() + 1,
        anio: fecha.getFullYear()
    };
};

// ===== CARGAR FACTURACIÓN =====
const cargarFacturacion = async () => {
    const { dia, mes, anio } = obtenerFechaActual();

    const gananciaDiariaEl = document.getElementById('gananciaDiaria');
    const gananciaMensualEl = document.getElementById('gananciaMensual');
    const gananciaAnualEl = document.getElementById('gananciaAnual');

    // Cargar las tres ganancias en paralelo
    const [diaria, mensual, anual] = await Promise.all([
        obtenerDatos(`${API_BASE}/Factura/obtener_ganancia?dia=${dia}&mes=${mes}&anio=${anio}`, 'Ganancia Diaria', true),
        obtenerDatos(`${API_BASE}/Factura/obtener_ganancia?mes=${mes}&anio=${anio}`, 'Ganancia Mensual', true),
        obtenerDatos(`${API_BASE}/Factura/obtener_ganancia?anio=${anio}`, 'Ganancia Anual', true)
    ]);

    // Actualizar Ganancia Diaria
    if (diaria !== null) {
        gananciaDiariaEl.textContent = formatearMoneda(parseFloat(diaria));
    } else {
        gananciaDiariaEl.innerHTML = '<span class="text-red-500 text-sm">Error</span>';
    }

    // Actualizar Ganancia Mensual
    if (mensual !== null) {
        gananciaMensualEl.textContent = formatearMoneda(parseFloat(mensual));
    } else {
        gananciaMensualEl.innerHTML = '<span class="text-red-500 text-sm">Error</span>';
    }

    // Actualizar Ganancia Anual
    if (anual !== null) {
        gananciaAnualEl.textContent = formatearMoneda(parseFloat(anual));
    } else {
        gananciaAnualEl.innerHTML = '<span class="text-red-500 text-sm">Error</span>';
    }
};

// ===== GRÁFICO DE FACTURACIÓN =====
let chartFacturacion = null;

const cargarGraficoFacturacion = async () => {
    const filtroAñoGrafico = document.getElementById('filtroAñoGrafico');
    const añoSeleccionado = filtroAñoGrafico.value;

    const data = await obtenerDatos(
        `${API_BASE}/Factura/obtener_ganancias_mensuales?anio=${añoSeleccionado}`,
        'Gráfico Facturación'
    );

    if (!data || data.length === 0) {
        console.warn('No hay datos para mostrar en el gráfico');
        return;
    }

    const datosOrdenados = [...data].reverse();
    const labels = datosOrdenados.map(x => MESES[x.mes] || `Mes ${x.mes}`);
    const valores = datosOrdenados.map(x => x.importe);

    const ctx = document.getElementById('graficoFacturacion');

    // Destruir gráfico anterior si existe
    if (chartFacturacion) {
        chartFacturacion.destroy();
    }

    chartFacturacion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Ganancias ${añoSeleccionado}`,
                data: valores,
                backgroundColor: '#446D9E',
                borderRadius: 8,
                borderWidth: 2,
                borderColor: '#3B5B8C',
                hoverBackgroundColor: '#3B5B8C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: 'bold' },
                        color: '#2E2E2E'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: (context) => `Ganancia: ${formatearMoneda(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatearMoneda(value),
                        font: { size: 12 },
                        color: '#6B7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12 },
                        color: '#6B7280'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
};

// ===== EVENT LISTENER PARA CAMBIO DE AÑO =====
const inicializarFiltros = () => {
    const filtroAñoGrafico = document.getElementById('filtroAñoGrafico');
    
    if (filtroAñoGrafico) {
        filtroAñoGrafico.addEventListener('change', cargarGraficoFacturacion);
    }
};

// ===== INICIALIZACIÓN =====
(async () => {
    // Cargar datos iniciales
    await Promise.all([
        cargarFacturacion(),
        cargarGraficoFacturacion()
    ]);

    // Inicializar event listeners
    inicializarFiltros();
})();