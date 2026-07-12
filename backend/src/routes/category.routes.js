import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/', categoryController.getCategories);

// Only admins can create or update categories
router.post('/', restrictTo('ADMIN'), categoryController.createCategory);
router.patch('/:id', restrictTo('ADMIN'), categoryController.updateCategory);

export default router;
