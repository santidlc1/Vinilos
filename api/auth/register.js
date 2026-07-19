const pool = require('../lib/db');
const { createHash, signToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, nombre y contraseña son obligatorios.' });
      return;
    }

    const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length) {
      res.status(409).json({ error: 'El usuario ya existe.' });
      return;
    }

    const hash = createHash(password);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, email',
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id_usuario, email: user.email, name: user.nombre });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'No se pudo crear el usuario.' });
  }
};
