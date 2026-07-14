// server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend desde la carpeta "frontend"
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuración de la conexión a PostgreSQL (usa variables de entorno para producción)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Requerido para servicios en la nube como Render/Supabase
});

// Probar conexión a la base de datos al iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo cliente de la base de datos:', err.stack);
  }
  console.log('Conectado exitosamente a PostgreSQL');
  release();
});

// ================= API ENDPOINTS =================

// 1. Obtener todos los discos (para la pantalla principal)
app.get('/api/discos', async (req, res) => {
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
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los discos de la base de datos.' });
  }
});

// 2. Obtener el detalle de un disco específico junto con todas sus canciones
app.get('/api/discos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Obtener información del disco
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
      return res.status(404).json({ error: 'Disco no encontrado.' });
    }

    const disco = discoResult.rows[0];

    // Obtener las canciones de ese disco ordenadas por pista
    const cancionesQuery = `
      SELECT id_cancion, nombre_cancion, numero_pista, duracion, lado_o_disco
      FROM canciones
      WHERE id_disco = $1
      ORDER BY lado_o_disco ASC, numero_pista ASC;
    `;
    const cancionesResult = await pool.query(cancionesQuery, [id]);

    // Añadir el array de canciones al objeto del disco
    disco.canciones = cancionesResult.rows;

    res.json(disco);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el detalle del disco.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});