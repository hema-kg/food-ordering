const { sequelize } = require('../models/sequelize');
const { Item, Order, OrderItem } = require('../models/associations');

async function placeOrder(req, res) {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
  const { items } = req.body; // [{itemUid, quantity}]
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items' });

    // Decrypt UIDs to ids via SQL
    const uids = items.map(i => i.itemUid);
    const [dec] = await sequelize.query(
      `SELECT decryptId(?) AS id`, { replacements: [uids[0] || null] }
    );
    const ids = await Promise.all(uids.map(async (u)=> {
      const [r] = await sequelize.query('SELECT decryptId(?) AS id', { replacements: [u] });
      return r[0]?.id;
    }));
    const dbItems = await Item.findAll({ where: { id: ids } });
    const priceMap = new Map(dbItems.map(i => [i.id, parseFloat(i.price)]));

    let total = 0;
    for (const it of items) {
  const idx = uids.indexOf(it.itemUid);
  const id = ids[idx];
  const p = priceMap.get(id);
      if (p == null) throw new Error('Invalid item');
      total += p * (it.quantity || 1);
    }

    const order = await Order.create({ user_id: userId, total_amount: total }, { transaction: t });
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const id = ids[i];
      const price = priceMap.get(id);
      await OrderItem.create({ order_id: order.id, item_id: id, quantity: it.quantity || 1, price }, { transaction: t });
    }

    await t.commit();
    res.json({ orderId: order.id, total });
  } catch (e) {
    await t.rollback();
    res.status(400).json({ message: e.message });
  }
}

async function myOrders(req, res) {
  const orders = await Order.findAll({ where: { user_id: req.user.id }, order: [['id','DESC']], include: [{ model: OrderItem, include: [Item] }] });
  // enrich with encrypted uid just for reference and join item names
  for (const o of orders) {
    const [uid] = await sequelize.query('SELECT encryptId(?) AS uid', { replacements: [o.id] });
    o.dataValues.uid = uid[0]?.uid;
  }
  res.json(orders);
}

module.exports = { placeOrder, myOrders };
