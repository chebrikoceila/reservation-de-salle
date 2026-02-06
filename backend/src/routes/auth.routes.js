const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Routes publiques
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Routes pour tous utilisateurs connectés
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

// Routes admin
router.get('/admin/users', auth, authorize('admin'), authController.getAllUsers);
router.put('/users/:userId/role', auth, authorize('admin'), authController.updateUserRole);
router.post('/admin/create', authController.createAdmin); 
router.delete('/users/:userId', auth, authorize('admin'), authController.deleteUser);
module.exports = router;