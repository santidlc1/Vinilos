// public/app.js



// URL de tu Backend. En local usa '/api'. En producción cámbialo por la URL de tu backend en Render/etc.

const API_URL = '/api';



let todosLosDiscos = []; // Guardará temporalmente los datos en memoria para búsquedas instantáneas

const discosContainer = document.getElementById('discos-container');

const searchInput = document.getElementById('search-input');

const genresFilterContainer = document.getElementById('genres-filter-container');

const modal = document.getElementById('modal-detalle');

const closeModal = document.getElementById('close-modal');

const detalleBody = document.getElementById('detalle-disco-body');



// 1. Obtener y cargar los discos desde la base de datos

async function inicializarApp() {

    try {

        const response = await fetch(`${API_URL}/discos`);

        if (!response.ok) throw new Error('Error al conectar con la API');

       

        todosLosDiscos = await response.json();

       

        generarFiltrosDeGeneros(todosLosDiscos);

        renderizarDiscos(todosLosDiscos);

       

    } catch (error) {

        console.error(error);

        discosContainer.innerHTML = `

            <div class="loading">

                <p style="color: red;">⚠️ No se pudo conectar a la base de datos.</p>

                <small style="color: #666; display: block; margin-top: 10px;">Verifica que el servidor esté activo.</small>

            </div>`;

    }

}



// 2. Pintar los discos en pantalla (formato tarjetas)

function renderizarDiscos(discosParaMostrar) {

    discosContainer.innerHTML = '';

   

    if (discosParaMostrar.length === 0) {

        discosContainer.innerHTML = '<div class="loading">No se encontraron vinilos.</div>';

        return;

    }

   

    discosParaMostrar.forEach(disco => {

        const card = document.createElement('div');

        card.classList.add('card-disco');

        card.innerHTML = `

            <img src="${disco.url_portada && disco.url_portada !== 'placeholder.png' ? disco.url_portada : 'https://placehold.co/300x300/1e1e1e/888888?text=VINILO'}" alt="${disco.titulo}">

            <div class="disco-info">

                <h3>${disco.titulo}</h3>

                <p>${disco.artista_nombre}</p>

            </div>

        `;

       

        // Abrir el detalle al pulsar

        card.addEventListener('click', () => abrirDetalleDisco(disco.id_disco));

        discosContainer.appendChild(card);

    });

}



// 3. Generar botones de filtro basados en los géneros reales de la BD

function generarFiltrosDeGeneros(discos) {

    // Obtenemos una lista única de géneros presentes

    const generosUnicos = [...new Set(discos.map(d => d.genero_nombre).filter(Boolean))];

   

    // Dejamos el botón "Todos" y agregamos los demás

    genresFilterContainer.innerHTML = '<button class="filter-btn active" data-genre="all">Todos</button>';

   

    generosUnicos.forEach(genero => {

        const btn = document.createElement('button');

        btn.classList.add('filter-btn');

        btn.setAttribute('data-genre', genero);

        btn.textContent = genero;

        genresFilterContainer.appendChild(btn);

    });



    // Agregar evento clic a los botones dinámicos

    const botones = genresFilterContainer.querySelectorAll('.filter-btn');

    botones.forEach(btn => {

        btn.addEventListener('click', (e) => {

            botones.forEach(b => b.classList.remove('active'));

            e.target.classList.add('active');

            filtrarYBuscar();

        });

    });

}



// 4. Filtrar y Buscar en tiempo real (Combinando buscador + género)

function filtrarYBuscar() {

    const textoBusqueda = searchInput.value.toLowerCase().trim();

    const botonActivo = genresFilterContainer.querySelector('.filter-btn.active');

    const generoFiltrado = botonActivo ? botonActivo.getAttribute('data-genre') : 'all';



    const discosFiltrados = todosLosDiscos.filter(disco => {

        const cumpleBusqueda =

            disco.titulo.toLowerCase().includes(textoBusqueda) ||

            disco.artista_nombre.toLowerCase().includes(textoBusqueda);

           

        const cumpleGenero =

            generoFiltrado === 'all' ||

            disco.genero_nombre === generoFiltrado;



        return cumpleBusqueda && cumpleGenero;

    });



    renderizarDiscos(discosFiltrados);

}



// Escuchar escritura en el buscador

searchInput.addEventListener('input', filtrarYBuscar);



// 5. Ver canciones y ficha en el Modal

async function abrirDetalleDisco(id) {

    try {

        detalleBody.innerHTML = '<div class="loading">Abriendo vinilo...</div>';

        modal.classList.remove('hidden');



        const res = await fetch(`${API_URL}/discos/${id}`);

        const disco = await res.json();



        // Armar el listado de canciones clasificando por "Lado/Disco"

        let cancionesHTML = '';

        if (disco.canciones && disco.canciones.length > 0) {

            disco.canciones.forEach(track => {

                cancionesHTML += `

                    <li>

                        <span>

                            <strong style="color: #ffb703;">${track.numero_pista || ''}</strong>

                            ${track.nombre_cancion}

                            ${track.lado_o_disco ? `<small style="color: #8e8e93; margin-left: 5px;">[${track.lado_o_disco}]</small>` : ''}

                        </span>

                        <span style="color: #8e8e93; font-size: 0.85rem;">${track.duracion || ''}</span>

                    </li>

                `;

            });

        } else {

            cancionesHTML = '<li>No hay canciones cargadas en este disco todavía.</li>';

        }



        detalleBody.innerHTML = `

            <img src="${disco.url_portada && disco.url_portada !== 'placeholder.png' ? disco.url_portada : 'https://placehold.co/300x300/1e1e1e/888888?text=VINILO'}" class="detalle-portada" alt="${disco.titulo}">

            <h2>${disco.titulo}</h2>

            <div class="artista-text">${disco.artista_nombre}</div>

            <div class="meta-info">Año: ${disco.anio_lanzamiento || 'N/A'} | Estilo: ${disco.genero_nombre || 'No definido'}</div>

           

            <div class="ubicacion-badge">📍 Ubicación: ${disco.ubicacion_fisica || 'No clasificado'}</div>

           

            <h3 style="margin-top: 15px; border-bottom: 1px solid #2c2c2e; padding-bottom: 8px; font-size: 1.1rem; color: #fff;">Lista de canciones</h3>

            <ul class="canciones-lista">

                ${cancionesHTML}

            </ul>

        `;



    } catch (error) {

        console.error("Error abriendo detalle:", error);

        detalleBody.innerHTML = '<p style="color: red; text-align: center;">Error al cargar el detalle.</p>';

    }

}



// Eventos de Cerrar el Modal

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });



// Iniciar app al cargar la página

window.addEventListener('DOMContentLoaded', inicializarApp); 

