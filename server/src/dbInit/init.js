const mysql = require('mysql2/promise');
const { sequelize } = require('../models/sequelize');
const Role = require('../models/Role');
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
require('../models/associations');
const { encrypt16Bit } = require('../utils/passCrypto');

async function createDatabaseIfNotExists() {
  const base = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });
  await base.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await base.end();
}

async function createSqlFunctions(queryInterface) {
  // Create encryptId/decryptId user-defined functions similar to CMS style
  const knex = sequelize; // use sequelize.query
  // Drop existing then create minimal functions
  await knex.query("DROP FUNCTION IF EXISTS encryptId;");
  await knex.query("DROP FUNCTION IF EXISTS decryptId;");
  // Simple reversible hex mapping for demo; replace with stronger in production
  await knex.query(`
    CREATE FUNCTION encryptId(n INT) RETURNS VARCHAR(32)
    DETERMINISTIC
    RETURN UPPER(LPAD(HEX(n + 1000), 16, '0'));
  `);
  await knex.query(`
    CREATE FUNCTION decryptId(s VARCHAR(32)) RETURNS INT
    DETERMINISTIC
    RETURN CONVERT(CONV(s, 16, 10), UNSIGNED) - 1000;
  `);
}

async function syncModels() {
  await sequelize.sync({ alter: true });
}

async function seedDefaults() {
  const [adminRole] = await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { name: 'Admin' } });
  const [userRole] = await Role.findOrCreate({ where: { name: 'User' }, defaults: { name: 'User' } });

  const [admin] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', phone: '9999999999',
      password: encrypt16Bit('Admin@123'), status: 'Active', role_id: adminRole.id
    }
  });

  const items = [
    { name: 'Idly', price: 10 },
    { name: 'Dosa', price: 40 },
    { name: 'Vada', price: 20 },
    { name: 'Pongal', price: 35 }
  ];
  for (const it of items) {
    await Item.findOrCreate({ where: { name: it.name }, defaults: it });
  }
}

async function initializeDatabase() {
  await createDatabaseIfNotExists();
  try {
    await createSqlFunctions();
  } catch (e) {
    console.warn('WARN: Skipping DB UDF creation (encryptId/decryptId):', e.message);
  }
  await cleanupDuplicateUserIndexes();
  await syncModels();
  await seedDefaults();
}

// Drop duplicate single-column unique indexes on users to prevent "Too many keys" during alter
async function cleanupDuplicateUserIndexes() {
  try {
  // Ensure table exists before attempting cleanup
  const [tables] = await sequelize.query("SHOW TABLES LIKE 'users'");
  if (!tables || tables.length === 0) return; // users table not created yet
  const [idx] = await sequelize.query('SHOW INDEX FROM `users`');
    // Group by Key_name to get column lists
    const byKey = new Map();
    for (const r of idx) {
      if (!byKey.has(r.Key_name)) byKey.set(r.Key_name, { nonUnique: r.Non_unique, cols: [] });
      byKey.get(r.Key_name).cols.push(r.Column_name);
    }
    const targetCols = new Set(['username', 'email', 'phone']);
    const keepByCol = new Set();
    const toDrop = [];
    // Determine which unique single-column indexes to drop (keep only one per column)
    for (const [keyName, info] of byKey.entries()) {
      const isUnique = String(info.nonUnique) === '0';
      if (!isUnique) continue;
      if (info.cols.length !== 1) continue; // skip composite
      const col = info.cols[0];
      if (!targetCols.has(col)) continue;
      if (keepByCol.has(col)) {
        if (keyName !== 'PRIMARY') toDrop.push(keyName);
      } else {
        keepByCol.add(col);
      }
    }
    for (const keyName of toDrop) {
      try {
        await sequelize.query('ALTER TABLE `users` DROP INDEX `' + keyName + '`');
        console.warn('Dropped duplicate index on users:', keyName);
      } catch (e) {
        console.warn('Skip dropping index', keyName, e.message);
      }
    }
  } catch (e) {
    console.warn('Index cleanup skipped:', e.message);
  }
}

module.exports = { initializeDatabase };
