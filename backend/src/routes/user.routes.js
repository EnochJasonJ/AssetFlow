import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/', userController.getUsers);

// Only admins can update roles
router.patch('/:id/role', restrictTo('ADMIN'), userController.updateRole);

export default router;
