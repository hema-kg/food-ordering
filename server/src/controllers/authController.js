const jwt = require('jsonwebtoken');
const { encrypt16Bit } = require('../utils/passCrypto');
const { User, Role } = require('../models/associations');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const hashed = encrypt16Bit(password);
    const user = await User.findOne({ where: { username, password: hashed }, include: [Role] });
    if (!user || user.status !== 'Active') return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.Role?.name || 'User' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return res.json({ token, user: { id: user.id, username: user.username, role: user.Role?.name || 'User', firstName: user.firstName, lastName: user.lastName } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = { login };
