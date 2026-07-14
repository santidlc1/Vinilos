const pool = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'Falta el ID del disco.' });
    return;
  }

  try {
    const discoQuery = `
      SELECT d.id_disco, d.titulo, d.anio_lanzamiento, d.url_portada, d.ubicacion_fisica,
             a.nombre AS artista_nombre, g.nombre AS genero_nombre
      FROM discos d
      LEFT JOIN artistas a ON d.id_artista = a.id_artista
      LEFT JOIN generos g ON d.id_genero = g.id_genero
      WHERE d.id_disco = $1;
    `;
    const discoResult = await pool.query(discoQuery, [id]);

    if (discoResult.rows.length === 0) {
      res.status(404).json({ error: 'Disco no encontrado.' });
      return;
    }

    const disco = discoResult.rows[0];
    const cancionesQuery = `
      SELECT id_cancion, nombre_cancion, numero_pista, duracion, lado_o_disco
      FROM canciones
      WHERE id_disco = $1
      ORDER BY lado_o_disco ASC, numero_pista ASC;
    `;
    const cancionesResult = await pool.query(cancionesQuery, [id]);
    disco.canciones = cancionesResult.rows;

    res.status(200).json(disco);
  } catch (error) {
    console.error('API /api/discos/[id] error:', error);
    res.status(500).json({ error: 'Error al obtener el detalle del disco.' });
  }
};
