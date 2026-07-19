const { signToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
      return;
    }

    const validUser = username.trim() === 'Cristian de la Carrera';
    const validPassword = password === 'VinilosDLC';

    if (!validUser || !validPassword) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    const token = signToken({ username, role: 'admin' });
    res.status(200).json({ user: { username, role: 'admin' }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
};
