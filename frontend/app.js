const API_URL = '/api';

let todosLosDiscos = [];
let isAdmin = false;
let authMode = 'register';

const discosContainer = document.getElementById('discos-container');
const searchInput = document.getElementById('search-input');
const genresFilterContainer = document.getElementById('genres-filter-container');
const modal = document.getElementById('modal-detalle');
const closeModal = document.getElementById('close-modal');
const detalleBody = document.getElementById('detalle-disco-body');
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const showAuthBtn = document.getElementById('show-auth-btn');
const authForm = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authStatus = document.getElementById('auth-status');
const adminModal = document.getElementById('admin-modal');
const closeAdminModal = document.getElementById('close-admin-modal');
const adminForm = document.getElementById('admin-form');
const adminModalTitle = document.getElementById('admin-modal-title');
const adminEditingLabel = document.getElementById('admin-editing-label');
const adminTitle = document.getElementById('admin-title');
const adminPhoto = document.getElementById('admin-photo');
const adminCategory = document.getElementById('admin-category');
const adminSongs = document.getElementById('admin-songs');
let editingDiscoId = null;

function getToken() {
  return localStorage.getItem('vinilos-token');
}

function saveToken(token) {
  localStorage.setItem('vinilos-token', token);
}

function clearToken() {
  localStorage.removeItem('vinilos-token');
}

function renderAuthState() {
  const token = getToken();
  const isLogged = Boolean(token);
  isAdmin = isLogged;
  authStatus.innerHTML = isLogged
    ? '<span class="admin-badge">Administrador Cristian de la Carrera</span>'
    : 'Inicia sesión para administrar';
  showAuthBtn.textContent = isLogged ? 'Salir' : 'Entrar';
}

async function inicializarApp() {
  renderAuthState();
  try {
    const response = await fetch(`${API_URL}/discos`);
    if (!response.ok) throw new Error('Error al conectar con la API');

    todosLosDiscos = await response.json();
    generarFiltrosDeGeneros(todosLosDiscos);
    renderizarDiscos(todosLosDiscos);
  } catch (error) {
    console.error(error);
    discosContainer.innerHTML = '<div class="loading">No se pudo cargar el catálogo.</div>';
  }
}

function renderizarDiscos(discosParaMostrar) {
  discosContainer.innerHTML = '';

  if (!discosParaMostrar.length) {
    discosContainer.innerHTML = '<div class="loading">No se encontraron vinilos.</div>';
    return;
  }

  const adminActions = document.createElement('div');
  adminActions.className = 'admin-actions';
  if (isAdmin) {
    const addBtn = document.createElement('button');
    addBtn.className = 'primary-btn';
    addBtn.textContent = 'Agregar vinilo';
    addBtn.addEventListener('click', () => abrirModalAdmin(null));
    adminActions.appendChild(addBtn);
  }
  discosContainer.appendChild(adminActions);

  discosParaMostrar.forEach((disco) => {
    const card = document.createElement('div');
    card.classList.add('card-disco');
    card.innerHTML = `
      <img src="${disco.url_portada && disco.url_portada !== 'placeholder.png' ? disco.url_portada : 'https://placehold.co/300x300/1e1e1e/888888?text=VINILO'}" alt="${disco.titulo}">
      <div class="disco-info">
        <h3>${disco.titulo}</h3>
        <p>${disco.artista_nombre}</p>
      </div>
    `;

    if (isAdmin) {
      const actions = document.createElement('div');
      actions.className = 'auth-buttons';
      const editBtn = document.createElement('button');
      editBtn.className = 'secondary-btn';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await prepararEdicion(disco);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'secondary-btn';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await eliminarDisco(disco.id_disco);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      card.appendChild(actions);
    }

    card.addEventListener('click', () => abrirDetalleDisco(disco.id_disco));
    discosContainer.appendChild(card);
  });
}

function generarFiltrosDeGeneros(discos) {
  const generosUnicos = [...new Set(discos.map((d) => d.genero_nombre).filter(Boolean))];
  genresFilterContainer.innerHTML = '<button class="filter-btn active" data-genre="all">Todos</button>';

  generosUnicos.forEach((genero) => {
    const btn = document.createElement('button');
    btn.classList.add('filter-btn');
    btn.setAttribute('data-genre', genero);
    btn.textContent = genero;
    genresFilterContainer.appendChild(btn);
  });

  const botones = genresFilterContainer.querySelectorAll('.filter-btn');
  botones.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      botones.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      filtrarYBuscar();
    });
  });
}

function filtrarYBuscar() {
  const textoBusqueda = searchInput.value.toLowerCase().trim();
  const botonActivo = genresFilterContainer.querySelector('.filter-btn.active');
  const generoFiltrado = botonActivo ? botonActivo.getAttribute('data-genre') : 'all';

  const discosFiltrados = todosLosDiscos.filter((disco) => {
    const cumpleBusqueda =
      disco.titulo.toLowerCase().includes(textoBusqueda) ||
      disco.artista_nombre.toLowerCase().includes(textoBusqueda);

    const cumpleGenero = generoFiltrado === 'all' || disco.genero_nombre === generoFiltrado;

    return cumpleBusqueda && cumpleGenero;
  });

  renderizarDiscos(discosFiltrados);
}

searchInput.addEventListener('input', filtrarYBuscar);

showAuthBtn.addEventListener('click', () => {
  if (getToken()) {
    clearToken();
    isAdmin = false;
    renderAuthState();
    renderizarDiscos(todosLosDiscos);
    return;
  }
  authModal.classList.remove('hidden');
});

closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));
closeAdminModal.addEventListener('click', () => adminModal.classList.add('hidden'));
window.addEventListener('click', (e) => {
  if (e.target === authModal) authModal.classList.add('hidden');
  if (e.target === adminModal) adminModal.classList.add('hidden');
  if (e.target === modal) modal.classList.add('hidden');
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = { username: authUsername.value, password: authPassword.value };

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'No se pudo completar la operación');
    return;
  }

  saveToken(data.token);
  authModal.classList.add('hidden');
  renderAuthState();
  renderizarDiscos(todosLosDiscos);
});

adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!getToken()) {
    alert('Debes iniciar sesión para agregar o editar un vinilo');
    return;
  }

  const canciones = adminSongs.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nombre, duracion, lado] = line.split('|');
      return { nombre: nombre || 'Sin título', duracion: duracion || '0:00', lado: lado || 'Lado A' };
    });

  const payload = {
    titulo: adminTitle.value,
    url_portada: adminPhoto.value,
    categoria: adminCategory.value,
    canciones
  };

  const endpoint = editingDiscoId ? '/discos/edit' : '/discos/create';
  const method = editingDiscoId ? 'PUT' : 'POST';
  if (editingDiscoId) payload.id = editingDiscoId;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'No se pudo guardar el vinilo');
    return;
  }

  adminForm.reset();
  adminModal.classList.add('hidden');
  editingDiscoId = null;
  inicializarApp();
});

async function abrirModalAdmin(disco) {
  editingDiscoId = disco ? disco.id_disco : null;
  adminModalTitle.textContent = disco ? 'Editar vinilo' : 'Agregar nuevo vinilo';
  adminForm.reset();

  if (disco) {
    adminEditingLabel.textContent = `Editando: ${disco.titulo || 'vinilo'}`;
    adminEditingLabel.classList.remove('hidden');
    adminTitle.value = disco.titulo || '';
    adminPhoto.value = disco.url_portada || '';
    adminCategory.value = disco.genero_nombre || '';

    try {
      const response = await fetch(`${API_URL}/discos/${disco.id_disco}`);
      if (!response.ok) throw new Error('No se pudo cargar el detalle del disco');
      const detalle = await response.json();
      const cancionesTexto = (detalle.canciones || [])
        .map((track) => `${track.nombre_cancion || ''}|${track.duracion || '0:00'}|${track.lado_o_disco || 'Lado A'}`)
        .join('\n');
      adminSongs.value = cancionesTexto;
    } catch (error) {
      console.error('Error cargando canciones para editar:', error);
      adminSongs.value = '';
    }
  } else {
    adminEditingLabel.textContent = '';
    adminEditingLabel.classList.add('hidden');
  }

  adminModal.classList.remove('hidden');
}

async function prepararEdicion(disco) {
  await abrirModalAdmin(disco);
}

async function eliminarDisco(id) {
  if (!getToken()) return;

  const response = await fetch(`${API_URL}/discos/delete?id=${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'No se pudo eliminar el vinilo');
    return;
  }

  inicializarApp();
}

async function abrirDetalleDisco(id) {
  try {
    detalleBody.innerHTML = '<div class="loading">Abriendo vinilo...</div>';
    modal.classList.remove('hidden');

    const response = await fetch(`${API_URL}/discos/${id}`);
    if (!response.ok) throw new Error('No se pudo cargar el detalle del disco');

    const disco = await response.json();

    let cancionesHTML = '';
    if (disco.canciones && disco.canciones.length > 0) {
      disco.canciones.forEach((track) => {
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
      <ul class="canciones-lista">${cancionesHTML}</ul>
    `;
  } catch (error) {
    console.error('Error abriendo detalle:', error);
    detalleBody.innerHTML = '<p style="color: red; text-align: center;">Error al cargar el detalle.</p>';
  }
}

window.addEventListener('DOMContentLoaded', inicializarApp);
