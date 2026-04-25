// 1. UTILIDAD DE MONEDA
const formatearCOP = (precio) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(precio || 0);
};

// 2. DIBUJAR EL CARRITO (EN TIEMPO REAL)
function renderizarCarrito() {
    // ¡EL SECRETO! Leemos la memoria exactamente en el momento de dibujar
    let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];
    
    const contenedorItems = document.getElementById('contenedor-items-carrito');
    if (!contenedorItems) return;

    contenedorItems.innerHTML = '';
    let precioTotal = 0;
    let cantidadTotal = 0;

    if (carritoKlan.length === 0) {
        contenedorItems.innerHTML = `
            <div style="text-align:center; padding: 50px; background: var(--dark-card); border-radius: 10px; width: 100%;">
                <h3 style="color: var(--text-muted); margin-bottom: 20px;">Tu carrito está vacío.</h3>
                <a href="productos.html" class="btn-watermelon" style="text-decoration:none; padding: 10px 20px; display:inline-block; border-radius:5px;">Ir a la Tienda</a>
            </div>`;
    } else {
        carritoKlan.forEach((item, index) => {
            const subtotalItem = (item.precio || 0) * (item.cantidad || 1);
            precioTotal += subtotalItem;
            cantidadTotal += (item.cantidad || 1);

            contenedorItems.innerHTML += `
                <div class="carrito-item">
                    <img src="${item.imagen || 'https://via.placeholder.com/100x100/111/4ade80?text=KLAN'}" alt="${item.nombre}">
                    <div class="carrito-item-info">
                        <h3>${item.nombre}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Sabor: ${item.sabor || 'N/A'} | Lbs: ${item.libras || 'N/A'}</p>
                        <p class="precio-item">${formatearCOP(item.precio)} c/u</p>
                    </div>
                    
                    <div class="carrito-item-cantidad" style="display:flex; align-items:center; gap:10px; background:#111; padding:5px 10px; border-radius:8px;">
                        <button onclick="cambiarCantidad(${index}, -1)" style="background:transparent; color:white; border:none; font-size:1.5rem; cursor:pointer;">-</button>
                        <span style="font-size: 1.2rem; font-weight: bold; width: 25px; text-align: center;">${item.cantidad || 1}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" style="background:transparent; color:white; border:none; font-size:1.2rem; cursor:pointer;">+</button>
                    </div>

                    <div class="carrito-item-subtotal">
                        <strong>${formatearCOP(subtotalItem)}</strong>
                    </div>
                    <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${index})">🗑️</button>
                </div>`;
        });
    }

    // Actualizar Panel Derecho
    if(document.getElementById('resumen-cantidad')) document.getElementById('resumen-cantidad').innerText = cantidadTotal;
    if(document.getElementById('resumen-subtotal')) document.getElementById('resumen-subtotal').innerText = formatearCOP(precioTotal);
    if(document.getElementById('resumen-total-final')) document.getElementById('resumen-total-final').innerText = formatearCOP(precioTotal);
    
    // Actualizar Burbuja del Menú para que sea idéntica a lo dibujado
    const bCarrito = document.getElementById('cart-count');
    if(bCarrito) {
        bCarrito.innerText = cantidadTotal;
        bCarrito.style.display = cantidadTotal > 0 ? 'inline-block' : 'none';
    }
}

// 3. FUNCIONES DE MODIFICACIÓN EN TIEMPO REAL
window.cambiarCantidad = (index, cambio) => {
    let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];
    if(carritoKlan[index]) {
        carritoKlan[index].cantidad += cambio;
        if (carritoKlan[index].cantidad <= 0) carritoKlan.splice(index, 1);
        localStorage.setItem('carritoKlan', JSON.stringify(carritoKlan));
    }
    renderizarCarrito();
};

window.eliminarDelCarrito = (index) => {
    let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];
    carritoKlan.splice(index, 1);
    localStorage.setItem('carritoKlan', JSON.stringify(carritoKlan));
    renderizarCarrito();
};

// 4. BOTÓN WHATSAPP
const btnWA = document.getElementById('btn-enviar-pedido');
if(btnWA) {
    btnWA.onclick = () => {
        let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];
        if(carritoKlan.length === 0) { alert("Tu carrito está vacío."); return; }
        
        const nom = document.getElementById('cliente-nombre').value;
        const tel = document.getElementById('cliente-telefono').value;
        const ciu = document.getElementById('cliente-ciudad').value;
        const dir = document.getElementById('cliente-direccion').value;

        if(!nom || !tel || !ciu || !dir) { alert("Completa tus datos de envío para poder despachar tu pedido."); return; }

        let msg = `🔥 *PEDIDO KLAN FITNESS* 🔥%0A👤 *Cliente:* ${nom}%0A📱 *Tel:* ${tel}%0A📍 *Ciudad:* ${ciu}%0A🏠 *Dir:* ${dir}%0A------------------%0A`;
        let total = 0;
        carritoKlan.forEach(i => {
            let sub = i.precio * i.cantidad;
            total += sub;
            msg += `▪️ ${i.cantidad}x ${i.nombre} (${i.sabor || 'N/A'}) - ${formatearCOP(sub)}%0A`;
        });
        msg += `------------------%0A💰 *TOTAL:* ${formatearCOP(total)}%0A%0AConfirmo mi pedido. ¿A dónde debo enviar el dinero? 💪`;
        
        window.open(`https://wa.me/573194937066?text=${msg}`, '_blank');
    };
}

// 5. BUSCADOR EN EL CARRITO
const btnBuscador = document.getElementById('btn-buscador');
const inputBuscador = document.getElementById('input-buscador');
if (btnBuscador && inputBuscador) {
    btnBuscador.addEventListener('click', () => {
        inputBuscador.classList.toggle('activo');
        if (inputBuscador.classList.contains('activo')) inputBuscador.focus();
        else if (inputBuscador.value.trim() !== "") window.location.href = `productos.html?q=${inputBuscador.value.trim()}`;
    });
    inputBuscador.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && inputBuscador.value.trim() !== "") window.location.href = `productos.html?q=${inputBuscador.value.trim()}`;
    });
}

// Arrancar al cargar la página
renderizarCarrito();