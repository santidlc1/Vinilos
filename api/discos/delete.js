const pool = require('../lib/db');
const { authenticateRequest } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }

  try {
    const { id } = req.query || {};
    if (!id) {
      res.status(400).json({ error: 'Falta el id del disco.' });
      return;
    }

    await pool.query('DELETE FROM canciones WHERE id_disco = $1', [id]);
    await pool.query('DELETE FROM discos WHERE id_disco = $1', [id]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete disco error:', error);
    res.status(500).json({ error: 'No se pudo eliminar el disco.' });
  }
};
