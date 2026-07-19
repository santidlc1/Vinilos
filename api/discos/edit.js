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
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }

  try {
    const { id, titulo, url_portada, categoria, canciones = [] } = req.body || {};
    if (!id || !titulo || !categoria) {
      res.status(400).json({ error: 'Faltan datos para editar el vinilo.' });
      return;
    }

    const artistaId = await findOrCreateArtista('Artista');
    const generoId = await findOrCreateGenero(categoria);

    await pool.query(
      'UPDATE discos SET titulo = $1, url_portada = $2, id_artista = $3, id_genero = $4 WHERE id_disco = $5',
      [titulo, url_portada || '', artistaId, generoId, id]
    );

    await pool.query('DELETE FROM canciones WHERE id_disco = $1', [id]);

    if (Array.isArray(canciones) && canciones.length) {
      const values = canciones.map((_, index) => `($1, $2, $3, $4, $5)`).join(', ');
      const params = [];
      canciones.forEach((c, index) => {
        params.push(id, c.nombre || 'Sin título', index + 1, c.duracion || '0:00', c.lado || 'Lado A');
      });
      await pool.query(
        `INSERT INTO canciones (id_disco, nombre_cancion, numero_pista, duracion, lado_o_disco) VALUES ${values}`,
        params
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Edit disco error:', error);
    res.status(500).json({ error: 'No se pudo editar el disco.' });
  }
};
