import { db, auth } from './firebase-config.js'; // AHORA IMPORTAMOS 'auth'
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"; // HERRAMIENTAS DE LOGIN

const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');

// ==========================================
// 1. SEGURIDAD DE FIREBASE (LA NUBE)
// ==========================================

// El "Vigilante": Revisa si ya hay alguien logeado
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si las llaves coinciden, abre el panel
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        iniciarFuncionesAdmin();
    } else {
        // Si no hay nadie, muestra el candado
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
});

// Función del botón INGRESAR
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    try {
        // Intentar logearse en Firebase
        await signInWithEmailAndPassword(auth, email, pass);
        // Si es exitoso, el "Vigilante" (onAuthStateChanged) lo detectará automáticamente y abrirá el panel.
    } catch (error) {
        alert('Credenciales incorrectas. Los dioses no te reconocen.');
        document.getElementById('form-login').reset();
    }
});

// Función del botón CERRAR SESIÓN
document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.reload();
    });
});

// ==========================================
// 2. LÓGICA MAESTRA DEL PANEL
// ==========================================
let productosLocales = []; 
let idProductoEditando = null; 

function iniciarFuncionesAdmin() {
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        const listaCategorias = document.getElementById('lista-categorias');
        const selectCategoria = document.getElementById('producto-categoria');
        listaCategorias.innerHTML = ''; selectCategoria.innerHTML = '<option value="" disabled selected>Selecciona una categoría...</option>';
        snapshot.forEach((doc) => {
            listaCategorias.innerHTML += `<div class="categoria-item"><span>${doc.data().nombre}</span><button onclick="eliminarDato('categorias', '${doc.id}')" class="btn-eliminar">Borrar</button></div>`;
            selectCategoria.innerHTML += `<option value="${doc.data().nombre}">${doc.data().nombre}</option>`;
        });
    });

    onSnapshot(collection(db, "marcas"), (snapshot) => {
        const listaMarcas = document.getElementById('lista-marcas');
        const selectMarca = document.getElementById('producto-marca');
        listaMarcas.innerHTML = ''; selectMarca.innerHTML = '<option value="" disabled selected>Selecciona una marca...</option>';
        snapshot.forEach((doc) => {
            listaMarcas.innerHTML += `<div class="categoria-item"><span>${doc.data().nombre}</span><button onclick="eliminarDato('marcas', '${doc.id}')" class="btn-eliminar">Borrar</button></div>`;
            selectMarca.innerHTML += `<option value="${doc.data().nombre}">${doc.data().nombre}</option>`;
        });
    });

    document.getElementById('form-categoria').onsubmit = async (e) => { e.preventDefault(); await addDoc(collection(db, "categorias"), { nombre: document.getElementById('categoria-nombre').value }); e.target.reset(); };
    document.getElementById('form-marca').onsubmit = async (e) => { e.preventDefault(); await addDoc(collection(db, "marcas"), { nombre: document.getElementById('marca-nombre').value }); e.target.reset(); };

    document.getElementById('form-producto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const textoImagenes = document.getElementById('producto-imagen').value;
        const arrayImagenes = textoImagenes.split(',').map(url => url.trim()).filter(url => url !== "");

        const producto = {
            nombre: document.getElementById('producto-nombre').value,
            categoria: document.getElementById('producto-categoria').value,
            marca: document.getElementById('producto-marca').value,
            detalle: document.getElementById('producto-detalle').value,
            esPromocion: document.getElementById('producto-promocion').value === 'si',
            precio: parseFloat(document.getElementById('producto-precio').value),
            sabor: document.getElementById('producto-sabor').value,
            libras: document.getElementById('producto-lb').value,
            stock: parseInt(document.getElementById('producto-stock').value),
            imagenes: arrayImagenes 
        };

        try {
            if (idProductoEditando) {
                await updateDoc(doc(db, "productos", idProductoEditando), producto);
                alert("Producto Actualizado con éxito.");
                cancelarEdicion();
            } else {
                producto.visible = true; 
                await addDoc(collection(db, "productos"), producto);
                document.getElementById('form-producto').reset();
                alert("Producto/Promoción forjado con éxito.");
            }
        } catch (error) { console.error("Error al guardar:", error); }
    });

    onSnapshot(collection(db, "productos"), (snapshot) => {
        const tabla = document.getElementById('tabla-inventario');
        tabla.innerHTML = '';
        productosLocales = []; 

        snapshot.forEach((documento) => {
            const prod = documento.data();
            productosLocales.push({ id: documento.id, ...prod }); 
            
            const estadoHTML = prod.visible ? `<span class="badge-on">🟢 Activo</span>` : `<span class="badge-off">🔴 Oculto</span>`;
            const promoHTML = prod.esPromocion ? `<br><span style="color: yellow; font-size: 12px;">⭐ PROMOCIÓN</span>` : `<br><span style="color: #ccc; font-size: 12px;">📦 NORMAL</span>`;
            const botonTexto = prod.visible ? "Ocultar" : "Mostrar";
            const claseBoton = prod.visible ? "btn-ocultar" : "btn-mostrar";
            const portada = prod.imagenes ? prod.imagenes[0] : prod.imagen;

            tabla.innerHTML += `
                <tr>
                    <td><img src="${portada}" class="img-tabla" alt="prod"></td>
                    <td><strong>${prod.nombre}</strong><br><small>${prod.sabor} | ${prod.libras}</small></td>
                    <td>${prod.categoria} ${promoHTML}</td>
                    <td>${prod.stock}</td>
                    <td>${estadoHTML}</td>
                    <td style="display: flex; gap: 5px;">
                        <button onclick="editarProducto('${documento.id}')" style="background: #3498db; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">Editar</button>
                        <button onclick="cambiarVisibilidad('${documento.id}', ${prod.visible})" class="${claseBoton}">${botonTexto}</button>
                    </td>
                </tr>
            `;
        });
    });
}

// FUNCIONES GLOBALES REQUERIDAS POR EL HTML
window.editarProducto = (id) => {
    const prod = productosLocales.find(p => p.id === id);
    if(prod) {
        document.getElementById('producto-nombre').value = prod.nombre;
        document.getElementById('producto-categoria').value = prod.categoria;
        document.getElementById('producto-marca').value = prod.marca;
        document.getElementById('producto-detalle').value = prod.detalle;
        document.getElementById('producto-promocion').value = prod.esPromocion ? 'si' : 'no';
        document.getElementById('producto-precio').value = prod.precio;
        document.getElementById('producto-sabor').value = prod.sabor;
        document.getElementById('producto-lb').value = prod.libras;
        document.getElementById('producto-stock').value = prod.stock;
        document.getElementById('producto-imagen').value = prod.imagenes ? prod.imagenes.join(', ') : prod.imagen;

        idProductoEditando = id;
        document.getElementById('titulo-formulario').innerText = "Editando Producto: " + prod.nombre;
        document.getElementById('btn-submit-producto').innerText = "Actualizar Producto";
        document.getElementById('btn-cancelar-edicion').style.display = "block";
        window.scrollTo(0, 0);
    }
};

window.cancelarEdicion = () => {
    idProductoEditando = null;
    document.getElementById('form-producto').reset();
    document.getElementById('titulo-formulario').innerText = "Forjar Nuevo Producto / Promoción";
    document.getElementById('btn-submit-producto').innerText = "Guardar en el Olimpo";
    document.getElementById('btn-cancelar-edicion').style.display = "none";
}

document.getElementById('btn-cancelar-edicion').addEventListener('click', cancelarEdicion);
window.cambiarVisibilidad = async (id, estadoActual) => { await updateDoc(doc(db, "productos", id), { visible: !estadoActual }); };
window.eliminarDato = async (coleccion, id) => { if(confirm(`¿Destruir este elemento para siempre?`)) await deleteDoc(doc(db, coleccion, id)); };