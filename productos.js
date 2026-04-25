// En tu página de productos (index o productos.html)
onSnapshot(collection(db, "categorias"), (snapshot) => {
    const filterContainer = document.getElementById('filtros-categorias');
    filterContainer.innerHTML = '<button onclick="filtrarTodo()">Todos</button>';
    
    snapshot.forEach((doc) => {
        const cat = doc.data().nombre;
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.onclick = () => filtrarPorCategoria(cat); // Función que filtra tus productos
        filterContainer.appendChild(btn);
    });
});