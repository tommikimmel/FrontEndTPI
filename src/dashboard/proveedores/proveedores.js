const contProveedores = document.getElementById('contProveedores');

fetch('https://localhost:7013/api/Proveedor/obtener_proveedores')
.then(response => response.json())
.then(data => {
    data.forEach(proveedor => {
        const div = document.createElement('div');
        div.className = "proveedor bg-(--blanco-frio) p-4 rounded shadow flex flex-col gap-2 h-[280px]"

        div.innerHTML = `
        <h1 class="text-4xl text-center">👥</h1>
                <h2 class="text-(--azul-dim) font-semibold text-center">${proveedor.razonSocial}</h2>
                <h3 class="text-(--negro-suave) text-center">${proveedor.cuit}</h3>
                <p class="text-center opacity-60">${proveedor.direccionProveedor}</p>
                <p class="text-center opacity-60">${proveedor.telefonoProveedor}</p>
                <p class="text-center opacity-60">${proveedor.emailProveedor}</p>
                <div class="flex gap-4 mt-2 items-center justify-center">
                    <button id="editarProveedor" class="bg-(--azul-dim) text-(--blanco-frio) w-full h-full rounded">Editar</button>
                    <button id="eliminarProveedor" class="bg-(--azul-dim) text-(--blanco-frio) w-full h-full rounded">Eliminar</button>
                </div>
                `;
        contProveedores.appendChild(div);
    });
});