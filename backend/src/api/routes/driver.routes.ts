
import { Router } from 'express';
import { startTrip, endTrip } from '../controllers/driver.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireDriver } from '../middlewares/role.middleware';

const router = Router();

router.post('/start-trip', [verifyToken, requireDriver], startTrip);
router.post('/end-trip', [verifyToken, requireDriver], endTrip);

export default router;