const express = require('express');
const upload = require('../middleware/upload');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeItemOwner = require('../middleware/authorizeItemOwner');

const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  searchItems
} = require('../controllers/ItemController');

const router = express.Router();

// Public routes
router.get('/', getItems);
router.get('/search', searchItems);
router.get('/:id', getItemById);

// Protected routes
router.post('/', authenticateUser, upload.single('image'), createItem);

// Update and Delete only allowed for item owner
router.put('/:id', authenticateUser, authorizeItemOwner, upload.single('image'), updateItem);
router.delete('/:id', authenticateUser, authorizeItemOwner, deleteItem);

module.exports = router;
