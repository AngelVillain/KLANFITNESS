import { db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let todosLosProductos = [];
let filtroCategoriaActual = "Todos";
let filtroMarcaActual = "Todas";

const esPaginaPromociones = document.getElementById('pagina-promociones') !== null;
const esPaginaProductos = document.getElementById('pagina-productos') !== null; 
const gridProductos = document.getElementById('grid-productos');
const carruselPromociones = document.getElementById('carrusel-promociones');
const contenedorCatInicio = document.getElementById('contenedor-categorias-dinamicas');

// ==========================================
// 1. LÓGICA DE CATEGORÍAS DINÁMICAS (INDEX)
// ==========================================
if (contenedorCatInicio) {
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        contenedorCatInicio.innerHTML = '';
        snapshot.forEach((doc) => {
            const nombreCat = doc.data().nombre;
            contenedorCatInicio.innerHTML += `
                <a href="productos.html?q=${nombreCat.toLowerCase()}" class="categoria-box">
                    <h3>${nombreCat.toUpperCase()}</h3>
                </a>
            `;
        });
    });
}

// ==========================================
// 2. LÓGICA DEL BUSCADOR GLOBAL
// ==========================================
const btnBuscador = document.getElementById('btn-buscador');
const inputBuscador = document.getElementById('input-buscador');
const urlParams = new URLSearchParams(window.location.search);
const busquedaQuery = urlParams.get('q') ? urlParams.get('q').toLowerCase() : null;

if (btnBuscador && inputBuscador) {
    btnBuscador.addEventListener('click', () => {
        inputBuscador.classList.toggle('activo');
        if (inputBuscador.classList.contains('activo')) {
            inputBuscador.focus();
        } else if (inputBuscador.value.trim() !== "") {
            window.location.href = `productos.html?q=${inputBuscador.value.trim()}`;
        }
    });
    inputBuscador.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && inputBuscador.value.trim() !== "") {
            window.location.href = `productos.html?q=${inputBuscador.value.trim()}`;
        }
    });
}

// ==========================================
// 3. LÓGICA DEL CARRITO (AHORA GLOBAL PARA TODA LA WEB)
// ==========================================
const contadorCarrito = document.getElementById('cart-count');
if (contadorCarrito) {
    // Leemos la memoria sin importar en qué página estemos
    let carritoMemoria = JSON.parse(localStorage.getItem('carritoKlan')) || [];
    const totalItems = carritoMemoria.reduce((total, item) => total + item.cantidad, 0);
    contadorCarrito.innerText = totalItems;
    
    // Si hay productos, se enciende. Si no, se apaga.
    if (totalItems > 0) {
        contadorCarrito.style.display = 'inline-block';
    } else {
        contadorCarrito.style.display = 'none';
    }
}

const formatearCOP = (precio) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
};

// ==========================================
// 4. TIENDA, FILTROS Y PRODUCTOS
// ==========================================
if (gridProductos) {
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        const contenedorCat = document.getElementById('contenedor-filtros-categorias');
        if(contenedorCat) {
            contenedorCat.innerHTML = '<button class="btn-filtro active" data-tipo="categoria" data-valor="Todos">Todas</button>';
            snapshot.forEach((doc) => contenedorCat.innerHTML += `<button class="btn-filtro" data-tipo="categoria" data-valor="${doc.data().nombre}">${doc.data().nombre}</button>`);
            activarEventosFiltros();
        }
    });

    onSnapshot(collection(db, "marcas"), (snapshot) => {
        const contenedorMarcas = document.getElementById('contenedor-filtros-marcas');
        if(contenedorMarcas) {
            contenedorMarcas.innerHTML = '<button class="btn-filtro active" data-tipo="marca" data-valor="Todas">Todas</button>';
            snapshot.forEach((doc) => contenedorMarcas.innerHTML += `<button class="btn-filtro" data-tipo="marca" data-valor="${doc.data().nombre}">${doc.data().nombre}</button>`);
            activarEventosFiltros();
        }
    });
}

// Cargar Productos desde Firebase
onSnapshot(collection(db, "productos"), (snapshot) => {
    todosLosProductos = [];
    let listaParaCarrusel = [];
    snapshot.forEach((doc) => {
        const prod = doc.data();
        if (prod.visible === true) {
            todosLosProductos.push({ id: doc.id, ...prod });
            if (prod.esPromocion === true) listaParaCarrusel.push({ id: doc.id, ...prod });
        }
    });
    if (carruselPromociones) dibujarCarrusel(listaParaCarrusel);
    if (gridProductos) aplicarFiltros(); 
});

function dibujarCarrusel(listaPromo) {
    if (!carruselPromociones) return;
    carruselPromociones.innerHTML = '';
    const top5 = listaPromo.slice(0, 5); 
    top5.forEach(prod => {
        // Blindaje contra imágenes rotas
        const portada = (prod.imagenes && prod.imagenes.length > 0 && prod.imagenes[0].trim() !== "") ? prod.imagenes[0] : "https://via.placeholder.com/300x300/111/4ade80?text=KLAN+FITNESS";
        carruselPromociones.innerHTML += `
            <div class="carrusel-item" onclick="verDetalle('${prod.id}')">
                <div class="badge-promo">PROMO</div>
                <img src="${portada}" alt="${prod.nombre}">
                <div class="carrusel-info">
                    <h4>${prod.nombre}</h4>
                    <p class="precio-promo">${formatearCOP(prod.precio)}</p>
                </div>
            </div>
        `;
    });
}

function aplicarFiltros() {
    let productosFiltrados = todosLosProductos;
    if (esPaginaPromociones) productosFiltrados = productosFiltrados.filter(prod => prod.esPromocion === true);
    else if (esPaginaProductos) productosFiltrados = productosFiltrados.filter(prod => prod.esPromocion === false);

    if (filtroCategoriaActual !== "Todos") productosFiltrados = productosFiltrados.filter(prod => prod.categoria === filtroCategoriaActual);
    if (filtroMarcaActual !== "Todas") productosFiltrados = productosFiltrados.filter(prod => prod.marca === filtroMarcaActual);

    if (busquedaQuery) {
        productosFiltrados = productosFiltrados.filter(prod => 
            prod.nombre.toLowerCase().includes(busquedaQuery) || 
            prod.categoria.toLowerCase().includes(busquedaQuery) ||
            (prod.marca && prod.marca.toLowerCase().includes(busquedaQuery))
        );
    }
    dibujarProductos(productosFiltrados);
}

function activarEventosFiltros() {
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(boton => {
        boton.onclick = (e) => {
            const tipo = e.target.getAttribute('data-tipo');
            const valor = e.target.getAttribute('data-valor');
            document.querySelectorAll(`.btn-filtro[data-tipo="${tipo}"]`).forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            if (tipo === 'categoria') filtroCategoriaActual = valor;
            if (tipo === 'marca') filtroMarcaActual = valor;
            aplicarFiltros();
        };
    });
}

function dibujarProductos(lista) {
    if (!gridProductos) return;
    gridProductos.innerHTML = '';
    if (lista.length === 0) {
        gridProductos.innerHTML = '<p class="no-productos">No hay suplementos que coincidan con tu búsqueda.</p>';
        return;
    }
    lista.forEach(prod => {
        const badgeHTML = prod.esPromocion ? `<div class="badge-promo" style="position:absolute; top:10px; right:10px; z-index: 10;">⭐ PROMO</div>` : '';
        // Blindaje contra imágenes rotas
        const portada = (prod.imagenes && prod.imagenes.length > 0 && prod.imagenes[0].trim() !== "") ? prod.imagenes[0] : "https://via.placeholder.com/300x300/111/4ade80?text=KLAN+FITNESS";

        gridProductos.innerHTML += `
            <div class="producto-card" style="position:relative;">
                ${badgeHTML}
                <img src="${portada}" alt="${prod.nombre}" class="producto-img" onclick="verDetalle('${prod.id}')">
                <div class="producto-info">
                    <span class="producto-cat">${prod.categoria} | ${prod.marca || ''}</span>
                    <h3 onclick="verDetalle('${prod.id}')">${prod.nombre}</h3>
                    <p class="producto-sabor">Sabor: ${prod.sabor}</p>
                    <p class="producto-precio">${formatearCOP(prod.precio)}</p>
                    <button class="btn-watermelon btn-add" onclick="agregarAlCarrito('${prod.id}', '${prod.nombre}', ${prod.precio}, '${prod.sabor}', '${prod.libras}', '${portada}', ${prod.stock})">Agregar</button>
                </div>
            </div>
        `;
    });
}

window.verDetalle = (id) => { window.location.href = `detalle.html?id=${id}`; };

// Agregar productos con actualización en vivo
window.agregarAlCarrito = (id, nombre, precio, sabor, libras, imagen, stock) => {
    if(stock <= 0) { alert("Este producto está agotado."); return; }
    let carritoMemoria = JSON.parse(localStorage.getItem('carritoKlan')) || [];
    const itemExistenteIndex = carritoMemoria.findIndex(item => item.id === id);
    
    if (itemExistenteIndex !== -1) {
        if(carritoMemoria[itemExistenteIndex].cantidad + 1 > stock) { alert("No hay suficiente stock."); return; }
        carritoMemoria[itemExistenteIndex].cantidad += 1;
    } else {
        carritoMemoria.push({ id: id, nombre: nombre, precio: precio, sabor: sabor, libras: libras, imagen: imagen, cantidad: 1 });
    }
    
    localStorage.setItem('carritoKlan', JSON.stringify(carritoMemoria));
    
    // Encender bolita en vivo
    const totalItems = carritoMemoria.reduce((total, item) => total + item.cantidad, 0);
    if (contadorCarrito) {
        contadorCarrito.innerText = totalItems;
        contadorCarrito.style.display = 'inline-block';
    }
    alert(`¡${nombre} se añadió a tu carrito!`);
};