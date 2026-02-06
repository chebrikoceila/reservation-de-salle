const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { auth, authorize } = require('../middleware/auth');
const { uploadRoomImage } = require('../middleware/upload'); 

// Routes publiques
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

// Routes protégées 
router.post('/', 
  auth, 
  uploadRoomImage,                                 
  roomController.createRoom
);

router.put('/:id', 
  auth,            
  roomController.updateRoom
);

router.delete('/:id', 
  auth, 
  roomController.deleteRoom
);

// Routes propriétaire
router.get('/owner/my-rooms', 
  auth, 
  roomController.getOwnerRooms
);

router.get('/owner/stats', 
  auth, 
  roomController.getOwnerStats
);

module.exports = router;