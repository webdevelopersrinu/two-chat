const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/search', authenticate, userController.searchUsers);
router.get('/:userId', authenticate, userController.getUserById);
router.put('/profile', authenticate, userController.updateProfile);

module.exports = router;