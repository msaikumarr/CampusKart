const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getSavedSearches, saveSearch, deleteSearch } = require('../controllers/SavedSearchController');

router.use(requireAuth);
router.get('/', getSavedSearches);
router.post('/', saveSearch);
router.delete('/:id', deleteSearch);

module.exports = router;