const pool = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const query = `
      SELECT d.id_disco, d.titulo, d.anio_lanzamiento, d.url_portada, d.ubicacion_fisica,
             a.nombre AS artista_nombre, g.nombre AS genero_nombre
      FROM discos d
      LEFT JOIN artistas a ON d.id_artista = a.id_artista
      LEFT JOIN generos g ON d.id_genero = g.id_genero
      ORDER BY a.nombre ASC, d.titulo ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('API /api/discos error:', error);
    res.status(500).json({ error: 'Error al obtener los discos de la base de datos.' });
  }
};
