import { Router } from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/', departmentController.getDepartments);

// Only admins can create or update departments
router.post('/', restrictTo('ADMIN'), departmentController.createDepartment);
router.patch('/:id', restrictTo('ADMIN'), departmentController.updateDepartment);

export default router;
