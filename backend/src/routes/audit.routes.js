import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', auditController.getAuditCycles);

// Admins and Asset Managers can manage audit cycles and log verifications
router.post('/', restrictTo('ADMIN', 'ASSET_MANAGER'), auditController.createAuditCycle);
router.post('/:id/verify', restrictTo('ADMIN', 'ASSET_MANAGER'), auditController.logAuditVerification);
router.patch('/:id/close', restrictTo('ADMIN', 'ASSET_MANAGER'), auditController.closeAuditCycle);

export default router;
