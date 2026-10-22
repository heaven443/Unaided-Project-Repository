const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public deal retrieval & search
router.get('/', dealController.getAllDeals);
router.get('/stats', dealController.getStats);
router.get('/:id', dealController.getDealById);

// Create deal (Requires authenticated, verified user)
router.post('/', authenticateToken, dealController.createDeal);

// Community upvote / verification (public)
router.post('/:id/upvote', dealController.upvoteDeal);

// Update / delete deal (requires authentication - checked for admin or owner in controller)
router.put('/:id', authenticateToken, dealController.updateDeal);
router.delete('/:id', authenticateToken, dealController.deleteDeal);

module.exports = router;
