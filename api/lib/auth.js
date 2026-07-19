const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'vinilos-secret-key';

function createHash(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}

function authenticateRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return verifyToken(token);
}

module.exports = {
  createHash,
  comparePassword,
  signToken,
  verifyToken,
  authenticateRequest,
  SECRET
};
