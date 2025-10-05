const { DataTypes } = require('sequelize');
const { sequelize } = require('./sequelize');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('Placed', 'Cancelled', 'Completed'), defaultValue: 'Placed' },
  total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 }
}, { tableName: 'orders', timestamps: true, createdAt: 'createdOn', updatedAt: 'modifiedOn' });

Order.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Order;
