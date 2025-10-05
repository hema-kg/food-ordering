const User = require('./User');
const Role = require('./Role');
const Item = require('./Item');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

Order.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Order, { foreignKey: 'user_id' });

OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id' });

OrderItem.belongsTo(Item, { foreignKey: 'item_id' });
Item.hasMany(OrderItem, { foreignKey: 'item_id' });

module.exports = { User, Role, Item, Order, OrderItem };
