const { DataTypes } = require('sequelize');
const { sequelize } = require('./sequelize');
const Order = require('./Order');
const Item = require('./Item');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 }
}, { tableName: 'order_items', timestamps: false });

OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Item, { foreignKey: 'item_id' });

module.exports = OrderItem;
