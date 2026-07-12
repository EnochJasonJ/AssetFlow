import { Router } from 'express';
import * as assetController from '../controllers/asset.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', assetController.getAssets);
router.get('/:id/history', assetController.getAssetHistory);

// Only Asset Managers (or Admins) can register assets
router.post('/', restrictTo('ADMIN', 'ASSET_MANAGER'), assetController.registerAsset);

export default router;
