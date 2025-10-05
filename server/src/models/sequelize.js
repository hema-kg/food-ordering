const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
});

async function ensureConnection() {
  try {
    await sequelize.authenticate();
    // Create DB if it doesn't exist (connect without db first)
  } catch (err) {
    console.error('DB connection error:', err.message);
    throw err;
  }
}

module.exports = { sequelize, ensureConnection };
