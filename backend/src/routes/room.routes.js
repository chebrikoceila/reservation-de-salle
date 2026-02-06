const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { auth, authorize } = require('../middleware/auth');
const { uploadRoomImage } = require('../middleware/upload'); // CHANGÉ ICI

// Routes publiques
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

// Routes protégées 
router.post('/', 
  auth, 
  // authorize('owner', 'admin'),  
  uploadRoomImage,                
  // validateRoom,                 
  roomController.createRoom
);

router.put('/:id', 
  auth, 
  // authorize('owner', 'admin')
  // validateRoom            
  roomController.updateRoom
);

router.delete('/:id', 
  auth, 
  // authorize('owner', 'admin')
  roomController.deleteRoom
);

// Routes propriétaire
router.get('/owner/my-rooms', 
  auth, 
  // authorize('owner', 'admin')
  roomController.getOwnerRooms
);

router.get('/owner/stats', 
  auth, 
  // authorize('owner', 'admin')
  roomController.getOwnerStats
);

module.exports = router;