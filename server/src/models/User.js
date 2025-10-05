const { DataTypes } = require('sequelize');
const { sequelize } = require('./sequelize');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
  role_id: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'users', timestamps: true, createdAt: 'createdOn', updatedAt: 'modifiedOn' });

module.exports = User;
