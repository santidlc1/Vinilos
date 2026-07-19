const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS artistas (
        id_artista BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS generos (
        id_genero BIGSERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS discos (
        id_disco BIGSERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        anio_lanzamiento INT DEFAULT 0,
        url_portada TEXT,
        ubicacion_fisica VARCHAR(255) DEFAULT 'Administración',
        id_artista BIGINT,
        id_genero BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS canciones (
        id_cancion BIGSERIAL PRIMARY KEY,
        id_disco BIGINT REFERENCES discos(id_disco) ON DELETE CASCADE,
        nombre_cancion TEXT NOT NULL,
        numero_pista INT DEFAULT 1,
        duracion VARCHAR(20) DEFAULT '0:00',
        lado_o_disco VARCHAR(50) DEFAULT 'Lado A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initializeDatabase();

module.exports = pool;
