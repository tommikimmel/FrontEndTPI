//Cargar Facturacion
const fecha = new Date();
const diaActual = fecha.getDate();
const mesActual = fecha.getMonth() + 1;
const añoActual = fecha.getFullYear();

const gananciaDiaria = document.getElementById("gananciaDiaria");
const gananciaMensual = document.getElementById("gananciaMensual");
const gananciaAnual = document.getElementById("gananciaAnual");

function cargarFacturacion() {
    //Cargar facturacion diaria
    fetch(`https://localhost:7013/api/Factura/obtener_ganancia?dia=${diaActual}&mes=${mesActual}&anio=${añoActual}`)
        .then(response => response.json())
        .then(data => {
            gananciaDiaria.textContent = `$${data.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        });
    //Cargar facturacion mensual
    fetch(`https://localhost:7013/api/Factura/obtener_ganancia?mes=${mesActual}&anio=${añoActual}`)
        .then(response => response.json())
        .then(data => {
            gananciaMensual.textContent = `$${data.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        });
    //Cargar facturacion anual
    fetch(`https://localhost:7013/api/Factura/obtener_ganancia?anio=${añoActual}`)
        .then(response => response.json())
        .then(data => {
            gananciaAnual.textContent = `$${data.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })  }`;
        });
}
cargarFacturacion();




const filtroAñoGrafico = document.getElementById("filtroAñoGrafico");
let graficoFacturacion = null;

async function cargarGraficoFacturacion() {

    const añoSeleccionado = filtroAñoGrafico.value;

    const res = await fetch(`https://localhost:7013/api/Factura/obtener_ganancias_mensuales?anio=${añoSeleccionado}`);
    let data = await res.json();

    data = data.reverse();

    const nombresMeses = ["N/A", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const labels = data.map(x => nombresMeses[x.mes]);
    const valores = data.map(x => x.importe);

    const ctx = document.getElementById("graficoFacturacion");

    // 🔥 destruimos el gráfico si ya existe, así no se superponen
    if (graficoFacturacion) {
        graficoFacturacion.destroy();
    }

    graficoFacturacion = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `Ganancias mensuales ${añoSeleccionado}`,
                data: valores,
                backgroundColor: "#446D9E"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

filtroAñoGrafico.addEventListener("change", cargarGraficoFacturacion);
cargarGraficoFacturacion();