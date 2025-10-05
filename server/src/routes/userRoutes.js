const router = require('express').Router();
const auth = require('../middleware/auth');
const { listItems } = require('../controllers/adminController');
const { placeOrder, myOrders } = require('../controllers/userController');

router.get('/items', auth(), listItems);
router.post('/orders', auth(), placeOrder);
router.get('/orders', auth(), myOrders);

module.exports = router;
