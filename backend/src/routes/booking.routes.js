const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { auth, authorize } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// Routes client
router.post('/', 
  auth, 
  authorize('client', 'admin'),
  validateBooking,
  bookingController.createBooking
);

router.get('/my-bookings', 
  auth, 
  authorize('client', 'admin'),
  bookingController.getClientBookings
);

router.put('/:id/cancel', 
  auth, 
  authorize('client', 'admin'),
  bookingController.cancelBooking
);

// Routes propriétaire
router.get('/owner/bookings', 
  auth, 
  authorize('owner', 'admin'),
  bookingController.getOwnerBookings
);

router.put('/:id/confirm', 
  auth, 
  authorize('owner', 'admin'),
  bookingController.confirmBooking
);

// Routes statistiques
router.get('/stats', 
  auth, 
  authorize('owner', 'admin'),
  bookingController.getBookingStats
);

// route pour refuser une reservation
router.put('/:id/reject', 
  auth, 
  authorize('owner', 'admin'),
  bookingController.rejectBooking
);

router.get('/all', auth, authorize('admin'), bookingController.getAllBookings);

module.exports = router;