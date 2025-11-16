//Facturacion  Diaria
const facturacionDiaria = document.getElementById('facturacionDiaria');
const fecha = new Date();
const diaActual = fecha.getDate();              
const mesActual = fecha.getMonth() + 1;                
const añoActual = fecha.getFullYear(); 

fetch(`https://localhost:7013/api/Factura/obtener_ganancia?dia=${diaActual}&mes=${mesActual}&anio=${añoActual}`)
  		.then(response => response.text())   // tomamos texto puro
  		.then(data => {
			facturacionDiaria.textContent = `$${parseFloat(data).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	    });		

//Productos Top
const contProductosTop = document.getElementById('contProductosTop');
fetch('https://localhost:7013/api/Factura/obtener_producto_top')
.then(response => response.json())
.then(data => {
	

	data.forEach(producto => {
		const li = document.createElement('li');
		li.className = 'mb-2 shadow p-2 rounded flex justify-between bg-(--blanco-frio) text-(--negro-suave)';

		li.innerHTML = `
			<span>${producto.codigoDeBarra}</span>
            <span>${producto.nombre}</span>
            <span>${producto.cantidadVendidaTotal}</span>
			<span class="bg-(--azul-dim) text-(--blanco-frio) w-[170px] text-center rounded">${producto.sucursal}</span>  
		`
		contProductosTop.appendChild(li);
	});
});

//Medicamentos Top
const contMedicamentosTop = document.getElementById('contMedicamentosTop');
fetch('https://localhost:7013/api/Factura/obtener_medicamento_top')
.then(response => response.json())
.then(data => {
	data.forEach(medicamento => {
		const li = document.createElement('li');
		li.className = "mb-2 shadow p-2 rounded flex justify-between bg-(--blanco-frio) text-(--negro-suave)";

		li.innerHTML = `
			<span>${medicamento.codigoDeBarra}</span>
            <span>${medicamento.nombre}</span>
            <span>${medicamento.cantidadVendidaTotal}</span>
			<span class="bg-(--azul-dim) text-(--blanco-frio) w-[170px] text-center rounded">${medicamento.sucursal}</span>  
		`
		contMedicamentosTop.appendChild(li);
	})
});

//Grafico de barras
async function cargarGraficoGanancias() {

    const res = await fetch("https://localhost:7013/api/Factura/obtener_ganancias_mensuales");
	let data = await res.json();

	data = data.reverse();

	const nombresMeses = ["N/A", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

	const labels = data.map(x => nombresMeses[x.mes]);
	const valores = data.map(x => x.importe);

	new Chart(document.getElementById("graficoGanancias"), {
    	type: "bar",
    	data: {
        	labels: labels,
        	datasets: [{
            	label: "Ganancias mensuales",
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

cargarGraficoGanancias();

//Tortas
async function cargarTortaMetodosPago() {

    const res = await fetch("https://localhost:7013/api/Factura/obtener_metodo_pago_utilizado");
    const datos = await res.json();

    const labels = datos.map(x => x.metodO_PAGO);
    const valores = datos.map(x => x.cantidadMPUsado);

    const coloresAzules = [
        "#001F3F", "#003366", "#004C99", "#0066CC", "#0080FF",
        "#3399FF", "#66B2FF", "#99CCFF", "#CCE5FF", "#80BFFF",
        "#3385FF", "#1A75FF", "#005CE6", "#0047B3", "#003380"
    ];

    new Chart(document.getElementById("graficoMetodosPago"), {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: coloresAzules.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
			plugins: {
				legend:{
					display: false,
				}
    		}
        }
    });
}
cargarTortaMetodosPago();


async function cargarTortaSucursales() {

    const res = await fetch("https://localhost:7013/api/Factura/obtener_ventas_por_sucursal");
    const datos = await res.json();

    const labels = datos.map(x => x.sucursal);
    const valores = datos.map(x => x.cantidadSucursal);

    const coloresAzules = [
        "#001F3F", "#003366", "#004C99", "#0066CC", "#0080FF",
        "#3399FF", "#66B2FF", "#99CCFF", "#CCE5FF", "#80BFFF",
        "#3385FF", "#1A75FF", "#005CE6", "#0047B3", "#003380"
    ];

    new Chart(document.getElementById("graficoSucursales"), {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: coloresAzules.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
			plugins: {
				legend:{
					display: false,
				}
    		}
        }
    });
}
cargarTortaSucursales();