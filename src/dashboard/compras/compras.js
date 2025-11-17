//Cargar compras
const contCompras = document.getElementById('contCompras');
async function cargarCompras() {
    fetch('https://localhost:7013/api/Compra/obtener_compras_por_filtros')
    .then(res => res.json())
    .then(data => {
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
            div.addEventListener('click', () => {
                // Aquí puedes agregar la lógica para mostrar el detalle de la compra
                
                
            });
            contCompras.appendChild(div);   
        });
    })
}
cargarCompras()