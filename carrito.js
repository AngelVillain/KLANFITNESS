// Formateador de Pesos Colombianos
const formatearCOP = (precio) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(precio);
};

// Leer la memoria del carrito
let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];

// 1. DIBUJAR LOS PRODUCTOS EN LA PANTALLA
const dibujarCarrito = () => {
    const contenedor = document.getElementById('contenedor-items-carrito');
    const spanCantidad = document.getElementById('resumen-cantidad');
    const spanSubtotal = document.getElementById('resumen-subtotal');
    const spanTotalFinal = document.getElementById('resumen-total-final');

    contenedor.innerHTML = '';
    let total = 0;
    let cantidadItems = 0;

    if (carritoKlan.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); font-size: 1.2rem;">Tu carrito está vacío. ¡Ve a la tienda y equípate!</p>';
        spanCantidad.innerText = '0';
        spanSubtotal.innerText = '$ 0';
        spanTotalFinal.innerText = '$ 0';
        return;
    }

    carritoKlan.forEach((item, index) => {
        let subtotalItem = item.precio * item.cantidad;
        total += subtotalItem;
        cantidadItems += item.cantidad;

        contenedor.innerHTML += `
            <div class="carrito-item">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="carrito-item-info">
                    <h3>${item.nombre}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">
                        ${item.sabor ? `Sabor: ${item.sabor} | ` : ''} ${item.libras ? `${item.libras} Lbs` : ''}
                    </p>
                    <p class="precio-item">${formatearCOP(item.precio)}</p>
                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                        <button onclick="cambiarCantidad(${index}, -1)" style="background: #333; color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer;">-</button>
                        <span style="font-weight: bold; font-size: 1.1rem;">${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" style="background: var(--watermelon-green); color: #121212; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">+</button>
                    </div>
                </div>
                <div class="carrito-item-subtotal">
                    ${formatearCOP(subtotalItem)}
                </div>
                <button class="btn-eliminar-item" title="Eliminar" onclick="eliminarDelCarrito(${index})">🗑️</button>
            </div>
        `;
    });

    spanCantidad.innerText = cantidadItems;
    spanSubtotal.innerText = formatearCOP(total);
    spanTotalFinal.innerText = formatearCOP(total);
};

// 2. ELIMINAR PRODUCTO
window.eliminarDelCarrito = (index) => {
    carritoKlan.splice(index, 1);
    localStorage.setItem('carritoKlan', JSON.stringify(carritoKlan));
    dibujarCarrito();
    // Actualizar la bolita roja si la función existe en main.js
    if(typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
};

// 3. SUMAR O RESTAR CANTIDAD
window.cambiarCantidad = (index, cambio) => {
    let nuevaCantidad = carritoKlan[index].cantidad + cambio;
    if (nuevaCantidad > 0) {
        // Asumiendo que controlamos el stock, pero por ahora permitimos sumar/restar libremente
        carritoKlan[index].cantidad = nuevaCantidad;
        localStorage.setItem('carritoKlan', JSON.stringify(carritoKlan));
        dibujarCarrito();
        if(typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
    }
};

// 4. LÓGICA DEL BOTÓN WHATSAPP (AQUÍ ESTABA EL FALLO)
document.getElementById('btn-enviar-pedido')?.addEventListener('click', () => {
    if (carritoKlan.length === 0) {
        alert("Tu carrito está vacío. Agrega productos antes de hacer el pedido.");
        return;
    }

    // Capturar datos del cliente
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const ciudad = document.getElementById('cliente-ciudad').value.trim();
    const direccion = document.getElementById('cliente-direccion').value.trim();

    if (!nombre || !telefono || !ciudad || !direccion) {
        alert("Por favor, completa todos los datos de envío (Nombre, Teléfono, Ciudad y Dirección).");
        return;
    }

    // Armar el mensaje base
    let mensaje = `*NUEVO PEDIDO - KLAN FITNESS* 🏋️‍♂️🍉\n\n`;
    mensaje += `*📦 DATOS DEL CLIENTE:*\n`;
    mensaje += `- Nombre: ${nombre}\n`;
    mensaje += `- Teléfono: ${telefono}\n`;
    mensaje += `- Ciudad: ${ciudad}\n`;
    mensaje += `- Dirección: ${direccion}\n\n`;
    
    mensaje += `*🛒 DETALLE DEL PEDIDO:*\n`;
    let total = 0;
    
    // Bucle para añadir cada producto de la memoria al mensaje
    carritoKlan.forEach(item => {
        let subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `🔸 ${item.cantidad}x ${item.nombre}\n`;
        if (item.sabor) mensaje += `   Sabor: ${item.sabor}\n`;
        if (item.libras) mensaje += `   Tamaño: ${item.libras} Lbs\n`;
        mensaje += `   Subtotal: ${formatearCOP(subtotal)}\n\n`;
    });

    mensaje += `*💰 TOTAL A PAGAR: ${formatearCOP(total)}*\n\n`;
    mensaje += `¡Quedo atento para coordinar el pago y envío!`;

    // Enviar al número establecido
    const numeroWhatsApp = "573194937066";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
});

// 5. CEREBRO DE LA LUPA (Buscador)
document.getElementById('btn-buscador')?.addEventListener('click', () => {
    const input = document.getElementById('input-buscador');
    input.classList.toggle('activo');
    if(input.classList.contains('activo')) {
        input.focus();
    } else {
        const query = input.value.trim();
        if(query) {
            window.location.href = `productos.html?buscar=${encodeURIComponent(query)}`;
        }
    }
});

document.getElementById('input-buscador')?.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const query = e.target.value.trim();
        if(query) {
            window.location.href = `productos.html?buscar=${encodeURIComponent(query)}`;
        }
    }
});

// Iniciar la página dibujando el carrito
dibujarCarrito();
