const { sequelize } = require('../models/sequelize');
const { Role, User, Item } = require('../models/associations');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const { encrypt16Bit } = require('../utils/passCrypto');

async function createRole(req, res) {
  try {
    const role = await Role.create({ name: req.body.name });
    res.json(role);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

async function updateRole(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const name = (req.body?.name || '').trim();
    if (!id || !name) return res.status(400).json({ message: 'Invalid role or name' });
    const [count] = await Role.update({ name }, { where: { id } });
    if (!count) return res.status(404).json({ message: 'Role not found' });
    const role = await Role.findByPk(id);
    res.json(role);
  } catch (e) {
    if (e?.parent?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Role name already exists' });
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function deleteRole(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid role id' });
    const cnt = await User.count({ where: { role_id: id } });
    if (cnt > 0) return res.status(400).json({ message: 'Role has users and cannot be deleted' });
    const count = await Role.destroy({ where: { id } });
    if (!count) return res.status(404).json({ message: 'Role not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function createUser(req, res) {
  try {
    const { username, firstName, lastName, email, phone, password, roleName } = req.body;
    const role = await Role.findOne({ where: { name: roleName || 'User' } });
    if (!role) return res.status(400).json({ message: 'Role not found' });
    const user = await User.create({ username, firstName, lastName, email, phone, password: encrypt16Bit(password), role_id: role.id });
    res.json({ id: user.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
}

async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid user id' });
    const { firstName, lastName, email, phone, roleName, status, password } = req.body || {};

    const values = {};
    if (firstName !== undefined) values.firstName = firstName;
    if (lastName !== undefined) values.lastName = lastName;
    if (email !== undefined) values.email = email;
    if (phone !== undefined) values.phone = phone;
    if (status !== undefined) values.status = status;
    if (password) values.password = encrypt16Bit(password);
    if (roleName) {
      const role = await Role.findOne({ where: { name: roleName } });
      if (!role) return res.status(400).json({ message: 'Role not found' });
      values.role_id = role.id;
    }
    const [count] = await User.update(values, { where: { id } });
    if (!count) return res.status(404).json({ message: 'User not found' });
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] }, include: [{ model: Role, attributes: ['name'] }] });
    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.Role?.name || null,
      createdOn: user.get('createdOn')
    });
  } catch (e) {
    if (e?.parent?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email or phone already exists' });
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid user id' });
    const [count] = await User.update({ status: 'Inactive' }, { where: { id } });
    if (!count) return res.status(404).json({ message: 'User not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function createItem(req, res) {
  try {
    console.log('DEBUG req.body:', req.body);
    console.log('DEBUG req.file:', req.file);
    const name = (req.body?.name || '').trim();
    const priceRaw = req.body?.price;
    const price = priceRaw === undefined || priceRaw === '' ? 0 : parseFloat(priceRaw);

  if (!name) return res.status(400).json({ message: 'Name is required' });
  if (Number.isNaN(price)) return res.status(400).json({ message: 'Price is invalid' });
  if (price < 0) return res.status(400).json({ message: 'Price cannot be negative' });

    const values = { name, price };
    if (req.file && Item.rawAttributes && Object.prototype.hasOwnProperty.call(Item.rawAttributes, 'image')) {
      const publicPath = '/uploads/' + req.file.filename;
      const base = process.env.PUBLIC_URL || process.env.SERVER_PUBLIC_URL || '';
      values.image = base ? base.replace(/\/$/, '') + publicPath : publicPath;
    }

    const item = await Item.create(values);
    res.json(item);
  } catch (e) {
    console.error('DEBUG error:', e);
    if (e instanceof UniqueConstraintError || e?.parent?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Item name already exists' });
    }
    if (e instanceof ValidationError) {
      return res.status(400).json({ message: e.errors?.[0]?.message || 'Validation error' });
    }
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function listItems(req, res) {
  const page = Number.parseInt(req.query.page, 10);
  const pageSize = Number.parseInt(req.query.pageSize, 10);
  const usePaging = Number.isInteger(page) && page > 0 && Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 200;
  const limit = usePaging ? pageSize : undefined;
  const offset = usePaging ? (page - 1) * pageSize : undefined;

  try {
    // Prefer encrypted uid if function exists
    let sql = "SELECT encryptId(id) AS uid, name, price, image FROM items WHERE is_active = 1 ORDER BY createdOn DESC";
    if (usePaging) sql += ` LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await sequelize.query(sql);

    if (!usePaging) return res.json(rows);
    const [[{ cnt }]] = await sequelize.query("SELECT COUNT(*) AS cnt FROM items WHERE is_active = 1");
    return res.json({ data: rows, total: Number(cnt), page, pageSize });
  } catch (e) {
    console.warn('WARN: encryptId() missing; falling back to raw id');
    let sql = "SELECT id AS uid, name, price, image FROM items WHERE is_active = 1 ORDER BY createdOn DESC";
    if (usePaging) sql += ` LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await sequelize.query(sql);
    if (!usePaging) return res.json(rows);
    const [[{ cnt }]] = await sequelize.query("SELECT COUNT(*) AS cnt FROM items WHERE is_active = 1");
    return res.json({ data: rows, total: Number(cnt), page, pageSize });
  }
}

async function listRoles(req, res) {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    res.json(roles);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

async function listUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Role, attributes: ['name'] }],
      order: [['createdOn', 'DESC']]
    });
    const data = users.map(u => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      role: u.Role?.name || null,
      createdOn: u.get('createdOn')
    }));
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

async function resolveIdFromUid(uid) {
  // Try DB function decryptId; fallback to numeric if already numeric
  try {
    const [[row]] = await sequelize.query('SELECT decryptId(?) AS id', { replacements: [uid] });
    return row?.id || null;
  } catch (e) {
    const n = parseInt(uid, 10);
    return Number.isFinite(n) ? n : null;
  }
}

async function updateItem(req, res) {
  try {
    const id = await resolveIdFromUid(req.params.uid);
    if (!id) return res.status(400).json({ message: 'Invalid item id' });
    const name = (req.body?.name ?? '').toString().trim();
    const priceRaw = req.body?.price;
    const price = priceRaw === undefined || priceRaw === '' ? undefined : parseFloat(priceRaw);
    const values = {};
    if (name) values.name = name;
    if (price !== undefined) {
      if (Number.isNaN(price) || price < 0) return res.status(400).json({ message: 'Price is invalid' });
      values.price = price;
    }
    if (req.file && Item.rawAttributes && Object.prototype.hasOwnProperty.call(Item.rawAttributes, 'image')) {
      const publicPath = '/uploads/' + req.file.filename;
      const base = process.env.PUBLIC_URL || process.env.SERVER_PUBLIC_URL || '';
      values.image = base ? base.replace(/\/$/, '') + publicPath : publicPath;
    }
    const [count] = await Item.update(values, { where: { id } });
    if (!count) return res.status(404).json({ message: 'Item not found' });
    const item = await Item.findByPk(id, { attributes: ['id','name','price','image','is_active','createdOn','modifiedOn'] });
    res.json(item);
  } catch (e) {
    console.error('updateItem error:', e);
    if (e?.parent?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Item name already exists' });
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

async function deleteItem(req, res) {
  try {
  console.log('deleteItem called with uid:', req.params.uid)
    const id = await resolveIdFromUid(req.params.uid);
    if (!id) return res.status(400).json({ message: 'Invalid item id' });
    const [count] = await Item.update({ is_active: false }, { where: { id } });
    if (!count) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteItem error:', e);
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
}

module.exports = { createRole, updateRole, deleteRole, createUser, updateUser, deleteUser, createItem, listItems, listRoles, listUsers, updateItem, deleteItem };
