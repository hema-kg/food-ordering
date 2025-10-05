const { DataTypes } = require('sequelize');
const { sequelize } = require('./sequelize');

const Item = sequelize.define('Item', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING(255), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'items', timestamps: true, createdAt: 'createdOn', updatedAt: 'modifiedOn' });

module.exports = Item;
