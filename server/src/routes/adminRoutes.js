const router = require('express').Router();
const auth = require('../middleware/auth');
const { createRole, updateRole, deleteRole, createUser, updateUser, deleteUser, createItem, listItems, listRoles, listUsers } = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	}
});
const upload = multer({ storage });

router.post('/roles', auth('Admin'), createRole);
router.get('/roles', auth('Admin'), listRoles);
router.put('/roles/:id', auth('Admin'), updateRole);
router.delete('/roles/:id', auth('Admin'), deleteRole);
router.post('/roles/:id/delete', auth('Admin'), deleteRole);

router.post('/users', auth('Admin'), createUser);
router.get('/users', auth('Admin'), listUsers);
router.put('/users/:id', auth('Admin'), updateUser);
router.delete('/users/:id', auth('Admin'), deleteUser);
router.post('/users/:id/delete', auth('Admin'), deleteUser);
router.post('/items', auth('Admin'), (req, res, next) => {
	upload.single('image')(req, res, (err) => {
		if (err) return res.status(400).json({ message: err.message });
		next();
	});
}, createItem);
router.get('/items', auth('Admin'), listItems);
// Update item by uid (optionally accept image)
router.put('/items/:uid', auth('Admin'), (req, res, next) => {
	upload.single('image')(req, res, (err) => {
		if (err) return res.status(400).json({ message: err.message });
		next();
	});
}, require('../controllers/adminController').updateItem);
// Soft delete item by uid
router.delete('/items/:uid', auth('Admin'), require('../controllers/adminController').deleteItem);
// Fallback delete via POST for environments blocking DELETE
router.post('/items/:uid/delete', auth('Admin'), require('../controllers/adminController').deleteItem);

module.exports = router;
