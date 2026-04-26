const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware'); 

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlist);

module.exports = router;