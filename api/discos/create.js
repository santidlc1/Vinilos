const pool = require('../lib/db');
const { authenticateRequest } = require('../lib/auth');

async function findOrCreateArtista(nombre) {
  const existing = await pool.query('SELECT id_artista FROM artistas WHERE nombre = $1', [nombre]);
  if (existing.rows.length) return existing.rows[0].id_artista;

  const created = await pool.query('INSERT INTO artistas (nombre) VALUES ($1) RETURNING id_artista', [nombre]);
  return created.rows[0].id_artista;
}

async function findOrCreateGenero(nombre) {
  const existing = await pool.query('SELECT id_genero FROM generos WHERE nombre = $1', [nombre]);
  if (existing.rows.length) return existing.rows[0].id_genero;

  const created = await pool.query('INSERT INTO generos (nombre) VALUES ($1) RETURNING id_genero', [nombre]);
  return created.rows[0].id_genero;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }

  try {
    const { titulo, url_portada, categoria, canciones = [] } = req.body || {};
    if (!titulo || !categoria) {
      res.status(400).json({ error: 'Título y categoría son obligatorios.' });
      return;
    }

    const artistaId = await findOrCreateArtista('Artista');
    const generoId = await findOrCreateGenero(categoria);

    const discoResult = await pool.query(
      `INSERT INTO discos (titulo, url_portada, id_artista, id_genero, ubicacion_fisica)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_disco, titulo, url_portada`,
      [titulo, url_portada || '', artistaId, generoId, 'Administración']
    );

    const disco = discoResult.rows[0];
    if (Array.isArray(canciones) && canciones.length) {
      const values = canciones.map((_, index) => `($1, $2, $3, $4, $5)`).join(', ');
      const params = [];
      canciones.forEach((c, index) => {
        params.push(disco.id_disco, c.nombre || 'Sin título', index + 1, c.duracion || '0:00', c.lado || 'Lado A');
      });
      await pool.query(
        `INSERT INTO canciones (id_disco, nombre_cancion, numero_pista, duracion, lado_o_disco)
         VALUES ${values}`,
        params
      );
    }

    res.status(201).json({ success: true, disco });
  } catch (error) {
    console.error('Create disco error:', error);
    res.status(500).json({ error: 'No se pudo crear el disco.' });
  }
};
