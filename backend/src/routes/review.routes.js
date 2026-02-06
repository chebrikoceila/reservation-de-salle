const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth, authorize } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

// Routes publiques
router.get('/room/:roomId', reviewController.getRoomReviews);

// Routes client
router.post('/', 
  auth, 
  authorize('client', 'admin'),
  validateReview,
  reviewController.createReview
);

router.get('/my-reviews', 
  auth, 
  authorize('client', 'admin'),
  reviewController.getClientReviews
);

// Routes propriétaire
router.get('/owner/reviews', 
  auth, 
  authorize('owner', 'admin'),
  reviewController.getOwnerReviews
);

module.exports = router;