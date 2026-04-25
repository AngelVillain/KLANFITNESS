import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const valoresUrl = new URLSearchParams(window.location.search);
const productoId = valoresUrl.get('id');

const formatearCOP = (precio) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(precio);
};

let carritoKlan = JSON.parse(localStorage.getItem('carritoKlan')) || [];

// ==========================================
// ENCENDER BURBUJA DEL CARRITO EN DETALLES
// ==========================================
const actualizarContadorCarrito = () => {
    const contadorCarrito = document.getElementById('cart-count');
    if(contadorCarrito) {
        const totalItems = carritoKlan.reduce((total, item) => total + item.cantidad, 0);
        contadorCarrito.innerText = totalItems;
        if(totalItems > 0) {
            contadorCarrito.style.display = 'inline-block'; // Encender la burbuja roja
        }
    }
};
actualizarContadorCarrito();

if (!productoId) window.location.href = "productos.html";

async function cargarDetalleProducto() {
    const contenedor = document.getElementById('contenedor-carga');
    const docRef = doc(db, "productos", productoId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const prod = docSnap.data();
        let arrayImagenes = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes : [prod.imagen];
        let promoHTML = prod.esPromocion ? `<span class="badge-promo-detalle">⭐ EN PROMOCIÓN</span>` : '';

        contenedor.innerHTML = `
            <div class="detalle-galeria">
                <img id="imagen-principal" src="${arrayImagenes[0]}" alt="${prod.nombre}" class="img-main">
                <div id="galeria-miniaturas" class="miniaturas-box"></div>
            </div>

            <div class="detalle-info">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <span class="badge-cat">${prod.categoria} | ${prod.marca || 'Sin marca'}</span>
                    ${promoHTML}
                </div>
                
                <h1 id="detalle-nombre">${prod.nombre}</h1>
                <p id="detalle-precio" class="precio-destacado">${formatearCOP(prod.precio)}</p>
                <p id="detalle-descripcion">${prod.detalle}</p>

                <div class="opciones-compra">
                    <div class="opcion"><strong>Sabor:</strong> <span>${prod.sabor}</span></div>
                    <div class="opcion"><strong>Contenido:</strong> <span>${prod.libras}</span></div>
                    <div class="opcion"><strong>Stock:</strong> <span>${prod.stock} uds.</span></div>
                </div>

                <div class="accion-compra">
                    <div class="cantidad-box">
                        <button id="btn-restar">-</button>
                        <input type="number" id="cantidad-producto" value="1" readonly>
                        <button id="btn-sumar">+</button>
                    </div>
                    <button id="btn-agregar-carrito" class="btn-watermelon btn-elegante">🛒 AGREGAR AL CARRITO</button>
                </div>
            </div>
        `;

        const galeriaMiniaturas = document.getElementById('galeria-miniaturas');
        const imagenPrincipal = document.getElementById('imagen-principal');
        arrayImagenes.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.classList.add('img-miniatura');
            img.onclick = () => { imagenPrincipal.src = url; }; 
            galeriaMiniaturas.appendChild(img);
        });

        const inputCantidad = document.getElementById('cantidad-producto');
        document.getElementById('btn-restar').onclick = () => {
            let actual = parseInt(inputCantidad.value);
            if(actual > 1) inputCantidad.value = actual - 1;
        };
        document.getElementById('btn-sumar').onclick = () => {
            let actual = parseInt(inputCantidad.value);
            if(actual < prod.stock) inputCantidad.value = actual + 1;
        };

        // AL GUARDAR, SE ENCIENDE Y ACTUALIZA LA BURBUJA
        document.getElementById('btn-agregar-carrito').addEventListener('click', () => {
            let cantidadSeleccionada = parseInt(inputCantidad.value);

            if(prod.stock <= 0 || cantidadSeleccionada > prod.stock) {
                alert("Stock insuficiente.");
                return;
            }

            const itemExistenteIndex = carritoKlan.findIndex(item => item.id === productoId);
            
            if (itemExistenteIndex !== -1) {
                if (carritoKlan[itemExistenteIndex].cantidad + cantidadSeleccionada > prod.stock) {
                    alert("No puedes agregar más de lo que hay en stock.");
                    return;
                }
                carritoKlan[itemExistenteIndex].cantidad += cantidadSeleccionada;
            } else {
                carritoKlan.push({
                    id: productoId, nombre: prod.nombre, precio: prod.precio,
                    sabor: prod.sabor, libras: prod.libras, imagen: arrayImagenes[0],
                    cantidad: cantidadSeleccionada
                });
            }

            localStorage.setItem('carritoKlan', JSON.stringify(carritoKlan));
            actualizarContadorCarrito();
            
            alert(`¡Se añadieron ${cantidadSeleccionada} ${prod.nombre} al carrito!`);
        });

    } else {
        alert("El producto no existe.");
        window.location.href = "productos.html";
    }
}

cargarDetalleProducto();

// LÓGICA DEL BUSCADOR DESPLEGABLE
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